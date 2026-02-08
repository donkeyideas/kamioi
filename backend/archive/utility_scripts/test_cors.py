"""Test script to verify CORS headers are being set correctly"""
import requests

BASE_URL = "http://127.0.0.1:5111"

def test_cors_headers():
    """Test that CORS headers are present on responses"""
    print("=" * 60)
    print("Testing CORS Headers")
    print("=" * 60)
    
    # Test OPTIONS preflight
    print("\n1. Testing OPTIONS preflight request...")
    try:
        response = requests.options(
            f"{BASE_URL}/api/admin/auth/login",
            headers={
                'Origin': 'http://localhost:4000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        )
        print(f"   Status: {response.status_code}")
        print(f"   Headers:")
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        for key, value in cors_headers.items():
            print(f"     {key}: {value}")
        
        if cors_headers['Access-Control-Allow-Origin']:
            print("   [OK] CORS headers present on OPTIONS")
        else:
            print("   [FAIL] CORS headers MISSING on OPTIONS")
    except Exception as e:
        print(f"   [ERROR] Error: {e}")
    
    # Test POST request
    print("\n2. Testing POST request (should have CORS headers)...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={'email': 'test@test.com', 'password': 'test'},
            headers={'Origin': 'http://localhost:4000'}
        )
        print(f"   Status: {response.status_code}")
        print(f"   Headers:")
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        for key, value in cors_headers.items():
            print(f"     {key}: {value}")
        
        if cors_headers['Access-Control-Allow-Origin']:
            print("   [OK] CORS headers present on POST")
        else:
            print("   [FAIL] CORS headers MISSING on POST")
    except Exception as e:
        print(f"   [ERROR] Error: {e}")
    
    # Test simple endpoint
    print("\n3. Testing /api/test endpoint...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/test",
            headers={'Origin': 'http://localhost:4000'}
        )
        print(f"   Status: {response.status_code}")
        cors_header = response.headers.get('Access-Control-Allow-Origin')
        print(f"   Access-Control-Allow-Origin: {cors_header}")
        
        if cors_header:
            print("   [OK] CORS headers present")
        else:
            print("   [FAIL] CORS headers MISSING")
    except Exception as e:
        print(f"   [ERROR] Error: {e}")
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_cors_headers()

