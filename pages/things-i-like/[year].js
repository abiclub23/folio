import fs from 'fs';
import path from 'path';
import YearContent from '../../components/ThingsILike/YearContent';

export const metadata = {
  title: 'Things I Like: {year} | Abhi Tondepu',
};

export default function YearPage({ items, year }) {
  return <YearContent items={items} year={year} />;
}

export async function getStaticPaths() {
  const dirPath = path.join(process.cwd(), 'content/things-i-like');
  const files = fs.readdirSync(dirPath);
  
  const years = files
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace('.md', ''));

  return {
    paths: years.map(year => ({
      params: { year },
    })),
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  const { year } = params;
  const filePath = path.join(process.cwd(), 'content/things-i-like', `${year}.md`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const items = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return {
    props: {
      year,
      items,
    },
  };
} 