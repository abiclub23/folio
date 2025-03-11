import Head from 'next/head'
import Link from 'next/link'
import { getSortedPostsData } from '../lib/posts'

export default function Home({ allPostsData }) {
  return (
    <>
      <Head>
        <title>Your Name - Personal Website</title>
      </Head>

      <section className="text-center py-12 md:py-20">
        <div className="w-32 h-32 mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-full opacity-70 animate-tilt"></div>
          <div className="absolute inset-2 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">YN</span>
          </div>
        </div>
        
        <h1 className="home-name font-bold mb-4 relative inline-block">
          Hi, I'm <span>Your Name</span>
        </h1>
        
        <p className="text-xl text-text-light max-w-2xl mx-auto mb-8">
          Welcome to my personal website. I write about technology, design, and other things I'm passionate about.
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link href="/blog" className="neo-button px-6 py-3 bg-primary text-white rounded-md font-medium">
            Read My Blog
          </Link>
          <Link href="/about" className="neo-button px-6 py-3 bg-white text-primary rounded-md font-medium">
            About Me
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <div className="border-b border-gray-200 pb-5 mb-8">
          <h2 className="text-2xl font-semibold text-text">Recent Posts</h2>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {allPostsData.slice(0, 3).map(({ id, date, title, excerpt }, index) => (
            <div key={id} className={`card-3d glass-card rounded-lg shadow-md overflow-hidden hover:shadow-float transition-all duration-300 ${index % 2 === 0 ? 'transform rotate-1' : 'transform -rotate-1'}`}>
              <div className="p-6">
                <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary mb-4 rounded-full"></div>
                <p className="text-sm text-text-light mb-1">{date}</p>
                <Link href={`/blog/${id}`}>
                  <h3 className="text-xl font-semibold text-text mb-2 hover:text-primary transition-colors">{title}</h3>
                </Link>
                <p className="text-text-light mb-4">{excerpt}</p>
                <Link href={`/blog/${id}`} className="text-primary hover:text-secondary font-medium inline-flex items-center">
                  Read more
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {allPostsData.length > 3 && (
          <div className="mt-12 text-center">
            <Link href="/blog" className="inline-flex items-center text-primary hover:text-secondary font-medium">
              View all posts
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}
      </section>
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