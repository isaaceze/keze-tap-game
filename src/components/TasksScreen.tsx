'use client';

import { useGame } from '@/lib/gameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, Clock, Users, Trophy, ExternalLink, CheckCircle } from 'lucide-react';

export function TasksScreen() {
  const { state, dispatch } = useGame();

  const handleCompleteTask = (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    if (task.type === 'social') {
      // For social tasks, open external link (simulate)
      window.open('https://t.me/your-channel', '_blank');
      // In a real app, you'd verify completion through API
      setTimeout(() => {
        dispatch({ type: 'COMPLETE_TASK', taskId });
      }, 2000);
    } else {
      dispatch({ type: 'COMPLETE_TASK', taskId });
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'social':
        return <Users className="w-5 h-5 text-green-400" />;
      case 'achievement':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      default:
        return <Coins className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTaskBadgeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-500';
      case 'social':
        return 'bg-green-500';
      case 'achievement':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const canCompleteTask = (task: typeof state.tasks[0]) => {
    if (task.completed) return false;
    if (task.type === 'social') return true;
    if (task.requirement && task.progress !== undefined) {
      return task.progress >= task.requirement;
    }
    return true;
  };

  const getProgressPercentage = (task: typeof state.tasks[0]) => {
    if (!task.requirement || task.progress === undefined) return 0;
    return Math.min((task.progress / task.requirement) * 100, 100);
  };

  const dailyTasks = state.tasks.filter(task => task.type === 'daily');
  const socialTasks = state.tasks.filter(task => task.type === 'social');
  const achievementTasks = state.tasks.filter(task => task.type === 'achievement');

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Tasks</h1>
        <p className="text-gray-300">Complete tasks to earn bonus Keze coins!</p>
      </div>

      {/* Daily Tasks */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Daily Tasks
        </h2>
        <div className="space-y-3">
          {dailyTasks.map(task => (
            <Card key={task.id} className="bg-black/20 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getTaskIcon(task.type)}
                    <div>
                      <h3 className="font-semibold text-white">{task.title}</h3>
                      <p className="text-sm text-gray-300">{task.description}</p>
                    </div>
                  </div>
                  <Badge className={`${getTaskBadgeColor(task.type)} text-white`}>
                    {task.type}
                  </Badge>
                </div>

                {task.requirement && task.progress !== undefined && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>Progress</span>
                      <span>{task.progress}/{task.requirement}</span>
                    </div>
                    <Progress value={getProgressPercentage(task)} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span className="font-semibold">+{task.reward}</span>
                  </div>

                  {task.completed ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Completed</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={!canCompleteTask(task)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {canCompleteTask(task) ? 'Claim' : 'Not Ready'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Social Tasks */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-400" />
          Social Tasks
        </h2>
        <div className="space-y-3">
          {socialTasks.map(task => (
            <Card key={task.id} className="bg-black/20 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getTaskIcon(task.type)}
                    <div>
                      <h3 className="font-semibold text-white">{task.title}</h3>
                      <p className="text-sm text-gray-300">{task.description}</p>
                    </div>
                  </div>
                  <Badge className={`${getTaskBadgeColor(task.type)} text-white`}>
                    {task.type}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span className="font-semibold">+{task.reward}</span>
                  </div>

                  {task.completed ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Completed</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleCompleteTask(task.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Achievement Tasks */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Achievements
        </h2>
        <div className="space-y-3">
          {achievementTasks.map(task => (
            <Card key={task.id} className="bg-black/20 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getTaskIcon(task.type)}
                    <div>
                      <h3 className="font-semibold text-white">{task.title}</h3>
                      <p className="text-sm text-gray-300">{task.description}</p>
                    </div>
                  </div>
                  <Badge className={`${getTaskBadgeColor(task.type)} text-white`}>
                    {task.type}
                  </Badge>
                </div>

                {task.requirement && task.progress !== undefined && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>Progress</span>
                      <span>{task.progress}/{task.requirement}</span>
                    </div>
                    <Progress value={getProgressPercentage(task)} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span className="font-semibold">+{task.reward}</span>
                  </div>

                  {task.completed ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Completed</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={!canCompleteTask(task)}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {canCompleteTask(task) ? 'Claim' : 'In Progress'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
