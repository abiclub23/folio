import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Abhi Tondepu</title>
      </Head>

      <section className="text-center py-12">
        <h1 className="text-3xl font-bold mb-6">
          Hi, I'm Abhi Tondepu
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Check back soon for updates!
        </p>
      </section>
    </>
  )
} 