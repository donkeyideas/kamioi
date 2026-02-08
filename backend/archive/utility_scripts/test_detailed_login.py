import requests
import json

def test_detailed_login():
    print("Testing detailed login scenarios...")
    
    # Test 1: Exact credentials
    print("\n=== Test 1: Exact credentials ===")
    login_data = {
        "email": "info@kamioi.com",
        "password": "admin123"
    }
    test_login(login_data)
    
    # Test 2: Email with different case
    print("\n=== Test 2: Email with different case ===")
    login_data = {
        "email": "INFO@KAMIOI.COM",
        "password": "admin123"
    }
    test_login(login_data)
    
    # Test 3: Email with whitespace
    print("\n=== Test 3: Email with whitespace ===")
    login_data = {
        "email": " info@kamioi.com ",
        "password": "admin123"
    }
    test_login(login_data)
    
    # Test 4: Different password
    print("\n=== Test 4: Different password ===")
    login_data = {
        "email": "info@kamioi.com",
        "password": "wrongpassword"
    }
    test_login(login_data)

def test_login(login_data):
    try:
        response = requests.post(
            'http://127.0.0.1:5000/api/admin/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        print(f"Request: {login_data}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_detailed_login()
