import fs from 'fs'
import path from 'path'
import Head from 'next/head'
import Today from '../components/Today'

export default function TodayPage({ config }) {
  return (
    <>
      <Head>
        <title>Today | Abhi Tondepu</title>
        <meta name="description" content="A daily experiment" />
      </Head>
      <Today config={config} />
    </>
  )
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'data', 'today.json')
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const config = JSON.parse(fileContents)

  return {
    props: { config }
  }
}
