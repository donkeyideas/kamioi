import requests
import json

def test_admin_login():
    try:
        # Test admin login with correct credentials
        print("Testing admin login with correct credentials...")
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
        print(f"Login Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print(f"Token: {token}")
            
            # Test admin users endpoint with token
            print("\nTesting admin users with token...")
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get('http://127.0.0.1:5000/api/admin/users', headers=headers, timeout=5)
            print(f"Users Status: {response.status_code}")
            if response.status_code == 200:
                print(f"Users Response: {response.json()}")
            else:
                print(f"Users Error: {response.text}")
                
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_admin_login()