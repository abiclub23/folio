import Head from 'next/head'

export default function Blog() {
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

        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
          <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
          <p className="text-gray-600 mb-2">
            I'm currently working on new blog content.
          </p>
          <p className="text-gray-600">
            Check back soon for articles about technology, design, and more!
          </p>
        </div>
      </div>
    </>
  )
} 