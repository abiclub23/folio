export default function Books() {
  const books = [
    {
      title: "Atomic Habits",
      author: "James Clear",
      cover: "/images/book-covers/atomic-habits.jpg",
      link: "https://amzn.to/4jgEvaF",
      review: "A practical guide to building good habits and breaking bad ones. Clear's approach to habit formation is both scientifically grounded and immediately applicable to daily life."
    }
  ];

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">Books</h1>
      
      <div className="space-y-8">
        <section>
          <p className="text-lg leading-relaxed text-gray-700 mb-2">
            A collection of books that have made a lasting impression on me. While this isn’t a formal recommendation list, I hope you find something here that resonates with you as well.
          </p>
          <p className="text-sm text-gray-500 mb-8">This page contains affiliate links.</p>
        </section>

        <section className="mt-12 pt-6 border-t border-gray-950">
          <div className="space-y-8">
            {books.map((book) => (
              <div key={book.title} className="flex gap-8 items-start">
                <div className="w-48 flex-shrink-0">
                  <img 
                    src={book.cover} 
                    alt={`${book.title} Cover`} 
                    className="w-full h-auto shadow-lg"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    <a 
                      href={book.link} 
                      className="text-gray-900 hover:italic"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {book.title} by {book.author}
                    </a>
                  </h2>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {book.review}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 