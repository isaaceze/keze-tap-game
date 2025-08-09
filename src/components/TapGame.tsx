/**
 * Created: 2025-08-07 05:56:00 UTC
 * Updated: 2025-08-07 05:56:00 UTC
 * Purpose: Main game component with 6-tab navigation and multi-finger tapping
 * Features: Tap, Games, Boosts, Tasks, Friends, Profile tabs
 */
'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TapScreen } from './TapScreen';
import { TasksScreen } from './TasksScreen';
import { FriendsScreen } from './FriendsScreen';
import { ProfileScreen } from './ProfileScreen';
import { GamesScreen } from './GamesScreen';
import { BoostScreen } from './BoostScreen';
import { useGame } from '@/lib/gameContext';
import { Coins, Zap, Target, Users, User, Gamepad2, TrendingUp } from 'lucide-react';

export function TapGame() {
  const [activeTab, setActiveTab] = useState('tap');
  const { state } = useGame();

  // FIXED: Listen for navigation events from side buttons
  React.useEffect(() => {
    const handleNavigateToGames = () => {
      console.log('Navigate to games event received');
      setActiveTab('games');
    };

    const handleNavigateToBoosts = () => {
      console.log('Navigate to boosts event received');
      setActiveTab('boosts');
    };

    window.addEventListener('navigate-to-games', handleNavigateToGames);
    window.addEventListener('navigate-to-boosts', handleNavigateToBoosts);

    return () => {
      window.removeEventListener('navigate-to-games', handleNavigateToGames);
      window.removeEventListener('navigate-to-boosts', handleNavigateToBoosts);
    };
  }, []);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="p-4 text-center border-b border-white/10">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            <span className="text-xl font-bold text-yellow-400">
              {state.coins.toLocaleString()}
            </span>
            <span className="text-sm text-yellow-300">KEZE</span>
          </div>
          {state.tonCoins > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                T
              </div>
              <span className="text-xl font-bold text-blue-400">
                {state.tonCoins.toLocaleString()}
              </span>
              <span className="text-sm text-blue-300">TON</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>{state.energy}/{state.maxEnergy}</span>
          </div>
          <div className="text-purple-300">
            Level {state.level}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="flex-1 pb-20">
          <TabsContent value="tap" className="mt-0">
            <TapScreen />
          </TabsContent>
          <TabsContent value="games" className="mt-0">
            <GamesScreen />
          </TabsContent>
          <TabsContent value="boosts" className="mt-0">
            <BoostScreen />
          </TabsContent>
          <TabsContent value="tasks" className="mt-0">
            <TasksScreen />
          </TabsContent>
          <TabsContent value="friends" className="mt-0">
            <FriendsScreen />
          </TabsContent>
          <TabsContent value="profile" className="mt-0">
            <ProfileScreen />
          </TabsContent>
        </div>

        {/* Bottom Navigation - TODAY'S FIX: Reduced from 6 to 4 tabs */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-black/20 backdrop-blur-md border-t border-white/10">
          <TabsList className="w-full h-16 bg-transparent grid grid-cols-4 gap-0">
            <TabsTrigger
              value="tap"
              className="flex-col gap-1 h-full data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              <Target className="w-4 h-4" />
              <span className="text-xs">Tap</span>
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="flex-col gap-1 h-full data-[state=active]:bg-white/10 data-[state=active]:text-white relative"
            >
              <Target className="w-4 h-4" />
              <span className="text-xs">Tasks</span>
              {state.tasks.some(task => task.completed && task.id.includes('daily')) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="flex-col gap-1 h-full data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              <span className="text-xs">Friends</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex-col gap-1 h-full data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              <User className="w-4 h-4" />
              <span className="text-xs">Profile</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}
