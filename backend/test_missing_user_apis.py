#!/usr/bin/env python3

import requests
import json

def test_missing_user_apis():
    """Test the missing user API endpoints"""
    print("TESTING MISSING USER API ENDPOINTS")
    print("=" * 40)
    
    base_url = "http://localhost:5000"
    
    # Login first to get a token
    login_data = {
        "email": "user@user.com",
        "password": "password123"
    }
    
    try:
        print(f"[LOGIN] Logging in to get token...")
        response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                token = result.get('token')
                print(f"[OK] Login successful, token: {token[:20]}...")
                
                headers = {'Authorization': f'Bearer {token}'}
                
                # Test the failing endpoints
                endpoints_to_test = [
                    "/api/user/ai/recommendations",
                    "/api/user/roundups/total", 
                    "/api/user/fees/total"
                ]
                
                for endpoint in endpoints_to_test:
                    print(f"\n[TEST] Testing {endpoint}")
                    print("-" * 30)
                    try:
                        response = requests.get(f"{base_url}{endpoint}", headers=headers)
                        print(f"Status: {response.status_code}")
                        
                        if response.status_code == 200:
                            data = response.json()
                            print(f"[OK] Endpoint working")
                            print(f"Response: {json.dumps(data, indent=2)[:200]}...")
                        elif response.status_code == 404:
                            print(f"[MISSING] Endpoint not found - needs to be implemented")
                        else:
                            print(f"[ERROR] Failed: {response.text}")
                    except Exception as e:
                        print(f"[ERROR] Exception: {e}")
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Login error: {e}")
    
    print(f"\n" + "=" * 40)
    print("MISSING USER API ENDPOINTS TEST COMPLETE")

if __name__ == "__main__":
    test_missing_user_apis()
