#!/usr/bin/env python3

import requests
import json

def test_auth_me_endpoint():
    """Test the /api/user/auth/me endpoint to see what it returns"""
    print("TESTING /api/user/auth/me ENDPOINT")
    print("=" * 35)
    
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
                print(f"[OK] Login successful")
                print(f"Token: {token[:20]}...")
                
                # Test /me endpoint
                headers = {'Authorization': f'Bearer {token}'}
                me_response = requests.get(f"{base_url}/api/user/auth/me", headers=headers)
                print(f"\n[TEST] /api/user/auth/me")
                print(f"Status: {me_response.status_code}")
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    print(f"Response: {json.dumps(me_data, indent=2)}")
                    
                    # Check the structure
                    if me_data.get('success'):
                        user_data = me_data.get('user', {})
                        print(f"\n[ANALYSIS] User data structure:")
                        print(f"  - ID: {user_data.get('id')} (Type: {type(user_data.get('id'))})")
                        print(f"  - Email: {user_data.get('email')}")
                        print(f"  - Name: {user_data.get('name')}")
                        print(f"  - Role: {user_data.get('role')}")
                        print(f"  - Dashboard: {user_data.get('dashboard', 'Not set')}")
                    else:
                        print(f"[ERROR] /me endpoint returned success: false")
                else:
                    print(f"[FAIL] /me endpoint failed: {me_response.text}")
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Error: {e}")
    
    print(f"\n" + "=" * 35)
    print("AUTH ME ENDPOINT TEST COMPLETE")

if __name__ == "__main__":
    test_auth_me_endpoint()
