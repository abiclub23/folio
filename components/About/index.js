import Head from 'next/head'

export default function About() {
  return (
    <>
      <Head>
        <title>About | Abhi Tondepu</title>
        <meta name="description" content="About Abhi Tondepu - Engineer and dad" />
      </Head>

      <div className="">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">About me</h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-lg leading-relaxed text-gray-700">
            I'm a dad, engineer, and Manchester United fan who enjoys writing in my spare time. This site is where I share my thoughts and musings. 
            
            </p>
          </section>

          <section className="mt-12 pt-6 border-t border-gray-950">
            <p className="text-lg text-gray-700">
            Thanks for visiting! Feel free to reach out if you want to say
              <a href="mailto:atondepu@gmail.com" className="text-blue-600 hover:underline ml-1">
                hello
              </a>.
            </p>
          </section>
        </div>
      </div>
    </>
  )
} 