import '../styles/globals.css'
import Head from 'next/head'
import Layout from '../components/Layout'
import Loader from '../components/Loader'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Hide loader after page is fully loaded
    window.addEventListener('load', () => {
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)
    })

    // Fallback if 'load' event doesn't trigger
    setTimeout(() => {
      setIsLoading(false)
    }, 2500)

    return () => {
      window.removeEventListener('load', () => {
        setIsLoading(false)
      })
    }
  }, [])

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="My personal website and blog" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Loader />
      <Layout>
        <div className="page-transition">
          <Component {...pageProps} />
        </div>
      </Layout>
    </>
  )
}

export default MyApp 