// Starship Catch: bring the ship back to the tower like Flight 15 did: belly-flop, flip, then ease into the arms.
// The rules live in physics.js, the drawing in draw.js and the sound mix in sound.js;
// the page around it (layout, controls, game loop) is the shared GameShell.
import GameShell from '../GameKit'
import { STEP, newGame, pressThrust, slowMo, step } from './physics'
import * as broadcast from './draw'
import { updateSound } from './sound'

const rules = { STEP, step, slowMo, newGame, pressThrust }
const labels = { left: ['Left', 'Move left'], right: ['Right', 'Move right'] }

const THEME = {
  page: 'bg-[#120a16] font-saira text-[#f6ebe3]',
  title: 'font-saira-condensed text-[1.7rem] font-bold uppercase tracking-[0.06em]',
  accent: 'text-[#ff7a45]',
  muted: 'text-[#b9a3a8]',
  link: 'text-[#b9a3a8] hover:text-[#f6ebe3]',
  chip: 'rounded-md border border-[#4a3040] bg-[#120a16]/60 text-[#f6ebe3] hover:bg-[#2a1824]',
  canvas: 'rounded-md border border-[#4a3040]',
  tiltBtn:
    'flex select-none flex-col items-center justify-center gap-1 rounded-2xl border border-[#4a3040] bg-gradient-to-b from-[#2e1c2a] to-[#1c111b] py-3 text-[#f6ebe3] transition-transform duration-75 data-[on=1]:scale-[0.96] data-[on=1]:border-[#ff7a45] data-[on=1]:from-[#3d2436] data-[on=1]:to-[#2e1c2a]',
  thrustBtn:
    'flex select-none items-center justify-center gap-2 border border-[#ffb36b]/70 bg-gradient-to-b from-[#ffb36b] to-[#ff6a3d] font-saira-condensed font-bold uppercase tracking-[0.1em] text-[#1a0d0a] shadow-[0_6px_18px_rgba(255,106,61,0.35)] transition-transform duration-75 data-[on=1]:scale-[0.96] data-[on=1]:from-[#ffd29a] data-[on=1]:to-[#ff7a45] data-[on=1]:shadow-[0_0_28px_rgba(255,140,80,0.7)]',
  padBtn:
    'flex select-none items-center justify-center rounded-full border border-white/25 bg-[#120a16]/55 text-[#f6ebe3] backdrop-blur-sm transition-transform duration-75 data-[on=1]:scale-[0.94] data-[on=1]:bg-[#ff7a45]/40',
  caption: 'font-saira-condensed text-[0.75rem] font-bold uppercase tracking-[0.14em] text-[#b9a3a8]',
}

const engine = { ...rules, ...broadcast, updateSound }

export default function StarshipCatchGame() {
  return (
    <GameShell
      name="Starship Catch"
      titleLead="Starship"
      titleAccent="Catch"
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
