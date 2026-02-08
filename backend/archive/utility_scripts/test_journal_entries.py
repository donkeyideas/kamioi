import requests
import json

def test_journal_entries():
    try:
        print("Testing journal entries endpoint...")
        
        # First, get a fresh admin token
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
            
            # Test journal entries endpoint
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get('http://127.0.0.1:5000/api/admin/journal-entries', headers=headers, timeout=5)
            print(f"Journal Entries Status: {response.status_code}")
            print(f"Journal Entries Response: {response.json()}")
            
            if response.status_code == 200:
                print("[OK] Journal entries endpoint working!")
            else:
                print(f"[FAIL] Journal entries failed: {response.text}")
        else:
            print(f"[FAIL] Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"[FAIL] Test failed: {e}")

if __name__ == "__main__":
    test_journal_entries()
