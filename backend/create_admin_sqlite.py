#!/usr/bin/env python3
"""
Script to create admin account directly in SQLite database
"""

import sqlite3
import os

def create_admin_in_sqlite():
    """Create an admin account directly in SQLite database"""
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    if not os.path.exists(db_path):
        print(f"[ERROR] Database file not found: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        email = 'admin@kamioi.com'
        password = 'password123'  # Plain text password (backend checks plain text)
        name = 'Admin User'
        role = 'admin'
        
        # Check if admins table exists, if not create it
        cur.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT,
                role TEXT DEFAULT 'admin',
                permissions TEXT DEFAULT '{}',
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
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
        print(f"\n[SUCCESS] Admin account created in SQLite database!")
        print(f"Database: {db_path}")
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Error creating admin account: {e}")
        print(traceback.format_exc())

if __name__ == '__main__':
    create_admin_in_sqlite()
