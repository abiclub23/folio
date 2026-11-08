import Head from 'next/head'
import dynamic from 'next/dynamic'

const RetroSuperHeavyGame = dynamic(
  () => import('../../components/SuperHeavyGame').then((m) => m.RetroSuperHeavyGame),
  { ssr: false },
)

export default function SuperHeavyRetroPage() {
  return (
    <>
      <Head>
        <title>Super Heavy Catch (Arcade) | Abhi Tondepu</title>
        <meta name="description" content="Catch the Super Heavy booster in the chopsticks, 1979 vector arcade style." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" />
      </Head>
      <RetroSuperHeavyGame />
    </>
  )
}

// Full-screen game: no site nav or footer
SuperHeavyRetroPage.bareLayout = true
