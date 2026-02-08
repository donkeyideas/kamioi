import requests
import json
import os

def test_simple_upload():
    print("Testing simple bulk upload...")
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

    # Create a simple test CSV
    test_csv_content = """Merchant Name,Category,Ticker Symbol,Confidence,Notes
STARBUCKS,Food & Dining,SBUX,0.95,Coffee Shop
AMAZON,Online Retail,AMZN,0.90,E-commerce
NETFLIX,Entertainment,NFLX,0.85,Streaming Service"""
    
    test_csv_path = "test_simple.csv"
    with open(test_csv_path, "w") as f:
        f.write(test_csv_content)
    print(f"[INFO] Created test CSV: {test_csv_path}")

    # Test bulk upload
    print("\n2. Testing bulk upload...")
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        with open(test_csv_path, 'rb') as f:
            files = {'file': (test_csv_path, f, 'text/csv')}
            
            response = requests.post(
                'http://127.0.0.1:5001/api/admin/bulk-upload',
                headers=headers,
                files=files,
                timeout=30
            )
            
        print(f"Bulk upload status: {response.status_code}")
        print(f"Bulk upload response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"[OK] Bulk upload successful!")
                print(f"   Processed: {result['data']['processed_rows']} rows")
                print(f"   Time: {result['data']['processing_time']}s")
                print(f"   Speed: {result['data']['rows_per_second']} rows/sec")
                return True
            else:
                print(f"[FAIL] Bulk upload failed: {result.get('error')}")
                return False
        else:
            print(f"[FAIL] Bulk upload failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"[FAIL] Bulk upload error: {e}")
        return False
    finally:
        # Clean up test CSV
        if os.path.exists(test_csv_path):
            os.remove(test_csv_path)
            print(f"[INFO] Cleaned up test CSV: {test_csv_path}")

if __name__ == "__main__":
    test_simple_upload()
