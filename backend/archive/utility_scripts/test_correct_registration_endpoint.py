#!/usr/bin/env python3

import requests
import json

def test_correct_registration_endpoint():
    """Test the correct registration endpoint that frontend is calling"""
    print("TESTING CORRECT REGISTRATION ENDPOINT")
    print("=" * 45)
    
    base_url = "http://localhost:5000"
    
    # Test data matching the frontend form
    registration_data = {
        "email": "newuser@example.com",
        "password": "newpassword123",
        "confirm_password": "newpassword123",
        "round_up_amount": 1.00,
        "risk_tolerance": "Moderate",
        "investment_goals": ["Other"],
        "terms_agreed": True,
        "privacy_agreed": True,
        "marketing_agreed": True
    }
    
    try:
        print(f"[TEST] Testing /api/user/auth/register endpoint...")
        print(f"Email: {registration_data['email']}")
        print(f"Password: {'*' * len(registration_data['password'])}")
        print(f"Round-up Amount: ${registration_data['round_up_amount']}")
        print(f"Risk Tolerance: {registration_data['risk_tolerance']}")
        print(f"Investment Goals: {registration_data['investment_goals']}")
        print(f"Terms Agreed: {registration_data['terms_agreed']}")
        print(f"Privacy Agreed: {registration_data['privacy_agreed']}")
        print(f"Marketing Agreed: {registration_data['marketing_agreed']}")
        
        response = requests.post(f"{base_url}/api/user/auth/register", json=registration_data)
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"[OK] Registration successful!")
                print(f"Token: {data.get('token', 'N/A')}")
                print(f"User ID: {data.get('user', {}).get('id', 'N/A')}")
                print(f"User Email: {data.get('user', {}).get('email', 'N/A')}")
                print(f"User Name: {data.get('user', {}).get('name', 'N/A')}")
                print(f"User Role: {data.get('user', {}).get('role', 'N/A')}")
                print(f"Message: {data.get('message', 'N/A')}")
                
                # Test login with the new user
                print(f"\n[TEST] Testing login with new user...")
                login_data = {
                    "email": registration_data['email'],
                    "password": registration_data['password']
                }
                
                login_response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    if login_result.get('success'):
                        print(f"[OK] Login successful with new user!")
                        print(f"Login Token: {login_result.get('token', 'N/A')}")
                    else:
                        print(f"[FAIL] Login failed: {login_result.get('error')}")
                else:
                    print(f"[FAIL] Login failed with status: {login_response.status_code}")
                
            else:
                print(f"[FAIL] Registration returned success=false: {data.get('error')}")
        else:
            print(f"[FAIL] Registration failed with status: {response.status_code}")
            print(f"Response: {response.text[:300]}")
            
    except Exception as e:
        print(f"[ERROR] Registration error: {e}")
    
    print(f"\n" + "=" * 45)
    print("CORRECT ENDPOINT TEST COMPLETE")
    print("=" * 45)
    print("\nIf this test shows [OK], the frontend registration should work!")
    print("The frontend calls /api/user/auth/register and this endpoint now exists.")

if __name__ == "__main__":
    test_correct_registration_endpoint()
