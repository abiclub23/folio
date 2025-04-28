import { books } from '../../data/books';

export default function Books() {
  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">Books</h1>
      <div className="space-y-8">
        <section>
          <p className="text-lg leading-relaxed text-gray-700 mb-4">
            A collection of books that I enjoyed, including stories I’ve read to my kids, listed in no particular order. These aren't formal recommendations, but I hope you find something here that sparks your interest.
          </p>
          <p className="text-lg leading-relaxed text-gray-700 mb-4">
            Inspired by Naval Ravikant, I read for ideas and themes, not just titles or authors. I don't always finish every book; if it's not adding value, I'm okay with putting it down. My goal isn't to read a certain number of books, but to learn and grow.
          </p>
          <p className="text-lg leading-relaxed text-gray-700 mb-8">
            I stick to physical books only (no e-readers or audiobooks), so I can get off screens and set a good example for my kids. After all, kids tend to imitate what they see, not just what they're told.
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
                  <h2 className="text-xl font-semibold">
                    <a 
                      href={book.link} 
                      className="text-gray-900 hover:italic"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {book.title} by {book.author}
                    </a>
                  </h2>
                  <p className="text-sm text-emerald-800 mb-2">
                    <span className="font-medium">Themes:</span> {book.theme}
                  </p>
                  <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
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