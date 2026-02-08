#!/usr/bin/env python3

import requests
import json

def test_rewards_endpoint():
    """Test the new /api/user/rewards endpoint"""
    print("TESTING NEW REWARDS ENDPOINT")
    print("=" * 30)
    
    base_url = "http://localhost:5000"
    
    # Test 1: Login first
    print("\n[TEST 1] User Login")
    print("-" * 20)
    login_data = {
        "email": "user@user.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                token = result.get('token')
                print(f"[OK] Login successful")
                print(f"Token: {token[:20]}...")
                
                headers = {'Authorization': f'Bearer {token}'}
                
                # Test 2: /api/user/rewards
                print(f"\n[TEST 2] /api/user/rewards")
                print("-" * 25)
                response = requests.get(f"{base_url}/api/user/rewards", headers=headers)
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"[OK] Rewards endpoint working")
                    print(f"Rewards count: {len(data.get('rewards', []))}")
                    print(f"Sample reward: {data.get('rewards', [{}])[0].get('title', 'N/A')}")
                else:
                    print(f"[FAIL] Rewards endpoint failed: {response.text}")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Error: {e}")
    
    print(f"\n" + "=" * 30)
    print("REWARDS ENDPOINT TEST COMPLETE")

if __name__ == "__main__":
    test_rewards_endpoint()
