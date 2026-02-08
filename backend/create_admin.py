#!/usr/bin/env python3

import sys
import os
sys.path.append('.')

from database_manager import db_manager

def create_admin_user():
    """Create an admin user in the database"""
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        # Check if admin user already exists
        cur.execute("SELECT id FROM users WHERE email = ?", ('admin@admin.com',))
        existing = cur.fetchone()
        
        if existing:
            # Update existing user to admin
            cur.execute("""
                UPDATE users 
                SET account_type = 'admin', name = 'Admin User'
                WHERE email = ?
            """, ('admin@admin.com',))
            print("Updated existing user to admin")
        else:
            # Create new admin user
            cur.execute("""
                INSERT INTO users (email, password, name, account_type)
                VALUES (?, ?, ?, ?)
            """, ('admin@admin.com', 'admin123', 'Admin User', 'admin'))
            print("Created new admin user")
        
        conn.commit()
        conn.close()
        
        print("Admin user created/updated successfully!")
        print("Email: admin@admin.com")
        print("Password: admin")
        print("Token: token_6")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")

if __name__ == '__main__':
    create_admin_user()
