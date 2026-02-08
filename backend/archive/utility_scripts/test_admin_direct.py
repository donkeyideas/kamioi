#!/usr/bin/env python3
"""
Test admin login directly
"""

import requests
import json

def test_admin_login():
    """Test admin login directly"""
    print("=== TESTING ADMIN LOGIN DIRECTLY ===")
    
    # Test admin login
    print("Testing admin login...")
    resp = requests.post('http://127.0.0.1:5000/api/admin/auth/login', 
                         json={'email': 'info@kamioi.com', 'password': 'admin123'},
                         headers={'Content-Type': 'application/json'})
    
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text[:200]}")
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"Success: {data.get('success')}")
        print(f"Token: {data.get('token')}")
        print(f"User: {data.get('user')}")
        
        # Test admin auth/me
        print("\nTesting admin auth/me...")
        token = data.get('token')
        headers = {'Authorization': f'Bearer {token}'}
        me_resp = requests.get('http://127.0.0.1:5000/api/admin/auth/me', headers=headers)
        
        print(f"Status: {me_resp.status_code}")
        if me_resp.status_code == 200:
            me_data = me_resp.json()
            print(f"Success: {me_data.get('success')}")
            print(f"User: {me_data.get('user')}")
            print("✅ Admin authentication working!")
        else:
            print(f"Error: {me_resp.text[:200]}")
    else:
        print(f"Error: {resp.text[:200]}")

if __name__ == "__main__":
    test_admin_login()
