// Roadster launch game: 0–60 in under a second, up a ramp to the sky, then thrusters to land
import { useEffect, useRef } from 'react'

// Physics (meters, seconds, y points up)
const G = 9.8
const LAUNCH_ACCEL = 30 // m/s² → 0–60 mph in ~0.9s
const RUNWAY = 40 // flat track before the ramp
const RAMP_R = 20 // radius of the ")" curve
const RAMP_END = (165 * Math.PI) / 180 // the curve bends back over the top; the car leaves upside down, heading back
const RAMP_LIP_X = RUNWAY + RAMP_R * Math.sin(RAMP_END)
const TOWER_X = RUNWAY + RAMP_R + 1.5 // lattice tower behind the curve
const TOWER_W = 3.5
const TOWER_H = 2 * RAMP_R + 3
const THRUST = 22
const TURN_RATE = 3 // rad/s
const CAR_L = 4.5
const CAR_H = 1.2
const WHEEL_R = 0.36
const SAFE_VY = 5 // max touchdown descent speed (m/s, ~11 mph)
const SAFE_TILT = (15 * Math.PI) / 180
const ROLL_BRAKE = 14
const AIR_DRAG = 0.02 // quadratic drag: bleeds off launch speed fast, terminal velocity ~22 m/s
const ROLL_DRAG = 1.5 // slowing on the track when you're off the throttle
const STEP = 1 / 120

const MPH = 2.23694
const FT = 3.28084
const FONT = 'Switzer, sans-serif'

// Solid parts of the ramp: the curved deck and the tower behind it
function hitsRamp(x, y) {
  if (x >= TOWER_X && x <= TOWER_X + TOWER_W && y <= TOWER_H) return true
  const dx = x - RUNWAY, dy = RAMP_R - y
  if (dx < 0) return false
  const d = Math.hypot(dx, dy)
  return d > RAMP_R - 0.3 && d < RAMP_R + 1.2 && Math.atan2(dx, dy) <= RAMP_END + 0.05
}

function wrapAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a))
}

// Car is positioned by the bottom-center point between its wheels
function carCorners(car) {
  const fx = Math.cos(car.angle), fy = Math.sin(car.angle)
  const ux = -fy, uy = fx
  const h = CAR_L / 2
  return [
    [car.x - fx * h, car.y - fy * h],
    [car.x + fx * h, car.y + fy * h],
    [car.x - fx * h + ux * CAR_H, car.y - fy * h + uy * CAR_H],
    [car.x + fx * h + ux * CAR_H, car.y + fy * h + uy * CAR_H],
  ]
}

function newGame() {
  return {
    phase: 'ready', // ready → runway ⇄ ramp → flight → rolling → landed | crashed
    car: { x: 4, y: 0, vx: 0, vy: 0, angle: 0 },
    speed: 0,
    phi: 0,
    t: 0,
    zeroSixty: null,
    flightTime: 0,
    maxAlt: 0,
    touchdown: null,
    endedAt: 0,
    particles: [],
    cam: null,
  }
}

// Thrust doubles as the start key: launch from the line, or reset once a run has ended
function pressThrust(game) {
  if (game.phase === 'ready') startGame(game)
  else if ((game.phase === 'landed' || game.phase === 'crashed') && game.t - game.endedAt > 0.6) return newGame()
  return game
}

function startGame(game) {
  if (game.phase !== 'ready') return
  game.phase = 'runway'
  game.t = 0
}

// Deterministic scenery
function hash(i) {
  const r = Math.sin(i * 12.9898) * 43758.5453
  return r - Math.floor(r)
}
const STARS = Array.from({ length: 110 }, (_, i) => ({ x: hash(i + 7), y: hash(i + 300), r: 0.6 + hash(i + 600) * 1.2 }))

function step(game, input, dt) {
  const car = game.car
  game.t += dt

  if (game.phase === 'runway' || game.phase === 'ramp') {
    // The car only drives while you hold thrust; otherwise it coasts
    if (input.thrust) {
      game.speed += LAUNCH_ACCEL * dt
      tireSmoke(game)
    } else {
      game.speed -= Math.sign(game.speed) * Math.min(Math.abs(game.speed), ROLL_DRAG * dt)
    }
  }

  if (game.phase === 'runway') {
    car.x += game.speed * dt
    if (game.zeroSixty === null && game.speed * MPH >= 60) game.zeroSixty = game.t
    if (car.x >= RUNWAY) {
      game.phase = 'ramp'
      game.phi = (car.x - RUNWAY) / RAMP_R
    }
  } else if (game.phase === 'ramp') {
    game.speed -= G * Math.sin(game.phi) * dt
    game.phi += (game.speed * dt) / RAMP_R
    // Too slow near the top: the car drops off the curve
    const tooSlow = game.phi > Math.PI / 2 && (game.speed * game.speed) / RAMP_R < -G * Math.cos(game.phi)
    if (game.phi >= RAMP_END || tooSlow) {
      game.phi = Math.min(game.phi, RAMP_END)
      game.phase = 'flight'
      car.vx = game.speed * Math.cos(game.phi)
      car.vy = game.speed * Math.sin(game.phi)
      game.flightTime = 0
    } else if (game.phi < 0) {
      // Rolled back down onto the runway
      game.phase = 'runway'
      car.x = RUNWAY + game.phi * RAMP_R
      car.y = 0
      car.angle = 0
      game.phi = 0
    }
    if (game.phase !== 'runway') {
      car.x = RUNWAY + RAMP_R * Math.sin(game.phi)
      car.y = RAMP_R * (1 - Math.cos(game.phi))
      car.angle = game.phi
    }
  } else if (game.phase === 'flight') {
    game.flightTime += dt
    const turn = (input.left ? 1 : 0) - (input.right ? 1 : 0)
    car.angle = wrapAngle(car.angle + turn * TURN_RATE * dt)
    if (turn) emitJets(game, turn)
    if (input.thrust) {
      car.vx += -Math.sin(car.angle) * THRUST * dt
      car.vy += Math.cos(car.angle) * THRUST * dt
      emitThrust(game)
    }
    car.vy -= G * dt
    const v = Math.hypot(car.vx, car.vy)
    car.vx -= AIR_DRAG * v * car.vx * dt
    car.vy -= AIR_DRAG * v * car.vy * dt
    car.x += car.vx * dt
    car.y += car.vy * dt
    game.maxAlt = Math.max(game.maxAlt, car.y)

    const corners = carCorners(car)
    const hitRamp =
      game.flightTime > 0.5 &&
      corners.some(([x, y]) => hitsRamp(x, y))
    const lowest = Math.min(...corners.map(([, y]) => y))

    if (hitRamp) {
      crash(game, 'You hit the ramp.')
    } else if (lowest <= 0) {
      const descent = -car.vy
      const tilt = Math.abs(car.angle)
      game.touchdown = { descent, tilt }
      if (descent > SAFE_VY) crash(game, `Came down at ${Math.round(descent * MPH)} mph. Keep it under ${Math.round(SAFE_VY * MPH)}.`)
      else if (tilt > SAFE_TILT) crash(game, `Landed ${Math.round((tilt * 180) / Math.PI)}° off level. Keep it under 15°.`)
      else {
        game.phase = 'rolling'
        car.y = 0
        car.vy = 0
        dust(game)
      }
    }
  } else if (game.phase === 'rolling') {
    car.angle *= Math.max(0, 1 - dt * 8)
    const s = Math.sign(car.vx)
    car.vx -= s * ROLL_BRAKE * dt
    if (Math.sign(car.vx) !== s) car.vx = 0
    car.x += car.vx * dt
    if (car.vx === 0) {
      game.phase = 'landed'
      game.endedAt = game.t
      confetti(game)
    }
  }

  // Particles
  for (const p of game.particles) {
    p.vy -= p.g * dt
    p.vx *= 1 - (p.drag || 0) * dt
    p.vy *= 1 - (p.drag || 0) * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.y < 0) { p.y = 0; p.vy *= -0.3; p.vx *= 0.7 }
    p.life -= dt
  }
  game.particles = game.particles.filter((p) => p.life > 0)
}

function emitThrust(game) {
  const car = game.car
  const fx = Math.cos(car.angle), fy = Math.sin(car.angle)
  const ux = -fy, uy = fx
  for (const off of [-0.9, 0.9]) {
    const px = car.x + fx * off + ux * 0.18
    const py = car.y + fy * off + uy * 0.18
    const speed = 18 + Math.random() * 8
    game.particles.push({
      x: px, y: py,
      vx: car.vx - ux * speed + (Math.random() - 0.5) * 4,
      vy: car.vy - uy * speed + (Math.random() - 0.5) * 4,
      g: -2, life: 0.3 + Math.random() * 0.3, max: 0.6, size: 0.45, kind: 'flame',
    })
    if (Math.random() < 0.35) {
      game.particles.push({
        x: px, y: py,
        vx: car.vx * 0.3 - ux * speed * 0.4, vy: car.vy * 0.3 - uy * speed * 0.4,
        g: -1.5, drag: 1.5, life: 1 + Math.random() * 0.8, max: 1.8, size: 0.9, kind: 'smoke',
      })
    }
  }
}

// A light puff of tire smoke from the rear wheel, mostly while it spins up from low speed
function tireSmoke(game) {
  if (game.phase !== 'runway' || Math.random() > 0.25 * Math.max(0, 1 - game.speed / 30)) return
  const car = game.car
  game.particles.push({
    x: car.x - 1.5, y: 0.25,
    vx: -2 - Math.random() * 3, vy: 0.3 + Math.random() * 0.8,
    g: -0.4, drag: 1.5, life: 0.6 + Math.random() * 0.5, max: 1.1, size: 0.45 + Math.random() * 0.3, kind: 'smoke',
  })
}

// Small side jets at the nose and tail push opposite ways to rotate the car
const JETS = [{ x: 1.95, y: 0.52 }, { x: -2.05, y: 0.62 }]
function jetDirs(turn) {
  // Nose up (turn > 0): nose jet blows down, tail jet blows up
  return [-turn, turn]
}
function emitJets(game, turn) {
  if (Math.random() < 0.5) return
  const car = game.car
  const fx = Math.cos(car.angle), fy = Math.sin(car.angle)
  const ux = -fy, uy = fx
  const dirs = jetDirs(turn)
  JETS.forEach((j, i) => {
    const s = 8 + Math.random() * 4
    game.particles.push({
      x: car.x + fx * j.x + ux * j.y, y: car.y + fy * j.x + uy * j.y,
      vx: car.vx + ux * dirs[i] * s + (Math.random() - 0.5) * 2,
      vy: car.vy + uy * dirs[i] * s + (Math.random() - 0.5) * 2,
      g: -1, drag: 3, life: 0.5 + Math.random() * 0.4, max: 0.9, size: 0.35, kind: 'smoke',
    })
  })
}

function dust(game) {
  const car = game.car
  for (let i = 0; i < 30; i++) {
    game.particles.push({
      x: car.x + (Math.random() - 0.5) * 3, y: 0.2,
      vx: car.vx * 0.3 + (Math.random() - 0.5) * 10, vy: Math.random() * 3,
      g: -0.5, drag: 2, life: 0.8 + Math.random() * 0.8, max: 1.6, size: 0.8, kind: 'dust',
    })
  }
}

function confetti(game) {
  const car = game.car
  const colors = ['#ef4444', '#f8fafc', '#facc15', '#38bdf8']
  for (let i = 0; i < 70; i++) {
    game.particles.push({
      x: car.x, y: 2,
      vx: (Math.random() - 0.5) * 16, vy: 8 + Math.random() * 12,
      g: G * 0.6, drag: 1.2, life: 2 + Math.random(), max: 3, size: 0.25, kind: 'confetti',
      color: colors[i % colors.length],
    })
  }
}

function crash(game, reason) {
  const car = game.car
  game.phase = 'crashed'
  game.reason = reason
  game.endedAt = game.t
  for (let i = 0; i < 110; i++) {
    const a = Math.random() * Math.PI * 2
    const s = 4 + Math.random() * 24
    const kind = i % 4 === 0 ? 'debris' : i % 4 === 1 ? 'smoke' : 'fire'
    game.particles.push({
      x: car.x, y: Math.max(car.y, 0.5),
      vx: Math.cos(a) * s + car.vx * 0.2, vy: Math.abs(Math.sin(a)) * s,
      g: kind === 'smoke' ? -1 : G, drag: kind === 'smoke' ? 1.5 : 0,
      life: 0.8 + Math.random() * 1.6, max: 2.4, size: kind === 'smoke' ? 1.4 : 0.35 + Math.random() * 0.6,
      kind, color: i % 8 === 0 ? '#c1121f' : '#1f2937',
    })
  }
}

// ---------- Rendering ----------

function lerp(a, b, t) { return a + (b - a) * t }
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

function updateCamera(game, W, H, dt) {
  const car = game.car
  const parked = game.phase === 'ready'
  const span = TOWER_X + TOWER_W + 10
  const targetViewH = parked ? Math.max(TOWER_H * 1.35, (span * H) / W) : Math.min(170, Math.max(40, car.y * 1.3 + 25))
  const cam = game.cam || { viewH: targetViewH, left: 0, bottom: -6 }
  const k = Math.min(1, dt * 3)
  cam.viewH = lerp(cam.viewH, targetViewH, k)
  const scale = H / cam.viewH
  const viewW = W / scale
  // Keep more room ahead of the car once it is flying back the other way
  const backwards = car.vx < -1 && game.phase !== 'ramp'
  const targetLeft = parked ? -4 : car.x - viewW * (backwards ? 0.62 : 0.35)
  const targetBottom = car.y < cam.viewH * 0.6 ? -cam.viewH * 0.1 : car.y - cam.viewH * 0.6
  cam.left = game.cam ? lerp(cam.left, targetLeft, Math.min(1, dt * 6)) : targetLeft
  cam.bottom = game.cam ? lerp(cam.bottom, targetBottom, Math.min(1, dt * 6)) : targetBottom
  cam.scale = scale
  game.cam = cam
  return cam
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

function render(ctx, game, W, H) {
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

  // Night sky, like the demo
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#04060b')
  sky.addColorStop(0.75, '#0b1020')
  sky.addColorStop(1, '#1a2133')
  ctx.fillStyle = sky
  ctx.fillRect(-20, -20, W + 40, H + 40)

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  for (const s of STARS) {
    const x = (((s.x * W - cam.left * S * 0.02) % W) + W) % W
    ctx.beginPath()
    ctx.arc(x, s.y * H * 0.85, s.r * 0.8, 0, Math.PI * 2)
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
    ctx.fillRect(sx(-40), gy, (RUNWAY + 40) * S, band)
    ctx.fillStyle = '#4b5058'
    for (let x = -36; x < RUNWAY - 2; x += 6) ctx.fillRect(sx(x), gy + band * 0.45, 3 * S, Math.max(1, band * 0.1))
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
    ctx.lineTo(sx(RUNWAY - 1), gy + 1)
    ctx.stroke()
    ctx.restore()

    // Floodlights at the foot of the ramp
    for (const fx of [RUNWAY - 4, TOWER_X + TOWER_W + 3]) {
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
    const k0 = Math.floor((cam.left - RUNWAY) / 25), k1 = Math.ceil((cam.left + W / S - RUNWAY) / 25)
    for (let k = k0; k <= k1; k++) {
      const d = k * 25
      if (k === 0 || (d > 0 && d < TOWER_X + TOWER_W + 3 - RUNWAY)) continue
      const x = sx(RUNWAY + d)
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

  drawRamp(ctx, sx, sy, S)

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
    const g = ctx.createRadialGradient(sx(p.x), sy(p.y), 0, sx(p.x), sy(p.y), r)
    if (p.kind === 'flame') {
      g.addColorStop(0, `rgba(255,255,255,${a})`)
      g.addColorStop(0.45, `rgba(235,238,244,${a * 0.6})`)
      g.addColorStop(1, 'rgba(220,224,232,0)')
    } else {
      g.addColorStop(0, `rgba(255,240,200,${a})`)
      g.addColorStop(0.4, `rgba(255,${Math.round(110 + 90 * a)},40,${a * 0.8})`)
      g.addColorStop(1, 'rgba(255,60,0,0)')
    }
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(sx(p.x), sy(p.y), r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'

  if (game.phase !== 'crashed') drawCar(ctx, game, sx(car.x), sy(car.y), S)
  ctx.restore()
}

// White ")" ramp with a lattice tower behind it, like the demo
function drawRamp(ctx, sx, sy, S) {
  const lw = (m, min) => Math.max(min, m * S)
  const tx0 = TOWER_X, tx1 = TOWER_X + TOWER_W

  // Tower columns and a top beam reaching over the lip
  ctx.strokeStyle = '#9aa3b0'
  ctx.lineWidth = lw(0.22, 1.2)
  ctx.beginPath()
  ctx.moveTo(sx(tx0), sy(0)); ctx.lineTo(sx(tx0), sy(TOWER_H))
  ctx.moveTo(sx(tx1), sy(0)); ctx.lineTo(sx(tx1), sy(TOWER_H))
  ctx.moveTo(sx(tx1), sy(TOWER_H)); ctx.lineTo(sx(RAMP_LIP_X + 1), sy(TOWER_H))
  ctx.moveTo(sx(tx1), sy(TOWER_H - 2)); ctx.lineTo(sx(RAMP_LIP_X + 3), sy(TOWER_H - 2))
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
  for (let x = RAMP_LIP_X + 3; x < tx1; x += 2) {
    ctx.moveTo(sx(x), sy(TOWER_H - 2))
    ctx.lineTo(sx(Math.min(tx1, x + 1)), sy(TOWER_H))
    ctx.lineTo(sx(Math.min(tx1, x + 2)), sy(TOWER_H - 2))
  }
  for (let i = 1; i < 9; i++) {
    const phi = (RAMP_END * i) / 9
    const x = RUNWAY + (RAMP_R + 1) * Math.sin(phi)
    const y = RAMP_R - (RAMP_R + 1) * Math.cos(phi)
    if (x < tx0) { ctx.moveTo(sx(x), sy(y)); ctx.lineTo(sx(tx0), sy(y)) }
  }
  ctx.stroke()

  // Footing
  ctx.fillStyle = '#3a3f47'
  ctx.fillRect(sx(RUNWAY - 1), sy(0) - lw(0.4, 2), (tx1 + 2 - RUNWAY) * S, lw(0.4, 2))

  // Deck: thick white band, bright riding surface, red edge light
  const deck = (offset) => {
    ctx.beginPath()
    for (let i = 0; i <= 60; i++) {
      const phi = (RAMP_END * i) / 60
      const x = sx(RUNWAY + (RAMP_R - offset) * Math.sin(phi))
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
function drawCar(ctx, game, x, y, S) {
  const car = game.car
  // Draw at least ~64px long so it stays readable when zoomed out
  const vis = Math.max(1, 64 / (CAR_L * S))
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(S * vis, -S * vis)
  ctx.rotate(car.angle)

  // Thruster flames
  const thrusting = game.phase === 'flight' && game.input && game.input.thrust
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
  const turn = game.phase === 'flight' && game.input ? (game.input.left ? 1 : 0) - (game.input.right ? 1 : 0) : 0
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

function drawHud(ctx, game, W, H) {
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

  // Message card
  let msg = null
  if (game.phase === 'ready') msg = ['ROADSTER LAUNCH', W < 520 ? 'Hold Thrust to rev and go' : 'Hold ↑ or W to rev and go']
  else if (game.phase === 'crashed') msg = ['CRASHED', game.reason]
  else if (game.phase === 'landed') {
    msg = ['LANDED', `${Math.round(game.touchdown.descent * MPH)} mph touchdown · ${Math.round(Math.abs(car.x - RUNWAY) * FT)} ft from the ramp · ${Math.round(game.maxAlt * FT)} ft high`]
  }
  const again = (game.phase === 'landed' || game.phase === 'crashed') && game.t - game.endedAt > 0.6
  if (msg) {
    const boxW = Math.min(W - 24, 480)
    const top = Math.max(H * 0.2, 12 + panelH + 16)
    ctx.fillStyle = 'rgba(15,17,21,0.78)'
    rrect(ctx, (W - boxW) / 2, top, boxW, again ? 100 : 78, 14)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = game.phase === 'crashed' ? bad : game.phase === 'landed' ? good : '#f8fafc'
    ctx.font = `800 24px ${FONT}`
    ctx.fillText(msg[0], W / 2, top + 34)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = `500 ${W < 420 ? 11 : 13}px ${FONT}`
    ctx.fillText(msg[1], W / 2, top + 58)
    if (again) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.font = `600 12px ${FONT}`
      ctx.fillText(W < 520 ? 'Tap Thrust to go again' : 'Press ↑ or W to go again', W / 2, top + 84)
    }
  }
}

// ---------- Component ----------

const KEYS = {
  thrust: [' ', 'w', 'W', 'ArrowUp'],
  left: ['a', 'A', 'ArrowLeft'],
  right: ['d', 'D', 'ArrowRight'],
}

export default function RoadsterGame() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const inputRef = useRef({ thrust: false, left: false, right: false })

  const pressStart = () => {
    const next = pressThrust(gameRef.current)
    next.input = inputRef.current
    gameRef.current = next
  }

  useEffect(() => {
    gameRef.current = newGame()
    gameRef.current.input = inputRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W = 0, H = 0, dpr = 1

    const resize = () => {
      const w = wrapRef.current.clientWidth
      const h = Math.round(Math.min(w < 640 ? w * 1.15 : w * 0.56, window.innerHeight * 0.68))
      dpr = window.devicePixelRatio || 1
      W = w
      H = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.height = `${h}px`
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrapRef.current)

    const onKey = (down) => (e) => {
      let handled = false
      for (const [action, keys] of Object.entries(KEYS)) {
        if (keys.includes(e.key)) {
          inputRef.current[action] = down
          handled = true
        }
      }
      if (down && !e.repeat && KEYS.thrust.includes(e.key)) pressStart()
      if (handled) e.preventDefault()
    }
    const down = onKey(true), up = onKey(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    let raf, last = performance.now(), acc = 0
    const loop = (now) => {
      const frame = Math.min(0.05, (now - last) / 1000)
      last = now
      acc += frame
      const game = gameRef.current
      while (acc >= STEP) {
        step(game, inputRef.current, STEP)
        acc -= STEP
      }
      updateCamera(game, W, H, frame)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      render(ctx, game, W, H)
      drawHud(ctx, game, W, H)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const hold = (action) => ({
    onPointerDown: (e) => {
      e.preventDefault()
      inputRef.current[action] = true
      if (action === 'thrust') pressStart()
    },
    onPointerUp: () => { inputRef.current[action] = false },
    onPointerLeave: () => { inputRef.current[action] = false },
    onPointerCancel: () => { inputRef.current[action] = false },
    onContextMenu: (e) => e.preventDefault(),
  })

  const btn = 'select-none rounded border border-gray-950 py-4 text-lg font-semibold active:bg-gray-200 transition-colors'

  return (
    <div ref={wrapRef} className="w-full select-none" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} className="block w-full rounded border border-gray-950" />

      <div className="mt-3">
        {/* Touch controls for phones; keyboard users don't need them */}
        <div className="hidden [@media(pointer:coarse)]:grid grid-cols-4 gap-2">
          <button {...hold('left')} className={btn} aria-label="Tilt back">⟲</button>
          <button {...hold('thrust')} className={`${btn} col-span-2`}>THRUST</button>
          <button {...hold('right')} className={btn} aria-label="Tilt forward">⟳</button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-3 [@media(pointer:coarse)]:hidden">
        Keyboard: hold ↑ or W to drive and thrust, A/D or ←/→ to tilt. Land with descent under 11 mph and tilt under 15°.
      </p>
    </div>
  )
}
