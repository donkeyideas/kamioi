#!/usr/bin/env python3

import requests
import json

def test_complete_registration():
    """Test complete registration flow with frontend data"""
    print("TESTING COMPLETE REGISTRATION FLOW")
    print("=" * 40)
    
    base_url = "http://localhost:5000"
    
    # Test data matching the frontend form
    registration_data = {
        "email": "testuser@example.com",
        "password": "testpassword123",
        "confirm_password": "testpassword123",
        "round_up_amount": 1.00,
        "risk_tolerance": "Moderate",
        "investment_goals": ["Other"],
        "terms_agreed": True,
        "privacy_agreed": True,
        "marketing_agreed": True
    }
    
    try:
        print(f"[TEST] Testing registration with frontend data...")
        print(f"Email: {registration_data['email']}")
        print(f"Password: {'*' * len(registration_data['password'])}")
        print(f"Round-up Amount: ${registration_data['round_up_amount']}")
        print(f"Risk Tolerance: {registration_data['risk_tolerance']}")
        print(f"Investment Goals: {registration_data['investment_goals']}")
        print(f"Terms Agreed: {registration_data['terms_agreed']}")
        print(f"Privacy Agreed: {registration_data['privacy_agreed']}")
        print(f"Marketing Agreed: {registration_data['marketing_agreed']}")
        
        response = requests.post(f"{base_url}/api/user/register", json=registration_data)
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
    
    # Test validation errors
    print(f"\n" + "=" * 40)
    print("TESTING VALIDATION ERRORS")
    print("=" * 40)
    
    # Test password mismatch
    print(f"\n[TEST] Testing password mismatch...")
    invalid_data = registration_data.copy()
    invalid_data['confirm_password'] = 'differentpassword'
    
    try:
        response = requests.post(f"{base_url}/api/user/register", json=invalid_data)
        if response.status_code == 400:
            data = response.json()
            print(f"[OK] Password mismatch validation working: {data.get('error')}")
        else:
            print(f"[WARN] Password mismatch validation not working: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Password mismatch test error: {e}")
    
    # Test missing terms agreement
    print(f"\n[TEST] Testing missing terms agreement...")
    invalid_data = registration_data.copy()
    invalid_data['terms_agreed'] = False
    
    try:
        response = requests.post(f"{base_url}/api/user/register", json=invalid_data)
        if response.status_code == 400:
            data = response.json()
            print(f"[OK] Terms agreement validation working: {data.get('error')}")
        else:
            print(f"[WARN] Terms agreement validation not working: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Terms agreement test error: {e}")
    
    print(f"\n" + "=" * 40)
    print("REGISTRATION FLOW TEST COMPLETE")
    print("=" * 40)
    print("\nIf all tests show [OK], registration should work in the frontend!")
    print("\nNext steps:")
    print("1. Try creating an account in the frontend")
    print("2. The 'Failed to fetch' error should be resolved")
    print("3. Registration should complete successfully")

if __name__ == "__main__":
    test_complete_registration()
