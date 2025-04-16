import path from 'path';
import Link from 'next/link';
import { getMarkdownFilesMetadata } from '../../lib/markdown';

export const metadata = {
  title: 'This Is What I Did | Abhi Tondepu',
};

export default function TIWIDIndex({ articles }) {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">This Is What I Did</h1>
      <p className="text-lg text-gray-600 mb-8">
        Life is full of decisions that shape our path. While we have countless reviews for everyday purchases, we rarely find insights into life's broader choices. 
        Here, I share my decisions and their context - hoping to make your own decision-making journey a bit easier.
      </p>
      <div className="space-y-4 border-t border-gray-950 pt-6">
        {articles.map(({ slug, title, lastModified }) => (
          <Link 
            key={slug} 
            href={`/tiwid/${slug}`}
            className="block hover:italic"
          >
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-sm text-gray-500">{lastModified}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const dirPath = path.join(process.cwd(), 'content/tiwid');
  
  const articles = getMarkdownFilesMetadata(dirPath, {
    sortFn: (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
  });

  return {
    props: {
      articles,
    },
  };
} 