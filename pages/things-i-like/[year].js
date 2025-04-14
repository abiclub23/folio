import fs from 'fs';
import path from 'path';
import YearContent from '../../components/ThingsILike/YearContent';

export const metadata = {
  title: 'Things I Like: {year} | Abhi Tondepu',
};

export default function YearPage({ items, year, lastUpdated }) {
  return <YearContent items={items} year={year} lastUpdated={lastUpdated} />;
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