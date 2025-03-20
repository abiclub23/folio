// Layout component for the website
import Navigation from './Navigation'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
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