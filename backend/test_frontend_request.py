import requests
import json

def test_frontend_request():
    print("Testing the exact request the frontend makes...")
    
    # Simulate the exact request the frontend makes
    form_data = {
        "email": "info@kamioi.com",
        "password": "admin123"
    }
    
    print(f"Request data: {form_data}")
    
    try:
        response = requests.post(
            'http://127.0.0.1:5000/api/admin/auth/login',
            json=form_data,
            headers={
                'Content-Type': 'application/json',
            },
            timeout=5
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Token: {data.get('token')}")
        else:
            print(f"Failed: {response.json()}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_frontend_request()
