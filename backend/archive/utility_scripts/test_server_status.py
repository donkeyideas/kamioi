import requests
import json

def test_server_status():
    try:
        # Test health endpoint
        print("Testing health endpoint...")
        response = requests.get('http://127.0.0.1:5000/api/health', timeout=5)
        print(f"Health Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Health Response: {response.json()}")
        else:
            print(f"Health Error: {response.text}")
    except Exception as e:
        print(f"Health endpoint failed: {e}")
    
    try:
        # Test admin login
        print("\nTesting admin login...")
        login_data = {
            "email": "info@kamioi.com",
            "password": "admin123"
        }
        response = requests.post(
            'http://127.0.0.1:5000/api/admin/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        print(f"Login Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Login Success: {response.json()}")
        else:
            print(f"Login Error: {response.text}")
    except Exception as e:
        print(f"Login endpoint failed: {e}")

if __name__ == "__main__":
    test_server_status()
