import '../styles/globals.css'
import Head from 'next/head'
import Layout from '../components/Layout'
import { Analytics } from '@vercel/analytics/react'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Abhi Tondepu - Personal Website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Full-screen pages (like Dublin Parks and the Roadster game) skip the site nav and footer */}
      {Component.bareLayout ? (
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