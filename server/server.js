const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Game action rate limiting (more strict)
const gameActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 game actions per minute
  message: 'Game action rate limit exceeded'
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/keze-tap-game', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  telegramId: { type: Number, unique: true, required: true },
  username: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  coins: { type: Number, default: 0 },
  tonCoins: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  tapsCount: { type: Number, default: 0 },
  energy: { type: Number, default: 1000 },
  lastEnergyUpdate: { type: Date, default: Date.now },
  referralCode: { type: String, unique: true },
  referredBy: { type: Number },
  referrals: [{ type: Number }],
  completedTasks: [{ type: String }],
  dailyStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: Date.now },
  totalEarnings: { type: Number, default: 0 },
  gameStats: {
    spinsWon: { type: Number, default: 0 },
    treasuresFound: { type: Number, default: 0 },
    coinsFlipped: { type: Number, default: 0 },
    totalStaked: { type: Number, default: 0 }
  },
  banned: { type: Boolean, default: false },
  lastActionTime: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Game Action Schema (for anti-cheat)
const gameActionSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  action: { type: String, required: true }, // 'tap', 'spin', 'treasure', 'flip'
  amount: { type: Number, required: true },
  result: { type: Object },
  timestamp: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false }
});

const GameAction = mongoose.model('GameAction', gameActionSchema);

// Telegram Bot Setup
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Bot Commands
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const referralCode = match[1].trim();

  try {
    let user = await User.findOne({ telegramId: userId });

    if (!user) {
      // Create new user
      user = new User({
        telegramId: userId,
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        referralCode: userId.toString()
      });

      // Handle referral
      if (referralCode && referralCode !== userId.toString()) {
        const referrer = await User.findOne({ referralCode });
        if (referrer) {
          user.referredBy = referrer.telegramId;
          referrer.referrals.push(userId);
          referrer.coins += 1000; // Referral bonus
          referrer.totalEarnings += 1000;
          await referrer.save();

          // Give bonus to new user too
          user.coins += 500;
          user.totalEarnings += 500;
        }
      }

      await user.save();
    }

    const keyboard = {
      inline_keyboard: [[
        { text: '🎮 Play Keze Tap Game', web_app: { url: process.env.GAME_URL || 'https://keze.bissols.com' } }
      ]]
    };

    await bot.sendMessage(chatId,
      `🪙 Welcome to Keze Tap Game!\n\n` +
      `Tap to earn KEZE coins, complete tasks, and invite friends!\n` +
      `Play exciting games to win more coins and rare TON coins!\n\n` +
      `💰 Your KEZE coins: ${user.coins.toLocaleString()}\n` +
      `⚡ Your TON coins: ${user.tonCoins.toLocaleString()}\n` +
      `📈 Level: ${user.level}\n\n` +
      `Your coins will be tradeable when we list on exchanges!`,
      { reply_markup: keyboard }
    );
  } catch (error) {
    console.error('Start command error:', error);
    bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
  }
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      return bot.sendMessage(chatId, 'Please start the game first with /start');
    }

    const referralEarnings = user.referrals.length * 1000;

    await bot.sendMessage(chatId,
      `📊 Your Keze Tap Game Stats:\n\n` +
      `🪙 KEZE Coins: ${user.coins.toLocaleString()}\n` +
      `⚡ TON Coins: ${user.tonCoins.toLocaleString()}\n` +
      `📈 Level: ${user.level}\n` +
      `👆 Total Taps: ${user.tapsCount.toLocaleString()}\n` +
      `👥 Friends Invited: ${user.referrals.length}\n` +
      `💰 Total Earned: ${user.totalEarnings.toLocaleString()}\n` +
      `🔥 Daily Streak: ${user.dailyStreak}\n\n` +
      `🎰 Game Stats:\n` +
      `🎲 Spins Won: ${user.gameStats.spinsWon}\n` +
      `🏆 Treasures Found: ${user.gameStats.treasuresFound}\n` +
      `🪙 Coins Flipped: ${user.gameStats.coinsFlipped}\n` +
      `💸 Total Staked: ${user.gameStats.totalStaked.toLocaleString()}`
    );
  } catch (error) {
    console.error('Stats command error:', error);
    bot.sendMessage(chatId, 'Error retrieving stats. Please try again.');
  }
});

bot.onText(/\/leaderboard/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const topUsers = await User.find({ banned: false })
      .sort({ totalEarnings: -1 })
      .limit(10)
      .select('firstName lastName username totalEarnings level');

    let leaderboard = '🏆 TOP KEZE EARNERS\n\n';

    topUsers.forEach((user, index) => {
      const name = user.firstName || user.username || 'Anonymous';
      const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
      leaderboard += `${medal} ${name} - ${user.totalEarnings.toLocaleString()} KEZE (Lv.${user.level})\n`;
    });

    await bot.sendMessage(chatId, leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    bot.sendMessage(chatId, 'Error loading leaderboard. Please try again.');
  }
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `🎮 KEZE TAP GAME HELP\n\n` +
    `Commands:\n` +
    `/start - Start playing and earn KEZE coins\n` +
    `/stats - View your statistics\n` +
    `/leaderboard - Top players\n` +
    `/help - Show this help message\n\n` +
    `🪙 TAP to earn KEZE coins!\n` +
    `🎯 Complete daily tasks for bonuses!\n` +
    `👥 Invite friends for referral rewards!\n` +
    `🎰 Play games to win big!\n` +
    `💎 Trade coins on exchanges soon!`
  );
});

// API Endpoints

// Get user data
app.get('/api/user/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    let user = await User.findOne({ telegramId: parseInt(telegramId) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update energy based on time passed
    const now = new Date();
    const timeDiff = (now - user.lastEnergyUpdate) / 1000 / 60; // minutes
    const maxEnergy = 1000 + (user.level - 1) * 100;
    const energyToAdd = Math.floor(timeDiff * 2); // 2 energy per minute

    user.energy = Math.min(maxEnergy, user.energy + energyToAdd);
    user.lastEnergyUpdate = now;
    await user.save();

    res.json({
      coins: user.coins,
      tonCoins: user.tonCoins,
      level: user.level,
      experience: user.experience,
      energy: user.energy,
      maxEnergy,
      tapsCount: user.tapsCount,
      totalEarnings: user.totalEarnings,
      referrals: user.referrals.length,
      gameStats: user.gameStats
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Tap action with anti-cheat
app.post('/api/tap', gameActionLimiter, async (req, res) => {
  try {
    const { telegramId, taps } = req.body;

    if (!telegramId || !taps || taps < 1 || taps > 10) {
      return res.status(400).json({ error: 'Invalid tap data' });
    }

    const user = await User.findOne({ telegramId });
    if (!user || user.banned) {
      return res.status(404).json({ error: 'User not found or banned' });
    }

    if (user.energy < taps) {
      return res.status(400).json({ error: 'Insufficient energy' });
    }

    // Anti-cheat: Check time between actions
    const now = new Date();
    const timeSinceLastAction = (now - user.lastActionTime) / 1000;
    if (timeSinceLastAction < 0.1) { // Minimum 100ms between taps
      return res.status(429).json({ error: 'Tapping too fast' });
    }

    const coinsPerTap = Math.floor(user.level / 3) + 1;
    const coinsEarned = taps * coinsPerTap;

    user.coins += coinsEarned;
    user.tapsCount += taps;
    user.energy -= taps;
    user.experience += taps;
    user.totalEarnings += coinsEarned;
    user.lastActionTime = now;

    // Level up check
    const experienceToNext = user.level * 1000;
    if (user.experience >= experienceToNext) {
      user.level += 1;
      user.experience = 0;
      user.energy = 1000 + (user.level - 1) * 100; // Restore energy on level up
    }

    await user.save();

    // Log action for monitoring
    await new GameAction({
      userId: telegramId,
      action: 'tap',
      amount: taps,
      result: { coinsEarned },
      verified: true
    }).save();

    res.json({
      success: true,
      coins: user.coins,
      level: user.level,
      experience: user.experience,
      energy: user.energy,
      tapsCount: user.tapsCount
    });
  } catch (error) {
    console.error('Tap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Game actions (spin, treasure, flip)
app.post('/api/game/:action', gameActionLimiter, async (req, res) => {
  try {
    const { action } = req.params;
    const { telegramId, stake, choice } = req.body;

    if (!['spin', 'treasure', 'flip'].includes(action)) {
      return res.status(400).json({ error: 'Invalid game action' });
    }

    const user = await User.findOne({ telegramId });
    if (!user || user.banned) {
      return res.status(404).json({ error: 'User not found or banned' });
    }

    if (user.coins < stake || stake < 100) {
      return res.status(400).json({ error: 'Insufficient coins or invalid stake' });
    }

    let result = { coins: 0, won: false };

    // Game logic
    if (action === 'spin') {
      const random = Math.random();
      if (random < 0.02) { // 2% TON coins
        result = { coins: stake * 10, tonCoins: Math.floor(stake / 1000), won: true };
        user.tonCoins += result.tonCoins;
        user.gameStats.spinsWon += 1;
      } else if (random < 0.1) { // 8% big win
        result = { coins: stake * 5, tonCoins: 0, won: true };
        user.gameStats.spinsWon += 1;
      } else if (random < 0.3) { // 20% good win
        result = { coins: stake * 2, tonCoins: 0, won: true };
        user.gameStats.spinsWon += 1;
      } else if (random < 0.5) { // 20% small win
        result = { coins: Math.floor(stake * 1.5), tonCoins: 0, won: true };
        user.gameStats.spinsWon += 1;
      } else if (random < 0.7) { // 20% break even
        result = { coins: stake, tonCoins: 0, won: false };
      }
    } else if (action === 'treasure') {
      const random = Math.random();
      if (random < 0.4) { // 40% find treasure
        const multiplier = Math.random() < 0.1 ? 10 : Math.random() < 0.3 ? 5 : 3;
        result = { coins: stake * multiplier, won: true };
        user.gameStats.treasuresFound += 1;
      }
    } else if (action === 'flip') {
      const flip = Math.random() < 0.5 ? 'heads' : 'tails';
      const won = flip === choice;
      result = { coins: won ? stake * 2 : 0, won, flip, choice };
      if (won) user.gameStats.coinsFlipped += 1;
    }

    user.coins = user.coins - stake + result.coins;
    user.gameStats.totalStaked += stake;
    if (result.won && result.coins > stake) {
      user.totalEarnings += (result.coins - stake);
    }

    await user.save();

    // Log action
    await new GameAction({
      userId: telegramId,
      action,
      amount: stake,
      result,
      verified: true
    }).save();

    res.json({
      success: true,
      result,
      coins: user.coins,
      tonCoins: user.tonCoins,
      gameStats: user.gameStats
    });
  } catch (error) {
    console.error('Game action error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin endpoints for monitoring
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastActionTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const totalCoins = await User.aggregate([{ $group: { _id: null, total: { $sum: '$totalEarnings' } } }]);
    const totalTaps = await User.aggregate([{ $group: { _id: null, total: { $sum: '$tapsCount' } } }]);

    res.json({
      totalUsers,
      activeUsers,
      totalCoinsEarned: totalCoins[0]?.total || 0,
      totalTaps: totalTaps[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Keze Tap Game server running on port ${PORT}`);
  console.log(`🤖 Telegram bot is ${process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'NOT configured'}`);
});

module.exports = app;
