import { marked } from 'marked';
import matter from 'gray-matter';

export default function Article({ content, title }) {
  // Parse frontmatter and content
  const { content: markdownContent } = matter(content);
  const htmlContent = marked(markdownContent);

  return (
    <article>
      <div
        className="prose prose-lg prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-4 \
                   prose-p:text-gray-800 prose-p:mb-4 \
                   prose-ul:space-y-2 prose-li:text-gray-800 \
                   marker:text-black max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </article>
  );
} 