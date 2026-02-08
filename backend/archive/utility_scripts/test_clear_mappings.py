import requests
import json

def test_clear_mappings():
    """Test the clear mappings endpoint"""
    print("Testing clear mappings endpoint...")
    print("=" * 50)
    
    # Test admin login first
    login_data = {
        "email": "info@kamioi.com",
        "password": "admin123"
    }
    
    try:
        # Login to get token
        login_response = requests.post(
            'http://127.0.0.1:5001/api/admin/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if login_response.status_code != 200:
            print(f"[FAIL] Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return False
            
        login_result = login_response.json()
        token = login_result.get('token')
        
        if not token:
            print("[FAIL] No token received from login")
            return False
            
        print(f"[OK] Login successful, token: {token}")
        
        # Test clear mappings endpoint
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        clear_data = {
            'table_name': 'llm_mappings'
        }
        
        print("\nTesting clear mappings endpoint...")
        clear_response = requests.post(
            'http://127.0.0.1:5001/api/admin/database/clear-table',
            json=clear_data,
            headers=headers,
            timeout=10
        )
        
        print(f"Clear mappings status: {clear_response.status_code}")
        print(f"Clear mappings response: {clear_response.text}")
        
        if clear_response.status_code == 200:
            result = clear_response.json()
            if result.get('success'):
                print("[OK] Clear mappings successful!")
                return True
            else:
                print(f"[FAIL] Clear mappings failed: {result.get('error')}")
                return False
        else:
            print(f"[FAIL] Clear mappings request failed: {clear_response.status_code}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        return False

if __name__ == "__main__":
    test_clear_mappings()
