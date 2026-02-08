#!/usr/bin/env python3
"""
Script to create admin account in the admins table
"""

import sys
import os
sys.path.append('.')

from database_manager import db_manager

def create_admin_account():
    """Create an admin account in the admins table"""
    try:
        conn = db_manager.get_connection()
        
        email = 'admin@kamioi.com'
        password = 'password123'  # Plain text password (backend checks plain text)
        name = 'Admin User'
        role = 'admin'
        
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Check if admin already exists
            result = conn.execute(text('SELECT id FROM admins WHERE LOWER(email) = LOWER(:email)'), {'email': email})
            existing = result.fetchone()
            
            if existing:
                # Update existing admin
                conn.execute(text("""
                    UPDATE admins 
                    SET password = :password, name = :name, role = :role, is_active = true
                    WHERE LOWER(email) = LOWER(:email)
                """), {
                    'email': email,
                    'password': password,
                    'name': name,
                    'role': role
                })
                conn.commit()
                print(f"[OK] Updated existing admin account: {email}")
            else:
                # Create new admin
                conn.execute(text("""
                    INSERT INTO admins (email, password, name, role, permissions, is_active)
                    VALUES (:email, :password, :name, :role, '{}', true)
                """), {
                    'email': email,
                    'password': password,
                    'name': name,
                    'role': role
                })
                conn.commit()
                print(f"[OK] Created new admin account: {email}")
            
            db_manager.release_connection(conn)
        else:
            # SQLite
            cur = conn.cursor()
            
            # Check if admin already exists
            cur.execute("SELECT id FROM admins WHERE email = ?", (email,))
            existing = cur.fetchone()
            
            if existing:
                # Update existing admin
                cur.execute("""
                    UPDATE admins 
                    SET password = ?, name = ?, role = ?, is_active = 1
                    WHERE email = ?
                """, (password, name, role, email))
                print(f"[OK] Updated existing admin account: {email}")
            else:
                # Create new admin
                cur.execute("""
                    INSERT INTO admins (email, password, name, role, permissions, is_active)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (email, password, name, role, '{}', 1))
                print(f"[OK] Created new admin account: {email}")
            
            conn.commit()
            conn.close()
        
        print(f"\nEmail: {email}")
        print(f"Password: {password}")
        print(f"Name: {name}")
        print(f"Role: {role}")
        print("\n[SUCCESS] Admin account ready to use!")
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Error creating admin account: {e}")
        print(traceback.format_exc())

if __name__ == '__main__':
    create_admin_account()
