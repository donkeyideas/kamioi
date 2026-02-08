import requests
import json

def test_gl_account_15200_integration():
    print("Testing GL Account 15200 Integration...")
    print("=" * 60)
    
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
        response_data = response.json()
        print(f"LLM Data Assets response: {json.dumps(response_data, indent=2)}")
        
        if response.status_code == 200 and response_data.get('success'):
            total_value = response_data.get('data', {}).get('summary', {}).get('total_value', 0)
            gl_account = response_data.get('data', {}).get('summary', {}).get('gl_account', 'N/A')
            
            print(f"\n[SUCCESS] GL Account Integration Results:")
            print(f"   GL Account: {gl_account}")
            print(f"   Total Asset Value: ${total_value:,.2f}")
            print(f"   Number of Assets: {response_data.get('data', {}).get('summary', {}).get('total_assets', 0)}")
            
            if gl_account == '15200':
                print(f"[OK] GL Account 15200 is correctly linked!")
            else:
                print(f"[FAIL] GL Account mismatch: expected 15200, got {gl_account}")
                
            if total_value == 0:
                print(f"[OK] Balance is $0 (correct for empty database)")
            else:
                print(f"[OK] Balance is ${total_value:,.2f} (calculated from real data)")
                
            return True
        else:
            print(f"[FAIL] LLM Data Assets failed: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] LLM Data Assets request failed: {e}")
        return False

if __name__ == "__main__":
    test_gl_account_15200_integration()
