#!/usr/bin/env python3

import requests
import json

def test_user_management_final():
    """Test User Management after fixes and user deletion"""
    print("TESTING USER MANAGEMENT FINAL STATE")
    print("=" * 40)
    
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
                print(f"\n[TEST] Testing User Management APIs...")
                print("-" * 40)
                
                # Test /api/admin/users
                response = requests.get(f"{base_url}/api/admin/users", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    user_count = len(data.get('users', []))
                    print(f"[OK] /api/admin/users: {user_count} users")
                else:
                    print(f"[FAIL] /api/admin/users: {response.status_code}")
                
                # Test /api/admin/user-metrics
                response = requests.get(f"{base_url}/api/admin/user-metrics", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    metrics = data.get('metrics', {})
                    print(f"[OK] /api/admin/user-metrics:")
                    print(f"  - Total Users: {metrics.get('total_users', 0)}")
                    print(f"  - Individual Users: {metrics.get('individual_users', 0)}")
                    print(f"  - Family Users: {metrics.get('family_users', 0)}")
                    print(f"  - Business Users: {metrics.get('business_users', 0)}")
                else:
                    print(f"[FAIL] /api/admin/user-metrics: {response.status_code}")
                
                # Test /api/admin/family-users
                response = requests.get(f"{base_url}/api/admin/family-users", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    family_count = len(data.get('users', []))
                    print(f"[OK] /api/admin/family-users: {family_count} users")
                else:
                    print(f"[FAIL] /api/admin/family-users: {response.status_code}")
                
                # Test /api/admin/business-users
                response = requests.get(f"{base_url}/api/admin/business-users", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    business_count = len(data.get('users', []))
                    print(f"[OK] /api/admin/business-users: {business_count} users")
                else:
                    print(f"[FAIL] /api/admin/business-users: {response.status_code}")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed with status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Login error: {e}")
    
    print(f"\n" + "=" * 40)
    print("USER MANAGEMENT FINAL TEST COMPLETE")
    print("=" * 40)
    print("\nIf all tests show [OK] with 0 users, the User Management dashboard")
    print("should now correctly display 0 users in all cards and tables.")

if __name__ == "__main__":
    test_user_management_final()
