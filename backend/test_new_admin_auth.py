#!/usr/bin/env python3
"""
Test New Admin Authentication - Verify separate admin authentication works
"""

import requests
import json

def test_new_admin_auth():
    """Test the new separate admin authentication system"""
    print("=== TESTING NEW ADMIN AUTHENTICATION ===")
    print()
    
    # Test admin login
    print("1. Testing admin login...")
    admin_resp = requests.post('http://127.0.0.1:5000/api/admin/auth/login', 
                              json={'email': 'info@kamioi.com', 'password': 'admin123'})
    
    print(f"Status: {admin_resp.status_code}")
    if admin_resp.status_code == 200:
        data = admin_resp.json()
        print(f"Success: {data.get('success')}")
        print(f"Token: {data.get('token')}")
        print(f"User: {data.get('user')}")
        
        # Test admin auth/me
        print("\n2. Testing admin auth/me...")
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
            
        # Test admin transactions
        print("\n3. Testing admin transactions...")
        txn_resp = requests.get('http://127.0.0.1:5000/api/admin/transactions', headers=headers)
        
        print(f"Status: {txn_resp.status_code}")
        if txn_resp.status_code == 200:
            txn_data = txn_resp.json()
            print(f"Success: {txn_data.get('success')}")
            print(f"Data count: {len(txn_data.get('data', []))}")
            print("✅ Admin transactions working!")
        else:
            print(f"Error: {txn_resp.text[:200]}")
    else:
        print(f"Error: {admin_resp.text[:200]}")
    
    print("\n=== NEW ADMIN AUTHENTICATION TEST COMPLETE ===")

if __name__ == "__main__":
    test_new_admin_auth()
