import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getMoodStyles, getLayoutStyles, getAccentStyles, getNavigationStyles } from './presets'
import FloatAnimation from './animations/FloatAnimation'
import GlitchAnimation from './animations/GlitchAnimation'

// Dynamically import Three.js components with SSR disabled
const ParticlesBackground = dynamic(() => import('./animations/ParticlesBackground'), { ssr: false })
const WavesBackground = dynamic(() => import('./animations/WavesBackground'), { ssr: false })

export default function Today({ config }) {
  const mood = getMoodStyles(config.mood)
  const layout = getLayoutStyles(config.layout)
  const accent = getAccentStyles(config.accent)
  const navStyles = getNavigationStyles(config.navigation || { style: 'floating', position: 'top' })

  const links = [
    { label: 'Writing', href: '/writing' },
    { label: 'Books', href: '/books' },
    { label: 'Projects', href: '/projects' },
    { label: 'About', href: '/about' }
  ]

  const animation = config.animation || { type: 'none', intensity: 'medium', interactive: false }

  // Render background animation
  const renderBackground = () => {
    switch (animation.type) {
      case 'particles':
        return <ParticlesBackground intensity={animation.intensity} color={accent.color} />
      case 'waves':
        return <WavesBackground intensity={animation.intensity} color={accent.color} />
      default:
        return null
    }
  }

  // Wrap content with animation
  const wrapWithAnimation = (children) => {
    switch (animation.type) {
      case 'float':
        return (
          <FloatAnimation intensity={animation.intensity} interactive={animation.interactive}>
            {children}
          </FloatAnimation>
        )
      case 'glitch':
        return (
          <GlitchAnimation intensity={animation.intensity} interactive={animation.interactive}>
            {children}
          </GlitchAnimation>
        )
      default:
        return children
    }
  }

  return (
    <div className={`min-h-screen ${accent.bg} ${mood.container} relative overflow-hidden`}>
      {/* Background animations */}
      {renderBackground()}

      {/* Custom Navigation */}
      {config.navigation && config.navigation.style !== 'hidden' && (
        <nav className={`${navStyles.wrapper} ${navStyles.position} z-50`}>
          <div className={navStyles.links}>
            <Link href="/" className={navStyles.linkClass}>
              Home
            </Link>
            <Link href="/writing" className={navStyles.linkClass}>
              Writing
            </Link>
            <Link href="/books" className={navStyles.linkClass}>
              Books
            </Link>
            <Link href="/projects" className={navStyles.linkClass}>
              Projects
            </Link>
            <Link href="/about" className={navStyles.linkClass}>
              About
            </Link>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className={`py-16 px-8 ${layout.wrapper} relative z-10`}>
        {wrapWithAnimation(
          <h1 className={`${mood.headlineSize} ${mood.headlineWeight} ${accent.primary} ${mood.transform} mb-4`}>
            {config.headline}
          </h1>
        )}

        {config.subheadline && (
          <p className={`${mood.subSize} ${accent.secondary} mb-12`}>
            {config.subheadline}
          </p>
        )}

        <nav className={layout.nav}>
          {links.map((link, idx) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${mood.linkSize} ${accent.link} ${accent.hover} ${mood.linkEffect} transition-all duration-${mood.speed}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className={`mt-16 text-sm ${accent.tertiary}`}>
          {config.generatedNote}
        </p>
      </div>
    </div>
  )
}
