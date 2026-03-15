import Head from 'next/head'
import dynamic from 'next/dynamic'

const DublinParksMap = dynamic(() => import('../../components/DublinParksMap'), { ssr: false })

export default function DublinParksPage() {
  return (
    <>
      <Head>
        <title>Dublin Parks | Abhi Tondepu</title>
        <meta name="description" content="Our neighborhood parks, named by the kids." />
      </Head>
      <div>
        <h1 className="text-4xl font-bold mb-4">Dublin Parks</h1>
        <p className="text-lg text-gray-600 mb-2">
          Outside of my home town, Dublin is the first place we&apos;ve lived that actually felt like home. We&apos;ve moved around. Different cities, different coasts. Nothing clicked the way this did.
        </p>
        <p className="text-lg text-gray-600 mb-2">
          The parks are a big part of it. There are so many. Summer evenings especially feel endless: families out until dark, kids who refuse to leave. It&apos;s the kind of thing that makes you feel lucky.
        </p>
        <p className="text-lg text-gray-600 mb-6">
          Our kids have names for all their favorites. None of them official. Tap a park to learn more.
        </p>
        <DublinParksMap />
      </div>
    </>
  )
}
