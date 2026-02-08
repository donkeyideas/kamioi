#!/usr/bin/env python3

import requests
import json

def test_clean_system():
    print("TESTING CLEAN SYSTEM")
    print("=" * 30)
    
    base_url = "http://localhost:5000"
    
    # Test Admin Login
    print("TESTING ADMIN LOGIN...")
    try:
        login_data = {
            "email": "info@kamioi.com",
            "password": "admin123"
        }
        response = requests.post(f"{base_url}/api/admin/auth/login", json=login_data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                admin_token = result['token']
                print(f"[OK] Admin login: PASSED")
                print(f"[TOKEN] Token: {admin_token[:20]}...")
            else:
                print(f"[FAIL] Admin login: FAILED - {result.get('error')}")
                return
        else:
            print(f"[FAIL] Admin login: FAILED ({response.status_code})")
            return
    except Exception as e:
        print(f"[ERROR] Admin login: ERROR - {e}")
        return
    
    # Test Search with no results (should be empty)
    print("\nTESTING SEARCH WITH EMPTY DATABASE...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/llm-center/mappings?search=apple&limit=10&page=1", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success')}")
            
            mappings = result.get('mappings', [])
            print(f"Found {len(mappings)} mappings (should be 0)")
            
            if len(mappings) == 0:
                print("[OK] Database is clean - no test data found")
            else:
                print("[WARNING] Found test data in database:")
                for mapping in mappings[:3]:
                    print(f"  - {mapping.get('merchant_name', 'N/A')} ({mapping.get('ticker_symbol', 'N/A')})")
        else:
            print(f"[FAIL] Search failed: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Search error: {e}")
    
    # Test Queue Status
    print("\nTESTING QUEUE STATUS...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/llm-center/queue?limit=10", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                queue_data = result.get('data', {}).get('queue_status', {})
                print(f"Total Mappings: {queue_data.get('total_mappings', 0)}")
                print(f"Approved: {queue_data.get('approved', 0)}")
                print(f"Auto Applied: {queue_data.get('auto_applied', 0)}")
                print("[OK] Queue status retrieved successfully")
            else:
                print(f"[FAIL] Queue status failed: {result.get('error')}")
        else:
            print(f"[FAIL] Queue status failed: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Queue status error: {e}")

if __name__ == "__main__":
    test_clean_system()
