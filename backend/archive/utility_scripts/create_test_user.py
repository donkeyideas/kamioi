#!/usr/bin/env python3

import requests
import json

def create_test_user():
    """Create a test user for login testing"""
    print("CREATING TEST USER")
    print("=" * 20)
    
    base_url = "http://localhost:5000"
    
    # Create a test user
    user_data = {
        "email": "testuser@example.com",
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
        print(f"[TEST] Creating user: {user_data['email']}")
        response = requests.post(f"{base_url}/api/user/auth/register", json=user_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success', False)}")
            if result.get('success'):
                print(f"User created successfully!")
                print(f"Token: {result.get('token', 'N/A')[:20]}...")
            else:
                print(f"Error: {result.get('error')}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")
    
    print(f"\n" + "=" * 20)
    print("TEST USER CREATION COMPLETE")

if __name__ == "__main__":
    create_test_user()