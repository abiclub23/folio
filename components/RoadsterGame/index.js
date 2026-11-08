// Roadster Launch: 0–60 in under a second, up a ramp to the sky, then thrusters to land.
// This file is the React page around the game; the game itself lives in physics.js, draw.js and sound.js.
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { STEP, newGame, pressThrust, slowMo, step } from './physics'
import { drawHud, render, updateCamera } from './draw'
import { Sound } from './sound'

const KEYS = {
  thrust: [' ', 'w', 'W', 'ArrowUp'],
  left: ['a', 'A', 'ArrowLeft'],
  right: ['d', 'D', 'ArrowRight'],
}

export default function RoadsterGame() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const inputRef = useRef({ thrust: false, left: false, right: false })
  const runwayRef = useRef(40)
  const touchRef = useRef(false)
  const [muted, setMuted] = useState(false)
  // Layout: 'default' (keyboard), 'touch' (tablet, buttons under the game),
  // 'phone-portrait' (asks to rotate) or 'phone-landscape' (full screen, buttons over the game)
  const [mode, setMode] = useState('default')

  useEffect(() => {
    const touch = window.matchMedia('(pointer: coarse)')
    const portrait = window.matchMedia('(pointer: coarse) and (orientation: portrait) and (max-width: 600px)')
    const landscape = window.matchMedia('(pointer: coarse) and (orientation: landscape) and (max-height: 600px)')
    const update = () => {
      touchRef.current = touch.matches
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
    try { localStorage.setItem('roadster-muted', next ? '1' : '0') } catch {}
    setMuted(next)
  }

  const pressStart = () => {
    gameRef.current = pressThrust(gameRef.current, runwayRef.current)
  }

  useEffect(() => {
    let savedMute = false
    try { savedMute = localStorage.getItem('roadster-muted') === '1' } catch {}
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
      // Phones get a longer runway for more build-up before the ramp; takes effect on the next run
      runwayRef.current = W < 640 || window.matchMedia('(pointer: coarse)').matches ? 70 : 40
    }
    resize()
    gameRef.current = newGame({ runway: runwayRef.current })
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
      const slow = slowMo(game)
      acc += frame * (slow ? 0.3 : 1)
      while (acc >= STEP) {
        step(game, inputRef.current, STEP)
        acc -= STEP
      }
      Sound.update(game, inputRef.current, slow)
      updateCamera(game, W, H, frame)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      render(ctx, game, W, H, inputRef.current)
      drawHud(ctx, game, W, H, { touch: touchRef.current })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      if (Sound.ctx) Sound.ctx.close()
      Sound.ctx = Sound.nodes = Sound.lastPhase = null
    }
  }, [])

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

  const tiltBtn =
    'flex select-none flex-col items-center justify-center gap-1 rounded-2xl border border-[#3a3f46] bg-gradient-to-b from-[#2a2e34] to-[#1d2025] py-3 text-[#eceae4] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-75 data-[on=1]:scale-[0.96] data-[on=1]:border-[#6b7280] data-[on=1]:from-[#353a42] data-[on=1]:to-[#2a2e34]'
  const thrustBtn =
    'flex select-none items-center justify-center gap-2 border border-white/60 bg-gradient-to-b from-white to-[#dfe3e8] font-barlow-condensed font-bold uppercase tracking-[0.1em] text-[#17191c] shadow-[inset_0_-2px_0_rgba(0,0,0,0.08),0_6px_18px_rgba(0,0,0,0.35)] transition-transform duration-75 data-[on=1]:scale-[0.96] data-[on=1]:from-white data-[on=1]:to-white data-[on=1]:shadow-[0_0_28px_rgba(255,255,255,0.55)]'
  // Round, see-through thumb buttons for phones held sideways
  const padBtn =
    'flex select-none items-center justify-center rounded-full border border-white/25 bg-[#17191c]/55 text-[#eceae4] backdrop-blur-sm transition-transform duration-75 data-[on=1]:scale-[0.94] data-[on=1]:bg-white/25'
  const caption = 'font-barlow-condensed text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#9aa0a8]'
  const phone = mode === 'phone-landscape'

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

  const muteButton = (
    <button
      onClick={() => { Sound.init(); toggleMute() }}
      className="rounded-md border border-[#3a3f46] bg-[#17191c]/60 p-1.5 text-[#eceae4] hover:bg-[#23262b]"
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
      className={`fixed inset-0 flex select-none flex-col overflow-hidden bg-[#17191c] font-barlow text-[#eceae4] ${phone ? '' : 'gap-2.5 px-4 pt-3'}`}
      style={{ touchAction: 'none', paddingBottom: phone ? 0 : 'max(12px, env(safe-area-inset-bottom))' }}
    >
      {!phone && (
        <header className="flex w-full flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-barlow-condensed text-[1.6rem] font-bold uppercase tracking-[0.04em]">
            <Link href="/projects" className="mr-3 align-middle text-base text-[#9aa0a8] hover:text-[#eceae4]" aria-label="Back to projects">←</Link>
            Roadster <span className="text-[#d62828]">Launch</span>
          </h1>
          <div className="flex items-center gap-3 text-sm tabular-nums text-[#9aa0a8]">
            <span>0–60 in 0.9s · land under 11 mph, within 15° of level</span>
            {muteButton}
          </div>
        </header>
      )}

      <div ref={wrapRef} className="relative min-h-0 w-full flex-1">
        <canvas
          ref={canvasRef}
          className={`block h-full w-full ${phone ? '' : 'rounded-md border border-[#3a3f46]'}`}
          aria-label="Roadster launch game"
        />

        {phone && (
          <>
            <div className="absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-2">
              <Link href="/projects" className="rounded-md border border-[#3a3f46] bg-[#17191c]/60 px-2.5 py-1 text-[#eceae4]" aria-label="Back to projects">←</Link>
              {muteButton}
            </div>
            <div
              className="absolute flex gap-3"
              style={{ left: 'max(16px, env(safe-area-inset-left))', bottom: 'max(14px, env(safe-area-inset-bottom))' }}
            >
              <button {...hold('left')} className={`${padBtn} h-[72px] w-[72px]`} aria-label="Tilt nose up">{icons.up(28)}</button>
              <button {...hold('right')} className={`${padBtn} h-[72px] w-[72px]`} aria-label="Tilt nose down">{icons.down(28)}</button>
            </div>
            <button
              {...hold('thrust')}
              className={`${thrustBtn} absolute h-[96px] w-[96px] flex-col gap-0.5 rounded-full text-[0.8rem]`}
              style={{ right: 'max(16px, env(safe-area-inset-right))', bottom: 'max(14px, env(safe-area-inset-bottom))' }}
            >
              {icons.flame(30)}
              Thrust
            </button>
          </>
        )}
      </div>

      {mode === 'touch' && (
        <div className="grid w-full grid-cols-[1fr_1.6fr_1fr] gap-2.5">
          <button {...hold('left')} className={tiltBtn} aria-label="Tilt nose up">
            {icons.up(26)}
            <span className={caption}>Nose up</span>
          </button>
          <button {...hold('thrust')} className={`${thrustBtn} rounded-2xl text-[1.35rem]`}>
            {icons.flame(24)}
            Thrust
          </button>
          <button {...hold('right')} className={tiltBtn} aria-label="Tilt nose down">
            {icons.down(26)}
            <span className={caption}>Nose down</span>
          </button>
        </div>
      )}
      {mode === 'default' && (
        <p className="w-full text-[0.8rem] text-[#9aa0a8]">
          Keyboard: hold ↑ or W to drive and thrust, A/D or ←/→ to tilt, M to mute.
        </p>
      )}

      {mode === 'phone-portrait' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#17191c] px-8 text-center">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#eceae4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="motion-safe:animate-turn-phone">
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <path d="M11 18h2" />
          </svg>
          <h2 className="font-barlow-condensed text-3xl font-bold uppercase tracking-[0.04em]">
            Rotate your <span className="text-[#d62828]">phone</span>
          </h2>
          <p className="text-[#9aa0a8]">Roadster Launch plays sideways, with the controls under your thumbs.</p>
          <Link href="/projects" className="mt-2 text-sm text-[#9aa0a8] underline">Back to projects</Link>
        </div>
      )}
    </div>
  )
}
