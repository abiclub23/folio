import '../styles/globals.css'
import Head from 'next/head'
import Layout from '../components/Layout'
import { Analytics } from '@vercel/analytics/react'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }) {
  const router = useRouter()

  // Skip layout for /today page (it renders its own navigation)
  const skipLayout = router.pathname === '/today'

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Abhi Tondepu - Personal Website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {skipLayout ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
      <Analytics />
    </>
  )
}

export default MyApp 