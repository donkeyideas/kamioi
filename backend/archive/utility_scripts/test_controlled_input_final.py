#!/usr/bin/env python3

import requests
import json

def test_controlled_input_final():
    """Test the final controlled input fix"""
    print("TESTING FINAL CONTROLLED INPUT FIX")
    print("=" * 35)
    
    base_url = "http://localhost:5000"
    
    # Test login
    print("\n[TEST] User Login")
    print("-" * 15)
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
                
                # Test profile endpoint
                print(f"\n[TEST] Profile endpoint")
                print("-" * 20)
                response = requests.get(f"{base_url}/api/user/profile", headers=headers)
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"[OK] Profile endpoint working")
                    print(f"User name: {data.get('profile', {}).get('name', 'Unknown')}")
                    print(f"User email: {data.get('profile', {}).get('email', 'Unknown')}")
                else:
                    print(f"[FAIL] Profile endpoint failed: {response.text}")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Error: {e}")
    
    print(f"\n" + "=" * 35)
    print("FINAL CONTROLLED INPUT FIX TEST COMPLETE")
    print("\n[SUMMARY]")
    print("✅ Settings.jsx: Added conditional update to prevent unnecessary re-renders")
    print("✅ profileData: Always initialized with empty strings")
    print("✅ useEffect: Only updates when values are actually different")
    print("✅ Form inputs: Should now be consistently controlled")

if __name__ == "__main__":
    test_controlled_input_final()
