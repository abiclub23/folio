// Roadster sound mix: motor whine on the track, thrusters and wind in the air, one-shots on events
import { Sound } from '../GameKit/sound'

export function updateSound(game, input, slow) {
  const car = game.car
  const onTrack = game.phase === 'runway' || game.phase === 'ramp'
  const sp = onTrack ? Math.abs(game.speed) : 0
  const flying = game.phase === 'flight'
  const v = flying ? Math.hypot(car.vx, car.vy) : 0
  Sound.mix({
    motor: [onTrack ? (input.thrust ? 0.1 : 0.03) : 0, 35 + sp * 4],
    whine: [onTrack ? (input.thrust ? 0.045 : 0.012) : 0, 220 + sp * 32],
    thrust: flying && input.thrust ? 0.55 : 0,
    wind: [Math.min(0.3, v / 100) * (slow ? 0.4 : 1), 250 + v * 12],
  })
  if (Sound.phaseChanged(game.phase)) {
    if (game.phase === 'crashed') Sound.boing()
    if (game.phase === 'rolling') Sound.thud()
    if (game.phase === 'landed') Sound.chime()
  }
  if (Sound.once('starman', game.starman)) Sound.fanfare()
}
