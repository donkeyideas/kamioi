import requests
import json

def test_auth_token():
    print("Testing authentication token...")
    print("=" * 50)
    
    # Test admin login
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
            
            # Test bulk upload endpoint with token
            print("\n2. Testing bulk upload endpoint...")
            headers = {
                'Authorization': f'Bearer {token}',
            }
            
            # Create a test CSV file
            test_csv_content = """merchant_name,ticker_symbol,category,confidence,tags
STARBUCKS,SBUX,Food & Dining,0.95,Coffee
AMAZON,AMZN,Online Retail,0.90,E-commerce"""
            
            # Test with a simple request first
            try:
                response = requests.get(
                    'http://127.0.0.1:5001/api/admin/llm-center/queue',
                    headers=headers,
                    timeout=5
                )
                print(f"LLM Center endpoint status: {response.status_code}")
                if response.status_code == 200:
                    print("[OK] LLM Center endpoint working with token")
                else:
                    print(f"[FAIL] LLM Center endpoint failed: {response.text}")
            except Exception as e:
                print(f"[FAIL] LLM Center endpoint error: {e}")
            
            return True
        else:
            print(f"[FAIL] Login failed: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Login request failed: {e}")
        return False

if __name__ == "__main__":
    test_auth_token()
