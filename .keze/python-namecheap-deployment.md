# 🐍 Python Backend Deployment on Namecheap Shared Hosting

## Why Python is Better for Shared Hosting

✅ **Better Compatibility**: Most shared hosts support Python
✅ **CGI/WSGI Support**: Standard on shared hosting
✅ **Same Features**: 100% feature parity with Node.js version
✅ **Easier Deployment**: No special Node.js setup required
✅ **Better Resource Usage**: More efficient on shared hosting

---

## Complete Feature Conversion

### ✅ Everything Converted from Node.js:
- **Express → Flask**: All routes and middleware
- **MongoDB**: Same database, same schema
- **Telegram Bot**: Full bot integration with python-telegram-bot
- **Anti-cheat**: Rate limiting, validation, monitoring
- **Game Logic**: Spinner, Treasure Hunt, Coin Flip
- **API Endpoints**: Identical structure, same responses
- **Security**: CORS, input validation, error handling

### 🎯 Zero Changes Required:
- **Frontend**: Works exactly the same
- **Database**: Same MongoDB structure
- **API Calls**: Same endpoints and responses
- **Telegram Integration**: Same bot commands

---

## Deployment Strategy Options

### Option 1: Python on Namecheap + External Database (Recommended)
- **Backend**: Python Flask on Namecheap
- **Database**: MongoDB Atlas (free tier)
- **Bot**: Can run on same server or separately

### Option 2: Full External (Easiest)
- **Backend**: Python on Railway/Heroku
- **Frontend**: Static files on Namecheap
- **Database**: MongoDB Atlas

### Option 3: Hybrid with VPS
- **Frontend**: Namecheap
- **Backend**: Cheap VPS ($5/month)
- **Database**: MongoDB Atlas

---

## Option 1: Deploy Python Backend on Namecheap

### Step 1: Check Python Support

1. **Login to cPanel**
2. **Look for "Python App" or "Setup Python App"**
3. **Check Python version** (3.8+ required)

If available, proceed with Namecheap deployment.

### Step 2: Prepare Files

```bash
cd telegram-tap-game/server-python

# Create deployment package
zip -r keze-backend.zip . -x "*.pyc" "__pycache__/*" ".env"
```

### Step 3: Upload and Setup

1. **Upload via cPanel File Manager**
   - Navigate to your domain folder or subdomain
   - Upload `keze-backend.zip`
   - Extract files

2. **Setup Python App in cPanel**
   - Go to "Python App" section
   - Create New App:
     - **Python Version**: 3.8+ (latest available)
     - **App Root**: `/python/keze-backend/`
     - **App URL**: `api.keze.bissols.com` or `/api`
     - **Startup File**: `wsgi.py`

3. **Install Dependencies**
   ```bash
   # In Python app terminal or SSH
   cd /home/username/python/keze-backend/
   pip install -r requirements.txt
   ```

### Step 4: Environment Configuration

Create `.env` file in your Python app directory:
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token

# Database (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/keze-tap-game

# Server Config
PORT=5000
FLASK_ENV=production
FLASK_DEBUG=False

# URLs
FRONTEND_URL=https://keze.bissols.com
GAME_URL=https://keze.bissols.com

# Security
SECRET_KEY=your-super-secret-key
```

### Step 5: Setup Database (MongoDB Atlas)

1. **Create MongoDB Atlas Account** (free)
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create cluster (free tier: M0)
   - Create database user
   - Whitelist IP addresses (0.0.0.0/0 for shared hosting)

2. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/keze-tap-game
   ```

### Step 6: Test the Backend

```bash
# Test API endpoints
curl https://keze.bissols.com/api/health
# Should return: {"status": "OK", ...}

curl https://keze.bissols.com/api/admin/stats
# Should return: {"totalUsers": 0, ...}
```

---

## Option 2: External Deployment (Railway/Heroku)

### Railway Deployment (Recommended)
```bash
cd telegram-tap-game/server-python

# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables
railway variables set TELEGRAM_BOT_TOKEN=your_token
railway variables set MONGODB_URI=your_mongo_uri
railway variables set FRONTEND_URL=https://keze.bissols.com
railway variables set GAME_URL=https://keze.bissols.com
```

### Heroku Deployment
```bash
cd telegram-tap-game/server-python

# Create Procfile
echo "web: gunicorn wsgi:application" > Procfile

# Deploy
heroku create keze-game-python-api
git init
git add .
git commit -m "Python backend deployment"
heroku git:remote -a keze-game-python-api
git push heroku main

# Set environment variables
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set MONGODB_URI=your_mongo_uri
```

---

## Frontend Integration

### Update API Configuration

No matter which deployment option you choose, update your frontend:

```bash
cd telegram-tap-game

# Create or edit .env.local
echo "NEXT_PUBLIC_API_URL=https://your-python-backend-url.com/api" > .env.local

# Rebuild frontend
npm run build

# Upload 'out' folder to Namecheap public_html
```

---

## Telegram Bot Setup

### Option A: Integrated Bot (Same Server)
The bot runs as part of the Flask app. Just set the `TELEGRAM_BOT_TOKEN` environment variable.

### Option B: Separate Bot Process
Run the bot separately for better reliability:

```bash
# On your server or VPS
cd server-python
python telegram_bot.py
```

### Bot Configuration with @BotFather

1. **Create Bot**
   ```
   /newbot
   Name: Keze Tap Game
   Username: keze_tap_game_bot
   ```

2. **Set Commands**
   ```
   /setcommands

   start - 🎮 Start playing Keze Tap Game
   stats - 📊 View your game statistics
   leaderboard - 🏆 See top players
   help - ❓ Get help and information
   ```

3. **Set WebApp**
   ```
   /setmenubuttondefault

   Text: 🎮 Play Game
   WebApp URL: https://keze.bissols.com
   ```

---

## Database Schema (Same as Node.js)

The Python backend uses the exact same MongoDB schema:

```javascript
// Users Collection
{
  telegramId: Number,
  username: String,
  firstName: String,
  lastName: String,
  coins: Number,
  tonCoins: Number,
  level: Number,
  experience: Number,
  tapsCount: Number,
  energy: Number,
  lastEnergyUpdate: Date,
  referralCode: String,
  referredBy: Number,
  referrals: [Number],
  completedTasks: [String],
  dailyStreak: Number,
  lastLoginDate: Date,
  totalEarnings: Number,
  gameStats: {
    spinsWon: Number,
    treasuresFound: Number,
    coinsFlipped: Number,
    totalStaked: Number
  },
  banned: Boolean,
  lastActionTime: Date,
  createdAt: Date,
  updatedAt: Date
}

// Game Actions Collection
{
  userId: Number,
  action: String,
  amount: Number,
  result: Object,
  timestamp: Date,
  verified: Boolean
}
```

---

## API Endpoints (Identical to Node.js)

All endpoints work exactly the same:

```bash
# User Management
GET  /api/user/<telegram_id>     # Get user data
POST /api/user/create            # Create new user

# Game Actions
POST /api/tap                    # Handle tap action
POST /api/game/spin              # Spinner game
POST /api/game/treasure          # Treasure hunt
POST /api/game/flip              # Coin flip

# Social Features
GET  /api/leaderboard           # Get leaderboard

# Admin & Monitoring
GET  /api/admin/stats           # Admin statistics
GET  /api/health                # Health check
```

---

## Testing Your Deployment

### 1. Backend API Tests
```bash
# Health check
curl https://keze.bissols.com/api/health

# Create test user
curl -X POST https://keze.bissols.com/api/user/create \
  -H "Content-Type: application/json" \
  -d '{"telegramId": 123456789, "username": "testuser"}'

# Test tap
curl -X POST https://keze.bissols.com/api/tap \
  -H "Content-Type: application/json" \
  -d '{"telegramId": 123456789, "taps": 1}'

# Test game
curl -X POST https://keze.bissols.com/api/game/spin \
  -H "Content-Type: application/json" \
  -d '{"telegramId": 123456789, "stake": 100}'
```

### 2. Frontend Integration Test
1. Visit your domain
2. Open browser dev tools
3. Try tapping - should see API calls to your Python backend
4. Check console for any CORS errors

### 3. Telegram Bot Test
1. Find your bot on Telegram
2. Send `/start` - should get welcome message with WebApp button
3. Send `/stats` - should show user statistics
4. Tap "Play Game" button - should open your game

---

## Performance Optimization

### 1. Database Indexing
```python
# Add to your Python app startup
users_collection.create_index("telegramId", unique=True)
users_collection.create_index("lastActionTime")
users_collection.create_index("totalEarnings")
game_actions_collection.create_index("userId")
game_actions_collection.create_index("timestamp")
```

### 2. Caching (if needed)
```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/api/leaderboard')
@cache.cached(timeout=300)  # Cache for 5 minutes
def get_leaderboard():
    # ... existing code
```

### 3. Connection Pooling
```python
# MongoDB connection with pooling
client = MongoClient(
    os.getenv('MONGODB_URI'),
    maxPoolSize=50,
    wtimeout=2500
)
```

---

## Security Enhancements

### 1. Input Validation
```python
from flask import request
from marshmallow import Schema, fields, ValidationError

class TapSchema(Schema):
    telegramId = fields.Integer(required=True, validate=lambda x: x > 0)
    taps = fields.Integer(required=True, validate=lambda x: 1 <= x <= 10)

@app.route('/api/tap', methods=['POST'])
def tap_action():
    schema = TapSchema()
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400
    # ... rest of the function
```

### 2. Rate Limiting by User
```python
@limiter.limit("30 per minute", key_func=lambda: request.json.get('telegramId', ''))
def tap_action():
    # ... existing code
```

### 3. Anti-Cheat Monitoring
```python
def monitor_suspicious_activity():
    """Check for suspicious user activity"""
    suspicious_users = game_actions_collection.aggregate([
        {"$match": {"timestamp": {"$gte": datetime.now() - timedelta(minutes=1)}}},
        {"$group": {"_id": "$userId", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gt": 50}}}
    ])

    for user in suspicious_users:
        logger.warning(f"Suspicious activity: User {user['_id']}")
        # Auto-ban or flag for review
        users_collection.update_one(
            {"telegramId": user["_id"]},
            {"$set": {"banned": True}}
        )
```

---

## Monitoring & Maintenance

### 1. Logging Setup
```python
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    file_handler = RotatingFileHandler(
        'logs/keze-game.log',
        maxBytes=10240,
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Keze Tap Game startup')
```

### 2. Health Monitoring
```python
@app.route('/api/monitor')
def monitor():
    checks = {
        'database': db is not None,
        'users_count': users_collection.count_documents({}),
        'active_users': users_collection.count_documents({
            "lastActionTime": {"$gte": datetime.now() - timedelta(hours=24)}
        }),
        'bot_configured': telegram_bot is not None
    }
    return jsonify(checks)
```

### 3. Backup Script
```python
# backup.py
import subprocess
from datetime import datetime

def backup_database():
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f"backup_keze_game_{timestamp}.gz"

    command = [
        'mongodump',
        '--uri', os.getenv('MONGODB_URI'),
        '--archive', backup_file,
        '--gzip'
    ]

    subprocess.run(command)
    print(f"Backup created: {backup_file}")

if __name__ == '__main__':
    backup_database()
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Module not found" errors
```bash
# Make sure all dependencies are installed
pip install -r requirements.txt

# Check Python path
python -c "import sys; print(sys.path)"
```

#### Issue 2: Database connection fails
```python
# Test MongoDB connection
from pymongo import MongoClient
client = MongoClient('your_connection_string')
print(client.admin.command('ismaster'))
```

#### Issue 3: CORS errors
```python
# Update CORS configuration
CORS(app, origins=['https://keze.bissols.com'], supports_credentials=True)
```

#### Issue 4: Telegram bot not responding
```bash
# Test bot token
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
```

#### Issue 5: 500 Internal Server Error
```bash
# Check error logs
tail -f logs/keze-game.log

# Enable debug mode temporarily
export FLASK_DEBUG=True
```

---

## Cost Comparison

### Namecheap + Python Backend
- **Namecheap Hosting**: $2-10/month
- **MongoDB Atlas**: Free tier (500MB)
- **Total**: $2-10/month

### External Python Hosting
- **Railway**: Free tier → $5/month
- **Heroku**: Free tier → $7/month
- **VPS**: $5-20/month
- **MongoDB Atlas**: Free tier

---

## Migration from Node.js

### Step 1: Backup Current Data
```bash
# Export existing data if any
mongodump --uri="your_current_mongodb_uri" --out=backup/
```

### Step 2: Deploy Python Backend
Follow the deployment steps above.

### Step 3: Update Frontend
```bash
# Change API URL
NEXT_PUBLIC_API_URL=https://your-python-backend.com/api

# Rebuild and redeploy
npm run build
# Upload to Namecheap
```

### Step 4: Test Everything
1. All API endpoints work
2. Telegram bot responds
3. Games function correctly
4. Data persists correctly

### Step 5: Switch Traffic
Update your domain DNS or reverse proxy to point to the Python backend.

---

## Summary

✅ **Complete Python conversion** with 100% feature parity
✅ **Better shared hosting compatibility** than Node.js
✅ **Same database schema** - no data migration needed
✅ **Identical API endpoints** - frontend works unchanged
✅ **Easier deployment** on most shared hosting providers
✅ **Better resource usage** and performance
✅ **Same security features** and anti-cheat measures

**Recommended deployment**: Python backend on Namecheap + MongoDB Atlas for a professional, scalable setup at minimal cost.

Your Keze Tap Game will run perfectly with the Python backend! 🚀🐍
