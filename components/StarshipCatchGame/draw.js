// Starship Catch drawing: a morning at Starbase as a broadcast camera would see it, with a webcast-style overlay
// (LIVE clock, telemetry strip, flight timeline, tower cam, lower-third results).
// Reads game state, never changes it except for the camera.
import {
  ARM_LEN, ARM_Y, CATCH_X, FT, LIGHT_UP_Y, MOUNT, MPH, OCEAN_X, PIN_Y, RCS_Y, SAFE_VY, SHIP_H, SHIP_W,
  SAFE_VX, TOWER_H, TOWER_W, TOWER_X, cardReady, canRestart, catchGrade, catchStars, pinPoint, slowMo, stage,
} from './physics'
import { drawParticles, hash, lerp, rrect } from '../GameKit/scene'
import { drawPhysicalSky, sunOnScreen } from '../GameKit/sky'

const FONT = 'Saira, system-ui, sans-serif'
const COND = '"Saira Condensed", "Arial Narrow", system-ui, sans-serif'
const ORANGE = '#ff8a3d'
const GOOD = '#7cffb2'
const BAD = '#ff6b6b'
const AMBER = '#ffc56b'
const STRIP = 104 // height of the bottom telemetry strip

// Morning light: the sun is low over the Gulf to the east (left), so everything is lit from the left
const SKY = ['#1d3b6b', '#3f669c', '#87a5c4', '#cfd3d2', '#ecd2b0']
const HAZE = [205, 196, 186] // distant things fade toward this
const haze = (rgb, k) => `rgb(${rgb.map((c, i) => Math.round(c + (HAZE[i] - c) * k)).join(',')})`

// Center of the ship, for framing
function shipCenter(s) {
  return [s.x - Math.sin(s.angle) * SHIP_H * 0.5, s.y + Math.cos(s.angle) * SHIP_H * 0.5]
}

export function updateCamera(game, W, H, dt) {
  const s = game.ship
  const slow = slowMo(game)
  // Frame the ship and the tower together so you always see where you're headed.
  // The usable area sits between a top margin and the telemetry strip.
  const topPad = 44, usableH = Math.max(80, H - STRIP - topPad)
  const [cx, cy] = shipCenter(s)
  const x0 = Math.min(cx - 34, TOWER_X - ARM_LEN - 20)
  const x1 = Math.max(cx + 34, TOWER_X + TOWER_W + 30)
  const y1 = Math.max(TOWER_H + 22, cy + 34)
  // Slow motion zooms in on the chopsticks
  const box = slow ? { x0: CATCH_X - 42, x1: CATCH_X + 42, y0: ARM_Y - 52, y1: ARM_Y + 40 } : { x0, x1, y0: 0, y1 }
  const scaleTarget = Math.min(usableH / (box.y1 - box.y0), W / (box.x1 - box.x0))
  const cam = game.cam || { scale: scaleTarget, left: 0, bottom: 0 }
  cam.scale = game.cam ? lerp(cam.scale, scaleTarget, Math.min(1, dt * 3)) : scaleTarget
  const S = cam.scale
  const targetLeft = (box.x0 + box.x1) / 2 - W / S / 2
  const targetBottom = (box.y0 + box.y1) / 2 - (usableH / 2 + STRIP) / S
  cam.left = game.cam ? lerp(cam.left, targetLeft, Math.min(1, dt * 5)) : targetLeft
  cam.bottom = game.cam ? lerp(cam.bottom, targetBottom, Math.min(1, dt * 5)) : targetBottom
  cam.viewH = H / S
  game.cam = cam
  return cam
}

export function render(ctx, game, W, H, input) {
  const cam = game.cam
  ctx.save()
  if (game.phase === 'crashed') {
    const k = Math.max(0, 1 - (game.t - game.endedAt) / 0.7)
    ctx.translate((Math.random() - 0.5) * 22 * k, (Math.random() - 0.5) * 22 * k)
  }
  drawWorld(ctx, game, input, { W, H, left: cam.left, bottom: cam.bottom, S: cam.scale })
  ctx.restore()

  // Tower cam: a second camera locked on the chopsticks for the final approach
  if (game.phase === 'powered' || game.phase === 'caught') {
    const w = Math.round(Math.min(W * 0.3, 300)), h = Math.round(w * 0.6)
    const x = W - w - 12, y = 12
    const viewH = 95, S = h / viewH
    ctx.save()
    rrect(ctx, x, y, w, h, 6)
    ctx.clip()
    ctx.translate(x, y)
    drawWorld(ctx, game, input, { W: w, H: h, left: CATCH_X - w / S / 2, bottom: ARM_Y - 18 - viewH / 2, S, pip: true })
    ctx.restore()
    rrect(ctx, x, y, w, h, 6)
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = '#e3342f'
    ctx.beginPath()
    ctx.arc(x + 12, y + 13, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.font = `700 10px ${COND}`
    ctx.fillText('TOWER CAM', x + 20, y + 17)
  }

  filmFinish(ctx, W, H)
}

// Everything in the scene, for a view { W, H, left, bottom, S } (meters → pixels)
function drawWorld(ctx, game, input, v) {
  const { H, S } = v
  const sx = (x) => (x - v.left) * S
  const sy = (y) => H - (y - v.bottom) * S
  // The camera stands on the ground, so the horizon sits at ground level
  const horizon = sy(0)

  drawSky(ctx, v, horizon, game.t)
  drawDistantSite(ctx, v, horizon)
  drawGround(ctx, v, sx, horizon, game.t)
  drawPad(ctx, sx, sy, S)
  drawCrew(ctx, game, sx, sy, S)
  drawTower(ctx, sx, sy, S, game.t)
  drawArm(ctx, sx, sy, S, game, 'back')
  drawParticles(ctx, game.particles, sx, sy, S)
  if (game.phase !== 'crashed') drawShip(ctx, game, input, sx, sy, S)
  drawArm(ctx, sx, sy, S, game, 'front')
  if (!v.pip && game.phase !== 'caught' && game.phase !== 'crashed' && game.phase !== 'landed' && !slowMo(game)) {
    drawTargetMarker(ctx, sx(CATCH_X), sy(ARM_Y), game.t)
  }
}

// Pulsing "CATCH HERE" chevron over the chopsticks so the goal is obvious from the first frame
function drawTargetMarker(ctx, x, y, t) {
  const bob = Math.sin(t * 4) * 3
  const top = y - 26 + bob
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 4
  ctx.strokeStyle = GOOD
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 8, top - 8)
  ctx.lineTo(x, top)
  ctx.lineTo(x + 8, top - 8)
  ctx.stroke()
  ctx.fillStyle = GOOD
  ctx.textAlign = 'center'
  ctx.font = `700 11px ${COND}`
  ctx.fillText('CATCH HERE', x, top - 14)
  ctx.restore()
}

// Clear morning sky over the Gulf: deep blue overhead, hazy and warm at the horizon, a few thin clouds.
// This painted version only shows where WebGL isn't available.
const CLOUDS = Array.from({ length: 14 }, (_, i) => ({
  x: hash(i + 3) * 2.2 - 0.6,
  h: 0.08 + hash(i + 40) * 0.5,
  w: 0.12 + hash(i + 80) * 0.22,
  t: 0.012 + hash(i + 120) * 0.02,
}))

function drawSky(ctx, v, horizon, t) {
  const { W, H } = v
  // Real light scattering on the GPU where WebGL is available; the painted gradient below is the fallback
  if (drawPhysicalSky(ctx, W, H, horizon, t)) return
  const top = Math.min(horizon, H * 1.6) - H * 1.25
  const g = ctx.createLinearGradient(0, top, 0, Math.min(horizon, H * 1.6))
  g.addColorStop(0, SKY[0])
  g.addColorStop(0.35, SKY[1])
  g.addColorStop(0.7, SKY[2])
  g.addColorStop(0.9, SKY[3])
  g.addColorStop(1, SKY[4])
  ctx.fillStyle = g
  ctx.fillRect(-30, -30, W + 60, H + 60)

  // Low sun over the sea on the left, with a wide soft glow
  const { x: sunX, y: sunY } = sunOnScreen(W, H, horizon)
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.9)
  glow.addColorStop(0, 'rgba(255,236,200,0.75)')
  glow.addColorStop(0.15, 'rgba(255,214,170,0.35)')
  glow.addColorStop(0.5, 'rgba(255,214,170,0.08)')
  glow.addColorStop(1, 'rgba(255,214,170,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fffaf0'
  ctx.beginPath()
  ctx.arc(sunX, sunY, Math.max(5, H * 0.016), 0, Math.PI * 2)
  ctx.fill()

  // Thin high clouds: long, soft streaks lit warm underneath, drifting slowly
  for (const c of CLOUDS) {
    const x = ((c.x * W + t * 3) % (W * 1.6)) - W * 0.2
    const y = horizon - c.h * H * 1.1
    if (y < -20 || y > horizon) continue
    const w = c.w * W, h = Math.max(2, c.t * H)
    const cg = ctx.createRadialGradient(x, y, 0, x, y, w / 2)
    cg.addColorStop(0, 'rgba(255,240,225,0.45)')
    cg.addColorStop(1, 'rgba(255,240,225,0)')
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(1, h / (w / 2))
    ctx.fillStyle = cg
    ctx.beginPath()
    ctx.arc(0, 0, w / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// Starbase in the distance, inland (right): the first tower, tank farm and the high bays, softened by haze.
// They scroll slower than the pad so they read as far away.
const SITE = [
  { kind: 'tower', x: 300, w: 9, h: 130 },
  { kind: 'tanks', x: 360, w: 40, h: 26 },
  { kind: 'sphere', x: 410, w: 14, h: 14 },
  { kind: 'sphere', x: 428, w: 14, h: 14 },
  { kind: 'bay', x: 640, w: 40, h: 82 },
  { kind: 'bay', x: 690, w: 34, h: 70 },
  { kind: 'bay', x: 735, w: 60, h: 38 },
]

function drawDistantSite(ctx, v, horizon) {
  const { W, S } = v
  if (horizon < 0) return
  const depth = 0.35 // how much smaller and slower than the pad layer
  const centerX = v.left + W / S / 2
  const fx = (x) => W / 2 + (x - centerX * 0.25) * S * depth
  const col = haze([70, 74, 80], 0.55)
  const lit = haze([160, 150, 140], 0.5)
  ctx.fillStyle = col
  for (const o of SITE) {
    const x = fx(o.x), w = o.w * S * depth, h = o.h * S * depth
    if (x + w < 0 || x > W) continue
    if (o.kind === 'sphere') {
      ctx.beginPath()
      ctx.arc(x + w / 2, horizon - h * 0.6, w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(x + w * 0.2, horizon - h * 0.6, w * 0.6, h * 0.6)
    } else if (o.kind === 'tanks') {
      for (let i = 0; i < 5; i++) ctx.fillRect(x + i * w * 0.2, horizon - h * (0.7 + 0.3 * hash(i)), w * 0.15, h)
    } else if (o.kind === 'tower') {
      ctx.fillRect(x, horizon - h, w, h)
      ctx.fillRect(x - w * 1.6, horizon - h * 0.62, w * 1.6, Math.max(1, h * 0.03))
    } else {
      ctx.fillRect(x, horizon - h, w, h)
      ctx.fillStyle = lit
      ctx.fillRect(x, horizon - h, Math.max(1, w * 0.12), h)
      ctx.fillStyle = col
    }
  }
}

// The Gulf on the left with the sun's glitter path, the beach, then the flat scrubby ground around the pad
function drawGround(ctx, v, sx, horizon, t) {
  const { W, H, S } = v
  if (horizon > H) return
  const ground = ctx.createLinearGradient(0, horizon, 0, H)
  ground.addColorStop(0, haze([150, 136, 112], 0.4))
  ground.addColorStop(0.25, '#8d7c62')
  ground.addColorStop(1, '#5c5040')
  ctx.fillStyle = ground
  ctx.fillRect(-30, horizon, W + 60, H - horizon + 30)
  // Patches of scrub and wet sand, fixed to the ground so they slide past as the camera moves
  for (let i = 0; i < 60; i++) {
    const wx = -600 + i * 22 + hash(i + 7) * 15
    const x = sx(wx)
    if (x < -60 || x > W + 60) continue
    const depth = hash(i + 50)
    const y = horizon + 2 + depth * depth * (H - horizon)
    const w = (6 + hash(i + 90) * 18) * S * (0.3 + depth)
    ctx.fillStyle = i % 3 ? 'rgba(70,72,48,0.35)' : 'rgba(120,108,88,0.35)'
    ctx.beginPath()
    ctx.ellipse(x, y, w, Math.max(1, w * 0.08), 0, 0, Math.PI * 2)
    ctx.fill()
  }

  const ox = sx(OCEAN_X)
  if (ox <= 0) return
  const sea = ctx.createLinearGradient(0, horizon, 0, H)
  sea.addColorStop(0, '#9fb3c2')
  sea.addColorStop(0.15, '#5f7f96')
  sea.addColorStop(1, '#2f4a5f')
  ctx.fillStyle = sea
  ctx.fillRect(-30, horizon, ox + 30, H - horizon + 30)
  // Glitter path under the sun
  ctx.lineWidth = 1.2
  for (let i = 0; i < 70; i++) {
    const d = hash(i + 9)
    const x = sunOnScreen(W, H, horizon).x + (hash(i) - 0.5) * W * (0.02 + d * 0.22)
    const y = horizon + 1 + d * d * (H - horizon)
    if (x > ox - 4) continue
    const a = 0.25 + 0.6 * Math.abs(Math.sin(t * 2.2 + i * 1.7))
    ctx.strokeStyle = `rgba(255,240,215,${a})`
    ctx.beginPath()
    ctx.moveTo(x - 2 - d * 9, y)
    ctx.lineTo(x + 2 + d * 9, y)
    ctx.stroke()
  }
  // Surf line and beach
  ctx.fillStyle = 'rgba(245,245,240,0.7)'
  ctx.fillRect(ox - Math.max(2, 3 * S), horizon, Math.max(2, 3 * S), H - horizon)
  ctx.fillStyle = '#c9b48f'
  ctx.fillRect(ox, horizon, Math.max(3, 14 * S), H - horizon)
}

// Concrete pad and the orbital launch mount under the catch point, sunlit from the left
function drawPad(ctx, sx, sy, S) {
  const lw = (m, min) => Math.max(min, m * S)
  ctx.fillStyle = '#a7a39b'
  ctx.fillRect(sx(-70), sy(0), 110 * S, lw(1.2, 3))
  for (let i = 0; i < 4; i++) {
    const x = MOUNT.x0 + 1 + i * ((MOUNT.x1 - MOUNT.x0 - 4) / 3)
    ctx.fillStyle = '#4a4d52'
    ctx.fillRect(sx(x), sy(MOUNT.top - 2), lw(2, 2), (MOUNT.top - 2) * S)
    ctx.fillStyle = '#8e9196'
    ctx.fillRect(sx(x), sy(MOUNT.top - 2), lw(0.5, 1), (MOUNT.top - 2) * S)
  }
  ctx.fillStyle = '#55595f'
  ctx.fillRect(sx(MOUNT.x0), sy(MOUNT.top), (MOUNT.x1 - MOUNT.x0) * S, lw(3, 3))
  ctx.fillStyle = '#b8bcc2'
  ctx.fillRect(sx(MOUNT.x0), sy(MOUNT.top), (MOUNT.x1 - MOUNT.x0) * S, lw(0.6, 1))
}

// Steel lattice tower: dark grey, sunlit along the left face, floors every few meters, red aircraft lights
function drawTower(ctx, sx, sy, S, t) {
  const lw = (m, min) => Math.max(min, m * S)
  const x0 = TOWER_X, x1 = TOWER_X + TOWER_W
  // Faint fill so the lattice reads as a solid structure behind
  ctx.fillStyle = 'rgba(60,64,70,0.35)'
  ctx.fillRect(sx(x0), sy(TOWER_H), TOWER_W * S, TOWER_H * S)
  ctx.strokeStyle = '#3c4046'
  ctx.lineWidth = lw(0.18, 0.7)
  ctx.beginPath()
  for (let y = 0; y < TOWER_H - 0.1; y += 6) {
    const y2 = Math.min(TOWER_H, y + 6)
    ctx.moveTo(sx(x0), sy(y)); ctx.lineTo(sx(x1), sy(y2))
    ctx.moveTo(sx(x0), sy(y2)); ctx.lineTo(sx(x1), sy(y2))
  }
  ctx.moveTo(sx(x0 + TOWER_W / 2), sy(0)); ctx.lineTo(sx(x0 + TOWER_W / 2), sy(TOWER_H))
  ctx.stroke()
  // Corner columns: the sunlit left one is lighter
  ctx.fillStyle = '#9da2a8'
  ctx.fillRect(sx(x0), sy(TOWER_H), lw(0.9, 1.5), TOWER_H * S)
  ctx.fillStyle = '#2e3136'
  ctx.fillRect(sx(x1) - lw(0.9, 1.5), sy(TOWER_H), lw(0.9, 1.5), TOWER_H * S)
  // Roof, lightning rod and crane boom
  ctx.fillStyle = '#3a3e44'
  ctx.fillRect(sx(x0 - 1), sy(TOWER_H + 2), (TOWER_W + 2) * S, lw(2, 2))
  ctx.strokeStyle = '#3a3e44'
  ctx.lineWidth = lw(0.35, 1)
  ctx.beginPath()
  ctx.moveTo(sx(x0 + TOWER_W / 2), sy(TOWER_H + 2)); ctx.lineTo(sx(x0 + TOWER_W / 2), sy(TOWER_H + 16))
  ctx.moveTo(sx(x1), sy(TOWER_H + 2)); ctx.lineTo(sx(x1 + 14), sy(TOWER_H + 9))
  ctx.stroke()
  // Carriage that carries the arms up and down the tower
  ctx.fillStyle = '#4b4f55'
  ctx.fillRect(sx(x0 - 1.5), sy(ARM_Y + 8), (TOWER_W + 3) * S, 12 * S)
  ctx.fillStyle = '#a1a6ac'
  ctx.fillRect(sx(x0 - 1.5), sy(ARM_Y + 8), lw(0.6, 1), 12 * S)
  const on = Math.sin(t * 3) > 0
  ctx.fillStyle = on ? '#ff3b3b' : '#5a1414'
  for (const [x, y] of [[x0, TOWER_H + 2], [x1, TOWER_H + 2], [x0 + TOWER_W / 2, TOWER_H + 16]]) {
    ctx.beginPath()
    ctx.arc(sx(x), sy(y), Math.max(1.5, 0.6 * S), 0, Math.PI * 2)
    ctx.fill()
  }
}

// One chopstick arm. The back arm sits behind the ship and the front one over it. Before the catch the front arm
// is swung open (drawn foreshortened); on the catch it swings shut, then both dip a little under the weight.
function drawArm(ctx, sx, sy, S, game, side) {
  const caught = game.phase === 'caught'
  const k = caught ? game.t - game.endedAt : 0
  const dip = caught ? Math.sin(Math.min(k * 9, Math.PI)) * 0.5 * Math.exp(-k * 2) : 0
  const front = side === 'front'
  const reach = front ? lerp(0.45, 1, game.armClose || 0) : 1
  const y = ARM_Y + (front ? -0.6 : 0.6) - dip
  const x0 = TOWER_X, x1 = TOWER_X - ARM_LEN * reach
  const h = 3.6
  // Truss arm: top and bottom chords with diagonal webbing
  ctx.fillStyle = front ? 'rgba(150,154,160,0.35)' : 'rgba(60,64,70,0.4)'
  ctx.fillRect(sx(x1), sy(y), (x0 - x1) * S, h * S)
  ctx.strokeStyle = front ? '#b7bbc1' : '#4d5157'
  ctx.lineWidth = Math.max(1, 0.45 * S)
  ctx.beginPath()
  ctx.moveTo(sx(x0), sy(y)); ctx.lineTo(sx(x1), sy(y))
  ctx.moveTo(sx(x0), sy(y - h)); ctx.lineTo(sx(x1 + 1.5), sy(y - h)); ctx.lineTo(sx(x1), sy(y))
  ctx.stroke()
  ctx.lineWidth = Math.max(0.6, 0.18 * S)
  ctx.beginPath()
  for (let x = x1 + 1.5; x < x0 - 1; x += 3) {
    ctx.moveTo(sx(x), sy(y - h)); ctx.lineTo(sx(x + 1.5), sy(y)); ctx.lineTo(sx(x + 3), sy(y - h))
  }
  ctx.stroke()
  if (front) {
    const [px, py] = pinPoint(game.ship)
    const lined = game.phase === 'powered' && Math.abs(px - CATCH_X) < 3 && py > ARM_Y && py - ARM_Y < 60
    if (caught || lined) {
      ctx.fillStyle = GOOD
      ctx.fillRect(sx(CATCH_X - 4), sy(y + 0.4), 8 * S, Math.max(2, 0.5 * S))
    }
  }
}

// Starship (the upper stage): stainless steel with black heat-shield tiles on its belly side, flaps fore and aft,
// three sea-level engines. Drawn from the engines (origin) up, 9 m wide and 52 m tall, at least ~60px tall.
function drawShip(ctx, game, input, sx, sy, S) {
  const s = game.ship
  const w = SHIP_W / 2
  const vis = Math.max(1, 60 / (SHIP_H * S))
  // Scale up around the ship's middle so a zoomed-out ship stays where it really is
  const [cx, cy] = shipCenter(s)
  ctx.save()
  ctx.translate(sx(cx), sy(cy))
  ctx.scale(S * vis, -S * vis)
  ctx.rotate(s.angle)
  ctx.translate(0, -SHIP_H / 2)

  // Engine plume while firing
  if (game.firing) {
    ctx.globalCompositeOperation = 'lighter'
    for (const off of [-1.8, 0, 1.8]) {
      const len = 7 + Math.random() * 4
      const g = ctx.createLinearGradient(0, -1.2, 0, -1.2 - len)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.25, 'rgba(255,214,170,0.85)')
      g.addColorStop(1, 'rgba(255,150,90,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(off - 0.7, -1.2)
      ctx.quadraticCurveTo(off - 1.2, -1.2 - len * 0.5, off, -1.2 - len)
      ctx.quadraticCurveTo(off + 1.2, -1.2 - len * 0.5, off + 0.7, -1.2)
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }
  ctx.fillStyle = '#26282c'
  for (const off of [-1.8, 0, 1.8]) {
    ctx.beginPath()
    ctx.moveTo(off - 0.5, 0.4)
    ctx.lineTo(off + 0.5, 0.4)
    ctx.lineTo(off + 0.8, -1.2)
    ctx.lineTo(off - 0.8, -1.2)
    ctx.closePath()
    ctx.fill()
  }

  // Body outline: straight barrel, ogive nose
  const noseStart = SHIP_H - 15
  const body = () => {
    ctx.beginPath()
    ctx.moveTo(-w, 0.4)
    ctx.lineTo(-w, noseStart)
    ctx.bezierCurveTo(-w, noseStart + 9, -1.4, SHIP_H - 0.6, 0, SHIP_H)
    ctx.bezierCurveTo(1.4, SHIP_H - 0.6, w, noseStart + 9, w, noseStart)
    ctx.lineTo(w, 0.4)
    ctx.closePath()
  }
  // Steel, lit from the sun on the ship's left side
  const steel = ctx.createLinearGradient(-w, 0, w, 0)
  steel.addColorStop(0, '#f2efe9')
  steel.addColorStop(0.35, '#d3d1cd')
  steel.addColorStop(0.75, '#8e8f92')
  steel.addColorStop(1, '#5d5f63')
  ctx.fillStyle = steel
  body()
  ctx.fill()
  ctx.save()
  body()
  ctx.clip()
  // Heat shield on the right (belly) side, with a slightly ragged edge and a tile pattern
  ctx.fillStyle = '#1b1c1f'
  ctx.beginPath()
  ctx.moveTo(w + 1, 0)
  for (let y = 0; y <= SHIP_H; y += 1.5) ctx.lineTo(0.6 + Math.sin(y * 1.9) * 0.18, y)
  ctx.lineTo(w + 1, SHIP_H)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 0.06
  ctx.beginPath()
  for (let y = 0.8; y < SHIP_H; y += 0.8) { ctx.moveTo(0.6, y); ctx.lineTo(w, y) }
  ctx.stroke()
  // Weld lines on the steel
  ctx.strokeStyle = 'rgba(70,70,74,0.25)'
  ctx.lineWidth = 0.07
  ctx.beginPath()
  for (let y = 3.6; y < noseStart; y += 3.6) { ctx.moveTo(-w, y); ctx.lineTo(0.6, y) }
  ctx.stroke()
  // Soot near the engines
  const soot = ctx.createLinearGradient(0, 0, 0, 12)
  soot.addColorStop(0, 'rgba(40,32,28,0.6)')
  soot.addColorStop(1, 'rgba(40,32,28,0)')
  ctx.fillStyle = soot
  ctx.fillRect(-w, 0, SHIP_W, 12)
  ctx.restore()

  // Flaps: small forward pair near the nose, bigger aft pair near the base; they tuck in once upright
  const open = game.phase === 'belly' || game.phase === 'ready' ? 1 : game.phase === 'flip' ? 0.5 : 0.15
  const flap = (y, len, wid, sideSign) => {
    const a = (open * 0.55 + (game.phase === 'belly' ? game.side * sideSign * 0.12 : 0)) * sideSign
    ctx.save()
    ctx.translate(sideSign * w, y)
    ctx.rotate(-a)
    ctx.fillStyle = '#1b1c1f'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(sideSign * wid, -len * 0.15)
    ctx.lineTo(sideSign * wid * 0.8, -len)
    ctx.lineTo(0, -len * 0.9)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  for (const sg of [-1, 1]) {
    flap(noseStart + 3.5, 7, 2.6, sg)
    flap(10, 9, 3.2, sg)
  }
  // Catch fittings just under the forward flaps
  ctx.fillStyle = '#3a3c40'
  ctx.fillRect(-w - 1, PIN_Y - 0.5, 1, 1)
  ctx.fillRect(w, PIN_Y - 0.5, 1, 1)

  // Steering thrusters near the nose, with a white jet on the side that's firing
  if (game.side) {
    const side = -game.side
    const len = 4 + Math.random() * 2.5
    const x0 = side * (w + 0.4)
    ctx.globalCompositeOperation = 'lighter'
    const g = ctx.createLinearGradient(x0, 0, x0 + side * len, 0)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(x0, RCS_Y - 0.4)
    ctx.lineTo(x0 + side * len, RCS_Y - 1.2)
    ctx.lineTo(x0 + side * len, RCS_Y + 1.2)
    ctx.lineTo(x0, RCS_Y + 0.4)
    ctx.closePath()
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }
  ctx.restore()
}

// Camera finish: a touch of film grain and darker corners, so it reads like footage rather than a drawing
let grain = null
function filmFinish(ctx, W, H) {
  if (!grain && typeof document !== 'undefined') {
    grain = document.createElement('canvas')
    grain.width = grain.height = 128
    const g = grain.getContext('2d')
    const img = g.createImageData(128, 128)
    for (let i = 0; i < img.data.length; i += 4) {
      const n = Math.random() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = n
      img.data[i + 3] = 255
    }
    g.putImageData(img, 0, 0)
  }
  if (grain) {
    ctx.save()
    ctx.globalAlpha = 0.045
    ctx.globalCompositeOperation = 'overlay'
    const ox = Math.floor(Math.random() * 128), oy = Math.floor(Math.random() * 128)
    for (let x = -ox; x < W; x += 128) for (let y = -oy; y < H; y += 128) ctx.drawImage(grain, x, y)
    ctx.restore()
  }
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.8)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, W, H)
}

// People on the ground, origin at the feet, ~1.8 m tall; drawn at least ~22px tall so they read when zoomed out.
// Crew wear orange hi-vis with a reflective stripe and a white hard hat; spectators wear everyday clothes.
function drawCrew(ctx, game, sx, sy, S) {
  const vis = Math.max(1, 22 / (1.8 * S))
  const cheering = game.phase === 'caught'
  const running = game.phase === 'crashed'
  for (const c of game.crew) {
    const x = sx(c.x), y = sy(0)
    if (x < -20 || x > ctx.canvas.width + 20) continue
    const t = game.t * 8 + c.seed * 5
    const hop = cheering ? Math.abs(Math.sin(t * 0.7)) * 0.5 : 0
    const stride = running && c.vx ? Math.sin(t * 1.6) * 0.35 : 0
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(S * vis * c.face, -S * vis)
    ctx.translate(0, hop)
    ctx.lineCap = 'round'
    const crew = c.role === 'crew'
    const skin = '#4a3a33'
    // Spectators wear everyday colors
    const shirt = ['#3d5a80', '#7a4b3a', '#5b6b4a', '#a8a29a', '#2f3b52'][Math.floor(c.seed * 3) % 5]
    // Legs
    ctx.strokeStyle = crew ? '#2d3340' : '#3b3f4a'
    ctx.lineWidth = 0.22
    ctx.beginPath()
    ctx.moveTo(-0.08, 0.85); ctx.lineTo(-0.12 - stride, 0)
    ctx.moveTo(0.08, 0.85); ctx.lineTo(0.12 + stride, 0)
    ctx.stroke()
    // Body, with a reflective stripe on the crew's hi-vis vest
    ctx.fillStyle = crew ? '#ff8a1f' : shirt
    ctx.fillRect(-0.2, 0.8, 0.4, 0.62)
    if (crew) {
      ctx.fillStyle = '#e8f0d0'
      ctx.fillRect(-0.2, 1.02, 0.4, 0.07)
    }
    // Arms: up when cheering, pumping when running, holding a phone, tablet or wand otherwise
    ctx.strokeStyle = crew ? '#ff8a1f' : shirt
    ctx.lineWidth = 0.14
    ctx.beginPath()
    if (cheering) {
      const wave = Math.sin(t) * 0.12
      ctx.moveTo(-0.17, 1.35); ctx.lineTo(-0.38 + wave, 1.95)
      ctx.moveTo(0.17, 1.35); ctx.lineTo(0.38 - wave, 1.95)
    } else if (running) {
      ctx.moveTo(-0.17, 1.35); ctx.lineTo(-0.3 - stride, 0.95)
      ctx.moveTo(0.17, 1.35); ctx.lineTo(0.3 + stride, 0.95)
    } else if (c.phone || c.tablet || c.wand) {
      ctx.moveTo(-0.17, 1.35); ctx.lineTo(-0.22, 0.9)
      ctx.moveTo(0.17, 1.35); ctx.lineTo(0.4, 1.45)
    } else {
      ctx.moveTo(-0.17, 1.35); ctx.lineTo(-0.22, 0.9)
      ctx.moveTo(0.17, 1.35); ctx.lineTo(0.22, 0.9)
    }
    ctx.stroke()
    if (!cheering && !running) {
      if (c.phone) {
        ctx.fillStyle = '#9fd8ff'
        ctx.fillRect(0.38, 1.42, 0.1, 0.17)
      } else if (c.tablet) {
        ctx.fillStyle = '#9fd8ff'
        ctx.fillRect(0.36, 1.3, 0.22, 0.28)
      } else if (c.wand) {
        ctx.strokeStyle = '#ff4d3d'
        ctx.lineWidth = 0.08
        ctx.beginPath(); ctx.moveTo(0.4, 1.45); ctx.lineTo(0.62, 1.75); ctx.stroke()
      }
    }
    // Head, with a white hard hat for the crew
    ctx.fillStyle = skin
    ctx.beginPath()
    ctx.arc(0, 1.6, 0.15, 0, Math.PI * 2)
    ctx.fill()
    if (crew) {
      ctx.fillStyle = '#f4f4f0'
      ctx.beginPath()
      ctx.arc(0, 1.65, 0.17, 0, Math.PI)
      ctx.fill()
      ctx.fillRect(-0.22, 1.63, 0.44, 0.04)
    }
    ctx.restore()
  }
}

// ---------- Webcast overlay ----------

const clock = (secs) => {
  const s = Math.floor(secs)
  const pad = (n) => String(n).padStart(2, '0')
  return `T+ ${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}

// Shrinks a font size until the text fits
function fitFont(ctx, text, weight, size, family, maxW) {
  let s = size
  ctx.font = `${weight} ${s}px ${family}`
  while (s > 10 && ctx.measureText(text).width > maxW) ctx.font = `${weight} ${--s}px ${family}`
}

// Round gauge: 270° track with the value arc and a number in the middle
function gauge(ctx, cx, cy, r, frac, value, unit, label) {
  ctx.lineCap = 'round'
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.beginPath()
  ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25)
  ctx.stroke()
  ctx.strokeStyle = '#fff'
  ctx.beginPath()
  ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * Math.min(1, Math.max(0, frac))))
  ctx.stroke()
  ctx.lineCap = 'butt'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  fitFont(ctx, value, 700, 15, FONT, r * 1.6)
  ctx.fillText(value, cx, cy + 4)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = `600 9px ${COND}`
  ctx.fillText(unit, cx, cy + 16)
  ctx.fillText(label, cx, cy - r - 8)
}

// The ship's six Raptors seen from below: three sea-level engines in the middle light up when firing,
// the three larger vacuum engines around them stay dark
function engines(ctx, cx, cy, firing) {
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 6.5, 0, Math.PI * 2)
    ctx.stroke()
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2
    ctx.fillStyle = firing ? '#fff' : 'rgba(255,255,255,0.22)'
    if (firing) { ctx.shadowColor = 'rgba(255,200,140,0.9)'; ctx.shadowBlur = 6 }
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5, 3.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = `600 9px ${COND}`
  ctx.fillText('ENGINES', cx, cy - 32)
}

function readout(ctx, x, y, label, value, color = '#fff', size = 19) {
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = `600 10px ${COND}`
  ctx.fillText(label, x, y)
  ctx.fillStyle = color
  ctx.font = `700 ${size}px ${FONT}`
  ctx.fillText(value, x, y + 22)
}

// Big centered call-out, e.g. the cue to light the engines
function callout(ctx, W, y, text, sub, color, t) {
  ctx.save()
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 6)
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 6
  ctx.fillStyle = color
  fitFont(ctx, text, 800, 30, COND, W - 40)
  ctx.fillText(text, W / 2, y)
  if (sub) {
    ctx.fillStyle = '#fff'
    fitFont(ctx, sub, 600, 14, FONT, W - 40)
    ctx.fillText(sub, W / 2, y + 22)
  }
  ctx.restore()
}

export function drawHud(ctx, game, W, H, { touch = false } = {}) {
  const s = game.ship
  const phase = game.phase
  const flying = phase === 'belly' || phase === 'flip' || phase === 'powered'
  const [px, py] = pinPoint(s)

  // LIVE badge and mission clock
  ctx.fillStyle = '#e3342f'
  rrect(ctx, 12, 12, 46, 20, 3)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = `700 12px ${COND}`
  ctx.fillText('LIVE', 35, 27)
  ctx.textAlign = 'left'
  ctx.font = `600 14px ${FONT}`
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 4
  ctx.fillText(clock(3912 + game.t), 68, 27)
  if (slowMo(game)) {
    ctx.fillStyle = AMBER
    ctx.font = `700 12px ${COND}`
    ctx.fillText('SLOW MOTION', 170, 27)
  }
  ctx.shadowBlur = 0

  // Cues for what to do next
  const thrustKey = touch ? 'THRUST' : '↑ OR W'
  if (phase === 'belly' && s.y < LIGHT_UP_Y) {
    callout(ctx, W, H * 0.3, `LIGHT ENGINES — HOLD ${thrustKey}`, 'Flip upright and brake before the tower', AMBER, game.t)
  } else if (phase === 'belly' && game.t < 4) {
    callout(ctx, W, H * 0.3, touch ? 'STEER WITH ◀ ▶' : 'STEER WITH ← →', 'Glide toward the tower', '#fff', game.t)
  } else if (phase === 'powered' && game.t - (game.flipAt || 0) < 4.5) {
    callout(ctx, W, H * 0.3, 'EASE INTO THE ARMS', `Hold ${thrustKey} to slow · let go to sink · ◀ ▶ to line up`, '#fff', game.t)
  }

  // Telemetry strip
  const top = H - STRIP
  const fade = ctx.createLinearGradient(0, top - 30, 0, H)
  fade.addColorStop(0, 'rgba(8,10,16,0)')
  fade.addColorStop(0.35, 'rgba(8,10,16,0.72)')
  fade.addColorStop(1, 'rgba(8,10,16,0.9)')
  ctx.fillStyle = fade
  ctx.fillRect(0, top - 30, W, STRIP + 30)
  const cy = H - 44
  // On a phone held sideways the thumb buttons sit in the corners, so start the telemetry after them
  const thumbs = touch && H < 520
  const ox = thumbs ? 184 : 0
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'left'
  ctx.font = `700 11px ${COND}`
  ctx.fillText('STARSHIP', 16 + ox, top + 2)
  const speed = Math.hypot(s.vx, s.vy)
  gauge(ctx, 46 + ox, cy, 26, speed / 40, String(Math.round(speed * MPH)), 'MPH', 'SPEED')
  const alt = Math.max(0, s.y)
  gauge(ctx, 116 + ox, cy, 26, alt / 400, String(Math.round(alt * FT)), 'FT', 'ALTITUDE')
  engines(ctx, 186 + ox, cy, game.firing)

  // Catch readouts
  const off = px - CATCH_X
  const descent = -s.vy
  const rx = 236 + ox
  if (W - ox >= 420) {
    // Smaller and closer together on phones held sideways, so they end before the Thrust button
    const gap = thumbs ? 0.72 : 1
    const size = thumbs ? 15 : 19
    const approach = phase === 'powered'
    readout(ctx, rx, top + 20, 'DESCENT', flying ? `${Math.max(0, Math.round(descent * MPH))} mph` : '—', !approach ? '#fff' : descent <= SAFE_VY ? GOOD : BAD, size)
    readout(ctx, rx + 96 * gap, top + 20, 'SIDEWAYS', flying ? `${Math.round(Math.abs(s.vx) * MPH)} mph` : '—', !approach ? '#fff' : Math.abs(s.vx) <= SAFE_VX ? GOOD : BAD, size)
    const lined = Math.abs(off) < 3
    readout(ctx, rx + 192 * gap, top + 20, 'TARGET', lined ? 'LINED UP' : `${off > 0 ? '←' : '→'} ${Math.round(Math.abs(off) * FT)} ft`, lined ? GOOD : '#fff', size)
  }

  // Flight timeline on wide screens
  if (W >= 860 && !thumbs && (flying || phase === 'ready' || phase === 'caught')) {
    const x0 = W - 290, x1 = W - 26, ly = H - 50
    const stages = ['BELLY-FLOP', 'FLIP', 'CATCH']
    const st = stage(game)
    const progress = st >= 3 ? 1 : st === 2 ? 0.5 + 0.5 * Math.min(1, Math.max(0, 1 - (py - ARM_Y) / 200)) : st === 1 ? 0.5 : 0.5 * Math.min(1, Math.max(0, 1 - (s.y - LIGHT_UP_Y) / 200))
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x0, ly)
    ctx.lineTo(x1, ly)
    ctx.stroke()
    ctx.strokeStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(x0, ly)
    ctx.lineTo(lerp(x0, x1, progress), ly)
    ctx.stroke()
    stages.forEach((label, i) => {
      const x = lerp(x0, x1, i / 2)
      const done = progress >= i / 2
      ctx.fillStyle = done ? '#fff' : '#2a3040'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x, ly, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = done ? '#fff' : 'rgba(255,255,255,0.55)'
      ctx.textAlign = i === 0 ? 'left' : i === 2 ? 'right' : 'center'
      ctx.font = `700 10px ${COND}`
      ctx.fillText(label, i === 0 ? x - 5 : i === 2 ? x + 5 : x, ly + 20)
    })
    if (flying) {
      const pulse = 4 + 2 * Math.abs(Math.sin(game.t * 4))
      ctx.fillStyle = ORANGE
      ctx.beginPath()
      ctx.arc(lerp(x0, x1, progress), ly, pulse, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Lower-third: the start title and results
  let msg = null
  if (phase === 'ready') {
    msg = {
      kicker: 'STARSHIP FLIGHT 15 · SHIP RETURN',
      title: 'CATCH THE SHIP',
      line: `Glide toward the tower, then hold ${touch ? 'Thrust' : '↑ or W'} to flip and slow down`,
      detail: `Press ${touch ? 'Thrust' : '↑ or W'} to start`,
      color: '#fff',
    }
  } else if (cardReady(game)) {
    const c = game.contact
    if (phase === 'caught') {
      const mph = c.descent * MPH
      msg = {
        kicker: 'SHIP CATCH CONFIRMED · MISSION PATCH EARNED',
        title: catchGrade(mph),
        line: `${mph.toFixed(1)} mph contact · ${Math.round(Math.abs(c.off) * FT)} ft off center`,
        color: GOOD,
      }
    } else if (phase === 'landed') {
      msg = {
        kicker: 'OFF-NOMINAL',
        title: 'PLAN B: GROUND LANDING',
        line: c.onMount ? 'Parked it on the launch mount. The chopsticks wanted a hug.' : 'Soft landing, but the tower wanted a hug.',
        detail: `${(c.descent * MPH).toFixed(1)} mph touchdown`,
        color: AMBER,
      }
    } else {
      msg = { kicker: 'ANOMALY', title: 'CRASHED', line: game.quip, detail: game.reason, color: BAD }
    }
  }
  if (phase === 'caught') missionPatch(ctx, W, H, game, thumbs)

  // Low on the left like a broadcast caption, clear of the ship coming in from the top and the tower in the middle
  if (msg) lowerThird(ctx, W, H, msg, canRestart(game) ? (touch ? 'Tap Thrust to go again' : 'Press ↑ or W to go again') : null)
}

// Round mission patch that pops in after a catch: the ship held in the chopsticks, 1–3 stars, the grade
function missionPatch(ctx, W, H, game, thumbs) {
  const k = game.t - game.endedAt - 1.4
  if (k < 0) return
  const pop = Math.min(1, k * 4)
  const scale = pop < 1 ? pop * 1.15 : 1 + Math.max(0, 0.15 - (k - 0.25) * 0.6)
  const r = (W < 640 ? 46 : 60) * Math.max(0, scale)
  const cx = W - (W < 640 ? 64 : 92) - (thumbs ? 120 : 0)
  const cy = H - STRIP - (W < 640 ? 60 : 82)
  const mph = game.contact.descent * MPH
  const stars = catchStars(mph)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-0.12)
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#0f1a2e'
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.lineWidth = r * 0.09
  ctx.strokeStyle = ORANGE
  ctx.stroke()
  ctx.lineWidth = r * 0.025
  ctx.strokeStyle = '#f2efe9'
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2)
  ctx.stroke()
  // Tower and arms on the right, the ship in between
  const u = r / 60
  ctx.fillStyle = '#5d6470'
  ctx.fillRect(10 * u, -34 * u, 8 * u, 50 * u)
  ctx.fillStyle = '#c9ccd2'
  ctx.fillRect(-14 * u, -16 * u, 26 * u, 3 * u)
  ctx.fillStyle = '#f2efe9'
  ctx.beginPath()
  ctx.moveTo(-6 * u, 16 * u)
  ctx.lineTo(-6 * u, -24 * u)
  ctx.quadraticCurveTo(-6 * u, -36 * u, -1 * u, -40 * u)
  ctx.quadraticCurveTo(4 * u, -36 * u, 4 * u, -24 * u)
  ctx.lineTo(4 * u, 16 * u)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#1b1c1f'
  ctx.fillRect(0, -26 * u, 4 * u, 42 * u)
  // Stars
  ctx.font = `${Math.round(13 * u)}px ${FONT}`
  ctx.textAlign = 'center'
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? '#ffd25a' : 'rgba(255,255,255,0.18)'
    ctx.fillText('★', (i - 1) * 15 * u, 32 * u)
  }
  ctx.fillStyle = '#fff'
  ctx.font = `700 ${Math.round(9 * u)}px ${COND}`
  ctx.fillText('SHIP CATCH', 0, -45 * u)
  ctx.fillStyle = ORANGE
  ctx.fillText(stars === 3 ? 'FLAWLESS' : stars === 2 ? 'NICE CATCH' : 'WE’LL TAKE IT', 0, 46 * u)
  ctx.restore()
}

// Broadcast lower-third above the telemetry strip: kicker, big title, line, optional detail and hint
function lowerThird(ctx, W, H, msg, hint, atTop = false) {
  const w = Math.min(W - 24, 640)
  const rows = 2 + (msg.detail ? 1 : 0) + (hint ? 1 : 0)
  const h = 36 + rows * 22 + 12
  const x = 0, y = atTop ? 44 : H - STRIP - h - 14
  const bg = ctx.createLinearGradient(x, 0, x + w, 0)
  bg.addColorStop(0, 'rgba(8,10,16,0.92)')
  bg.addColorStop(0.75, 'rgba(8,10,16,0.8)')
  bg.addColorStop(1, 'rgba(8,10,16,0)')
  ctx.fillStyle = bg
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = ORANGE
  ctx.fillRect(x, y, 6, h)
  const tx = 22, maxW = w - 60
  ctx.textAlign = 'left'
  ctx.fillStyle = ORANGE
  ctx.font = `700 11px ${COND}`
  ctx.fillText(msg.kicker, tx, y + 20)
  ctx.fillStyle = msg.color
  fitFont(ctx, msg.title, 800, 30, COND, maxW)
  ctx.fillText(msg.title, tx, y + 50)
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  fitFont(ctx, msg.line, 600, 16, FONT, maxW)
  let ly = y + 74
  ctx.fillText(msg.line, tx, ly)
  if (msg.detail) {
    ly += 22
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    fitFont(ctx, msg.detail, 500, 13, FONT, maxW)
    ctx.fillText(msg.detail, tx, ly)
  }
  if (hint) {
    ly += 22
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = `600 12px ${FONT}`
    ctx.fillText(hint, tx, ly)
  }
}
