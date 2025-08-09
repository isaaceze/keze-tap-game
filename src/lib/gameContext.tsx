/**
 * Created: 2025-08-07 05:51:00 UTC
 * Updated: 2025-08-07 05:51:00 UTC
 * Purpose: Safe Telegram WebApp game context with comprehensive error boundaries
 * Features: 5-level referral fallback, async initialization, loading states
 */
'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  type: 'daily' | 'social' | 'achievement';
  requirement?: number;
  progress?: number;
}

interface Referral {
  id: string;
  username: string;
  earnings: number;
  joinedAt: Date;
}

interface BoostState {
  tapPowerBoost: number;
  energyBoost: number;
  xpBoost: number;
  levelBoost: number;
  tapPowerBoostExpiry: number;
  energyBoostExpiry: number;
  xpBoostExpiry: number;
  levelBoostExpiry: number;
}

interface GameState {
  coins: number;
  tonCoins: number;
  level: number;
  experience: number;
  experienceToNext: number;
  tapsCount: number;
  coinsPerTap: number;
  energy: number;
  maxEnergy: number;
  tasks: Task[];
  referrals: Referral[];
  referralCode: string;
  dailyStreak: number;
  lastLoginDate: string;
  totalEarnings: number;
  userId?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  boosts: BoostState;
  isInitialized: boolean;
  telegramWebAppAvailable: boolean;
}

type GameAction =
  | { type: 'TAP' }
  | { type: 'COMPLETE_TASK'; taskId: string }
  | { type: 'ADD_REFERRAL'; referral: Referral }
  | { type: 'LEVEL_UP' }
  | { type: 'RESTORE_ENERGY' }
  | { type: 'LOAD_GAME'; state: Partial<GameState> }
  | { type: 'SPIN_WHEEL'; stake: number; result: { coins: number; tonCoins: number } }
  | { type: 'TREASURE_HUNT'; stake: number; result: { coins: number; found: boolean } }
  | { type: 'COIN_FLIP'; stake: number; result: { coins: number; won: boolean } }
  | { type: 'INIT_TELEGRAM_USER'; userData: { userId: number; username?: string; firstName?: string; lastName?: string } }
  | { type: 'ACTIVATE_BOOST'; boostType: 'tapPower' | 'energy' | 'xp' | 'level'; cost: number; duration: number }
  | { type: 'CHECK_BOOST_EXPIRY' }
  | { type: 'SET_INITIALIZED'; isInitialized: boolean; telegramWebAppAvailable: boolean }
  | { type: 'CHECK_DAILY_RESET' }
  | { type: 'CLAIM_DAILY_ATTENDANCE' };

// Safe function to generate referral code
const generateSafeReferralCode = (): string => {
  try {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  } catch (error) {
    console.error('Error generating referral code:', error);
    return 'DEMO123';
  }
};

const initialState: GameState = {
  coins: 0,
  tonCoins: 0,
  level: 1,
  experience: 0,
  experienceToNext: 1000,
  tapsCount: 0,
  coinsPerTap: 1,
  energy: 1000,
  maxEnergy: 1000,
  referralCode: generateSafeReferralCode(),
  dailyStreak: 0,
  lastLoginDate: '',
  totalEarnings: 0,
  isInitialized: true, // ✅ Start initialized for static export
  telegramWebAppAvailable: false,
  boosts: {
    tapPowerBoost: 1,
    energyBoost: 1,
    xpBoost: 1,
    levelBoost: 1,
    tapPowerBoostExpiry: 0,
    energyBoostExpiry: 0,
    xpBoostExpiry: 0,
    levelBoostExpiry: 0,
  },
  tasks: [
    {
      id: 'daily-attendance',
      title: 'Daily Check-in',
      description: 'Log in today to claim reward',
      reward: 1000,
      completed: false,
      type: 'daily',
      requirement: 1,
      progress: 0
    },
    {
      id: 'daily-tap-100',
      title: 'Daily Tapper',
      description: 'Tap 100 times today',
      reward: 500,
      completed: false,
      type: 'daily',
      requirement: 100,
      progress: 0
    },
    {
      id: 'daily-energy',
      title: 'Energy Saver',
      description: 'Use all your energy today',
      reward: 300,
      completed: false,
      type: 'daily',
      requirement: 1000,
      progress: 0
    },
    {
      id: 'social-follow',
      title: 'Follow Us',
      description: 'Follow our Telegram channel',
      reward: 1000,
      completed: false,
      type: 'social'
    },
    {
      id: 'achievement-level-5',
      title: 'Level Up Champion',
      description: 'Reach level 5',
      reward: 2500,
      completed: false,
      type: 'achievement',
      requirement: 5,
      progress: 1
    },
    {
      id: 'achievement-10k',
      title: 'Coin Collector',
      description: 'Earn 10,000 Keze coins',
      reward: 5000,
      completed: false,
      type: 'achievement',
      requirement: 10000,
      progress: 0
    }
  ],
  referrals: []
};

function gameReducer(state: GameState, action: GameAction): GameState {
  try {
    switch (action.type) {
      case 'SET_INITIALIZED':
        return {
          ...state,
          isInitialized: action.isInitialized,
          telegramWebAppAvailable: action.telegramWebAppAvailable
        };

      case 'TAP':
        if (state.energy <= 0) return state;

        // Check for expired boosts
        const now = Date.now();
        const activeTapBoost = now < state.boosts.tapPowerBoostExpiry ? state.boosts.tapPowerBoost : 1;
        const activeXpBoost = now < state.boosts.xpBoostExpiry ? state.boosts.xpBoost : 1;

        const coinsEarned = Math.floor(state.coinsPerTap * activeTapBoost);
        const xpEarned = Math.floor(1 * activeXpBoost);

        const newCoins = state.coins + coinsEarned;
        const newExperience = state.experience + xpEarned;
        const newTapsCount = state.tapsCount + 1;
        const newEnergy = Math.max(0, state.energy - 1);

        // Update task progress safely
        const updatedTasks = state.tasks.map(task => {
          try {
            if (task.id === 'daily-tap-100' && !task.completed) {
              const newProgress = Math.min((task.progress || 0) + 1, task.requirement || 100);
              return { ...task, progress: newProgress, completed: newProgress >= (task.requirement || 100) };
            }
            if (task.id === 'daily-energy' && !task.completed) {
              const energyUsed = state.maxEnergy - newEnergy;
              const newProgress = Math.min(energyUsed, task.requirement || 1000);
              return { ...task, progress: newProgress, completed: newProgress >= (task.requirement || 1000) };
            }
            // FIXED: Progressive coin collection achievements
            if (task.id.startsWith('achievement-') && task.id.includes('k') && !task.completed) {
              const currentTarget = task.requirement || 10000;
              const newProgress = Math.min(newCoins, currentTarget);

              if (newProgress >= currentTarget) {
                // Achievement completed, will be replaced with next tier in COMPLETE_TASK
                return { ...task, progress: newProgress, completed: true };
              }
              return { ...task, progress: newProgress };
            }
            return task;
          } catch (error) {
            console.error('Error updating task:', task.id, error);
            return task;
          }
        });

        return {
          ...state,
          coins: newCoins,
          experience: newExperience,
          tapsCount: newTapsCount,
          energy: newEnergy,
          totalEarnings: state.totalEarnings + coinsEarned,
          tasks: updatedTasks
        };

      case 'COMPLETE_TASK':
        try {
          const task = state.tasks.find(t => t.id === action.taskId);
          if (!task || task.completed) return state;

          let updatedTasks = state.tasks.map(t =>
            t.id === action.taskId ? { ...t, completed: true } : t
          );

          // FIXED: Create progressive achievements when completed
          if (task.type === 'achievement') {
            console.log('Achievement completed:', task.id);

            if (task.id.startsWith('achievement-level-')) {
              const currentTarget = task.requirement || 5;
              const nextTarget = currentTarget + 5;
              console.log(`Creating new level achievement: ${nextTarget}`);

              // Check if next achievement already exists
              const existingNext = updatedTasks.find(t => t.id === `achievement-level-${nextTarget}`);
              if (!existingNext) {
                // Add new progressive level achievement
                updatedTasks.push({
                  id: `achievement-level-${nextTarget}`,
                  title: `Level Up Champion ${nextTarget}`,
                  description: `Reach level ${nextTarget}`,
                  reward: task.reward + 1000, // Increase reward for higher tiers
                  completed: false,
                  type: 'achievement' as const,
                  requirement: nextTarget,
                  progress: state.level
                });
                console.log(`Added new level achievement: ${nextTarget}`);
              }
            } else if (task.id.includes('k') || task.id.includes('10000')) {
              const currentTarget = task.requirement || 10000;
              const nextTarget = currentTarget * 2; // Double the target
              const nextTargetLabel = nextTarget >= 1000000 ? `${nextTarget / 1000000}M` : `${nextTarget / 1000}k`;
              console.log(`Creating new coin achievement: ${nextTarget}`);

              // Check if next achievement already exists
              const existingNext = updatedTasks.find(t => t.id === `achievement-${nextTarget}`);
              if (!existingNext) {
                // Add new progressive coin achievement
                updatedTasks.push({
                  id: `achievement-${nextTarget}`,
                  title: `Coin Collector ${nextTargetLabel}`,
                  description: `Earn ${nextTarget.toLocaleString()} Keze coins`,
                  reward: task.reward + 2000, // Increase reward for higher tiers
                  completed: false,
                  type: 'achievement' as const,
                  requirement: nextTarget,
                  progress: state.coins
                });
                console.log(`Added new coin achievement: ${nextTarget}`);
              }
            }
          }

          return {
            ...state,
            coins: state.coins + task.reward,
            totalEarnings: state.totalEarnings + task.reward,
            tasks: updatedTasks
          };
        } catch (error) {
          console.error('Error completing task:', error);
          return state;
        }

      case 'ADD_REFERRAL':
        try {
          return {
            ...state,
            referrals: [...state.referrals, action.referral],
            coins: state.coins + 1000,
            totalEarnings: state.totalEarnings + 1000
          };
        } catch (error) {
          console.error('Error adding referral:', error);
          return state;
        }

      case 'LEVEL_UP':
        try {
          const newLevel = state.level + 1;
          const newMaxEnergy = 1000 + (newLevel - 1) * 100;
          const newCoinsPerTap = Math.floor(newLevel / 3) + 1;

          return {
            ...state,
            level: newLevel,
            experience: 0,
            experienceToNext: newLevel * 1000,
            coinsPerTap: newCoinsPerTap,
            maxEnergy: newMaxEnergy,
            energy: newMaxEnergy,
            tasks: state.tasks.map(task => {
              // FIXED: Progressive level achievements
              if (task.id.startsWith('achievement-level-') && !task.completed) {
                const currentTarget = task.requirement || 5;
                const newProgress = newLevel;

                if (newProgress >= currentTarget) {
                  // Achievement completed, will be replaced with next tier in COMPLETE_TASK
                  return { ...task, progress: newProgress, completed: true };
                }
                return { ...task, progress: newProgress };
              }
              return task;
            })
          };
        } catch (error) {
          console.error('Error leveling up:', error);
          return state;
        }

      case 'RESTORE_ENERGY':
        try {
          // FIXED: Restore more energy per cycle for better UX
          const energyRestore = Math.min(100, Math.floor(state.maxEnergy * 0.1)); // 10% of max energy or 100, whichever is smaller
          return {
            ...state,
            energy: Math.min(state.energy + energyRestore, state.maxEnergy)
          };
        } catch (error) {
          console.error('Error restoring energy:', error);
          return state;
        }

      case 'LOAD_GAME':
        try {
          return {
            ...state,
            ...action.state,
            // Ensure critical fields are never undefined
            referralCode: action.state.referralCode || state.referralCode || generateSafeReferralCode(),
            userId: action.state.userId || state.userId,
            isInitialized: true
          };
        } catch (error) {
          console.error('Error loading game state:', error);
          return {
            ...state,
            isInitialized: true
          };
        }

      case 'SPIN_WHEEL':
      case 'TREASURE_HUNT':
      case 'COIN_FLIP':
        try {
          const coinDiff = action.result.coins - action.stake;
          return {
            ...state,
            coins: state.coins + coinDiff,
            tonCoins: state.tonCoins + (action.result.tonCoins || 0),
            totalEarnings: state.totalEarnings + Math.max(0, coinDiff)
          };
        } catch (error) {
          console.error('Error processing game result:', error);
          return state;
        }

      case 'INIT_TELEGRAM_USER':
        try {
          return {
            ...state,
            userId: action.userData.userId,
            username: action.userData.username,
            firstName: action.userData.firstName,
            lastName: action.userData.lastName,
            referralCode: action.userData.userId?.toString() || state.referralCode
          };
        } catch (error) {
          console.error('Error initializing Telegram user:', error);
          return state;
        }

      case 'ACTIVATE_BOOST':
        try {
          if (state.coins < action.cost) return state;

          const duration = action.duration;
          const now = Date.now();
          const expiryTime = now + duration;

          let newBoosts = { ...state.boosts };

          switch (action.boostType) {
            case 'tapPower':
              newBoosts.tapPowerBoost = 2;
              newBoosts.tapPowerBoostExpiry = expiryTime;
              break;
            case 'energy':
              newBoosts.energyBoost = 2;
              newBoosts.energyBoostExpiry = expiryTime;
              break;
            case 'xp':
              newBoosts.xpBoost = 2;
              newBoosts.xpBoostExpiry = expiryTime;
              break;
            case 'level':
              newBoosts.levelBoost = 2;
              newBoosts.levelBoostExpiry = expiryTime;
              break;
          }

          return {
            ...state,
            coins: state.coins - action.cost,
            boosts: newBoosts
          };
        } catch (error) {
          console.error('Error activating boost:', error);
          return state;
        }

      case 'CHECK_BOOST_EXPIRY':
        try {
          const checkTime = Date.now();
          const expiredBoosts = { ...state.boosts };

          if (checkTime >= expiredBoosts.tapPowerBoostExpiry) {
            expiredBoosts.tapPowerBoost = 1;
          }
          if (checkTime >= expiredBoosts.energyBoostExpiry) {
            expiredBoosts.energyBoost = 1;
          }
          if (checkTime >= expiredBoosts.xpBoostExpiry) {
            expiredBoosts.xpBoost = 1;
          }
          if (checkTime >= expiredBoosts.levelBoostExpiry) {
            expiredBoosts.levelBoost = 1;
          }

          return {
            ...state,
            boosts: expiredBoosts
          };
        } catch (error) {
          console.error('Error checking boost expiry:', error);
          return state;
        }

      case 'CHECK_DAILY_RESET':
        try {
          const today = new Date().toDateString();
          const lastLogin = state.lastLoginDate;

          // Check if it's a new day
          if (lastLogin !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const isConsecutiveDay = lastLogin === yesterday.toDateString();

            // Reset daily tasks
            const resetTasks = state.tasks.map(task => {
              if (task.type === 'daily') {
                return { ...task, completed: false, progress: 0 };
              }
              return task;
            });

            return {
              ...state,
              lastLoginDate: today,
              dailyStreak: isConsecutiveDay ? state.dailyStreak + 1 : 1,
              tasks: resetTasks
            };
          }

          return state;
        } catch (error) {
          console.error('Error checking daily reset:', error);
          return state;
        }

      case 'CLAIM_DAILY_ATTENDANCE':
        try {
          const today = new Date().toDateString();
          const attendanceTask = state.tasks.find(t => t.id === 'daily-attendance');

          if (!attendanceTask || attendanceTask.completed || state.lastLoginDate !== today) {
            return state;
          }

          const updatedTasks = state.tasks.map(task => {
            if (task.id === 'daily-attendance') {
              return { ...task, completed: true, progress: 1 };
            }
            return task;
          });

          return {
            ...state,
            coins: state.coins + attendanceTask.reward,
            totalEarnings: state.totalEarnings + attendanceTask.reward,
            tasks: updatedTasks
          };
        } catch (error) {
          console.error('Error claiming daily attendance:', error);
          return state;
        }

      default:
        return state;
    }
  } catch (error) {
    console.error('Critical error in gameReducer:', error);
    return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

// Safe localStorage operations
const safeSaveToLocalStorage = (key: string, data: any): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const safeLoadFromLocalStorage = (key: string): any => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return null;
};

// Safe Telegram WebApp operations - FIXED: Better detection and fallback
const safeTelegramWebAppInit = async (dispatch: React.Dispatch<GameAction>): Promise<void> => {
  try {
    // Wait for DOM to be ready
    await new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve(undefined);
      }
    });

    // Check if we're on server side
    if (typeof window === 'undefined') {
      console.log('Server-side rendering, skipping Telegram WebApp init');
      dispatch({ type: 'SET_INITIALIZED', isInitialized: true, telegramWebAppAvailable: false });
      return;
    }

    // Enhanced Telegram WebApp detection
    const isTelegramWebApp = !!(
      (window as any).Telegram?.WebApp ||
      window.location.search.includes('tgWebAppData') ||
      window.navigator.userAgent.includes('TelegramBot') ||
      document.referrer.includes('t.me')
    );

    if (!isTelegramWebApp) {
      console.log('Running in web mode - creating demo user');
      // Create demo user for web mode testing
      const demoUser = {
        userId: 123456789,
        username: 'webuser',
        firstName: 'Web',
        lastName: 'User'
      };
      dispatch({ type: 'INIT_TELEGRAM_USER', userData: demoUser });
      dispatch({ type: 'SET_INITIALIZED', isInitialized: true, telegramWebAppAvailable: false });
      return;
    }

    const tg = (window as any).Telegram.WebApp;
    console.log('Telegram WebApp available, initializing...');

    // Expand the WebApp to full height (safely)
    try {
      tg.expand();
    } catch (error) {
      console.warn('Could not expand Telegram WebApp:', error);
    }

    // Enable closing confirmation (safely)
    try {
      tg.enableClosingConfirmation();
    } catch (error) {
      console.warn('Could not enable closing confirmation:', error);
    }

    // Set main button (safely)
    try {
      if (tg.MainButton) {
        tg.MainButton.setText('🎮 Share Game');
        tg.MainButton.show();
        tg.MainButton.onClick(() => {
          try {
            const shareText = encodeURIComponent('🪙 Join me in Keze Tap Game! Earn coins by tapping and playing games!');
            const shareUrl = encodeURIComponent(window.location.href);
            tg.openTelegramLink(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`);
          } catch (shareError) {
            console.error('Error sharing game:', shareError);
          }
        });
      }
    } catch (error) {
      console.warn('Could not set main button:', error);
    }

    // Get user data from Telegram (safely)
    try {
      const user = tg.initDataUnsafe?.user;
      if (user) {
        dispatch({
          type: 'INIT_TELEGRAM_USER',
          userData: {
            userId: user.id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name
          }
        });

        // Try to sync with backend (safely)
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://keze.bissols.com/api';
          const response = await fetch(`${apiUrl}/user/${user.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const backendData = await response.json();
            dispatch({ type: 'LOAD_GAME', state: backendData });
          } else {
            console.log('Backend response not ok:', response.status);
          }
        } catch (backendError) {
          console.log('Backend not available, continuing in offline mode:', backendError);
        }
      } else {
        console.log('No user data available from Telegram');
      }
    } catch (userError) {
      console.warn('Error getting Telegram user data:', userError);
    }

    // Set theme colors (safely)
    try {
      if (tg.themeParams) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a2e');
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#5288c1');
      }
    } catch (themeError) {
      console.warn('Error setting theme colors:', themeError);
    }

    // Handle haptic feedback (safely)
    try {
      if (tg.HapticFeedback) {
        (window as any).triggerHaptic = (type: 'light' | 'medium' | 'heavy') => {
          try {
            if (type === 'light') tg.HapticFeedback.impactOccurred('light');
            if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
            if (type === 'heavy') tg.HapticFeedback.impactOccurred('heavy');
          } catch (hapticError) {
            console.warn('Haptic feedback error:', hapticError);
          }
        };
      }
    } catch (hapticSetupError) {
      console.warn('Error setting up haptic feedback:', hapticSetupError);
    }

    dispatch({ type: 'SET_INITIALIZED', isInitialized: true, telegramWebAppAvailable: true });
    console.log('Telegram WebApp initialization completed successfully');

  } catch (error) {
    console.error('Error in Telegram WebApp initialization:', error);
    dispatch({ type: 'SET_INITIALIZED', isInitialized: true, telegramWebAppAvailable: false });
  }
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Safe initialization effect
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Load saved game state first
        const savedGame = safeLoadFromLocalStorage('telegram-tap-game');
        if (savedGame) {
          dispatch({ type: 'LOAD_GAME', state: savedGame });
        }

        // Initialize Telegram WebApp (non-blocking)
        safeTelegramWebAppInit(dispatch).catch(error => {
          console.error('Error during Telegram WebApp initialization:', error);
          dispatch({ type: 'SET_INITIALIZED', isInitialized: true, telegramWebAppAvailable: false });
        });
      } catch (error) {
        console.error('Error during game initialization:', error);
        // App continues to work even if Telegram init fails
      }
    };

    initializeGame();
  }, []);

  // Auto-save game state (safely)
  useEffect(() => {
    if (state.isInitialized) {
      safeSaveToLocalStorage('telegram-tap-game', state);
    }
  }, [state, state.isInitialized]);

  // Energy regeneration (safely) - FIXED: Faster regeneration rate
  useEffect(() => {
    if (!state.isInitialized) return;

    const interval = setInterval(() => {
      try {
        if (state.energy < state.maxEnergy) {
          dispatch({ type: 'RESTORE_ENERGY' });
        }
      } catch (error) {
        console.error('Error in energy regeneration:', error);
      }
    }, 10000); // Restore energy every 10 seconds (FIXED: was 60000)

    return () => clearInterval(interval);
  }, [state.energy, state.maxEnergy, state.isInitialized]);

  // Auto level up (safely)
  useEffect(() => {
    if (!state.isInitialized) return;

    try {
      if (state.experience >= state.experienceToNext) {
        dispatch({ type: 'LEVEL_UP' });
      }
    } catch (error) {
      console.error('Error in auto level up:', error);
    }
  }, [state.experience, state.experienceToNext, state.isInitialized]);

  // Boost expiry check (safely)
  useEffect(() => {
    if (!state.isInitialized) return;

    const interval = setInterval(() => {
      try {
        dispatch({ type: 'CHECK_BOOST_EXPIRY' });
      } catch (error) {
        console.error('Error checking boost expiry:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isInitialized]);

  // Daily reset check (safely) - FIXED: Check for daily task reset
  useEffect(() => {
    if (!state.isInitialized) return;

    try {
      console.log('Checking daily reset...');

      // Check daily reset on initialization
      dispatch({ type: 'CHECK_DAILY_RESET' });

      // Small delay to ensure state is updated, then check attendance
      setTimeout(() => {
        const today = new Date().toDateString();
        const attendanceTask = state.tasks.find(t => t.id === 'daily-attendance');
        console.log('Daily attendance task:', attendanceTask);
        console.log('Last login date:', state.lastLoginDate);
        console.log('Today:', today);

        if (attendanceTask && !attendanceTask.completed) {
          console.log('Auto-claiming daily attendance...');
          dispatch({ type: 'CLAIM_DAILY_ATTENDANCE' });
        }
      }, 100);
    } catch (error) {
      console.error('Error in daily reset check:', error);
    }
  }, [state.isInitialized]);

  // FIXED: Additional daily check on state changes
  useEffect(() => {
    if (!state.isInitialized) return;

    const today = new Date().toDateString();
    if (state.lastLoginDate !== today) {
      console.log('Date changed, triggering daily reset');
      dispatch({ type: 'CHECK_DAILY_RESET' });
    }
  }, [state.lastLoginDate, state.isInitialized]);

  // Show brief loading only during hydration mismatch (removed blocking loading screen)

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
