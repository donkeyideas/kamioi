#!/usr/bin/env python3

import requests
import time

def test_auth_flow():
    base_url = "http://localhost:5000"
    
    print("Testing authentication flow...")
    
    # Wait a moment for server to start
    time.sleep(2)
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            print("Backend server is running")
        else:
            print(f"Backend health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"Cannot connect to backend: {e}")
        print("Please make sure the backend server is running:")
        print("cd backend && python app_clean.py")
        return
    
    # Test admin login
    print("\nTesting admin login...")
    login_data = {
        "email": "info@kamioi.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/admin/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                token = data.get('token')
                print(f"Admin login successful!")
                print(f"Token: {token[:20]}...")
                print(f"User: {data.get('user', {}).get('name')}")
                
                # Test mappings endpoint
                print("\nTesting mappings endpoint...")
                headers = {'Authorization': f'Bearer {token}'}
                response = requests.get(f"{base_url}/api/admin/llm-center/mappings", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"Mappings endpoint working")
                    print(f"Total mappings: {data.get('total_mappings', 0)}")
                else:
                    print(f"Mappings endpoint failed: {response.status_code}")
                    print(f"Response: {response.text}")
            else:
                print(f"Login failed: {data.get('error')}")
        else:
            print(f"Login request failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Login error: {e}")

if __name__ == "__main__":
    test_auth_flow()
