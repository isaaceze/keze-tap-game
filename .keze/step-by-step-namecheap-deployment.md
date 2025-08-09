# 🚀 Step-by-Step Namecheap Deployment Guide

## Complete Deployment Process for Keze Tap Game

**Time Required**: 30-45 minutes
**Cost**: $2-10/month (Namecheap) + $0 (MongoDB Atlas free tier)
**Result**: Fully functional Telegram tap game with backend

---

## Phase 1: Pre-Deployment Setup (15 minutes)

### Step 1: Create MongoDB Atlas Database (5 minutes)

1. **Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**

2. **Create Free Account**
   - Click "Try Free"
   - Sign up with your email
   - Verify email address

3. **Create Cluster**
   - Choose "M0 Sandbox" (FREE)
   - Select region closest to you
   - Cluster Name: `keze-tap-game`
   - Click "Create Cluster"

4. **Create Database User**
   - Go to "Database Access" → "Add New Database User"
   - Authentication Method: Password
   - Username: `keze-admin`
   - Password: Generate secure password (save it!)
   - User Privileges: "Read and write to any database"
   - Click "Add User"

5. **Configure Network Access**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

6. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Driver: Python, Version: 3.12 or later
   - Copy connection string:
   ```
   mongodb+srv://keze-admin:<password>@keze-tap-game.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - **Save this connection string - you'll need it!**

### Step 2: Create Telegram Bot (5 minutes)

1. **Open Telegram and find @BotFather**

2. **Create Your Bot**
   ```
   Send: /newbot
   BotFather: Alright, a new bot. How are we going to call it?
   Send: Keze Tap Game
   BotFather: Good. Now let's choose a username for your bot.
   Send: keze_tap_game_bot (or any available name ending with _bot)
   ```

3. **Save Bot Token**
   ```
   BotFather will send you a token like:
   123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

   🚨 SAVE THIS TOKEN - You'll need it for deployment!
   ```

4. **Configure Bot Commands**
   ```
   Send: /setcommands
   Select your bot

   Then send this list:
   start - 🎮 Start playing Keze Tap Game
   stats - 📊 View your game statistics
   leaderboard - 🏆 See top players
   help - ❓ Get help and information
   ```

5. **Set Bot Description**
   ```
   Send: /setdescription
   Select your bot

   Description:
   🪙 Keze Tap Game - The ultimate Telegram tap-to-earn game!

   Tap to earn KEZE coins, complete daily tasks, invite friends for bonuses, and play exciting games to win rare TON coins!

   Your coins will be tradeable when we list on exchanges!
   ```

### Step 3: Prepare Files for Upload (5 minutes)

1. **Create Deployment Package**
   ```bash
   cd telegram-tap-game/server-python

   # Create deployment folder
   mkdir deployment
   cp -r * deployment/
   cd deployment

   # Remove unnecessary files
   rm -rf __pycache__
   rm -f .env

   # Create .env file with your actual values
   cat > .env << 'EOF'
   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE

   # Database Configuration
   MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING_HERE

   # Server Configuration
   PORT=5000
   FLASK_ENV=production
   FLASK_DEBUG=False

   # URLs (replace with your domain)
   FRONTEND_URL=https://keze.bissols.com
   GAME_URL=https://keze.bissols.com

   # Security
   SECRET_KEY=your-super-secret-key-change-this
   EOF

   # Create zip file for upload
   zip -r keze-backend.zip . -x "*.pyc" "__pycache__/*"
   ```

2. **Edit .env with Your Values**
   - Replace `YOUR_BOT_TOKEN_HERE` with your Telegram bot token
   - Replace `YOUR_MONGODB_CONNECTION_STRING_HERE` with your MongoDB Atlas connection string
   - Replace `keze.bissols.com` with your actual domain

---

## Phase 2: Namecheap Setup (15 minutes)

### Step 4: Access Namecheap cPanel (2 minutes)

1. **Login to Namecheap**
   - Go to namecheap.com
   - Sign in to your account

2. **Access Hosting**
   - Go to "Hosting List"
   - Find your hosting account
   - Click "Manage"

3. **Open cPanel**
   - Click "cPanel" button
   - Wait for cPanel to load

### Step 5: Check Python Support (3 minutes)

1. **Look for Python App Manager**
   - In cPanel, search for "Python" or "Python App"
   - Look for "Setup Python App" or "Python Selector"

2. **If Python is Available:**
   - Note the available Python versions (need 3.8+)
   - Continue with this guide

3. **If Python is NOT Available:**
   - Contact Namecheap support to enable Python
   - Or use Alternative Option (see end of guide)

### Step 6: Upload Backend Files (5 minutes)

1. **Open File Manager**
   - In cPanel, click "File Manager"
   - Navigate to your domain folder (usually `public_html`)

2. **Create API Subdirectory**
   - Create new folder: `api`
   - Enter the `api` folder

3. **Upload Backend Files**
   - Click "Upload"
   - Select your `keze-backend.zip` file
   - Wait for upload to complete
   - Go back to File Manager

4. **Extract Files**
   - Right-click on `keze-backend.zip`
   - Select "Extract"
   - Extract to current directory
   - Delete the zip file after extraction

### Step 7: Setup Python Application (5 minutes)

1. **Open Python App Manager**
   - Go back to cPanel main page
   - Click "Setup Python App"

2. **Create New Python App**
   - Click "Create Application"
   - Python Version: Select 3.8+ (highest available)
   - Application Root: `/public_html/api/`
   - Application URL: Leave blank (will use domain.com/api/)
   - Application Startup File: `wsgi.py`
   - Application Entry Point: `application`

3. **Click "Create"**
   - Wait for application to be created
   - Note the application details

---

## Phase 3: Configuration (10 minutes)

### Step 8: Install Python Dependencies (5 minutes)

1. **Access Python App Terminal**
   - In Python App Manager, find your app
   - Click "Open Terminal" or SSH access

2. **Navigate to App Directory**
   ```bash
   cd public_html/api
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

   **If pip install fails, try:**
   ```bash
   pip3 install -r requirements.txt
   # or
   python -m pip install -r requirements.txt
   # or
   python3 -m pip install -r requirements.txt
   ```

4. **Verify Installation**
   ```bash
   python -c "import flask; print('Flask installed successfully')"
   python -c "import pymongo; print('PyMongo installed successfully')"
   ```

### Step 9: Configure Environment Variables (3 minutes)

1. **Edit .env File**
   - In File Manager, navigate to `/public_html/api/`
   - Click on `.env` file → "Edit"
   - Update with your actual values:

   ```env
   # Your actual bot token from BotFather
   TELEGRAM_BOT_TOKEN=123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

   # Your MongoDB Atlas connection string
   MONGODB_URI=mongodb+srv://keze-admin:yourpassword@keze-tap-game.xxxxx.mongodb.net/?retryWrites=true&w=majority

   # Your domain
   FRONTEND_URL=https://keze.bissols.com
   GAME_URL=https://keze.bissols.com

   # Generate a secret key
   SECRET_KEY=keze-game-secret-key-2024-change-this

   PORT=5000
   FLASK_ENV=production
   FLASK_DEBUG=False
   ```

2. **Save the file**

### Step 10: Configure URL Routing (2 minutes)

1. **Edit .htaccess**
   - In `/public_html/api/` directory
   - If `.htaccess` doesn't exist, create it
   - Add this content:

   ```apache
   RewriteEngine On

   # Route API calls to Python app
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ wsgi.py/$1 [QSA,L]

   # CORS headers
   Header always set Access-Control-Allow-Origin "*"
   Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
   Header always set Access-Control-Allow-Headers "Content-Type"

   # Security
   <Files ".env">
       Order allow,deny
       Deny from all
   </Files>
   ```

---

## Phase 4: Testing Backend (5 minutes)

### Step 11: Test API Endpoints (5 minutes)

1. **Test Health Check**
   ```bash
   curl https://keze.bissols.com/api/health
   ```

   **Expected Response:**
   ```json
   {
     "status": "OK",
     "timestamp": "2024-01-01T12:00:00",
     "database": "connected",
     "telegram_bot": "configured"
   }
   ```

2. **Test in Browser**
   - Visit: `https://keze.bissols.com/api/health`
   - Should see JSON response

3. **If API doesn't work:**
   - Check Python App status in cPanel
   - Check error logs in cPanel → "Errors"
   - Restart Python app

4. **Test User Creation**
   ```bash
   curl -X POST https://keze.bissols.com/api/user/create \
     -H "Content-Type: application/json" \
     -d '{"telegramId": 123456789, "username": "testuser"}'
   ```

5. **Test Tap Endpoint**
   ```bash
   curl -X POST https://keze.bissols.com/api/tap \
     -H "Content-Type: application/json" \
     -d '{"telegramId": 123456789, "taps": 1}'
   ```

---

## Phase 5: Update Frontend (5 minutes)

### Step 12: Update Frontend Configuration (3 minutes)

1. **Edit Frontend Environment**
   ```bash
   cd telegram-tap-game

   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=https://keze.bissols.com/api" > .env.local
   ```

2. **Rebuild Frontend**
   ```bash
   npm run build
   ```

### Step 13: Upload Updated Frontend (2 minutes)

1. **Upload to Namecheap**
   - In cPanel File Manager
   - Navigate to `public_html`
   - Delete old files (except `api` folder)
   - Upload all files from `out` folder
   - Or use FTP to upload

---

## Phase 6: Telegram Bot Integration (5 minutes)

### Step 14: Configure Bot WebApp (3 minutes)

1. **Message @BotFather**
   ```
   Send: /setmenubuttondefault
   Select your bot

   Text: 🎮 Play Keze Tap Game
   WebApp URL: https://keze.bissols.com
   ```

2. **Test Bot**
   - Find your bot in Telegram
   - Send `/start`
   - Should get welcome message with play button

### Step 15: Start Bot Service (2 minutes)

**Option A: Integrated Bot (Automatic)**
- Bot runs with Flask app
- No additional setup needed

**Option B: Separate Bot Process (More Reliable)**
```bash
# In SSH terminal
cd public_html/api
nohup python telegram_bot.py &
```

---

## Phase 7: Final Testing (5 minutes)

### Step 16: Complete End-to-End Test (5 minutes)

1. **Test Website**
   - Visit your domain
   - Should load the game
   - Try tapping - should work

2. **Test Telegram Integration**
   - Open your bot in Telegram
   - Send `/start`
   - Click "🎮 Play Keze Tap Game"
   - Game should open in Telegram WebApp

3. **Test Games**
   - Go to Games tab
   - Try Spinner, Treasure Hunt, Coin Flip
   - Should work without errors

4. **Test Backend Sync**
   - Tap coins in game
   - Send `/stats` to Telegram bot
   - Should show updated coin count

---

## Troubleshooting Common Issues

### Issue 1: Python App Won't Start
```bash
# Check Python app status in cPanel
# View error logs in cPanel → Error Logs
# Common fix:
pip install --upgrade pip
pip install -r requirements.txt
```

### Issue 2: Database Connection Failed
```bash
# Test MongoDB connection
python -c "
from pymongo import MongoClient
client = MongoClient('your_connection_string')
print(client.admin.command('ismaster'))
"
```

### Issue 3: CORS Errors
- Check `.htaccess` file in `/api/` folder
- Ensure CORS headers are set
- Update `FRONTEND_URL` in `.env`

### Issue 4: Bot Not Responding
```bash
# Test bot token
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
```

### Issue 5: API 404 Errors
- Check URL routing in `.htaccess`
- Ensure `wsgi.py` is executable
- Check Python app configuration

---

## Alternative Option: External Backend

**If Namecheap doesn't support Python:**

### Quick Railway Deployment
```bash
cd telegram-tap-game/server-python

# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up

# Set environment variables
railway variables set TELEGRAM_BOT_TOKEN=your_token
railway variables set MONGODB_URI=your_mongo_uri
railway variables set FRONTEND_URL=https://keze.bissols.com
```

### Update Frontend
```bash
# Update API URL to Railway
echo "NEXT_PUBLIC_API_URL=https://your-app.railway.app/api" > .env.local
npm run build
# Upload to Namecheap
```

---

## Success Checklist

✅ **MongoDB Atlas database created and accessible**
✅ **Telegram bot created with @BotFather**
✅ **Python backend uploaded to Namecheap**
✅ **Python dependencies installed**
✅ **Environment variables configured**
✅ **API endpoints responding correctly**
✅ **Frontend updated with correct API URL**
✅ **Telegram bot responds to commands**
✅ **WebApp opens in Telegram**
✅ **Game functions work end-to-end**

---

## Final Result

🎉 **Your Keze Tap Game is now live!**

- **Game URL**: `https://keze.bissols.com`
- **API URL**: `https://keze.bissols.com/api`
- **Telegram Bot**: Search for your bot username
- **Admin Stats**: `https://keze.bissols.com/api/admin/stats`

**Players can now:**
- Find your bot on Telegram
- Play the tap game
- Earn KEZE coins
- Play gambling games
- Invite friends for bonuses
- Track their progress

**Your costs:**
- Namecheap hosting: $2-10/month
- MongoDB Atlas: Free (500MB)
- **Total: $2-10/month for unlimited players!**

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review error logs in cPanel
3. Test each component individually
4. Ensure all environment variables are correct

**Your Keze Tap Game is production-ready and deployed! 🚀🎮**
