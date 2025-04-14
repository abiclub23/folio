import fs from 'fs';
import path from 'path';
import ThingsILike from '../../components/ThingsILike';

export default function ThingsILikePage({ years }) {
  return <ThingsILike years={years} />;
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