import { useCallback, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const DublinParksMap = dynamic(() => import('../../components/DublinParksMap'), { ssr: false })

export default function DublinParksPage() {
  const scrollRef = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // On phones the map is wider than the screen; start centered
  const centerMap = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [])

  return (
    <>
      <Head>
        <title>Dublin Parks | Abhi Tondepu</title>
        <meta name="description" content="Our neighborhood parks, named by the kids." />
      </Head>
      <div className="relative h-[100svh] w-screen overflow-hidden" style={{ background: '#C8D5B9' }}>
        <div ref={scrollRef} className="h-full w-full overflow-x-auto overflow-y-hidden sm:overflow-hidden flex items-center max-sm:justify-start sm:justify-center">
          <DublinParksMap fullPage onLayout={centerMap} />
        </div>

        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 max-w-xs">
          <div className="flex items-center gap-2">
            <Link
              href="/projects"
              aria-label="Back to projects"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/95 text-ink shadow-lg backdrop-blur hover:text-olive transition-colors"
            >
              ←
            </Link>
            <h1 className="m-0">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="flex h-10 items-center gap-2 rounded-xl bg-white/95 px-4 text-xl font-bold leading-none text-ink shadow-lg backdrop-blur hover:text-olive hover:italic transition-colors"
              >
                Dublin Parks
                <span className="text-xs" aria-hidden="true">{open ? '▴' : '▾'}</span>
              </button>
            </h1>
          </div>

          {open && (
            <div className="mt-2 rounded-xl bg-white/95 px-4 py-3 text-sm text-ink-soft shadow-lg backdrop-blur">
              <p>Named by the kids. Tap a park to learn more.</p>
              <p className="mt-2">
                Outside of my home town, Dublin is the first place we&apos;ve lived that actually felt like home. The parks are a big part of it. Summer evenings feel endless: families out until dark, kids who refuse to leave.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

DublinParksPage.bareLayout = true
