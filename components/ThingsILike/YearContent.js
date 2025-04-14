import { marked } from 'marked';

export default function YearContent({ items, year }) {
  // Use items directly since they already have numbers
  const markdownContent = items.join('\n');
  const htmlContent = marked(markdownContent);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Things I Like - {year}</h1>
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
} 