#!/usr/bin/env python3

import requests
import json

def test_auth_flow_debug():
    """Test the complete authentication flow to debug redirect issues"""
    print("TESTING AUTHENTICATION FLOW DEBUG")
    print("=" * 40)
    
    base_url = "http://localhost:5000"
    
    # Test 1: Login
    print("\n[TEST 1] User Login")
    print("-" * 20)
    login_data = {
        "email": "user@user.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                token = result.get('token')
                user = result.get('user', {})
                print(f"[OK] Login successful")
                print(f"Token: {token[:20]}...")
                print(f"User ID: {user.get('id')}")
                print(f"User Role: {user.get('role')}")
                print(f"User Dashboard: {user.get('dashboard', 'Not set')}")
                
                # Test 2: /me endpoint
                print(f"\n[TEST 2] /api/user/auth/me")
                print("-" * 25)
                headers = {'Authorization': f'Bearer {token}'}
                me_response = requests.get(f"{base_url}/api/user/auth/me", headers=headers)
                print(f"Me Status: {me_response.status_code}")
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    print(f"[OK] /me endpoint working")
                    print(f"Me User ID: {me_data.get('user', {}).get('id')}")
                    print(f"Me User Role: {me_data.get('user', {}).get('role')}")
                else:
                    print(f"[FAIL] /me endpoint failed: {me_response.text}")
                
                # Test 3: Dashboard data endpoints
                print(f"\n[TEST 3] Dashboard Data Endpoints")
                print("-" * 35)
                
                dashboard_endpoints = [
                    "/api/user/transactions",
                    "/api/user/portfolio", 
                    "/api/user/ai/recommendations",
                    "/api/user/roundups/total",
                    "/api/user/fees/total"
                ]
                
                for endpoint in dashboard_endpoints:
                    print(f"\n[TEST] {endpoint}")
                    try:
                        response = requests.get(f"{base_url}{endpoint}", headers=headers)
                        print(f"Status: {response.status_code}")
                        
                        if response.status_code == 200:
                            data = response.json()
                            print(f"[OK] Working - Success: {data.get('success', False)}")
                        else:
                            print(f"[FAIL] Error: {response.text[:100]}...")
                    except Exception as e:
                        print(f"[ERROR] Exception: {e}")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Login error: {e}")
    
    print(f"\n" + "=" * 40)
    print("AUTHENTICATION FLOW DEBUG COMPLETE")

if __name__ == "__main__":
    test_auth_flow_debug()
