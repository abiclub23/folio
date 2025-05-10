import Head from 'next/head'
import EasterEgg from '../../components/Projects/EasterEgg'

export default function EasterEggPage() {
  return (
    <>
      <Head>
        <title>Easter Egg | Abhi Tondepu</title>
        <meta name="description" content="A hidden easter egg on my website" />
      </Head>
      <EasterEgg />
    </>
  )
} 