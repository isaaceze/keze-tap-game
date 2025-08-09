'use client';

import { useState } from 'react';
import { useGame } from '@/lib/gameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Coins,
  RotateCcw,
  Package,
  DollarSign,
  TrendingUp,
  Sparkles,
  Gift,
  Zap
} from 'lucide-react';

export function GamesScreen() {
  const { state, dispatch } = useGame();
  const [isSpinning, setIsSpinning] = useState(false);
  const [isHunting, setIsHunting] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastSpinResult, setLastSpinResult] = useState<any>(null);
  const [lastHuntResult, setLastHuntResult] = useState<any>(null);
  const [lastFlipResult, setLastFlipResult] = useState<any>(null);

  // Spinner Game
  const spinWheel = async (stake: number) => {
    if (state.coins < stake || isSpinning) return;

    setIsSpinning(true);
    setLastSpinResult(null);

    // Trigger haptic feedback
    if ((window as any).triggerHaptic) {
      (window as any).triggerHaptic('medium');
    }

    // Try backend first, fallback to local
    if (state.userId) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://keze.bissols.com/api'}/game/spin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId: state.userId, stake })
        });

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: 'LOAD_GAME', state: { coins: data.coins, tonCoins: data.tonCoins } });
          setLastSpinResult(data.result);
          setIsSpinning(false);
          return;
        }
      } catch (error) {
        console.log('Backend unavailable, using local game logic');
      }
    }

    // Local game logic fallback
    setTimeout(() => {
      const random = Math.random();
      let result = { coins: 0, tonCoins: 0 };

      if (random < 0.02) { // 2% chance for TON coins
        result = { coins: stake * 10, tonCoins: Math.floor(stake / 1000) };
      } else if (random < 0.1) { // 8% chance for big win
        result = { coins: stake * 5, tonCoins: 0 };
      } else if (random < 0.3) { // 20% chance for good win
        result = { coins: stake * 2, tonCoins: 0 };
      } else if (random < 0.5) { // 20% chance for small win
        result = { coins: Math.floor(stake * 1.5), tonCoins: 0 };
      } else if (random < 0.7) { // 20% chance to break even
        result = { coins: stake, tonCoins: 0 };
      } // 30% chance to lose (coins: 0)

      dispatch({ type: 'SPIN_WHEEL', stake, result });
      setLastSpinResult(result);
      setIsSpinning(false);
    }, 3000);
  };

  // Treasure Hunt Game
  const huntTreasure = async (stake: number) => {
    if (state.coins < stake || isHunting) return;

    setIsHunting(true);
    setLastHuntResult(null);

    // Simulate hunting delay
    setTimeout(() => {
      const random = Math.random();
      let result = { coins: 0, found: false };

      if (random < 0.4) { // 40% chance to find treasure
        const multiplier = Math.random() < 0.1 ? 10 : Math.random() < 0.3 ? 5 : 3;
        result = { coins: stake * multiplier, found: true };
      }

      dispatch({ type: 'TREASURE_HUNT', stake, result });
      setLastHuntResult(result);
      setIsHunting(false);
    }, 2000);
  };

  // Coin Flip Game
  const flipCoin = async (stake: number, guess: 'heads' | 'tails') => {
    if (state.coins < stake || isFlipping) return;

    setIsFlipping(true);
    setLastFlipResult(null);

    // Simulate coin flip delay
    setTimeout(() => {
      const flip = Math.random() < 0.5 ? 'heads' : 'tails';
      const won = flip === guess;
      const result = { coins: won ? stake * 2 : 0, won, flip, guess };

      dispatch({ type: 'COIN_FLIP', stake, result });
      setLastFlipResult(result);
      setIsFlipping(false);
    }, 2000);
  };

  const stakeOptions = [100, 500, 1000, 5000, 10000];

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">🎮 Games</h1>
        <p className="text-gray-300">Stake your Keze coins to win big!</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="text-lg font-bold text-yellow-400">
            {state.coins.toLocaleString()} KEZE
          </span>
        </div>
      </div>

      <Tabs defaultValue="spinner" className="w-full">
        <TabsList className="w-full bg-black/20 grid grid-cols-3 gap-1">
          <TabsTrigger value="spinner" className="text-xs">
            🎰 Spinner
          </TabsTrigger>
          <TabsTrigger value="treasure" className="text-xs">
            📦 Treasure
          </TabsTrigger>
          <TabsTrigger value="coinflip" className="text-xs">
            🪙 Flip
          </TabsTrigger>
        </TabsList>

        {/* Spinner Game */}
        <TabsContent value="spinner" className="space-y-4">
          <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Keze Spinner
              </CardTitle>
              <p className="text-gray-300 text-sm">
                Spin the wheel to win Keze coins and rare TON coins!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Spinner Visual */}
              <div className="relative mx-auto w-40 h-40 mb-6">
                <div className={`w-full h-full rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 border-4 border-white shadow-lg ${isSpinning ? 'animate-spin' : ''}`}>
                  <div className="absolute inset-4 rounded-full bg-black/20 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
                </div>
              </div>

              {/* Stake Options */}
              <div className="grid grid-cols-3 gap-2">
                {stakeOptions.slice(0, 3).map(amount => (
                  <Button
                    key={amount}
                    onClick={() => spinWheel(amount)}
                    disabled={state.coins < amount || isSpinning}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {amount.toLocaleString()}
                  </Button>
                ))}
              </div>

              {/* Spin Result */}
              {lastSpinResult && (
                <div className="text-center p-4 bg-black/20 rounded-lg">
                  {lastSpinResult.tonCoins > 0 ? (
                    <div className="text-blue-400 font-bold">
                      🎉 JACKPOT! +{lastSpinResult.coins.toLocaleString()} KEZE + {lastSpinResult.tonCoins} TON!
                    </div>
                  ) : lastSpinResult.coins > 0 ? (
                    <div className="text-green-400 font-bold">
                      🎊 Won {lastSpinResult.coins.toLocaleString()} KEZE!
                    </div>
                  ) : (
                    <div className="text-red-400">
                      💔 Better luck next time!
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-400 text-center">
                Chances: 2% TON coins • 8% Big Win (5x) • 20% Good Win (2x) • 30% Loss
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treasure Hunt Game */}
        <TabsContent value="treasure" className="space-y-4">
          <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Treasure Hunt
              </CardTitle>
              <p className="text-gray-300 text-sm">
                Click the treasure boxes to find hidden Keze coins!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Treasure Boxes */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6].map(box => (
                  <div
                    key={box}
                    className="w-16 h-16 mx-auto bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-lg border-2 border-yellow-400 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg"
                  >
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                ))}
              </div>

              {/* Stake Options */}
              <div className="grid grid-cols-3 gap-2">
                {stakeOptions.slice(0, 3).map(amount => (
                  <Button
                    key={amount}
                    onClick={() => huntTreasure(amount)}
                    disabled={state.coins < amount || isHunting}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {amount.toLocaleString()}
                  </Button>
                ))}
              </div>

              {/* Hunt Result */}
              {lastHuntResult && (
                <div className="text-center p-4 bg-black/20 rounded-lg">
                  {lastHuntResult.found ? (
                    <div className="text-green-400 font-bold">
                      🏆 Treasure found! +{lastHuntResult.coins.toLocaleString()} KEZE!
                    </div>
                  ) : (
                    <div className="text-red-400">
                      😞 No treasure this time!
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-400 text-center">
                40% chance to find treasure • Rewards: 3x-10x your stake
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coin Flip Game */}
        <TabsContent value="coinflip" className="space-y-4">
          <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Coin Flip
              </CardTitle>
              <p className="text-gray-300 text-sm">
                Choose heads or tails and double your Keze coins!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coin Visual */}
              <div className="relative mx-auto w-32 h-32 mb-6">
                <div className={`w-full h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 border-4 border-yellow-300 shadow-lg flex items-center justify-center ${isFlipping ? 'animate-spin' : ''}`}>
                  <Coins className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* Stake Selection */}
              <div className="text-center mb-4">
                <p className="text-white font-semibold mb-2">Choose your stake:</p>
                <div className="grid grid-cols-2 gap-2">
                  {stakeOptions.slice(0, 4).map(amount => (
                    <div key={amount} className="space-y-2">
                      <div className="text-yellow-400 font-bold">{amount.toLocaleString()} KEZE</div>
                      <div className="grid grid-cols-2 gap-1">
                        <Button
                          onClick={() => flipCoin(amount, 'heads')}
                          disabled={state.coins < amount || isFlipping}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs"
                        >
                          Heads
                        </Button>
                        <Button
                          onClick={() => flipCoin(amount, 'tails')}
                          disabled={state.coins < amount || isFlipping}
                          className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-xs"
                        >
                          Tails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flip Result */}
              {lastFlipResult && (
                <div className="text-center p-4 bg-black/20 rounded-lg">
                  <div className="mb-2">
                    <span className="text-gray-300">Coin landed on: </span>
                    <span className="font-bold text-white">{lastFlipResult.flip}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-300">You chose: </span>
                    <span className="font-bold text-white">{lastFlipResult.guess}</span>
                  </div>
                  {lastFlipResult.won ? (
                    <div className="text-green-400 font-bold">
                      🎉 You won! +{lastFlipResult.coins.toLocaleString()} KEZE!
                    </div>
                  ) : (
                    <div className="text-red-400">
                      😔 You lost! Better luck next time!
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-400 text-center">
                50% chance to win • Double your stake if you guess correctly
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Game Stats */}
      <Card className="bg-black/20 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Gaming Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-400">{state.coins.toLocaleString()}</div>
            <div className="text-sm text-gray-300">Available KEZE</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-400">{state.tonCoins.toLocaleString()}</div>
            <div className="text-sm text-gray-300">TON Coins</div>
          </div>
        </CardContent>
      </Card>

      {state.coins < 100 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-red-400 text-sm">
              You need at least 100 KEZE coins to play games. Go tap to earn more!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
