import Head from 'next/head'
import dynamic from 'next/dynamic'

const RoadsterGame = dynamic(() => import('../../components/RoadsterGame'), { ssr: false })

export default function RoadsterPage() {
  return (
    <>
      <Head>
        <title>Roadster Launch | Abhi Tondepu</title>
        <meta name="description" content="0–60 in under a second, up a ramp into the sky, then land it on thrusters." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700&display=swap" />
      </Head>
      <RoadsterGame />
    </>
  )
}

// Full-screen game: no site nav or footer
RoadsterPage.bareLayout = true
