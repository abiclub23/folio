import Link from 'next/link'

// `date` is free text so old projects can be fuzzy ("2016") and new ones exact ("Nov 2026").
// Dates are when each project landed on the site (first merge), not later redos.
// Newest first.
const projects = [
  {
    title: 'Starship Catch',
    href: '/projects/starship-catch',
    date: 'Nov 2026',
    description: 'Bring the ship home like Flight 15: belly-flop, flip, and ease into the chopsticks.',
  },
  {
    title: 'Roadster Launch',
    href: '/projects/roadster',
    date: 'Nov 2026',
    description: '0–60 in under a second, off a ramp into the sky. Land it.',
  },
  {
    title: 'Dublin Parks, Kid Edition',
    href: '/projects/dublin-parks',
    date: 'Mar 2026',
    description: 'A custom map of our neighborhood parks, named by the kids.',
  },
  {
    title: 'A Fun Website Easter Egg',
    href: '/projects/easter-egg',
    date: 'May 2025',
    description: 'Enter the Konami Code to discover a hidden surprise!',
  },
  {
    title: 'South Park CSS',
    href: 'https://abiclub23.github.io/Southpark/southpark.html',
    external: true,
    date: '2016',
    description: 'South Park characters built entirely with CSS.',
  },
  {
    title: 'Breaking Bad Font Generator',
    href: 'https://abiclub23.github.io/BreakingBadFont/index.html',
    external: true,
    date: '2016',
    description: 'Generate names in the Breaking Bad style.',
  },
]

export default function Projects() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Projects</h1>
      <p className="text-lg text-ink-soft mb-8">
        Side projects and experiments. Some old, some broken, all fun.
      </p>

      <div className="space-y-4 border-t border-ink pt-6">
        {projects.map(({ title, href, external, date, description }) => {
          const heading = <h2 className="text-xl font-semibold">{title}</h2>
          return (
            <div key={href} className="block">
              <div className="flex items-baseline justify-between gap-4">
                {external ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-olive hover:italic"
                  >
                    {heading}
                  </a>
                ) : (
                  <Link href={href} className="hover:text-olive hover:italic">
                    {heading}
                  </Link>
                )}
                <span className="text-sm text-ink-muted whitespace-nowrap">{date}</span>
              </div>
              <p className="text-sm text-ink-muted">{description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
