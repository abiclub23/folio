import Head from 'next/head';
import Thoughts from '../components/Thoughts';
import { thoughts } from '../data/thoughts';

export default function ThoughtsPage({ thoughts: sortedThoughts }) {
  return (
    <>
      <Head>
        <title>Thoughts | Abhi Tondepu</title>
        <meta name="description" content="Fleeting thoughts and musings" />
      </Head>
      <Thoughts thoughts={sortedThoughts} />
    </>
  );
}

/**
 * Sort thoughts by timestamp (newest first)
 * Handles invalid dates gracefully by placing them at the end
 */
function sortThoughtsByDate(thoughts) {
  return [...thoughts].sort((a, b) => {
    // Validate that both objects have timestamp property
    if (!a.timestamp || !b.timestamp) {
      if (!a.timestamp && !b.timestamp) return 0;
      return !a.timestamp ? 1 : -1;
    }

    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    
    // Handle invalid dates by putting them at the end
    const isValidA = !isNaN(dateA.getTime());
    const isValidB = !isNaN(dateB.getTime());
    
    if (!isValidA && !isValidB) return 0;
    if (!isValidA) return 1;
    if (!isValidB) return -1;
    
    return dateB - dateA; // Newest first
  });
}

export async function getStaticProps() {
  try {
    const sortedThoughts = sortThoughtsByDate(thoughts);
    
    return {
      props: {
        thoughts: sortedThoughts
      }
    };
  } catch (error) {
    // Graceful fallback - return empty array if sorting fails
    console.error('Error sorting thoughts:', error);
    return {
      props: {
        thoughts: []
      }
    };
  }
}

