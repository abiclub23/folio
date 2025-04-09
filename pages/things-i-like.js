import fs from 'fs';
import path from 'path';
import ThingsILike from '../components/ThingsILike';

export default function ThingsILikePage({ sections }) {
  return <ThingsILike sections={sections} />;
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'content/things-i-like/index.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  
  // Split content into sections by year headings
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

  return {
    props: {
      sections,
    },
  };
} 