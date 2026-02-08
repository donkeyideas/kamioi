import requests
import json

def test_llm_data_assets_endpoint():
    print("Testing LLM Data Assets endpoint...")
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

    # Test LLM Data Assets endpoint
    print("\n2. Testing LLM Data Assets endpoint...")
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    try:
        response = requests.get(
            'http://127.0.0.1:5001/api/admin/llm-center/data-assets',
            headers=headers,
            timeout=10
        )
        print(f"LLM Data Assets status: {response.status_code}")
        print(f"LLM Data Assets response: {json.dumps(response.json(), indent=2)}")
        if response.status_code == 200:
            print("[OK] LLM Data Assets endpoint working!")
            return True
        else:
            print(f"[FAIL] LLM Data Assets failed: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] LLM Data Assets request failed: {e}")
        return False

if __name__ == "__main__":
    test_llm_data_assets_endpoint()
