import requests
import json

def test_frontend_connection():
    """Test if frontend can connect to backend"""
    
    print("Testing Frontend Connection to Backend...")
    print("=" * 50)
    
    try:
        # Test health endpoint
        print("1. Testing health endpoint...")
        response = requests.get('http://127.0.0.1:5000/api/health', timeout=5)
        print(f"   Health Status: {response.status_code}")
        if response.status_code == 200:
            print("   [OK] Health endpoint working")
        else:
            print("   [FAIL] Health endpoint failed")
            return False
        
        # Test admin login
        print("\n2. Testing admin login...")
        login_data = {
            "email": "info@kamioi.com",
            "password": "admin123"
        }
        response = requests.post(
            'http://127.0.0.1:5000/api/admin/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        print(f"   Login Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print(f"   [OK] Admin login working, token: {token}")
        else:
            print(f"   [FAIL] Admin login failed: {response.text}")
            return False
        
        # Test admin users endpoint
        print("\n3. Testing admin users endpoint...")
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        response = requests.get('http://127.0.0.1:5000/api/admin/users', headers=headers, timeout=5)
        print(f"   Users Status: {response.status_code}")
        if response.status_code == 200:
            print("   [OK] Admin users endpoint working")
        else:
            print(f"   [FAIL] Admin users endpoint failed: {response.text}")
            return False
        
        # Test family endpoints
        print("\n4. Testing family endpoints...")
        family_endpoints = [
            '/api/family/transactions',
            '/api/family/portfolio',
            '/api/family/ai-insights'
        ]
        
        for endpoint in family_endpoints:
            try:
                response = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers, timeout=5)
                status = "OK" if response.status_code == 200 else "FAIL"
                print(f"   {endpoint}: {response.status_code} [{status}]")
            except Exception as e:
                print(f"   {endpoint}: Error - {e}")
        
        # Test business endpoints
        print("\n5. Testing business endpoints...")
        business_endpoints = [
            '/api/admin/notifications',
            '/api/admin/transactions',
            '/api/admin/llm-center/mappings'
        ]
        
        for endpoint in business_endpoints:
            try:
                response = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers, timeout=5)
                status = "OK" if response.status_code == 200 else "FAIL"
                print(f"   {endpoint}: {response.status_code} [{status}]")
            except Exception as e:
                print(f"   {endpoint}: Error - {e}")
        
        print("\n" + "=" * 50)
        print("[SUCCESS] Backend is working correctly!")
        print("Frontend should be able to connect to http://127.0.0.1:5000")
        print("\nIf frontend is still showing port 5001, try:")
        print("1. Clear browser cache")
        print("2. Hard refresh (Ctrl+F5)")
        print("3. Check browser developer tools for any cached requests")
        
        return True
        
    except Exception as e:
        print(f"[FAIL] Connection test failed: {e}")
        return False

if __name__ == "__main__":
    test_frontend_connection()