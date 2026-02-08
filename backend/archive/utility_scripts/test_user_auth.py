#!/usr/bin/env python3

import sqlite3
import os
from datetime import datetime

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def test_user_authentication():
    """Test user authentication and token generation"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print("Testing user authentication for beltranalain@gmail.com...")
        
        # Get user details
        cursor.execute("SELECT id, email, name, account_type FROM users WHERE email = ?", ('beltranalain@gmail.com',))
        user = cursor.fetchone()
        
        if not user:
            print("User not found!")
            return
        
        print(f"User found: {user['name']} ({user['email']})")
        print(f"   User ID: {user['id']}")
        print(f"   Account Type: {user['account_type']}")
        
        # Generate expected token
        expected_token = f"user_token_{user['id']}"
        print(f"   Expected Token: {expected_token}")
        
        # Test API endpoint
        import requests
        try:
            response = requests.get(
                'http://127.0.0.1:5000/api/user/transactions',
                headers={'Authorization': f'Bearer {expected_token}'}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"API Test Successful!")
                print(f"   Transactions returned: {len(data.get('transactions', []))}")
            else:
                print(f"API Test Failed: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"API Test Error: {e}")
        
    except Exception as e:
        print(f"Database Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_user_authentication()
