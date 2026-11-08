// Super Heavy Catch drawing: camera, tower, booster and HUD on a 2D canvas. Reads game state, never changes it
// except for the camera.
import {
  ARM_LEN, ARM_Y, BOOSTER_H, BOOSTER_W, CATCH_X, FT, MOUNT, MPH, OCEAN_X, PIN_Y, SAFE_TILT, SAFE_VY,
  TOWER_H, TOWER_W, TOWER_X, cardReady, canRestart, catchGrade, pinPoint, slowMo, wrapAngle,
} from './physics'
import { BAD, GOOD, drawAttitude, drawBadge, drawCard, drawGroundArrow, drawInstruments } from '../GameKit/hud'
import {
  drawGroundFill, drawHills, drawLetterbox, drawNightSky, drawParticles, drawStreaks, lerp,
} from '../GameKit/scene'

const AMBER = '#fbbf24'

export function updateCamera(game, W, H, dt) {
  const b = game.booster
  const slow = slowMo(game)
  const top = b.y + BOOSTER_H
  // Start close on the booster, then zoom out to keep it and the ground in view on the way down
  const targetViewH = game.phase === 'ready' ? 200 : slow ? 80 : Math.min(380, Math.max(210, top * 1.15 + 30))
  const cam = game.cam || { viewH: targetViewH, left: 0, bottom: 0 }
  cam.viewH = lerp(cam.viewH, targetViewH, Math.min(1, dt * 3))
  const scale = H / cam.viewH
  const viewW = W / scale
  // As the booster gets low, pull the tower into view too
  const near = Math.min(1, Math.max(0, 1 - (b.y - 150) / 600))
  const focusX = slow ? CATCH_X : game.phase === 'ready' ? b.x : lerp(b.x, (b.x + TOWER_X + TOWER_W / 2) / 2, near)
  const targetLeft = focusX - viewW / 2
  const targetBottom = slow
    ? ARM_Y - cam.viewH * 0.55
    : top < cam.viewH * 0.85 ? -cam.viewH * 0.06 : b.y + BOOSTER_H / 2 - cam.viewH * 0.55
  cam.left = game.cam ? lerp(cam.left, targetLeft, Math.min(1, dt * 5)) : targetLeft
  cam.bottom = game.cam ? lerp(cam.bottom, targetBottom, Math.min(1, dt * 5)) : targetBottom
  cam.scale = scale
  game.cam = cam
  return cam
}

export function render(ctx, game, W, H, input) {
  const cam = game.cam
  const S = cam.scale
  const sx = (x) => (x - cam.left) * S
  const sy = (y) => H - (y - cam.bottom) * S
  const b = game.booster

  ctx.save()
  if (game.phase === 'crashed') {
    const k = Math.max(0, 1 - (game.t - game.endedAt) / 0.7)
    ctx.translate((Math.random() - 0.5) * 22 * k, (Math.random() - 0.5) * 22 * k)
  }

  drawNightSky(ctx, W, H, cam, S)
  const gy = sy(0)
  drawHills(ctx, W, H, cam, S, gy)
  if (gy < H) {
    drawGroundFill(ctx, W, H, gy)
    drawShore(ctx, sx, gy, W, H, S, game.t)
  }
  drawPad(ctx, sx, sy, S)
  drawTower(ctx, sx, sy, S, game.t)
  drawArm(ctx, sx, sy, S, game, 'back')

  const speed = Math.hypot(b.vx, b.vy)
  if (game.phase === 'flight' && speed > 30) drawStreaks(ctx, W, H, game.t, speed, Math.atan2(b.vy, b.vx))
  drawParticles(ctx, game.particles, sx, sy, S)
  if (game.phase !== 'crashed') drawBooster(ctx, game, input, sx(b.x), sy(b.y), S)
  drawArm(ctx, sx, sy, S, game, 'front')
  ctx.restore()

  if (slowMo(game)) drawLetterbox(ctx, W, H)
}

// Gulf of Mexico on the left, sand and a concrete pad around the tower
function drawShore(ctx, sx, gy, W, H, S, t) {
  const ox = sx(OCEAN_X)
  if (ox > 0) {
    ctx.fillStyle = '#0a1626'
    ctx.fillRect(0, gy - 1, ox, H - gy + 1)
    ctx.strokeStyle = 'rgba(140,180,230,0.18)'
    ctx.lineWidth = 1
    for (let i = 0; i < 4; i++) {
      const y = gy + 6 + i * 9
      const shift = ((t * 12 + i * 37) % 60) - 30
      ctx.beginPath()
      for (let x = -60 + shift; x < ox; x += 60) {
        ctx.moveTo(x, y)
        ctx.lineTo(Math.min(ox, x + 26), y)
      }
      ctx.stroke()
    }
    ctx.fillStyle = '#2a2a26'
    ctx.fillRect(ox, gy, Math.max(4, 12 * S), H - gy)
  }
}

// Concrete pad and the launch mount the booster is caught above
function drawPad(ctx, sx, sy, S) {
  const lw = (m, min) => Math.max(min, m * S)
  ctx.fillStyle = '#2b2f36'
  ctx.fillRect(sx(-60), sy(0), 90 * S, lw(1, 3))
  // Mount: six legs under a ring table
  ctx.fillStyle = '#4b5058'
  for (let i = 0; i < 4; i++) {
    const x = MOUNT.x0 + 1 + i * ((MOUNT.x1 - MOUNT.x0 - 4) / 3)
    ctx.fillRect(sx(x), sy(MOUNT.top - 2), lw(2, 2), (MOUNT.top - 2) * S)
  }
  ctx.fillStyle = '#6b7079'
  ctx.fillRect(sx(MOUNT.x0), sy(MOUNT.top), (MOUNT.x1 - MOUNT.x0) * S, lw(3, 3))
  ctx.fillStyle = '#9aa3b0'
  ctx.fillRect(sx(MOUNT.x0), sy(MOUNT.top), (MOUNT.x1 - MOUNT.x0) * S, lw(0.5, 1))
}

// Lattice tower with a lightning rod and blinking red aircraft lights
function drawTower(ctx, sx, sy, S, t) {
  const lw = (m, min) => Math.max(min, m * S)
  const x0 = TOWER_X, x1 = TOWER_X + TOWER_W
  ctx.fillStyle = 'rgba(40,44,52,0.55)'
  ctx.fillRect(sx(x0), sy(TOWER_H), TOWER_W * S, TOWER_H * S)
  ctx.strokeStyle = '#9aa3b0'
  ctx.lineWidth = lw(0.35, 1.5)
  ctx.beginPath()
  ctx.moveTo(sx(x0), sy(0)); ctx.lineTo(sx(x0), sy(TOWER_H))
  ctx.moveTo(sx(x1), sy(0)); ctx.lineTo(sx(x1), sy(TOWER_H))
  ctx.moveTo(sx(x0), sy(TOWER_H)); ctx.lineTo(sx(x1), sy(TOWER_H))
  ctx.moveTo(sx(x0 + TOWER_W / 2), sy(TOWER_H)); ctx.lineTo(sx(x0 + TOWER_W / 2), sy(TOWER_H + 14))
  ctx.stroke()
  ctx.lineWidth = lw(0.15, 0.8)
  ctx.beginPath()
  for (let y = 0; y < TOWER_H - 0.1; y += TOWER_W) {
    const y2 = Math.min(TOWER_H, y + TOWER_W)
    ctx.moveTo(sx(x0), sy(y)); ctx.lineTo(sx(x1), sy(y2))
    ctx.moveTo(sx(x1), sy(y)); ctx.lineTo(sx(x0), sy(y2))
    ctx.moveTo(sx(x0), sy(y2)); ctx.lineTo(sx(x1), sy(y2))
  }
  ctx.stroke()
  // Chopstick carriage riding on the tower face
  ctx.fillStyle = '#5b616b'
  ctx.fillRect(sx(x0 - 1), sy(ARM_Y + 7), (TOWER_W + 2) * S, 10 * S)
  // Aircraft warning lights
  const on = Math.sin(t * 3) > 0
  ctx.fillStyle = on ? '#ff3b3b' : '#5a1414'
  for (const [x, y] of [[x0, TOWER_H], [x1, TOWER_H], [x0 + TOWER_W / 2, TOWER_H + 14]]) {
    ctx.beginPath()
    ctx.arc(sx(x), sy(y), Math.max(2, 0.7 * S), 0, Math.PI * 2)
    ctx.fill()
  }
}

// One chopstick arm. The back arm is drawn behind the booster and the front one over it, so the booster
// sits between them; once caught, the arms dip a little under the weight.
function drawArm(ctx, sx, sy, S, game, side) {
  const caught = game.phase === 'caught'
  const k = caught ? game.t - game.endedAt : 0
  const dip = caught ? Math.sin(Math.min(k * 9, Math.PI)) * 0.6 * Math.exp(-k * 2) : 0
  const front = side === 'front'
  const y = ARM_Y + (front ? -0.6 : 0.6) - dip
  const x0 = TOWER_X, x1 = TOWER_X - ARM_LEN
  const h = 3.4
  ctx.fillStyle = front ? '#aab2be' : '#59606a'
  ctx.beginPath()
  ctx.moveTo(sx(x0), sy(y))
  ctx.lineTo(sx(x1), sy(y))
  ctx.lineTo(sx(x1 + 2), sy(y - h))
  ctx.lineTo(sx(x0), sy(y - h))
  ctx.closePath()
  ctx.fill()
  if (front) {
    ctx.strokeStyle = '#59606a'
    ctx.lineWidth = Math.max(0.8, 0.15 * S)
    ctx.beginPath()
    for (let x = x1 + 2; x < x0 - 1; x += 3) {
      ctx.moveTo(sx(x), sy(y - h)); ctx.lineTo(sx(x + 1.5), sy(y)); ctx.lineTo(sx(x + 3), sy(y - h))
    }
    ctx.stroke()
    // Catch rails light up green while the booster is lined up above them
    const [px, py] = pinPoint(game.booster)
    const lined = game.phase === 'flight' && Math.abs(px - CATCH_X) < 3 && py > ARM_Y && py - ARM_Y < 60
    ctx.fillStyle = caught || lined ? GOOD : '#3a3f47'
    ctx.fillRect(sx(CATCH_X - 4), sy(y + 0.4), 8 * S, Math.max(2, 0.5 * S))
  }
}

// Stainless steel booster, drawn from the engines (origin) up; 9 m wide, 70 m tall
function drawBooster(ctx, game, input, x, y, S) {
  const b = game.booster
  const w = BOOSTER_W / 2
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(S, -S)
  ctx.rotate(b.angle)

  // Engine plume while firing
  if (game.phase === 'flight' && input.thrust) {
    ctx.globalCompositeOperation = 'lighter'
    for (const off of [-2.6, 0, 2.6]) {
      const len = 9 + Math.random() * 5
      const g = ctx.createLinearGradient(0, -1.5, 0, -1.5 - len)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.3, 'rgba(200,215,255,0.85)')
      g.addColorStop(1, 'rgba(150,170,255,0)')
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

  // Engine bells
  ctx.fillStyle = '#2a2d33'
  for (const off of [-2.6, 0, 2.6]) {
    ctx.beginPath()
    ctx.moveTo(off - 0.7, 0.6)
    ctx.lineTo(off + 0.7, 0.6)
    ctx.lineTo(off + 1.1, -1.5)
    ctx.lineTo(off - 1.1, -1.5)
    ctx.closePath()
    ctx.fill()
  }

  // Steel body with a highlight down the left side
  const steel = ctx.createLinearGradient(-w, 0, w, 0)
  steel.addColorStop(0, '#9aa0a8')
  steel.addColorStop(0.3, '#eef1f4')
  steel.addColorStop(0.6, '#c2c7ce')
  steel.addColorStop(1, '#7d838c')
  ctx.fillStyle = steel
  ctx.fillRect(-w, 0.5, BOOSTER_W, BOOSTER_H - 0.5)
  // Weld rings
  ctx.strokeStyle = 'rgba(60,64,72,0.25)'
  ctx.lineWidth = 0.08
  ctx.beginPath()
  for (let r = 4; r < BOOSTER_H - 6; r += 3.6) {
    ctx.moveTo(-w, r)
    ctx.lineTo(w, r)
  }
  ctx.stroke()
  // Soot from reentry, heaviest near the engines
  const soot = ctx.createLinearGradient(0, 0, 0, 34)
  soot.addColorStop(0, 'rgba(32,26,22,0.85)')
  soot.addColorStop(0.25, 'rgba(32,26,22,0.45)')
  soot.addColorStop(1, 'rgba(32,26,22,0)')
  ctx.fillStyle = soot
  ctx.fillRect(-w, 0.5, BOOSTER_W, 34)
  // Chines running up the sides
  ctx.fillStyle = 'rgba(70,74,82,0.6)'
  ctx.fillRect(-w - 0.35, 6, 0.35, 44)
  ctx.fillRect(w, 6, 0.35, 44)
  // Vented hot-staging ring on top
  ctx.fillStyle = '#3a3e45'
  ctx.fillRect(-w, BOOSTER_H - 4.5, BOOSTER_W, 4.5)
  ctx.fillStyle = '#c9ced5'
  for (let vx = -w + 0.5; vx < w - 0.4; vx += 1.1) ctx.fillRect(vx, BOOSTER_H - 3.6, 0.5, 2.6)
  // Grid fins and the catch pins under them
  ctx.fillStyle = '#2c3036'
  for (const s of [-1, 1]) {
    const fx = s > 0 ? w : -w - 2.6
    ctx.fillRect(fx, PIN_Y + 2, 2.6, 6)
  }
  ctx.strokeStyle = '#6b7079'
  ctx.lineWidth = 0.12
  ctx.beginPath()
  for (const s of [-1, 1]) {
    const fx = s > 0 ? w : -w - 2.6
    for (let i = 0.65; i < 2.6; i += 0.65) { ctx.moveTo(fx + i, PIN_Y + 2); ctx.lineTo(fx + i, PIN_Y + 8) }
    for (let j = 1.2; j < 6; j += 1.2) { ctx.moveTo(fx, PIN_Y + 2 + j); ctx.lineTo(fx + 2.6, PIN_Y + 2 + j) }
  }
  ctx.stroke()
  ctx.fillStyle = '#1f2329'
  ctx.fillRect(-w - 1.2, PIN_Y - 0.6, 1.2, 1.2)
  ctx.fillRect(w, PIN_Y - 0.6, 1.2, 1.2)
  // Thin outline keeps the edges crisp against the night
  ctx.strokeStyle = 'rgba(20,22,26,0.6)'
  ctx.lineWidth = 0.12
  ctx.strokeRect(-w, 0.5, BOOSTER_W, BOOSTER_H - 0.5)
  ctx.restore()
}

// touch: show button wording instead of keyboard keys
export function drawHud(ctx, game, W, H, { touch = false } = {}) {
  const b = game.booster
  const flying = game.phase === 'flight'
  const panelH = drawInstruments(ctx, {
    speed: Math.hypot(b.vx, b.vy),
    altitude: b.y,
    descent: flying ? -b.vy : null,
    safeDescent: SAFE_VY,
  })
  if (flying) {
    drawAttitude(ctx, W, wrapAngle(b.angle), SAFE_TILT)
    if (game.cam.bottom > 0) drawGroundArrow(ctx, W, H, b.y)
    // How far the catch pins are from the sweet spot on the chopsticks
    const off = pinPoint(b)[0] - CATCH_X
    const ft = Math.round(Math.abs(off) * FT)
    const lined = Math.abs(off) < 3
    drawBadge(ctx, 12 + panelH + 8, lined ? 'TARGET  LINED UP' : `TARGET  ${off > 0 ? '←' : '→'} ${ft} FT`, lined ? 'rgba(22,163,74,0.85)' : undefined)
  }

  let msg = null
  if (game.phase === 'ready') {
    msg = { title: 'SUPER HEAVY CATCH', line: touch ? 'Hold Thrust to start the landing burn' : 'Hold ↑ or W to start the landing burn', color: '#f8fafc' }
  } else if (cardReady(game)) {
    const c = game.contact
    if (game.phase === 'caught') {
      const mph = c.descent * MPH
      msg = {
        title: catchGrade(mph),
        line: `${mph.toFixed(1)} mph contact · ${Math.round(Math.abs(c.off) * FT)} ft off center · ${Math.round((c.tilt * 180) / Math.PI)}° tilt`,
        color: GOOD,
      }
    } else if (game.phase === 'landed') {
      msg = {
        title: 'PLAN B: GROUND LANDING',
        line: c.onMount ? 'Parked it on the launch mount. The chopsticks wanted a hug.' : 'Soft landing, but the tower wanted a hug.',
        detail: `${(c.descent * MPH).toFixed(1)} mph touchdown`,
        color: AMBER,
      }
    } else {
      msg = { title: 'CRASHED', line: game.quip, detail: game.reason, color: BAD }
    }
  }
  if (msg) drawCard(ctx, W, H, msg, { again: canRestart(game), touch, minTop: 12 + panelH + 16 })
}
