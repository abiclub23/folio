import { useState, useEffect } from 'react'
import NavLinks from './NavLinks'
import MobileMenu from './MobileMenu'
import MenuButton from './MenuButton'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)
  
  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-200 border-b border-gray-950 ${scrolled ? 'bg-[#f5ecd9] shadow-sm' : 'bg-[#f5ecd9]/90 backdrop-blur-sm'}`}>
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-start items-center">
            {/* Desktop Navigation */}
            <NavLinks />
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <MenuButton isOpen={isMenuOpen} onClick={toggleMenu} />
            </div>
          </div>
        </nav>
      </header>
      
      {/* Mobile menu overlay */}
      <MobileMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </>
  )
} 