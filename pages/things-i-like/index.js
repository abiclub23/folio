import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Link from 'next/link';

export default function ThingsILikeLanding({ years }) {
  return (
    <>
      <Head>
        <title>Things I Like | Abhi Tondepu</title>
      </Head>
      <div>
        <h1 className="text-4xl font-bold mb-6">Things I Like</h1>
        <p className="text-lg text-gray-600 mb-8">
          Inspired by a Twitter thread and The Positive Tetris Effect, this is my collection of small, everyday moments that brought me joy. 
          A reminder to appreciate the beautiful mundane in daily life.
        </p>
        <div className="space-y-4 border-t border-gray-950 pt-6">
          {years.map(year => (
            <Link 
              key={year} 
              href={`/things-i-like/${year}`}
              className="block hover:italic"
            >
              <h2 className="text-xl font-semibold">{year}</h2>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'content/things-i-like/index.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  
  // Extract unique years from the content
  const years = fileContents
    .split('\n# ')
    .filter(Boolean)
    .map(section => section.split('\n')[0].trim().replace('#', '').trim());

  return {
    props: {
      years
    },
  };
} 