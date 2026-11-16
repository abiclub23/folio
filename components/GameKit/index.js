// Shared full-screen page for the canvas games: header, canvas, game loop, keyboard and touch controls,
// mute, and the phone layouts (a control bar under the game upright, thumb buttons over the game sideways).
//
// theme: optional Tailwind classes to restyle the page (see DEFAULT_THEME); arrows: plain ← → on the side buttons
// engine: {
//   STEP, step(game, input, dt), slowMo(game),
//   newGame(view), pressThrust(game, view)       view = { phone } for screen-dependent setup
//   updateCamera(game, W, H, dt), render(ctx, game, W, H, input, { top }),
//   drawHud(ctx, game, W, H, { touch, insets })
//     The HUD is drawn scaled down on short screens, so W and H there are in HUD units, not CSS pixels.
//     insets = { left, right, bottom, top } in HUD units on phones, or null: left/right/bottom are the thumb
//     buttons over the bottom corners (phone held sideways), top is the back and mute buttons in the top-right
//     corner (phone upright), so things drawn there should sit lower. render gets the same top in CSS pixels.
//   updateSound(game, input, slow)
// }
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Sound } from './sound'

// Page look: Tailwind classes for each part. Games can override any of them; the defaults are Roadster's.
const DEFAULT_THEME = {
  page: 'bg-[#17191c] font-barlow text-[#eceae4]',
  title: 'font-barlow-condensed text-[1.6rem] font-bold uppercase tracking-[0.04em]',
  accent: 'text-[#d62828]',
  muted: 'text-[#9aa0a8]',
  link: 'text-[#9aa0a8] hover:text-[#eceae4]',
  chip: 'rounded-md border border-[#3a3f46] bg-[#17191c]/60 text-[#eceae4] hover:bg-[#23262b]',
  canvas: 'rounded-md border border-[#3a3f46]',
  tiltBtn:
    'flex select-none flex-col items-center justify-center gap-1 rounded-2xl border border-[#3a3f46] bg-gradient-to-b from-[#2a2e34] to-[#1d2025] py-3 text-[#eceae4] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-75 data-[on=1]:scale-[0.96] data-[on=1]:border-[#6b7280] data-[on=1]:from-[#353a42] data-[on=1]:to-[#2a2e34]',
  thrustBtn:
    'flex select-none items-center justify-center gap-2 border border-white/60 bg-gradient-to-b from-white to-[#dfe3e8] font-barlow-condensed font-bold uppercase tracking-[0.1em] text-[#17191c] shadow-[inset_0_-2px_0_rgba(0,0,0,0.08),0_6px_18px_rgba(0,0,0,0.35)] transition-transform duration-75 data-[on=1]:scale-[0.96] data-[on=1]:from-white data-[on=1]:to-white data-[on=1]:shadow-[0_0_28px_rgba(255,255,255,0.55)]',
  padBtn:
    'flex select-none items-center justify-center rounded-full border border-white/25 bg-[#17191c]/55 text-[#eceae4] backdrop-blur-sm transition-transform duration-75 data-[on=1]:scale-[0.94] data-[on=1]:bg-white/25',
  caption: 'font-barlow-condensed text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#9aa0a8]',
}

// Phone held sideways: the thumb buttons over the game's bottom corners, in CSS pixels (see the buttons below)
const THUMBS = { left: 16 + 56 + 10 + 56 + 12, right: 16 + 76 + 12, bottom: 14 + 76 + 8 }
// Phone upright: the back and mute buttons in the top-right corner
const CHIPS_TOP = 8 + 32 + 8

// The HUD was laid out for a laptop screen; on short screens (a phone held sideways) draw it smaller
const hudScale = (H) => (H < 440 ? Math.max(0.72, H / 440) : 1)

const KEYS = {
  thrust: [' ', 'w', 'W', 'ArrowUp'],
  left: ['a', 'A', 'ArrowLeft'],
  right: ['d', 'D', 'ArrowRight'],
}

export default function GameShell({ name, titleLead, titleAccent, spec, hint, labels, storageKey, engine, theme: custom, arrows = false }) {
  const theme = { ...DEFAULT_THEME, ...custom }
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const inputRef = useRef({ thrust: false, left: false, right: false })
  const viewRef = useRef({ phone: false })
  const touchRef = useRef(false)
  const thumbsRef = useRef(false)
  const uprightRef = useRef(false)
  const [muted, setMuted] = useState(false)
  // Layout: 'default' (keyboard), 'touch' (tablet, buttons under the game),
  // 'phone-portrait' (full screen, control bar under the game) or 'phone-landscape' (full screen, buttons over the game)
  const [mode, setMode] = useState('default')

  useEffect(() => {
    const touch = window.matchMedia('(pointer: coarse)')
    const portrait = window.matchMedia('(pointer: coarse) and (orientation: portrait) and (max-width: 600px)')
    const landscape = window.matchMedia('(pointer: coarse) and (orientation: landscape) and (max-height: 600px)')
    const update = () => {
      touchRef.current = touch.matches
      thumbsRef.current = landscape.matches
      uprightRef.current = portrait.matches
      setMode(portrait.matches ? 'phone-portrait' : landscape.matches ? 'phone-landscape' : touch.matches ? 'touch' : 'default')
    }
    update()
    const queries = [touch, portrait, landscape]
    queries.forEach((q) => q.addEventListener('change', update))
    return () => queries.forEach((q) => q.removeEventListener('change', update))
  }, [])

  const toggleMute = () => {
    const next = !Sound.muted
    Sound.setMuted(next)
    try { localStorage.setItem(storageKey, next ? '1' : '0') } catch {}
    setMuted(next)
  }

  const pressStart = () => {
    gameRef.current = engine.pressThrust(gameRef.current, viewRef.current)
  }

  useEffect(() => {
    let savedMute = false
    try { savedMute = localStorage.getItem(storageKey) === '1' } catch {}
    setMuted(savedMute)
    Sound.setMuted(savedMute)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W = 0, H = 0, dpr = 1

    const resize = () => {
      W = wrapRef.current.clientWidth
      H = wrapRef.current.clientHeight
      dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      // Games can size things for phones; this takes effect on the next run
      viewRef.current = { phone: W < 640 || window.matchMedia('(pointer: coarse)').matches }
    }
    resize()
    gameRef.current = engine.newGame(viewRef.current)
    const ro = new ResizeObserver(resize)
    ro.observe(wrapRef.current)

    const onKey = (down) => (e) => {
      let handled = false
      for (const [action, keys] of Object.entries(KEYS)) {
        if (keys.includes(e.key)) {
          inputRef.current[action] = down
          handled = true
        }
      }
      if (down) Sound.init()
      if (down && !e.repeat && KEYS.thrust.includes(e.key)) pressStart()
      if (down && !e.repeat && (e.key === 'm' || e.key === 'M')) toggleMute()
      if (handled) e.preventDefault()
    }
    const down = onKey(true), up = onKey(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    let raf, last = performance.now(), acc = 0
    const loop = (now) => {
      const frame = Math.min(0.05, (now - last) / 1000)
      last = now
      const game = gameRef.current
      const slow = engine.slowMo(game)
      acc += frame * (slow ? 0.3 : 1)
      while (acc >= engine.STEP) {
        engine.step(game, inputRef.current, engine.STEP)
        acc -= engine.STEP
      }
      engine.updateSound(game, inputRef.current, slow)
      engine.updateCamera(game, W, H, frame)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const top = uprightRef.current ? CHIPS_TOP : 0
      engine.render(ctx, game, W, H, inputRef.current, { top })
      const u = hudScale(H)
      ctx.setTransform(dpr * u, 0, 0, dpr * u, 0, 0)
      const insets = thumbsRef.current
        ? { left: THUMBS.left / u, right: THUMBS.right / u, bottom: THUMBS.bottom / u, top: 0 }
        : uprightRef.current ? { left: 0, right: 0, bottom: 0, top: top / u } : null
      engine.drawHud(ctx, game, W / u, H / u, { touch: touchRef.current, insets })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      Sound.dispose()
    }
  }, [engine, storageKey])

  const hold = (action) => {
    const release = (e) => {
      inputRef.current[action] = false
      delete e.currentTarget.dataset.on
    }
    return {
      onPointerDown: (e) => {
        e.preventDefault()
        inputRef.current[action] = true
        e.currentTarget.dataset.on = '1'
        Sound.init()
        try { navigator.vibrate?.(8) } catch {}
        if (action === 'thrust') pressStart()
      },
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
      onContextMenu: (e) => e.preventDefault(),
    }
  }

  const { tiltBtn, thrustBtn, padBtn, caption } = theme
  // On phones the game fills the screen edge to edge: no title strip, small back and mute chips over the game
  const phone = mode === 'phone-portrait' || mode === 'phone-landscape'
  const sideways = mode === 'phone-landscape'

  // Left/right buttons show rotate arrows by default, or plain arrows for games that move sideways
  const arrow = (dir) => (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir < 0 ? 'M19 12H5M11 6l-6 6 6 6' : 'M5 12h14M13 6l6 6-6 6'} />
    </svg>
  )
  const icons = {
    up: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    ),
    down: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
    ),
    flame: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
  }

  const leftIcon = arrows ? arrow(-1) : icons.up
  const rightIcon = arrows ? arrow(1) : icons.down

  const muteButton = (
    <button
      onClick={() => { Sound.init(); toggleMute() }}
      className={`${theme.chip} p-1.5`}
      aria-label={muted ? 'Turn sound on' : 'Mute sound'}
      title={muted ? 'Sound off (M)' : 'Sound on (M)'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4z" />
        {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
      </svg>
    </button>
  )

  // One-screen app: title strip, game filling the middle, thumb controls on touch screens
  return (
    <div
      className={`fixed inset-0 flex select-none flex-col overflow-hidden ${theme.page} ${phone ? '' : 'gap-2.5 px-4 pt-3'}`}
      style={{ touchAction: 'none', paddingBottom: phone ? 0 : 'max(12px, env(safe-area-inset-bottom))' }}
    >
      {!phone && (
        <header className="flex w-full flex-wrap items-baseline justify-between gap-3">
          <h1 className={theme.title}>
            <Link href="/projects" className={`mr-3 align-middle text-base ${theme.link}`} aria-label="Back to projects">←</Link>
            {titleLead} <span className={theme.accent}>{titleAccent}</span>
          </h1>
          <div className={`flex items-center gap-3 text-sm tabular-nums ${theme.muted}`}>
            <span>{spec}</span>
            {muteButton}
          </div>
        </header>
      )}

      <div ref={wrapRef} className="relative min-h-0 w-full flex-1">
        <canvas
          ref={canvasRef}
          className={`block h-full w-full ${phone ? '' : theme.canvas}`}
          aria-label={`${name} game`}
        />

        {phone && (
          // Top center when sideways; in the top-right corner when upright, where the screen is too narrow to
          // fit them between the games' top-left readouts and top-right dials (see CHIPS_TOP)
          <div
            className={`absolute flex items-center gap-2 ${sideways ? 'left-1/2 -translate-x-1/2' : ''}`}
            style={{ top: 8, ...(sideways ? {} : { right: 'max(8px, env(safe-area-inset-right))' }) }}
          >
            <Link href="/projects" className={`${theme.chip} px-2.5 py-1`} aria-label="Back to projects">←</Link>
            {muteButton}
          </div>
        )}

        {/* Sideways: thumb buttons over the bottom corners (sizes match THUMBS above) */}
        {sideways && (
          <>
            <div
              className="absolute flex gap-2.5"
              style={{ left: 'max(16px, env(safe-area-inset-left))', bottom: 'max(14px, env(safe-area-inset-bottom))' }}
            >
              <button {...hold('left')} className={`${padBtn} h-14 w-14`} aria-label={labels.left[1]}>{leftIcon(24)}</button>
              <button {...hold('right')} className={`${padBtn} h-14 w-14`} aria-label={labels.right[1]}>{rightIcon(24)}</button>
            </div>
            <button
              {...hold('thrust')}
              className={`${thrustBtn} absolute h-[76px] w-[76px] flex-col gap-0 rounded-full text-[0.68rem]`}
              style={{ right: 'max(16px, env(safe-area-inset-right))', bottom: 'max(14px, env(safe-area-inset-bottom))' }}
            >
              {icons.flame(22)}
              Thrust
            </button>
          </>
        )}
      </div>

      {/* Upright: a slim control bar under the game, steering under the left thumb and thrust under the right */}
      {mode === 'phone-portrait' && (
        <div
          className="flex w-full items-center gap-2.5 px-3 pt-2.5"
          style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
        >
          <button {...hold('left')} className={`${padBtn} h-14 w-14 shrink-0`} aria-label={labels.left[1]}>{leftIcon(24)}</button>
          <button {...hold('right')} className={`${padBtn} h-14 w-14 shrink-0`} aria-label={labels.right[1]}>{rightIcon(24)}</button>
          <button {...hold('thrust')} className={`${thrustBtn} h-14 flex-1 rounded-full text-base`}>
            {icons.flame(20)}
            Thrust
          </button>
        </div>
      )}

      {mode === 'touch' && (
        <div className="grid w-full grid-cols-[1fr_1.6fr_1fr] gap-2.5">
          <button {...hold('left')} className={tiltBtn} aria-label={labels.left[1]}>
            {leftIcon(26)}
            <span className={caption}>{labels.left[0]}</span>
          </button>
          <button {...hold('thrust')} className={`${thrustBtn} rounded-2xl text-[1.35rem]`}>
            {icons.flame(24)}
            Thrust
          </button>
          <button {...hold('right')} className={tiltBtn} aria-label={labels.right[1]}>
            {rightIcon(26)}
            <span className={caption}>{labels.right[0]}</span>
          </button>
        </div>
      )}
      {mode === 'default' && (
        <p className={`w-full text-[0.8rem] ${theme.muted}`}>
          {hint}
        </p>
      )}
    </div>
  )
}
