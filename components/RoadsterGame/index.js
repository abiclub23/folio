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
const CAR_H = 1.3
const SAFE_VY = 5 // max touchdown descent speed (m/s, ~11 mph)
const SAFE_TILT = (15 * Math.PI) / 180
const ROLL_BRAKE = 10
const STEP = 1 / 120

const MPH = 2.23694
const FT = 3.28084

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
    phase: 'ready', // ready → runway → ramp → flight → rolling → landed | crashed
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

// Deterministic scenery
const CLOUDS = Array.from({ length: 80 }, (_, i) => {
  const r = Math.sin(i * 12.9898) * 43758.5453
  const f = r - Math.floor(r)
  return { x: -150 + i * 55 + f * 30, y: 35 + ((i * 37) % 170), w: 14 + f * 18 }
})
const STARS = Array.from({ length: 90 }, (_, i) => {
  const a = Math.sin(i * 78.233) * 43758.5453
  const b = Math.sin(i * 39.425) * 24634.6345
  return { x: a - Math.floor(a), y: b - Math.floor(b) }
})

function step(game, input, dt) {
  const car = game.car
  game.t += dt

  if (game.phase === 'runway') {
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
    }
  }

  // Particles
  for (const p of game.particles) {
    p.vy -= p.g * dt
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
  for (const off of [-0.8, 0.8]) {
    const px = car.x + fx * off + ux * 0.15
    const py = car.y + fy * off + uy * 0.15
    const speed = 18 + Math.random() * 8
    game.particles.push({
      x: px, y: py,
      vx: car.vx - ux * speed + (Math.random() - 0.5) * 4,
      vy: car.vy - uy * speed + (Math.random() - 0.5) * 4,
      g: -2, life: 0.35 + Math.random() * 0.3, max: 0.65, size: 0.5, kind: 'smoke',
    })
  }
}

function crash(game, reason) {
  const car = game.car
  game.phase = 'crashed'
  game.reason = reason
  game.endedAt = game.t
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * Math.PI * 2
    const s = 4 + Math.random() * 22
    game.particles.push({
      x: car.x, y: Math.max(car.y, 0.5),
      vx: Math.cos(a) * s + car.vx * 0.2, vy: Math.abs(Math.sin(a)) * s,
      g: G, life: 0.8 + Math.random() * 1.2, max: 2, size: 0.4 + Math.random() * 0.6,
      kind: i % 3 === 0 ? 'debris' : 'fire',
    })
  }
}

// ---------- Rendering ----------

function lerp(a, b, t) { return a + (b - a) * t }
function mixColor(c1, c2, t) {
  const r = Math.round(lerp(c1[0], c2[0], t)), g = Math.round(lerp(c1[1], c2[1], t)), b = Math.round(lerp(c1[2], c2[2], t))
  return `rgb(${r},${g},${b})`
}

function updateCamera(game, W, H, dt) {
  const car = game.car
  const ready = game.phase === 'ready'
  const targetViewH = ready ? 80 : Math.min(170, Math.max(40, car.y * 1.3 + 25))
  const cam = game.cam || { viewH: targetViewH, left: 0, bottom: -6 }
  const k = Math.min(1, dt * 3)
  cam.viewH = lerp(cam.viewH, targetViewH, k)
  const scale = H / cam.viewH
  const viewW = W / scale
  const targetLeft = ready ? -6 : car.x - viewW * 0.35
  const targetBottom = car.y < cam.viewH * 0.6 ? -cam.viewH * 0.08 : car.y - cam.viewH * 0.6
  cam.left = game.cam ? lerp(cam.left, targetLeft, Math.min(1, dt * 6)) : targetLeft
  cam.bottom = game.cam ? lerp(cam.bottom, targetBottom, Math.min(1, dt * 6)) : targetBottom
  cam.scale = scale
  game.cam = cam
  return cam
}

function render(ctx, game, W, H) {
  const cam = game.cam
  const S = cam.scale
  const sx = (x) => (x - cam.left) * S
  const sy = (y) => H - (y - cam.bottom) * S
  const car = game.car

  // Sky darkens with altitude, stars come out up high
  const dark = Math.min(1, Math.max(0, car.y / 220))
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, mixColor([126, 192, 238], [10, 14, 40], dark))
  sky.addColorStop(1, mixColor([226, 241, 250], [52, 72, 120], dark))
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  const starAlpha = Math.min(1, Math.max(0, (car.y - 80) / 120))
  if (starAlpha > 0) {
    ctx.fillStyle = `rgba(255,255,255,${starAlpha})`
    for (const s of STARS) ctx.fillRect(s.x * W, s.y * H * 0.8, 1.5, 1.5)
  }

  // Clouds
  ctx.fillStyle = `rgba(255,255,255,${0.85 - dark * 0.4})`
  for (const c of CLOUDS) {
    const x = sx(c.x), y = sy(c.y), w = c.w * S
    if (x + w < 0 || x - w > W || y < -w || y > H + w) continue
    ctx.beginPath()
    ctx.ellipse(x, y, w * 0.5, w * 0.18, 0, 0, Math.PI * 2)
    ctx.ellipse(x - w * 0.22, y + w * 0.04, w * 0.28, w * 0.14, 0, 0, Math.PI * 2)
    ctx.ellipse(x + w * 0.2, y - w * 0.06, w * 0.25, w * 0.16, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Ground
  const gy = sy(0)
  if (gy < H) {
    ctx.fillStyle = '#6b8e4e'
    ctx.fillRect(0, gy, W, H - gy)
    ctx.fillStyle = '#56763d'
    ctx.fillRect(0, gy, W, Math.max(2, 0.6 * S))
    // Runway
    ctx.fillStyle = '#3a3a3a'
    ctx.fillRect(sx(-30), gy - Math.max(1, 0.15 * S), (RUNWAY + 30) * S, Math.max(3, 0.6 * S))
    // Distance markers past the ramp
    ctx.fillStyle = '#f5f5f0'
    ctx.font = '11px Switzer, sans-serif'
    ctx.textAlign = 'center'
    const first = Math.ceil((cam.left - RAMP_TOP_X) / 25) * 25
    for (let d = Math.max(25, first); d < cam.left - RAMP_TOP_X + W / S + 25; d += 25) {
      const x = sx(RAMP_TOP_X + d)
      ctx.fillRect(x - 1, gy - 6, 2, 6)
      if (S * 25 > 40) ctx.fillText(`${Math.round(d * FT)} ft`, x, gy + 16)
    }
  }

  // Ramp: curved surface rising like ")" toward the sky
  ctx.beginPath()
  ctx.moveTo(sx(RUNWAY), sy(0))
  for (let i = 0; i <= 40; i++) {
    const phi = (RAMP_END * i) / 40
    ctx.lineTo(sx(RUNWAY + RAMP_R * Math.sin(phi)), sy(RAMP_R * (1 - Math.cos(phi))))
  }
  ctx.lineTo(sx(RAMP_TOP_X), sy(0))
  ctx.closePath()
  ctx.fillStyle = 'rgba(203,213,225,0.55)'
  ctx.fill()
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = Math.max(1, 0.25 * S)
  for (let x = RUNWAY + 6; x < RAMP_TOP_X; x += 6) {
    ctx.beginPath()
    ctx.moveTo(sx(x), sy(0))
    ctx.lineTo(sx(x), sy(rampHeightAt(x)))
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.moveTo(sx(RAMP_TOP_X), sy(0))
  ctx.lineTo(sx(RAMP_TOP_X), sy(RAMP_TOP_Y))
  ctx.stroke()
  ctx.beginPath()
  for (let i = 0; i <= 40; i++) {
    const phi = (RAMP_END * i) / 40
    const x = sx(RUNWAY + RAMP_R * Math.sin(phi)), y = sy(RAMP_R * (1 - Math.cos(phi)))
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = Math.max(3, 0.6 * S)
  ctx.stroke()

  // Particles
  for (const p of game.particles) {
    const a = Math.max(0, p.life / p.max)
    ctx.fillStyle =
      p.kind === 'smoke' ? `rgba(255,${Math.round(150 + 100 * a)},60,${a})`
      : p.kind === 'fire' ? `rgba(255,${Math.round(80 + 120 * a)},20,${a})`
      : `rgba(40,40,40,${a})`
    const r = Math.max(1.5, p.size * S)
    ctx.beginPath()
    ctx.arc(sx(p.x), sy(p.y), r, 0, Math.PI * 2)
    ctx.fill()
  }

  if (game.phase !== 'crashed') drawCar(ctx, game, sx(car.x), sy(car.y), S)
}

function drawCar(ctx, game, x, y, S) {
  const car = game.car
  // Draw at least ~34px long so it stays readable when zoomed out
  const vis = Math.max(1, 34 / (CAR_L * S))
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(S * vis, -S * vis)
  ctx.rotate(car.angle)

  // Thruster flames
  if (game.phase === 'flight' && game.input.thrust) {
    for (const off of [-0.8, 0.8]) {
      const len = 1.2 + Math.random() * 0.8
      ctx.fillStyle = '#ffb703'
      ctx.beginPath()
      ctx.moveTo(off - 0.28, 0.12)
      ctx.lineTo(off + 0.28, 0.12)
      ctx.lineTo(off, 0.12 - len)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fff3b0'
      ctx.beginPath()
      ctx.moveTo(off - 0.13, 0.12)
      ctx.lineTo(off + 0.13, 0.12)
      ctx.lineTo(off, 0.12 - len * 0.5)
      ctx.closePath()
      ctx.fill()
    }
  }

  // Body
  ctx.fillStyle = '#d62828'
  ctx.beginPath()
  ctx.moveTo(-2.2, 0.3)
  ctx.lineTo(-2.25, 0.82)
  ctx.lineTo(-1.4, 0.95)
  ctx.lineTo(-0.75, 1.28)
  ctx.lineTo(0.25, 1.28)
  ctx.lineTo(0.95, 0.95)
  ctx.lineTo(2.25, 0.62)
  ctx.lineTo(2.25, 0.32)
  ctx.closePath()
  ctx.fill()
  // Windows
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.moveTo(-0.62, 1.0)
  ctx.lineTo(-0.52, 1.2)
  ctx.lineTo(0.2, 1.2)
  ctx.lineTo(0.75, 0.98)
  ctx.closePath()
  ctx.fill()
  // Lights
  ctx.fillStyle = '#fef3c7'
  ctx.fillRect(2.0, 0.5, 0.25, 0.08)
  ctx.fillStyle = '#7f1d1d'
  ctx.fillRect(-2.25, 0.62, 0.15, 0.1)
  // Thruster pods
  ctx.fillStyle = '#6b7280'
  ctx.fillRect(-1.05, 0.12, 0.5, 0.2)
  ctx.fillRect(0.55, 0.12, 0.5, 0.2)
  // Wheels
  for (const wx of [-1.45, 1.45]) {
    ctx.fillStyle = '#111'
    ctx.beginPath()
    ctx.arc(wx, 0.33, 0.33, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#9ca3af'
    ctx.beginPath()
    ctx.arc(wx, 0.33, 0.14, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawHud(ctx, game, W, H) {
  const car = game.car
  const onTrack = game.phase === 'runway' || game.phase === 'ramp'
  const speed = onTrack ? game.speed : Math.hypot(car.vx, car.vy)
  const descent = -car.vy
  const tilt = Math.abs(wrapAngle(car.angle))
  const darkSky = car.y > 110

  ctx.textAlign = 'left'
  ctx.font = '600 14px Switzer, sans-serif'
  ctx.fillStyle = darkSky ? '#f1f5f9' : '#1f2937'
  const lines = [
    `Speed  ${Math.round(speed * MPH)} mph`,
    `Altitude  ${Math.round(Math.max(0, car.y) * FT)} ft`,
  ]
  if (game.zeroSixty !== null) lines.push(`0–60  ${game.zeroSixty.toFixed(2)}s`)
  lines.forEach((l, i) => ctx.fillText(l, 12, 22 + i * 19))

  if (game.phase === 'flight') {
    const safeDescent = descent <= SAFE_VY
    const safeTilt = tilt <= SAFE_TILT
    ctx.fillStyle = safeDescent ? (darkSky ? '#4ade80' : '#16a34a') : (darkSky ? '#f87171' : '#dc2626')
    ctx.fillText(`Descent  ${Math.max(0, Math.round(descent * MPH))} mph`, 12, 22 + lines.length * 19)
    ctx.fillStyle = safeTilt ? (darkSky ? '#4ade80' : '#16a34a') : (darkSky ? '#f87171' : '#dc2626')
    ctx.fillText(`Tilt  ${Math.round((tilt * 180) / Math.PI)}°`, 12, 22 + (lines.length + 1) * 19)

    // Ground is off screen: point at it
    if (H - (0 - game.cam.bottom) * game.cam.scale > H) {
      ctx.textAlign = 'center'
      ctx.fillStyle = '#f1f5f9'
      ctx.fillText(`▼ ground ${Math.round(car.y * FT)} ft`, W / 2, H - 12)
    }
  }

  ctx.textAlign = 'center'
  let msg = null
  if (game.phase === 'ready') msg = ['Roadster Launch', 'Hit 60 in under a second, fly off the ramp, land it.']
  else if (game.phase === 'crashed') msg = ['Crashed', game.reason]
  else if (game.phase === 'landed') {
    msg = ['Landed!', `${Math.round(game.touchdown.descent * MPH)} mph touchdown · ${Math.round((car.x - RAMP_TOP_X) * FT)} ft from the ramp · ${Math.round(game.maxAlt * FT)} ft high`]
  }
  if (msg) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    const boxW = Math.min(W - 24, 460)
    ctx.fillRect((W - boxW) / 2, H * 0.18, boxW, 70)
    ctx.fillStyle = game.phase === 'crashed' ? '#b91c1c' : '#1f2937'
    ctx.font = '700 22px Switzer, sans-serif'
    ctx.fillText(msg[0], W / 2, H * 0.18 + 30)
    ctx.fillStyle = '#374151'
    ctx.font = `${W < 420 ? 11 : 13}px Switzer, sans-serif`
    ctx.fillText(msg[1], W / 2, H * 0.18 + 54)
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
      game.phase = 'runway'
      game.t = 0
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
          <button onClick={start} className={`${btn} w-full bg-[#d62828] text-white active:bg-red-800`}>
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
