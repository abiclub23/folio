import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Abhi Tondepu</title>
        <meta name="description" content="Personal website of Abhi Tondepu" />
      </Head>

      <div className="flex flex-col items-center justify-center py-12 md:min-h-[70vh]">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-8">
          Abhi Tondepu
        </h1>
        
        <div className="w-full max-w-md md:max-w-lg mx-auto overflow-hidden rounded-lg">
          <img 
            src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmx3ZDNlejl2OTRycGliMm00dHZvMGFkanM2NGY2amdleWg0aTMxZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/0jzKx0JIwHHZ404zrq/giphy.gif" 
            alt="Abhi Tondepu" 
            className="w-full h-auto object-cover" 
            loading="lazy"
          />
        </div>
      </div>
    </>
  )
} 