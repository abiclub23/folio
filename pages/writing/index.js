import path from 'path';
import Link from 'next/link';
import { getMarkdownFilesMetadata } from '../../lib/markdown';

export default function WritingIndex({ articles }) {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Writing</h1>
      <p className="text-lg text-gray-600 mb-8">
        A collection of thoughts, experiences, and moments worth sharing.
      </p>
      <div className="space-y-4 border-t border-gray-950 pt-6">
        {articles.map(({ slug, title, lastModified }) => (
          <Link 
            key={slug} 
            href={`/writing/${slug}`}
            className="block hover:italic"
          >
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-sm text-gray-500">Last updated: {lastModified}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const dirPath = path.join(process.cwd(), 'content/writing');
  
  const articles = getMarkdownFilesMetadata(dirPath, {
    transformResult: ({ slug, lastModified }) => ({
      slug,
      title: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      lastModified
    }),
    sortFn: (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
  });

  return {
    props: {
      articles
    },
  };
} 