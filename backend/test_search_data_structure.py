#!/usr/bin/env python3

import requests
import json

def test_search_data_structure():
    print("TESTING SEARCH DATA STRUCTURE")
    print("=" * 40)
    
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
    
    # Test Search Response Structure
    print("\nTESTING SEARCH DATA STRUCTURE...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/llm-center/mappings?search=apple&limit=3", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success')}")
            
            mappings = result.get('mappings', [])
            print(f"Found {len(mappings)} mappings")
            
            if mappings:
                print("\nSample mapping structure:")
                sample = mappings[0]
                print(f"  ID: {sample.get('id')}")
                print(f"  merchant_name: {sample.get('merchant_name')}")
                print(f"  ticker_symbol: {sample.get('ticker_symbol')}")
                print(f"  category: {sample.get('category')}")
                print(f"  confidence: {sample.get('confidence')}")
                print(f"  status: {sample.get('status')}")
                print(f"  created_at: {sample.get('created_at')}")
                print(f"  admin_id: {sample.get('admin_id')}")
                
                print("\nAll available fields:")
                for key, value in sample.items():
                    print(f"  {key}: {value}")
            else:
                print("No mappings found")
        else:
            print(f"[FAIL] Search failed: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Search error: {e}")

if __name__ == "__main__":
    test_search_data_structure()
