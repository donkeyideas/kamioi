#!/usr/bin/env python3

import requests

def test_queue_endpoint():
    base_url = "http://localhost:5000"
    headers = {'Authorization': 'Bearer admin_token_1'}
    
    print("Testing queue endpoint...")
    
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/queue", headers=headers)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Queue endpoint working!")
            print(f"Response: {data}")
        else:
            print(f"Queue endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_queue_endpoint()
