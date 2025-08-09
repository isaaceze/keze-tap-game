#!/bin/bash

# Keze Tap Game - Update to Version 9 Deployment Script
# This script creates a fresh deployment package with ALL latest features

echo "🚀 Keze Tap Game - Update to Version 9"
echo "======================================"
echo ""
echo "✨ Version 9 Features:"
echo "   • 6-tab navigation (Tap, Games, Boosts, Tasks, Friends, Profile)"
echo "   • Multi-finger tapping support"
echo "   • Boost system (2x tap power, energy, XP, level)"
echo "   • Enhanced gambling games"
echo "   • Improved referral system"
echo "   • Bug fixes and optimizations"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the telegram-tap-game directory"
    exit 1
fi

# Clean and build latest version
echo "🧹 Cleaning previous builds..."
rm -rf .next out node_modules/.cache deployment/frontend-v9

echo "🔨 Building latest Version 9 frontend..."
echo "   (TypeScript errors are temporarily ignored for production build)"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Create fresh deployment package
echo "📦 Creating Version 9 deployment package..."
mkdir -p deployment/frontend-v9
cp -r out/* deployment/frontend-v9/

# Create zip for easy upload
cd deployment
zip -r frontend-version-9.zip frontend-v9/
cd ..

echo "✅ Version 9 deployment package ready!"
echo ""
echo "📁 Files created:"
echo "   • deployment/frontend-v9/ (folder with all files)"
echo "   • deployment/frontend-version-9.zip (zip for upload)"
echo ""
echo "🔧 DEPLOYMENT INSTRUCTIONS:"
echo ""
echo "1. 🌐 Login to your Namecheap cPanel"
echo "2. 📁 Go to File Manager"
echo "3. 📂 Navigate to: /home/bisskhgv/keze.bissols.com/"
echo "4. 🗑️  DELETE all old frontend files (keep api/ folder!)"
echo "   - Delete: index.html, _next/, 404.html, index.txt"
echo "   - KEEP: api/ folder (your backend)"
echo "5. 📤 Upload: deployment/frontend-version-9.zip"
echo "6. 📂 Extract all files from the zip"
echo "7. 🗑️  Delete the zip file"
echo "8. 🔄 Clear browser cache (Ctrl+F5 or Cmd+Shift+R)"
echo "9. 🎮 Test: Visit https://keze.bissols.com"
echo ""
echo "✅ Expected Result: You should see 6 tabs at the bottom:"
echo "   Tap | Games | Boosts | Tasks | Friends | Profile"
echo ""
echo "🎯 What's New in Version 9:"
echo "   • Boosts tab with 2x multipliers"
echo "   • Games tab with enhanced casino games"
echo "   • Multi-finger tapping (try tapping with multiple fingers!)"
echo "   • Improved referral sharing"
echo "   • Better error handling"
echo ""
echo "🆘 If you still see 4 tabs:"
echo "   1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"
echo "   2. Clear browser cache completely"
echo "   3. Try incognito/private browsing mode"
echo "   4. Check that api/ folder is still intact"
echo ""
echo "🎉 Your Keze Tap Game will be updated to Version 9!"
