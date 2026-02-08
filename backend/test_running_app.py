#!/usr/bin/env python3
"""
Test what's actually running on the server
"""

import requests
import json

def test_running_app():
    """Test what's actually running"""
    print("=== TESTING RUNNING APP ===")
    
    # Test a simple endpoint that should work
    try:
        resp = requests.get('http://127.0.0.1:5000/api/health')
        print(f"Health: {resp.status_code}")
        if resp.status_code == 200:
            print(f"Health data: {resp.json()}")
    except Exception as e:
        print(f"Health error: {e}")
    
    # Test if we can get any route info
    try:
        # Try to access a route that should exist
        resp = requests.get('http://127.0.0.1:5000/api/user/auth/me')
        print(f"User auth me: {resp.status_code}")
        print(f"Response: {resp.text[:100]}")
    except Exception as e:
        print(f"User auth error: {e}")
    
    # Test admin login with different approaches
    try:
        resp = requests.post('http://127.0.0.1:5000/api/admin/auth/login', 
                           json={'email': 'info@kamioi.com', 'password': 'admin123'})
        print(f"Admin login: {resp.status_code}")
        print(f"Response: {resp.text[:200]}")
    except Exception as e:
        print(f"Admin login error: {e}")
    
    # Test if there are any routes at all
    try:
        resp = requests.get('http://127.0.0.1:5000/')
        print(f"Root: {resp.status_code}")
        print(f"Root response: {resp.text[:100]}")
    except Exception as e:
        print(f"Root error: {e}")

if __name__ == "__main__":
    test_running_app()
