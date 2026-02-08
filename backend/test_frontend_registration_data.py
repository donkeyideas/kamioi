#!/usr/bin/env python3

import requests
import json

def test_frontend_registration_data():
    """Test registration with the exact data the frontend is now sending"""
    print("TESTING FRONTEND REGISTRATION DATA")
    print("=" * 40)
    
    base_url = "http://localhost:5000"
    
    # Test data matching what the frontend now sends
    registration_data = {
        "email": "frontenduser@example.com",
        "password": "frontendpassword123",
        "confirm_password": "frontendpassword123",
        "round_up_amount": 1.00,
        "risk_tolerance": "Moderate",
        "investment_goals": ["Other"],
        "terms_agreed": True,
        "privacy_agreed": True,
        "marketing_agreed": True
    }
    
    try:
        print(f"[TEST] Testing registration with frontend data structure...")
        print(f"Email: {registration_data['email']}")
        print(f"Password: {'*' * len(registration_data['password'])}")
        print(f"Confirm Password: {'*' * len(registration_data['confirm_password'])}")
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
    
    print(f"\n" + "=" * 40)
    print("FRONTEND REGISTRATION DATA TEST COMPLETE")
    print("=" * 40)
    print("\nIf this test shows [OK], the frontend registration should work!")
    print("The frontend now sends the correct data structure that the backend expects.")

if __name__ == "__main__":
    test_frontend_registration_data()
