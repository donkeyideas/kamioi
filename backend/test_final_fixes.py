#!/usr/bin/env python3

import requests
import json

def test_final_fixes():
    """Test the final fixes for rewards and profile endpoints"""
    print("TESTING FINAL FIXES")
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
                
                # Test 2: /api/user/rewards with auth
                print(f"\n[TEST 2] /api/user/rewards (with auth)")
                print("-" * 35)
                response = requests.get(f"{base_url}/api/user/rewards", headers=headers)
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"[OK] Rewards endpoint working")
                    print(f"Rewards count: {len(data.get('rewards', []))}")
                else:
                    print(f"[FAIL] Rewards endpoint failed: {response.text}")
                
                # Test 3: /api/user/profile with auth
                print(f"\n[TEST 3] /api/user/profile (with auth)")
                print("-" * 35)
                response = requests.get(f"{base_url}/api/user/profile", headers=headers)
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"[OK] Profile endpoint working")
                    print(f"Profile structure: {list(data.keys())}")
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
    print("FINAL FIXES TEST COMPLETE")

if __name__ == "__main__":
    test_final_fixes()
