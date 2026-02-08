#!/usr/bin/env python3

import requests

def test_mappings_endpoint():
    base_url = "http://localhost:5000"
    headers = {'Authorization': 'Bearer admin_token_1'}
    
    print("Testing mappings endpoint...")
    
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/mappings", 
                              headers=headers, params={'limit': 5})
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_mappings_endpoint()
