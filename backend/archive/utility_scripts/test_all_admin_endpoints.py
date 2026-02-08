import requests
import json

def test_all_admin_endpoints():
    print("Testing all admin endpoints...")
    
    # First, get admin token
    print("\n=== Getting Admin Token ===")
    login_data = {
        "email": "info@kamioi.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(
            'http://127.0.0.1:5000/api/admin/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print(f"[OK] Login successful! Token: {token}")
            
            # Test all endpoints with token
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test admin users
            print("\n=== Testing Admin Users ===")
            test_endpoint('GET', '/api/admin/users', headers)
            
            # Test admin transactions
            print("\n=== Testing Admin Transactions ===")
            test_endpoint('GET', '/api/admin/transactions', headers)
            
            # Test admin journal entries
            print("\n=== Testing Admin Journal Entries ===")
            test_endpoint('GET', '/api/admin/journal-entries', headers)
            
            # Test admin LLM mappings
            print("\n=== Testing Admin LLM Mappings ===")
            test_endpoint('GET', '/api/admin/llm-center/mappings', headers)
            
        else:
            print(f"[FAIL] Login failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"[FAIL] Test failed: {e}")

def test_endpoint(method, endpoint, headers):
    try:
        url = f'http://127.0.0.1:5000{endpoint}'
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=5)
        else:
            response = requests.post(url, headers=headers, timeout=5)
            
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Success! Response keys: {list(data.keys())}")
            if 'total' in data:
                print(f"   Total items: {data['total']}")
        else:
            print(f"[FAIL] Failed: {response.text}")
            
    except Exception as e:
        print(f"[FAIL] Error: {e}")

if __name__ == "__main__":
    test_all_admin_endpoints()
