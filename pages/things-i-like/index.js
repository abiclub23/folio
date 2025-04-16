import path from 'path';
import ThingsILike from '../../components/ThingsILike';
import { getMarkdownFilesMetadata } from '../../lib/markdown';

export default function ThingsILikePage({ years }) {
  return <ThingsILike years={years} />;
}

export async function getStaticProps() {
  const dirPath = path.join(process.cwd(), 'content/things-i-like');
  
  const years = getMarkdownFilesMetadata(dirPath, {
    transformResult: ({ slug, lastModified }) => ({
      year: slug,
      lastModified
    }),
    sortFn: (a, b) => b.year - a.year
  });

  return {
    props: {
      years
    },
  };
} 