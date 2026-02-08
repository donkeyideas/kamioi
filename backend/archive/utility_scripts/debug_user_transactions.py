#!/usr/bin/env python3
"""
Debug User Transactions - Check if date data is being returned correctly
"""

import requests
import json

def debug_user_transactions():
    """Debug user transactions data to check for missing dates"""
    print("=== USER TRANSACTIONS DATA DEBUG ===")
    print()
    
    # Test user login first
    print("1. Testing user login...")
    user_login = requests.post('http://127.0.0.1:5000/api/user/auth/login', 
                              json={'email': 'user5@user5.com', 'password': 'user5'})
    
    if user_login.status_code != 200:
        print(f"[ERROR] User login failed: {user_login.status_code}")
        print(f"Response: {user_login.text[:200]}")
        return
    
    data = user_login.json()
    token = data.get('token')
    print(f"[OK] Login successful, token: {token[:20]}...")
    
    # Test user transactions endpoint
    print()
    print("2. Testing user transactions endpoint...")
    headers = {'Authorization': f'Bearer {token}'}
    txn_resp = requests.get('http://127.0.0.1:5000/api/user/transactions', headers=headers)
    
    print(f"Status: {txn_resp.status_code}")
    if txn_resp.status_code == 200:
        txn_data = txn_resp.json()
        print(f"Success: {txn_data.get('success')}")
        print(f"Data count: {len(txn_data.get('data', []))}")
        
        # Show first transaction details
        if txn_data.get('data'):
            first_txn = txn_data['data'][0]
            print()
            print("3. First transaction details:")
            for key, value in first_txn.items():
                print(f"   {key}: {value}")
            
            # Check specifically for date fields
            print()
            print("4. Date field analysis:")
            date_fields = ['date', 'created_at', 'updated_at', 'transaction_date']
            for field in date_fields:
                if field in first_txn:
                    print(f"   {field}: {first_txn[field]}")
                else:
                    print(f"   {field}: NOT FOUND")
        else:
            print("No transaction data found")
    else:
        print(f"Error: {txn_resp.text[:200]}")
    
    print()
    print("=== DEBUG COMPLETE ===")

if __name__ == "__main__":
    debug_user_transactions()
