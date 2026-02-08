#!/usr/bin/env python3

import requests
import json

def test_specific_endpoints():
    """Test specific failing endpoints"""
    print("TESTING SPECIFIC ENDPOINTS")
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
    
    # Test 2: Global State (failing)
    print("\n2. Testing Global State (500 error)...")
    try:
        response = requests.get(f"{base_url}/api/llm/global-state", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"[ERROR] Global state error: {e}")
    
    # Test 3: LLM Center -> ML Dashboard (failing)
    print("\n3. Testing LLM Center -> ML Dashboard (500 error)...")
    try:
        response = requests.get(f"{base_url}/api/llm-center/get-ml-status", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"[ERROR] LLM Center -> ML Dashboard error: {e}")
    
    # Test 4: ML Dashboard -> LLM Data Management (failing)
    print("\n4. Testing ML Dashboard -> LLM Data Management (500 error)...")
    try:
        response = requests.get(f"{base_url}/api/ml/get-data-health", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"[ERROR] ML Dashboard -> LLM Data Management error: {e}")
    
    # Test 5: LLM Data Management -> LLM Center (failing)
    print("\n5. Testing LLM Data Management -> LLM Center (500 error)...")
    try:
        response = requests.get(f"{base_url}/api/llm-data/get-center-status", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"[ERROR] LLM Data Management -> LLM Center error: {e}")
    
    # Test 6: Quality Metrics (failing)
    print("\n6. Testing Quality Metrics (500 error)...")
    try:
        response = requests.get(f"{base_url}/api/quality/get-metrics", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"[ERROR] Quality Metrics error: {e}")
    
    print("\n" + "=" * 40)
    print("SPECIFIC ENDPOINT TEST COMPLETE")
    print("=" * 40)

if __name__ == "__main__":
    test_specific_endpoints()
