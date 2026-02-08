#!/usr/bin/env python3

import requests
import json

def test_registration_endpoint():
    """Test if registration endpoint exists and works"""
    print("TESTING REGISTRATION ENDPOINT")
    print("=" * 35)
    
    base_url = "http://localhost:5000"
    
    # Test registration endpoint
    registration_data = {
        "email": "test@example.com",
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
        print(f"[TEST] Testing registration endpoint...")
        response = requests.post(f"{base_url}/api/user/register", json=registration_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success', False)}")
            if data.get('success'):
                print(f"[OK] Registration endpoint working")
            else:
                print(f"[WARN] Registration returned success=false: {data.get('error')}")
        elif response.status_code == 404:
            print(f"[FAIL] Registration endpoint not found (404)")
        elif response.status_code == 405:
            print(f"[FAIL] Registration endpoint method not allowed (405)")
        else:
            print(f"[FAIL] Registration failed with status: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"[ERROR] Registration error: {e}")
    
    # Test other possible registration endpoints
    endpoints_to_test = [
        "/api/user/register",
        "/api/register", 
        "/api/auth/register",
        "/api/user/auth/register",
        "/api/individual/register",
        "/api/account/register"
    ]
    
    print(f"\n[TEST] Testing other possible registration endpoints...")
    for endpoint in endpoints_to_test:
        try:
            response = requests.post(f"{base_url}{endpoint}", json=registration_data)
            print(f"  {endpoint}: {response.status_code}")
            if response.status_code == 200:
                print(f"    [FOUND] {endpoint} - Status 200")
        except Exception as e:
            print(f"    [ERROR] {endpoint}: {e}")
    
    print(f"\n" + "=" * 35)
    print("REGISTRATION ENDPOINT TEST COMPLETE")
    print("=" * 35)

if __name__ == "__main__":
    test_registration_endpoint()
