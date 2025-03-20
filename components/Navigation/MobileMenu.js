import NavLinks from './NavLinks'

export default function MobileMenu({ isOpen, onClose }) {
  if (!isOpen) return null
  
  return (
    <div 
      className="md:hidden fixed inset-0 z-40 backdrop-blur-md bg-[#f5ecd9]/40"
      onClick={onClose}
    >
      <div 
        className="absolute top-[60px] left-0 right-0 bg-[#f5ecd9]/80 backdrop-blur-md border-b border-gray-950 shadow-lg animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <NavLinks isMobile={true} onLinkClick={onClose} />
        </div>
      </div>
    </div>
  )
} 