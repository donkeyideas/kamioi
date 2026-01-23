import sqlite3
import os

# Get correct database path
db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'kamioi.db')
print(f"Database path: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Check table structure
    cur.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cur.fetchall()]
    print(f"Columns: {columns}")
    
    # Delete existing admin users
    cur.execute("DELETE FROM users WHERE email IN ('info@kamioi.com', 'admin@kamioi.com')")
    
    # Create new admin user - only use columns that exist
    admin_id = 1
    email = 'info@kamioi.com'
    password = 'admin123'
    name = 'Admin User'
    account_type = 'admin'
    
    # Build insert query based on available columns
    if 'updated_at' in columns:
        cur.execute("""
            INSERT INTO users (id, email, password, name, account_type, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (admin_id, email, password, name, account_type))
    else:
        cur.execute("""
            INSERT INTO users (id, email, password, name, account_type, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        """, (admin_id, email, password, name, account_type))
    
    conn.commit()
    conn.close()
    
    print("SUCCESS! Admin user created!")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("\nYou can now login at http://127.0.0.1:4604/admin-login")
    
except Exception as e:
    print(f"Error: {e}")
