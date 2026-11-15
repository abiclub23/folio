import Head from 'next/head'
import dynamic from 'next/dynamic'

const StarshipCatch3DGame = dynamic(() => import('../../components/StarshipCatch3DGame'), { ssr: false })

export default function StarshipCatch3DPage() {
  return (
    <>
      <Head>
        <title>Starship Catch 3D | Abhi Tondepu</title>
        <meta name="description" content="Catch Starship with the tower arms, in 3D." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira:wght@400;500;600;700;800&family=Saira+Condensed:wght@600;700;800&display=swap" />
      </Head>
      <StarshipCatch3DGame />
    </>
  )
}

// Full-screen game: no site nav or footer
StarshipCatch3DPage.bareLayout = true
