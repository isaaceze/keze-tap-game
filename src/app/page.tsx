'use client';

import { GameProvider } from '@/lib/gameContext';
import { TapGame } from '@/components/TapGame';

export default function Home() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-indigo-900">
        <TapGame />
      </div>
    </GameProvider>
  );
}
