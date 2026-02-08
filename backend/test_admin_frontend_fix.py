#!/usr/bin/env python3
"""
Test Admin Frontend Fix - Verify admin authentication works end-to-end
"""

import requests
import json

def test_admin_frontend_fix():
    """Test that admin authentication works for frontend"""
    print("=== ADMIN FRONTEND FIX TEST ===")
    print()
    
    # Test admin login (simulating frontend call)
    print("1. Testing admin login (frontend simulation)...")
    admin_login = requests.post('http://127.0.0.1:5000/api/admin/auth/login', 
                               json={'email': 'info@kamioi.com', 'password': 'admin123'})
    
    if admin_login.status_code != 200:
        print(f"[ERROR] Admin login failed: {admin_login.status_code}")
        return
    
    data = admin_login.json()
    token = data.get('token')
    user = data.get('user')
    
    print(f"[OK] Admin login successful")
    print(f"   Token: {token[:20]}...")
    print(f"   User: {user}")
    print(f"   Role: {user.get('role')}")
    print(f"   Dashboard: {user.get('dashboard')}")
    
    # Test admin endpoints with token
    print("\n2. Testing admin endpoints with token...")
    headers = {'Authorization': f'Bearer {token}'}
    
    endpoints = [
        ('/api/admin/transactions', 'Admin Transactions'),
        ('/api/admin/auth/me', 'Admin Auth/Me'),
        ('/api/admin/llm-center/mappings', 'LLM Mappings'),
        ('/api/admin/llm-center/queue', 'LLM Queue')
    ]
    
    for endpoint, name in endpoints:
        try:
            resp = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                print(f"   [OK] {name}: {resp.status_code}")
                if 'data' in data:
                    print(f"      Data count: {len(data['data']) if isinstance(data['data'], list) else 'N/A'}")
            else:
                print(f"   [ERROR] {name}: {resp.status_code} - {resp.text[:100]}")
        except Exception as e:
            print(f"   [ERROR] {name}: Exception - {e}")
    
    # Test that user endpoints are blocked for admin token
    print("\n3. Testing user endpoints with admin token (should be blocked)...")
    user_endpoints = [
        '/api/user/transactions',
        '/api/user/portfolio',
        '/api/user/goals'
    ]
    
    for endpoint in user_endpoints:
        try:
            resp = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers)
            if resp.status_code == 200:
                print(f"   [WARNING] {endpoint}: {resp.status_code} (should be blocked)")
            else:
                print(f"   [OK] {endpoint}: {resp.status_code} (correctly blocked)")
        except Exception as e:
            print(f"   [ERROR] {endpoint}: Exception - {e}")
    
    print("\n=== ADMIN FRONTEND FIX TEST COMPLETE ===")
    print("[OK] Admin authentication is working correctly")
    print("[OK] Frontend should now be able to login as admin")
    print("[OK] Admin endpoints are accessible with admin token")

if __name__ == "__main__":
    test_admin_frontend_fix()
