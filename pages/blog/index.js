import Head from 'next/head'
import Link from 'next/link'
import { getSortedPostsData } from '../../lib/posts'

export default function Blog({ allPostsData }) {
  return (
    <>
      <Head>
        <title>Blog - Abhi Tondepu</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">
            Blog
          </h1>
          <p className="text-xl text-gray-600">
            Thoughts, ideas, and reflections on topics I care about.
          </p>
        </div>

        <div className="space-y-8">
          {allPostsData.map(({ id, date, title, excerpt }) => (
            <article key={id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">{date}</p>
              <Link href={`/blog/${id}`}>
                <h2 className="text-2xl font-semibold mb-3 hover:text-blue-500">{title}</h2>
              </Link>
              <p className="text-gray-600 mb-4">{excerpt}</p>
              <Link href={`/blog/${id}`} className="text-blue-500 hover:text-blue-600 font-medium inline-flex items-center">
                Read more
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}

export async function getStaticProps() {
  const allPostsData = getSortedPostsData()
  return {
    props: {
      allPostsData
    }
  }
} 