import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Abhi Tondepu</title>
      </Head>

      <section className="text-center py-12">
        <h3 className="text-3xl font-bold mb-6">
          Hi, I'm Abhi Tondepu
        </h3>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Check back soon for updates!
        </p>
        <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmx3ZDNlejl2OTRycGliMm00dHZvMGFkanM2NGY2amdleWg0aTMxZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/0jzKx0JIwHHZ404zrq/giphy.gif" alt="Abhi Tondepu" className="w-1/2 mx-auto" />
        
       
      </section>
    </>
  )
} 