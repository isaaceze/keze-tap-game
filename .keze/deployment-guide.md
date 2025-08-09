# 🚀 Complete Deployment Guide for Keze Tap Game

## Overview
This guide will help you deploy the complete Keze Tap Game ecosystem including:
- ✅ Frontend (Already deployed on Netlify)
- 🤖 Telegram Bot
- 🖥️ Backend API Server
- 📊 Database (MongoDB)
- 🔐 Security & Anti-Cheat

---

## Part 1: Database Setup (MongoDB)

### Option A: MongoDB Atlas (Recommended for Production)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free account
   - Create a new cluster (Free tier is sufficient for testing)

2. **Configure Database**
   - Create database: `keze-tap-game`
   - Create user with read/write permissions
   - Get connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/keze-tap-game`)

### Option B: Local MongoDB (Development)

```bash
# Install MongoDB locally
# macOS with Homebrew:
brew install mongodb-community

# Ubuntu:
sudo apt-get install mongodb

# Start MongoDB
mongod

# Connection string: mongodb://localhost:27017/keze-tap-game
```

---

## Part 2: Backend Server Deployment

### Option A: Railway (Recommended)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy Backend**
   ```bash
   cd telegram-tap-game/server
   railway init
   railway add
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set TELEGRAM_BOT_TOKEN=your_bot_token
   railway variables set MONGODB_URI=your_mongodb_connection_string
   railway variables set FRONTEND_URL=https://same-slolhk4zlwi-latest.netlify.app
   railway variables set GAME_URL=https://same-slolhk4zlwi-latest.netlify.app
   railway variables set JWT_SECRET=your-secret-key
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Option B: Heroku

1. **Install Heroku CLI and login**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   cd telegram-tap-game/server
   heroku create keze-tap-game-api
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set TELEGRAM_BOT_TOKEN=your_bot_token
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   heroku config:set FRONTEND_URL=https://same-slolhk4zlwi-latest.netlify.app
   heroku config:set GAME_URL=https://same-slolhk4zlwi-latest.netlify.app
   heroku config:set JWT_SECRET=your-secret-key
   ```

4. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial backend deployment"
   heroku git:remote -a keze-tap-game-api
   git push heroku main
   ```

### Option C: VPS/Dedicated Server

1. **Install Node.js and PM2**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   npm install -g pm2
   ```

2. **Clone and Setup**
   ```bash
   git clone https://github.com/your-repo/telegram-tap-game.git
   cd telegram-tap-game/server
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   nano .env
   ```

4. **Start with PM2**
   ```bash
   pm2 start server.js --name "keze-game-api"
   pm2 startup
   pm2 save
   ```

---

## Part 3: Telegram Bot Setup

### 1. Create Bot with BotFather

1. **Message @BotFather on Telegram**
2. **Send `/newbot`**
3. **Choose name**: `Keze Tap Game`
4. **Choose username**: `keze_tap_game_bot` (must be unique)
5. **Save the bot token**: `123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### 2. Configure Bot Settings

```bash
# Send to @BotFather:
/setcommands

# Then send this list:
start - 🎮 Start playing Keze Tap Game
stats - 📊 View your game statistics
leaderboard - 🏆 See top players
help - ❓ Get help and information
```

### 3. Set Bot Description

```bash
# Send to @BotFather:
/setdescription

# Description:
🪙 Keze Tap Game - Earn coins by tapping!

Tap to earn KEZE coins, complete daily tasks, invite friends for bonuses, and play exciting games to win rare TON coins!

🎯 Features:
• Tap-to-earn mechanics
• Daily tasks & achievements
• Friend referral system
• Exciting gambling games
• Future token trading

Start earning now and be ready for exchange listing!
```

### 4. Set Bot About

```bash
# Send to @BotFather:
/setabouttext

# About:
🎮 The ultimate Telegram tap-to-earn game! Earn KEZE coins and rare TON coins.
```

---

## Part 4: Frontend Integration

### Update Frontend to Connect to Backend

1. **Create API Configuration**
   ```javascript
   // Add to src/lib/api.ts
   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-url.com/api';

   export const apiClient = {
     async get(endpoint) {
       const response = await fetch(`${API_BASE_URL}${endpoint}`);
       return response.json();
     },

     async post(endpoint, data) {
       const response = await fetch(`${API_BASE_URL}${endpoint}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(data)
       });
       return response.json();
     }
   };
   ```

2. **Update Game Context to Use Backend**
   ```javascript
   // In gameContext.tsx, add backend sync
   useEffect(() => {
     if (state.userId) {
       syncWithBackend();
     }
   }, [state.userId]);

   const syncWithBackend = async () => {
     try {
       const userData = await apiClient.get(`/user/${state.userId}`);
       dispatch({ type: 'LOAD_GAME', state: userData });
     } catch (error) {
       console.error('Backend sync failed:', error);
     }
   };
   ```

---

## Part 5: Security & Anti-Cheat

### 1. Rate Limiting
- ✅ Already implemented in backend
- Limits: 100 requests per 15 minutes, 30 game actions per minute

### 2. Action Validation
- ✅ Server-side validation for all game actions
- ✅ Minimum time intervals between taps
- ✅ Energy consumption validation

### 3. Monitoring & Alerts

```javascript
// Add to server.js for monitoring
const monitorSuspiciousActivity = async () => {
  const suspiciousUsers = await GameAction.aggregate([
    { $match: { timestamp: { $gte: new Date(Date.now() - 60000) } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 50 } } }
  ]);

  for (const user of suspiciousUsers) {
    console.warn(`Suspicious activity detected: User ${user._id}`);
    // Auto-ban or flag for review
  }
};

setInterval(monitorSuspiciousActivity, 60000); // Check every minute
```

---

## Part 6: Testing & Launch

### 1. Testing Checklist

- [ ] Bot responds to `/start` command
- [ ] Game loads in Telegram WebApp
- [ ] Tapping works and syncs with backend
- [ ] Referral system works
- [ ] Games function correctly
- [ ] Energy regeneration works
- [ ] Level progression works
- [ ] Anti-cheat measures activate

### 2. Load Testing

```bash
# Install Artillery
npm install -g artillery

# Create test script (artillery-test.yml)
config:
  target: 'https://your-backend-url.com'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Tap test"
    requests:
      - post:
          url: "/api/tap"
          json:
            telegramId: 123456789
            taps: 1

# Run test
artillery run artillery-test.yml
```

### 3. Monitoring Setup

```bash
# Backend health monitoring
curl https://your-backend-url.com/api/health

# Database monitoring
curl https://your-backend-url.com/api/admin/stats
```

---

## Part 7: Marketing & Growth

### 1. Bot Directory Listings
- Submit to @BotList
- Submit to @Bots
- Submit to Telegram bot directories

### 2. Social Media
- Create Twitter account
- Join Telegram gaming groups
- Post in crypto communities

### 3. Influencer Outreach
- Contact crypto influencers
- Gaming content creators
- Telegram channel owners

---

## Part 8: Maintenance & Updates

### 1. Regular Tasks
- Monitor server performance
- Check for suspicious activity
- Update game parameters
- Add new features

### 2. Database Backups
```bash
# MongoDB backup
mongodump --uri="mongodb+srv://..." --out ./backups/

# Restore
mongorestore --uri="mongodb+srv://..." ./backups/
```

### 3. Server Updates
```bash
# Update dependencies
npm audit fix

# Restart with PM2
pm2 restart keze-game-api

# View logs
pm2 logs keze-game-api
```

---

## Quick Setup Summary

```bash
# 1. Setup backend
cd server
npm install
cp .env.example .env
# Edit .env with your values
npm start

# 2. Create Telegram bot with @BotFather
# 3. Deploy backend to Railway/Heroku
# 4. Update frontend with backend URL
# 5. Test everything
# 6. Launch! 🚀
```

## Support

If you need help with any step:
1. Check the logs for errors
2. Verify all environment variables
3. Test API endpoints directly
4. Check Telegram bot token validity

Your Keze Tap Game is ready for thousands of players! 🎉
