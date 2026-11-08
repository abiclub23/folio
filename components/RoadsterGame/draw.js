// Roadster Launch drawing: camera, scene, car, driver and HUD on a 2D canvas. Reads game state, never changes it
// except for the camera.
import {
  CAR_H, CAR_L, FT, JETS, MPH, RAMP_END, RAMP_R, SAFE_TILT, SAFE_VY, SPACE_ALT, TOWER_H, TOWER_W, WHEEL_R,
  canRestart, crashCardReady, jetDirs, landingGrade, slowMo, wrapAngle,
} from './physics'

const FONT = 'Barlow, system-ui, sans-serif'

// Deterministic scenery
function hash(i) {
  const r = Math.sin(i * 12.9898) * 43758.5453
  return r - Math.floor(r)
}
const STARS = Array.from({ length: 110 }, (_, i) => ({ x: hash(i + 7), y: hash(i + 300), r: 0.6 + hash(i + 600) * 1.2 }))

function lerp(a, b, t) { return a + (b - a) * t }
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

export function updateCamera(game, W, H, dt) {
  // After a crash, follow the ejected driver
  const car = game.driver ? { x: game.driver.x, y: game.driver.y, vx: game.driver.vx } : game.car
  const parked = game.phase === 'ready'
  const span = game.track.towerX + TOWER_W + 10
  const slow = slowMo(game)
  const targetViewH = parked
    ? Math.max(TOWER_H * 1.35, (span * H) / W)
    : slow
      ? 20
      : game.driver
        ? Math.max(26, game.driver.y * 1.3 + 16)
      : Math.min(170, Math.max(40, car.y * 1.3 + 25))
  const cam = game.cam || { viewH: targetViewH, left: 0, bottom: -6 }
  const k = Math.min(1, dt * 3)
  cam.viewH = lerp(cam.viewH, targetViewH, k)
  const scale = H / cam.viewH
  const viewW = W / scale
  // Keep more room ahead of the car once it is flying back the other way
  const backwards = car.vx < -1 && game.phase !== 'ramp'
  const targetLeft = parked ? -4 : car.x - viewW * (slow ? 0.5 : backwards ? 0.62 : 0.35)
  const targetBottom = car.y < cam.viewH * 0.6 ? -cam.viewH * 0.1 : car.y - cam.viewH * 0.6
  cam.left = game.cam ? lerp(cam.left, targetLeft, Math.min(1, dt * 6)) : targetLeft
  cam.bottom = game.cam ? lerp(cam.bottom, targetBottom, Math.min(1, dt * 6)) : targetBottom
  cam.scale = scale
  game.cam = cam
  return cam
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

export function render(ctx, game, W, H, input) {
  const { runway, towerX } = game.track
  const cam = game.cam
  const S = cam.scale
  const sx = (x) => (x - cam.left) * S
  const sy = (y) => H - (y - cam.bottom) * S
  const car = game.car

  ctx.save()
  if (game.phase === 'crashed') {
    const k = Math.max(0, 1 - (game.t - game.endedAt) / 0.5)
    ctx.translate((Math.random() - 0.5) * 14 * k, (Math.random() - 0.5) * 14 * k)
  }

  // Night sky, like the demo; it fades to pure black on the way to space
  const space = Math.min(1, Math.max(0, (car.y - 120) / (SPACE_ALT - 120)))
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

  const gy = sy(0)
  const horizon = gy > H ? H + (gy - H) * 0.3 : gy

  // Distant hills in silhouette
  drawRange(ctx, W, horizon, cam.left * S * 0.06, H * 0.2, '#0e1420', 1.3)
  drawRange(ctx, W, horizon, cam.left * S * 0.16, H * 0.1, '#0a0e16', 4.2)

  // Ground
  if (gy < H) {
    const ground = ctx.createLinearGradient(0, gy, 0, H)
    ground.addColorStop(0, '#15171c')
    ground.addColorStop(1, '#07080a')
    ctx.fillStyle = ground
    ctx.fillRect(-20, gy, W + 40, H - gy + 20)

    // Runway with dashed center line and a checkered start line
    const band = Math.max(4, 1.4 * S)
    ctx.fillStyle = '#1d2026'
    ctx.fillRect(sx(-40), gy, (runway + 40) * S, band)
    ctx.fillStyle = '#4b5058'
    for (let x = -36; x < runway - 2; x += 6) ctx.fillRect(sx(x), gy + band * 0.45, 3 * S, Math.max(1, band * 0.1))
    const sq = Math.max(2, 0.35 * S)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j * sq < band; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#111' : '#f8fafc'
        ctx.fillRect(sx(1.5) + i * sq, gy + j * sq, sq, Math.min(sq, band - j * sq))
      }
    }

    // Red light strip along the runway
    ctx.save()
    ctx.shadowColor = '#ff2020'
    ctx.shadowBlur = 14
    ctx.strokeStyle = '#ff3030'
    ctx.lineWidth = Math.max(2, 0.18 * S)
    ctx.beginPath()
    ctx.moveTo(sx(-40), gy + 1)
    ctx.lineTo(sx(runway - 1), gy + 1)
    ctx.stroke()
    ctx.restore()

    // Floodlights at the foot of the ramp
    for (const fx of [runway - 4, towerX + TOWER_W + 3]) {
      const lx = sx(fx), r = Math.max(14, 3.5 * S)
      const g = ctx.createRadialGradient(lx, gy, 0, lx, gy, r)
      g.addColorStop(0, 'rgba(255,255,255,0.2)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(lx - r, gy - r, r * 2, r * 2)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(lx, gy - 2, Math.max(2, 0.25 * S), 0, Math.PI * 2)
      ctx.fill()
    }

    // Distance markers, measured from the foot of the ramp
    ctx.font = `600 11px ${FONT}`
    ctx.textAlign = 'center'
    const k0 = Math.floor((cam.left - runway) / 25), k1 = Math.ceil((cam.left + W / S - runway) / 25)
    for (let k = k0; k <= k1; k++) {
      const d = k * 25
      if (k === 0 || (d > 0 && d < towerX + TOWER_W + 3 - runway)) continue
      const x = sx(runway + d)
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(x - 1, gy - 8, 2, 8)
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(x - 1, gy - 8, 2, 3)
      if (S * 25 > 40) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.fillText(`${Math.round(Math.abs(d) * FT)} ft`, x, gy + 16)
      }
    }
  }

  drawRamp(ctx, game.track, sx, sy, S)

  // Car shadow on the ground
  if (gy < H + 20 && game.phase !== 'crashed') {
    const k = 1 / (1 + Math.max(0, car.y) / 12)
    ctx.fillStyle = `rgba(0,0,0,${0.35 * k})`
    ctx.beginPath()
    ctx.ellipse(sx(car.x), gy + 1, Math.max(14, CAR_L * S * 0.55) * k, Math.max(2, 0.25 * S) * k, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Speed streaks
  const speed = game.phase === 'runway' || game.phase === 'ramp' ? game.speed : Math.hypot(car.vx, car.vy)
  if (speed > 30 && game.phase !== 'crashed') {
    const dir = game.phase === 'runway' ? 0 : game.phase === 'ramp' ? car.angle : Math.atan2(car.vy, car.vx)
    const a = Math.min(0.35, (speed - 30) / 100)
    const len = Math.min(120, speed * 1.5)
    ctx.strokeStyle = `rgba(255,255,255,${a})`
    ctx.lineWidth = 1.5
    for (let i = 0; i < 14; i++) {
      const px = (hash(i) * W * 1.4 - ((game.t * speed * 9 + i * 97) % (W * 1.4)) + W * 1.4) % (W * 1.4) - W * 0.2
      const py = hash(i + 50) * H
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px - Math.cos(dir) * len, py + Math.sin(dir) * len)
      ctx.stroke()
    }
  }

  // Particles: solid ones first, then glowing ones added on top
  for (const p of game.particles) {
    if (p.kind === 'flame' || p.kind === 'fire') continue
    const a = Math.max(0, p.life / p.max)
    const r = Math.max(1.5, p.size * S)
    if (p.kind === 'smoke' || p.kind === 'dust') {
      ctx.fillStyle = p.kind === 'dust' ? `rgba(160,140,110,${a * 0.5})` : `rgba(238,240,244,${a * 0.45})`
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
  for (const p of game.particles) {
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

  if (game.phase !== 'crashed') drawCar(ctx, game, input, sx(car.x), sy(car.y), S)
  ctx.restore()

  // Letterbox bars while in slow motion
  if (slowMo(game)) {
    const bar = Math.round(H * 0.07)
    ctx.fillStyle = 'rgba(0,0,0,0.85)'
    ctx.fillRect(0, 0, W, bar)
    ctx.fillRect(0, H - bar, W, bar)
  }

  if (game.driver) drawDriver(ctx, game.driver, sx(game.driver.x), sy(game.driver.y), S)
}

// Little astronaut-style driver, origin at the feet, ~1.8 m tall
function drawDriver(ctx, d, x, y, S) {
  const vis = Math.max(1, 52 / (1.8 * S))
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(S * vis, -S * vis)
  ctx.translate(0, 0.9)
  ctx.rotate(d.rot)
  ctx.translate(0, -0.9)
  const suit = '#f1f3f6', edge = '#1f2329'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const tuck = d.state === 'air' ? 1 : 0
  const thumbs = d.state === 'standing' && d.t > 0.3
  const limb = (x1, y1, x2, y2, w) => {
    ctx.lineWidth = w + 0.06
    ctx.strokeStyle = edge
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
    ctx.lineWidth = w
    ctx.strokeStyle = suit
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  }

  // Legs (tucked while flipping)
  limb(-0.1, 0.85, tuck ? -0.25 : -0.12, tuck ? 0.55 : 0.05, 0.16)
  limb(0.1, 0.85, tuck ? 0.3 : 0.12, tuck ? 0.5 : 0.05, 0.16)
  // Torso
  ctx.fillStyle = edge
  rrect(ctx, -0.22, 0.78, 0.44, 0.64, 0.14)
  ctx.fill()
  ctx.fillStyle = suit
  rrect(ctx, -0.19, 0.81, 0.38, 0.58, 0.12)
  ctx.fill()
  ctx.fillStyle = '#d62828'
  ctx.fillRect(-0.19, 1.05, 0.38, 0.05)
  // Arms: tucked in the air, one raised for the thumbs up once standing
  limb(-0.2, 1.3, tuck ? -0.3 : -0.32, tuck ? 0.95 : 0.85, 0.13)
  if (thumbs) {
    limb(0.2, 1.3, 0.38, 1.62, 0.13)
    ctx.fillStyle = edge
    ctx.beginPath(); ctx.arc(0.4, 1.68, 0.09, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = suit
    ctx.beginPath(); ctx.arc(0.4, 1.68, 0.065, 0, Math.PI * 2); ctx.fill()
    limb(0.4, 1.72, 0.4, 1.86, 0.06)
  } else {
    limb(0.2, 1.3, tuck ? 0.3 : 0.32, tuck ? 0.95 : 0.85, 0.13)
  }
  // Helmet with a dark visor facing forward
  ctx.fillStyle = edge
  ctx.beginPath(); ctx.arc(0, 1.58, 0.22, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = suit
  ctx.beginPath(); ctx.arc(0, 1.58, 0.19, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#111318'
  ctx.beginPath(); ctx.ellipse(0.06, 1.59, 0.12, 0.09, 0, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

// White ")" ramp with a lattice tower behind it, like the demo
function drawRamp(ctx, track, sx, sy, S) {
  const { runway, lipX } = track
  const lw = (m, min) => Math.max(min, m * S)
  const tx0 = track.towerX, tx1 = track.towerX + TOWER_W

  // Tower columns and a top beam reaching over the lip
  ctx.strokeStyle = '#9aa3b0'
  ctx.lineWidth = lw(0.22, 1.2)
  ctx.beginPath()
  ctx.moveTo(sx(tx0), sy(0)); ctx.lineTo(sx(tx0), sy(TOWER_H))
  ctx.moveTo(sx(tx1), sy(0)); ctx.lineTo(sx(tx1), sy(TOWER_H))
  ctx.moveTo(sx(tx1), sy(TOWER_H)); ctx.lineTo(sx(lipX + 1), sy(TOWER_H))
  ctx.moveTo(sx(tx1), sy(TOWER_H - 2)); ctx.lineTo(sx(lipX + 3), sy(TOWER_H - 2))
  ctx.stroke()

  // Cross bracing, beam lattice, and struts out to the deck
  ctx.lineWidth = lw(0.09, 0.8)
  ctx.beginPath()
  for (let y = 0; y < TOWER_H - 0.1; y += TOWER_W) {
    const y2 = Math.min(TOWER_H, y + TOWER_W)
    ctx.moveTo(sx(tx0), sy(y)); ctx.lineTo(sx(tx1), sy(y2))
    ctx.moveTo(sx(tx1), sy(y)); ctx.lineTo(sx(tx0), sy(y2))
    ctx.moveTo(sx(tx0), sy(y2)); ctx.lineTo(sx(tx1), sy(y2))
  }
  for (let x = lipX + 3; x < tx1; x += 2) {
    ctx.moveTo(sx(x), sy(TOWER_H - 2))
    ctx.lineTo(sx(Math.min(tx1, x + 1)), sy(TOWER_H))
    ctx.lineTo(sx(Math.min(tx1, x + 2)), sy(TOWER_H - 2))
  }
  for (let i = 1; i < 9; i++) {
    const phi = (RAMP_END * i) / 9
    const x = runway + (RAMP_R + 1) * Math.sin(phi)
    const y = RAMP_R - (RAMP_R + 1) * Math.cos(phi)
    if (x < tx0) { ctx.moveTo(sx(x), sy(y)); ctx.lineTo(sx(tx0), sy(y)) }
  }
  ctx.stroke()

  // Footing
  ctx.fillStyle = '#3a3f47'
  ctx.fillRect(sx(runway - 1), sy(0) - lw(0.4, 2), (tx1 + 2 - runway) * S, lw(0.4, 2))

  // Deck: thick white band, bright riding surface, red edge light
  const deck = (offset) => {
    ctx.beginPath()
    for (let i = 0; i <= 60; i++) {
      const phi = (RAMP_END * i) / 60
      const x = sx(runway + (RAMP_R - offset) * Math.sin(phi))
      const y = sy(RAMP_R - (RAMP_R - offset) * Math.cos(phi))
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
  }
  deck(-0.6)
  ctx.strokeStyle = '#cfd4db'
  ctx.lineWidth = lw(1.2, 5)
  ctx.stroke()
  deck(-0.1)
  ctx.strokeStyle = '#f5f7fa'
  ctx.lineWidth = lw(0.25, 1.5)
  ctx.stroke()
  ctx.save()
  ctx.shadowColor = '#ff2020'
  ctx.shadowBlur = 10
  deck(-1.2)
  ctx.strokeStyle = '#ff3b3b'
  ctx.lineWidth = lw(0.1, 1)
  ctx.stroke()
  ctx.restore()
}

// Side profile of the new Roadster: faceted satin-silver wedge, bronze glass canopy, nose light bar
function drawCar(ctx, game, input, x, y, S) {
  const car = game.car
  // Draw at least ~64px long so it stays readable when zoomed out
  const vis = Math.max(1, 64 / (CAR_L * S))
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(S * vis, -S * vis)
  ctx.rotate(car.angle)

  // Thruster flames
  const thrusting = game.phase === 'flight' && input.thrust
  if (thrusting) {
    ctx.globalCompositeOperation = 'lighter'
    for (const off of [-0.9, 0.9]) {
      const len = 1.4 + Math.random() * 0.9
      const g = ctx.createLinearGradient(0, 0.12, 0, 0.12 - len)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.35, 'rgba(240,244,250,0.85)')
      g.addColorStop(1, 'rgba(225,230,240,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(off - 0.13, 0.12)
      ctx.quadraticCurveTo(off - 0.2, 0.12 - len * 0.5, off, 0.12 - len)
      ctx.quadraticCurveTo(off + 0.2, 0.12 - len * 0.5, off + 0.13, 0.12)
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  // Body outline: sharp nose, glass arc over the cabin, flat rear deck, cut-off tail
  const body = () => {
    ctx.beginPath()
    ctx.moveTo(2.18, 0.24)
    ctx.lineTo(2.35, 0.41)
    ctx.lineTo(2.3, 0.49)
    ctx.lineTo(1.35, 0.69)
    ctx.bezierCurveTo(0.85, 0.92, 0.35, 1.06, -0.15, 1.07)
    ctx.bezierCurveTo(-0.65, 1.07, -1.05, 1.0, -1.35, 0.94)
    ctx.lineTo(-2.22, 0.83)
    ctx.lineTo(-2.29, 0.77)
    ctx.lineTo(-2.27, 0.36)
    ctx.lineTo(-2.12, 0.24)
    ctx.closePath()
  }
  const paint = ctx.createLinearGradient(0, 1.05, 0, 0.25)
  paint.addColorStop(0, '#ffffff')
  paint.addColorStop(0.55, '#e6e8ec')
  paint.addColorStop(1, '#a9aeb7')
  ctx.fillStyle = paint
  body()
  ctx.fill()

  // Lower facet: a crease runs from the nose tip back along the flank, darker below it
  ctx.save()
  body()
  ctx.clip()
  ctx.fillStyle = 'rgba(70,76,88,0.2)'
  ctx.beginPath()
  ctx.moveTo(2.35, 0.41)
  ctx.lineTo(1.05, 0.5)
  ctx.lineTo(-2.3, 0.56)
  ctx.lineTo(-2.3, 0.2)
  ctx.lineTo(2.35, 0.2)
  ctx.closePath()
  ctx.fill()
  // Angled facet behind the front wheel
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.beginPath()
  ctx.moveTo(1.05, 0.5)
  ctx.lineTo(0.72, 0.78)
  ctx.lineTo(1.35, 0.69)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Bronze-tinted glass canopy
  const glass = ctx.createLinearGradient(1.2, 0.7, -1.2, 1.0)
  glass.addColorStop(0, '#4a3b30')
  glass.addColorStop(0.5, '#2b231e')
  glass.addColorStop(1, '#3a2f27')
  ctx.fillStyle = glass
  ctx.beginPath()
  ctx.moveTo(1.3, 0.7)
  ctx.bezierCurveTo(0.83, 0.9, 0.35, 1.03, -0.15, 1.04)
  ctx.bezierCurveTo(-0.62, 1.04, -1.0, 0.98, -1.28, 0.92)
  ctx.lineTo(-1.12, 0.84)
  ctx.lineTo(0.72, 0.78)
  ctx.closePath()
  ctx.fill()
  // Driver: white helmet with a dark visor, looking forward
  ctx.fillStyle = '#f5f6f8'
  ctx.beginPath()
  ctx.arc(-0.3, 0.9, 0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111318'
  ctx.beginPath()
  ctx.ellipse(-0.23, 0.9, 0.06, 0.07, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#d1d5db'
  ctx.fillRect(-0.44, 0.78, 0.28, 0.05)

  // Glass reflection and B-pillar
  ctx.strokeStyle = 'rgba(255,235,210,0.28)'
  ctx.lineWidth = 0.035
  ctx.beginPath()
  ctx.moveTo(1.05, 0.81)
  ctx.quadraticCurveTo(0.4, 1.0, -0.4, 1.0)
  ctx.stroke()
  ctx.strokeStyle = '#d6d9de'
  ctx.lineWidth = 0.04
  ctx.beginPath()
  ctx.moveTo(-0.55, 0.82)
  ctx.lineTo(-0.66, 1.03)
  ctx.stroke()

  // Panel seams
  ctx.strokeStyle = 'rgba(60,64,72,0.45)'
  ctx.lineWidth = 0.018
  ctx.beginPath()
  ctx.moveTo(0.72, 0.78)
  ctx.lineTo(0.8, 0.36)
  ctx.moveTo(-1.12, 0.84)
  ctx.lineTo(-1.08, 0.36)
  ctx.stroke()

  // Black lower skirt and front splitter
  ctx.fillStyle = '#16171a'
  ctx.beginPath()
  ctx.moveTo(2.18, 0.24)
  ctx.lineTo(2.33, 0.39)
  ctx.lineTo(2.0, 0.37)
  ctx.lineTo(1.9, 0.3)
  ctx.lineTo(-1.9, 0.3)
  ctx.lineTo(-2.0, 0.37)
  ctx.lineTo(-2.27, 0.38)
  ctx.lineTo(-2.12, 0.24)
  ctx.closePath()
  ctx.fill()

  // Light bar across the nose, thin tail light at the back
  ctx.lineCap = 'round'
  ctx.shadowColor = 'rgba(255,255,255,0.9)'
  ctx.shadowBlur = 8
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 0.05
  ctx.beginPath()
  ctx.moveTo(2.34, 0.42)
  ctx.lineTo(2.02, 0.45)
  ctx.stroke()
  ctx.shadowColor = 'rgba(255,40,40,0.9)'
  ctx.strokeStyle = '#ff3b3b'
  ctx.beginPath()
  ctx.moveTo(-2.28, 0.74)
  ctx.lineTo(-2.27, 0.62)
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.lineCap = 'butt'

  // Crisp outline so the silver reads against a bright sky
  ctx.strokeStyle = 'rgba(30,32,38,0.55)'
  ctx.lineWidth = 0.025
  body()
  ctx.stroke()

  // Wheels: dark aero discs with six star spokes
  const spin = -car.x / WHEEL_R
  for (const wx of [-1.42, 1.42]) {
    ctx.fillStyle = '#0b0c0e'
    ctx.beginPath()
    ctx.arc(wx, WHEEL_R, WHEEL_R + 0.07, 0, Math.PI)
    ctx.fill()

    ctx.fillStyle = '#141518'
    ctx.beginPath()
    ctx.arc(wx, WHEEL_R, WHEEL_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#25272c'
    ctx.beginPath()
    ctx.arc(wx, WHEEL_R, 0.27, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#6b7079'
    ctx.lineWidth = 0.025
    ctx.stroke()
    for (let i = 0; i < 6; i++) {
      const a = spin + (i * Math.PI * 2) / 6
      ctx.fillStyle = i % 2 ? '#8d929b' : '#5f646d'
      ctx.beginPath()
      ctx.moveTo(wx + Math.cos(a - 0.35) * 0.06, WHEEL_R + Math.sin(a - 0.35) * 0.06)
      ctx.lineTo(wx + Math.cos(a - 0.04) * 0.26, WHEEL_R + Math.sin(a - 0.04) * 0.26)
      ctx.lineTo(wx + Math.cos(a + 0.04) * 0.26, WHEEL_R + Math.sin(a + 0.04) * 0.26)
      ctx.closePath()
      ctx.fill()
    }
    ctx.fillStyle = '#d1d5db'
    ctx.beginPath()
    ctx.arc(wx, WHEEL_R, 0.045, 0, Math.PI * 2)
    ctx.fill()
  }
  // Thruster pods on the side, nozzles pointing down
  for (const off of [-0.9, 0.9]) {
    ctx.fillStyle = '#2a2d33'
    rrect(ctx, off - 0.3, 0.27, 0.6, 0.14, 0.07)
    ctx.fill()
    ctx.fillStyle = '#6b7079'
    ctx.fillRect(off - 0.3, 0.37, 0.6, 0.025)
    ctx.fillStyle = '#3a3e45'
    ctx.beginPath()
    ctx.moveTo(off - 0.08, 0.27)
    ctx.lineTo(off + 0.08, 0.27)
    ctx.lineTo(off + 0.13, 0.12)
    ctx.lineTo(off - 0.13, 0.12)
    ctx.closePath()
    ctx.fill()
    if (thrusting) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(off - 0.12, 0.11, 0.24, 0.03)
    }
  }
  // Steering jets at nose and tail
  const turn = game.phase === 'flight' ? (input.left ? 1 : 0) - (input.right ? 1 : 0) : 0
  JETS.forEach((j, i) => {
    ctx.fillStyle = '#1a1c20'
    ctx.beginPath()
    ctx.arc(j.x, j.y, 0.06, 0, Math.PI * 2)
    ctx.fill()
    if (!turn) return
    const d = jetDirs(turn)[i]
    const len = 0.5 + Math.random() * 0.3
    ctx.globalCompositeOperation = 'lighter'
    const g = ctx.createLinearGradient(j.x, j.y, j.x, j.y + d * len)
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(j.x - 0.05, j.y)
    ctx.lineTo(j.x + 0.05, j.y)
    ctx.lineTo(j.x + 0.12, j.y + d * len)
    ctx.lineTo(j.x - 0.12, j.y + d * len)
    ctx.closePath()
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  })
  ctx.restore()
}

// touch: show button wording instead of keyboard keys
export function drawHud(ctx, game, W, H, { touch = false } = {}) {
  const car = game.car
  const onTrack = game.phase === 'runway' || game.phase === 'ramp'
  const speed = onTrack ? Math.abs(game.speed) : Math.hypot(car.vx, car.vy)
  const descent = -car.vy
  const tilt = wrapAngle(car.angle)
  const flying = game.phase === 'flight'
  const good = '#4ade80', bad = '#f87171'

  // Instrument panel
  const panelH = flying ? 150 : 96
  ctx.fillStyle = 'rgba(15,17,21,0.62)'
  rrect(ctx, 12, 12, 150, panelH, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 1
  ctx.stroke()
  const readout = (label, value, unit, y, color) => {
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = `600 10px ${FONT}`
    ctx.fillText(label, 24, y)
    ctx.fillStyle = color || '#f8fafc'
    ctx.font = `700 22px ${FONT}`
    ctx.fillText(value, 24, y + 22)
    const w = ctx.measureText(value).width
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = `600 11px ${FONT}`
    ctx.fillText(unit, 28 + w, y + 22)
  }
  readout('SPEED', String(Math.round(speed * MPH)), 'mph', 32)
  readout('ALTITUDE', String(Math.round(Math.max(0, car.y) * FT)), 'ft', 76)
  if (flying) {
    const safe = descent <= SAFE_VY
    readout('DESCENT', String(Math.max(0, Math.round(descent * MPH))), 'mph', 120, safe ? good : bad)
    // Descent bar with the safe zone marked
    const bx = 90, by = 130, bw = 60, bh = 6, max = 25
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    rrect(ctx, bx, by, bw, bh, 3)
    ctx.fill()
    ctx.fillStyle = 'rgba(74,222,128,0.35)'
    rrect(ctx, bx, by, (bw * SAFE_VY) / max, bh, 3)
    ctx.fill()
    ctx.fillStyle = safe ? good : bad
    rrect(ctx, bx, by, Math.max(2, (bw * Math.min(max, Math.max(0, descent))) / max), bh, 3)
    ctx.fill()

    // Attitude dial
    const cx = W - 46, cy = 50, r = 30
    const level = Math.abs(tilt) <= SAFE_TILT
    ctx.fillStyle = 'rgba(15,17,21,0.62)'
    ctx.beginPath()
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.strokeStyle = 'rgba(74,222,128,0.6)'
    ctx.lineWidth = 4
    for (const base of [0, Math.PI]) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, base - SAFE_TILT, base + SAFE_TILT)
      ctx.stroke()
    }
    ctx.strokeStyle = level ? good : bad
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cx - Math.cos(tilt) * (r - 6), cy + Math.sin(tilt) * (r - 6))
    ctx.lineTo(cx + Math.cos(tilt) * (r - 6), cy - Math.sin(tilt) * (r - 6))
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx - Math.sin(tilt) * 12, cy - Math.cos(tilt) * 12)
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = level ? good : bad
    ctx.font = `700 12px ${FONT}`
    ctx.fillText(`${Math.round((Math.abs(tilt) * 180) / Math.PI)}°`, cx, cy + r + 22)

    // Ground is off screen: point at it
    if (game.cam.bottom > 0) {
      ctx.fillStyle = 'rgba(15,17,21,0.62)'
      rrect(ctx, W / 2 - 70, H - 36, 140, 26, 13)
      ctx.fill()
      ctx.fillStyle = '#f8fafc'
      ctx.font = `600 12px ${FONT}`
      ctx.fillText(`▼ ground ${Math.round(car.y * FT)} ft`, W / 2, H - 18)
    }
  }

  if (game.zeroSixty !== null) {
    const y = 12 + panelH + 8
    ctx.fillStyle = 'rgba(200,16,46,0.85)'
    rrect(ctx, 12, y, 150, 26, 13)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.font = `700 12px ${FONT}`
    ctx.fillText(`0–60 MPH  ${game.zeroSixty.toFixed(2)}s`, 87, y + 17)
  }

  // Easter egg banner, fades out after a few seconds
  if (game.toast && game.t - game.toast.at < 4.5) {
    const age = game.t - game.toast.at
    const a = Math.min(1, age * 3, (4.5 - age) * 2)
    ctx.globalAlpha = a
    ctx.textAlign = 'center'
    ctx.fillStyle = '#f8fafc'
    ctx.font = `800 ${W < 520 ? 30 : 40}px ${FONT}`
    ctx.fillText(game.toast.title, W / 2, H * 0.3)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = `600 ${W < 520 ? 14 : 17}px ${FONT}`
    ctx.fillText(game.toast.line, W / 2, H * 0.3 + 30)
    ctx.globalAlpha = 1
  }

  // Message card: title, main line, optional detail
  let msg = null
  if (game.phase === 'ready') msg = { title: 'ROADSTER LAUNCH', line: touch ? 'Hold Thrust to rev and go' : 'Hold ↑ or W to rev and go', color: '#f8fafc' }
  else if (game.phase === 'crashed' && crashCardReady(game)) msg = { title: 'CRASHED', line: game.quip, detail: game.reason, color: bad }
  else if (game.phase === 'landed') {
    const mph = game.touchdown.descent * MPH
    msg = {
      title: landingGrade(mph),
      line: `${mph.toFixed(1)} mph touchdown · ${Math.round(Math.abs(car.x - game.track.runway) * FT)} ft from the ramp · ${Math.round(game.maxAlt * FT)} ft high`,
      color: good,
      detail: game.starman ? 'Went to space and back. Starman approves.' : undefined,
    }
  }
  const again = canRestart(game)
  if (msg) {
    const small = W < 420
    const boxW = Math.min(W - 24, 620)
    const boxH = (small ? 96 : 112) + (msg.detail ? 22 : 0) + (again ? 26 : 0)
    const top = Math.max(H / 2 - boxH / 2, 12 + panelH + 16)
    ctx.fillStyle = 'rgba(15,17,21,0.82)'
    rrect(ctx, (W - boxW) / 2, top, boxW, boxH, 14)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = msg.color
    // Shrink the big lines to fit narrow screens
    const fit = (text, weight, size, maxW) => {
      let s = size
      ctx.font = `${weight} ${s}px ${FONT}`
      while (s > 12 && ctx.measureText(text).width > maxW) ctx.font = `${weight} ${--s}px ${FONT}`
    }
    fit(msg.title, 800, small ? 28 : 36, boxW - 28)
    ctx.fillText(msg.title, W / 2, top + (small ? 40 : 48))
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    fit(msg.line, 600, small ? 17 : 20, boxW - 28)
    let y = top + (small ? 72 : 86)
    ctx.fillText(msg.line, W / 2, y)
    if (msg.detail) {
      y += 24
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.font = `500 ${small ? 12 : 14}px ${FONT}`
      ctx.fillText(msg.detail, W / 2, y)
    }
    if (again) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = `600 13px ${FONT}`
      ctx.fillText(touch ? 'Tap Thrust to go again' : 'Press ↑ or W to go again', W / 2, y + 28)
    }
  }
}
