import Head from 'next/head'

export default function About() {
  return (
    <>
      <Head>
        <title>About | Abhi Tondepu</title>
        <meta name="description" content="About Abhi Tondepu - Engineer, web developer, and dad" />
      </Head>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">About Me</h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-lg leading-relaxed text-gray-700">
              I'm an engineer at heart, but I get zealous about art and design. I started working on web projects for fun, and soon I was doing it full time. Many years later, I'm still loving it.
            </p>
          </section>
          
          
          
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Beyond the Screen</h2>
            <p className="text-lg leading-relaxed text-gray-700">
            When I'm not coding, you can catch me jamming out to my favorite tunes, trying to relive my soccer glory days (MUFC forever!), or experimenting in the kitchen with recipes that occasionally surprise me with success. 
            But let's get real—most of my "free time" is actually spent in dad mode, saving the world one diaper change and bedtime story at a time. 
            Being a dad to my two tiny humans is the best job I've ever had, even if it means my soccer skills are now limited to chasing after them in the backyard.

            </p>
            <p className="text-lg leading-relaxed text-gray-700 mt-4">
              Most importantly, I'm a proud father of two amazing kids who constantly remind me to see the world with curiosity and wonder.
            </p>
          </section>
          
          <section className="mt-12 pt-6 border-t border-gray-950">
            <p className="text-lg text-gray-700">
              Thank you for visiting my site. If you have any questions, feedback, or just want to say hello, feel free to 
              <a href="mailto:atondepu@gmail.com" className="text-blue-600 hover:underline ml-1">
                reach out to me
              </a>.
            </p>
          </section>
        </div>
      </div>
    </>
  )
} 