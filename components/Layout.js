// Layout component for the website
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Layout({ children }) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`sticky top-0 z-50 transition-all duration-200 border-b border-gray-950 ${scrolled ? 'bg-[#f5ecd9] shadow-sm' : 'bg-[#f5ecd9]/90 backdrop-blur-sm'}`}>
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-start items-center">
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <Link href="/" className="hover:text-gray-600 transition-colors">
                Home
              </Link>
              <Link href="/about" className="hover:text-gray-600 transition-colors">
                About
              </Link>
              <Link href="#" className="hover:text-gray-600 transition-colors opacity-50">
                Labs
              </Link>
              <Link href="#" className="hover:text-gray-600 transition-colors opacity-50">
                Blog
              </Link>
              <Link href="#" className="hover:text-gray-600 transition-colors opacity-50">
                More
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hover:text-gray-600 focus:outline-none"
                aria-label="Toggle menu"
              >
                {!isMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>
      
      {/* Mobile menu overlay with frosted glass effect */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 backdrop-blur-md bg-[#f5ecd9]/40"
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className="absolute top-[60px] left-0 right-0 bg-[#f5ecd9]/80 backdrop-blur-md border-b border-gray-950 shadow-lg animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col space-y-5">
                <Link 
                  href="/" 
                  className="text-lg hover:text-gray-600 transition-colors px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/about" 
                  className="text-lg hover:text-gray-600 transition-colors px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  href="#" 
                  className="text-lg hover:text-gray-600 transition-colors opacity-50 px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Labs
                </Link>
                <Link 
                  href="#" 
                  className="text-lg hover:text-gray-600 transition-colors opacity-50 px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Blog
                </Link>
                <Link 
                  href="#" 
                  className="text-lg hover:text-gray-600 transition-colors opacity-50 px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  More
                </Link>
                <div className="pt-4 mt-2 border-t border-gray-950">
                  <a 
                    href="mailto:atondepu@gmail.com" 
                    className="text-gray-700 hover:text-gray-900 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact Me
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-grow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      
      <footer className="border-t border-gray-950">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm">
              © {new Date().getFullYear()} Abhi Tondepu. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 sm:mt-0 text-sm">
              <a href="mailto:atondepu@gmail.com" className="hover:text-gray-600 transition-colors">
                <span className="ml-2">Contact Me</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 