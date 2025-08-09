from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
import os
import time
import random
import math
import json
from dotenv import load_dotenv
import logging
import threading

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=[os.getenv('FRONTEND_URL', 'http://localhost:3000')])

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per 15 minutes"]
)

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
        pool_name="keze_pool",
        pool_size=10,
        pool_reset_session=True,
        **db_config
    )
    print("✅ Connected to MySQL successfully")
except Error as e:
    print(f"❌ MySQL connection failed: {e}")
    connection_pool = None

# Telegram Bot Setup (Optional - can be run separately)
telegram_bot = None
if os.getenv('TELEGRAM_BOT_TOKEN'):
    try:
        from telegram import Bot
        telegram_bot = Bot(token=os.getenv('TELEGRAM_BOT_TOKEN'))
        print("✅ Telegram bot initialized")
    except ImportError:
        print("⚠️ python-telegram-bot not installed")
    except Exception as e:
        print(f"❌ Telegram bot initialization failed: {e}")

# Helper Functions
def get_db_connection():
    """Get database connection from pool"""
    if not connection_pool:
        return None
    try:
        return connection_pool.get_connection()
    except Error as e:
        print(f"Error getting connection: {e}")
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
        print(f"Database error: {e}")
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

    result = execute_query(query, user_data)
    if result:
        return get_user_by_telegram_id(telegram_id)
    return None

def update_user_energy(user):
    """Update user energy based on time passed"""
    if not user:
        return user

    now = datetime.now()
    last_update = user.get('last_energy_update', now)

    # Calculate time difference in minutes
    if isinstance(last_update, str):
        last_update = datetime.fromisoformat(last_update.replace('Z', '+00:00'))

    time_diff = (now - last_update).total_seconds() / 60
    max_energy = 1000 + (user.get('level', 1) - 1) * 100
    energy_to_add = int(time_diff * 2)  # 2 energy per minute

    new_energy = min(max_energy, user.get('energy', 0) + energy_to_add)

    # Update in database
    query = "UPDATE users SET energy = %s, last_energy_update = %s WHERE telegram_id = %s"
    execute_query(query, (new_energy, now, user['telegram_id']))

    user['energy'] = new_energy
    user['max_energy'] = max_energy
    return user

def log_game_action(user_id, action, amount, result, verified=True):
    """Log game action for anti-cheat monitoring"""
    query = """
    INSERT INTO game_actions (user_id, action, amount, result, timestamp, verified)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    execute_query(query, (user_id, action, amount, json.dumps(result), datetime.now(), verified))

def check_level_up(user):
    """Check if user should level up and apply changes"""
    experience_to_next = user.get('level', 1) * 1000

    if user.get('experience', 0) >= experience_to_next:
        new_level = user.get('level', 1) + 1
        new_max_energy = 1000 + (new_level - 1) * 100

        query = """
        UPDATE users SET level = %s, experience = 0, energy = %s, updated_at = %s
        WHERE telegram_id = %s
        """
        execute_query(query, (new_level, new_max_energy, datetime.now(), user['telegram_id']))

        return True
    return False

def get_referrals_count(telegram_id):
    """Get count of users referred by this user"""
    query = "SELECT COUNT(*) as count FROM users WHERE referred_by = %s"
    result = execute_query(query, (telegram_id,), fetch=True)
    return result[0]['count'] if result else 0

def add_referral(referrer_id, new_user_id):
    """Add referral relationship and give bonus"""
    query = """
    UPDATE users SET coins = coins + 1000, total_earnings = total_earnings + 1000, updated_at = %s
    WHERE telegram_id = %s
    """
    execute_query(query, (datetime.now(), referrer_id))

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    db_status = "connected" if connection_pool else "disconnected"
    return jsonify({
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "database": db_status,
        "telegram_bot": "configured" if telegram_bot else "not configured"
    })

@app.route('/api/user/<int:telegram_id>', methods=['GET'])
def get_user(telegram_id):
    """Get user data"""
    try:
        user = get_user_by_telegram_id(telegram_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Update energy
        user = update_user_energy(user)

        response_data = {
            "coins": user.get("coins", 0),
            "tonCoins": user.get("ton_coins", 0),
            "level": user.get("level", 1),
            "experience": user.get("experience", 0),
            "energy": user.get("energy", 1000),
            "maxEnergy": user.get("max_energy", 1000),
            "tapsCount": user.get("taps_count", 0),
            "totalEarnings": user.get("total_earnings", 0),
            "referrals": get_referrals_count(telegram_id),
            "gameStats": {
                "spinsWon": user.get("spins_won", 0),
                "treasuresFound": user.get("treasures_found", 0),
                "coinsFlipped": user.get("coins_flipped", 0),
                "totalStaked": user.get("total_staked", 0)
            }
        }

        return jsonify(response_data)

    except Exception as e:
        app.logger.error(f"Get user error: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/tap', methods=['POST'])
@limiter.limit("30 per minute")
def tap_action():
    """Handle tap action with anti-cheat measures"""
    try:
        data = request.get_json()
        telegram_id = data.get('telegramId')
        taps = data.get('taps', 1)

        if not telegram_id or not isinstance(taps, int) or taps < 1 or taps > 10:
            return jsonify({"error": "Invalid tap data"}), 400

        user = get_user_by_telegram_id(telegram_id)
        if not user or user.get("banned", False):
            return jsonify({"error": "User not found or banned"}), 404

        # Update energy first
        user = update_user_energy(user)

        if user["energy"] < taps:
            return jsonify({"error": "Insufficient energy"}), 400

        # Anti-cheat: Check time between actions
        now = datetime.now()
        last_action = user.get("last_action_time", now)
        if isinstance(last_action, str):
            last_action = datetime.fromisoformat(last_action.replace('Z', '+00:00'))

        time_since_last = (now - last_action).total_seconds()

        if time_since_last < 0.1:  # Minimum 100ms between taps
            return jsonify({"error": "Tapping too fast"}), 429

        # Calculate rewards
        coins_per_tap = math.floor(user.get("level", 1) / 3) + 1
        coins_earned = taps * coins_per_tap

        # Update user data
        query = """
        UPDATE users SET
            coins = coins + %s,
            taps_count = taps_count + %s,
            experience = experience + %s,
            total_earnings = total_earnings + %s,
            energy = energy - %s,
            last_action_time = %s,
            updated_at = %s
        WHERE telegram_id = %s
        """

        execute_query(query, (
            coins_earned, taps, taps, coins_earned, taps, now, now, telegram_id
        ))

        # Log action
        log_game_action(telegram_id, "tap", taps, {"coinsEarned": coins_earned})

        # Get updated user and check level up
        updated_user = get_user_by_telegram_id(telegram_id)
        level_up = check_level_up(updated_user)

        response = {
            "success": True,
            "coins": updated_user["coins"],
            "level": updated_user["level"],
            "experience": updated_user["experience"],
            "energy": updated_user["energy"],
            "tapsCount": updated_user["taps_count"],
            "levelUp": level_up
        }

        return jsonify(response)

    except Exception as e:
        app.logger.error(f"Tap error: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/game/<action>', methods=['POST'])
@limiter.limit("30 per minute")
def game_action(action):
    """Handle game actions (spin, treasure, flip)"""
    try:
        if action not in ['spin', 'treasure', 'flip']:
            return jsonify({"error": "Invalid game action"}), 400

        data = request.get_json()
        telegram_id = data.get('telegramId')
        stake = data.get('stake', 0)
        choice = data.get('choice')  # For coin flip

        if not telegram_id or not isinstance(stake, int) or stake < 100:
            return jsonify({"error": "Invalid game data"}), 400

        user = get_user_by_telegram_id(telegram_id)
        if not user or user.get("banned", False):
            return jsonify({"error": "User not found or banned"}), 404

        if user.get("coins", 0) < stake:
            return jsonify({"error": "Insufficient coins"}), 400

        # Game logic
        result = {"coins": 0, "won": False}

        if action == "spin":
            random_val = random.random()
            if random_val < 0.02:  # 2% TON coins
                result = {
                    "coins": stake * 10,
                    "tonCoins": max(1, stake // 1000),
                    "won": True
                }
                # Update TON coins
                query = "UPDATE users SET ton_coins = ton_coins + %s WHERE telegram_id = %s"
                execute_query(query, (result["tonCoins"], telegram_id))
            elif random_val < 0.1:  # 8% big win
                result = {"coins": stake * 5, "tonCoins": 0, "won": True}
            elif random_val < 0.3:  # 20% good win
                result = {"coins": stake * 2, "tonCoins": 0, "won": True}
            elif random_val < 0.5:  # 20% small win
                result = {"coins": int(stake * 1.5), "tonCoins": 0, "won": True}
            elif random_val < 0.7:  # 20% break even
                result = {"coins": stake, "tonCoins": 0, "won": False}
            # 30% chance to lose (coins: 0)

            if result["won"]:
                query = "UPDATE users SET spins_won = spins_won + 1 WHERE telegram_id = %s"
                execute_query(query, (telegram_id,))

        elif action == "treasure":
            random_val = random.random()
            if random_val < 0.4:  # 40% find treasure
                multiplier = 10 if random.random() < 0.1 else (5 if random.random() < 0.3 else 3)
                result = {"coins": stake * multiplier, "won": True}
                query = "UPDATE users SET treasures_found = treasures_found + 1 WHERE telegram_id = %s"
                execute_query(query, (telegram_id,))

        elif action == "flip":
            flip_result = "heads" if random.random() < 0.5 else "tails"
            won = flip_result == choice
            result = {
                "coins": stake * 2 if won else 0,
                "won": won,
                "flip": flip_result,
                "choice": choice
            }
            if won:
                query = "UPDATE users SET coins_flipped = coins_flipped + 1 WHERE telegram_id = %s"
                execute_query(query, (telegram_id,))

        # Update user coins and stats
        coin_change = result["coins"] - stake
        earnings_change = max(0, coin_change)

        query = """
        UPDATE users SET
            coins = coins + %s,
            total_staked = total_staked + %s,
            total_earnings = total_earnings + %s,
            updated_at = %s
        WHERE telegram_id = %s
        """
        execute_query(query, (coin_change, stake, earnings_change, datetime.now(), telegram_id))

        # Log action
        log_game_action(telegram_id, action, stake, result)

        # Get updated user data
        updated_user = get_user_by_telegram_id(telegram_id)

        response = {
            "success": True,
            "result": result,
            "coins": updated_user["coins"],
            "tonCoins": updated_user.get("ton_coins", 0),
            "gameStats": {
                "spinsWon": updated_user.get("spins_won", 0),
                "treasuresFound": updated_user.get("treasures_found", 0),
                "coinsFlipped": updated_user.get("coins_flipped", 0),
                "totalStaked": updated_user.get("total_staked", 0)
            }
        }

        return jsonify(response)

    except Exception as e:
        app.logger.error(f"Game action error: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/user/create', methods=['POST'])
def create_user_endpoint():
    """Create new user (called by Telegram bot or frontend)"""
    try:
        data = request.get_json()
        telegram_id = data.get('telegramId')
        username = data.get('username')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        referral_code = data.get('referralCode')

        if not telegram_id:
            return jsonify({"error": "Telegram ID required"}), 400

        # Check if user already exists
        existing_user = get_user_by_telegram_id(telegram_id)
        if existing_user:
            return jsonify({"error": "User already exists"}), 400

        # Handle referral
        referred_by = None
        if referral_code and referral_code != str(telegram_id):
            referrer = get_user_by_telegram_id(int(referral_code))
            if referrer:
                referred_by = int(referral_code)
                # Give referrer bonus
                add_referral(referred_by, telegram_id)

        # Create user
        user = create_user(telegram_id, username, first_name, last_name, referred_by)
        if not user:
            return jsonify({"error": "Failed to create user"}), 500

        return jsonify({"success": True, "user": user}), 201

    except Exception as e:
        app.logger.error(f"Create user error: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get top players leaderboard"""
    try:
        query = """
        SELECT first_name, last_name, username, total_earnings, level
        FROM users
        WHERE banned = FALSE
        ORDER BY total_earnings DESC
        LIMIT 10
        """
        top_users = execute_query(query, fetch=True)

        leaderboard = []
        for i, user in enumerate(top_users or []):
            name = user.get("first_name") or user.get("username") or "Anonymous"
            leaderboard.append({
                "rank": i + 1,
                "name": name,
                "totalEarnings": user.get("total_earnings", 0),
                "level": user.get("level", 1)
            })

        return jsonify({"leaderboard": leaderboard})

    except Exception as e:
        app.logger.error(f"Leaderboard error: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    """Get admin statistics"""
    try:
        if not connection_pool:
            return jsonify({"error": "Database not connected"}), 500

        # Get total users
        result = execute_query("SELECT COUNT(*) as count FROM users", fetch=True)
        total_users = result[0]['count'] if result else 0

        # Get active users (last 24 hours)
        yesterday = datetime.now() - timedelta(days=1)
        result = execute_query(
            "SELECT COUNT(*) as count FROM users WHERE last_action_time >= %s",
            (yesterday,), fetch=True
        )
        active_users = result[0]['count'] if result else 0

        # Get total coins and taps
        result = execute_query(
            "SELECT SUM(total_earnings) as total_coins, SUM(taps_count) as total_taps FROM users",
            fetch=True
        )
        stats_data = result[0] if result else {}
        total_coins = stats_data.get('total_coins', 0) or 0
        total_taps = stats_data.get('total_taps', 0) or 0

        stats = {
            "totalUsers": total_users,
            "activeUsers": active_users,
            "totalCoinsEarned": total_coins,
            "totalTaps": total_taps
        }

        return jsonify(stats)

    except Exception as e:
        app.logger.error(f"Admin stats error: {e}")
        return jsonify({"error": "Server error"}), 500

# Database initialization
def init_database():
    """Initialize database tables"""
    tables = {
        'users': """
            CREATE TABLE IF NOT EXISTS users (
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
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_telegram_id (telegram_id),
                INDEX idx_total_earnings (total_earnings),
                INDEX idx_last_action (last_action_time)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        'game_actions': """
            CREATE TABLE IF NOT EXISTS game_actions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                action VARCHAR(50) NOT NULL,
                amount INT NOT NULL,
                result TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                verified BOOLEAN DEFAULT TRUE,
                INDEX idx_user_id (user_id),
                INDEX idx_timestamp (timestamp),
                INDEX idx_action (action)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    }

    for table_name, create_sql in tables.items():
        try:
            execute_query(create_sql)
            print(f"✅ Table '{table_name}' ready")
        except Exception as e:
            print(f"❌ Error creating table '{table_name}': {e}")

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(429)
def rate_limit_handler(e):
    return jsonify({"error": "Rate limit exceeded"}), 429

# Initialize logging
logging.basicConfig(level=logging.INFO)

if __name__ == '__main__':
    # Initialize database tables
    init_database()

    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    print(f"🚀 Keze Tap Game MySQL server starting on port {port}")
    print(f"🤖 Telegram bot: {'configured' if telegram_bot else 'not configured'}")
    print(f"💾 Database: {'connected' if connection_pool else 'not connected'}")

    app.run(host='0.0.0.0', port=port, debug=debug)
