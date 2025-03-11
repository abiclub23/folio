import Head from 'next/head'
import Link from 'next/link'
import { getAllPostIds, getPostData } from '../../lib/posts'

export default function Post({ postData }) {
  return (
    <>
      <Head>
        <title>{postData.title} - Your Name</title>
      </Head>

      <article className="max-w-3xl mx-auto">
        <Link href="/blog" className="text-primary hover:text-secondary mb-8 inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to all posts
        </Link>
        
        <div className="glass-card rounded-lg shadow-glass p-8 mb-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">{postData.title}</h1>
            <p className="text-text-light">{postData.date}</p>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mt-4 rounded-full"></div>
          </header>
          
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: postData.contentHtml }} 
          />
        </div>
      </article>
    </>
  )
}

export async function getStaticPaths() {
  const paths = getAllPostIds()
  return {
    paths,
    fallback: false
  }
}

export async function getStaticProps({ params }) {
  const postData = await getPostData(params.id)
  return {
    props: {
      postData
    }
  }
} 