#!/usr/bin/env python3

import requests
import json

def test_route_matching():
    """Test if the dashboard route is accessible"""
    print("TESTING ROUTE MATCHING")
    print("=" * 25)
    
    base_url = "http://localhost:5000"
    
    # Login first
    login_data = {
        "email": "user@user.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                token = result.get('token')
                user_id = result.get('user', {}).get('id')
                print(f"[OK] Login successful")
                print(f"User ID: {user_id}")
                print(f"Expected dashboard route: /dashboard/{user_id}/")
                print(f"Token: {token[:20]}...")
                
                # Test if the user can access their dashboard data
                headers = {'Authorization': f'Bearer {token}'}
                
                print(f"\n[TEST] Testing dashboard data access")
                print("-" * 35)
                
                # Test transactions endpoint
                response = requests.get(f"{base_url}/api/user/transactions", headers=headers)
                print(f"Transactions: {response.status_code}")
                
                # Test portfolio endpoint  
                response = requests.get(f"{base_url}/api/user/portfolio", headers=headers)
                print(f"Portfolio: {response.status_code}")
                
                print(f"\n[INFO] If all endpoints return 200, the backend is working correctly.")
                print(f"[INFO] The redirect issue is likely in the frontend routing logic.")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Error: {e}")
    
    print(f"\n" + "=" * 25)
    print("ROUTE MATCHING TEST COMPLETE")

if __name__ == "__main__":
    test_route_matching()
