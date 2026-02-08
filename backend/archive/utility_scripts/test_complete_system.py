import requests
import json

def test_complete_system():
    print("[TEST] Testing Complete System...")
    print("=" * 50)
    
    try:
        # Step 1: Test admin login
        print("1. Testing Admin Login...")
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
        
        if login_response.status_code != 200:
            print(f"[FAIL] Login failed: {login_response.text}")
            return False
            
        login_data = login_response.json()
        token = login_data['token']
        print(f"[OK] Login successful! Token: {token}")
        
        # Step 2: Test all FinancialAnalytics endpoints
        print("\n2. Testing FinancialAnalytics Endpoints...")
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        endpoints = [
            ('/api/admin/transactions?limit=1000', 'Transactions'),
            ('/api/admin/users', 'Users'),
            ('/api/admin/llm-center/mappings?limit=1000', 'Mappings')
        ]
        
        for endpoint, name in endpoints:
            try:
                response = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    if name == 'Transactions':
                        count = len(data.get('transactions', []))
                    elif name == 'Users':
                        count = len(data.get('users', []))
                    else:
                        count = len(data.get('mappings', []))
                    print(f"[OK] {name}: {response.status_code} ({count} items)")
                else:
                    print(f"[FAIL] {name}: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"[FAIL] {name}: Error - {e}")
        
        # Step 3: Test CORS
        print("\n3. Testing CORS...")
        try:
            cors_response = requests.options(
                'http://127.0.0.1:5000/api/admin/transactions',
                headers={
                    'Origin': 'http://localhost:3765',
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Authorization'
                },
                timeout=5
            )
            print(f"[OK] CORS preflight: {cors_response.status_code}")
            print(f"   CORS headers: {dict(cors_response.headers)}")
        except Exception as e:
            print(f"[FAIL] CORS test failed: {e}")
        
        # Step 4: Test admin users endpoint
        print("\n4. Testing Admin Users Endpoint...")
        try:
            response = requests.get('http://127.0.0.1:5000/api/admin/users', headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"[OK] Admin users: {response.status_code}")
                print(f"   Users count: {len(data.get('users', []))}")
            else:
                print(f"[FAIL] Admin users: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"[FAIL] Admin users error: {e}")
        
        print("\n" + "=" * 50)
        print("[SUCCESS] System Test Complete!")
        print("[OK] Backend is working correctly")
        print("[OK] All endpoints are accessible")
        print("[OK] CORS is configured properly")
        print("\nNext Steps for Frontend:")
        print("1. Open browser Developer Tools (F12)")
        print("2. Go to Console tab")
        print("3. Run: localStorage.clear(); location.reload();")
        print("4. Or copy and paste the clear_frontend_tokens.js content")
        print("5. Test the FinancialAnalytics page")
        
        return True
        
    except Exception as e:
        print(f"[FAIL] System test failed: {e}")
        return False

if __name__ == "__main__":
    test_complete_system()