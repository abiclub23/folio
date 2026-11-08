// Super Heavy Catch: fly the booster back to the tower and land it in the chopsticks.
// Two looks share the same rules (physics.js):
//   SuperHeavyGame       sunset livestream (draw.js, sound.js)
//   RetroSuperHeavyGame  1979 vector arcade (retroDraw.js, retroSound.js)
// The page around each one (layout, controls, game loop) is the shared GameShell.
import GameShell from '../GameKit'
import { STEP, newGame, pressThrust, slowMo, step } from './physics'
import * as livestream from './draw'
import { updateSound } from './sound'
import * as arcade from './retroDraw'
import { updateSound as updateRetroSound } from './retroSound'

const rules = { STEP, step, slowMo, newGame, pressThrust }
const labels = { left: ['Tilt left', 'Tilt left'], right: ['Tilt right', 'Tilt right'] }

const SUNSET_THEME = {
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
  rotateBg: 'bg-[#120a16]',
  rotateTitle: 'font-saira-condensed text-3xl font-bold uppercase tracking-[0.06em]',
  rotateIcon: '#f6ebe3',
}

const RETRO_THEME = {
  page: 'bg-black font-vt text-[#39ff6a] text-lg',
  title: 'font-pixel text-[0.95rem] uppercase leading-relaxed [text-shadow:0_0_8px_#39ff6a]',
  accent: 'text-[#ffb000] [text-shadow:0_0_8px_#ffb000]',
  muted: 'text-[#39ff6a]/70',
  link: 'text-[#39ff6a]/70 hover:text-[#39ff6a]',
  chip: 'rounded-none border border-[#39ff6a]/60 bg-black/60 text-[#39ff6a] hover:bg-[#39ff6a]/10',
  canvas: 'border border-[#39ff6a]/40 shadow-[0_0_24px_rgba(57,255,106,0.15)]',
  tiltBtn:
    'flex select-none flex-col items-center justify-center gap-1 border-2 border-[#39ff6a] bg-black py-3 text-[#39ff6a] shadow-[0_0_10px_rgba(57,255,106,0.35)] data-[on=1]:bg-[#39ff6a]/20',
  thrustBtn:
    'flex select-none items-center justify-center gap-2 border-2 border-[#ffb000] bg-black font-pixel uppercase text-[#ffb000] shadow-[0_0_12px_rgba(255,176,0,0.45)] data-[on=1]:bg-[#ffb000]/25',
  padBtn: 'flex select-none items-center justify-center rounded-full border-2 border-[#39ff6a] bg-black/60 text-[#39ff6a] data-[on=1]:bg-[#39ff6a]/25',
  caption: 'font-pixel text-[0.55rem] uppercase text-[#39ff6a]',
  rotateBg: 'bg-black',
  rotateTitle: 'font-pixel text-base uppercase leading-relaxed text-[#39ff6a]',
  rotateIcon: '#39ff6a',
}

const livestreamEngine = { ...rules, ...livestream, updateSound }
const arcadeEngine = { ...rules, ...arcade, updateSound: updateRetroSound }

export default function SuperHeavyGame() {
  return (
    <GameShell
      name="Super Heavy Catch"
      titleLead="Super Heavy"
      titleAccent="Catch"
      spec="Catch it under 9 mph, within 10 ft of center and 6° of vertical"
      hint="Keyboard: hold ↑ or W to fire the engines, A/D or ←/→ to tilt, M to mute."
      labels={labels}
      storageKey="super-heavy-muted"
      engine={livestreamEngine}
      theme={SUNSET_THEME}
    />
  )
}

export function RetroSuperHeavyGame() {
  return (
    <GameShell
      name="Super Heavy Catch"
      titleLead="Super Heavy"
      titleAccent="Catch"
      spec="CATCH IT UNDER 9 MPH, WITHIN 10 FT, 6° OF VERTICAL"
      hint="KEYS: HOLD ↑ OR W TO FIRE, A/D OR ←/→ TO TILT, M TO MUTE"
      labels={labels}
      storageKey="super-heavy-muted"
      engine={arcadeEngine}
      theme={RETRO_THEME}
    />
  )
}
