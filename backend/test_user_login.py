#!/usr/bin/env python3

import requests
import json

def test_user_login():
    """Test user login endpoint"""
    print("TESTING USER LOGIN")
    print("=" * 25)
    
    base_url = "http://localhost:5000"
    
    # Test login with a user that should exist
    login_data = {
        "email": "testuser@example.com",
        "password": "password123"
    }
    
    try:
        print(f"[TEST] Attempting login with: {login_data['email']}")
        response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success', False)}")
            print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")
    
    print(f"\n" + "=" * 25)
    print("USER LOGIN TEST COMPLETE")

if __name__ == "__main__":
    test_user_login()
