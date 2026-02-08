import requests
import json

def test_clear_mappings_fix():
    print("Testing clear mappings endpoint fix...")
    print("=" * 50)
    
    # Test admin login first
    print("1. Testing admin login...")
    login_data = {"email": "info@kamioi.com", "password": "admin123"}
    try:
        response = requests.post(
            'http://127.0.0.1:5001/api/admin/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        if response.status_code == 200:
            token = response.json()['token']
            print(f"[OK] Login successful, token: {token}")
        else:
            print(f"[FAIL] Login failed: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Login request failed: {e}")
        return False

    # Test clear mappings endpoint
    print("\n2. Testing clear mappings endpoint...")
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    clear_data = {"table_name": "llm_mappings"}
    try:
        response = requests.post(
            'http://127.0.0.1:5001/api/admin/database/clear-table',
            json=clear_data,
            headers=headers,
            timeout=10
        )
        print(f"Clear mappings status: {response.status_code}")
        print(f"Clear mappings response: {json.dumps(response.json(), indent=2)}")
        if response.status_code == 200 and response.json().get('success'):
            print("[OK] Clear mappings endpoint working!")
            return True
        else:
            print(f"[FAIL] Clear mappings failed: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Clear mappings request failed: {e}")
        return False

if __name__ == "__main__":
    test_clear_mappings_fix()
