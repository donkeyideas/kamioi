import requests
import json

# Test clean server
url = "http://localhost:5003/api/admin/auth/login"
data = {
    "email": "info@kamioi.com",
    "password": "admin123"
}

print("Testing clean server...")
print(f"URL: {url}")
print(f"Data: {data}")

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Success: {result.get('success')}")
        print(f"Token: {result.get('token')}")
        print(f"User: {result.get('user')}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Request failed: {e}")

