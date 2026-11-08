// Super Heavy livestream sound: engine rumble and roar while firing, wind on the way down, applause on a catch
import { Sound } from '../GameKit/sound'

export function updateSound(game, input, slow) {
  const b = game.booster
  const flying = game.phase === 'flight'
  const firing = flying && input.thrust
  const v = flying ? Math.hypot(b.vx, b.vy) : 0
  Sound.mix({
    motor: [firing ? 0.12 : 0, 28],
    thrust: firing ? 0.7 : 0,
    wind: [Math.min(0.35, v / 120) * (slow ? 0.4 : 1), 200 + v * 8],
  })
  if (Sound.phaseChanged(game.phase)) {
    if (game.phase === 'crashed') Sound.boing()
    if (game.phase === 'caught') {
      Sound.clang()
      Sound.chime()
      Sound.applause()
    }
    if (game.phase === 'landed') {
      Sound.thud()
      Sound.chime()
    }
  }
}
