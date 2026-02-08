#!/usr/bin/env python3
"""
Run the Flask server with proper path resolution
"""
import sys
import os

# Ensure we're in the correct directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Add current directory to Python path
sys.path.insert(0, os.getcwd())

# Import and run the app
from app import app

if __name__ == '__main__':
    print("Starting Kamioi Backend Server...")
    print(f"Working directory: {os.getcwd()}")
    print(f"Python path: {sys.path[0]}")
    print(f"Server will be available at: http://127.0.0.1:5000")
    
    # Test that routes are registered
    routes = [str(rule) for rule in app.url_map.iter_rules()]
    print(f"Routes registered: {len(routes)}")
    
    # Show some key routes
    key_routes = [r for r in routes if any(x in r for x in ['/api/admin/users', '/api/financial/cash-flow', '/api/'])]
    print(f"Key routes: {key_routes[:5]}")
    
    app.run(host='127.0.0.1', port=5000, debug=True)
