import { marked } from 'marked';

export default function Article({ content, title }) {
  // Skip the first line (title) and parse the rest as markdown
  const markdownContent = content.split('\n').slice(1).join('\n');
  const htmlContent = marked(markdownContent);

  return (
    <article>
      <h1 className="text-4xl font-bold mb-6">{title}</h1>
      <div 
        className="prose prose-lg prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-4 
                   prose-p:text-gray-800 prose-p:mb-4
                   prose-ul:space-y-2 prose-li:text-gray-800
                   max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </article>
  );
} 