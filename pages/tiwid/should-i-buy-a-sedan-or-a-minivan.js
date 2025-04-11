import Head from 'next/head';

export default function SedanVsMinivan() {
  return (
    <>
      <Head>
        <title>Should I buy a sedan or a minivan? | This Is What I Did</title>
      </Head>
      <article className="max-w-2xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-2">Should I buy a sedan or a minivan?</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What I Did</h2>
          <p className="text-gray-800">I bought a used Honda Odyssey.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Why I Did It</h2>
          <ul className="space-y-4 text-gray-800">
            <li>• Needed the space when family/friends visit and for short road trips.</li>
            <li>• I was sure I wanted a used car as I didn't want to take on additional loan for secondary car.</li>
            <li>• Another reason for getting a used car was my wife is an amateur driver and was felt comfortable dinging an older car :)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Outcome/Reflection</h2>
          <ul className="space-y-4 text-gray-800">
            <li>• The Odyssey worked great for family trips. The family is relatively less tired.</li>
            <li>• On weekdays we often have just 1 person in the car, not efficient but that's acceptable for us.</li>
            <li>• We still use my CR-V as the primary family car for errands etc.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Final Thoughts</h2>
          <p className="text-gray-800">
            Choosing the right vehicle was essential for our family's needs. The decision to go with the Odyssey has worked out well for us.
          </p>
        </section>
      </article>
    </>
  );
} 