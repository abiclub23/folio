// Shared canvas drawing for the games: night scenery, particles, and small helpers
export const FONT = 'Barlow, system-ui, sans-serif'

// Deterministic scenery
export function hash(i) {
  const r = Math.sin(i * 12.9898) * 43758.5453
  return r - Math.floor(r)
}
export const STARS = Array.from({ length: 110 }, (_, i) => ({ x: hash(i + 7), y: hash(i + 300), r: 0.6 + hash(i + 600) * 1.2 }))

export function lerp(a, b, t) { return a + (b - a) * t }
export function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

// White exhaust glow, drawn once and reused for every thrust particle
let glow = null
function glowSprite() {
  if (glow) return glow
  glow = document.createElement('canvas')
  glow.width = glow.height = 64
  const g = glow.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.45, 'rgba(235,238,244,0.6)')
  grad.addColorStop(1, 'rgba(220,224,232,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return glow
}

// Rolling mountain silhouette in screen space, scrolled by parallax offset
function drawRange(ctx, W, base, offset, amp, color, seed) {
  if (base - amp > ctx.canvas.height) return
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, base + 2)
  for (let x = 0; x <= W + 8; x += 8) {
    const u = x + offset
    const n = Math.sin(u * 0.004 + seed) * 0.45 + Math.sin(u * 0.011 + seed * 2.1) * 0.3 + Math.sin(u * 0.027 + seed * 3.7) * 0.15
    ctx.lineTo(x, base - amp * (0.55 + n * 0.5))
  }
  ctx.lineTo(W, base + 2)
  ctx.closePath()
  ctx.fill()
}

// Night sky with stars. space (0–1) fades it to black and brings Earth's blue edge up from below.
export function drawNightSky(ctx, W, H, cam, S, space = 0) {
  const fade = (hex) => {
    const n = parseInt(hex.slice(1), 16)
    const k = 1 - space
    return `rgb(${Math.round((n >> 16) * k)},${Math.round(((n >> 8) & 255) * k)},${Math.round((n & 255) * k)})`
  }
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, fade('#04060b'))
  sky.addColorStop(0.75, fade('#0b1020'))
  sky.addColorStop(1, fade('#1a2133'))
  ctx.fillStyle = sky
  ctx.fillRect(-20, -20, W + 40, H + 40)

  ctx.fillStyle = `rgba(255,255,255,${0.75 + space * 0.25})`
  for (const s of STARS) {
    const x = (((s.x * W - cam.left * S * 0.02) % W) + W) % W
    ctx.beginPath()
    ctx.arc(x, s.y * H * 0.85, s.r * (0.8 + space * 0.5), 0, Math.PI * 2)
    ctx.fill()
  }

  // Earth's blue edge curving up from below, up in space
  if (space > 0) {
    const R = Math.max(W, H) * 2.2
    const cx = W / 2, cy = H + R - H * 0.18 * space
    const limb = ctx.createRadialGradient(cx, cy, R - 40, cx, cy, R + 30)
    limb.addColorStop(0, `rgba(30,90,200,${0.9 * space})`)
    limb.addColorStop(0.55, `rgba(120,190,255,${0.8 * space})`)
    limb.addColorStop(1, 'rgba(120,190,255,0)')
    ctx.fillStyle = limb
    ctx.beginPath()
    ctx.arc(cx, cy, R + 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(14,40,90,${space})`
    ctx.beginPath()
    ctx.arc(cx, cy, R - 30, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Two layers of distant hills that scroll slower than the ground; gy is the ground's row on screen
export function drawHills(ctx, W, H, cam, S, gy, colors = ['#0e1420', '#0a0e16']) {
  const horizon = gy > H ? H + (gy - H) * 0.3 : gy

  // Distant hills in silhouette
  drawRange(ctx, W, horizon, cam.left * S * 0.06, H * 0.2, colors[0], 1.3)
  drawRange(ctx, W, horizon, cam.left * S * 0.16, H * 0.1, colors[1], 4.2)
}

// Dark ground from row gy to the bottom of the screen
export function drawGroundFill(ctx, W, H, gy) {
  const ground = ctx.createLinearGradient(0, gy, 0, H)
  ground.addColorStop(0, '#15171c')
  ground.addColorStop(1, '#07080a')
  ctx.fillStyle = ground
  ctx.fillRect(-20, gy, W + 40, H - gy + 20)
}

// White streaks flying past at speed; dir is the direction of travel in radians
export function drawStreaks(ctx, W, H, t, speed, dir) {
  const a = Math.min(0.35, (speed - 30) / 100)
  const len = Math.min(120, speed * 1.5)
  ctx.strokeStyle = `rgba(255,255,255,${a})`
  ctx.lineWidth = 1.5
  for (let i = 0; i < 14; i++) {
    const px = (hash(i) * W * 1.4 - ((t * speed * 9 + i * 97) % (W * 1.4)) + W * 1.4) % (W * 1.4) - W * 0.2
    const py = hash(i + 50) * H
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px - Math.cos(dir) * len, py + Math.sin(dir) * len)
    ctx.stroke()
  }
}

// Particles: solid ones first, then glowing ones added on top
export function drawParticles(ctx, particles, sx, sy, S) {
  for (const p of particles) {
    if (p.kind === 'flame' || p.kind === 'fire') continue
    const a = Math.max(0, p.life / p.max)
    const r = Math.max(1.5, p.size * S)
    if (p.kind === 'smoke' || p.kind === 'dust' || p.kind === 'soot') {
      ctx.fillStyle = p.kind === 'dust' ? `rgba(160,140,110,${a * 0.5})` : p.kind === 'soot' ? `rgba(70,66,64,${a * 0.6})` : `rgba(238,240,244,${a * 0.45})`
      ctx.beginPath()
      ctx.arc(sx(p.x), sy(p.y), r * (2 - a), 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.globalAlpha = Math.min(1, a * 2)
      ctx.fillStyle = p.color
      ctx.fillRect(sx(p.x) - r / 2, sy(p.y) - r / 2, r, r * (p.kind === 'confetti' ? 0.6 : 1))
      ctx.globalAlpha = 1
    }
  }
  ctx.globalCompositeOperation = 'lighter'
  for (const p of particles) {
    if (p.kind !== 'flame' && p.kind !== 'fire') continue
    const a = Math.max(0, p.life / p.max)
    const r = Math.max(2, p.size * S * (p.kind === 'fire' ? 1.6 : 1))
    if (p.kind === 'flame') {
      // Thrust exhaust is the most common particle, so stamp a pre-drawn glow instead of building a gradient
      ctx.globalAlpha = a
      ctx.drawImage(glowSprite(), sx(p.x) - r, sy(p.y) - r, r * 2, r * 2)
      ctx.globalAlpha = 1
      continue
    }
    const g = ctx.createRadialGradient(sx(p.x), sy(p.y), 0, sx(p.x), sy(p.y), r)
    g.addColorStop(0, `rgba(255,240,200,${a})`)
    g.addColorStop(0.4, `rgba(255,${Math.round(110 + 90 * a)},40,${a * 0.8})`)
    g.addColorStop(1, 'rgba(255,60,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(sx(p.x), sy(p.y), r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
}

// Cinema bars at the top and bottom during slow motion
export function drawLetterbox(ctx, W, H) {
  const bar = Math.round(H * 0.07)
  ctx.fillStyle = 'rgba(0,0,0,0.85)'
  ctx.fillRect(0, 0, W, bar)
  ctx.fillRect(0, H - bar, W, bar)
}
