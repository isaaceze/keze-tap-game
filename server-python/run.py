#!/usr/bin/env python3
"""
Keze Tap Game Python Backend Startup Script
For development and testing
"""

import os
import sys
from config import config, Config

def main():
    """Start the Flask application"""

    # Get environment
    env = os.getenv('FLASK_ENV', 'development')
    app_config = config.get(env, config['default'])

    # Validate configuration
    errors = Config.validate()
    if errors:
        print("❌ Configuration errors:")
        for error in errors:
            print(f"   - {error}")
        if env == 'production':
            sys.exit(1)
        else:
            print("⚠️  Continuing in development mode...")

    # Import and configure app
    from app import app
    app.config.from_object(app_config)

    # Print startup info
    print(f"🚀 Starting Keze Tap Game Python Backend")
    print(f"📍 Environment: {env}")
    print(f"🌐 Host: {app_config.HOST}:{app_config.PORT}")
    print(f"🐛 Debug: {app_config.DEBUG}")
    print(f"💾 Database: {'Connected' if app_config.MONGODB_URI else 'Not configured'}")
    print(f"🤖 Telegram Bot: {'Configured' if app_config.TELEGRAM_BOT_TOKEN else 'Not configured'}")
    print(f"🎮 Game URL: {app_config.GAME_URL}")

    # Start the application
    try:
        app.run(
            host=app_config.HOST,
            port=app_config.PORT,
            debug=app_config.DEBUG
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down Keze Tap Game backend...")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
