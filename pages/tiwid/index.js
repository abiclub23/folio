import Head from 'next/head';
import Link from 'next/link';

export default function TIWIDLanding() {
  const articles = [
    {
      slug: 'should-i-buy-a-sedan-or-a-minivan',
      title: 'Should I buy a sedan or a minivan?'
    }
  ];

  return (
    <>
      <Head>
        <title>This Is What I Did | Abhi Tondepu</title>
      </Head>
      <div className="">
        <h1 className="text-4xl font-bold mb-6">This Is What I Did (TIWID)</h1>
        <p className="text-lg text-gray-600 mb-8">
            Life is full of decisions that shape our path. While we have countless reviews for everyday purchases, 
            we rarely find insights into life's broader choices. Here, I share my decisions and their context, 
            from career moves to lifestyle changes - hoping to make your own decision-making journey a bit easier.
        </p>
        <div className="space-y-4 border-t border-gray-950 pt-6">
          {articles.map(article => (
            <Link 
              key={article.slug}
              href={`/tiwid/${article.slug}`}
              className="block hover:italic"
            >
              <h2 className="text-xl font-semibold">{article.title}</h2>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
} 