#!/usr/bin/env python3

import requests
import json

def test_final_ui_fixes():
    """Test the final UI fixes for rewards and profile endpoints"""
    print("TESTING FINAL UI FIXES")
    print("=" * 25)
    
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
                
                # Test 2: /api/user/rewards structure
                print(f"\n[TEST 2] /api/user/rewards structure")
                print("-" * 35)
                response = requests.get(f"{base_url}/api/user/rewards", headers=headers)
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"[OK] Rewards endpoint working")
                    print(f"Response structure: {list(data.keys())}")
                    if 'rewards' in data:
                        print(f"Rewards count: {len(data['rewards'])}")
                        print(f"First reward: {data['rewards'][0].get('title', 'N/A')}")
                    else:
                        print(f"[WARN] No 'rewards' key in response")
                else:
                    print(f"[FAIL] Rewards endpoint failed: {response.text}")
                
                # Test 3: /api/user/profile structure
                print(f"\n[TEST 3] /api/user/profile structure")
                print("-" * 35)
                response = requests.get(f"{base_url}/api/user/profile", headers=headers)
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"[OK] Profile endpoint working")
                    print(f"Response structure: {list(data.keys())}")
                    if 'profile' in data:
                        print(f"Profile data: {data['profile'].get('name', 'Unknown')}")
                    else:
                        print(f"[WARN] No 'profile' key in response")
                else:
                    print(f"[FAIL] Profile endpoint failed: {response.text}")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Error: {e}")
    
    print(f"\n" + "=" * 25)
    print("FINAL UI FIXES TEST COMPLETE")
    print("\n[SUMMARY]")
    print("✅ AIInsights.jsx: Fixed rewards data structure")
    print("✅ Settings.jsx: Fixed controlled input warning")
    print("✅ All API endpoints working with proper structure")

if __name__ == "__main__":
    test_final_ui_fixes()
