#!/usr/bin/env python3

import requests
import json

def test_search_simple():
    print("SIMPLE SEARCH TEST")
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
    
    # Test Search with "apple"
    print("\nTESTING SEARCH WITH 'apple'...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/llm-center/mappings?search=apple&limit=3", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success')}")
            print(f"Total Mappings: {result.get('total_mappings', 'N/A')}")
            
            mappings = result.get('mappings', [])
            print(f"Found {len(mappings)} mappings")
            
            if mappings:
                print("Sample results:")
                for i, mapping in enumerate(mappings[:3]):
                    print(f"  {i+1}. {mapping.get('merchant_name', 'N/A')} - {mapping.get('category', 'N/A')}")
            else:
                print("No mappings found")
        else:
            print(f"[FAIL] Search failed: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Search error: {e}")

if __name__ == "__main__":
    test_search_simple()
