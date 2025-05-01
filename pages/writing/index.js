import path from 'path';
import Link from 'next/link';
import { getMarkdownFilesMetadata } from '../../components/Writing/markdown';
import matter from 'gray-matter';

const CATEGORY_DESCRIPTIONS = {
  'Things I Like': 'Inspired by The Positive Tetris Effect and a twitter thread, this is my collection of small, everyday moments that brought me joy.',
  'My Decisions': 'Life is full of decisions that shape our path. While we have countless reviews for everyday purchases, we rarely find insights into life\'s broader choices. Here, I share my decisions and their context - hoping to make your own decision-making journey a bit easier.'
};

export default function WritingIndex({ articles }) {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Writing</h1>
      <p className="text-lg text-gray-600 mb-8">
        A collection of thoughts, experiences, and observations. Below are a few themed categories, though most posts are general musings.
      </p>

      {/* Category Descriptions */}
      <div className="space-y-6 mb-8">
        {Object.entries(CATEGORY_DESCRIPTIONS).map(([category, description]) => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-2">{category}</h2>
            <p className="text-gray-600 text-lg">{description}</p>
          </div>
        ))}
      </div>
      
      <div className="space-y-4 border-t border-gray-950 pt-6">
        {articles.map(({ slug, metadata }) => (
          <div key={slug} className="block">
            <Link 
              href={`/writing/${slug}`}
              className="hover:text-custom-green hover:italic"
            >
              <h2 className="text-xl font-semibold">
                {metadata.category ? `${metadata.category} – ` : ''}{metadata.title}
              </h2>
            </Link>
            <p className="text-sm text-gray-500">
              Published: {new Date(metadata.date).toLocaleDateString()}
              {metadata.decisionDate && (
                <span className="ml-2">
                  (Decision: {new Date(metadata.decisionDate).toLocaleDateString()})
                </span>
              )}
              {metadata.lastModified && metadata.lastModified !== metadata.date && (
                <span className="ml-2">
                  (Updated: {new Date(metadata.lastModified).toLocaleDateString()})
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const dirPath = path.join(process.cwd(), 'content/writing');
  
  const articles = getMarkdownFilesMetadata(dirPath, {
    transformResult: ({ slug, content }) => {
      const { data: metadata } = matter(content);
      return {
        slug,
        metadata: {
          ...metadata,
          date: metadata.date ? new Date(metadata.date).toISOString() : null,
          lastModified: metadata.lastModified ? new Date(metadata.lastModified).toISOString() : null,
          decisionDate: metadata.decisionDate ? new Date(metadata.decisionDate).toISOString() : null
        }
      };
    },
    sortFn: (a, b) => {
      if (!a.metadata.date || !b.metadata.date) return 0;
      return new Date(b.metadata.date) - new Date(a.metadata.date);
    }
  });

  return {
    props: {
      articles
    },
  };
} 