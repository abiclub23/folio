// Super Heavy Catch game rules: the booster falls back toward the tower and you fly it into the chopsticks.
// No drawing here. Units are meters and seconds, with y pointing up.
import { FT, MPH, spawn, stepParticles, wrapAngle } from '../GameKit/physics'

export { FT, MPH, wrapAngle }

const G = 9.8
export const STEP = 1 / 120

// Booster, positioned by the center of its engines; angle 0 is upright, positive leans left
export const BOOSTER_H = 70
export const BOOSTER_W = 9
export const PIN_Y = 57 // catch pins that rest on the chopsticks, measured up from the engines
const THRUST = 24 // m/s² at full throttle
const TURN_RATE = 0.45 // rad/s
const DRAG = 0.0015 // quadratic; the grid fins hold the fall to about 80 m/s

// Tower and pad: x = 0 is the tower's left face, the chopsticks reach left from it
export const TOWER_X = 0
export const TOWER_W = 12
export const TOWER_H = 146
export const ARM_Y = 100 // chopstick height
export const ARM_LEN = 26
export const CATCH_X = -13 // booster center for a perfect catch
export const MOUNT = { x0: -24, x1: -2, top: 20 } // launch mount under the catch point
export const OCEAN_X = -420 // water starts left of here

// What counts as a good catch
const CATCH_TOL = 3 // meters either side of center (~10 ft)
export const SAFE_VY = 4 // m/s, about 9 mph
const SAFE_VX = 2.5
export const SAFE_TILT = (6 * Math.PI) / 180
const GROUND_TILT = (8 * Math.PI) / 180

export function newGame() {
  return {
    phase: 'ready', // ready → flight → caught | landed | crashed
    booster: { x: -240, y: 950, vx: 14, vy: -72, angle: 0.05 },
    t: 0,
    endedAt: 0,
    maxSpeed: 0,
    contact: null,
    particles: [],
    cam: null,
  }
}

// Thrust doubles as the start key: start the landing burn, or reset once a run has ended
export function pressThrust(game) {
  if (game.phase === 'ready') {
    game.phase = 'flight'
    game.t = 0
  } else if (canRestart(game)) return newGame()
  return game
}

const ended = (game) => game.phase === 'caught' || game.phase === 'landed' || game.phase === 'crashed'

// The result card waits a moment so the catch or the explosion can play out
export function cardReady(game) {
  return ended(game) && game.t - game.endedAt > 1
}

export function canRestart(game) {
  return cardReady(game) && game.t - game.endedAt > 1.4
}

const CRASH_QUIPS = [
  'Rapid unscheduled disassembly.',
  "That's a lot of stainless steel.",
  'Excitement guaranteed.',
  'The tower will remember this.',
  'Full send. Wrong direction.',
  'Plan B was also the ground.',
]

// Catch grades, softest first
export function catchGrade(mph) {
  if (mph <= 3) return "CHOPSTICKS. CHEF'S KISS."
  if (mph <= 6) return 'MECHAZILLA APPROVES'
  return 'CAUGHT. BARELY.'
}

// Slow motion for the last few meters above the chopsticks
export function slowMo(game) {
  if (game.phase !== 'flight') return false
  const [px, py] = pinPoint(game.booster)
  const h = py - ARM_Y
  return game.booster.vy < 0 && h > 0 && h < 14 && Math.abs(px - CATCH_X) < 12
}

// The booster's up direction and a point on it (x across, y up from the engines) in world coordinates
function axes(b) {
  return { ux: -Math.sin(b.angle), uy: Math.cos(b.angle), rx: Math.cos(b.angle), ry: Math.sin(b.angle) }
}
function toWorld(b, x, y) {
  const { ux, uy, rx, ry } = axes(b)
  return [b.x + rx * x + ux * y, b.y + ry * x + uy * y]
}
export const pinPoint = (b) => toWorld(b, 0, PIN_Y)

// Points along both sides of the booster, for hitting the tower or the ground
function outline(b) {
  const pts = []
  for (let y = 0; y <= BOOSTER_H; y += 7) {
    pts.push(toWorld(b, -BOOSTER_W / 2, y), toWorld(b, BOOSTER_W / 2, y))
  }
  return pts
}

const inTower = ([x, y]) => x > TOWER_X && x < TOWER_X + TOWER_W && y < TOWER_H
const groundAt = (x) => (x > MOUNT.x0 && x < MOUNT.x1 ? MOUNT.top : 0)

export function step(game, input, dt) {
  const b = game.booster
  if (game.phase !== 'ready') game.t += dt
  game.firing = game.phase === 'flight' && input.thrust

  if (game.phase === 'flight') {
    const turn = (input.left ? 1 : 0) - (input.right ? 1 : 0)
    b.angle = wrapAngle(b.angle + turn * TURN_RATE * dt)
    const { ux, uy } = axes(b)
    if (input.thrust) {
      b.vx += ux * THRUST * dt
      b.vy += uy * THRUST * dt
      exhaust(game)
    }
    b.vy -= G * dt
    const v = Math.hypot(b.vx, b.vy)
    b.vx -= DRAG * v * b.vx * dt
    b.vy -= DRAG * v * b.vy * dt
    game.maxSpeed = Math.max(game.maxSpeed, v)

    const [, pinBefore] = pinPoint(b)
    b.x += b.vx * dt
    b.y += b.vy * dt
    const [px, py] = pinPoint(b)

    // Pins coming down onto the chopsticks: a catch if slow, centered and upright
    if (pinBefore > ARM_Y && py <= ARM_Y && px > TOWER_X - ARM_LEN && px < TOWER_X) {
      const contact = { descent: -b.vy, off: px - CATCH_X, tilt: Math.abs(b.angle), slide: Math.abs(b.vx) }
      game.contact = contact
      const mph = (m) => Math.round(m * MPH)
      if (contact.descent > SAFE_VY) return crash(game, `Hit the chopsticks at ${mph(contact.descent)} mph. Keep it under ${mph(SAFE_VY)}.`)
      if (Math.abs(contact.off) > CATCH_TOL) return crash(game, `Missed center by ${Math.round(Math.abs(contact.off) * FT)} ft. Keep it within ${Math.round(CATCH_TOL * FT)}.`)
      if (contact.slide > SAFE_VX) return crash(game, `Sliding sideways at ${mph(contact.slide)} mph. Keep it under ${mph(SAFE_VX)}.`)
      if (contact.tilt > SAFE_TILT) return crash(game, `Came in ${Math.round((contact.tilt * 180) / Math.PI)}° off vertical. Keep it under 6°.`)
      return caught(game)
    }

    const pts = outline(b)
    if (pts.some(inTower)) return crash(game, 'Hit the tower.')
    if (Math.abs(b.x) > 1600 || b.y > 2600) return crash(game, 'Lost signal somewhere over the Gulf.')
    const lowest = Math.min(...pts.map(([x, y]) => y - groundAt(x)))
    if (lowest <= 0) {
      const descent = -b.vy
      if (b.x < OCEAN_X) return crash(game, 'Splashdown. The fish would like a word.', 'Wrong kind of landing.')
      if (descent > SAFE_VY) return crash(game, `Hit the ground at ${Math.round(descent * MPH)} mph. Keep it under ${Math.round(SAFE_VY * MPH)}.`)
      if (Math.abs(b.angle) > GROUND_TILT) return crash(game, `Touched down ${Math.round((Math.abs(b.angle) * 180) / Math.PI)}° off vertical and tipped over.`)
      game.phase = 'landed'
      game.endedAt = game.t
      game.contact = { descent, onMount: groundAt(b.x) > 0 }
      b.vx = b.vy = 0
      dust(game)
    }
  } else if (game.phase === 'caught') {
    // Settle onto the arms with a small bounce
    const k = game.t - game.endedAt
    b.angle *= Math.max(0, 1 - dt * 4)
    b.x += (CATCH_X - b.x) * Math.min(1, dt * 3)
    b.y = ARM_Y - PIN_Y - Math.sin(Math.min(k * 9, Math.PI)) * 0.6 * Math.exp(-k * 2)
  }

  stepParticles(game, dt)
}

function caught(game) {
  const b = game.booster
  game.phase = 'caught'
  game.endedAt = game.t
  b.vx = b.vy = 0
  const [px] = pinPoint(b)
  const colors = ['#ef4444', '#f8fafc', '#facc15', '#38bdf8']
  for (let i = 0; i < 90; i++) {
    spawn(game, {
      x: px + (Math.random() - 0.5) * 8, y: ARM_Y + 2,
      vx: (Math.random() - 0.5) * 30, vy: 10 + Math.random() * 20,
      g: G * 0.6, drag: 1.2, life: 2 + Math.random(), max: 3, size: 0.9, kind: 'confetti',
      color: colors[i % colors.length],
    })
  }
}

function crash(game, reason, quip) {
  const b = game.booster
  game.phase = 'crashed'
  game.reason = reason
  game.quip = quip || CRASH_QUIPS[Math.floor(Math.random() * CRASH_QUIPS.length)]
  game.endedAt = game.t
  const [cx, cy] = toWorld(b, 0, BOOSTER_H * 0.35)
  for (let i = 0; i < 120; i++) {
    const a = Math.random() * Math.PI * 2
    const s = 6 + Math.random() * 45
    const kind = i % 3 === 0 ? 'debris' : i % 3 === 1 ? 'soot' : 'fire'
    spawn(game, {
      x: cx + (Math.random() - 0.5) * BOOSTER_W, y: Math.max(cy + (Math.random() - 0.5) * 40, 1),
      vx: Math.cos(a) * s + b.vx * 0.2, vy: Math.sin(a) * s * 0.8 + 6,
      g: kind === 'soot' ? -1.5 : G, drag: kind === 'soot' ? 1.2 : 0,
      life: 1 + Math.random() * 2, max: 3, size: kind === 'soot' ? 6 : kind === 'fire' ? 1 + Math.random() * 1.2 : 1.2 + Math.random() * 2,
      kind, color: i % 6 === 0 ? '#9aa0a8' : '#1f2937',
    })
  }
  b.vx = b.vy = 0
}

// Engine plume: white glow at the nozzles, then smoke, plus dust kicked up near the ground
function exhaust(game) {
  const b = game.booster
  const { ux, uy } = axes(b)
  for (const off of [-2.6, 0, 2.6]) {
    if (Math.random() < 0.5) continue
    const [x, y] = toWorld(b, off, -1)
    const s = 40 + Math.random() * 20
    spawn(game, {
      x, y, vx: b.vx - ux * s + (Math.random() - 0.5) * 6, vy: b.vy - uy * s + (Math.random() - 0.5) * 6,
      g: -2, life: 0.2 + Math.random() * 0.2, max: 0.4, size: 1.3, kind: 'flame',
    })
  }
  if (Math.random() < 0.3) {
    const [x, y] = toWorld(b, 0, -6)
    spawn(game, {
      x, y, vx: b.vx * 0.2 - ux * 30 + (Math.random() - 0.5) * 8, vy: b.vy * 0.2 - uy * 30,
      g: -1, drag: 0.8, life: 1 + Math.random(), max: 2, size: 2.5, kind: 'smoke',
    })
  }
  const h = b.y - groundAt(b.x)
  if (h < 60 && Math.random() < 0.6) {
    spawn(game, {
      x: b.x + (Math.random() - 0.5) * 10, y: groundAt(b.x) + 0.5,
      vx: (Math.random() < 0.5 ? -1 : 1) * (15 + Math.random() * 20), vy: 2 + Math.random() * 4,
      g: -0.3, drag: 1.2, life: 1.2 + Math.random(), max: 2.2, size: 3, kind: 'smoke',
    })
  }
}

function dust(game) {
  const b = game.booster
  for (let i = 0; i < 40; i++) {
    spawn(game, {
      x: b.x + (Math.random() - 0.5) * 16, y: groundAt(b.x) + 0.5,
      vx: (Math.random() - 0.5) * 30, vy: Math.random() * 5,
      g: -0.5, drag: 2, life: 1 + Math.random(), max: 2, size: 4, kind: 'dust',
    })
  }
}
