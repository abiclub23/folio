import fs from 'fs';
import path from 'path';
import ThingsILike from '../../components/ThingsILike';

export default function ThingsILikePage({ years }) {
  return <ThingsILike years={years} />;
}

export async function getStaticProps() {
  const dirPath = path.join(process.cwd(), 'content/things-i-like');
  const files = fs.readdirSync(dirPath);
  
  const years = files
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace('.md', ''))
    .sort((a, b) => b - a); // Sort years in descending order

  return {
    props: {
      years
    },
  };
} 