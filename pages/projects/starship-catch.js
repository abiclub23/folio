import Head from 'next/head'
import dynamic from 'next/dynamic'

const StarshipCatchGame = dynamic(() => import('../../components/StarshipCatchGame'), { ssr: false })

export default function StarshipCatchPage() {
  return (
    <>
      <Head>
        <title>Starship Catch | Abhi Tondepu</title>
        <meta name="description" content="Bring Starship back to the tower and catch it with the chopsticks, like Flight 15." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira:wght@400;500;600;700;800&family=Saira+Condensed:wght@600;700;800&display=swap" />
      </Head>
      <StarshipCatchGame />
    </>
  )
}

// Full-screen game: no site nav or footer
StarshipCatchPage.bareLayout = true
