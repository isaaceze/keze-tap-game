# 🚀 Quick Start: Complete Namecheap Deployment in 45 Minutes

## Everything on Namecheap - No External Services!

**Frontend + Backend + Database = All on Namecheap**

You'll need:
- Namecheap shared hosting account
- Your domain name
- 45 minutes of time

**Monthly Cost**: $2-10 (just your hosting!)

---

## Step 1: Create Subdomain in cPanel (5 minutes)

1. **Login to cPanel**
2. **Go to "Subdomains"**
3. **Create Subdomain**:
   - **Subdomain**: `keze`
   - **Domain**: `bissols.com`
   - **Document Root**: Let cPanel auto-create (creates `/home/bisskhgv/keze.bissols.com/`)
4. **Click "Create"**

## Step 2: Automated Preparation (5 minutes)

```bash
cd telegram-tap-game
./deploy-to-namecheap.sh
```

The script will ask for:
- 🤖 **Telegram Bot Token** (get from @BotFather)
- 🗄️ **MySQL Database Info** (you'll create in cPanel)

**Outputs:**
- `deployment/keze-backend-ready.zip` (backend ready for upload)
- `out/` folder (frontend files)

---

## Step 2: Setup MySQL Database in cPanel (10 minutes)

### Create Database
1. **cPanel** → **MySQL Databases**
2. **Database Name**: `bisskhgv_keze_coins_db`
3. **Create User**: `bisskhgv_keze_bot_user` with strong password
4. **Grant ALL PRIVILEGES** to user on database

### Note the Full Names:
- Database: `bisskhgv_keze_coins_db`
- User: `bisskhgv_keze_bot_user`

---

## Step 3: Deploy Backend (15 minutes)

### Upload Files (5 minutes)
1. **cPanel** → **File Manager** → Navigate to your subdomain folder
   - Path: `/home/bisskhgv/keze.bissols.com/`
2. Create `api` folder inside subdomain directory
3. Upload `keze-backend-ready.zip` to `api/` folder
4. Extract all files

### Setup Python App (5 minutes)
1. **cPanel** → **Setup Python App**
2. Create application:
   - App Root: `/home/bisskhgv/keze.bissols.com/api/`
   - Startup File: `wsgi.py`
   - Python Version: 3.8+

### Install Dependencies (5 minutes)
1. Open **Python App Terminal**
2. Run:
   ```bash
   cd /home/bisskhgv/keze.bissols.com/api
   pip install -r requirements.txt
   python app.py  # Initialize database tables
   ```

---

## Step 4: Deploy Frontend (10 minutes)

### Upload Frontend Files
1. **File Manager** → Navigate to your subdomain folder
   - Path: `/home/bisskhgv/keze.bissols.com/`
2. Upload all files from `out/` folder to the subdomain root
3. Keep the `api/` folder you created earlier

### Subdomain Structure:
```
/home/bisskhgv/keze.bissols.com/    # Subdomain root
├── index.html                      # Frontend files here
├── _next/                          # Next.js assets
├── api/                            # Backend folder
│   ├── app.py
│   ├── wsgi.py
│   └── requirements.txt
└── ...other frontend files
```

---

## Step 5: Configure & Test (5 minutes)

### Configure Bot
Message @BotFather:
```
/setmenubuttondefault
Select @kezeBot
Text: 🎮 Play Keze Tap Game
WebApp URL: https://keze.bissols.com
```

### Test Everything
1. **Visit**: `https://keze.bissols.com/api/health` → Should show `{"status": "OK"}`
2. **Find @kezeBot** in Telegram
3. **Send**: `/start` → Click play button
4. **Test**: Tap coins, play games

---

## 🎉 You're Live!

**Game URL**: https://keze.bissols.com
**Bot**: @kezeBot on Telegram
**Database**: MySQL in your cPanel
**Admin**: phpMyAdmin for database management

**Monthly Cost**: $2-10 (just hosting)
**External Services**: None needed!

---

## What Your Players Get

✅ **Complete tap-to-earn game**
✅ **Spinning wheel, treasure hunt, coin flip games**
✅ **Telegram bot with full commands**
✅ **Real-time progress tracking**
✅ **Friend referral system**
✅ **Achievement system**

---

## If Something Goes Wrong

### Backend Issues
1. **Check Python app status** in cPanel
2. **View error logs** in cPanel
3. **Test database connection** in phpMyAdmin

### Frontend Issues
1. **Check API URL** in `.env.local`
2. **Test API directly**: `curl https://keze.bissols.com/api/health`
3. **Check file permissions**

### Bot Issues
1. **Verify bot token** with @BotFather
2. **Check WebApp URL** configuration
3. **Test bot manually**: Send `/help`

---

## Full Documentation

For complete details: `.keze/complete-namecheap-only-deployment.md`

---

**Setup Time**: 45 minutes
**Monthly Cost**: $2-10
**External Dependencies**: None!
**Scalability**: Thousands of users

**Your complete Keze Tap Game is ready for launch! 🚀**
