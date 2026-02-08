"""Start Flask without auto-reload to avoid database locking"""
import os
import sys

# Set environment variable to disable debug mode
os.environ['FLASK_ENV'] = 'development'
os.environ['FLASK_DEBUG'] = '0'

# Import and run the app
if __name__ == '__main__':
    from app_clean import app
    print("Starting Flask without auto-reload to avoid database locking...")
    print("Server will be available at: http://127.0.0.1:5001")
    app.run(host='127.0.0.1', port=5001, debug=False, use_reloader=False)
