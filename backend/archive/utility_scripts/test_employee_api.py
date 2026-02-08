#!/usr/bin/env python3
"""
Test Employee Management API
"""

import requests
import time

def test_employee_api():
    """Test the employee management API"""
    print("=== TESTING EMPLOYEE MANAGEMENT API ===")
    
    # Wait a moment for server to start
    time.sleep(3)
    
    # Test admin login first
    print("1. Testing admin login...")
    login_resp = requests.post('http://127.0.0.1:5000/api/admin/auth/login', 
                              json={'email': 'info@kamioi.com', 'password': 'admin123'})
    
    print(f"Login status: {login_resp.status_code}")
    if login_resp.status_code == 200:
        data = login_resp.json()
        token = data.get('token')
        print(f"Token: {token}")
        
        # Test employees API
        print("\n2. Testing employees API...")
        headers = {'Authorization': f'Bearer {token}'}
        emp_resp = requests.get('http://127.0.0.1:5000/api/admin/employees', headers=headers)
        
        print(f"Employees status: {emp_resp.status_code}")
        if emp_resp.status_code == 200:
            emp_data = emp_resp.json()
            print(f"Success: {emp_data.get('success')}")
            print(f"Employees count: {len(emp_data.get('employees', []))}")
            print("✅ Employee Management API is working!")
            
            # Show employees
            employees = emp_data.get('employees', [])
            for emp in employees:
                print(f"  - {emp.get('name')} ({emp.get('email')}) - {emp.get('role')}")
        else:
            print(f"Error: {emp_resp.text[:200]}")
    else:
        print(f"Login failed: {login_resp.text[:200]}")

if __name__ == "__main__":
    test_employee_api()
