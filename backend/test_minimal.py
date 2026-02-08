import requests

try:
    response = requests.post("http://localhost:5002/api/admin/auth/login", json={"email": "test", "password": "test"})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")