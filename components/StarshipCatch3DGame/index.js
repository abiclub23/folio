// Starship Catch in 3D: the same rules, sound and broadcast overlay as the 2D game, drawn as a three.js scene
// (lattice tower, swinging arms, real sunlight and a drone-style camera). Lives in its own component so the
// 2D page doesn't download three.js.
import GameShell from '../GameKit'
import { THEME, labels, rules } from '../StarshipCatchGame'
import * as scene3d from '../StarshipCatchGame/scene3d'
import { updateSound } from '../StarshipCatchGame/sound'

const engine = { ...rules, ...scene3d, updateSound }

export default function StarshipCatch3DGame() {
  return (
    <GameShell
      name="Starship Catch 3D"
      titleLead="Starship"
      titleAccent="Catch 3D"
      spec="Catch it under 15 mph, within 15 ft of center"
      hint="Keyboard: hold ↑ or W to light the engines and slow down, A/D or ←/→ to steer, M to mute."
      arrows
      labels={labels}
      storageKey="starship-catch-muted"
      engine={engine}
      theme={THEME}
    />
  )
}
