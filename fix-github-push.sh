#!/bin/bash

# Fix GitHub Push - Version 9 Update Script
echo "🔧 Fixing GitHub Push for Keze Tap Game Version 9"
echo "================================================"
echo ""

# Make sure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the telegram-tap-game directory"
    exit 1
fi

echo "📋 Current git status:"
git status
echo ""

echo "🔗 Fixing remote URL..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/isaaceze/keze-tap-game.git

echo "✅ Remote URL fixed:"
git remote -v
echo ""

echo "🚀 Ready to push Version 9 to GitHub!"
echo ""
echo "📝 Authentication Instructions:"
echo "   When prompted for credentials:"
echo "   • Username: isaaceze"
echo "   • Password: [Your Personal Access Token]"
echo ""
echo "💡 If you don't have a Personal Access Token:"
echo "   1. Go to: https://github.com/settings/tokens"
echo "   2. Generate new token (classic)"
echo "   3. Select 'repo' scope"
echo "   4. Copy the token and use it as password"
echo ""

read -p "🤔 Ready to push? (y/n): " READY

if [ "$READY" = "y" ] || [ "$READY" = "Y" ]; then
    echo ""
    echo "🚀 Pushing Version 9 to GitHub..."
    echo "   (This will overwrite the remote with your latest Version 9)"
    echo ""

    git push --force-with-lease origin main

    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 SUCCESS! Version 9 pushed to GitHub!"
        echo ""
        echo "🔗 Your repository: https://github.com/isaaceze/keze-tap-game"
        echo ""
        echo "✨ What's now on GitHub:"
        echo "   • 6-tab navigation (Tap, Games, Boosts, Tasks, Friends, Profile)"
        echo "   • Complete boost system with 2x multipliers"
        echo "   • Multi-finger tapping support"
        echo "   • Enhanced casino games"
        echo "   • Version 9 deployment package"
        echo "   • All latest bug fixes and improvements"
        echo ""
        echo "🎮 Your Keze Tap Game Version 9 is now live on GitHub!"
    else
        echo ""
        echo "❌ Push failed. This could be due to:"
        echo "   1. Invalid Personal Access Token"
        echo "   2. Authentication timeout"
        echo "   3. Network issues"
        echo ""
        echo "💡 Try again with a fresh Personal Access Token"
    fi
else
    echo ""
    echo "ℹ️  Push cancelled. Run this script again when ready."
fi
