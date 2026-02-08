#!/usr/bin/env python3
"""
Test Frontend Data Flow - Verify data flows from database to frontend
"""

import requests
import json

def test_complete_data_flow():
    """Test the complete data flow from database to frontend"""
    print("=== FRONTEND DATA FLOW TEST ===")
    print()
    
    # Step 1: Login as user5@user5.com
    print("1. Testing user login...")
    login_resp = requests.post('http://127.0.0.1:5000/api/user/auth/login', 
                             json={'email': 'user5@user5.com', 'password': 'user5'})
    
    if login_resp.status_code != 200:
        print(f"[ERROR] Login failed: {login_resp.status_code}")
        return
    
    token = login_resp.json()['token']
    print(f"[OK] Login successful, token: {token[:20]}...")
    
    # Step 2: Test transactions API
    print("\n2. Testing transactions API...")
    headers = {'Authorization': f'Bearer {token}'}
    txn_resp = requests.get('http://127.0.0.1:5000/api/user/transactions', headers=headers)
    
    if txn_resp.status_code != 200:
        print(f"[ERROR] Transactions API failed: {txn_resp.status_code}")
        print(f"   Response: {txn_resp.text}")
        return
    
    data = txn_resp.json()
    print(f"[OK] Transactions API successful")
    print(f"   Response format: {list(data.keys())}")
    print(f"   Data type: {type(data.get('data'))}")
    print(f"   Data length: {len(data.get('data', []))}")
    
    if data.get('data'):
        print(f"   Sample transaction: {data['data'][0]}")
    
    # Step 3: Test portfolio API
    print("\n3. Testing portfolio API...")
    portfolio_resp = requests.get('http://127.0.0.1:5000/api/user/portfolio', headers=headers)
    
    if portfolio_resp.status_code != 200:
        print(f"[ERROR] Portfolio API failed: {portfolio_resp.status_code}")
        print(f"   Response: {portfolio_resp.text}")
    else:
        portfolio_data = portfolio_resp.json()
        print(f"[OK] Portfolio API successful")
        print(f"   Response format: {list(portfolio_data.keys())}")
        if portfolio_data.get('data'):
            print(f"   Portfolio data: {portfolio_data['data']}")
    
    # Step 4: Test other APIs
    print("\n4. Testing other APIs...")
    apis_to_test = [
        ('/user/goals', 'Goals'),
        ('/user/ai/insights', 'AI Insights'),
        ('/user/notifications', 'Notifications'),
        ('/user/roundups/total', 'Round-ups Total'),
        ('/user/fees/total', 'Fees Total')
    ]
    
    for endpoint, name in apis_to_test:
        try:
            resp = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers)
            if resp.status_code == 200:
                print(f"   [OK] {name}: {resp.status_code}")
            else:
                print(f"   [ERROR] {name}: {resp.status_code}")
        except Exception as e:
            print(f"   [ERROR] {name}: Error - {e}")
    
    print("\n=== DATA FLOW TEST COMPLETE ===")

if __name__ == "__main__":
    test_complete_data_flow()
