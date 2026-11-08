// Super Heavy arcade sound: a low buzz while firing, radar blips, a fast alarm when coming in hot,
// a square-wave zap on crashes and a little fanfare on a catch
import { Sound } from '../GameKit/sound'
import { ARM_Y, SAFE_VY, pinPoint } from './physics'

let nextBlip = 0

export function updateSound(game, input) {
  const firing = game.phase === 'flight' && input.thrust
  Sound.mix({ motor: [firing ? 0.16 : 0, 55], thrust: firing ? 0.2 : 0 })

  if (game.phase === 'flight') {
    const h = pinPoint(game.booster)[1] - ARM_Y
    const hot = h < 200 && -game.booster.vy > SAFE_VY * 1.5
    if (game.t < nextBlip - 5) nextBlip = 0 // a new run started
    if (game.t >= nextBlip) {
      Sound.beep(hot ? 1320 : 660, hot ? 0.05 : 0.04, hot ? 0.1 : 0.05)
      nextBlip = game.t + (hot ? 0.18 : 1.2)
    }
  } else {
    nextBlip = 0
  }

  if (Sound.phaseChanged(game.phase)) {
    if (game.phase === 'crashed') Sound.zap()
    if (game.phase === 'caught') Sound.fanfare()
    if (game.phase === 'landed') Sound.beep(330, 0.3, 0.12)
  }
}
