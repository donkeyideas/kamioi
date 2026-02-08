#!/usr/bin/env python3
"""
Test User Transactions Final - Verify date field is working
"""

import requests
import json

def test_user_transactions_final():
    """Test user transactions with correct credentials"""
    print("=== USER TRANSACTIONS FINAL TEST ===")
    print()
    
    # Login first
    print("1. Testing user login...")
    login_resp = requests.post('http://127.0.0.1:5000/api/user/auth/login', 
                              json={'email': 'user5@user5.com', 'password': 'defaultPassword123'})
    
    if login_resp.status_code != 200:
        print(f"[ERROR] Login failed: {login_resp.status_code}")
        print(f"Response: {login_resp.text[:200]}")
        return
    
    data = login_resp.json()
    token = data.get('token')
    print(f"[OK] Login successful, token: {token[:20]}...")
    
    # Test transactions endpoint
    print("\n2. Testing user transactions endpoint...")
    headers = {'Authorization': f'Bearer {token}'}
    txn_resp = requests.get('http://127.0.0.1:5000/api/user/transactions', headers=headers)
    
    print(f"Status: {txn_resp.status_code}")
    if txn_resp.status_code == 200:
        txn_data = txn_resp.json()
        print(f"Success: {txn_data.get('success')}")
        print(f"Data count: {len(txn_data.get('data', []))}")
        
        # Check first transaction for date field
        if txn_data.get('data'):
            first_txn = txn_data['data'][0]
            print("\n3. First transaction details:")
            print(f"   Date: {first_txn.get('date')}")
            print(f"   Created_at: {first_txn.get('created_at')}")
            print(f"   Merchant: {first_txn.get('merchant')}")
            print(f"   Amount: {first_txn.get('amount')}")
            print(f"   Status: {first_txn.get('status')}")
            
            # Check if date field is populated
            if first_txn.get('date'):
                print("\n✅ SUCCESS: Date field is populated!")
            else:
                print("\n❌ ERROR: Date field is missing!")
        else:
            print("No transaction data found")
    else:
        print(f"Error: {txn_resp.text[:200]}")
    
    print("\n=== USER TRANSACTIONS FINAL TEST COMPLETE ===")

if __name__ == "__main__":
    test_user_transactions_final()
