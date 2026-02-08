#!/usr/bin/env python3
"""
Debug Admin Authentication - Find why admin access is denied
"""

import requests
import json

def debug_admin_auth():
    """Debug admin authentication issues"""
    print("=== ADMIN AUTHENTICATION DEBUG ===")
    print()
    
    # Test admin login
    print("1. Testing admin login...")
    admin_login = requests.post('http://127.0.0.1:5000/api/admin/auth/login', 
                               json={'email': 'info@kamioi.com', 'password': 'admin123'})
    
    print(f"   Login Status: {admin_login.status_code}")
    if admin_login.status_code == 200:
        data = admin_login.json()
        print(f"   Success: {data.get('success')}")
        print(f"   Token: {data.get('token', 'None')[:20]}...")
        print(f"   User: {data.get('user', {})}")
        
        # Test admin transactions with token
        token = data.get('token')
        if token:
            print()
            print("2. Testing admin transactions with token...")
            headers = {'Authorization': f'Bearer {token}'}
            txn_resp = requests.get('http://127.0.0.1:5000/api/admin/transactions', headers=headers)
            print(f"   Transactions Status: {txn_resp.status_code}")
            if txn_resp.status_code == 200:
                txn_data = txn_resp.json()
                print(f"   Success: {txn_data.get('success')}")
                print(f"   Data Count: {len(txn_data.get('data', []))}")
            else:
                print(f"   Error: {txn_resp.text[:200]}")
    else:
        print(f"   Login Error: {admin_login.text[:200]}")
    
    print()
    
    # Test admin auth/me endpoint
    print("3. Testing admin auth/me endpoint...")
    if admin_login.status_code == 200:
        token = admin_login.json().get('token')
        if token:
            headers = {'Authorization': f'Bearer {token}'}
            me_resp = requests.get('http://127.0.0.1:5000/api/admin/auth/me', headers=headers)
            print(f"   Auth/Me Status: {me_resp.status_code}")
            if me_resp.status_code == 200:
                me_data = me_resp.json()
                print(f"   Success: {me_data.get('success')}")
                print(f"   User: {me_data.get('user', {})}")
            else:
                print(f"   Error: {me_resp.text[:200]}")
    
    print()
    print("=== DEBUG COMPLETE ===")

if __name__ == "__main__":
    debug_admin_auth()
