import Head from 'next/head'
import dynamic from 'next/dynamic'

const SuperHeavyGame = dynamic(() => import('../../components/SuperHeavyGame'), { ssr: false })

export default function SuperHeavyPage() {
  return (
    <>
      <Head>
        <title>Super Heavy Catch | Abhi Tondepu</title>
        <meta name="description" content="Fly the Super Heavy booster back to the tower and catch it with the chopsticks." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira:wght@400;500;600;700;800&family=Saira+Condensed:wght@600;700;800&display=swap" />
      </Head>
      <SuperHeavyGame />
    </>
  )
}

// Full-screen game: no site nav or footer
SuperHeavyPage.bareLayout = true
