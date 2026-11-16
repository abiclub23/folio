// Roadster Launch: 0–60 in under a second, up a ramp to the sky, then thrusters to land.
// The rules live in physics.js, the drawing in draw.js and the sound mix in sound.js;
// the page around it (layout, controls, game loop) is the shared GameShell.
import GameShell from '../GameKit'
import { STEP, newGame, pressThrust, slowMo, step } from './physics'
import { drawHud, render, updateCamera } from './draw'
import { updateSound } from './sound'

// Phones get a longer runway for more build-up before the ramp
const runwayFor = ({ phone }) => (phone ? 70 : 40)

const engine = {
  STEP, step, slowMo, updateCamera, render, drawHud, updateSound,
  newGame: (view) => newGame({ runway: runwayFor(view) }),
  pressThrust: (game, view) => pressThrust(game, runwayFor(view)),
}

export default function RoadsterGame() {
  return (
    <GameShell
      name="Roadster Launch"
      titleLead="Roadster"
      titleAccent="Launch"
      spec="0–60 in 0.9s · land under 11 mph, within 15° of level"
      hint="Keyboard: hold ↑ or W to drive and thrust, A/D or ←/→ to tilt, M to mute."
      labels={{ left: ['Nose up', 'Tilt nose up'], right: ['Nose down', 'Tilt nose down'] }}
      storageKey="roadster-muted"
      engine={engine}
    />
  )
}
