"""Test script to verify the upload endpoint is accessible"""
import requests
import sys

def test_upload_endpoint():
    url = 'http://localhost:5111/api/business/upload-bank-file'
    
    # Test 1: OPTIONS preflight
    print("Testing OPTIONS preflight...")
    try:
        response = requests.options(url, timeout=5)
        print(f"OPTIONS response: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"OPTIONS failed: {e}")
        return False
    
    # Test 2: POST with minimal data (should fail auth, but should reach server)
    print("\nTesting POST request (should fail auth)...")
    try:
        response = requests.post(
            url,
            headers={'Authorization': 'Bearer token_108'},
            timeout=10
        )
        print(f"POST response: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except requests.exceptions.Timeout:
        print("POST request TIMED OUT - backend is not responding!")
        return False
    except Exception as e:
        print(f"POST failed: {e}")
        return False
    
    print("\n✅ Endpoint is accessible!")
    return True

if __name__ == '__main__':
    if not test_upload_endpoint():
        print("\n❌ Endpoint test failed - check if backend server is running")
        sys.exit(1)

