#!/usr/bin/env python3
"""
Check Server Status
"""

import requests
import time

def check_server():
    """Check server status"""
    print("=== CHECKING SERVER STATUS ===")
    
    time.sleep(3)  # Wait for server to reload
    
    # Test health
    try:
        health_resp = requests.get('http://127.0.0.1:5000/api/health')
        print(f"Health: {health_resp.status_code}")
        print(f"Health response: {health_resp.text}")
    except Exception as e:
        print(f"Health error: {e}")
    
    # Test debug routes
    try:
        debug_resp = requests.get('http://127.0.0.1:5000/api/debug/routes')
        print(f"\nDebug routes: {debug_resp.status_code}")
        print(f"Debug response: {debug_resp.text[:200]}")
    except Exception as e:
        print(f"Debug routes error: {e}")
    
    # Test admin login
    try:
        admin_resp = requests.post('http://127.0.0.1:5000/api/admin/auth/login',
                                  json={'email': 'info@kamioi.com', 'password': 'admin123'})
        print(f"\nAdmin login: {admin_resp.status_code}")
        print(f"Admin response: {admin_resp.text[:200]}")
    except Exception as e:
        print(f"Admin login error: {e}")

if __name__ == "__main__":
    check_server()
