'use client';

import { useGame } from '@/lib/gameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Coins,
  Target,
  TrendingUp,
  Zap,
  Users,
  Trophy,
  Calendar,
  Star,
  Award
} from 'lucide-react';

export function ProfileScreen() {
  const { state } = useGame();

  const experiencePercentage = (state.experience / state.experienceToNext) * 100;
  const completedTasks = state.tasks.filter(task => task.completed).length;
  const totalTasks = state.tasks.length;
  const taskCompletionRate = (completedTasks / totalTasks) * 100;

  // Calculate user tier based on total earnings
  const getUserTier = (earnings: number) => {
    if (earnings >= 100000) return { name: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-600' };
    if (earnings >= 50000) return { name: 'Platinum', color: 'text-gray-300', bg: 'bg-gray-600' };
    if (earnings >= 25000) return { name: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-600' };
    if (earnings >= 10000) return { name: 'Silver', color: 'text-gray-400', bg: 'bg-gray-500' };
    return { name: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-600' };
  };

  const userTier = getUserTier(state.totalEarnings);

  // Calculate achievements
  const achievements = [
    {
      id: 'first-tap',
      name: 'First Tap',
      description: 'Made your first tap',
      earned: state.tapsCount > 0,
      icon: Target
    },
    {
      id: 'hundred-taps',
      name: 'Tap Master',
      description: 'Made 100 taps',
      earned: state.tapsCount >= 100,
      icon: Target
    },
    {
      id: 'thousand-taps',
      name: 'Tap Champion',
      description: 'Made 1,000 taps',
      earned: state.tapsCount >= 1000,
      icon: Award
    },
    {
      id: 'level-5',
      name: 'Rising Star',
      description: 'Reached level 5',
      earned: state.level >= 5,
      icon: Star
    },
    {
      id: 'first-friend',
      name: 'Social Butterfly',
      description: 'Invited first friend',
      earned: state.referrals.length > 0,
      icon: Users
    },
    {
      id: 'task-master',
      name: 'Task Master',
      description: 'Completed 5 tasks',
      earned: completedTasks >= 5,
      icon: Trophy
    }
  ];

  const earnedAchievements = achievements.filter(a => a.earned);

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-400/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16">
              {/* FIXED: Display Telegram profile photo if available */}
              {state.telegramWebAppAvailable && state.userId && (
                <AvatarImage
                  src={`https://t.me/i/userpic/320/${state.userId}.jpg`}
                  alt="Profile photo"
                  onError={(e) => {
                    // Hide broken image if Telegram photo not available
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <AvatarFallback className="bg-purple-600 text-white text-xl">
                {/* Show initials if name available, otherwise generic icon */}
                {state.firstName ? (
                  <span className="text-lg font-bold">
                    {state.firstName.charAt(0)}{state.lastName?.charAt(0) || ''}
                  </span>
                ) : (
                  <User className="w-8 h-8" />
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              {/* FIXED: Display actual Telegram username and name */}
              <h1 className="text-2xl font-bold text-white">
                {state.firstName || state.username || `Player #${state.referralCode || state.userId?.toString() || 'DEMO'}`}
              </h1>
              {state.username && (
                <div className="text-sm text-blue-300 mb-1">@{state.username}</div>
              )}
              {state.telegramWebAppAvailable ? (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-300">Connected to Telegram</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-orange-300">Web Mode</span>
                </div>
              )}
              <Badge className={`${userTier.bg} text-white`}>
                {userTier.name} Tier
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-400">{state.coins.toLocaleString()}</div>
              <div className="text-sm text-gray-300">Keze Coins</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">{state.tonCoins.toLocaleString()}</div>
              <div className="text-sm text-gray-300">TON Coins</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400">Level {state.level}</div>
              <div className="text-sm text-gray-300">Current Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Progress */}
      <Card className="bg-black/20 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Level Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Level {state.level}</span>
              <span className="text-gray-300">Level {state.level + 1}</span>
            </div>
            <Progress value={experiencePercentage} className="h-3" />
            <div className="text-center text-sm text-gray-300">
              {state.experience.toLocaleString()} / {state.experienceToNext.toLocaleString()} XP
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-black/20 border-white/10">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{state.tapsCount.toLocaleString()}</div>
            <div className="text-sm text-gray-300">Total Taps</div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10">
          <CardContent className="p-4 text-center">
            <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-yellow-400">{state.totalEarnings.toLocaleString()}</div>
            <div className="text-sm text-gray-300">Total Earned</div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{state.referrals.length}</div>
            <div className="text-sm text-gray-300">Friends Invited</div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10">
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{completedTasks}/{totalTasks}</div>
            <div className="text-sm text-gray-300">Tasks Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Game Stats */}
      <Card className="bg-black/20 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Game Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Coins per Tap</span>
            <span className="text-white font-semibold">+{state.coinsPerTap}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Max Energy</span>
            <span className="text-white font-semibold">{state.maxEnergy}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Current Energy</span>
            <span className="text-white font-semibold">{state.energy}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Task Completion</span>
            <span className="text-white font-semibold">{taskCompletionRate.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="bg-black/20 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="w-5 h-5" />
            Achievements ({earnedAchievements.length}/{achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {achievements.map(achievement => {
              const IconComponent = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    achievement.earned
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-gray-500/10 border-gray-500/30'
                  }`}
                >
                  <IconComponent
                    className={`w-6 h-6 ${
                      achievement.earned ? 'text-green-400' : 'text-gray-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div
                      className={`font-semibold ${
                        achievement.earned ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {achievement.name}
                    </div>
                    <div className="text-sm text-gray-400">{achievement.description}</div>
                  </div>
                  {achievement.earned && (
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      Earned
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trading Info */}
      <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Token Trading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <p className="text-gray-300 text-sm">
              Your Keze coins will be convertible to tradeable tokens when we list on exchanges!
            </p>
            <div className="text-2xl font-bold text-yellow-400">
              {state.coins.toLocaleString()} KEZE Ready
            </div>
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              Exchange Listing Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
