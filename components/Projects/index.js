import Link from 'next/link'

export default function Projects() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Projects</h1>
      <p className="text-lg text-gray-600 mb-8">
        Side projects and experiments. Some old, some broken, all fun.
      </p>

      <div className="space-y-4 border-t border-gray-950 pt-6">
        <div className="block">
          <a 
            href="https://abiclub23.github.io/BreakingBadFont/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-custom-green hover:italic"
          >
            <h2 className="text-xl font-semibold">Breaking Bad Font Generator</h2>
          </a>
          <p className="text-sm text-gray-500">Generate names in the Breaking Bad style.</p>
        </div>

        <div className="block">
          <a 
            href="https://abiclub23.github.io/Southpark/southpark.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-custom-green hover:italic"
          >
            <h2 className="text-xl font-semibold">South Park CSS</h2>
          </a>
          <p className="text-sm text-gray-500">South Park characters built entirely with CSS.</p>
        </div>

        <div className="block">
          <Link 
            href="/projects/easter-egg"
            className="hover:text-custom-green hover:italic"
          >
            <h2 className="text-xl font-semibold">Website Easter Egg</h2>
          </Link>
          <p className="text-sm text-gray-500">Enter the Konami Code to discover a hidden surprise!</p>
        </div>
      </div>
    </div>
  )
} 