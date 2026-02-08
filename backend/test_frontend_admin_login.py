import requests
import json

def test_frontend_admin_login():
    try:
        print("Testing frontend admin login...")
        
        # Simulate the exact request the frontend would make
        login_data = {
            "email": "info@kamioi.com",
            "password": "admin123"
        }
        
        response = requests.post(
            'http://127.0.0.1:5000/api/admin/auth/login',
            json=login_data,
            headers={
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3765'
            },
            timeout=5
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print(f"Token: {token}")
            
            # Test admin users endpoint with token
            headers = {
                'Authorization': f'Bearer {token}',
                'Origin': 'http://localhost:3765'
            }
            response = requests.get('http://127.0.0.1:5000/api/admin/users', headers=headers, timeout=5)
            print(f"Users Status: {response.status_code}")
            if response.status_code == 200:
                print("[OK] Frontend admin login is working!")
                return True
            else:
                print(f"[FAIL] Users endpoint failed: {response.text}")
                return False
        else:
            print(f"[FAIL] Login failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"[FAIL] Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_frontend_admin_login()
    if success:
        print("\n[SUCCESS] Admin login is working correctly!")
    else:
        print("\n[FAILED] Admin login is not working!")
