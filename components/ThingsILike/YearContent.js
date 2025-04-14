export default function YearContent({ items, year, lastUpdated }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Things I Like - {year}</h1>
      <p className="text-sm text-gray-500 mb-4">Last updated: {lastUpdated}</p>
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li key={index} className="text-base text-gray-700 leading-relaxed">{item}</li>
        ))}
      </ul>
    </div>
  );
} 