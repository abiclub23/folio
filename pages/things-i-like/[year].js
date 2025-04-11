import fs from 'fs';
import path from 'path';
import Head from 'next/head';

export default function YearPage({ items, year, lastUpdated }) {
  return (
    <>
      <Head>
        <title>Things I Like: {year} | Abhi Tondepu</title>
      </Head>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Things I Like - {year}</h1>
        <p className="text-sm text-gray-500 mb-4">Last updated: {lastUpdated}</p>
        <ul className="space-y-4">
          {items.map((item, index) => (
            <li key={index} className="text-base text-gray-700 leading-relaxed">{item}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const filePath = path.join(process.cwd(), 'content/things-i-like/index.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  
  const years = fileContents
    .split('\n# ')
    .filter(Boolean)
    .map(section => section.split('\n')[0].trim().replace('#', '').trim());

  return {
    paths: years.map(year => ({
      params: { year },
    })),
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'content/things-i-like/index.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  
  // Get file stats for last modified date
  const stats = fs.statSync(filePath);
  const lastUpdated = stats.mtime.toLocaleDateString();
  
  const sections = fileContents
    .split('\n# ')
    .filter(Boolean)
    .map(section => {
      const [year, ...lines] = section.split('\n');
      return {
        year: year.trim().replace('#', '').trim(),
        items: lines
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'))
      };
    });

  const yearContent = sections.find(section => section.year === params.year);

  return {
    props: {
      year: params.year,
      items: yearContent.items,
      lastUpdated
    },
  };
} 