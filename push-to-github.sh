#!/bin/bash

# Keze Tap Game - GitHub Push Script (with Telegram WebApp Fix)
echo "🚀 Pushing Keze Tap Game + Telegram WebApp Fix to GitHub"
echo "=========================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the telegram-tap-game directory"
    exit 1
fi

echo "📋 What will be pushed to GitHub:"
echo "   ✅ Complete Version 9 codebase (6-tab navigation)"
echo "   ✅ Telegram WebApp fix for FriendsScreen error"
echo "   ✅ Both deployment packages:"
echo "      - frontend-version-9.zip"
echo "      - frontend-telegram-webapp-fix.zip"
echo "   ✅ Python backend with auto-port detection"
echo "   ✅ All documentation and deployment scripts"
echo ""

echo "🔑 Authentication Required:"
echo "   When prompted for credentials:"
echo "   • Username: isaaceze"
echo "   • Password: [Your Personal Access Token]"
echo ""
echo "💡 If you don't have a Personal Access Token:"
echo "   1. Go to: https://github.com/settings/tokens"
echo "   2. Click 'Generate new token (classic)'"
echo "   3. Select 'repo' scope"
echo "   4. Copy the token and use it as password"
echo ""

read -p "🤔 Ready to push to GitHub? (y/n): " READY

if [ "$READY" = "y" ] || [ "$READY" = "Y" ]; then
    echo ""
    echo "🚀 Pushing to GitHub..."
    echo ""

    git push --force-with-lease origin main

    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 SUCCESS! Keze Tap Game + Telegram Fix pushed to GitHub!"
        echo ""
        echo "🔗 Your repository: https://github.com/isaaceze/keze-tap-game"
        echo ""
        echo "✨ Now live on GitHub:"
        echo "   🎮 Complete Keze Tap Game (Version 9)"
        echo "   🔧 Telegram WebApp FriendsScreen fix"
        echo "   📦 Ready-to-deploy packages"
        echo "   📚 Professional documentation"
        echo "   🐍 Python backend (MySQL + Flask)"
        echo "   🤖 Telegram bot integration"
        echo ""
        echo "📋 Next Steps:"
        echo "   1. Deploy frontend-telegram-webapp-fix.zip to your live site"
        echo "   2. Test the Telegram bot Friends screen"
        echo "   3. Share your awesome GitHub project!"
        echo ""
        echo "🎯 Your Telegram WebApp error should now be fixed! 🚀"
    else
        echo ""
        echo "❌ Push failed. Common solutions:"
        echo "   1. Check your Personal Access Token"
        echo "   2. Make sure you have push access to the repository"
        echo "   3. Try generating a new token with 'repo' scope"
        echo ""
        echo "💡 Run this script again after fixing authentication"
    fi
else
    echo ""
    echo "ℹ️  Push cancelled. Run this script again when ready."
    echo "   Your changes are safely committed locally."
fi
