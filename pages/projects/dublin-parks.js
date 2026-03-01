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
        <p className="text-lg text-gray-600 mb-6">
          Our neighborhood has a dozen parks. The kids have names for all of them — none of them official.
          Here are six of the regulars. Hover to find out more.
        </p>
        <DublinParksMap />
      </div>
    </>
  )
}
