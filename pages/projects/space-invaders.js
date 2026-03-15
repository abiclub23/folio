import Head from 'next/head';
import SpaceInvaders from '../../components/SpaceInvaders';

export default function SpaceInvadersPage() {
  return (
    <>
      <Head>
        <title>Claude Invaders | Abhi Tondepu</title>
        <meta name="description" content="Space Invaders, but the aliens are Claude Code bots. They think. They dodge. They drop code." />
      </Head>
      <div>
        <h1 className="text-4xl font-bold mb-2">Claude Invaders</h1>
        <p className="text-gray-500 mb-6">
          Space Invaders, but the aliens are Claude Code bots. They think, they dodge, and they rain code on you. Every 3rd level a boss shows up with a Context Window health bar.
        </p>
        <SpaceInvaders />
      </div>
    </>
  );
}
