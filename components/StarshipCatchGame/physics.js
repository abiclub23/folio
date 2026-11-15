// Starship Catch game rules, modelled on the Flight 15 ship catch: the ship falls belly-first toward the tower,
// lights its engines and swings upright, then slows to a near hover and eases into the chopsticks.
// No drawing here. Units are meters and seconds, with y pointing up. Speeds are scaled down from the real thing
// so there is time to react.
import { FT, MPH, spawn, stepParticles, wrapAngle } from '../GameKit/physics'

export { FT, MPH, wrapAngle }

const G = 9.8
export const STEP = 1 / 120

// Ship, positioned by the center of its engines; angle 0 is upright, positive leans left (nose toward -x)
export const SHIP_H = 52
export const SHIP_W = 9
export const PIN_Y = 40 // catch fittings just below the forward flaps, measured up from the engines
const BELLY_ANGLE = -Math.PI / 2 // lying flat, nose toward the tower, heat shield down

// Belly-flop: drag holds the fall to about 20 m/s and the flaps steer sideways
const BELLY_DRAG = 0.0245 // quadratic, vertical
const FLAP_ACCEL = 4 // m/s² sideways while steering
const BELLY_SIDE_DRAG = 0.35 // per second

// Flip and powered flight: full throttle beats gravity by ~5 m/s², idle still burns so the fall stays gentle
const FLIP_TIME = 1.6 // seconds to swing upright
const FLIP_THRUST = 21
const FULL_THRUST = 15
const IDLE_THRUST = 6.5
// Gentle and well damped: sideways speed builds over a second or so and stops soon after you let go
const SIDE_ACCEL = 3.6 // m/s² sideways from engine gimbal and thrusters
const SIDE_DRAG = 1.1 // per second, so sideways speed tops out near 3.3 m/s (7 mph)

// Tower and pad: x = 0 is the tower's left face, the chopsticks reach left from it
export const TOWER_X = 0
export const TOWER_W = 12
export const TOWER_H = 146
export const ARM_Y = 100 // chopstick height
export const ARM_LEN = 26
export const CATCH_X = -13 // ship center for a perfect catch
export const MOUNT = { x0: -24, x1: -2, top: 20 } // launch mount under the catch point
export const OCEAN_X = -250 // the Gulf starts left of here

// What counts as a good catch
const CATCH_TOL = 4.5 // meters either side of center (~15 ft)
export const SAFE_VY = 6.7 // m/s, about 15 mph
export const SAFE_VX = 3.5 // m/s, about 8 mph
export const LIGHT_UP_Y = 260 // below this the HUD asks you to light the engines

export function newGame() {
  return {
    phase: 'ready', // ready → belly → flip → powered → caught | landed | crashed
    ship: { x: -200, y: 340, vx: 7, vy: -18, angle: BELLY_ANGLE },
    t: 0,
    endedAt: 0,
    side: 0, // -1 left, 0 none, 1 right: which way you're steering, for the thrusters and the lean
    armClose: 0, // 0 open → 1 closed around the ship
    fireworks: [], // seconds after a catch when the next fireworks go off
    released: false, // thrust must be let go after the start press before it lights the engines
    crew: makeCrew(),
    contact: null,
    particles: [],
    cam: null,
  }
}

// Thrust doubles as the start key: start the run, or reset once a run has ended
export function pressThrust(game) {
  if (game.phase === 'ready') {
    game.phase = 'belly'
    game.t = 0
    game.released = false
  } else if (canRestart(game)) return newGame()
  return game
}

const ended = (game) => game.phase === 'caught' || game.phase === 'landed' || game.phase === 'crashed'
const engineOn = (game) => game.phase === 'flip' || game.phase === 'powered'

// The result card waits a moment so the catch or the explosion can play out
export function cardReady(game) {
  return ended(game) && game.t - game.endedAt > 1.2
}

export function canRestart(game) {
  return cardReady(game) && game.t - game.endedAt > 1.6
}

const CRASH_QUIPS = [
  'Rapid unscheduled disassembly.',
  "That's a lot of stainless steel.",
  'Excitement guaranteed.',
  'The tower will remember this.',
  'Plan B was also the ground.',
  'Flight 16 it is, then.',
]

// Catch grades, softest first
export function catchGrade(mph) {
  if (mph <= 5) return "CHOPSTICKS. CHEF'S KISS."
  if (mph <= 10) return 'MECHAZILLA APPROVES'
  return 'CAUGHT. BARELY.'
}

// Slow motion for the last few meters above the chopsticks
export function slowMo(game) {
  if (game.phase !== 'powered') return false
  const [px, py] = pinPoint(game.ship)
  const h = py - ARM_Y
  return game.ship.vy < 0 && h > 0 && h < 12 && Math.abs(px - CATCH_X) < 10
}

// Which part of the run we're in, for the HUD timeline: 0 belly-flop, 1 flip, 2 approach, 3 caught
export function stage(game) {
  return { ready: 0, belly: 0, flip: 1, powered: 2, caught: 3 }[game.phase] ?? 2
}

// The ship's up direction (ux, uy) and right side (rx, ry), and a point on it in world coordinates
function axes(s) {
  return { ux: -Math.sin(s.angle), uy: Math.cos(s.angle), rx: Math.cos(s.angle), ry: Math.sin(s.angle) }
}
function toWorld(s, x, y) {
  const { ux, uy, rx, ry } = axes(s)
  return [s.x + rx * x + ux * y, s.y + ry * x + uy * y]
}
export const pinPoint = (s) => toWorld(s, 0, PIN_Y)

// Points along both sides of the ship, for hitting the tower or the ground
function outline(s) {
  const pts = []
  for (let y = 0; y <= SHIP_H; y += 6.5) {
    pts.push(toWorld(s, -SHIP_W / 2, y), toWorld(s, SHIP_W / 2, y))
  }
  return pts
}

const inTower = ([x, y]) => x > TOWER_X && x < TOWER_X + TOWER_W && y < TOWER_H
const groundAt = (x) => (x > MOUNT.x0 && x < MOUNT.x1 ? MOUNT.top : 0)

export function step(game, input, dt) {
  const s = game.ship
  if (game.phase !== 'ready') game.t += dt
  if (!input.thrust) game.released = true
  const side = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  game.side = game.phase === 'belly' || game.phase === 'powered' ? side : 0
  game.firing = engineOn(game) && (game.phase === 'flip' || input.thrust)

  if (game.phase === 'belly') {
    // Flaps steer sideways; drag holds the fall steady
    s.vx += (side * FLAP_ACCEL - s.vx * BELLY_SIDE_DRAG) * dt
    s.vy -= (G - BELLY_DRAG * s.vy * s.vy) * dt
    s.angle = BELLY_ANGLE + Math.sin(game.t * 1.3) * 0.03 - side * 0.06
    if (input.thrust && game.released) {
      game.phase = 'flip'
      game.flipAt = game.t
      game.flipFrom = s.angle
    }
  } else if (game.phase === 'flip') {
    // Engines light and swing the ship upright, braking hard on the way
    const k = Math.min(1, (game.t - game.flipAt) / FLIP_TIME)
    const ease = k * k * (3 - 2 * k)
    s.angle = game.flipFrom * (1 - ease)
    const { ux, uy } = axes(s)
    s.vx += (ux * FLIP_THRUST - s.vx * 0.4) * dt
    s.vy += (uy * FLIP_THRUST - G - s.vy * 0.15) * dt
    exhaust(game)
    if (k >= 1) game.phase = 'powered'
  } else if (game.phase === 'powered') {
    // Hold thrust to slow or climb; let go and the engines idle down so it sinks gently
    const thrust = input.thrust ? FULL_THRUST : IDLE_THRUST
    s.vx += (side * SIDE_ACCEL - s.vx * SIDE_DRAG) * dt
    s.vy += (thrust - G) * dt
    // Lean a little into the direction you're steering, for looks
    s.angle += (-side * 0.06 - s.angle) * Math.min(1, dt * 4)
    if (input.thrust) exhaust(game)
    else idleExhaust(game)
    if (side) sideJets(game, side)
  }

  if (game.phase === 'belly' || game.phase === 'flip' || game.phase === 'powered') {
    const [, pinBefore] = pinPoint(s)
    s.x += s.vx * dt
    s.y += s.vy * dt
    const [px, py] = pinPoint(s)

    // Catch fittings coming down onto the arms: the arms close if it's slow and centered
    if (game.phase === 'powered' && pinBefore > ARM_Y && py <= ARM_Y && px > TOWER_X - ARM_LEN - 2 && px < TOWER_X) {
      const contact = { descent: -s.vy, off: px - CATCH_X, slide: Math.abs(s.vx) }
      game.contact = contact
      const mph = (m) => Math.round(m * MPH)
      if (contact.descent > SAFE_VY) return crash(game, `Hit the chopsticks at ${mph(contact.descent)} mph. Keep it under ${mph(SAFE_VY)}.`)
      if (Math.abs(contact.off) > CATCH_TOL) return crash(game, `Missed center by ${Math.round(Math.abs(contact.off) * FT)} ft. Keep it within ${Math.round(CATCH_TOL * FT)}.`)
      if (contact.slide > SAFE_VX) return crash(game, `Sliding sideways at ${mph(contact.slide)} mph. Keep it under ${mph(SAFE_VX)}.`)
      return caught(game)
    }

    const pts = outline(s)
    if (pts.some(inTower)) return crash(game, 'Hit the tower.')
    if (Math.abs(s.x) > 1600 || s.y > 2600) return crash(game, 'Lost signal somewhere over the Gulf.')
    const lowest = Math.min(...pts.map(([x, y]) => y - groundAt(x)))
    if (lowest <= 0) {
      const descent = -s.vy
      if (game.phase === 'belly') return crash(game, 'Never lit the engines. Hold ↑ or Thrust to flip and brake.', 'Belly-flopped. Literally.')
      if (game.phase === 'flip') return crash(game, 'Lit the engines too late. Start the flip a bit higher.')
      if (s.x < OCEAN_X) return crash(game, 'Splashdown. The fish would like a word.', 'Wrong kind of landing.')
      if (descent > SAFE_VY) return crash(game, `Hit the ground at ${Math.round(descent * MPH)} mph. Keep it under ${Math.round(SAFE_VY * MPH)}.`)
      game.phase = 'landed'
      game.endedAt = game.t
      game.contact = { descent, onMount: groundAt(s.x) > 0 }
      s.vx = s.vy = 0
      dust(game)
    }
  } else if (game.phase === 'caught') {
    // Arms swing shut, then the ship settles onto them with a small bounce
    const k = game.t - game.endedAt
    game.armClose = Math.min(1, k * 3)
    s.angle *= Math.max(0, 1 - dt * 4)
    s.x += (CATCH_X - s.x) * Math.min(1, dt * 3)
    s.y = ARM_Y - PIN_Y - Math.sin(Math.min(k * 9, Math.PI)) * 0.5 * Math.exp(-k * 2)
    // Fireworks over the tower to celebrate
    while (game.fireworks.length && k >= game.fireworks[0]) {
      game.fireworks.shift()
      firework(game)
    }
  }

  stepCrew(game, dt)
  stepParticles(game, dt)
}

// Small thrusters near the nose push the way you steer: steering right fires the left-hand jet, and vice versa
export const RCS_Y = SHIP_H - 10
function sideJets(game, side) {
  if (Math.random() < 0.5) return
  const s = game.ship
  const [x, y] = toWorld(s, -side * (SHIP_W / 2 + 0.3), RCS_Y)
  const { rx, ry } = axes(s)
  const v = 14 + Math.random() * 8
  spawn(game, {
    x, y,
    vx: s.vx - rx * side * v + (Math.random() - 0.5) * 3,
    vy: s.vy - ry * side * v + (Math.random() - 0.5) * 3,
    g: -0.5, drag: 2.5, life: 0.5 + Math.random() * 0.4, max: 0.9, size: 1.2, kind: 'smoke',
  })
}

// Ground crew in hi-vis by the tower and a few spectators out on the flats. They cheer on a catch and run on a crash.
function makeCrew() {
  const people = [
    { x: 16, role: 'crew' }, { x: 19.5, role: 'crew', tablet: true }, { x: 23, role: 'crew' },
    { x: 27, role: 'crew', wand: true }, { x: 31, role: 'crew' },
    { x: -112, role: 'fan' }, { x: -109, role: 'fan', phone: true }, { x: -105, role: 'fan' },
    { x: -101, role: 'fan', phone: true }, { x: -97.5, role: 'fan' },
  ]
  return people.map((p, i) => ({ ...p, face: p.role === 'crew' ? -1 : 1, seed: i * 1.37, vx: 0 }))
}

function stepCrew(game, dt) {
  for (const c of game.crew) {
    if (game.phase === 'crashed') {
      // Run away from the wreck, then stop at a safe distance
      const dir = Math.sign(c.x - game.ship.x) || 1
      c.face = dir
      c.vx = Math.abs(c.x - game.ship.x) < 140 ? dir * 6 : 0
      c.x += c.vx * dt
    } else if (game.phase === 'caught' || game.phase === 'landed') {
      c.face = Math.sign(game.ship.x - c.x) || c.face
    }
  }
}

function caught(game) {
  const s = game.ship
  game.phase = 'caught'
  game.endedAt = game.t
  game.armClose = 0
  game.fireworks = [0.6, 1.0, 1.5, 1.9, 2.5, 3.0, 3.8, 4.4, 5.2]
  s.vx = s.vy = 0
}

// One firework burst somewhere above the tower: a ring of colored sparks that drift and fall
function firework(game) {
  const colors = [['#ff5a4f', '#ffb3a8'], ['#ffd25a', '#fff0b8'], ['#5ad1ff', '#c8f1ff'], ['#7cffb2', '#d6ffe8'], ['#f7f7f7', '#ffd8a8']]
  const [c1, c2] = colors[Math.floor(Math.random() * colors.length)]
  // Kept inside the frame the camera holds after a catch
  const x = -75 + Math.random() * 115, y = 118 + Math.random() * 38
  const n = 70
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const v = 10 + Math.random() * 18 // a full, round burst rather than a thin ring
    spawn(game, {
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      g: 4, drag: 1.4, life: 1.4 + Math.random() * 0.6, max: 2, size: 0.9, kind: 'spark', color: i % 3 ? c1 : c2,
    })
  }
}

// Stars for the mission patch: 3 for a feather-light catch, 1 for a scrappy one
export function catchStars(mph) {
  return mph <= 5 ? 3 : mph <= 10 ? 2 : 1
}

function crash(game, reason, quip) {
  const s = game.ship
  game.phase = 'crashed'
  game.reason = reason
  game.quip = quip || CRASH_QUIPS[Math.floor(Math.random() * CRASH_QUIPS.length)]
  game.endedAt = game.t
  const [cx, cy] = toWorld(s, 0, SHIP_H * 0.4)
  for (let i = 0; i < 120; i++) {
    const a = Math.random() * Math.PI * 2
    const v = 6 + Math.random() * 40
    const kind = i % 3 === 0 ? 'debris' : i % 3 === 1 ? 'soot' : 'fire'
    spawn(game, {
      x: cx + (Math.random() - 0.5) * SHIP_W, y: Math.max(cy + (Math.random() - 0.5) * 30, 1),
      vx: Math.cos(a) * v + s.vx * 0.2, vy: Math.sin(a) * v * 0.8 + 6,
      g: kind === 'soot' ? -1.5 : G, drag: kind === 'soot' ? 1.2 : 0,
      life: 1 + Math.random() * 2, max: 3,
      size: kind === 'soot' ? 6 : kind === 'fire' ? 1 + Math.random() * 1.2 : 1.2 + Math.random() * 2,
      kind, color: i % 6 === 0 ? '#9aa0a8' : '#1f2937',
    })
  }
  s.vx = s.vy = 0
}

// Engine plume: white glow at the three sea-level engines, then smoke, plus dust kicked up near the ground
function exhaust(game, strength = 1) {
  const s = game.ship
  const { ux, uy } = axes(s)
  for (const off of [-1.8, 0, 1.8]) {
    if (Math.random() > 0.5 * strength) continue
    const [x, y] = toWorld(s, off, -1)
    const v = 35 + Math.random() * 15
    spawn(game, {
      x, y, vx: s.vx - ux * v + (Math.random() - 0.5) * 5, vy: s.vy - uy * v + (Math.random() - 0.5) * 5,
      g: -2, life: 0.18 + Math.random() * 0.18, max: 0.36, size: 1.1, kind: 'flame',
    })
  }
  if (Math.random() < 0.25 * strength) {
    const [x, y] = toWorld(s, 0, -5)
    spawn(game, {
      x, y, vx: s.vx * 0.2 - ux * 24 + (Math.random() - 0.5) * 8, vy: s.vy * 0.2 - uy * 24,
      g: -1, drag: 0.8, life: 1 + Math.random(), max: 2, size: 2.2, kind: 'smoke',
    })
  }
  const h = s.y - groundAt(s.x)
  if (h < 55 && Math.random() < 0.6 * strength) {
    spawn(game, {
      x: s.x + (Math.random() - 0.5) * 10, y: groundAt(s.x) + 0.5,
      vx: (Math.random() < 0.5 ? -1 : 1) * (15 + Math.random() * 20), vy: 2 + Math.random() * 4,
      g: -0.3, drag: 1.2, life: 1.2 + Math.random(), max: 2.2, size: 3, kind: 'dust',
    })
  }
}

const idleExhaust = (game) => exhaust(game, 0.35)

function dust(game) {
  const s = game.ship
  for (let i = 0; i < 40; i++) {
    spawn(game, {
      x: s.x + (Math.random() - 0.5) * 16, y: groundAt(s.x) + 0.5,
      vx: (Math.random() - 0.5) * 30, vy: Math.random() * 5,
      g: -0.5, drag: 2, life: 1 + Math.random(), max: 2, size: 4, kind: 'dust',
    })
  }
}
