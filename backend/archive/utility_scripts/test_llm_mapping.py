import requests
import json

def test_llm_mapping():
    print("Testing LLM mapping system...")
    print("=" * 50)
    
    # First, get admin token
    login_url = 'http://127.0.0.1:5000/api/admin/auth/login'
    login_data = {"email": "info@kamioi.com", "password": "admin123"}
    login_headers = {'Content-Type': 'application/json'}

    try:
        # Get admin token
        login_response = requests.post(login_url, json=login_data, headers=login_headers, timeout=5)
        login_response.raise_for_status()
        login_data = login_response.json()
        token = login_data.get('token')
        
        if not token:
            print("[FAIL] Could not get admin token.")
            return False
        
        print(f"[OK] Got admin token: {token}")
        
        # Test LLM mapping endpoints
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Test LLM mappings endpoint
        print("\n1. Testing LLM mappings endpoint...")
        response = requests.get('http://127.0.0.1:5000/api/admin/llm-center/mappings', headers=headers, timeout=5)
        print(f"LLM mappings status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            mappings = data.get('mappings', [])
            print(f"LLM mappings count: {len(mappings)}")
        else:
            print(f"Error: {response.text}")
        
        # Test pending mappings
        print("\n2. Testing pending mappings...")
        response = requests.get('http://127.0.0.1:5000/api/admin/llm-center/pending-mappings', headers=headers, timeout=5)
        print(f"Pending mappings status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            pending = data.get('mappings', [])
            print(f"Pending mappings count: {len(pending)}")
        else:
            print(f"Error: {response.text}")
        
        # Test process mappings endpoint
        print("\n3. Testing process mappings...")
        response = requests.post('http://127.0.0.1:5000/api/admin/process-mappings', headers=headers, timeout=10)
        print(f"Process mappings status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Process result: {data}")
        else:
            print(f"Error: {response.text}")
        
        return True
        
    except Exception as e:
        print(f"[FAIL] Test failed: {e}")
        return False

if __name__ == "__main__":
    test_llm_mapping()
