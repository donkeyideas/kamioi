#!/usr/bin/env python3

import requests
import json

def test_frontend_login_format():
    """Test login with the exact format the frontend sends"""
    print("TESTING FRONTEND LOGIN FORMAT")
    print("=" * 35)
    
    base_url = "http://localhost:5000"
    
    # Test with the user that exists but wrong password
    print("[TEST 1] Testing user@user.com with password123")
    login_data1 = {
        "email": "user@user.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/user/auth/login", json=login_data1)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success', False)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test with different passwords
    print(f"\n[TEST 2] Testing user@user.com with different passwords")
    passwords_to_try = ["password", "123456", "user123", "defaultPassword123"]
    
    for password in passwords_to_try:
        print(f"Trying password: {password}")
        login_data = {
            "email": "user@user.com",
            "password": password
        }
        
        try:
            response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"[SUCCESS] Password '{password}' works!")
                    break
            else:
                print(f"  Status: {response.status_code}")
        except Exception as e:
            print(f"  Error: {e}")
    
    # Test with the working user
    print(f"\n[TEST 3] Testing with known working user")
    login_data3 = {
        "email": "loginuser@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/user/auth/login", json=login_data3)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success', False)}")
            print(f"User: {result.get('user', {}).get('name', 'N/A')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    print(f"\n" + "=" * 35)
    print("FRONTEND LOGIN FORMAT TEST COMPLETE")

if __name__ == "__main__":
    test_frontend_login_format()
