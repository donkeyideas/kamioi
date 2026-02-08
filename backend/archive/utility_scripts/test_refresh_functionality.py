#!/usr/bin/env python3

import requests
import json

def test_refresh_functionality():
    """Test the refresh functionality by checking if all endpoints are working"""
    print("TESTING REFRESH FUNCTIONALITY")
    print("=" * 40)
    
    base_url = "http://localhost:5000"
    
    # Test 1: Admin Login
    print("\n1. Testing Admin Login...")
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
                print(f"[OK] Admin login successful, token: {token[:20]}...")
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
                return
        else:
            print(f"[FAIL] Login failed with status: {response.status_code}")
            return
    except Exception as e:
        print(f"[ERROR] Login error: {e}")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test 2: Test Queue Endpoint (used by refresh)
    print("\n2. Testing Queue Endpoint...")
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/queue", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                queue_status = result.get('data', {}).get('queue_status', {})
                print(f"[OK] Queue endpoint working:")
                print(f"    - Total mappings: {queue_status.get('total_mappings', 0)}")
                print(f"    - Approved: {queue_status.get('approved', 0)}")
                print(f"    - Auto applied: {queue_status.get('auto_applied', 0)}")
            else:
                print(f"[FAIL] Queue endpoint failed: {result.get('error')}")
        else:
            print(f"[FAIL] Queue endpoint status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Queue endpoint error: {e}")
    
    # Test 3: Test Pending Mappings Endpoint
    print("\n3. Testing Pending Mappings Endpoint...")
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/pending-mappings?limit=20", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                mappings = result.get('data', {}).get('mappings', [])
                print(f"[OK] Pending mappings endpoint working: {len(mappings)} mappings")
            else:
                print(f"[FAIL] Pending mappings failed: {result.get('error')}")
        else:
            print(f"[FAIL] Pending mappings status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Pending mappings error: {e}")
    
    # Test 4: Test Approved Mappings Endpoint
    print("\n4. Testing Approved Mappings Endpoint...")
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/approved-mappings?limit=20", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                mappings = result.get('data', {}).get('mappings', [])
                print(f"[OK] Approved mappings endpoint working: {len(mappings)} mappings")
            else:
                print(f"[FAIL] Approved mappings failed: {result.get('error')}")
        else:
            print(f"[FAIL] Approved mappings status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Approved mappings error: {e}")
    
    print("\n" + "=" * 40)
    print("REFRESH FUNCTIONALITY TEST COMPLETE")
    print("=" * 40)
    print("\nIf all tests pass, the refresh button should work properly!")

if __name__ == "__main__":
    test_refresh_functionality()
