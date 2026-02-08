import sqlite3
import requests
import json

# First, let's check what's actually in the database
print("=== Checking Database ===")
conn = sqlite3.connect('kamioi.db')
cur = conn.cursor()
cur.execute("SELECT id, email, password, name, account_type FROM users WHERE account_type = 'admin'")
row = cur.fetchone()
conn.close()

if row:
    print(f"Admin user found:")
    print(f"  ID: {row[0]}")
    print(f"  Email: '{row[1]}'")
    print(f"  Password: '{row[2]}'")
    print(f"  Name: {row[3]}")
    print(f"  Type: {row[4]}")
    print(f"  Password length: {len(row[2])}")
    print(f"  Password bytes: {row[2].encode()}")
else:
    print("No admin user found!")

print("\n=== Testing Admin Login ===")
# Now test the login
url = "http://localhost:5000/api/admin/auth/login"
data = {
    "email": "info@kamioi.com",
    "password": "admin123"
}

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

