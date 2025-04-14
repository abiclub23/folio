import { marked } from 'marked';

export default function YearContent({ items, year, lastUpdated }) {
  // Convert items to markdown and parse
  const markdownContent = items.map(item => `- ${item}`).join('\n');
  const htmlContent = marked(markdownContent);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Things I Like - {year}</h1>
      <p className="text-sm text-gray-500 mb-4">Last updated: {lastUpdated}</p>
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
} 