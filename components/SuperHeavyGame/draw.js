// Super Heavy Catch, livestream look: golden-hour Starbase with a webcast-style overlay (LIVE clock, telemetry
// strip with the 33-engine diagram, mission timeline, tower cam and lower-third results).
// Reads game state, never changes it except for the camera.
import {
  ARM_LEN, ARM_Y, BOOSTER_H, BOOSTER_W, CATCH_X, FT, MOUNT, MPH, OCEAN_X, PIN_Y, SAFE_TILT, SAFE_VY,
  TOWER_H, TOWER_W, TOWER_X, cardReady, canRestart, catchGrade, pinPoint, slowMo,
} from './physics'
import { drawHills, drawParticles, hash, lerp, rrect } from '../GameKit/scene'

const FONT = 'Saira, system-ui, sans-serif'
const COND = '"Saira Condensed", "Arial Narrow", system-ui, sans-serif'
const ORANGE = '#ff7a45'
const GOOD = '#7cffb2'
const BAD = '#ff6b6b'
const AMBER = '#ffc56b'
const STRIP = 104 // height of the bottom telemetry strip

export function updateCamera(game, W, H, dt) {
  const b = game.booster
  const slow = slowMo(game)
  // Frame the booster and the tower together so you always see where you're headed.
  // The usable area sits between a top margin and the telemetry strip.
  const topPad = 44, usableH = Math.max(80, H - STRIP - topPad)
  const x0 = Math.min(b.x - 25, TOWER_X - ARM_LEN - 20)
  const x1 = Math.max(b.x + 25, TOWER_X + TOWER_W + 25)
  const y1 = Math.max(TOWER_H + 20, b.y + BOOSTER_H + 20)
  // Slow motion zooms in on the chopsticks
  const box = slow ? { x0: CATCH_X - 45, x1: CATCH_X + 45, y0: ARM_Y - 60, y1: ARM_Y + 45 } : { x0, x1, y0: 0, y1 }
  const scaleTarget = Math.min(usableH / (box.y1 - box.y0), W / (box.x1 - box.x0))
  const cam = game.cam || { scale: scaleTarget, left: 0, bottom: 0 }
  cam.scale = game.cam ? lerp(cam.scale, scaleTarget, Math.min(1, dt * 3)) : scaleTarget
  const S = cam.scale
  const targetLeft = (box.x0 + box.x1) / 2 - W / S / 2
  // Ground sits just above the telemetry strip; the box is centered in the space above it
  const targetBottom = (box.y0 + box.y1) / 2 - (usableH / 2 + STRIP) / S
  cam.left = game.cam ? lerp(cam.left, targetLeft, Math.min(1, dt * 5)) : targetLeft
  cam.bottom = game.cam ? lerp(cam.bottom, targetBottom, Math.min(1, dt * 5)) : targetBottom
  cam.viewH = H / S
  game.cam = cam
  return cam
}

const CLOUDS = Array.from({ length: 26 }, (_, i) => ({
  x: -1600 + i * 125 + hash(i + 3) * 80,
  y: 260 + hash(i + 40) * 700,
  w: 70 + hash(i + 80) * 120,
}))

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
  const b = game.booster
  if ((game.phase === 'flight' && b.y < 450) || game.phase === 'caught') {
    const w = Math.round(Math.min(W * 0.3, 300)), h = Math.round(w * 0.6)
    const x = W - w - 12, y = 12
    const viewH = 95, S = h / viewH
    ctx.save()
    rrect(ctx, x, y, w, h, 6)
    ctx.clip()
    ctx.translate(x, y)
    drawWorld(ctx, game, input, { W: w, H: h, left: CATCH_X - w / S / 2, bottom: ARM_Y - 15 - viewH / 2, S })
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
}

// Everything in the scene, for a view { W, H, left, bottom, S } (meters → pixels)
function drawWorld(ctx, game, input, v) {
  const { W, H, S } = v
  const sx = (x) => (x - v.left) * S
  const sy = (y) => H - (y - v.bottom) * S
  const gy = sy(0)
  const horizon = gy > H ? H + (gy - H) * 0.3 : gy

  drawSky(ctx, v, horizon)
  drawHills(ctx, W, H, v, S, gy, ['#4a2a4a', '#2c1a2e'])
  if (gy < H) drawShore(ctx, v, sx, gy, horizon, game.t)
  drawPad(ctx, sx, sy, S)
  drawTower(ctx, sx, sy, S, game.t)
  drawArm(ctx, sx, sy, S, game, 'back')
  drawParticles(ctx, game.particles, sx, sy, S)
  if (game.phase !== 'crashed') drawBooster(ctx, game, input, sx(game.booster.x), sy(game.booster.y), S)
  drawArm(ctx, sx, sy, S, game, 'front')
  if ((game.phase === 'flight' && !slowMo(game)) || game.phase === 'ready') drawTargetMarker(ctx, sx(CATCH_X), sy(ARM_Y), game.t)
}

// Pulsing "CATCH HERE" chevron over the chopsticks so the goal is obvious from the first frame
function drawTargetMarker(ctx, x, y, t) {
  const bob = Math.sin(t * 4) * 3
  const top = y - 26 + bob
  ctx.save()
  ctx.shadowColor = 'rgba(124,255,178,0.8)'
  ctx.shadowBlur = 8
  ctx.strokeStyle = GOOD
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 8, top - 8)
  ctx.lineTo(x, top)
  ctx.lineTo(x + 8, top - 8)
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.fillStyle = GOOD
  ctx.textAlign = 'center'
  ctx.font = `700 11px ${COND}`
  ctx.fillText('CATCH HERE', x, top - 14)
  ctx.restore()
}

// Golden-hour sky anchored to the horizon, a low sun with a big glow, and long clouds lit from below
function drawSky(ctx, v, horizon) {
  const { W, H, S } = v
  // Keep some of the sunset glow on screen even high up
  const skyHorizon = Math.min(horizon, H * 1.45)
  const g = ctx.createLinearGradient(0, skyHorizon - H * 1.5, 0, skyHorizon)
  g.addColorStop(0, '#140e2e')
  g.addColorStop(0.38, '#3d2160')
  g.addColorStop(0.62, '#9a3b70')
  g.addColorStop(0.8, '#e5634a')
  g.addColorStop(0.93, '#ffab58')
  g.addColorStop(1, '#ffd88a')
  ctx.fillStyle = g
  ctx.fillRect(-30, -30, W + 60, H + 60)

  const sunX = W * 0.2 - (v.left - CATCH_X) * S * 0.004
  const sunY = skyHorizon - H * 0.06
  const r = Math.max(10, H * 0.05)
  if (sunY - r * 12 < H) {
    const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.9)
    glow.addColorStop(0, 'rgba(255,190,110,0.55)')
    glow.addColorStop(0.3, 'rgba(255,140,90,0.18)')
    glow.addColorStop(1, 'rgba(255,140,90,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#fff3d1'
    ctx.beginPath()
    ctx.arc(sunX, sunY, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Clouds sit on a far layer: drawn smaller and scrolling slower than the scene
  const far = Math.min(S, 0.9) * 0.6
  const cx = v.left + W / (2 * S), cy = v.bottom + H / (2 * S)
  for (const c of CLOUDS) {
    const x = W / 2 + (c.x - cx * 0.3) * far, y = H / 2 - (c.y - cy * 0.3) * far
    const w = c.w * far, h = Math.max(2, w * 0.07)
    if (x + w < 0 || x - w > W || y < -h * 4 || y > H + h * 4) continue
    ctx.fillStyle = 'rgba(120,60,110,0.35)'
    ctx.beginPath()
    ctx.ellipse(x, y, w / 2, h, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,170,120,0.45)'
    ctx.beginPath()
    ctx.ellipse(x + w * 0.04, y + h * 0.45, w * 0.42, h * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Dark warm ground, and the Gulf on the left with sun glitter on the water
function drawShore(ctx, v, sx, gy, horizon, t) {
  const { W, H } = v
  const ground = ctx.createLinearGradient(0, gy, 0, H)
  ground.addColorStop(0, '#2a1824')
  ground.addColorStop(1, '#0e0810')
  ctx.fillStyle = ground
  ctx.fillRect(-30, gy, W + 60, H - gy + 30)

  const ox = sx(OCEAN_X)
  if (ox <= 0) return
  const water = ctx.createLinearGradient(0, gy, 0, H)
  water.addColorStop(0, '#d9774f')
  water.addColorStop(0.25, '#6b3350')
  water.addColorStop(1, '#1c1026')
  ctx.fillStyle = water
  ctx.fillRect(-30, gy - 1, ox + 30, H - gy + 31)
  ctx.lineWidth = 1.5
  for (let i = 0; i < 46; i++) {
    const depth = hash(i + 9)
    const x = W * 0.2 + (hash(i) - 0.5) * W * (0.08 + depth * 0.3)
    const y = gy + 3 + depth * (H - gy)
    if (x > ox - 4) continue
    const a = 0.25 + 0.55 * Math.abs(Math.sin(t * 2.5 + i * 1.7))
    ctx.strokeStyle = `rgba(255,220,160,${a})`
    ctx.beginPath()
    ctx.moveTo(x - 4 - depth * 10, y)
    ctx.lineTo(x + 4 + depth * 10, y)
    ctx.stroke()
  }
  ctx.fillStyle = '#5a3a36'
  ctx.fillRect(ox, gy, Math.max(3, 10 * v.S), H - gy)
}

// Concrete pad and the launch mount under the catch point, in silhouette
function drawPad(ctx, sx, sy, S) {
  const lw = (m, min) => Math.max(min, m * S)
  ctx.fillStyle = '#1b1119'
  ctx.fillRect(sx(-60), sy(0), 90 * S, lw(1, 3))
  for (let i = 0; i < 4; i++) {
    const x = MOUNT.x0 + 1 + i * ((MOUNT.x1 - MOUNT.x0 - 4) / 3)
    ctx.fillRect(sx(x), sy(MOUNT.top - 2), lw(2, 2), (MOUNT.top - 2) * S)
  }
  ctx.fillRect(sx(MOUNT.x0), sy(MOUNT.top), (MOUNT.x1 - MOUNT.x0) * S, lw(3, 3))
  ctx.fillStyle = 'rgba(255,170,110,0.6)'
  ctx.fillRect(sx(MOUNT.x0), sy(MOUNT.top), (MOUNT.x1 - MOUNT.x0) * S, lw(0.4, 1))
}

// Tower in silhouette, sunlit along its left edge, with blinking red aircraft lights
function drawTower(ctx, sx, sy, S, t) {
  const lw = (m, min) => Math.max(min, m * S)
  const x0 = TOWER_X, x1 = TOWER_X + TOWER_W
  ctx.fillStyle = 'rgba(24,14,24,0.75)'
  ctx.fillRect(sx(x0), sy(TOWER_H), TOWER_W * S, TOWER_H * S)
  ctx.strokeStyle = '#3a2533'
  ctx.lineWidth = lw(0.15, 0.8)
  ctx.beginPath()
  for (let y = 0; y < TOWER_H - 0.1; y += TOWER_W) {
    const y2 = Math.min(TOWER_H, y + TOWER_W)
    ctx.moveTo(sx(x0), sy(y)); ctx.lineTo(sx(x1), sy(y2))
    ctx.moveTo(sx(x1), sy(y)); ctx.lineTo(sx(x0), sy(y2))
    ctx.moveTo(sx(x0), sy(y2)); ctx.lineTo(sx(x1), sy(y2))
  }
  ctx.stroke()
  ctx.strokeStyle = '#24161f'
  ctx.lineWidth = lw(0.4, 1.5)
  ctx.beginPath()
  ctx.moveTo(sx(x1), sy(0)); ctx.lineTo(sx(x1), sy(TOWER_H))
  ctx.moveTo(sx(x0 + TOWER_W / 2), sy(TOWER_H)); ctx.lineTo(sx(x0 + TOWER_W / 2), sy(TOWER_H + 14))
  ctx.stroke()
  ctx.strokeStyle = '#ff9a5a'
  ctx.beginPath()
  ctx.moveTo(sx(x0), sy(0)); ctx.lineTo(sx(x0), sy(TOWER_H)); ctx.lineTo(sx(x1), sy(TOWER_H))
  ctx.stroke()
  ctx.fillStyle = '#2b1b27'
  ctx.fillRect(sx(x0 - 1), sy(ARM_Y + 7), (TOWER_W + 2) * S, 10 * S)
  const on = Math.sin(t * 3) > 0
  ctx.fillStyle = on ? '#ff3b3b' : '#5a1414'
  for (const [x, y] of [[x0, TOWER_H], [x1, TOWER_H], [x0 + TOWER_W / 2, TOWER_H + 14]]) {
    ctx.beginPath()
    ctx.arc(sx(x), sy(y), Math.max(2, 0.7 * S), 0, Math.PI * 2)
    ctx.fill()
  }
}

// One chopstick arm: the back one behind the booster, the front one over it. They dip a little once caught.
function drawArm(ctx, sx, sy, S, game, side) {
  const caught = game.phase === 'caught'
  const k = caught ? game.t - game.endedAt : 0
  const dip = caught ? Math.sin(Math.min(k * 9, Math.PI)) * 0.6 * Math.exp(-k * 2) : 0
  const front = side === 'front'
  const y = ARM_Y + (front ? -0.6 : 0.6) - dip
  const x0 = TOWER_X, x1 = TOWER_X - ARM_LEN
  const h = 3.4
  ctx.fillStyle = front ? '#3a2633' : '#22151f'
  ctx.beginPath()
  ctx.moveTo(sx(x0), sy(y))
  ctx.lineTo(sx(x1), sy(y))
  ctx.lineTo(sx(x1 + 2), sy(y - h))
  ctx.lineTo(sx(x0), sy(y - h))
  ctx.closePath()
  ctx.fill()
  if (front) {
    ctx.fillStyle = '#ffb070'
    ctx.fillRect(sx(x1), sy(y), ARM_LEN * S, Math.max(1, 0.3 * S))
    const [px, py] = pinPoint(game.booster)
    const lined = game.phase === 'flight' && Math.abs(px - CATCH_X) < 3 && py > ARM_Y && py - ARM_Y < 60
    if (caught || lined) {
      ctx.fillStyle = GOOD
      ctx.fillRect(sx(CATCH_X - 4), sy(y + 0.4), 8 * S, Math.max(2, 0.5 * S))
    }
  }
}

// Stainless steel booster in warm evening light, drawn from the engines up
function drawBooster(ctx, game, input, x, y, S) {
  const b = game.booster
  const w = BOOSTER_W / 2
  // Draw at least ~70px tall so it stays readable when the camera is zoomed out
  const vis = Math.max(1, 70 / (BOOSTER_H * S))
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(S * vis, -S * vis)
  ctx.rotate(b.angle)

  if (game.phase === 'flight' && input.thrust) {
    ctx.globalCompositeOperation = 'lighter'
    for (const off of [-2.6, 0, 2.6]) {
      const len = 9 + Math.random() * 5
      const g = ctx.createLinearGradient(0, -1.5, 0, -1.5 - len)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.3, 'rgba(255,200,140,0.85)')
      g.addColorStop(1, 'rgba(255,120,60,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(off - 1, -1.5)
      ctx.quadraticCurveTo(off - 1.6, -1.5 - len * 0.5, off, -1.5 - len)
      ctx.quadraticCurveTo(off + 1.6, -1.5 - len * 0.5, off + 1, -1.5)
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  ctx.fillStyle = '#1e141b'
  for (const off of [-2.6, 0, 2.6]) {
    ctx.beginPath()
    ctx.moveTo(off - 0.7, 0.6)
    ctx.lineTo(off + 0.7, 0.6)
    ctx.lineTo(off + 1.1, -1.5)
    ctx.lineTo(off - 1.1, -1.5)
    ctx.closePath()
    ctx.fill()
  }

  // Sunlit on the left (the sun is low in the west), in shadow on the right
  const steel = ctx.createLinearGradient(-w, 0, w, 0)
  steel.addColorStop(0, '#ffd9b0')
  steel.addColorStop(0.28, '#f1c39c')
  steel.addColorStop(0.62, '#9a7b7f')
  steel.addColorStop(1, '#3b2b38')
  ctx.fillStyle = steel
  ctx.fillRect(-w, 0.5, BOOSTER_W, BOOSTER_H - 0.5)
  ctx.strokeStyle = 'rgba(60,40,50,0.25)'
  ctx.lineWidth = 0.08
  ctx.beginPath()
  for (let r = 4; r < BOOSTER_H - 6; r += 3.6) {
    ctx.moveTo(-w, r)
    ctx.lineTo(w, r)
  }
  ctx.stroke()
  const soot = ctx.createLinearGradient(0, 0, 0, 34)
  soot.addColorStop(0, 'rgba(30,20,22,0.85)')
  soot.addColorStop(0.25, 'rgba(30,20,22,0.45)')
  soot.addColorStop(1, 'rgba(30,20,22,0)')
  ctx.fillStyle = soot
  ctx.fillRect(-w, 0.5, BOOSTER_W, 34)
  ctx.fillStyle = '#2e1f2a'
  ctx.fillRect(-w, BOOSTER_H - 4.5, BOOSTER_W, 4.5)
  ctx.fillStyle = '#ffcc99'
  for (let vx = -w + 0.5; vx < w - 0.4; vx += 1.1) ctx.fillRect(vx, BOOSTER_H - 3.6, 0.5, 2.6)
  ctx.fillStyle = '#24171f'
  for (const s of [-1, 1]) ctx.fillRect(s > 0 ? w : -w - 2.6, PIN_Y + 2, 2.6, 6)
  ctx.strokeStyle = '#7a5a62'
  ctx.lineWidth = 0.12
  ctx.beginPath()
  for (const s of [-1, 1]) {
    const fx = s > 0 ? w : -w - 2.6
    for (let i = 0.65; i < 2.6; i += 0.65) { ctx.moveTo(fx + i, PIN_Y + 2); ctx.lineTo(fx + i, PIN_Y + 8) }
    for (let j = 1.2; j < 6; j += 1.2) { ctx.moveTo(fx, PIN_Y + 2 + j); ctx.lineTo(fx + 2.6, PIN_Y + 2 + j) }
  }
  ctx.stroke()
  ctx.fillStyle = '#1a1016'
  ctx.fillRect(-w - 1.2, PIN_Y - 0.6, 1.2, 1.2)
  ctx.fillRect(w, PIN_Y - 0.6, 1.2, 1.2)
  ctx.restore()
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

// The 33 Raptors seen from below: inner 3 and middle 10 light up during the landing burn
function engines(ctx, cx, cy, firing) {
  const rings = [[3, 5, 2.6, true], [10, 14, 2.6, true], [20, 24, 2.1, false]]
  for (const [n, r, size, gimbal] of rings) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2
      const lit = firing && gimbal
      ctx.fillStyle = lit ? '#fff' : 'rgba(255,255,255,0.22)'
      if (lit) { ctx.shadowColor = 'rgba(255,200,140,0.9)'; ctx.shadowBlur = 6 }
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, size, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = `600 9px ${COND}`
  ctx.fillText('ENGINES', cx, cy - 36)
}

function readout(ctx, x, y, label, value, color = '#fff') {
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = `600 10px ${COND}`
  ctx.fillText(label, x, y)
  ctx.fillStyle = color
  ctx.font = `700 19px ${FONT}`
  ctx.fillText(value, x, y + 22)
}

export function drawHud(ctx, game, W, H, { touch = false } = {}) {
  const b = game.booster
  const flying = game.phase === 'flight'
  const [px, py] = pinPoint(b)

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
  ctx.fillText(clock(412 + game.t), 68, 27)
  if (slowMo(game)) {
    ctx.fillStyle = AMBER
    ctx.font = `700 12px ${COND}`
    ctx.fillText('SLOW MOTION', 170, 27)
  }
  ctx.shadowBlur = 0

  // Telemetry strip
  const top = H - STRIP
  const fade = ctx.createLinearGradient(0, top - 30, 0, H)
  fade.addColorStop(0, 'rgba(12,6,16,0)')
  fade.addColorStop(0.35, 'rgba(12,6,16,0.72)')
  fade.addColorStop(1, 'rgba(12,6,16,0.9)')
  ctx.fillStyle = fade
  ctx.fillRect(0, top - 30, W, STRIP + 30)
  const cy = H - 44
  // On a phone held sideways the thumb buttons sit in the corners, so start the telemetry after them
  const thumbs = touch && H < 520
  const ox = thumbs ? 184 : 0
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'left'
  ctx.font = `700 11px ${COND}`
  ctx.fillText('SUPER HEAVY', 16 + ox, top + 2)
  const speed = Math.hypot(b.vx, b.vy)
  gauge(ctx, 46 + ox, cy, 26, speed / 120, String(Math.round(speed * MPH)), 'MPH', 'SPEED')
  const alt = Math.max(0, b.y)
  gauge(ctx, 116 + ox, cy, 26, alt / 1000, String(Math.round(alt * FT)), 'FT', 'ALTITUDE')
  engines(ctx, 186 + ox, cy, game.firing)

  // Catch readouts
  const off = px - CATCH_X
  const descent = -b.vy
  const rx = 236 + ox
  if (W - ox >= 420) {
    const gap = thumbs ? 0.8 : 1
    readout(ctx, rx, top + 20, 'DESCENT', flying ? `${Math.max(0, Math.round(descent * MPH))} mph` : '—', !flying ? '#fff' : descent <= SAFE_VY ? GOOD : BAD)
    readout(ctx, rx + 92 * gap, top + 20, 'TILT', `${Math.round((Math.abs(b.angle) * 180) / Math.PI)}°`, Math.abs(b.angle) <= SAFE_TILT ? GOOD : BAD)
    const lined = Math.abs(off) < 3
    readout(ctx, rx + 145 * gap, top + 20, 'TARGET', lined ? 'LINED UP' : `${off > 0 ? '←' : '→'} ${Math.round(Math.abs(off) * FT)} ft`, lined ? GOOD : '#fff')
  }

  // Mission timeline on wide screens
  if (W >= 760 && !thumbs) {
    const x0 = W - 290, x1 = W - 26, ly = H - 50
    const stages = ['BOOSTBACK', 'LANDING BURN', 'CATCH']
    const progress = game.phase === 'caught' ? 1 : game.phase === 'ready' ? 0 : 0.5 + 0.5 * Math.min(1, Math.max(0, 1 - (py - ARM_Y) / 850))
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
    stages.forEach((s, i) => {
      const x = lerp(x0, x1, i / 2)
      const done = progress >= i / 2
      ctx.fillStyle = done ? '#fff' : '#3a2a3a'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x, ly, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = done ? '#fff' : 'rgba(255,255,255,0.55)'
      ctx.textAlign = i === 0 ? 'left' : i === 2 ? 'right' : 'center'
      ctx.font = `700 10px ${COND}`
      ctx.fillText(s, i === 0 ? x - 5 : i === 2 ? x + 5 : x, ly + 20)
    })
    if (game.phase !== 'ready' && game.phase !== 'caught') {
      const pulse = 4 + 2 * Math.abs(Math.sin(game.t * 4))
      ctx.fillStyle = ORANGE
      ctx.beginPath()
      ctx.arc(lerp(x0, x1, progress), ly, pulse, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Lower-third: the start title and results
  let msg = null
  if (game.phase === 'ready') {
    msg = { kicker: 'STARSHIP FLIGHT TEST', title: 'BOOSTER CATCH', line: touch ? 'Hold Thrust to start the landing burn' : 'Hold ↑ or W to start the landing burn', color: '#fff' }
  } else if (cardReady(game)) {
    const c = game.contact
    if (game.phase === 'caught') {
      const mph = c.descent * MPH
      msg = {
        kicker: 'BOOSTER CATCH CONFIRMED',
        title: catchGrade(mph),
        line: `${mph.toFixed(1)} mph contact · ${Math.round(Math.abs(c.off) * FT)} ft off center · ${Math.round((c.tilt * 180) / Math.PI)}° tilt`,
        color: GOOD,
      }
    } else if (game.phase === 'landed') {
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
  // The start title sits at the top so it doesn't hide the tower; results sit low like a broadcast caption
  if (msg) lowerThird(ctx, W, H, msg, canRestart(game) ? (touch ? 'Tap Thrust to go again' : 'Press ↑ or W to go again') : null, game.phase === 'ready')
}

// Broadcast lower-third above the telemetry strip: kicker, big title, line, optional detail and hint
function lowerThird(ctx, W, H, msg, hint, atTop = false) {
  const w = Math.min(W - 24, 640)
  const rows = 2 + (msg.detail ? 1 : 0) + (hint ? 1 : 0)
  const h = 36 + rows * 22 + 12
  const x = 0, y = atTop ? 44 : H - STRIP - h - 14
  const bg = ctx.createLinearGradient(x, 0, x + w, 0)
  bg.addColorStop(0, 'rgba(14,8,18,0.92)')
  bg.addColorStop(0.75, 'rgba(14,8,18,0.8)')
  bg.addColorStop(1, 'rgba(14,8,18,0)')
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
