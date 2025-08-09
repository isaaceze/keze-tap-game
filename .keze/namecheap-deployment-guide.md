# 🌐 Namecheap Shared Hosting Deployment Guide

## Overview

Deploying the Keze Tap Game on Namecheap shared hosting requires a hybrid approach due to shared hosting limitations. Here's the complete strategy:

**Frontend**: Deploy to Namecheap (static files)
**Backend**: External service (Railway/Heroku) or Namecheap's Node.js if available
**Database**: MongoDB Atlas (external)

---

## Strategy 1: Frontend on Namecheap + External Backend (Recommended)

### Part A: Deploy Frontend to Namecheap

#### Step 1: Build Static Files
```bash
cd telegram-tap-game
npm install
npm run build
```

This creates an `out` folder with static files due to our `output: 'export'` configuration.

#### Step 2: Upload to Namecheap

1. **Access cPanel**
   - Login to your Namecheap account
   - Go to "Hosting List" → "Manage"
   - Click "cPanel"

2. **Upload Files**
   - Open "File Manager"
   - Navigate to `public_html` (or your domain folder)
   - Upload the entire `out` folder contents
   - Or use FTP client like FileZilla

3. **FTP Upload Method**
   ```bash
   # Using FTP
   Host: ftp.keze.bissols.com
   Username: your-cpanel-username
   Password: your-cpanel-password
   Port: 21

   # Upload all files from 'out' folder to public_html
   ```

#### Step 3: Configure Domain
- Point your domain to the uploaded files
- Ensure `index.html` is the default page

### Part B: Deploy Backend to External Service

#### Option 1: Railway (Free Tier Available)
```bash
cd telegram-tap-game/server
npm install -g @railway/cli
railway login
railway init
railway up
```

#### Option 2: Heroku
```bash
cd telegram-tap-game/server
heroku create keze-game-api
git init
git add .
git commit -m "Deploy backend"
heroku git:remote -a keze-game-api
git push heroku main
```

#### Step 4: Update Frontend Configuration
Create `.env.local` in your project:
```env
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app/api
```

Rebuild and redeploy frontend:
```bash
npm run build
# Upload new 'out' folder to Namecheap
```

---

## Strategy 2: Full Namecheap Deployment (If Node.js Supported)

### Check Node.js Support
1. Login to cPanel
2. Look for "Node.js App" or "Node.js Setup"
3. If available, proceed with this strategy

### Step 1: Upload Backend Files
```bash
# Compress server folder
cd telegram-tap-game
tar -czf server.tar.gz server/

# Upload via cPanel File Manager
# Extract in a folder like /nodejs/keze-game/
```

### Step 2: Setup Node.js App
1. **In cPanel → Node.js App**
   - Create New App
   - Node.js Version: 18.x or latest available
   - App Root: `/nodejs/keze-game/`
   - App URL: `api.keze.bissols.com` or `/api`
   - Startup File: `server.js`

2. **Install Dependencies**
   ```bash
   # In Node.js terminal or SSH
   cd /home/username/nodejs/keze-game/
   npm install
   ```

### Step 3: Environment Variables
Add in Node.js app settings:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/keze-tap-game
FRONTEND_URL=https://keze.bissols.com
PORT=3001
```

### Step 4: Database Setup
Since Namecheap shared hosting typically uses MySQL, we have options:

#### Option A: Use MongoDB Atlas (Recommended)
```javascript
// Keep existing MongoDB setup
// Use connection string in MONGODB_URI
```

#### Option B: Convert to MySQL
```javascript
// Alternative: Convert to MySQL (requires significant changes)
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'your_db_user',
  password: 'your_db_password',
  database: 'keze_tap_game'
});
```

---

## Strategy 3: PHP Backend Alternative (If Node.js Not Available)

If Namecheap doesn't support Node.js, create a PHP backend:

### Step 1: Create PHP API
```php
<?php
// api/index.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
$host = 'localhost';
$dbname = 'your_database_name';
$username = 'your_db_username';
$password = 'your_db_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['error' => 'Database connection failed']));
}

// Route handling
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

switch ($path) {
    case '/api/user':
        if ($method === 'GET') {
            getUserData();
        }
        break;
    case '/api/tap':
        if ($method === 'POST') {
            handleTap();
        }
        break;
    case '/api/game/spin':
        if ($method === 'POST') {
            handleSpin();
        }
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
}

function getUserData() {
    global $pdo;
    $telegramId = $_GET['telegram_id'] ?? null;

    if (!$telegramId) {
        echo json_encode(['error' => 'Telegram ID required']);
        return;
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE telegram_id = ?");
    $stmt->execute([$telegramId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Create new user
        $stmt = $pdo->prepare("INSERT INTO users (telegram_id, coins, level, energy) VALUES (?, 0, 1, 1000)");
        $stmt->execute([$telegramId]);
        $user = ['telegram_id' => $telegramId, 'coins' => 0, 'level' => 1, 'energy' => 1000];
    }

    echo json_encode($user);
}

function handleTap() {
    global $pdo;
    $input = json_decode(file_get_contents('php://input'), true);
    $telegramId = $input['telegramId'] ?? null;
    $taps = $input['taps'] ?? 1;

    if (!$telegramId) {
        echo json_encode(['error' => 'Telegram ID required']);
        return;
    }

    // Update user coins and energy
    $stmt = $pdo->prepare("UPDATE users SET coins = coins + ?, energy = energy - ? WHERE telegram_id = ?");
    $stmt->execute([$taps, $taps, $telegramId]);

    echo json_encode(['success' => true]);
}

function handleSpin() {
    global $pdo;
    $input = json_decode(file_get_contents('php://input'), true);
    $telegramId = $input['telegramId'] ?? null;
    $stake = $input['stake'] ?? 0;

    // Game logic
    $random = mt_rand(1, 100) / 100;
    $result = ['coins' => 0, 'tonCoins' => 0];

    if ($random < 0.02) {
        $result = ['coins' => $stake * 10, 'tonCoins' => intval($stake / 1000)];
    } elseif ($random < 0.1) {
        $result = ['coins' => $stake * 5, 'tonCoins' => 0];
    } elseif ($random < 0.3) {
        $result = ['coins' => $stake * 2, 'tonCoins' => 0];
    }

    // Update database
    $stmt = $pdo->prepare("UPDATE users SET coins = coins - ? + ?, ton_coins = ton_coins + ? WHERE telegram_id = ?");
    $stmt->execute([$stake, $result['coins'], $result['tonCoins'], $telegramId]);

    echo json_encode(['result' => $result]);
}
?>
```

### Step 2: Create Database Tables
```sql
-- In cPanel → phpMyAdmin
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    coins BIGINT DEFAULT 0,
    ton_coins BIGINT DEFAULT 0,
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    energy INT DEFAULT 1000,
    taps_count INT DEFAULT 0,
    total_earnings BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE game_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    result JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);
```

---

## Telegram Bot Setup (Any Strategy)

### Step 1: Create Bot
1. Message @BotFather
2. `/newbot`
3. Name: `Keze Tap Game`
4. Username: `keze_tap_game_bot`

### Step 2: Bot Code (If using external hosting)
Deploy this to Railway/Heroku:

```javascript
// bot.js
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const keyboard = {
        inline_keyboard: [[
            { text: '🎮 Play Keze Tap Game', web_app: { url: 'https://keze.bissols.com' } }
        ]]
    };

    bot.sendMessage(chatId,
        '🪙 Welcome to Keze Tap Game!\n\nTap to earn KEZE coins and play exciting games!',
        { reply_markup: keyboard }
    );
});

bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Fetch user stats from your API
    const response = await fetch(`https://keze.bissols.com/api/user/${userId}`);
    const user = await response.json();

    bot.sendMessage(chatId,
        `📊 Your Stats:\n🪙 KEZE: ${user.coins}\n📈 Level: ${user.level}`
    );
});
```

---

## Step-by-Step Deployment Process

### Phase 1: Prepare Files
```bash
# 1. Build frontend
cd telegram-tap-game
npm run build

# 2. Prepare backend (choose your strategy)
cd server
# For external: prepare for Railway/Heroku
# For Namecheap: prepare PHP or Node.js files
```

### Phase 2: Upload to Namecheap
```bash
# Via FTP (FileZilla recommended)
Host: ftp.keze.bissols.com
Username: cpanel_username
Password: cpanel_password

# Upload 'out' folder contents to public_html
```

### Phase 3: Configure APIs
```bash
# Update API URLs in frontend
NEXT_PUBLIC_API_URL=https://keze.bissols.com/api
# or
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app/api
```

### Phase 4: Test Everything
1. Visit your domain
2. Test tapping functionality
3. Test games
4. Verify Telegram bot integration

---

## Troubleshooting Common Issues

### Issue 1: API CORS Errors
```javascript
// Add to PHP or Node.js backend
header('Access-Control-Allow-Origin: https://keze.bissols.com');
```

### Issue 2: Database Connection
```php
// Test database connection
try {
    $pdo = new PDO("mysql:host=localhost;dbname=dbname", $user, $pass);
    echo "Connected successfully";
} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
```

### Issue 3: File Permissions
```bash
# Set correct permissions via cPanel File Manager
Folders: 755
Files: 644
```

---

## Performance Optimization

### 1. Enable Gzip Compression
Add to `.htaccess`:
```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### 2. Browser Caching
```apache
# Cache static files
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
</IfModule>
```

---

## Security Considerations

### 1. Secure API Endpoints
```php
// Rate limiting
session_start();
$key = 'api_' . $_SERVER['REMOTE_ADDR'];
if (!isset($_SESSION[$key])) {
    $_SESSION[$key] = ['count' => 0, 'time' => time()];
}

if (time() - $_SESSION[$key]['time'] > 60) {
    $_SESSION[$key] = ['count' => 0, 'time' => time()];
}

if ($_SESSION[$key]['count'] > 30) {
    http_response_code(429);
    die(json_encode(['error' => 'Rate limit exceeded']));
}
$_SESSION[$key]['count']++;
```

### 2. Input Validation
```php
function validateInput($data, $type) {
    switch ($type) {
        case 'telegram_id':
            return filter_var($data, FILTER_VALIDATE_INT) && $data > 0;
        case 'coins':
            return filter_var($data, FILTER_VALIDATE_INT) && $data >= 0;
        default:
            return false;
    }
}
```

---

## Maintenance & Monitoring

### 1. Error Logging
```php
// Enable error logging
ini_set('log_errors', 1);
ini_set('error_log', '/home/username/logs/php_errors.log');
```

### 2. Database Backups
```bash
# Schedule via cPanel Cron Jobs
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql
```

### 3. Monitoring Script
```php
// health-check.php
$checks = [
    'database' => checkDatabase(),
    'api' => checkAPI(),
    'bot' => checkBot()
];

echo json_encode(['status' => 'ok', 'checks' => $checks]);
```

---

## Summary

**Recommended Approach**: Frontend on Namecheap + Backend on Railway/Heroku

This gives you:
- ✅ Reliable hosting for your game
- ✅ Full Node.js backend capabilities
- ✅ Easy scaling when you grow
- ✅ Professional setup

**Cost**:
- Namecheap: $2-10/month (depending on plan)
- Railway: Free tier, then $5/month
- MongoDB Atlas: Free tier, then $9/month

Your Keze Tap Game will be live and fully functional! 🚀
