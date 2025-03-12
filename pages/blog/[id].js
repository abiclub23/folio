import Head from 'next/head'
import Link from 'next/link'
import { getAllPostIds, getPostData } from '../../lib/posts'

export default function Post({ postData }) {
  return (
    <>
      <Head>
        <title>{postData.title} - Abhi Tondepu</title>
      </Head>

      <article className="max-w-3xl mx-auto">
        <Link href="/blog" className="text-blue-500 hover:text-blue-600 mb-8 inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to all posts
        </Link>
        
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{postData.title}</h1>
            <p className="text-gray-500">{postData.date}</p>
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