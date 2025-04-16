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
    .map(file => {
      const year = file.replace('.md', '');
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      const lastModified = new Date(stats.mtime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return {
        year,
        lastModified
      };
    })
    .sort((a, b) => b.year - a.year); // Sort years in descending order

  return {
    props: {
      years
    },
  };
} 