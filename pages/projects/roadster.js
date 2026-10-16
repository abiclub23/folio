import Head from 'next/head'
import dynamic from 'next/dynamic'

const RoadsterGame = dynamic(() => import('../../components/RoadsterGame'), { ssr: false })

export default function RoadsterPage() {
  return (
    <>
      <Head>
        <title>Roadster Launch | Abhi Tondepu</title>
        <meta name="description" content="0–60 in under a second, up a ramp to the sky, then land it." />
      </Head>
      <div>
        <h1 className="text-4xl font-bold mb-4">Roadster Launch</h1>
        <p className="text-lg text-gray-600 mb-6">
          A Roadster hits 60 in under a second, flies off a ramp into the sky, and you have thrusters to bring it down. Land it without crashing.
        </p>
        <RoadsterGame />
      </div>
    </>
  )
}
