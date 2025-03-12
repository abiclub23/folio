import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Abhi Tondepu - Personal Website</title>
      </Head>

      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">
          Hi, I'm Abhi Tondepu
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Welcome to my personal website. I write about technology, design, and other things I'm passionate about.
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link href="/blog" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium">
            Read My Blog
          </Link>
          <Link href="/about" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-md font-medium">
            About Me
          </Link>
        </div>
      </section>
    </>
  )
} 