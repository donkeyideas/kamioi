#!/usr/bin/env python3

import requests
import json

def debug_api_responses():
    """Debug the actual API response structures"""
    print("DEBUGGING API RESPONSE STRUCTURES")
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
                print(f"[OK] Login successful")
                
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                # Test ML Stats API
                print(f"\n[TEST] Testing /api/ml/stats...")
                response = requests.get(f"{base_url}/api/ml/stats", headers=headers)
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"Response structure:")
                    print(f"  success: {data.get('success')}")
                    print(f"  data keys: {list(data.get('data', {}).keys())}")
                    print(f"  Full data structure:")
                    print(json.dumps(data, indent=2))
                
                # Test LLM Data System Status API
                print(f"\n[TEST] Testing /api/llm-data/system-status...")
                response = requests.get(f"{base_url}/api/llm-data/system-status", headers=headers)
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"Response structure:")
                    print(f"  success: {data.get('success')}")
                    print(f"  data keys: {list(data.get('data', {}).keys())}")
                    print(f"  Full data structure:")
                    print(json.dumps(data, indent=2))
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed with status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Login error: {e}")

if __name__ == "__main__":
    debug_api_responses()
