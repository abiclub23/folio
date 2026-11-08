// Roadster launch game: 0–60 in under a second, up a ramp to the sky, then thrusters to land
import { useEffect, useRef, useState } from 'react'

// Physics (meters, seconds, y points up)
const G = 9.8
const LAUNCH_ACCEL = 30 // m/s² → 0–60 mph in ~0.9s
const RUNWAY = 60 // flat track before the ramp
const RAMP_R = 50 // radius of the ramp curve
const RAMP_END = (72 * Math.PI) / 180 // launch angle at the lip
const RAMP_TOP_X = RUNWAY + RAMP_R * Math.sin(RAMP_END)
const RAMP_TOP_Y = RAMP_R * (1 - Math.cos(RAMP_END))
const THRUST = 22
const TURN_RATE = 2.2 // rad/s
const CAR_L = 4.5
const CAR_H = 1.2
const WHEEL_R = 0.36
const SAFE_VY = 5 // max touchdown descent speed (m/s, ~11 mph)
const SAFE_TILT = (15 * Math.PI) / 180
const ROLL_BRAKE = 10
const COUNTDOWN = 1.5
const STEP = 1 / 120

const MPH = 2.23694
const FT = 3.28084
const FONT = 'Switzer, sans-serif'

function rampHeightAt(x) {
  if (x < RUNWAY || x > RAMP_TOP_X) return null
  const phi = Math.asin((x - RUNWAY) / RAMP_R)
  return RAMP_R * (1 - Math.cos(phi))
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
    phase: 'ready', // ready → countdown → runway → ramp → flight → rolling → landed | crashed
    car: { x: 4, y: 0, vx: 0, vy: 0, angle: 0 },
    speed: 0,
    phi: 0,
    t: 0,
    countdown: COUNTDOWN,
    zeroSixty: null,
    flightTime: 0,
    maxAlt: 0,
    touchdown: null,
    endedAt: 0,
    particles: [],
    cam: null,
  }
}

function startGame(game) {
  if (game.phase !== 'ready') return
  game.phase = 'countdown'
  game.countdown = COUNTDOWN
}

// Deterministic scenery
function hash(i) {
  const r = Math.sin(i * 12.9898) * 43758.5453
  return r - Math.floor(r)
}
const CLOUDS = Array.from({ length: 80 }, (_, i) => ({
  x: -150 + i * 55 + hash(i) * 30,
  y: 35 + ((i * 37) % 170),
  w: 14 + hash(i + 99) * 18,
}))
const STARS = Array.from({ length: 110 }, (_, i) => ({ x: hash(i + 7), y: hash(i + 300), r: 0.6 + hash(i + 600) * 1.2 }))

function step(game, input, dt) {
  const car = game.car
  game.t += dt

  if (game.phase === 'countdown') {
    game.countdown -= dt
    if (game.countdown <= 0) {
      game.phase = 'runway'
      game.t = 0
    }
  } else if (game.phase === 'runway') {
    game.speed += LAUNCH_ACCEL * dt
    car.x += game.speed * dt
    if (game.zeroSixty === null && game.speed * MPH >= 60) game.zeroSixty = game.t
    if (car.x >= RUNWAY) {
      game.phase = 'ramp'
      game.phi = (car.x - RUNWAY) / RAMP_R
    }
  } else if (game.phase === 'ramp') {
    game.speed -= G * Math.sin(game.phi) * dt
    game.phi += (game.speed * dt) / RAMP_R
    if (game.phi >= RAMP_END) {
      game.phi = RAMP_END
      game.phase = 'flight'
      car.vx = game.speed * Math.cos(RAMP_END)
      car.vy = game.speed * Math.sin(RAMP_END)
      game.flightTime = 0
    }
    car.x = RUNWAY + RAMP_R * Math.sin(game.phi)
    car.y = RAMP_R * (1 - Math.cos(game.phi))
    car.angle = game.phi
  } else if (game.phase === 'flight') {
    game.flightTime += dt
    const turn = (input.left ? 1 : 0) - (input.right ? 1 : 0)
    car.angle = wrapAngle(car.angle + turn * TURN_RATE * dt)
    if (input.thrust) {
      car.vx += -Math.sin(car.angle) * THRUST * dt
      car.vy += Math.cos(car.angle) * THRUST * dt
      emitThrust(game)
    }
    car.vy -= G * dt
    car.x += car.vx * dt
    car.y += car.vy * dt
    game.maxAlt = Math.max(game.maxAlt, car.y)

    const corners = carCorners(car)
    const hitRamp =
      game.flightTime > 0.5 &&
      corners.some(([x, y]) => {
        const h = rampHeightAt(x)
        return h !== null && y < h
      })
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
  for (const off of [-0.85, 0.85]) {
    const px = car.x + fx * off + ux * 0.1
    const py = car.y + fy * off + uy * 0.1
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
function mixColor(c1, c2, t) {
  const r = Math.round(lerp(c1[0], c2[0], t)), g = Math.round(lerp(c1[1], c2[1], t)), b = Math.round(lerp(c1[2], c2[2], t))
  return `rgb(${r},${g},${b})`
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

function updateCamera(game, W, H, dt) {
  const car = game.car
  const parked = game.phase === 'ready' || game.phase === 'countdown'
  const targetViewH = parked ? 80 : Math.min(170, Math.max(40, car.y * 1.3 + 25))
  const cam = game.cam || { viewH: targetViewH, left: 0, bottom: -6 }
  const k = Math.min(1, dt * 3)
  cam.viewH = lerp(cam.viewH, targetViewH, k)
  const scale = H / cam.viewH
  const viewW = W / scale
  const targetLeft = parked ? -6 : car.x - viewW * 0.35
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

  // Sky darkens with altitude, stars come out up high
  const dark = Math.min(1, Math.max(0, car.y / 220))
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, mixColor([92, 164, 222], [6, 10, 30], dark))
  sky.addColorStop(0.7, mixColor([176, 216, 240], [30, 44, 88], dark))
  sky.addColorStop(1, mixColor([248, 226, 198], [70, 80, 120], dark))
  ctx.fillStyle = sky
  ctx.fillRect(-20, -20, W + 40, H + 40)

  const starAlpha = Math.min(1, Math.max(0, (car.y - 80) / 120))
  if (starAlpha > 0) {
    ctx.fillStyle = `rgba(255,255,255,${starAlpha})`
    for (const s of STARS) {
      ctx.beginPath()
      ctx.arc(s.x * W, s.y * H * 0.85, s.r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const gy = sy(0)
  const horizon = gy > H ? H + (gy - H) * 0.3 : gy

  // Low sun with a soft glow
  const sunX = W * 0.78 - cam.left * S * 0.01
  const sunY = horizon - H * 0.32
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.35)
  glow.addColorStop(0, `rgba(255,236,200,${0.9 - dark * 0.6})`)
  glow.addColorStop(1, 'rgba(255,236,200,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = `rgba(255,248,230,${1 - dark * 0.5})`
  ctx.beginPath()
  ctx.arc(sunX, sunY, Math.max(14, H * 0.04), 0, Math.PI * 2)
  ctx.fill()

  // Parallax mountains and hills
  drawRange(ctx, W, horizon, cam.left * S * 0.06, H * 0.3, mixColor([150, 170, 196], [36, 46, 74], dark), 1.3)
  drawRange(ctx, W, horizon, cam.left * S * 0.16, H * 0.17, mixColor([112, 138, 120], [26, 36, 46], dark), 4.2)

  // Clouds
  ctx.fillStyle = `rgba(255,255,255,${0.85 - dark * 0.45})`
  for (const c of CLOUDS) {
    const x = sx(c.x), y = sy(c.y), w = c.w * S
    if (x + w < 0 || x - w > W || y < -w || y > H + w) continue
    ctx.beginPath()
    ctx.ellipse(x, y, w * 0.5, w * 0.16, 0, 0, Math.PI * 2)
    ctx.ellipse(x - w * 0.2, y - w * 0.05, w * 0.24, w * 0.15, 0, 0, Math.PI * 2)
    ctx.ellipse(x + w * 0.12, y - w * 0.09, w * 0.22, w * 0.18, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Ground
  if (gy < H) {
    const ground = ctx.createLinearGradient(0, gy, 0, H)
    ground.addColorStop(0, '#7c9a55')
    ground.addColorStop(1, '#4b6334')
    ctx.fillStyle = ground
    ctx.fillRect(-20, gy, W + 40, H - gy + 20)

    // Runway with dashed center line and a checkered start line
    const band = Math.max(4, 1.4 * S)
    ctx.fillStyle = '#2f3136'
    ctx.fillRect(sx(-40), gy, (RUNWAY + 40) * S, band)
    ctx.fillStyle = '#e5e7eb'
    for (let x = -36; x < RUNWAY - 2; x += 6) ctx.fillRect(sx(x), gy + band * 0.45, 3 * S, Math.max(1, band * 0.1))
    const sq = Math.max(2, 0.35 * S)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j * sq < band; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#111' : '#f8fafc'
        ctx.fillRect(sx(1.5) + i * sq, gy + j * sq, sq, Math.min(sq, band - j * sq))
      }
    }

    // Distance markers past the ramp
    ctx.font = `600 11px ${FONT}`
    ctx.textAlign = 'center'
    const first = Math.ceil((cam.left - RAMP_TOP_X) / 25) * 25
    for (let d = Math.max(25, first); d < cam.left - RAMP_TOP_X + W / S + 25; d += 25) {
      const x = sx(RAMP_TOP_X + d)
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(x - 1, gy - 8, 2, 8)
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(x - 1, gy - 8, 2, 3)
      if (S * 25 > 40) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fillText(`${Math.round(d * FT)} ft`, x, gy + 16)
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
      ctx.fillStyle = p.kind === 'dust' ? `rgba(160,140,110,${a * 0.5})` : `rgba(120,120,125,${a * 0.35})`
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
    g.addColorStop(0, `rgba(255,240,200,${a})`)
    g.addColorStop(0.4, `rgba(255,${Math.round(110 + 90 * a)},40,${a * 0.8})`)
    g.addColorStop(1, 'rgba(255,60,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(sx(p.x), sy(p.y), r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'

  if (game.phase !== 'crashed') drawCar(ctx, game, sx(car.x), sy(car.y), S)
  ctx.restore()
}

// Steel truss ramp curving up toward the sky like ")"
function drawRamp(ctx, sx, sy, S) {
  const posts = []
  for (let x = RUNWAY + 5; x < RAMP_TOP_X; x += 5) posts.push(x)
  posts.push(RAMP_TOP_X)

  ctx.strokeStyle = '#8b95a3'
  ctx.lineWidth = Math.max(1, 0.18 * S)
  ctx.beginPath()
  for (let i = 0; i < posts.length; i++) {
    const x = posts[i]
    const top = x === RAMP_TOP_X ? RAMP_TOP_Y : rampHeightAt(x)
    ctx.moveTo(sx(x), sy(0))
    ctx.lineTo(sx(x), sy(top))
    if (i > 0) {
      const px = posts[i - 1]
      ctx.moveTo(sx(px), sy(0))
      ctx.lineTo(sx(x), sy(top * 0.92))
    }
  }
  ctx.stroke()

  // Concrete footing
  ctx.fillStyle = '#9ca3af'
  ctx.fillRect(sx(RUNWAY), sy(0) - Math.max(2, 0.5 * S), (RAMP_TOP_X - RUNWAY) * S, Math.max(2, 0.5 * S))

  // Deck
  const deck = (offset) => {
    ctx.beginPath()
    for (let i = 0; i <= 50; i++) {
      const phi = (RAMP_END * i) / 50
      const x = sx(RUNWAY + (RAMP_R - offset) * Math.sin(phi))
      const y = sy(RAMP_R - (RAMP_R - offset) * Math.cos(phi))
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
  }
  deck(-0.45)
  ctx.strokeStyle = '#2b2f36'
  ctx.lineWidth = Math.max(4, 0.9 * S)
  ctx.stroke()
  deck(0)
  ctx.strokeStyle = '#facc15'
  ctx.lineWidth = Math.max(1, 0.12 * S)
  ctx.setLineDash([Math.max(4, 1.2 * S), Math.max(4, 1.2 * S)])
  ctx.stroke()
  ctx.setLineDash([])
}

// Side profile in the spirit of the new Roadster: long low nose, glass canopy set back, short tail
function drawCar(ctx, game, x, y, S) {
  const car = game.car
  // Draw at least ~44px long so it stays readable when zoomed out
  const vis = Math.max(1, 44 / (CAR_L * S))
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(S * vis, -S * vis)
  ctx.rotate(car.angle)

  // Thruster flames
  const thrusting = game.phase === 'flight' && game.input && game.input.thrust
  if (thrusting) {
    ctx.globalCompositeOperation = 'lighter'
    for (const off of [-0.85, 0.85]) {
      const len = 1.4 + Math.random() * 0.9
      const g = ctx.createLinearGradient(0, 0.1, 0, 0.1 - len)
      g.addColorStop(0, 'rgba(255,250,220,1)')
      g.addColorStop(0.3, 'rgba(255,190,60,0.95)')
      g.addColorStop(1, 'rgba(255,80,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(off - 0.22, 0.1)
      ctx.quadraticCurveTo(off - 0.18, 0.1 - len * 0.5, off, 0.1 - len)
      ctx.quadraticCurveTo(off + 0.18, 0.1 - len * 0.5, off + 0.22, 0.1)
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  // Body
  const paint = ctx.createLinearGradient(0, 1.15, 0, 0.2)
  paint.addColorStop(0, '#f05252')
  paint.addColorStop(0.45, '#c8102e')
  paint.addColorStop(1, '#6e0a14')
  ctx.fillStyle = paint
  ctx.beginPath()
  ctx.moveTo(2.1, 0.24)
  ctx.bezierCurveTo(2.3, 0.26, 2.34, 0.42, 2.26, 0.5)
  ctx.bezierCurveTo(1.7, 0.66, 1.05, 0.74, 0.6, 0.82)
  ctx.bezierCurveTo(0.2, 1.0, -0.1, 1.06, -0.4, 1.06)
  ctx.bezierCurveTo(-1.05, 1.05, -1.75, 0.92, -2.18, 0.82)
  ctx.lineTo(-2.27, 0.84)
  ctx.bezierCurveTo(-2.32, 0.62, -2.28, 0.38, -2.18, 0.28)
  ctx.quadraticCurveTo(-2.1, 0.22, -1.95, 0.22)
  ctx.closePath()
  ctx.fill()

  // Glass canopy
  const glass = ctx.createLinearGradient(-1, 1.12, 0.4, 0.88)
  glass.addColorStop(0, '#0f172a')
  glass.addColorStop(0.6, '#1e293b')
  glass.addColorStop(1, '#334155')
  ctx.fillStyle = glass
  ctx.beginPath()
  ctx.moveTo(0.5, 0.83)
  ctx.bezierCurveTo(0.15, 0.98, -0.1, 1.02, -0.4, 1.02)
  ctx.bezierCurveTo(-0.85, 1.01, -1.2, 0.95, -1.42, 0.88)
  ctx.lineTo(-1.25, 0.81)
  ctx.lineTo(0.32, 0.79)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 0.035
  ctx.beginPath()
  ctx.moveTo(0.28, 0.9)
  ctx.quadraticCurveTo(-0.1, 0.99, -0.5, 0.98)
  ctx.stroke()

  // Shoulder highlight and dark sill
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 0.03
  ctx.beginPath()
  ctx.moveTo(2.1, 0.5)
  ctx.bezierCurveTo(1, 0.64, -0.8, 0.76, -2.15, 0.74)
  ctx.stroke()
  ctx.fillStyle = '#1a1c20'
  ctx.beginPath()
  ctx.moveTo(1.55, 0.24)
  ctx.lineTo(-1.55, 0.24)
  ctx.lineTo(-1.5, 0.33)
  ctx.lineTo(1.5, 0.33)
  ctx.closePath()
  ctx.fill()

  // Slim light bar up front, full-width tail light at the back
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#f8fafc'
  ctx.lineWidth = 0.06
  ctx.beginPath()
  ctx.moveTo(1.98, 0.55)
  ctx.lineTo(2.22, 0.48)
  ctx.stroke()
  ctx.strokeStyle = '#ff2d2d'
  ctx.beginPath()
  ctx.moveTo(-2.27, 0.76)
  ctx.lineTo(-2.17, 0.76)
  ctx.stroke()
  ctx.lineCap = 'butt'

  // Wheel wells, wheels, and thruster nozzles
  const spin = -car.x / WHEEL_R
  for (const wx of [-1.42, 1.42]) {
    ctx.fillStyle = '#0b0c0e'
    ctx.beginPath()
    ctx.arc(wx, WHEEL_R, WHEEL_R + 0.07, 0, Math.PI)
    ctx.fill()

    ctx.fillStyle = '#121316'
    ctx.beginPath()
    ctx.arc(wx, WHEEL_R, WHEEL_R, 0, Math.PI * 2)
    ctx.fill()
    const rim = ctx.createRadialGradient(wx, WHEEL_R + 0.08, 0.02, wx, WHEEL_R, 0.26)
    rim.addColorStop(0, '#e5e7eb')
    rim.addColorStop(1, '#6b7280')
    ctx.fillStyle = rim
    ctx.beginPath()
    ctx.arc(wx, WHEEL_R, 0.25, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#c8102e'
    ctx.beginPath()
    ctx.arc(wx, WHEEL_R, 0.21, 0.35, 1.0)
    ctx.lineTo(wx, WHEEL_R)
    ctx.fill()
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 0.04
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = spin + (i * Math.PI * 2) / 5
      ctx.moveTo(wx + Math.cos(a) * 0.06, WHEEL_R + Math.sin(a) * 0.06)
      ctx.lineTo(wx + Math.cos(a) * 0.23, WHEEL_R + Math.sin(a) * 0.23)
    }
    ctx.stroke()
    ctx.fillStyle = '#1f2937'
    ctx.beginPath()
    ctx.arc(wx, WHEEL_R, 0.05, 0, Math.PI * 2)
    ctx.fill()
  }
  for (const off of [-0.85, 0.85]) {
    ctx.fillStyle = thrusting ? '#fbbf24' : '#4b5563'
    ctx.fillRect(off - 0.16, 0.12, 0.32, 0.1)
  }
  ctx.restore()
}

function drawHud(ctx, game, W, H) {
  const car = game.car
  const onTrack = game.phase === 'runway' || game.phase === 'ramp'
  const speed = onTrack ? game.speed : Math.hypot(car.vx, car.vy)
  const descent = -car.vy
  const tilt = wrapAngle(car.angle)
  const flying = game.phase === 'flight'
  const good = '#4ade80', bad = '#f87171'

  // Instrument panel
  const panelH = flying ? 150 : 96
  ctx.fillStyle = 'rgba(15,17,21,0.62)'
  rrect(ctx, 12, 12, 150, panelH, 10)
  ctx.fill()
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

  // Launch lights
  const showLights = game.phase === 'countdown' || (game.phase === 'runway' && game.t < 0.5)
  if (showLights) {
    const elapsed = COUNTDOWN - game.countdown
    const lw = 116
    ctx.fillStyle = 'rgba(15,17,21,0.75)'
    rrect(ctx, W / 2 - lw / 2, 16, lw, 40, 20)
    ctx.fill()
    for (let i = 0; i < 3; i++) {
      const lit = game.phase === 'runway' ? 'go' : elapsed >= i * 0.5 ? 'amber' : 'off'
      ctx.fillStyle = lit === 'go' ? '#22c55e' : lit === 'amber' ? '#f59e0b' : '#3f3f46'
      ctx.beginPath()
      ctx.arc(W / 2 - 34 + i * 34, 36, 11, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Message card
  let msg = null
  if (game.phase === 'ready') msg = ['ROADSTER LAUNCH', 'Hit 60 in under a second, fly off the ramp, land it.']
  else if (game.phase === 'crashed') msg = ['CRASHED', game.reason]
  else if (game.phase === 'landed') {
    msg = ['LANDED', `${Math.round(game.touchdown.descent * MPH)} mph touchdown · ${Math.round((car.x - RAMP_TOP_X) * FT)} ft from the ramp · ${Math.round(game.maxAlt * FT)} ft high`]
  }
  if (msg) {
    const boxW = Math.min(W - 24, 480)
    const top = Math.max(H * 0.2, 12 + panelH + 16)
    ctx.fillStyle = 'rgba(15,17,21,0.78)'
    rrect(ctx, (W - boxW) / 2, top, boxW, 78, 14)
    ctx.fill()
    ctx.textAlign = 'center'
    ctx.fillStyle = game.phase === 'crashed' ? bad : game.phase === 'landed' ? good : '#f8fafc'
    ctx.font = `800 24px ${FONT}`
    ctx.fillText(msg[0], W / 2, top + 34)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = `500 ${W < 420 ? 11 : 13}px ${FONT}`
    ctx.fillText(msg[1], W / 2, top + 58)
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
  const [phase, setPhase] = useState('ready')

  const start = () => {
    const game = gameRef.current
    if (game.phase === 'ready') {
      startGame(game)
    } else if (game.phase === 'landed' || game.phase === 'crashed') {
      gameRef.current = newGame()
      gameRef.current.input = inputRef.current
    }
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
      const game = gameRef.current
      const ended = game.phase === 'landed' || game.phase === 'crashed'
      if (down && !e.repeat && (e.key === ' ' || e.key === 'Enter' || e.key === 'r' || e.key === 'R')) {
        if (game.phase === 'ready' || (ended && game.t - game.endedAt > 0.6)) {
          start()
          handled = true
        }
      }
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
      setPhase((p) => (p === game.phase ? p : game.phase))
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
    onPointerDown: (e) => { e.preventDefault(); inputRef.current[action] = true },
    onPointerUp: () => { inputRef.current[action] = false },
    onPointerLeave: () => { inputRef.current[action] = false },
    onPointerCancel: () => { inputRef.current[action] = false },
    onContextMenu: (e) => e.preventDefault(),
  })

  const ended = phase === 'landed' || phase === 'crashed'
  const btn = 'select-none rounded border border-gray-950 py-4 text-lg font-semibold active:bg-gray-200 transition-colors'

  return (
    <div ref={wrapRef} className="w-full select-none" style={{ touchAction: 'none' }}>
      <canvas ref={canvasRef} className="block w-full rounded border border-gray-950" />

      <div className="mt-3">
        {phase === 'ready' || ended ? (
          <button onClick={start} className={`${btn} w-full bg-[#c8102e] text-white active:bg-red-800`}>
            {phase === 'ready' ? 'GO' : 'Try again'}
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <button {...hold('left')} className={btn} aria-label="Tilt back">⟲</button>
            <button {...hold('thrust')} className={`${btn} col-span-2`}>THRUST</button>
            <button {...hold('right')} className={btn} aria-label="Tilt forward">⟳</button>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-3">
        Keyboard: Space to launch, then Space/W to thrust, A/D or arrows to tilt. Land with descent under 11 mph and tilt under 15°.
      </p>
    </div>
  )
}
