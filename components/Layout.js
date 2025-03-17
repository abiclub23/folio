// Layout component for the website
import Link from 'next/link'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-950">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/" className="text-xl font-semibold">
                Abhi Tondepu
              </Link>
            </div>
            <div className="flex space-x-6">
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
          </div>
        </nav>
      </header>
      
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