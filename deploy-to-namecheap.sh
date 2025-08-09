#!/bin/bash

# Keze Tap Game - Complete Namecheap Deployment Preparation Script
# This script prepares your files for complete Namecheap-only deployment

echo "🚀 Keze Tap Game - Complete Namecheap Deployment Preparation"
echo "============================================================"
echo ""
echo "✨ Everything on Namecheap: Frontend + Backend + MySQL Database"
echo "💰 No external services needed - just your hosting!"
echo ""

# Check if we're in the right directory
if [ ! -d "server-python" ]; then
    echo "❌ Error: Please run this script from the telegram-tap-game directory"
    exit 1
fi

# Get user inputs
echo "📝 Please provide the following information:"
echo ""

read -p "🤖 Telegram Bot Token (from @BotFather): " BOT_TOKEN
echo ""
echo "📊 MySQL Database Information (from your cPanel):"
echo "Database Name: bisskhgv_keze_coins_db"
echo "Database Username: bisskhgv_keze_bot_user"
read -p "🔐 Database Password: " DB_PASSWORD

# Use the predefined database settings
DB_NAME="bisskhgv_keze_coins_db"
DB_USER="bisskhgv_keze_bot_user"
echo ""
DOMAIN="keze.bissols.com"
echo "🌐 Using domain: $DOMAIN"

# Validate inputs
if [ -z "$BOT_TOKEN" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DOMAIN" ]; then
    echo "❌ Error: All fields are required"
    exit 1
fi

echo ""
echo "📦 Preparing complete Namecheap deployment package..."

# Create deployment directory
rm -rf deployment
mkdir deployment
cd deployment

# Copy backend files
cp -r ../server-python/* .

# Remove unnecessary files
rm -rf __pycache__
rm -f .env
rm -rf .git

# Create .env file with user values
cat > .env << EOF
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=$BOT_TOKEN

# MySQL Database Configuration (Namecheap cPanel)
DB_HOST=localhost
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_PORT=3306

# Server Configuration
PORT=5000
FLASK_ENV=production
FLASK_DEBUG=False

# URLs
FRONTEND_URL=https://$DOMAIN
GAME_URL=https://$DOMAIN

# Security
SECRET_KEY=keze-game-$(date +%s)-$(openssl rand -hex 8)
EOF

echo "✅ Environment file created with MySQL configuration"

# Create deployment-ready .htaccess
cat > .htaccess << 'EOF'
RewriteEngine On

# Route API calls to Python app
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ wsgi.py/$1 [QSA,L]

# CORS headers for API requests
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# Hide sensitive files
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

<Files "*.pyc">
    Order allow,deny
    Deny from all
</Files>

# Protect Python files except WSGI
<Files "*.py">
    Order allow,deny
    Deny from all
</Files>

<Files "wsgi.py">
    Order allow,deny
    Allow from all
</Files>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE text/plain
</IfModule>
EOF

echo "✅ .htaccess file created"

# Create zip file for upload
zip -r keze-backend-ready.zip . -x "*.pyc" "__pycache__/*"

echo "✅ Deployment package created: deployment/keze-backend-ready.zip"

# Build frontend with correct API URL
cd ..
echo ""
echo "🔧 Building frontend with correct API URL..."

echo "NEXT_PUBLIC_API_URL=https://$DOMAIN/api" > .env.local
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully"
    echo "📁 Frontend files ready in: out/"
else
    echo "❌ Frontend build failed"
fi

echo ""
echo "🎉 Complete Namecheap deployment preparation finished!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🗄️  Setup MySQL Database in cPanel:"
echo "   - Create database: bisskhgv_keze_coins_db"
echo "   - Create user: bisskhgv_keze_bot_user"
echo "   - Grant ALL PRIVILEGES"
echo ""
echo "2. 🌐 Create Subdomain:"
echo "   - cPanel → Subdomains → Create 'keze.bissols.com'"
echo "   - Document root: /home/bisskhgv/keze.bissols.com/ (auto-created)"
echo ""
echo "3. 🐍 Deploy Backend:"
echo "   - Upload: deployment/keze-backend-ready.zip to /home/bisskhgv/keze.bissols.com/api/"
echo "   - Extract files in cPanel File Manager"
echo "   - Setup Python App pointing to /home/bisskhgv/keze.bissols.com/api/"
echo "   - Install requirements: pip install -r requirements.txt"
echo ""
echo "4. 🌐 Deploy Frontend:"
echo "   - Upload files from 'out/' folder to /home/bisskhgv/keze.bissols.com/"
echo ""
echo "4. 🤖 Configure Telegram Bot:"
echo "   - Set WebApp URL: https://$DOMAIN"
echo "   - Test with /start command"
echo ""
echo "📚 Complete guide: .keze/complete-namecheap-only-deployment.md"
echo ""
echo "🔗 Your game will be live at: https://$DOMAIN"
echo "🔗 API will be at: https://$DOMAIN/api"
echo "🔗 Database: MySQL in your cPanel"
echo ""
echo "💰 Monthly cost: Just your Namecheap hosting ($2-10)"
echo "🚀 No external services needed!"
echo ""
echo "Good luck with your complete Namecheap deployment! 🎉"
