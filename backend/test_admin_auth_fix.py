#!/usr/bin/env python3
"""
Test Admin Auth Fix - Verify admin authentication is working properly
"""

import requests
import json

def test_admin_auth_fix():
    """Test admin authentication and transactions"""
    print("=== ADMIN AUTH FIX TEST ===")
    print()
    
    # Login as admin
    print("1. Testing admin login...")
    admin_resp = requests.post('http://127.0.0.1:5000/api/admin/auth/login', 
                              json={'email': 'info@kamioi.com', 'password': 'admin123'})
    
    if admin_resp.status_code != 200:
        print(f"[ERROR] Admin login failed: {admin_resp.status_code}")
        print(f"Response: {admin_resp.text[:200]}")
        return
    
    data = admin_resp.json()
    token = data.get('token')
    print(f"[OK] Admin login successful, token: {token[:20]}...")
    print(f"User: {data.get('user')}")
    
    # Test admin transactions
    print("\n2. Testing admin transactions...")
    headers = {'Authorization': f'Bearer {token}'}
    txn_resp = requests.get('http://127.0.0.1:5000/api/admin/transactions', headers=headers)
    
    print(f"Status: {txn_resp.status_code}")
    if txn_resp.status_code == 200:
        txn_data = txn_resp.json()
        print(f"Success: {txn_data.get('success')}")
        print(f"Data count: {len(txn_data.get('data', []))}")
        print("[OK] Admin transactions working!")
    else:
        print(f"Error: {txn_resp.text[:200]}")
        print("[ERROR] Admin transactions failed!")
    
    # Test admin auth/me
    print("\n3. Testing admin auth/me...")
    me_resp = requests.get('http://127.0.0.1:5000/api/admin/auth/me', headers=headers)
    
    print(f"Status: {me_resp.status_code}")
    if me_resp.status_code == 200:
        me_data = me_resp.json()
        print(f"Success: {me_data.get('success')}")
        print(f"User: {me_data.get('user')}")
        print("[OK] Admin auth/me working!")
    else:
        print(f"Error: {me_resp.text[:200]}")
        print("[ERROR] Admin auth/me failed!")
    
    print("\n=== ADMIN AUTH FIX TEST COMPLETE ===")

if __name__ == "__main__":
    test_admin_auth_fix()
