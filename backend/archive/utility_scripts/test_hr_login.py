#!/usr/bin/env python3
"""
Test HR Manager Login
"""

import requests

def test_hr_login():
    """Test HR Manager login"""
    print("Testing HR Manager login...")
    
    resp = requests.post('http://127.0.0.1:5000/api/admin/auth/login', 
                         json={'email': 'hr@kamioi.com', 'password': 'hr123'})
    
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Success: {data.get('success')}")
        print(f"Token: {data.get('token')}")
        print(f"User: {data.get('user')}")
        print("HR Manager can access admin dashboard!")
    else:
        print(f"Error: {resp.text[:200]}")

if __name__ == "__main__":
    test_hr_login()
