#!/usr/bin/env python3
"""
WSGI entry point for Keze Tap Game Flask application
For deployment on shared hosting providers
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import the Flask application
from app import app as application

if __name__ == "__main__":
    application.run()
