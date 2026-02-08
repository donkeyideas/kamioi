#!/usr/bin/env python3

import requests
import json

def test_complete_auth_flow():
    """Test complete authentication flow"""
    print("TESTING COMPLETE AUTHENTICATION FLOW")
    print("=" * 40)
    
    base_url = "http://localhost:5000"
    
    # Test 1: User Registration
    print("\n[TEST 1] User Registration")
    print("-" * 25)
    user_data = {
        "email": "finaltest@example.com",
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
        response = requests.post(f"{base_url}/api/user/auth/register", json=user_data)
        print(f"Registration Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("[OK] User registration successful")
                user_token = result.get('token')
                print(f"User token: {user_token[:20]}...")
            else:
                print(f"[FAIL] Registration failed: {result.get('error')}")
                return
        else:
            print(f"[FAIL] Registration failed: {response.text}")
            return
    except Exception as e:
        print(f"[ERROR] Registration error: {e}")
        return
    
    # Test 2: User Login
    print("\n[TEST 2] User Login")
    print("-" * 20)
    login_data = {
        "email": "finaltest@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("[OK] User login successful")
                login_token = result.get('token')
                print(f"Login token: {login_token[:20]}...")
                
                # Test /api/user/auth/me
                headers = {'Authorization': f'Bearer {login_token}'}
                me_response = requests.get(f"{base_url}/api/user/auth/me", headers=headers)
                print(f"Me endpoint status: {me_response.status_code}")
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    print("[OK] User /me endpoint working")
                else:
                    print(f"[FAIL] User /me endpoint failed: {me_response.text}")
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed: {response.text}")
    except Exception as e:
        print(f"[ERROR] Login error: {e}")
    
    # Test 3: Admin Login
    print("\n[TEST 3] Admin Login")
    print("-" * 20)
    admin_data = {
        "email": "info@kamioi.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/admin/auth/login", json=admin_data)
        print(f"Admin login status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("[OK] Admin login successful")
                admin_token = result.get('token')
                print(f"Admin token: {admin_token[:20]}...")
                
                # Test /api/admin/auth/me
                headers = {'Authorization': f'Bearer {admin_token}'}
                me_response = requests.get(f"{base_url}/api/admin/auth/me", headers=headers)
                print(f"Admin /me status: {me_response.status_code}")
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    print("[OK] Admin /me endpoint working")
                else:
                    print(f"[FAIL] Admin /me endpoint failed: {me_response.text}")
            else:
                print(f"[FAIL] Admin login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Admin login failed: {response.text}")
    except Exception as e:
        print(f"[ERROR] Admin login error: {e}")
    
    print(f"\n" + "=" * 40)
    print("COMPLETE AUTHENTICATION FLOW TEST COMPLETE")
    print("=" * 40)

if __name__ == "__main__":
    test_complete_auth_flow()
