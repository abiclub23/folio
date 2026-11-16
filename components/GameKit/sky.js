// Physically based sky for the canvas games, drawn on the GPU with WebGL.
// Each pixel traces a ray through the atmosphere and adds up sunlight scattered by air (Rayleigh: the blue sky,
// the warm horizon) and by haze (Mie: the bright glow around the sun), then lays soft drifting clouds on top.
// The result goes onto a hidden WebGL canvas that the game copies into its own 2D canvas.
//
// The camera stands on the ground looking out horizontally; the horizon sits at a given screen row.
// Returns false where WebGL isn't available so the caller can fall back to a plain gradient.

// Morning sun: low over the Gulf, off to the left of the view
export const SUN = { elevation: 0.116, azimuth: -0.5 }

// Vertical field of view: pixels per unit of tan(angle) is FOCAL × screen height
const FOCAL = 1.2

// Where the sun sits on screen for a view of height H with the horizon at row `horizon`
export function sunOnScreen(W, H, horizon) {
  const f = FOCAL * H
  return { x: W / 2 + f * Math.tan(SUN.azimuth), y: horizon - f * Math.tan(SUN.elevation) }
}

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`

// Single scattering after the well-known glsl-atmosphere approach: 16 steps along the view ray,
// 8 toward the sun at each step. Distances in meters, Earth-sized planet.
const FRAG = `
precision highp float;
uniform vec2 uSize;      // output size in pixels
uniform float uHorizon;  // horizon row, pixels from the top
uniform float uFocal;    // pixels per unit tan(angle)
uniform vec3 uSun;       // direction to the sun
uniform float uTime;     // seconds, for cloud drift

#define PI 3.141592
#define RPLANET 6371e3
#define RATMOS 6471e3

vec2 rsi(vec3 r0, vec3 rd, float sr) {
  float a = dot(rd, rd);
  float b = 2.0 * dot(rd, r0);
  float c = dot(r0, r0) - sr * sr;
  float d = b * b - 4.0 * a * c;
  if (d < 0.0) return vec2(1e5, -1e5);
  return vec2((-b - sqrt(d)) / (2.0 * a), (-b + sqrt(d)) / (2.0 * a));
}

vec3 atmosphere(vec3 r, vec3 r0, vec3 pSun) {
  const vec3 kRlh = vec3(5.5e-6, 13.0e-6, 22.4e-6);
  const float kMie = 21e-6;
  const float shRlh = 8e3;
  const float shMie = 1.2e3;
  const float g = 0.758;
  const float iSun = 22.0;
  vec2 p = rsi(r0, r, RATMOS);
  if (p.x > p.y) return vec3(0.0);
  p.y = min(p.y, rsi(r0, r, RPLANET).x);
  float iStep = (p.y - p.x) / 16.0;
  float iTime = 0.0;
  vec3 totalRlh = vec3(0.0);
  vec3 totalMie = vec3(0.0);
  float iOdRlh = 0.0;
  float iOdMie = 0.0;
  float mu = dot(r, pSun);
  float mumu = mu * mu;
  float gg = g * g;
  float pRlh = 3.0 / (16.0 * PI) * (1.0 + mumu);
  float pMie = 3.0 / (8.0 * PI) * ((1.0 - gg) * (mumu + 1.0)) / (pow(1.0 + gg - 2.0 * mu * g, 1.5) * (2.0 + gg));
  for (int i = 0; i < 16; i++) {
    vec3 iPos = r0 + r * (iTime + iStep * 0.5);
    float iHeight = length(iPos) - RPLANET;
    float odStepRlh = exp(-iHeight / shRlh) * iStep;
    float odStepMie = exp(-iHeight / shMie) * iStep;
    iOdRlh += odStepRlh;
    iOdMie += odStepMie;
    float jStep = rsi(iPos, pSun, RATMOS).y / 8.0;
    float jTime = 0.0;
    float jOdRlh = 0.0;
    float jOdMie = 0.0;
    for (int j = 0; j < 8; j++) {
      vec3 jPos = iPos + pSun * (jTime + jStep * 0.5);
      float jHeight = length(jPos) - RPLANET;
      jOdRlh += exp(-jHeight / shRlh) * jStep;
      jOdMie += exp(-jHeight / shMie) * jStep;
      jTime += jStep;
    }
    vec3 attn = exp(-(kMie * (iOdMie + jOdMie) + kRlh * (iOdRlh + jOdRlh)));
    totalRlh += odStepRlh * attn;
    totalMie += odStepMie * attn;
    iTime += iStep;
  }
  return iSun * (pRlh * kRlh * totalRlh + pMie * kMie * totalMie);
}

// Sunlight reaching a point after passing through the air (warmer and dimmer when the sun is low)
vec3 sunColor(vec3 pSun) {
  const vec3 kRlh = vec3(5.5e-6, 13.0e-6, 22.4e-6);
  float air = 8e3 / max(pSun.y + 0.15, 0.05);
  return exp(-kRlh * air * 0.9) * 1.6;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main() {
  // Pixel → view ray (y up), with the horizon at uHorizon
  vec2 frag = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  float tx = (frag.x - uSize.x * 0.5) / uFocal;
  float ty = (uHorizon - frag.y) / uFocal;
  vec3 dir = normalize(vec3(tx, ty, 1.0));
  dir.y = max(dir.y, 0.002); // below the horizon, show the horizon haze (the game draws the ground over it)
  dir = normalize(dir);

  vec3 col = atmosphere(dir, vec3(0.0, RPLANET + 2.0, 0.0), uSun);

  // Sun disk with a little limb darkening
  float sd = dot(dir, uSun);
  float disk = smoothstep(0.9995, 0.9998, sd);
  col += disk * sunColor(uSun) * 18.0;

  // Clouds: a thin layer 1.5 km up, lit from the sun side, fading out toward the horizon
  if (dir.y > 0.0) {
    vec2 uv = dir.xz / dir.y * 1500.0 / 2600.0 + vec2(uTime * 0.006, uTime * 0.002);
    float d = fbm(uv * 1.3);
    d = smoothstep(0.52, 0.85, d) * 0.85;
    float fade = smoothstep(0.0, 0.18, dir.y);
    float lit = 0.55 + 0.45 * clamp(dot(normalize(vec3(uSun.x, 0.0, uSun.z)), normalize(vec3(dir.x, 0.0, dir.z))), 0.0, 1.0);
    vec3 cloud = sunColor(uSun) * (0.55 + 0.6 * lit) + vec3(0.18, 0.22, 0.3);
    col = mix(col, cloud, d * fade);
  }

  // Exposure, a touch more color (cameras punch up the blue), and gamma
  col = 1.0 - exp(-1.7 * col);
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = clamp(mix(vec3(lum), col, 1.35), 0.0, 1.0);
  col = pow(col, vec3(1.0 / 2.2));
  // Gentle dither to avoid banding in the gradients
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`

let gl = null
let canvas = null
let uni = null
let failed = false

function setup() {
  if (failed || typeof document === 'undefined') return false
  if (gl) return true
  canvas = document.createElement('canvas')
  gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true })
  if (!gl) return !(failed = true)
  const compile = (type, src) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
    return s
  }
  try {
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    uni = {}
    for (const n of ['uSize', 'uHorizon', 'uFocal', 'uSun', 'uTime']) uni[n] = gl.getUniformLocation(prog, n)
  } catch (e) {
    gl = null
    failed = true
    return false
  }
  return true
}

// Draws the sky into ctx over a W×H area with the horizon at row `horizon`.
// The sky is rendered at reduced resolution (it's all soft gradients) and scaled up.
// The game draws two views a frame (main camera and tower cam), so the hidden canvas only ever grows and each view
// uses its bottom-left corner: resizing it every frame would reallocate the GPU buffer twice a frame.
export function drawPhysicalSky(ctx, W, H, horizon, t) {
  if (!setup()) return false
  const scale = W > 700 ? 0.4 : 0.5
  const w = Math.max(16, Math.round(W * scale)), h = Math.max(16, Math.round(H * scale))
  if (canvas.width < w || canvas.height < h) {
    canvas.width = Math.max(canvas.width, w)
    canvas.height = Math.max(canvas.height, h)
  }
  gl.viewport(0, 0, w, h)
  const el = SUN.elevation, az = SUN.azimuth
  gl.uniform2f(uni.uSize, w, h)
  gl.uniform1f(uni.uHorizon, horizon * scale)
  gl.uniform1f(uni.uFocal, FOCAL * H * scale)
  gl.uniform3f(uni.uSun, Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az))
  gl.uniform1f(uni.uTime, t)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  // The viewport starts at the canvas's bottom-left, which is row (height - h) from the top
  ctx.drawImage(canvas, 0, canvas.height - h, w, h, 0, 0, W, H)
  return true
}
