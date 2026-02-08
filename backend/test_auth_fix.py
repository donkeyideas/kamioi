#!/usr/bin/env python3

import requests
import json

def test_auth_fix():
    """Test that the authentication fixes are working"""
    print("TESTING AUTHENTICATION FIXES")
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
                else:
                    print(f"[FAIL] Rewards endpoint failed: {response.text}")
                
                # Test 3: /api/user/profile
                print(f"\n[TEST 3] /api/user/profile")
                print("-" * 25)
                response = requests.get(f"{base_url}/api/user/profile", headers=headers)
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"[OK] Profile endpoint working")
                    print(f"Profile: {data.get('profile', {}).get('name', 'Unknown')}")
                else:
                    print(f"[FAIL] Profile endpoint failed: {response.text}")
                
                # Test 4: /api/user/ai/insights
                print(f"\n[TEST 4] /api/user/ai/insights")
                print("-" * 30)
                response = requests.get(f"{base_url}/api/user/ai/insights", headers=headers)
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"[OK] AI Insights endpoint working")
                    print(f"Insights count: {len(data.get('insights', []))}")
                else:
                    print(f"[FAIL] AI Insights endpoint failed: {response.text}")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Error: {e}")
    
    print(f"\n" + "=" * 30)
    print("AUTHENTICATION FIX TEST COMPLETE")

if __name__ == "__main__":
    test_auth_fix()
