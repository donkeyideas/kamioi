#!/usr/bin/env python3

import requests
import json

def test_user_management_api():
    """Test User Management API endpoints"""
    print("TESTING USER MANAGEMENT API")
    print("=" * 35)
    
    base_url = "http://localhost:5000"
    
    # Login first
    login_data = {
        "email": "info@kamioi.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/admin/auth/login", json=login_data)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                token = result.get('token')
                print(f"[OK] Admin login successful")
                
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                # Test User Management endpoints
                endpoints_to_test = [
                    "/api/admin/users",
                    "/api/admin/user-metrics", 
                    "/api/admin/family-users",
                    "/api/admin/business-users"
                ]
                
                for endpoint in endpoints_to_test:
                    print(f"\n[TEST] Testing {endpoint}")
                    print("-" * 30)
                    try:
                        response = requests.get(f"{base_url}{endpoint}", headers=headers)
                        print(f"Status: {response.status_code}")
                        
                        if response.status_code == 200:
                            data = response.json()
                            print(f"Success: {data.get('success', False)}")
                            if data.get('success'):
                                if 'users' in data:
                                    print(f"Users count: {len(data.get('users', []))}")
                                    print(f"Users: {data.get('users', [])[:3]}...")  # Show first 3 users
                                elif 'metrics' in data:
                                    print(f"Metrics: {data.get('metrics', {})}")
                                else:
                                    print(f"Data: {data}")
                            else:
                                print(f"Error: {data.get('error')}")
                        else:
                            print(f"Failed with status: {response.status_code}")
                            print(f"Response: {response.text[:200]}")
                    except Exception as e:
                        print(f"Error: {e}")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed with status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Login error: {e}")
    
    print(f"\n" + "=" * 35)
    print("USER MANAGEMENT API TEST COMPLETE")
    print("=" * 35)

if __name__ == "__main__":
    test_user_management_api()
