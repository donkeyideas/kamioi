import requests
import json

def test_available_endpoints():
    try:
        print("Testing available admin endpoints...")
        
        # Get admin token
        login_data = {
            "email": "info@kamioi.com",
            "password": "admin123"
        }
        
        login_response = requests.post(
            'http://127.0.0.1:5000/api/admin/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data['token']
            print(f"Got token: {token}")
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            # Test available endpoints
            endpoints = [
                '/api/admin/users',
                '/api/admin/transactions',
                '/api/admin/llm-center/mappings',
                '/api/admin/system-health',
                '/api/admin/database/stats'
            ]
            
            for endpoint in endpoints:
                try:
                    response = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers, timeout=5)
                    print(f"{endpoint}: {response.status_code}")
                    if response.status_code == 200:
                        data = response.json()
                        if 'success' in data:
                            print(f"  Success: {data['success']}")
                        if 'users' in data:
                            print(f"  Users count: {len(data['users'])}")
                        if 'transactions' in data:
                            print(f"  Transactions count: {len(data['transactions'])}")
                except Exception as e:
                    print(f"{endpoint}: Error - {e}")
        else:
            print(f"Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_available_endpoints()
