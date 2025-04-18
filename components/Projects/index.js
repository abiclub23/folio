export default function Projects() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Projects</h1>
      <p className="text-lg text-gray-600 mb-8">
        Side projects and experiments. Some old, some broken, all fun.
      </p>

      <div className="space-y-4 border-t border-gray-950 pt-6">
        <a 
          href="https://abiclub23.github.io/BreakingBadFont/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:italic"
        >
          <div>
            <h2 className="text-xl font-semibold">Breaking Bad Font Generator</h2>
            <p className="text-sm text-gray-500">Generate names in the Breaking Bad style.</p>
          </div>
        </a>

        <a 
          href="https://abiclub23.github.io/Southpark/southpark.html"
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:italic"
        >
          <div>
            <h2 className="text-xl font-semibold">South Park CSS</h2>
            <p className="text-sm text-gray-500">South Park characters built entirely with CSS.</p>
          </div>
        </a>
      </div>
    </div>
  )
} 