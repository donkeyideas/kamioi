#!/usr/bin/env python3

import requests
import json

def test_redirect_issue():
    """Test the current user state to understand the redirect issue"""
    print("TESTING REDIRECT ISSUE")
    print("=" * 25)
    
    base_url = "http://localhost:5000"
    
    # Test login to see what user data is returned
    login_data = {
        "email": "user@user.com",
        "password": "password123"
    }
    
    try:
        print(f"[TEST] Testing login to understand user data structure")
        response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success', False)}")
            if result.get('success'):
                user = result.get('user', {})
                print(f"User data:")
                print(f"  - ID: {user.get('id')}")
                print(f"  - Email: {user.get('email')}")
                print(f"  - Name: {user.get('name')}")
                print(f"  - Role: {user.get('role')}")
                print(f"  - Dashboard: {user.get('dashboard', 'Not set')}")
                print(f"Token: {result.get('token', 'N/A')[:20]}...")
                
                # Test /me endpoint to see what the frontend gets
                print(f"\n[TEST] Testing /api/user/auth/me endpoint")
                headers = {'Authorization': f'Bearer {result.get("token")}'}
                me_response = requests.get(f"{base_url}/api/user/auth/me", headers=headers)
                print(f"Me Status: {me_response.status_code}")
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    print(f"Me Response: {json.dumps(me_data, indent=2)}")
                else:
                    print(f"Me Error: {me_response.text}")
            else:
                print(f"Login failed: {result.get('error')}")
        else:
            print(f"Login failed: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")
    
    print(f"\n" + "=" * 25)
    print("REDIRECT ISSUE TEST COMPLETE")

if __name__ == "__main__":
    test_redirect_issue()
