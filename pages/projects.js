import Head from 'next/head'
import Projects from '../components/Projects'

export default function ProjectsPage() {
  return (
    <>
      <Head>
        <title>Projects | Abhi Tondepu</title>
        <meta name="description" content="Side projects and experiments" />
      </Head>
      <Projects />
    </>
  )
} 