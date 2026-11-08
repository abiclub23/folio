// Super Heavy Catch, 1979 arcade look: glowing green vector wireframes on black, amber for warnings,
// chunky pixel text, and a CRT finish (scanlines, bloom, vignette). Same camera as the livestream version.
import {
  ARM_LEN, ARM_Y, BOOSTER_H, BOOSTER_W, CATCH_X, FT, MOUNT, MPH, OCEAN_X, PIN_Y, SAFE_TILT, SAFE_VY,
  TOWER_H, TOWER_W, TOWER_X, cardReady, canRestart, catchGrade, pinPoint, slowMo,
} from './physics'
import { hash } from '../GameKit/scene'

export { updateCamera } from './draw'

const PIXEL = '"Press Start 2P", ui-monospace, monospace'
const GREEN = '#39ff6a'
const DIM = 'rgba(57,255,106,0.35)'
const AMBER = '#ffb000'
const RED = '#ff4d3d'

// Score for this browser tab: catches add points, softer catches add more
let score = 0
let scoredGame = null

// Draw strokes with a phosphor glow
function glow(ctx, color, width = 1.5, blur = 8) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.shadowColor = color
  ctx.shadowBlur = blur
}

export function render(ctx, game, W, H, input) {
  const cam = game.cam
  const S = cam.scale
  const sx = (x) => (x - cam.left) * S
  const sy = (y) => H - (y - cam.bottom) * S
  const b = game.booster

  ctx.fillStyle = '#020403'
  ctx.fillRect(0, 0, W, H)
  ctx.save()
  if (game.phase === 'crashed') {
    const k = Math.max(0, 1 - (game.t - game.endedAt) / 0.6)
    ctx.translate((Math.random() - 0.5) * 16 * k, (Math.random() - 0.5) * 16 * k)
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // A few fixed phosphor stars
  ctx.fillStyle = DIM
  for (let i = 0; i < 60; i++) ctx.fillRect(hash(i + 7) * W, hash(i + 300) * H * 0.7, 2, 2)

  const gy = sy(0)
  drawTerrain(ctx, sx, gy, W, H, S, cam)
  drawPad(ctx, sx, sy, S)
  drawTower(ctx, sx, sy, S, game.t)
  drawArm(ctx, sx, sy, S, game)
  drawParticles(ctx, game, sx, sy, S)
  if (game.phase !== 'crashed') drawBooster(ctx, game, input, sx(b.x), sy(b.y), S)
  ctx.shadowBlur = 0
  ctx.restore()
}

// Jagged vector mountains in the distance, a flat line for the pad area, and a dashed sea on the left
function drawTerrain(ctx, sx, gy, W, H, S, cam) {
  const horizon = gy > H ? H + (gy - H) * 0.3 : gy
  glow(ctx, DIM, 1.2, 4)
  ctx.beginPath()
  for (let x = -10; x <= W + 30; x += 30) {
    const u = Math.floor((x + cam.left * S * 0.15) / 30)
    const peak = horizon - 20 - hash(u) * H * 0.18
    x === -10 ? ctx.moveTo(x, peak) : ctx.lineTo(x, peak)
  }
  ctx.stroke()
  if (gy > H + 2) return
  glow(ctx, GREEN, 2, 10)
  const ox = sx(OCEAN_X)
  ctx.beginPath()
  ctx.moveTo(Math.max(ox, -10), gy)
  ctx.lineTo(W + 10, gy)
  ctx.stroke()
  if (ox > 0) {
    ctx.setLineDash([6, 8])
    glow(ctx, DIM, 1.5, 6)
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(-10, gy + i * 8)
      ctx.lineTo(ox, gy + i * 8)
      ctx.stroke()
    }
    ctx.setLineDash([])
  }
}

function drawPad(ctx, sx, sy, S) {
  glow(ctx, GREEN, 1.5, 8)
  ctx.beginPath()
  ctx.rect(sx(MOUNT.x0), sy(MOUNT.top), (MOUNT.x1 - MOUNT.x0) * S, 3 * S)
  for (let i = 0; i < 4; i++) {
    const x = MOUNT.x0 + 2 + i * ((MOUNT.x1 - MOUNT.x0 - 4) / 3)
    ctx.moveTo(sx(x), sy(MOUNT.top - 3)); ctx.lineTo(sx(x), sy(0))
  }
  ctx.stroke()
}

// Wireframe tower with X bracing and a blinking beacon
function drawTower(ctx, sx, sy, S, t) {
  const x0 = TOWER_X, x1 = TOWER_X + TOWER_W
  glow(ctx, GREEN, 1.5, 8)
  ctx.beginPath()
  ctx.rect(sx(x0), sy(TOWER_H), TOWER_W * S, TOWER_H * S)
  for (let y = 0; y < TOWER_H - 0.1; y += TOWER_W) {
    const y2 = Math.min(TOWER_H, y + TOWER_W)
    ctx.moveTo(sx(x0), sy(y)); ctx.lineTo(sx(x1), sy(y2))
    ctx.moveTo(sx(x1), sy(y)); ctx.lineTo(sx(x0), sy(y2))
  }
  ctx.moveTo(sx(x0 + TOWER_W / 2), sy(TOWER_H)); ctx.lineTo(sx(x0 + TOWER_W / 2), sy(TOWER_H + 14))
  ctx.rect(sx(x0 - 1), sy(ARM_Y + 7), (TOWER_W + 2) * S, 10 * S)
  ctx.stroke()
  if (Math.sin(t * 3) > 0) {
    glow(ctx, RED, 1, 12)
    ctx.fillRect(sx(x0 + TOWER_W / 2) - 2, sy(TOWER_H + 14) - 2, 4, 4)
  }
}

// Chopstick outline with the catch zone marked; it flashes amber when you're lined up
function drawArm(ctx, sx, sy, S, game) {
  const caught = game.phase === 'caught'
  const k = caught ? game.t - game.endedAt : 0
  const dip = caught ? Math.sin(Math.min(k * 9, Math.PI)) * 0.6 * Math.exp(-k * 2) : 0
  const y = ARM_Y - dip
  const x0 = TOWER_X, x1 = TOWER_X - ARM_LEN
  glow(ctx, GREEN, 1.5, 8)
  ctx.beginPath()
  ctx.moveTo(sx(x0), sy(y)); ctx.lineTo(sx(x1), sy(y)); ctx.lineTo(sx(x1 + 2), sy(y - 3.4)); ctx.lineTo(sx(x0), sy(y - 3.4))
  for (let x = x1 + 2; x < x0 - 1; x += 3) { ctx.moveTo(sx(x), sy(y - 3.4)); ctx.lineTo(sx(x + 1.5), sy(y)) }
  ctx.stroke()
  const [px, py] = pinPoint(game.booster)
  const lined = game.phase === 'flight' && Math.abs(px - CATCH_X) < 3 && py > ARM_Y && py - ARM_Y < 60
  const blink = Math.sin(game.t * 10) > 0
  glow(ctx, caught || (lined && blink) ? AMBER : DIM, 2, 10)
  ctx.beginPath()
  ctx.moveTo(sx(CATCH_X - 4), sy(y + 1)); ctx.lineTo(sx(CATCH_X - 4), sy(y + 3))
  ctx.moveTo(sx(CATCH_X + 4), sy(y + 1)); ctx.lineTo(sx(CATCH_X + 4), sy(y + 3))
  ctx.stroke()
}

// Vector booster: body outline, engine bells, grid fins, catch pins, flickering amber flame
function drawBooster(ctx, game, input, x, y, S) {
  const b = game.booster
  const w = BOOSTER_W / 2
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(S, -S)
  ctx.rotate(b.angle)
  const lw = 1.5 / S
  if (game.phase === 'flight' && input.thrust) {
    glow(ctx, AMBER, lw, 12)
    ctx.beginPath()
    for (const off of [-2.6, 0, 2.6]) {
      const len = 6 + Math.random() * 7
      ctx.moveTo(off - 1, -1.5); ctx.lineTo(off + (Math.random() - 0.5), -1.5 - len); ctx.lineTo(off + 1, -1.5)
    }
    ctx.stroke()
  }
  glow(ctx, GREEN, lw, 10)
  ctx.beginPath()
  ctx.rect(-w, 0.5, BOOSTER_W, BOOSTER_H - 0.5)
  for (const off of [-2.6, 0, 2.6]) {
    ctx.moveTo(off - 0.7, 0.5); ctx.lineTo(off - 1.1, -1.5); ctx.lineTo(off + 1.1, -1.5); ctx.lineTo(off + 0.7, 0.5)
  }
  ctx.moveTo(-w, BOOSTER_H - 4.5); ctx.lineTo(w, BOOSTER_H - 4.5)
  for (const s of [-1, 1]) {
    const fx = s > 0 ? w : -w - 2.6
    ctx.rect(fx, PIN_Y + 2, 2.6, 6)
    ctx.moveTo(fx, PIN_Y + 5); ctx.lineTo(fx + 2.6, PIN_Y + 5)
    ctx.moveTo(fx + 1.3, PIN_Y + 2); ctx.lineTo(fx + 1.3, PIN_Y + 8)
    ctx.rect(s > 0 ? w : -w - 1.2, PIN_Y - 0.6, 1.2, 1.2)
  }
  ctx.stroke()
  ctx.restore()
}

// Particles as vector bits: amber exhaust streaks, hollow smoke rings, spinning green debris, pixel confetti
function drawParticles(ctx, game, sx, sy, S) {
  for (const p of game.particles) {
    const a = Math.max(0, p.life / p.max)
    const x = sx(p.x), y = sy(p.y)
    if (p.kind === 'flame' || p.kind === 'fire') {
      glow(ctx, `rgba(255,176,0,${a})`, 1.5, 8)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - p.vx * 0.02 * S, y + p.vy * 0.02 * S)
      ctx.stroke()
    } else if (p.kind === 'smoke' || p.kind === 'soot' || p.kind === 'dust') {
      glow(ctx, `rgba(57,255,106,${a * 0.35})`, 1, 0)
      ctx.beginPath()
      ctx.arc(x, y, Math.max(2, p.size * S * (1.6 - a * 0.6)), 0, Math.PI * 2)
      ctx.stroke()
    } else if (p.kind === 'debris') {
      glow(ctx, `rgba(57,255,106,${a})`, 1.5, 6)
      const r = Math.max(3, p.size * S), ang = p.life * 9
      ctx.beginPath()
      ctx.moveTo(x - Math.cos(ang) * r, y - Math.sin(ang) * r)
      ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r)
      ctx.stroke()
    } else {
      glow(ctx, Math.floor(p.x * 7) % 2 ? GREEN : AMBER, 1, 6)
      ctx.fillRect(Math.round(x), Math.round(y), 3, 3)
    }
  }
}

// ---------- HUD ----------

function text(ctx, s, x, y, { size = 10, color = GREEN, align = 'left', blur = 6 } = {}) {
  ctx.font = `${size}px ${PIXEL}`
  ctx.textAlign = align
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = blur
  ctx.fillText(s, x, y)
  ctx.shadowBlur = 0
}

// Biggest pixel size (from a list) that fits the width
function fitSize(ctx, s, sizes, maxW) {
  for (const size of sizes) {
    ctx.font = `${size}px ${PIXEL}`
    if (ctx.measureText(s).width <= maxW) return size
  }
  return sizes[sizes.length - 1]
}

const pad4 = (n) => String(Math.max(0, Math.round(n))).padStart(4, '0')

export function drawHud(ctx, game, W, H, { touch = false } = {}) {
  const b = game.booster
  const flying = game.phase === 'flight'
  const small = W < 640
  const fs = small ? 8 : 10
  const row = fs + 10

  if (game.phase === 'caught' && scoredGame !== game) {
    scoredGame = game
    score += Math.round(150 - Math.min(100, game.contact.descent * MPH * 12))
  }

  // Left column, like the original: score, time, fuel
  const secs = Math.floor(game.t)
  text(ctx, `SCORE   ${pad4(score)}`, 16, 26, { size: fs })
  text(ctx, `TIME    ${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`, 16, 26 + row, { size: fs })
  text(ctx, 'FUEL    LOTS', 16, 26 + row * 2, { size: fs })

  // Right column: altitude and speeds with direction arrows
  const rx = W - 16
  const descent = -b.vy
  text(ctx, `ALTITUDE ${pad4(b.y * FT)}`, rx, 26, { size: fs, align: 'right' })
  text(ctx, `HORIZONTAL ${pad4(Math.abs(b.vx) * MPH)} ${b.vx >= 0 ? '>' : '<'}`, rx, 26 + row, { size: fs, align: 'right' })
  const hot = flying && descent > SAFE_VY
  text(ctx, `VERTICAL ${pad4(Math.abs(b.vy) * MPH)} ${b.vy <= 0 ? 'v' : '^'}`, rx, 26 + row * 2, { size: fs, align: 'right', color: hot ? AMBER : GREEN })

  if (flying) {
    const off = pinPoint(b)[0] - CATCH_X
    const lined = Math.abs(off) < 3
    const tilt = Math.round((Math.abs(b.angle) * 180) / Math.PI)
    // On a phone held sideways, keep clear of the thumb buttons in the bottom corners
    const thumbs = touch && H < 520
    const lx = thumbs ? 190 : 16, tx = thumbs ? W - 140 : rx
    text(ctx, lined ? 'TARGET LOCKED' : `TARGET ${off > 0 ? '<' : '>'} ${Math.round(Math.abs(off) * FT)} FT`, lx, H - 20, { size: fs, color: lined ? AMBER : GREEN })
    text(ctx, `TILT ${tilt}`, tx, H - 20, { size: fs, align: 'right', color: Math.abs(b.angle) > SAFE_TILT ? AMBER : GREEN })
    if (slowMo(game) && Math.sin(game.t * 12) > 0) text(ctx, 'SLOW-MO', W / 2, 26, { size: fs, align: 'center', color: AMBER })
  }

  // Center messages
  const blink = Math.floor(performance.now() / 500) % 2 === 0
  const cx = W / 2, cy = H * 0.42
  const big = (s, y, color = GREEN) => text(ctx, s, cx, y, { size: fitSize(ctx, s, small ? [14, 12, 10] : [22, 18, 14, 12], W - 40), color, align: 'center', blur: 12 })
  const line = (s, y, color = GREEN) => text(ctx, s, cx, y, { size: fitSize(ctx, s, small ? [9, 8, 7] : [11, 10, 9, 8], W - 40), color, align: 'center' })
  const again = canRestart(game) && blink ? (touch ? 'TAP THRUST TO PLAY AGAIN' : 'PRESS UP OR W TO PLAY AGAIN') : null

  if (game.phase === 'ready') {
    big('SUPER HEAVY CATCH', cy)
    line('LAND THE BOOSTER IN THE CHOPSTICKS', cy + 34)
    if (blink) line(touch ? 'HOLD THRUST TO START' : 'HOLD UP OR W TO START', cy + 60, AMBER)
  } else if (cardReady(game)) {
    const c = game.contact
    if (game.phase === 'caught') {
      big(catchGrade(c.descent * MPH).replace(/[.']/g, ''), cy)
      line(`${(c.descent * MPH).toFixed(1)} MPH  ${Math.round(Math.abs(c.off) * FT)} FT OFF  ${Math.round((c.tilt * 180) / Math.PI)} DEG`, cy + 34)
    } else if (game.phase === 'landed') {
      big('LANDED. TOWER NOT IMPRESSED', cy, AMBER)
      line('THE CHOPSTICKS WANTED A HUG', cy + 34)
    } else {
      big('YOU JUST DESTROYED A', cy - 14, AMBER)
      big('90 MEGABUCK BOOSTER', cy + 14, AMBER)
      line(game.reason.toUpperCase(), cy + 46)
    }
    if (again) line(again, cy + 76, AMBER)
  }

  crt(ctx, W, H)
}

// CRT finish: scanlines, a slight flicker and dark corners
function crt(ctx, W, H) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1)
  ctx.fillStyle = `rgba(57,255,106,${0.012 + Math.random() * 0.012})`
  ctx.fillRect(0, 0, W, H)
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.75)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, W, H)
}
