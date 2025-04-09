import Head from 'next/head';

export default function ThingsILike({ sections }) {
  return (
    <>
      <Head>
        <title>Things I Like | Abhi Tondepu</title>
      </Head>
      
      <div className="">
        {/* Hero Section */}
        <div className="mb-8 border-b border-gray-950 pb-4">
          <h1 className="text-4xl font-bold mb-4">Things I Like</h1>
          <p className="text-lg text-gray-600">
            Inspired by a Twitter thread, this is my collection of small, everyday moments that brought me joy. 
            A reminder to appreciate the beautiful mundane in daily life.
          </p>
        </div>

        {/* Content List */}
        <div className="space-y-12">
          {sections.map(({ year, items }) => (
            <div key={year}>
              <h2 className="text-2xl font-medium text-gray-800 mb-6 inline-block border-b-2 border-gray-950">{year}</h2>
              <ul className="space-y-4">
                {items.map((item, index) => (
                  <li
                    key={index}
                    className="text-base text-gray-700 leading-relaxed"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
} 