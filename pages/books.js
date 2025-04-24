import Head from 'next/head';
import Books from '../components/Books';

export default function BooksPage() {
  return (
    <>
      <Head>
        <title>Books | Abhi Tondepu</title>
        <meta name="description" content="A collection of books that have made a lasting impression" />
      </Head>
      <Books />
    </>
  );
} 