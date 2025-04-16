import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLinks({ isMobile = false, onLinkClick = () => {} }) {
  const pathname = usePathname()
  
  const links = [
    { href: "/", label: "Home", active: true },
    { href: "/about", label: "About", active: true },
    { href: "/things-i-like", label: "Things I Like", active: true },
    { href: "/tiwid", label: "This Is What I Did", active: true },
    { href: "/projects", label: "Projects", active: true },
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
            className={`text-lg px-2 py-2 
              ${!link.active ? 'opacity-50' : ''} 
              ${pathname === link.href ? 'underline underline-offset-4' : 'hover:italic'}`}
            onClick={onLinkClick}
          >
            {link.label}
          </Link>
        ))}
        <div className="pt-4 mt-2 border-t border-gray-950">
          <a 
            href="mailto:atondepu@gmail.com" 
            className="text-gray-700 hover:italic"
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
          className={`${!link.active ? 'opacity-50' : ''} 
            ${pathname === link.href ? 'underline underline-offset-4' : 'hover:italic'}`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
} 