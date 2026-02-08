#!/usr/bin/env python3

import sqlite3
import os
import requests
import json

def fix_user_password():
    """Delete the existing user and create a new one with correct password"""
    print("FIXING USER PASSWORD")
    print("=" * 25)
    
    DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    base_url = "http://localhost:5000"
    
    try:
        # Delete the existing user
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("[DELETE] Deleting existing user@user.com")
        cursor.execute("DELETE FROM users WHERE email = 'user@user.com'")
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        print(f"[DELETE] Deleted {deleted_count} users")
        
        # Wait a moment
        import time
        time.sleep(1)
        
        # Create new user with correct password
        print("[CREATE] Creating new user@user.com with password123")
        user_data = {
            "email": "user@user.com",
            "password": "password123",
            "confirm_password": "password123",
            "round_up_amount": 1.00,
            "risk_tolerance": "Moderate",
            "investment_goals": ["Other"],
            "terms_agreed": True,
            "privacy_agreed": True,
            "marketing_agreed": False
        }
        
        response = requests.post(f"{base_url}/api/user/auth/register", json=user_data)
        print(f"Registration Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("[OK] User created successfully")
                print(f"User ID: {result.get('user', {}).get('id', 'N/A')}")
                
                # Test login
                print(f"\n[TEST] Testing login")
                login_data = {
                    "email": "user@user.com",
                    "password": "password123"
                }
                
                login_response = requests.post(f"{base_url}/api/user/auth/login", json=login_data)
                print(f"Login Status: {login_response.status_code}")
                
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    if login_result.get('success'):
                        print("[OK] Login successful!")
                        print(f"User Name: {login_result.get('user', {}).get('name', 'N/A')}")
                        print("✅ The user can now login with user@user.com / password123")
                    else:
                        print(f"[FAIL] Login failed: {login_result.get('error')}")
                else:
                    print(f"[FAIL] Login failed: {login_response.text}")
            else:
                print(f"[FAIL] User creation failed: {result.get('error')}")
        else:
            print(f"[FAIL] User creation failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Error: {e}")
    
    print(f"\n" + "=" * 25)
    print("USER PASSWORD FIX COMPLETE")

if __name__ == "__main__":
    fix_user_password()
