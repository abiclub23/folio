// Shared game physics helpers: units, angles and particles. No drawing here.
export const MPH = 2.23694 // m/s → mph
export const FT = 3.28084 // m → ft

export function wrapAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a))
}

// Particles: x/y position, vx/vy velocity, g gravity (negative floats up), drag, life/max seconds, size meters
export function spawn(game, p) {
  game.particles.push({ drag: 0, ...p })
}

// Moves particles one step and drops the ones that have faded out
export function stepParticles(game, dt) {
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
