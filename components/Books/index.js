export default function Books() {
  const books = [
    {
      title: "Atomic Habits",
      author: "James Clear",
      theme: "Self-improvement, Productivity, Mindset",
      cover: "/images/book-covers/atomic-habits.jpg",
      link: "https://amzn.to/4jgEvaF",
      review: "This book kickstarted my journey back into reading—even if it took me over a year to finish, mostly because I bought it, set it aside, and forgot about it for a while. Once I finally got into it, it helped me build new habits and let go of old ones, even though I still struggle at times. It provided a clear framework for moving in the right direction."
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
          <p className="text-sm text-gray-500 mb-8">Last updated: April 24, 2024</p>
        </section>

        <section className="mt-12 pt-6 border-t border-gray-950">
          <div className="space-y-8">
            {books.map((book) => (
              <div key={book.title} className="flex gap-8 items-start">
                <div className="w-20 sm:w-40 flex-shrink-0">
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
                  <p className="text-gray-700 text-md leading-relaxed mb-4">
                    Themes: {book.theme}
                  </p>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {book.review}
                  </p>
                  
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 pt-6">
            <p className="text-sm text-gray-500 mb-8">*This page contains affiliate links.</p>
        </section>
      </div>
    </div>
  );
} 