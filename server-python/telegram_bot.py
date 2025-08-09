#!/usr/bin/env python3
"""
Keze Tap Game Telegram Bot - MySQL Version
Can be run separately from the Flask API server
"""

import os
import asyncio
import logging
from datetime import datetime
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# MySQL connection configuration
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'keze_tap_game'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'port': int(os.getenv('DB_PORT', 3306)),
    'autocommit': True,
    'charset': 'utf8mb4'
}

# Database connection pool
try:
    from mysql.connector import pooling
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="keze_bot_pool",
        pool_size=5,
        pool_reset_session=True,
        **db_config
    )
    logger.info("✅ Connected to MySQL successfully")
except Error as e:
    logger.error(f"❌ MySQL connection failed: {e}")
    connection_pool = None

def get_db_connection():
    """Get database connection from pool"""
    if not connection_pool:
        return None
    try:
        return connection_pool.get_connection()
    except Error as e:
        logger.error(f"Error getting connection: {e}")
        return None

def execute_query(query, params=None, fetch=False):
    """Execute SQL query with error handling"""
    if not connection_pool:
        return None

    connection = None
    try:
        connection = get_db_connection()
        if not connection:
            return None

        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params or ())

        if fetch:
            result = cursor.fetchall()
        else:
            result = cursor.rowcount

        connection.commit()
        cursor.close()
        return result

    except Error as e:
        logger.error(f"Database error: {e}")
        if connection:
            connection.rollback()
        return None
    finally:
        if connection and connection.is_connected():
            connection.close()

def get_user_by_telegram_id(telegram_id):
    """Get user from database by Telegram ID"""
    query = "SELECT * FROM users WHERE telegram_id = %s"
    result = execute_query(query, (telegram_id,), fetch=True)
    return result[0] if result else None

def create_user(telegram_id, username=None, first_name=None, last_name=None, referred_by=None):
    """Create new user in database"""
    user_data = {
        'telegram_id': telegram_id,
        'username': username,
        'first_name': first_name,
        'last_name': last_name,
        'coins': 500 if referred_by else 0,
        'ton_coins': 0,
        'level': 1,
        'experience': 0,
        'taps_count': 0,
        'energy': 1000,
        'last_energy_update': datetime.now(),
        'referral_code': str(telegram_id),
        'referred_by': referred_by,
        'daily_streak': 0,
        'last_login_date': datetime.now(),
        'total_earnings': 500 if referred_by else 0,
        'spins_won': 0,
        'treasures_found': 0,
        'coins_flipped': 0,
        'total_staked': 0,
        'banned': False,
        'last_action_time': datetime.now(),
        'created_at': datetime.now(),
        'updated_at': datetime.now()
    }

    query = """
    INSERT INTO users (
        telegram_id, username, first_name, last_name, coins, ton_coins, level,
        experience, taps_count, energy, last_energy_update, referral_code,
        referred_by, daily_streak, last_login_date, total_earnings,
        spins_won, treasures_found, coins_flipped, total_staked, banned,
        last_action_time, created_at, updated_at
    ) VALUES (
        %(telegram_id)s, %(username)s, %(first_name)s, %(last_name)s, %(coins)s,
        %(ton_coins)s, %(level)s, %(experience)s, %(taps_count)s, %(energy)s,
        %(last_energy_update)s, %(referral_code)s, %(referred_by)s, %(daily_streak)s,
        %(last_login_date)s, %(total_earnings)s, %(spins_won)s, %(treasures_found)s,
        %(coins_flipped)s, %(total_staked)s, %(banned)s, %(last_action_time)s,
        %(created_at)s, %(updated_at)s
    )
    """

    try:
        result = execute_query(query, user_data)
        if result:
            return get_user_by_telegram_id(telegram_id)
    except Exception as e:
        logger.error(f"Error creating user: {e}")
    return None

def get_referrals_count(telegram_id):
    """Get count of users referred by this user"""
    query = "SELECT COUNT(*) as count FROM users WHERE referred_by = %s"
    result = execute_query(query, (telegram_id,), fetch=True)
    return result[0]['count'] if result else 0

def add_referral_bonus(referrer_id, new_user_id):
    """Add referral relationship and give bonus"""
    query = """
    UPDATE users SET coins = coins + 1000, total_earnings = total_earnings + 1000, updated_at = %s
    WHERE telegram_id = %s
    """
    execute_query(query, (datetime.now(), referrer_id))

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    try:
        chat_id = update.effective_chat.id
        user = update.effective_user
        args = context.args
        referral_code = args[0] if args else None

        logger.info(f"Start command from user {user.id} ({user.username})")

        # Check if user exists
        existing_user = get_user_by_telegram_id(user.id)

        if not existing_user:
            # Handle referral
            referred_by = None
            referrer_bonus = False

            if referral_code and referral_code != str(user.id):
                try:
                    referrer_id = int(referral_code)
                    referrer = get_user_by_telegram_id(referrer_id)
                    if referrer:
                        referred_by = referrer_id
                        # Give referrer bonus
                        add_referral_bonus(referrer_id, user.id)
                        referrer_bonus = True
                        logger.info(f"Referral bonus given to user {referrer_id}")
                except (ValueError, TypeError):
                    logger.warning(f"Invalid referral code: {referral_code}")

            # Create new user
            new_user = create_user(user.id, user.username, user.first_name, user.last_name, referred_by)
            if new_user:
                logger.info(f"Created new user {user.id}")
                if referrer_bonus:
                    await context.bot.send_message(
                        chat_id=referred_by,
                        text="🎉 You earned 1,000 KEZE coins for inviting a friend!"
                    )
        else:
            # Update user info if changed
            updates = {}
            if existing_user.get("username") != user.username:
                updates["username"] = user.username
            if existing_user.get("first_name") != user.first_name:
                updates["first_name"] = user.first_name
            if existing_user.get("last_name") != user.last_name:
                updates["last_name"] = user.last_name

            if updates:
                # Build update query dynamically
                set_clause = ", ".join([f"{key} = %s" for key in updates.keys()])
                query = f"UPDATE users SET {set_clause} WHERE telegram_id = %s"
                values = list(updates.values()) + [user.id]
                execute_query(query, values)

        # Get current user data
        current_user = get_user_by_telegram_id(user.id)
        if not current_user:
            await update.message.reply_text("❌ Sorry, there was an error. Please try again later.")
            return

        # Create WebApp button
        game_url = os.getenv('GAME_URL', 'https://keze.bissols.com')
        web_app = WebAppInfo(url=game_url)
        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton("🎮 Play Keze Tap Game", web_app=web_app)
        ]])

        # Welcome message
        coins = current_user.get('coins', 0)
        ton_coins = current_user.get('ton_coins', 0)
        level = current_user.get('level', 1)

        message = (
            f"🪙 Welcome to Keze Tap Game!\n\n"
            f"Tap to earn KEZE coins, complete tasks, and invite friends!\n"
            f"Play exciting games to win more coins and rare TON coins!\n\n"
            f"💰 Your KEZE coins: {coins:,}\n"
            f"⚡ Your TON coins: {ton_coins:,}\n"
            f"📈 Level: {level}\n\n"
            f"🎯 Your referral code: {current_user.get('referral_code', user.id)}\n\n"
            f"Your coins will be tradeable when we list on exchanges!"
        )

        await update.message.reply_text(
            text=message,
            reply_markup=keyboard
        )

    except Exception as e:
        logger.error(f"Start command error: {e}")
        await update.message.reply_text("❌ Sorry, something went wrong. Please try again later.")

async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /stats command"""
    try:
        user_id = update.effective_user.id
        user = get_user_by_telegram_id(user_id)

        if not user:
            await update.message.reply_text("Please start the game first with /start")
            return

        referrals_count = get_referrals_count(user_id)

        message = (
            f"📊 Your Keze Tap Game Stats:\n\n"
            f"🪙 KEZE Coins: {user.get('coins', 0):,}\n"
            f"⚡ TON Coins: {user.get('ton_coins', 0):,}\n"
            f"📈 Level: {user.get('level', 1)}\n"
            f"👆 Total Taps: {user.get('taps_count', 0):,}\n"
            f"👥 Friends Invited: {referrals_count}\n"
            f"💰 Total Earned: {user.get('total_earnings', 0):,}\n"
            f"🔥 Daily Streak: {user.get('daily_streak', 0)}\n\n"
            f"🎰 Game Stats:\n"
            f"🎲 Spins Won: {user.get('spins_won', 0)}\n"
            f"🏆 Treasures Found: {user.get('treasures_found', 0)}\n"
            f"🪙 Coins Flipped: {user.get('coins_flipped', 0)}\n"
            f"💸 Total Staked: {user.get('total_staked', 0):,}"
        )

        await update.message.reply_text(message)

    except Exception as e:
        logger.error(f"Stats command error: {e}")
        await update.message.reply_text("❌ Error retrieving stats. Please try again.")

async def leaderboard_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /leaderboard command"""
    try:
        if not connection_pool:
            await update.message.reply_text("❌ Database not available.")
            return

        query = """
        SELECT first_name, last_name, username, total_earnings, level
        FROM users
        WHERE banned = FALSE
        ORDER BY total_earnings DESC
        LIMIT 10
        """
        top_users = execute_query(query, fetch=True)

        if not top_users:
            await update.message.reply_text("📊 Leaderboard is empty. Be the first to play!")
            return

        leaderboard = "🏆 TOP KEZE EARNERS\n\n"

        for i, user in enumerate(top_users):
            name = user.get('first_name') or user.get('username') or 'Anonymous'
            earnings = user.get('total_earnings', 0)
            level = user.get('level', 1)

            medal = ['🥇', '🥈', '🥉'][i] if i < 3 else f"{i + 1}."
            leaderboard += f"{medal} {name} - {earnings:,} KEZE (Lv.{level})\n"

        await update.message.reply_text(leaderboard)

    except Exception as e:
        logger.error(f"Leaderboard error: {e}")
        await update.message.reply_text("❌ Error loading leaderboard. Please try again.")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    help_text = (
        "🎮 KEZE TAP GAME HELP\n\n"
        "Commands:\n"
        "/start - Start playing and earn KEZE coins\n"
        "/stats - View your statistics\n"
        "/leaderboard - Top players\n"
        "/help - Show this help message\n\n"
        "🪙 TAP to earn KEZE coins!\n"
        "🎯 Complete daily tasks for bonuses!\n"
        "👥 Invite friends for referral rewards!\n"
        "🎰 Play games to win big!\n"
        "💎 Trade coins on exchanges soon!\n\n"
        "🎲 Games Available:\n"
        "• 🎡 Spinner: Win up to 10x + TON coins\n"
        "• 📦 Treasure Hunt: Find hidden treasures\n"
        "• 🪙 Coin Flip: Double your coins\n\n"
        "💰 Referral Rewards:\n"
        "• 1,000 KEZE for each friend you invite\n"
        "• 500 KEZE bonus for new players\n\n"
        "Share your referral code to earn more!"
    )

    await update.message.reply_text(help_text)

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle errors"""
    logger.error(f"Update {update} caused error {context.error}")

def main():
    """Start the bot"""
    # Get bot token
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not bot_token:
        logger.error("❌ TELEGRAM_BOT_TOKEN not found in environment variables")
        return

    # Create application
    application = Application.builder().token(bot_token).build()

    # Add command handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("stats", stats_command))
    application.add_handler(CommandHandler("leaderboard", leaderboard_command))
    application.add_handler(CommandHandler("help", help_command))

    # Add error handler
    application.add_error_handler(error_handler)

    # Start bot
    logger.info("🤖 Starting Keze Tap Game Telegram Bot (MySQL Version)...")
    logger.info(f"🎮 Game URL: {os.getenv('GAME_URL', 'Not configured')}")
    logger.info(f"💾 Database: {'connected' if connection_pool else 'not connected'}")

    # Run the bot
    application.run_polling(drop_pending_updates=True)

if __name__ == '__main__':
    main()
