import sqlite3
import os
import time

# Get correct database path
db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'kamioi.db')
print(f"Database path: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Delete existing admin users
    cur.execute("DELETE FROM users WHERE email IN ('info@kamioi.com', 'admin@kamioi.com')")
    
    # Create new admin user
    admin_id = 1
    email = 'info@kamioi.com'
    password = 'admin123'
    name = 'Admin User'
    account_type = 'admin'
    
    # Insert new admin user
    cur.execute("""
        INSERT INTO users (id, email, password, name, account_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    """, (admin_id, email, password, name, account_type))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Admin user created successfully!")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    print(f"\nYou can now login at http://127.0.0.1:4604/admin-login")
    
except Exception as e:
    print(f"❌ Error: {e}")
