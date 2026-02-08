#!/usr/bin/env python3

import sqlite3
import os

def check_current_users():
    """Check what users are currently in the database"""
    print("CHECKING CURRENT USERS IN DATABASE")
    print("=" * 40)
    
    DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check users table
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        print(f"Total users in database: {total_users}")
        
        # Get all users
        cursor.execute("SELECT id, email, name, role, account_type, created_at FROM users ORDER BY id")
        users = cursor.fetchall()
        
        print(f"\nAll users in database:")
        print("-" * 50)
        for user in users:
            print(f"ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Role: {user[3]}, Account Type: {user[4]}, Created: {user[5]}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error checking users: {e}")

if __name__ == "__main__":
    check_current_users()
