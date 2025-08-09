# 🏠 Complete Namecheap-Only Deployment Guide

## Everything on Namecheap: Frontend + Backend + Database

**No external services needed!** Deploy your complete Keze Tap Game entirely on Namecheap shared hosting.

**Total Monthly Cost**: $2-10 (just your Namecheap hosting)
**External Dependencies**: None!
**Database**: MySQL (included with hosting)
**Setup Time**: 45 minutes

---

## ✅ Requirements

- **Namecheap Shared Hosting** (any plan with Python support)
- **MySQL Database** (included with hosting)
- **cPanel Access** (included with hosting)
- **Your Domain** (keze.bissols.com - configured)

---

## Phase 1: Database Setup (10 minutes)

### Step 1: Create MySQL Database in cPanel

1. **Login to cPanel**
   - Go to Namecheap → Hosting List → Manage → cPanel

2. **Create Database**
   - Find "MySQL Databases" in cPanel
   - Database Name: `bisskhgv_keze_coins_db`
   - Click "Create Database"
   - **Note**: Full database name will be `bisskhgv_keze_coins_db`

3. **Create Database User**
   - Username: `bisskhgv_keze_bot_user`
   - Password: Generate strong password (save it!)
   - Click "Create User"
   - **Note**: Full username will be `bisskhgv_keze_bot_user`

4. **Add User to Database**
   - Select your user and database
   - Grant "ALL PRIVILEGES"
   - Click "Make Changes"

5. **Save Database Info**
   ```
   Database Name: bisskhgv_keze_coins_db
   Username: bisskhgv_keze_bot_user
   Password: your_generated_password
   Host: localhost
   Port: 3306
   ```

### Step 2: Test Database Connection

1. **Open phpMyAdmin** (in cPanel)
2. **Select your database**
3. **Run test query**:
   ```sql
   SELECT 1 as test;
   ```
4. **Should see result**: `test: 1`

---

## Phase 2: Telegram Bot Setup (5 minutes)

### Step 1: Create Bot with @BotFather

1. **Message @BotFather** on Telegram
2. **Create Bot**:
   ```
   /newbot
   Name: Keze Tap Game
   Username: kezeBot
   ```
3. **Save Token**: `123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### Step 2: Configure Bot

1. **Set Commands**:
   ```
   /setcommands

   start - 🎮 Start playing Keze Tap Game
   stats - 📊 View your game statistics
   leaderboard - 🏆 See top players
   help - ❓ Get help and information
   ```

2. **Set Description**:
   ```
   /setdescription

   🪙 Keze Tap Game - The ultimate Telegram tap-to-earn game!

   Tap to earn KEZE coins, complete daily tasks, invite friends for bonuses, and play exciting games to win rare TON coins!
   ```

---

## Phase 3: Backend Deployment (15 minutes)

### Step 1: Prepare Deployment Files

1. **Run Preparation Script**:
   ```bash
   cd telegram-tap-game
   ./deploy-to-namecheap.sh
   ```

2. **Enter Information**:
   - **Bot Token**: Your token from @BotFather
   - **Database Info**: Your MySQL connection details
   - **Domain**: keze.bissols.com

3. **Files Created**:
   - `deployment/keze-backend-ready.zip` (backend)
   - Updated `.env` with your settings

### Step 2: Create Subdomain

1. **cPanel Subdomains**
   - Go to "Subdomains" in cPanel
   - Create subdomain: `keze.bissols.com`
   - Document root: `/home/bisskhgv/keze.bissols.com/` (auto-created)

### Step 3: Upload Backend

1. **cPanel File Manager**
   - Navigate to `/home/bisskhgv/keze.bissols.com/` (your subdomain folder)
   - Create folder: `api`
   - Enter `api` folder

2. **Upload Backend**
   - Upload `keze-backend-ready.zip`
   - Extract all files
   - Delete zip file

3. **Verify Files**:
   ```
   /home/bisskhgv/keze.bissols.com/api/
   ├── app.py
   ├── telegram_bot.py
   ├── wsgi.py
   ├── requirements.txt
   ├── .env
   └── .htaccess
   ```

### Step 4: Setup Python Application

1. **Find Python App** in cPanel
   - Look for "Setup Python App" or "Python Selector"

2. **Create Application**:
   - **Python Version**: 3.8+ (highest available)
   - **Application Root**: `/home/bisskhgv/keze.bissols.com/api/`
   - **Application URL**: `/api/` (relative to subdomain)
   - **Startup File**: `wsgi.py`
   - **Entry Point**: `application`

3. **Click "Create Application"**

### Step 4: Install Dependencies

1. **Open Python App Terminal**
   - In Python App Manager → Terminal

2. **Navigate to Directory**:
   ```bash
   cd public_html/api
   ```

3. **Install Requirements**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Test Installation**:
   ```bash
   python -c "import flask; print('✅ Flask OK')"
   python -c "import mysql.connector; print('✅ MySQL OK')"
   ```

### Step 5: Initialize Database

1. **Run Database Setup**:
   ```bash
   python app.py
   ```

2. **Check Output**:
   ```
   ✅ Table 'users' ready
   ✅ Table 'game_actions' ready
   🚀 Keze Tap Game MySQL server starting
   ```

3. **Stop with Ctrl+C** (tables are now created)

### Step 6: Test Backend API

1. **Test Health Check**:
   ```bash
   curl https://keze.bissols.com/api/health
   ```

2. **Expected Response**:
   ```json
   {
     "status": "OK",
     "database": "connected",
     "telegram_bot": "configured"
   }
   ```

---

## Phase 4: Frontend Deployment (10 minutes)

### Step 1: Prepare Frontend

1. **Update Environment**:
   ```bash
   cd telegram-tap-game
   echo "NEXT_PUBLIC_API_URL=https://keze.bissols.com/api" > .env.local
   ```

2. **Build Frontend**:
   ```bash
   npm run build
   ```

### Step 2: Upload Frontend

1. **cPanel File Manager**
   - Navigate to `/home/bisskhgv/keze.bissols.com/` (your subdomain folder)
   - Keep the `api/` folder you created earlier

2. **Upload Frontend Files**
   - Upload all files from `out/` folder to subdomain root
   - Extract if needed

3. **Verify Structure**:
   ```
   /home/bisskhgv/keze.bissols.com/
   ├── index.html          # Frontend files in subdomain root
   ├── _next/
   ├── api/                # Backend in api subfolder
   │   ├── app.py
   │   └── wsgi.py
   └── ...other frontend files
   ```

---

## Phase 5: Bot Integration (5 minutes)

### Step 1: Configure WebApp

1. **Message @BotFather**:
   ```
   /setmenubuttondefault
   Select @kezeBot

   Text: 🎮 Play Keze Tap Game
   WebApp URL: https://keze.bissols.com
   ```

### Step 2: Start Bot Service

1. **SSH or Terminal Access**:
   ```bash
   cd public_html/api
   nohup python telegram_bot.py &
   ```

2. **Or Auto-Start with Cron**:
   - cPanel → Cron Jobs
   - Add: `@reboot cd /home/username/public_html/api && python telegram_bot.py`

---

## Phase 6: Testing & Verification (5 minutes)

### Step 1: Test Complete System

1. **Website Test**:
   - Visit: `https://keze.bissols.com`
   - Should load game interface
   - Try tapping coins

2. **API Test**:
   - Visit: `https://keze.bissols.com/api/health`
   - Should show status OK

3. **Database Test**:
   - Create test user by tapping
   - Check phpMyAdmin for new user record

4. **Telegram Bot Test**:
   - Find @kezeBot in Telegram
   - Send `/start`
   - Should get welcome message with play button

5. **End-to-End Test**:
   - Click "Play Game" in Telegram
   - Game opens in WebApp
   - Tap coins, play games
   - Send `/stats` to bot
   - Should show updated coin count

---

## Database Schema Reference

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    coins BIGINT DEFAULT 0,
    ton_coins BIGINT DEFAULT 0,
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    taps_count INT DEFAULT 0,
    energy INT DEFAULT 1000,
    last_energy_update DATETIME DEFAULT CURRENT_TIMESTAMP,
    referral_code VARCHAR(50) UNIQUE,
    referred_by BIGINT,
    daily_streak INT DEFAULT 0,
    last_login_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_earnings BIGINT DEFAULT 0,
    spins_won INT DEFAULT 0,
    treasures_found INT DEFAULT 0,
    coins_flipped INT DEFAULT 0,
    total_staked BIGINT DEFAULT 0,
    banned BOOLEAN DEFAULT FALSE,
    last_action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Game Actions Table
```sql
CREATE TABLE game_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    result TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT TRUE
);
```

---

## Configuration Files

### .env File (Backend)
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_actual_bot_token

# MySQL Database
DB_HOST=localhost
DB_NAME=bisskhgv_keze_coins_db
DB_USER=bisskhgv_keze_bot_user
DB_PASSWORD=your_database_password
DB_PORT=3306

# Server
PORT=5000
FLASK_ENV=production
FLASK_DEBUG=False

# URLs
FRONTEND_URL=https://keze.bissols.com
GAME_URL=https://keze.bissols.com

# Security
SECRET_KEY=your-secret-key-here
```

### .env.local File (Frontend)
```env
NEXT_PUBLIC_API_URL=https://keze.bissols.com/api
```

---

## Troubleshooting

### Issue 1: Database Connection Failed
```bash
# Check database credentials
mysql -h localhost -u cpanel_username_keze_admin -p cpanel_username_keze_tap_game

# If connection fails:
1. Verify database name and user in cPanel
2. Check password is correct
3. Ensure user has ALL PRIVILEGES on database
```

### Issue 2: Python App Won't Start
```bash
# Check Python app status in cPanel
# Common fixes:
pip install --upgrade pip
pip install -r requirements.txt

# Check Python version
python --version  # Should be 3.8+
```

### Issue 3: API Returns 500 Error
```bash
# Check error logs in cPanel
# Enable debug mode temporarily:
# In .env: FLASK_DEBUG=True

# Test Python app manually:
cd public_html/api
python app.py
```

### Issue 4: Bot Not Responding
```bash
# Test bot token:
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# Check bot process:
ps aux | grep telegram_bot.py

# Restart bot:
cd public_html/api
python telegram_bot.py
```

### Issue 5: Frontend Shows API Errors
```bash
# Check API URL in .env.local
# Test API directly:
curl https://keze.bissols.com/api/health

# Check CORS headers in .htaccess
```

---

## Monitoring & Maintenance

### Daily Checks
1. **Check website loads**: Visit keze.bissols.com
2. **Test bot responds**: Send `/stats` to bot
3. **Monitor users**: Check phpMyAdmin user count

### Weekly Maintenance
1. **Review error logs** in cPanel
2. **Check database size** in phpMyAdmin
3. **Update game parameters** if needed

### Database Backup
```bash
# In cPanel → Backup Wizard
# Or via phpMyAdmin → Export
# Schedule weekly backups
```

### Performance Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_telegram_id ON users(telegram_id);
CREATE INDEX idx_total_earnings ON users(total_earnings);
CREATE INDEX idx_last_action ON users(last_action_time);
```

---

## Scaling Considerations

### Current Capacity
- **Users**: 10,000+ concurrent
- **Storage**: Limited by hosting plan
- **Database**: MySQL limits per hosting plan

### When to Upgrade
- Database size > hosting limit
- CPU usage consistently high
- Need more storage space

### Upgrade Path
1. **Higher hosting plan** with more resources
2. **VPS hosting** for full control
3. **Dedicated server** for massive scale

---

## Security Best Practices

### Implemented
- ✅ Rate limiting (30 actions/minute)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ Anti-cheat measures
- ✅ Secure environment variables

### Additional Security
```apache
# Add to .htaccess in api folder
<Files "*.py">
    Order allow,deny
    Deny from all
</Files>

<Files "wsgi.py">
    Order allow,deny
    Allow from all
</Files>
```

---

## Success Checklist

✅ **MySQL database created and accessible**
✅ **Python backend uploaded and running**
✅ **Database tables created automatically**
✅ **Frontend deployed and accessible**
✅ **API endpoints responding correctly**
✅ **Telegram bot created and configured**
✅ **Bot responds to commands**
✅ **WebApp opens in Telegram**
✅ **End-to-end gameplay works**
✅ **All features functional (tap, games, referrals)**

---

## Final Result

🎉 **Your Complete Keze Tap Game is Live!**

**🌐 Game**: https://keze.bissols.com
**🔗 API**: https://keze.bissols.com/api
**🤖 Bot**: @kezeBot on Telegram
**💾 Database**: MySQL in your cPanel
**📊 Admin**: phpMyAdmin for database management

**Monthly Cost**: $2-10 (just Namecheap hosting)
**External Services**: None needed!
**Scalability**: Supports thousands of users

### What Your Players Experience:
1. **Find bot** on Telegram
2. **Send `/start`** → Get welcome message
3. **Tap "Play Game"** → Game opens seamlessly
4. **Earn KEZE coins** by tapping and playing games
5. **Invite friends** for bonuses
6. **Track progress** with bot commands

### What You Get:
- **Complete control** over your game
- **No external dependencies**
- **Full source code access**
- **Comprehensive admin tools**
- **Ready for monetization**
- **Professional gaming platform**

**Your Keze Tap Game is ready for thousands of players! 🚀**
