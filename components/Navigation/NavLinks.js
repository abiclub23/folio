import Link from 'next/link'

export default function NavLinks({ isMobile = false, onLinkClick = () => {} }) {
  const links = [
    { href: "/", label: "Home", active: true },
    { href: "/about", label: "About", active: true },
    { href: "/things-i-like", label: "Things I Like", active: true },
    { href: "#", label: "Labs", active: false },
    { href: "#", label: "Blog", active: false },
    { href: "#", label: "More", active: false }
  ]
  
  if (isMobile) {
    return (
      <div className="flex flex-col space-y-5">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`text-lg hover:text-gray-600 transition-colors px-2 py-2 ${!link.active ? 'opacity-50' : ''}`}
            onClick={onLinkClick}
          >
            {link.label}
          </Link>
        ))}
        <div className="pt-4 mt-2 border-t border-gray-950">
          <a 
            href="mailto:atondepu@gmail.com" 
            className="text-gray-700 hover:text-gray-900 transition-colors"
            onClick={onLinkClick}
          >
            Contact Me
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="hidden md:flex space-x-8">
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className={`hover:text-gray-600 transition-colors ${!link.active ? 'opacity-50' : ''}`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
} 