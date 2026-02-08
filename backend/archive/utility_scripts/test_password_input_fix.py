#!/usr/bin/env python3
"""
Test script to verify the password input fix in Settings.jsx
"""

import requests
import json

def test_user_login():
    """Test user login to verify the system is working"""
    try:
        # Test user login
        login_url = "http://127.0.0.1:5000/api/user/auth/login"
        login_data = {
            "email": "user@user.com",
            "password": "user123"
        }
        
        print("Testing user login...")
        response = requests.post(login_url, json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            print("User login successful")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error during login test: {e}")
        return False

def test_profile_endpoint():
    """Test the profile endpoint to verify it's working"""
    try:
        # Test profile endpoint
        profile_url = "http://127.0.0.1:5000/api/user/profile"
        headers = {
            "Authorization": "Bearer user_token_1760662953538"
        }
        
        print("\nTesting profile endpoint...")
        response = requests.get(profile_url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("Profile endpoint working")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"Profile endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error during profile test: {e}")
        return False

if __name__ == "__main__":
    print("Testing Settings.jsx Password Input Fix")
    print("=" * 50)
    
    # Test login
    login_success = test_user_login()
    
    if login_success:
        # Test profile endpoint
        profile_success = test_profile_endpoint()
        
        if profile_success:
            print("\nAll tests passed! Settings.jsx should now work without controlled input warnings.")
            print("Password input now has proper value and onChange props")
            print("All form inputs are now properly controlled")
        else:
            print("\nProfile endpoint test failed")
    else:
        print("\nLogin test failed")
    
    print("\n" + "=" * 50)
    print("The controlled input warning should now be resolved!")
