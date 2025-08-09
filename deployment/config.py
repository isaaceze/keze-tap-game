"""
Configuration settings for Keze Tap Game Python Backend
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration class"""

    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    # Server settings
    PORT = int(os.getenv('PORT', 5000))
    HOST = os.getenv('HOST', '0.0.0.0')

    # Database settings
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/keze-tap-game')

    # Telegram settings
    TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')

    # URLs
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    GAME_URL = os.getenv('GAME_URL', 'http://localhost:3000')

    # Rate limiting
    RATELIMIT_STORAGE_URL = os.getenv('RATELIMIT_STORAGE_URL', 'memory://')

    # Game settings
    MAX_ENERGY = int(os.getenv('MAX_ENERGY', 1000))
    ENERGY_REGEN_RATE = int(os.getenv('ENERGY_REGEN_RATE', 2))  # per minute
    REFERRAL_BONUS = int(os.getenv('REFERRAL_BONUS', 1000))
    NEW_USER_BONUS = int(os.getenv('NEW_USER_BONUS', 500))

    # Anti-cheat settings
    MIN_TAP_INTERVAL = float(os.getenv('MIN_TAP_INTERVAL', 0.1))  # seconds
    MAX_TAPS_PER_REQUEST = int(os.getenv('MAX_TAPS_PER_REQUEST', 10))
    SUSPICIOUS_ACTION_THRESHOLD = int(os.getenv('SUSPICIOUS_ACTION_THRESHOLD', 50))

    # CORS settings
    CORS_ORIGINS = [FRONTEND_URL] if FRONTEND_URL else ['*']

    @staticmethod
    def validate():
        """Validate critical configuration"""
        errors = []

        if not Config.MONGODB_URI:
            errors.append("MONGODB_URI is required")

        if not Config.TELEGRAM_BOT_TOKEN:
            errors.append("TELEGRAM_BOT_TOKEN is required for bot functionality")

        if not Config.SECRET_KEY or Config.SECRET_KEY == 'dev-secret-key-change-in-production':
            if not Config.DEBUG:
                errors.append("SECRET_KEY must be set in production")

        return errors

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    MONGODB_URI = 'mongodb://localhost:27017/keze-tap-game-test'

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
