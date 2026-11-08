// Roadster Launch game rules: physics, phases and particles. No drawing here.
// Units are meters and seconds, with y pointing up.
const G = 9.8
const LAUNCH_ACCEL = 30 // m/s² → 0–60 mph in ~0.9s
export const RAMP_R = 20 // radius of the ")" curve
export const RAMP_END = (165 * Math.PI) / 180 // the curve bends back over the top; the car leaves upside down, heading back
export const TOWER_W = 3.5
export const TOWER_H = 2 * RAMP_R + 3
const THRUST = 22
const TURN_RATE = 3 // rad/s
export const CAR_L = 4.5
export const CAR_H = 1.2
export const WHEEL_R = 0.36
export const SAFE_VY = 5 // max touchdown descent speed (m/s, ~11 mph)
export const SAFE_TILT = (15 * Math.PI) / 180
const ROLL_BRAKE = 14
const AIR_DRAG = 0.02 // quadratic drag: bleeds off launch speed fast, terminal velocity ~22 m/s
// Easter egg: thrust high enough and you reach "space", a nod to the Roadster SpaceX launched in 2018
export const SPACE_ALT = 305 // ~1,000 ft
const ROLL_DRAG = 1.5 // slowing on the track when you're off the throttle
export const STEP = 1 / 120

export const MPH = 2.23694
export const FT = 3.28084

// Where the ramp sits depends on the runway length (longer on phones), so each game carries its own track
function makeTrack(runway) {
  return {
    runway, // flat track before the ramp
    lipX: runway + RAMP_R * Math.sin(RAMP_END),
    towerX: runway + RAMP_R + 1.5, // lattice tower behind the curve
  }
}

// Solid parts of the ramp: the curved deck and the tower behind it
function hitsRamp(track, x, y) {
  if (x >= track.towerX && x <= track.towerX + TOWER_W && y <= TOWER_H) return true
  const dx = x - track.runway, dy = RAMP_R - y
  if (dx < 0) return false
  const d = Math.hypot(dx, dy)
  return d > RAMP_R - 0.3 && d < RAMP_R + 1.2 && Math.atan2(dx, dy) <= RAMP_END + 0.05
}

export function wrapAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a))
}

// The car's forward (fx, fy) and up (ux, uy) directions in the world
function carAxes(car) {
  const fx = Math.cos(car.angle), fy = Math.sin(car.angle)
  return { fx, fy, ux: -fy, uy: fx }
}

// A point on the car (x forward, y up, measured from between the wheels) in world coordinates
function toWorld(car, x, y) {
  const { fx, fy, ux, uy } = carAxes(car)
  return [car.x + fx * x + ux * y, car.y + fy * x + uy * y]
}

function carCorners(car) {
  const h = CAR_L / 2
  return [[-h, 0], [h, 0], [-h, CAR_H], [h, CAR_H]].map(([x, y]) => toWorld(car, x, y))
}

export function newGame({ runway = 40 } = {}) {
  return {
    phase: 'ready', // ready → runway ⇄ ramp → flight → rolling → landed | crashed
    track: makeTrack(runway),
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
export function pressThrust(game, runway) {
  if (game.phase === 'ready') startGame(game)
  else if (canRestart(game)) return newGame({ runway })
  return game
}

export function startGame(game) {
  game.phase = 'runway'
  game.t = 0
}

// A finished run can restart once its result card is up
export function canRestart(game) {
  const ended = game.phase === 'landed' || (game.phase === 'crashed' && crashCardReady(game))
  return ended && game.t - game.endedAt > 0.6
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
export function landingGrade(mph) {
  if (mph <= 3) return 'BUTTER. ABSOLUTE BUTTER.'
  if (mph <= 7) return 'PASSENGERS CLAPPED'
  return 'TECHNICALLY A LANDING'
}

// Slow motion for the last few feet before touchdown
export function slowMo(game) {
  const c = game.car
  return game.phase === 'flight' && game.flightTime > 1 && c.vy < -1 && c.y < 7
}

export function step(game, input, dt) {
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
    if (car.x >= game.track.runway) {
      game.phase = 'ramp'
      game.phi = (car.x - game.track.runway) / RAMP_R
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
      car.x = game.track.runway + game.phi * RAMP_R
      car.y = 0
      car.angle = 0
      game.phi = 0
    }
    if (game.phase !== 'runway') {
      car.x = game.track.runway + RAMP_R * Math.sin(game.phi)
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
      corners.some(([x, y]) => hitsRamp(game.track, x, y))
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
    p.vx *= 1 - p.drag * dt
    p.vy *= 1 - p.drag * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.y < 0) { p.y = 0; p.vy *= -0.3; p.vx *= 0.7 }
    p.life -= dt
  }
  game.particles = game.particles.filter((p) => p.life > 0)
}

// Particles: x/y position, vx/vy velocity, g gravity (negative floats up), drag, life/max seconds, size meters
function spawn(game, p) {
  game.particles.push({ drag: 0, ...p })
}

function emitThrust(game) {
  const car = game.car
  const { ux, uy } = carAxes(car)
  for (const off of [-0.9, 0.9]) {
    const [px, py] = toWorld(car, off, 0.18)
    const speed = 18 + Math.random() * 8
    spawn(game, {
      x: px, y: py,
      vx: car.vx - ux * speed + (Math.random() - 0.5) * 4,
      vy: car.vy - uy * speed + (Math.random() - 0.5) * 4,
      g: -2, life: 0.3 + Math.random() * 0.3, max: 0.6, size: 0.45, kind: 'flame',
    })
    if (Math.random() < 0.35) {
      spawn(game, {
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
  spawn(game, {
    x: car.x - 1.5, y: 0.25,
    vx: -2 - Math.random() * 3, vy: 0.3 + Math.random() * 0.8,
    g: -0.4, drag: 1.5, life: 0.6 + Math.random() * 0.5, max: 1.1, size: 0.45 + Math.random() * 0.3, kind: 'smoke',
  })
}

// Small side jets at the nose and tail push opposite ways to rotate the car
export const JETS = [{ x: 1.95, y: 0.52 }, { x: -2.05, y: 0.62 }]
export function jetDirs(turn) {
  // Nose up (turn > 0): nose jet blows down, tail jet blows up
  return [-turn, turn]
}
function emitJets(game, turn) {
  if (Math.random() < 0.5) return
  const car = game.car
  const { ux, uy } = carAxes(car)
  const dirs = jetDirs(turn)
  JETS.forEach((j, i) => {
    const s = 8 + Math.random() * 4
    const [x, y] = toWorld(car, j.x, j.y)
    spawn(game, {
      x, y,
      vx: car.vx + ux * dirs[i] * s + (Math.random() - 0.5) * 2,
      vy: car.vy + uy * dirs[i] * s + (Math.random() - 0.5) * 2,
      g: -1, drag: 3, life: 0.5 + Math.random() * 0.4, max: 0.9, size: 0.35, kind: 'smoke',
    })
  })
}

function dust(game) {
  const car = game.car
  for (let i = 0; i < 30; i++) {
    spawn(game, {
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
    spawn(game, {
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
    spawn(game, {
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
export function crashCardReady(game) {
  return !game.driver || (game.driver.state === 'standing' && game.driver.t > 0.9)
}
