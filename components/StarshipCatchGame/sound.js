// Starship sound: wind roaring past during the belly-flop, engine rumble and roar once lit, applause on a catch
import { Sound } from '../GameKit/sound'

export function updateSound(game, input, slow) {
  const s = game.ship
  const flying = game.phase === 'belly' || game.phase === 'flip' || game.phase === 'powered'
  const v = flying ? Math.hypot(s.vx, s.vy) : 0
  const full = game.phase === 'flip' || (game.phase === 'powered' && input.thrust)
  const idle = game.phase === 'powered' && !input.thrust
  Sound.mix({
    motor: [full ? 0.12 : idle ? 0.05 : 0, 28],
    thrust: full ? 0.7 : idle ? 0.25 : 0,
    wind: [Math.min(0.4, v / 50) * (slow ? 0.4 : 1), 200 + v * 18],
  })
  if (Sound.phaseChanged(game.phase)) {
    if (game.phase === 'crashed') Sound.thud(1)
    if (game.phase === 'caught') {
      Sound.clang()
      Sound.applause()
    }
    if (game.phase === 'landed') Sound.thud()
  }
}
