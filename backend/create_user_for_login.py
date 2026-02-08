#!/usr/bin/env python3

import requests
import json

def create_user_for_login():
    """Create a user specifically for login testing"""
    print("CREATING USER FOR LOGIN TESTING")
    print("=" * 35)
    
    base_url = "http://localhost:5000"
    
    # Create a user with known credentials
    user_data = {
        "email": "loginuser@example.com",
        "password": "password123",
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
                    "email": "loginuser@example.com",
                    "password": "password123"
                }
                
                login_response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
                print(f"Login Status: {login_response.status_code}")
                
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    if login_result.get('success'):
                        print("[OK] Login successful with created user")
                        print(f"Login Token: {login_result.get('token', 'N/A')[:20]}...")
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
    
    print(f"\n" + "=" * 35)
    print("USER CREATION FOR LOGIN TESTING COMPLETE")

if __name__ == "__main__":
    create_user_for_login()
