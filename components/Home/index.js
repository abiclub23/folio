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
            <Link href="/about" className="block">
              <span className="text-7xl font-light inline-block hover:italic ">
                About
              </span>
            </Link>
            <Link href="/things-i-like" className="block">
              <span className="text-7xl font-light inline-block hover:italic ">
                Things I Like
              </span>
            </Link>
            <span className="block cursor-not-allowed">
              <span className="text-7xl font-light inline-block opacity-50">
                Labs
              </span>
            </span>
            <span className="block cursor-not-allowed">
              <span className="text-7xl font-light inline-block opacity-50">
                Blog
              </span>
            </span>
            <span className="block cursor-not-allowed">
              <span className="text-7xl font-light inline-block opacity-50">
                More
              </span>
            </span>
          </nav>
        </div>
      </div>
    </>
  )
} 