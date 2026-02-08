import requests
import json

def test_search_mappings():
    print("Testing search mappings endpoint...")
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

    # Test search mappings endpoint
    print("\n2. Testing search mappings endpoint...")
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test different search queries
    search_queries = ['apple', 'starbucks', 'amazon', 'netflix']
    
    for query in search_queries:
        print(f"\n3. Testing search for: '{query}'")
        try:
            response = requests.get(
                f'http://127.0.0.1:5001/api/admin/llm-center/mappings?search={query}&limit=10&page=1',
                headers=headers,
                timeout=10
            )
            print(f"Search status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Search response: {json.dumps(data, indent=2)}")
                
                if data.get('success'):
                    mappings = data.get('data', {}).get('mappings', [])
                    print(f"[OK] Found {len(mappings)} mappings for '{query}'")
                    if mappings:
                        print(f"   First result: {mappings[0].get('merchant_name', 'Unknown')}")
                else:
                    print(f"[FAIL] Search failed for '{query}': {data.get('error')}")
            else:
                print(f"[FAIL] Search HTTP error for '{query}': {response.status_code}")
                print(f"Error response: {response.text}")
                
        except Exception as e:
            print(f"[FAIL] Search error for '{query}': {e}")
    
    return True

if __name__ == "__main__":
    test_search_mappings()