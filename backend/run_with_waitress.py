#!/usr/bin/env python3
"""
Run Flask app with Waitress instead of werkzeug development server
"""
import os
import sys

# Import app first to get all initialization done
from app import app

port = int(os.getenv('PORT', '5111'))

print(f"\nStarting server on port {port} using Waitress...")
print(f"Database: {'PostgreSQL' if os.getenv('DB_TYPE', '').lower() == 'postgresql' else 'SQLite'}")
print()

try:
    from waitress import serve
    print("Using Waitress WSGI server")
    print(f"Server will be available at http://0.0.0.0:{port}")
    print("Press Ctrl+C to stop\n")
    serve(app, host='0.0.0.0', port=port, threads=4, channel_timeout=120)
except ImportError:
    print("ERROR: Waitress not installed in current virtual environment")
    print("Please run: pip install waitress")
    print("Or activate your virtual environment and try again")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: Failed to start Waitress server: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

