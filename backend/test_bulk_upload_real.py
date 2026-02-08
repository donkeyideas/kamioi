import requests
import json
import os

def test_bulk_upload_with_real_csv():
    print("Testing bulk upload with real CSV files...")
    print("=" * 60)
    
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

    # Test with the user's actual CSV files
    csv_files = [
        r"C:\Users\beltr\Dropbox\LLM Mapping\Mapping Master.10152015.v1.csv",
        r"C:\Users\beltr\Dropbox\LLM Mapping\Mapping Master.10152015.v2.csv"
    ]
    
    for csv_file in csv_files:
        print(f"\n2. Testing bulk upload with: {os.path.basename(csv_file)}")
        
        if not os.path.exists(csv_file):
            print(f"[SKIP] File not found: {csv_file}")
            continue
            
        try:
            headers = {
                'Authorization': f'Bearer {token}'
            }
            
            with open(csv_file, 'rb') as f:
                files = {'file': (os.path.basename(csv_file), f, 'text/csv')}
                
                response = requests.post(
                    'http://127.0.0.1:5001/api/admin/bulk-upload',
                    headers=headers,
                    files=files,
                    timeout=30
                )
                
            print(f"Bulk upload status: {response.status_code}")
            print(f"Bulk upload response: {json.dumps(response.json(), indent=2)}")
            
            if response.status_code == 200 and response.json().get('success'):
                print(f"[OK] Bulk upload successful for {os.path.basename(csv_file)}!")
            else:
                print(f"[FAIL] Bulk upload failed for {os.path.basename(csv_file)}: {response.text}")
                
        except Exception as e:
            print(f"[FAIL] Bulk upload error for {os.path.basename(csv_file)}: {e}")
    
    return True

if __name__ == "__main__":
    test_bulk_upload_with_real_csv()
