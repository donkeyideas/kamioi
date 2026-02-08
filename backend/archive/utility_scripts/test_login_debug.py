import requests
import json

def test_login_debug():
    print("Testing admin login with debug info...")
    
    # Test with exact credentials from database
    login_data = {
        "email": "info@kamioi.com",
        "password": "admin123"
    }
    
    print(f"Sending request with: {login_data}")
    
    try:
        response = requests.post(
            'http://127.0.0.1:5000/api/admin/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Token: {data.get('token')}")
            print(f"User: {data.get('user')}")
        else:
            print(f"Failed: {response.json()}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_login_debug()