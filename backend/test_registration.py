import requests
import json

# Test the registration endpoint
url = "http://localhost:5000/api/user/auth/register"
data = {
    "name": "Test User 2",
    "email": "test2@example.com", 
    "password": "password123",
    "account_type": "individual",
    "role": "user",
    "dashboard": "user"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("Registration endpoint working!")
    else:
        print("Registration endpoint failed!")
        
except Exception as e:
    print(f"Error: {e}")
