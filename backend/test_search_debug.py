#!/usr/bin/env python3

import requests
import json

def test_search_debug():
    print("TESTING SEARCH DEBUG")
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
    
    # Test Search with "apple" query and page=1
    print("\nTESTING SEARCH WITH 'apple' QUERY (page=1)...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/llm-center/mappings?search=apple&limit=10&page=1", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success')}")
            
            if result.get('success'):
                data = result.get('data', {})
                mappings = data.get('mappings', [])
                pagination = data.get('pagination', {})
                
                print(f"Found {len(mappings)} mappings")
                print(f"Total count: {pagination.get('total_count', 0)}")
                print(f"Current page: {pagination.get('current_page', 1)}")
                print(f"Total pages: {pagination.get('total_pages', 1)}")
                
                if len(mappings) > 0:
                    print("\nFirst mapping details:")
                    mapping = mappings[0]
                    print(f"  - ID: {mapping.get('id')}")
                    print(f"  - Merchant: {mapping.get('merchant_name')}")
                    print(f"  - Category: {mapping.get('category')}")
                    print(f"  - Ticker: {mapping.get('ticker_symbol')}")
                    print(f"  - Confidence: {mapping.get('confidence')}")
                    print(f"  - Status: {mapping.get('status')}")
                else:
                    print("No mappings found")
            else:
                print(f"[FAIL] Search failed: {result.get('error')}")
        else:
            print(f"[FAIL] Search failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"[ERROR] Search error: {e}")

if __name__ == "__main__":
    test_search_debug()