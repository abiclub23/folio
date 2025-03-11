import Head from 'next/head'
import Link from 'next/link'
import { getSortedPostsData } from '../../lib/posts'

export default function Blog({ allPostsData }) {
  return (
    <>
      <Head>
        <title>Blog - Your Name</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-text mb-4 relative inline-block">
            Blog
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
          </h1>
          <p className="text-xl text-text-light">
            Thoughts, ideas, and reflections on topics I care about.
          </p>
        </div>

        <div className="space-y-10">
          {allPostsData.map(({ id, date, title, excerpt }, index) => (
            <article 
              key={id} 
              className={`card-3d bg-card rounded-lg shadow-md p-6 transition-all duration-300 ${
                index % 2 === 0 ? 'transform rotate-1' : 'transform -rotate-1'
              }`}
            >
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent mb-4 rounded-full"></div>
              <p className="text-sm text-text-light mb-2">{date}</p>
              <Link href={`/blog/${id}`}>
                <h2 className="text-2xl font-semibold text-text mb-3 hover:text-primary transition-colors">{title}</h2>
              </Link>
              <p className="text-text-light mb-4">{excerpt}</p>
              <Link href={`/blog/${id}`} className="text-primary hover:text-secondary font-medium inline-flex items-center">
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