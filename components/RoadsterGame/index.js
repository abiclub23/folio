// Roadster launch game: 0–60 in under a second, up a ramp to the sky, then thrusters to land
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// Physics (meters, seconds, y points up)
const G = 9.8
const LAUNCH_ACCEL = 30 // m/s² → 0–60 mph in ~0.9s
const RAMP_R = 20 // radius of the ")" curve
const RAMP_END = (165 * Math.PI) / 180 // the curve bends back over the top; the car leaves upside down, heading back
const TOWER_W = 3.5
// Track layout depends on runway length, which is longer on phones; set at the start of each run
let RUNWAY = 40 // flat track before the ramp
let RAMP_LIP_X = 0
let TOWER_X = 0 // lattice tower behind the curve
let nextRunway = 40
function layoutTrack(runway) {
  RUNWAY = runway
  RAMP_LIP_X = RUNWAY + RAMP_R * Math.sin(RAMP_END)
  TOWER_X = RUNWAY + RAMP_R + 1.5
}
// Called by the page when the screen size is known; takes effect on the next run
function preferRunway(length) {
  nextRunway = length
}
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
// Easter egg: thrust high enough and you reach "space", a nod to the Roadster SpaceX launched in 2018
const SPACE_ALT = 305 // ~1,000 ft
const ROLL_DRAG = 1.5 // slowing on the track when you're off the throttle
const STEP = 1 / 120

const MPH = 2.23694
const FT = 3.28084
const FONT = 'Barlow, system-ui, sans-serif'

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
  layoutTrack(nextRunway)
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
  else if ((game.phase === 'landed' || (game.phase === 'crashed' && crashCardReady(game))) && game.t - game.endedAt > 0.6) return newGame()
  return game
}

function startGame(game) {
  if (game.phase !== 'ready') return
  game.phase = 'runway'
  game.t = 0
}

const CRASH_QUIPS = [
  'Insurance has been notified.',
  'Have you tried turning it off and on again?',
  "That's one way to park.",
  'The warranty does not cover this.',
  'Ludicrous indeed.',
  'Did anyone get that on video?',
]

// Touchdown grades, softest first
function landingGrade(mph) {
  if (mph <= 3) return 'BUTTER. ABSOLUTE BUTTER.'
  if (mph <= 7) return 'PASSENGERS CLAPPED'
  return 'TECHNICALLY A LANDING'
}

// Slow motion for the last few feet before touchdown
function slowMo(game) {
  const c = game.car
  return game.phase === 'flight' && game.flightTime > 1 && c.vy < -1 && c.y < 7
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
    if (!game.starman && car.y > SPACE_ALT) {
      game.starman = true
      game.toast = { title: "DON'T PANIC", line: 'You made it to space. Starman would be proud.', at: game.t }
    }

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

  if (game.driver) stepDriver(game.driver, dt)

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
  game.quip = CRASH_QUIPS[Math.floor(Math.random() * CRASH_QUIPS.length)]
  ejectDriver(game)
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

// On a crash the driver pops out, does a somersault, lands on their feet and gives a thumbs up
function ejectDriver(game) {
  const car = game.car
  const y0 = Math.max(car.y, 0) + 1
  const vy = 11
  const vx = Math.max(-6, Math.min(6, car.vx * 0.15))
  // Spin a whole number of flips so the landing is upright
  const airtime = (vy + Math.sqrt(vy * vy + 2 * G * y0)) / G
  const flips = Math.max(1, Math.round(airtime / 1.1))
  game.driver = { x: car.x, y: y0, vx, vy, rot: 0, spin: (-2 * Math.PI * flips) / airtime, state: 'air', t: 0 }
}

function stepDriver(d, dt) {
  d.t += dt
  if (d.state !== 'air') return
  d.vy -= G * dt
  d.x += d.vx * dt
  d.y += d.vy * dt
  d.rot += d.spin * dt
  if (d.y <= 0 && d.vy < 0) {
    d.y = 0
    d.rot = 0
    d.state = 'standing'
    d.t = 0
  }
}

// Crash card waits until the driver has landed and given the thumbs up
function crashCardReady(game) {
  return !game.driver || (game.driver.state === 'standing' && game.driver.t > 0.9)
}

// ---------- Sound ----------

// Synthesized with Web Audio, so there are no files to load. Starts on the first key press or tap.
const Sound = {
  ctx: null,
  nodes: null,
  muted: false,
  lastPhase: null,
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
    if (!AC) return
    const ctx = (this.ctx = new AC())
    const master = ctx.createGain()
    master.gain.value = this.muted ? 0 : 0.5
    master.connect(ctx.destination)

    // Electric motor: a low saw for body plus a sine whine that climbs with speed
    const motor = ctx.createOscillator()
    motor.type = 'sawtooth'
    const motorF = ctx.createBiquadFilter()
    motorF.type = 'lowpass'
    motorF.frequency.value = 900
    const motorG = ctx.createGain()
    motorG.gain.value = 0
    motor.connect(motorF).connect(motorG).connect(master)
    motor.start()
    const whine = ctx.createOscillator()
    const whineG = ctx.createGain()
    whineG.gain.value = 0
    whine.connect(whineG).connect(master)
    whine.start()

    // Looping noise feeds the thrusters (band-passed) and wind (low-passed)
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    this.noiseBuf = buf
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    noise.loop = true
    const thrF = ctx.createBiquadFilter()
    thrF.type = 'bandpass'
    thrF.frequency.value = 500
    thrF.Q.value = 0.5
    const thrG = ctx.createGain()
    thrG.gain.value = 0
    const windF = ctx.createBiquadFilter()
    windF.type = 'lowpass'
    windF.frequency.value = 300
    const windG = ctx.createGain()
    windG.gain.value = 0
    noise.connect(thrF).connect(thrG).connect(master)
    noise.connect(windF).connect(windG).connect(master)
    noise.start()
    this.nodes = { master, motor, motorG, whine, whineG, thrG, windF, windG }
  },
  ramp(param, value) {
    param.setTargetAtTime(value, this.ctx.currentTime, 0.06)
  },
  setMuted(muted) {
    this.muted = muted
    if (this.nodes) this.ramp(this.nodes.master.gain, muted ? 0 : 0.5)
  },
  // Called every frame: continuous sounds follow the game, one-shots fire on phase changes
  update(game, input, slow) {
    if (!this.nodes) return
    const n = this.nodes
    const car = game.car
    const onTrack = game.phase === 'runway' || game.phase === 'ramp'
    const sp = onTrack ? Math.abs(game.speed) : 0
    this.ramp(n.motor.frequency, 35 + sp * 4)
    this.ramp(n.whine.frequency, 220 + sp * 32)
    this.ramp(n.motorG.gain, onTrack ? (input.thrust ? 0.1 : 0.03) : 0)
    this.ramp(n.whineG.gain, onTrack ? (input.thrust ? 0.045 : 0.012) : 0)
    const flying = game.phase === 'flight'
    this.ramp(n.thrG.gain, flying && input.thrust ? 0.55 : 0)
    const v = flying ? Math.hypot(car.vx, car.vy) : 0
    this.ramp(n.windG.gain, Math.min(0.3, v / 100) * (slow ? 0.4 : 1))
    this.ramp(n.windF.frequency, 250 + v * 12)

    if (game.phase !== this.lastPhase) {
      if (game.phase === 'crashed') this.boing()
      if (game.phase === 'rolling') this.thud()
      if (game.phase === 'landed') this.chime()
      this.lastPhase = game.phase
    }
    if (game.starman && !this.playedStarman) this.fanfare()
    this.playedStarman = !!game.starman
  },
  // Cartoon crash: a wobbling pitch drop over a low thump
  boing() {
    const c = this.ctx, t = c.currentTime, out = this.nodes.master
    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(560, t)
    o.frequency.exponentialRampToValueAtTime(80, t + 0.7)
    const lfo = c.createOscillator()
    lfo.frequency.value = 16
    const depth = c.createGain()
    depth.gain.value = 45
    lfo.connect(depth).connect(o.frequency)
    const g = c.createGain()
    g.gain.setValueAtTime(0.45, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8)
    o.connect(g).connect(out)
    o.start(t)
    lfo.start(t)
    o.stop(t + 0.85)
    lfo.stop(t + 0.85)
    this.thud(0.9)
  },
  thud(level = 0.5) {
    const c = this.ctx, t = c.currentTime
    const src = c.createBufferSource()
    src.buffer = this.noiseBuf
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 250
    const g = c.createGain()
    g.gain.setValueAtTime(level, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    src.connect(f).connect(g).connect(this.nodes.master)
    src.start(t)
    src.stop(t + 0.4)
  },
  // Rising synth arpeggio for reaching space
  fanfare() {
    const c = this.ctx, t = c.currentTime
    ;[392, 523, 659, 784, 1047].forEach((freq, i) => {
      const o = c.createOscillator()
      o.type = 'square'
      o.frequency.value = freq
      const f = c.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = 2200
      const g = c.createGain()
      const at = t + i * 0.14
      g.gain.setValueAtTime(0, at)
      g.gain.linearRampToValueAtTime(0.08, at + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, at + (i === 4 ? 1.2 : 0.4))
      o.connect(f).connect(g).connect(this.nodes.master)
      o.start(at)
      o.stop(at + 1.3)
    })
  },
  chime() {
    const c = this.ctx, t = c.currentTime
    ;[660, 880, 1320].forEach((freq, i) => {
      const o = c.createOscillator()
      o.frequency.value = freq
      const g = c.createGain()
      g.gain.setValueAtTime(0, t + i * 0.1)
      g.gain.linearRampToValueAtTime(0.18, t + i * 0.1 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.5)
      o.connect(g).connect(this.nodes.master)
      o.start(t + i * 0.1)
      o.stop(t + i * 0.1 + 0.55)
    })
  },
}

// ---------- Rendering ----------

function lerp(a, b, t) { return a + (b - a) * t }
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

function updateCamera(game, W, H, dt) {
  // After a crash, follow the ejected driver
  const car = game.driver ? { x: game.driver.x, y: game.driver.y, vx: game.driver.vx } : game.car
  const parked = game.phase === 'ready'
  const span = TOWER_X + TOWER_W + 10
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
  // Touch screens get button wording instead of keyboard keys
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
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
      line: `${mph.toFixed(1)} mph touchdown · ${Math.round(Math.abs(car.x - RUNWAY) * FT)} ft from the ramp · ${Math.round(game.maxAlt * FT)} ft high`,
      color: good,
      detail: game.starman ? 'Went to space and back. Starman approves.' : undefined,
    }
  }
  const again = (game.phase === 'landed' || (game.phase === 'crashed' && crashCardReady(game))) && game.t - game.endedAt > 0.6
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
  const [muted, setMuted] = useState(false)
  // 'phone-portrait' asks to rotate; 'phone-landscape' goes full screen with controls over the game
  const [mode, setMode] = useState('default')

  useEffect(() => {
    const portrait = window.matchMedia('(pointer: coarse) and (orientation: portrait) and (max-width: 600px)')
    const landscape = window.matchMedia('(pointer: coarse) and (orientation: landscape) and (max-height: 600px)')
    const update = () => setMode(portrait.matches ? 'phone-portrait' : landscape.matches ? 'phone-landscape' : 'default')
    update()
    portrait.addEventListener('change', update)
    landscape.addEventListener('change', update)
    return () => {
      portrait.removeEventListener('change', update)
      landscape.removeEventListener('change', update)
    }
  }, [])

  const toggleMute = () => {
    setMuted((m) => {
      Sound.setMuted(!m)
      try { localStorage.setItem('roadster-muted', !m ? '1' : '0') } catch {}
      return !m
    })
  }

  const pressStart = () => {
    const next = pressThrust(gameRef.current)
    next.input = inputRef.current
    gameRef.current = next
  }

  useEffect(() => {
    let savedMute = false
    try { savedMute = localStorage.getItem('roadster-muted') === '1' } catch {}
    setMuted(savedMute)
    Sound.setMuted(savedMute)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W = 0, H = 0, dpr = 1

    const resize = () => {
      W = wrapRef.current.clientWidth
      H = wrapRef.current.clientHeight
      dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      // Phones get a longer runway for more build-up before the ramp
      preferRunway(W < 640 || window.matchMedia('(pointer: coarse)').matches ? 70 : 40)
    }
    resize()
    gameRef.current = newGame()
    gameRef.current.input = inputRef.current
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
      if (down) Sound.init()
      if (down && !e.repeat && KEYS.thrust.includes(e.key)) pressStart()
      if (down && !e.repeat && (e.key === 'm' || e.key === 'M')) toggleMute()
      if (handled) e.preventDefault()
    }
    const down = onKey(true), up = onKey(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    let raf, last = performance.now(), acc = 0
    const loop = (now) => {
      const frame = Math.min(0.05, (now - last) / 1000)
      last = now
      const game = gameRef.current
      const slow = slowMo(game)
      acc += frame * (slow ? 0.3 : 1)
      while (acc >= STEP) {
        step(game, inputRef.current, STEP)
        acc -= STEP
      }
      Sound.update(game, inputRef.current, slow)
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
      if (Sound.ctx) Sound.ctx.close()
      Sound.ctx = Sound.nodes = Sound.lastPhase = null
    }
  }, [])

  const hold = (action) => {
    const release = (e) => {
      inputRef.current[action] = false
      delete e.currentTarget.dataset.on
    }
    return {
      onPointerDown: (e) => {
        e.preventDefault()
        inputRef.current[action] = true
        e.currentTarget.dataset.on = '1'
        Sound.init()
        try { navigator.vibrate?.(8) } catch {}
        if (action === 'thrust') pressStart()
      },
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
      onContextMenu: (e) => e.preventDefault(),
    }
  }

  const tiltBtn =
    'flex select-none flex-col items-center justify-center gap-1 rounded-2xl border border-[#3a3f46] bg-gradient-to-b from-[#2a2e34] to-[#1d2025] py-3 text-[#eceae4] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-75 data-[on=1]:scale-[0.96] data-[on=1]:border-[#6b7280] data-[on=1]:from-[#353a42] data-[on=1]:to-[#2a2e34]'
  const thrustBtn =
    'flex select-none items-center justify-center gap-2 border border-white/60 bg-gradient-to-b from-white to-[#dfe3e8] font-barlow-condensed font-bold uppercase tracking-[0.1em] text-[#17191c] shadow-[inset_0_-2px_0_rgba(0,0,0,0.08),0_6px_18px_rgba(0,0,0,0.35)] transition-transform duration-75 data-[on=1]:scale-[0.96] data-[on=1]:from-white data-[on=1]:to-white data-[on=1]:shadow-[0_0_28px_rgba(255,255,255,0.55)]'
  // Round, see-through thumb buttons for phones held sideways
  const padBtn =
    'flex select-none items-center justify-center rounded-full border border-white/25 bg-[#17191c]/55 text-[#eceae4] backdrop-blur-sm transition-transform duration-75 data-[on=1]:scale-[0.94] data-[on=1]:bg-white/25'
  const caption = 'font-barlow-condensed text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#9aa0a8]'
  const phone = mode === 'phone-landscape'

  const icons = {
    up: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    ),
    down: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
    ),
    flame: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
  }

  const muteButton = (
    <button
      onClick={() => { Sound.init(); toggleMute() }}
      className="rounded-md border border-[#3a3f46] bg-[#17191c]/60 p-1.5 text-[#eceae4] hover:bg-[#23262b]"
      aria-label={muted ? 'Turn sound on' : 'Mute sound'}
      title={muted ? 'Sound off (M)' : 'Sound on (M)'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4z" />
        {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
      </svg>
    </button>
  )

  // One-screen app: title strip, game filling the middle, thumb controls on touch screens
  return (
    <div
      className={`fixed inset-0 flex select-none flex-col overflow-hidden bg-[#17191c] font-barlow text-[#eceae4] ${phone ? '' : 'gap-2.5 px-4 pt-3'}`}
      style={{ touchAction: 'none', paddingBottom: phone ? 0 : 'max(12px, env(safe-area-inset-bottom))' }}
    >
      {!phone && (
        <header className="flex w-full flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-barlow-condensed text-[1.6rem] font-bold uppercase tracking-[0.04em]">
            <Link href="/projects" className="mr-3 align-middle text-base text-[#9aa0a8] hover:text-[#eceae4]" aria-label="Back to projects">←</Link>
            Roadster <span className="text-[#d62828]">Launch</span>
          </h1>
          <div className="flex items-center gap-3 text-sm tabular-nums text-[#9aa0a8]">
            <span>0–60 in 0.9s · land under 11 mph, within 15° of level</span>
            {muteButton}
          </div>
        </header>
      )}

      <div ref={wrapRef} className="relative min-h-0 w-full flex-1">
        <canvas
          ref={canvasRef}
          className={`block h-full w-full ${phone ? '' : 'rounded-md border border-[#3a3f46]'}`}
          aria-label="Roadster launch game"
        />

        {phone && (
          <>
            <div className="absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-2">
              <Link href="/projects" className="rounded-md border border-[#3a3f46] bg-[#17191c]/60 px-2.5 py-1 text-[#eceae4]" aria-label="Back to projects">←</Link>
              {muteButton}
            </div>
            <div
              className="absolute flex gap-3"
              style={{ left: 'max(16px, env(safe-area-inset-left))', bottom: 'max(14px, env(safe-area-inset-bottom))' }}
            >
              <button {...hold('left')} className={`${padBtn} h-[72px] w-[72px]`} aria-label="Tilt nose up">{icons.up(28)}</button>
              <button {...hold('right')} className={`${padBtn} h-[72px] w-[72px]`} aria-label="Tilt nose down">{icons.down(28)}</button>
            </div>
            <button
              {...hold('thrust')}
              className={`${thrustBtn} absolute h-[96px] w-[96px] flex-col gap-0.5 rounded-full text-[0.8rem]`}
              style={{ right: 'max(16px, env(safe-area-inset-right))', bottom: 'max(14px, env(safe-area-inset-bottom))' }}
            >
              {icons.flame(30)}
              Thrust
            </button>
          </>
        )}
      </div>

      {!phone && (
        <>
          {/* Touch controls for tablets; keyboard users get the hint instead */}
          <div className="hidden w-full grid-cols-[1fr_1.6fr_1fr] gap-2.5 [@media(pointer:coarse)]:grid">
            <button {...hold('left')} className={tiltBtn} aria-label="Tilt nose up">
              {icons.up(26)}
              <span className={caption}>Nose up</span>
            </button>
            <button {...hold('thrust')} className={`${thrustBtn} rounded-2xl text-[1.35rem]`}>
              {icons.flame(24)}
              Thrust
            </button>
            <button {...hold('right')} className={tiltBtn} aria-label="Tilt nose down">
              {icons.down(26)}
              <span className={caption}>Nose down</span>
            </button>
          </div>
          <p className="w-full text-[0.8rem] text-[#9aa0a8] [@media(pointer:coarse)]:hidden">
            Keyboard: hold ↑ or W to drive and thrust, A/D or ←/→ to tilt, M to mute.
          </p>
        </>
      )}

      {mode === 'phone-portrait' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#17191c] px-8 text-center">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#eceae4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="motion-safe:animate-turn-phone">
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <path d="M11 18h2" />
          </svg>
          <h2 className="font-barlow-condensed text-3xl font-bold uppercase tracking-[0.04em]">
            Rotate your <span className="text-[#d62828]">phone</span>
          </h2>
          <p className="text-[#9aa0a8]">Roadster Launch plays sideways, with the controls under your thumbs.</p>
          <Link href="/projects" className="mt-2 text-sm text-[#9aa0a8] underline">Back to projects</Link>
        </div>
      )}
    </div>
  )
}
