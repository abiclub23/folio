// Super Heavy Catch: fly the booster back to the tower and land it in the chopsticks.
// The rules live in physics.js, the drawing in draw.js and the sound mix in sound.js;
// the page around it (layout, controls, game loop) is the shared GameShell.
import GameShell from '../GameKit'
import { STEP, newGame, pressThrust, slowMo, step } from './physics'
import { drawHud, render, updateCamera } from './draw'
import { updateSound } from './sound'

const engine = { STEP, step, slowMo, newGame, pressThrust, updateCamera, render, drawHud, updateSound }

export default function SuperHeavyGame() {
  return (
    <GameShell
      name="Super Heavy Catch"
      titleLead="Super Heavy"
      titleAccent="Catch"
      spec="Catch it under 9 mph, within 10 ft of center and 6° of vertical"
      hint="Keyboard: hold ↑ or W to fire the engines, A/D or ←/→ to tilt, M to mute."
      labels={{ left: ['Tilt left', 'Tilt left'], right: ['Tilt right', 'Tilt right'] }}
      storageKey="super-heavy-muted"
      engine={engine}
    />
  )
}
