import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Layout({ children }) {
  const router = useRouter()
  
  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-shrink-0">
              {/* <Link href="/" className="text-xl font-bold">
                Abhi Tondepu
              </Link> */}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`px-3 py-2 text-sm font-medium ${
                  router.pathname === "/"
                    ? "text-gray-900 border-b-2 border-indigo-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Home
              </Link>
              <Link
                href="/blog"
                className={`px-3 py-2 text-sm font-medium ${
                  router.pathname.startsWith("/blog")
                    ? "text-gray-900 border-b-2 border-indigo-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Blog
              </Link>
              <Link
                href="/about"
                className={`px-3 py-2 text-sm font-medium ${
                  router.pathname === "/about"
                    ? "text-gray-900 border-b-2 border-indigo-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                About
              </Link>
            </div>
            <div className="sm:hidden">
              <button className="text-gray-500 hover:text-gray-700 focus:outline-none p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>
      
      <main className="flex-grow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      
      <footer>
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm">
              © {new Date().getFullYear()} Abhi Tondepu. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 sm:mt-0 text-sm">
              <a href="mailto:atondepu@gmail.com">
                <span className="ml-2">Contact Me</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 