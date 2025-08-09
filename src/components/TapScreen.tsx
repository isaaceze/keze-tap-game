'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/lib/gameContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Coins, Zap, TrendingUp, Gamepad2 } from 'lucide-react';

interface FloatingCoin {
  id: string;
  x: number;
  y: number;
}

export function TapScreen() {
  const { state, dispatch } = useGame();
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const [isPressed, setIsPressed] = useState(false);

  // REMOVED: Old navigation event listeners - using direct tab clicking now

  const processMultipleTaps = async (tapCount: number, positions: Array<{x: number, y: number}>) => {
    if (state.energy < tapCount) return;

    // Trigger haptic feedback
    if ((window as any).triggerHaptic) {
      (window as any).triggerHaptic(tapCount > 1 ? 'medium' : 'light');
    }

    // Try to sync with backend
    if (state.userId) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://keze.bissols.com/api'}/tap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId: state.userId, taps: tapCount })
        });

        if (response.ok) {
          const result = await response.json();
          dispatch({ type: 'LOAD_GAME', state: result });
        } else {
          // Fallback to local state
          for (let i = 0; i < tapCount; i++) {
            dispatch({ type: 'TAP' });
          }
        }
      } catch (error) {
        // Backend unavailable, use local state
        for (let i = 0; i < tapCount; i++) {
          dispatch({ type: 'TAP' });
        }
      }
    } else {
      // No user ID, use local state
      for (let i = 0; i < tapCount; i++) {
        dispatch({ type: 'TAP' });
      }
    }

    // Add floating coin animations for each tap
    positions.forEach((pos, index) => {
      const newCoin: FloatingCoin = {
        id: `${Math.random().toString(36)}-${index}`,
        x: pos.x,
        y: pos.y
      };

      setTimeout(() => {
        setFloatingCoins(prev => [...prev, newCoin]);
      }, index * 50); // Stagger animations slightly

      // Remove floating coin after animation
      setTimeout(() => {
        setFloatingCoins(prev => prev.filter(coin => coin.id !== newCoin.id));
      }, 1000 + (index * 50));
    });
  };

  const handleTap = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (state.energy <= 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    await processMultipleTaps(1, [{x, y}]);
  };

  const handleTouchStart = async (event: React.TouchEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (state.energy <= 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const touches = Array.from(event.touches);
    const tapCount = Math.min(touches.length, state.energy, 10); // Max 10 taps at once

    const positions = touches.slice(0, tapCount).map(touch => ({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }));

    await processMultipleTaps(tapCount, positions);
  };

  const energyPercentage = (state.energy / state.maxEnergy) * 100;
  const experiencePercentage = (state.experience / state.experienceToNext) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6 relative">
      {/* Experience Bar */}
      <div className="w-full mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-purple-300">Level {state.level}</span>
          <span className="text-sm text-purple-300">
            {state.experience}/{state.experienceToNext} XP
          </span>
        </div>
        <Progress value={experiencePercentage} className="h-2 bg-purple-900" />
      </div>

      {/* Coins per tap */}
      <div className="flex items-center gap-2 mb-8 bg-black/20 px-4 py-2 rounded-full">
        <TrendingUp className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-semibold">+{state.coinsPerTap} KEZE per tap</span>
      </div>

      {/* Main Tap Area with Side Buttons - FIXED: Mobile responsive with working navigation */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 w-full px-2">
        {/* Games Button - LEFT SIDE - FIXED: Working click handler */}
        <div className="flex-shrink-0">
          <Button
            onClick={() => {
              try {
                console.log('Games button clicked');
                // Multiple fallback strategies for navigation
                // FIXED: Use only valid CSS selectors
                const gamesTab = document.querySelector('[role="tab"][aria-controls*="games"]') as HTMLElement ||
                                document.querySelector('[value="games"]') as HTMLElement;

                if (gamesTab) {
                  console.log('Found games tab, clicking...');
                  gamesTab.click();
                } else {
                  console.log('Tab not found, using event fallback');
                  // Dispatch event that TapGame component can listen to
                  window.dispatchEvent(new CustomEvent('navigate-to-games'));
                }
              } catch (error) {
                console.error('Error navigating to games:', error);
              }
            }}
            className="flex flex-col items-center gap-1 p-2 bg-purple-600/20 border border-purple-400/30 hover:bg-purple-600/30 transition-colors w-14 h-14 sm:w-16 sm:h-16 text-center"
          >
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <span className="text-xs text-purple-300 leading-none">Games</span>
          </Button>
        </div>

        {/* Main Tap Button - FIXED: Perfect responsive size */}
        <div className="relative flex-shrink-0 mx-2">
          <Button
            onClick={handleTap}
            onTouchStart={handleTouchStart}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onTouchEnd={() => setIsPressed(false)}
            disabled={state.energy <= 0}
            className={`
              w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-yellow-400 to-orange-500
              border-4 sm:border-6 border-yellow-300 shadow-2xl transition-all duration-100
              hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100
              touch-manipulation select-none
              ${isPressed ? 'scale-95' : ''}
            `}
          >
            <div className="flex flex-col items-center">
              <Coins className="w-8 h-8 sm:w-10 sm:h-10 text-white mb-1 sm:mb-2" />
              <span className="text-white font-bold text-sm sm:text-base">TAP!</span>
            </div>
          </Button>

          {/* Floating coins */}
          {floatingCoins.map(coin => (
            <div
              key={coin.id}
              className="absolute pointer-events-none animate-bounce text-yellow-400 font-bold text-base sm:text-lg z-10"
              style={{
                left: coin.x,
                top: coin.y,
                animation: 'floatUp 1s ease-out forwards'
              }}
            >
              +{state.coinsPerTap} KEZE
            </div>
          ))}
        </div>

        {/* Boosts Button - RIGHT SIDE - FIXED: Working click handler */}
        <div className="flex-shrink-0">
          <Button
            onClick={() => {
              try {
                console.log('Boosts button clicked');
                // Multiple fallback strategies for navigation
                // FIXED: Use only valid CSS selectors
                const boostsTab = document.querySelector('[role="tab"][aria-controls*="boosts"]') as HTMLElement ||
                                document.querySelector('[value="boosts"]') as HTMLElement;

                if (boostsTab) {
                  console.log('Found boosts tab, clicking...');
                  boostsTab.click();
                } else {
                  console.log('Tab not found, using event fallback');
                  // Dispatch event that TapGame component can listen to
                  window.dispatchEvent(new CustomEvent('navigate-to-boosts'));
                }
              } catch (error) {
                console.error('Error navigating to boosts:', error);
              }
            }}
            className="flex flex-col items-center gap-1 p-2 bg-green-600/20 border border-green-400/30 hover:bg-green-600/30 transition-colors relative w-14 h-14 sm:w-16 sm:h-16 text-center"
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            <span className="text-xs text-green-300 leading-none">Boosts</span>
            {Object.values(state.boosts).some((boost, index) => {
              const expiries = [state.boosts.tapPowerBoostExpiry, state.boosts.energyBoostExpiry, state.boosts.xpBoostExpiry, state.boosts.levelBoostExpiry];
              return Date.now() < expiries[index] && boost > 1;
            }) && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </Button>
        </div>
      </div>

      {/* Energy Bar */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Energy</span>
          </div>
          <span className="text-sm text-blue-300">
            {state.energy}/{state.maxEnergy}
          </span>
        </div>
        <Progress
          value={energyPercentage}
          className={`h-3 ${state.energy <= 0 ? 'bg-red-900' : 'bg-blue-900'}`}
        />
        {state.energy <= 0 && (
          <p className="text-center text-red-400 text-sm mt-2">
            Energy depleted! Wait for it to regenerate.
          </p>
        )}
        {state.energy > 0 && state.energy < state.maxEnergy * 0.2 && (
          <p className="text-center text-orange-400 text-sm mt-2">
            Low energy! Consider taking a break.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-sm">
        <div className="bg-black/20 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-white">{state.tapsCount.toLocaleString()}</div>
          <div className="text-sm text-gray-300">Total Taps</div>
        </div>
        <div className="bg-black/20 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-400">{state.totalEarnings.toLocaleString()}</div>
          <div className="text-sm text-gray-300">Total Earned</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px);
          }
        }
      `}</style>
    </div>
  );
}
