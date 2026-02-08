import requests
import json
import os

def test_bulk_upload():
    print("Testing bulk upload functionality...")
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
    
    # Test bulk upload endpoint
    print("\n2. Testing bulk upload endpoint...")
    headers = {
        'Authorization': f'Bearer {token}',
    }
    
    # Create a test CSV file
    test_csv_content = """merchant_name,ticker_symbol,category,confidence,tags
STARBUCKS,SBUX,Food & Dining,0.95,Coffee
AMAZON,AMZN,Online Retail,0.90,E-commerce
NETFLIX,NFLX,Entertainment,0.85,Streaming
APPLE,AAPL,Technology,0.92,Electronics
GOOGLE,GOOGL,Technology,0.88,Search"""
    
    # Save test CSV
    test_csv_path = "test_mappings.csv"
    with open(test_csv_path, 'w', encoding='utf-8') as f:
        f.write(test_csv_content)
    
    try:
        with open(test_csv_path, 'rb') as f:
            files = {'file': ('test_mappings.csv', f, 'text/csv')}
            response = requests.post(
                'http://127.0.0.1:5001/api/admin/bulk-upload',
                files=files,
                headers=headers,
                timeout=10
            )
        
        print(f"Bulk upload status: {response.status_code}")
        print(f"Bulk upload response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200 and response.json().get('success'):
            print("[OK] Bulk upload successful!")
            return True
        else:
            print(f"[FAIL] Bulk upload failed: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Bulk upload request failed: {e}")
        return False
    finally:
        # Clean up test file
        if os.path.exists(test_csv_path):
            os.remove(test_csv_path)

if __name__ == "__main__":
    test_bulk_upload()