#!/usr/bin/env python3

import requests
import json
import os

def test_bulk_upload():
    base_url = "http://localhost:5000"
    
    # Test file path
    test_file = r"C:\Users\beltr\Dropbox\LLM Mapping\Mapping Master.10152015.v1.csv"
    
    print("Testing bulk upload with fixed database schema...")
    
    # Step 1: Login to get admin token
    print("\n1. Getting admin token...")
    login_data = {
        "email": "info@kamioi.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/admin/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            print(f"Login response: {data}")
            if data.get('success'):
                # Check different possible token locations
                if 'data' in data and 'token' in data['data']:
                    token = data['data']['token']
                elif 'token' in data:
                    token = data['token']
                else:
                    print(f"Login failed: No token in response")
                    return
                print(f"Admin token obtained: {token[:20]}...")
            else:
                print(f"Login failed: {data.get('error')}")
                return
        else:
            print(f"Login request failed: {response.status_code}")
            return
    except Exception as e:
        print(f"Login error: {e}")
        return
    
    # Step 2: Check if test file exists
    print(f"\n2. Checking test file: {test_file}")
    if not os.path.exists(test_file):
        print(f"Test file not found: {test_file}")
        return
    
    file_size = os.path.getsize(test_file)
    print(f"Test file found: {file_size:,} bytes ({file_size/1024/1024:.1f} MB)")
    
    # Step 3: Test bulk upload
    print(f"\n3. Testing bulk upload...")
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': (os.path.basename(test_file), f, 'text/csv')}
            response = requests.post(f"{base_url}/api/admin/bulk-upload", 
                                   headers=headers, files=files)
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("Bulk upload successful!")
                print(f"   Processed rows: {data['data']['processed_rows']}")
                print(f"   Batch size: {data['data']['batch_size']}")
                if data['data']['errors']:
                    print(f"   Errors: {len(data['data']['errors'])}")
                    for error in data['data']['errors'][:3]:
                        print(f"     - {error}")
            else:
                print(f"Upload failed: {data.get('error')}")
        else:
            print(f"Upload request failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Upload error: {e}")
    
    # Step 4: Test mappings retrieval
    print(f"\n4. Testing mappings retrieval...")
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/mappings", 
                              headers=headers, params={'limit': 5})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                mappings = data.get('mappings', [])
                print(f"Retrieved {len(mappings)} mappings")
                print(f"   Total mappings: {data.get('total_mappings', 0)}")
                
                if mappings:
                    print("   Sample mapping:")
                    sample = mappings[0]
                    print(f"     - Merchant: {sample.get('merchant_name')}")
                    print(f"     - Category: {sample.get('category')}")
                    print(f"     - Confidence: {sample.get('confidence')}")
            else:
                print(f"Retrieval failed: {data.get('error')}")
        else:
            print(f"Retrieval request failed: {response.status_code}")
            
    except Exception as e:
        print(f"Retrieval error: {e}")

if __name__ == "__main__":
    test_bulk_upload()
