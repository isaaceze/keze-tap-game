'use client';

import React from 'react';
import { useGame } from '@/lib/gameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  TrendingUp,
  Battery,
  Star,
  Clock,
  Coins,
  ShoppingCart,
  Timer
} from 'lucide-react';

interface BoostOption {
  id: 'tapPower' | 'energy' | 'xp' | 'level';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  cost: number;
  duration: number; // in minutes
  multiplier: number;
  color: string;
}

export function BoostScreen() {
  const { state, dispatch } = useGame();

  const boostOptions: BoostOption[] = [
    {
      id: 'tapPower',
      title: '2x Tap Power',
      description: 'Double your coins per tap',
      icon: TrendingUp,
      cost: 1000,
      duration: 30,
      multiplier: 2,
      color: 'text-green-400'
    },
    {
      id: 'energy',
      title: '2x Energy Regen',
      description: 'Regenerate energy twice as fast',
      icon: Battery,
      cost: 800,
      duration: 60,
      multiplier: 2,
      color: 'text-blue-400'
    },
    {
      id: 'xp',
      title: '2x Experience',
      description: 'Gain double XP from all actions',
      icon: Star,
      cost: 1200,
      duration: 45,
      multiplier: 2,
      color: 'text-purple-400'
    },
    {
      id: 'level',
      title: 'Level Boost',
      description: 'Temporary level increase benefits',
      icon: Zap,
      cost: 1500,
      duration: 20,
      multiplier: 2,
      color: 'text-yellow-400'
    }
  ];

  const handlePurchaseBoost = (boostType: BoostOption['id'], cost: number, duration: number) => {
    if (state.coins >= cost) {
      dispatch({
        type: 'ACTIVATE_BOOST',
        boostType,
        cost,
        duration
      });

      // Trigger haptic feedback
      if ((window as any).triggerHaptic) {
        (window as any).triggerHaptic('medium');
      }
    }
  };

  const getTimeRemaining = (expiryTime: number): string => {
    const now = Date.now();
    const remaining = Math.max(0, expiryTime - now);

    if (remaining === 0) return '';

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isBoostActive = (boostType: BoostOption['id']): boolean => {
    const now = Date.now();
    switch (boostType) {
      case 'tapPower':
        return now < state.boosts.tapPowerBoostExpiry;
      case 'energy':
        return now < state.boosts.energyBoostExpiry;
      case 'xp':
        return now < state.boosts.xpBoostExpiry;
      case 'level':
        return now < state.boosts.levelBoostExpiry;
      default:
        return false;
    }
  };

  const getBoostExpiry = (boostType: BoostOption['id']): number => {
    switch (boostType) {
      case 'tapPower':
        return state.boosts.tapPowerBoostExpiry;
      case 'energy':
        return state.boosts.energyBoostExpiry;
      case 'xp':
        return state.boosts.xpBoostExpiry;
      case 'level':
        return state.boosts.levelBoostExpiry;
      default:
        return 0;
    }
  };

  // Check for expired boosts every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_BOOST_EXPIRY' });
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">⚡ Boosts</h1>
        <p className="text-gray-300">Enhance your gameplay with powerful temporary boosts!</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="text-lg font-bold text-yellow-400">
            {state.coins.toLocaleString()} KEZE
          </span>
        </div>
      </div>

      {/* Active Boosts */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">🔥 Active Boosts</h2>
        {boostOptions.some(boost => isBoostActive(boost.id)) ? (
          <div className="grid gap-3">
            {boostOptions
              .filter(boost => isBoostActive(boost.id))
              .map(boost => {
                const IconComponent = boost.icon;
                const timeRemaining = getTimeRemaining(getBoostExpiry(boost.id));

                return (
                  <Card key={boost.id} className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-400/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className={`w-6 h-6 ${boost.color}`} />
                          <div>
                            <div className="font-semibold text-white">{boost.title}</div>
                            <div className="text-sm text-gray-300">{boost.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-600 text-white mb-1">
                            ACTIVE
                          </Badge>
                          <div className="flex items-center gap-1 text-green-400 text-sm">
                            <Timer className="w-3 h-3" />
                            <span>{timeRemaining}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        ) : (
          <Card className="bg-black/20 border-white/10">
            <CardContent className="p-6 text-center">
              <Zap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400">No active boosts</p>
              <p className="text-gray-500 text-sm">Purchase a boost below to enhance your gameplay!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Available Boosts */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">🛒 Available Boosts</h2>
        <div className="grid gap-4">
          {boostOptions.map(boost => {
            const IconComponent = boost.icon;
            const canAfford = state.coins >= boost.cost;
            const isActive = isBoostActive(boost.id);

            return (
              <Card key={boost.id} className="bg-black/20 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-6 h-6 ${boost.color}`} />
                      <div>
                        <h3 className="font-semibold text-white">{boost.title}</h3>
                        <p className="text-sm text-gray-300">{boost.description}</p>
                      </div>
                    </div>
                    <Badge className={`${boost.color.replace('text-', 'bg-').replace('400', '600')} text-white`}>
                      {boost.multiplier}x
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{boost.duration}m</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400">{boost.cost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePurchaseBoost(boost.id, boost.cost, boost.duration)}
                    disabled={!canAfford || isActive}
                    className={`w-full ${canAfford && !isActive ? boost.color.replace('text-', 'bg-').replace('400', '600') + ' hover:' + boost.color.replace('text-', 'bg-').replace('400', '700') : 'bg-gray-600'}`}
                  >
                    {isActive ? (
                      <>
                        <Timer className="w-4 h-4 mr-2" />
                        Active
                      </>
                    ) : canAfford ? (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Purchase
                      </>
                    ) : (
                      'Not Enough Coins'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Boost Tips */}
      <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5" />
            Boost Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-300">
          <p>• Stack multiple boosts for maximum efficiency</p>
          <p>• Use Tap Power boost during active gaming sessions</p>
          <p>• Energy boost is great for long grinding sessions</p>
          <p>• XP boost helps you level up faster for better rewards</p>
          <p>• Boosts remain active even when you're offline!</p>
        </CardContent>
      </Card>

      {/* Low Coins Warning */}
      {state.coins < 800 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-red-400 text-sm">
              💡 Need more coins? Tap more, complete tasks, or play games to earn KEZE coins!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
