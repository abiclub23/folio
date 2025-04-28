import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Abhi Tondepu</title>
        <meta name="description" content="Personal website of Abhi Tondepu" />
      </Head>

      <div className="py-8">
        <div className="space-y-12">
          <p className="text-lg text-gray-950">
            Hi, I'm Abhi Tondepu
          </p>
          <nav className="space-y-8">
            <Link href="/writing" className="block">
              <span className="text-7xl font-light inline-block hover:text-custom-green hover:italic">
                Writing
              </span>
            </Link>
            <Link href="/books" className="block">
              <span className="text-7xl font-light inline-block hover:text-custom-green hover:italic">
                Books
              </span>
            </Link>
            <Link href="/projects" className="block">
              <span className="text-7xl font-light inline-block hover:text-custom-green hover:italic">
                Projects
              </span>
            </Link>
            <Link href="/about" className="block">
              <span className="text-7xl font-light inline-block hover:text-custom-green hover:italic">
                About
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </>
  )
} 