#!/usr/bin/env python3

import requests
import json

def create_user_with_correct_password():
    """Create a user with the password the user is trying to use"""
    print("CREATING USER WITH CORRECT PASSWORD")
    print("=" * 40)
    
    base_url = "http://localhost:5000"
    
    # Create a user with the password the user is trying to use
    user_data = {
        "email": "user@user.com",  # Same email they're trying to use
        "password": "password123",  # The password they're trying to use
        "confirm_password": "password123",
        "round_up_amount": 1.00,
        "risk_tolerance": "Moderate",
        "investment_goals": ["Other"],
        "terms_agreed": True,
        "privacy_agreed": True,
        "marketing_agreed": False
    }
    
    try:
        print(f"[CREATE] Creating user: {user_data['email']}")
        response = requests.post(f"{base_url}/api/user/auth/register", json=user_data)
        print(f"Registration Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("[OK] User created successfully")
                print(f"User ID: {result.get('user', {}).get('id', 'N/A')}")
                print(f"Token: {result.get('token', 'N/A')[:20]}...")
                
                # Test login immediately
                print(f"\n[TEST] Testing login with created user")
                login_data = {
                    "email": "user@user.com",
                    "password": "password123"
                }
                
                login_response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
                print(f"Login Status: {login_response.status_code}")
                
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    if login_result.get('success'):
                        print("[OK] Login successful!")
                        print(f"Login Token: {login_result.get('token', 'N/A')[:20]}...")
                        print(f"User Name: {login_result.get('user', {}).get('name', 'N/A')}")
                    else:
                        print(f"[FAIL] Login failed: {login_result.get('error')}")
                else:
                    print(f"[FAIL] Login failed: {login_response.text}")
            else:
                print(f"[FAIL] User creation failed: {result.get('error')}")
        else:
            print(f"[FAIL] User creation failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Error: {e}")
    
    print(f"\n" + "=" * 40)
    print("USER CREATION WITH CORRECT PASSWORD COMPLETE")

if __name__ == "__main__":
    create_user_with_correct_password()
