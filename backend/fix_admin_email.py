#!/usr/bin/env python3

import sqlite3
import hashlib
import os

def fix_admin_email():
    """Update admin email to info@kamioi.com"""
    print("=" * 60)
    print("FIXING ADMIN EMAIL ADDRESS")
    print("=" * 60)
    
    # Connect to database
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    if not os.path.exists(db_path):
        print("Database not found!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current admin accounts
        cursor.execute("SELECT id, email, name, role FROM admins")
        admins = cursor.fetchall()
        
        print(f"Current admin accounts:")
        for admin in admins:
            print(f"  ID: {admin[0]}, Email: {admin[1]}, Name: {admin[2]}, Role: {admin[3]}")
        
        # Update admin email to info@kamioi.com
        cursor.execute("""
            UPDATE admins 
            SET email = ? 
            WHERE email = ?
        """, ("info@kamioi.com", "admin@kamioi.com"))
        
        if cursor.rowcount > 0:
            conn.commit()
            print(f"\nUpdated admin email from admin@kamioi.com to info@kamioi.com")
        else:
            print(f"\nNo admin account found with email admin@kamioi.com")
        
        # Verify the change
        cursor.execute("SELECT id, email, name, role FROM admins WHERE email = ?", ("info@kamioi.com",))
        admin = cursor.fetchone()
        
        if admin:
            print(f"\nVerification successful:")
            print(f"  ID: {admin[0]}")
            print(f"  Email: {admin[1]}")
            print(f"  Name: {admin[2]}")
            print(f"  Role: {admin[3]}")
        else:
            print(f"\nVerification failed - admin account not found")
        
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        conn.close()
    
    print(f"\nCORRECT ADMIN CREDENTIALS:")
    print("Email: info@kamioi.com")
    print("Password: admin123")

if __name__ == "__main__":
    fix_admin_email()

