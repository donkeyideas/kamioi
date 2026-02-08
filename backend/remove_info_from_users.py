#!/usr/bin/env python3
"""
Remove info@kamioi.com from users table
This account should only exist in the admins table
"""

import sqlite3
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "kamioi.db")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Removing info@kamioi.com from users table...")

# Check if info@kamioi.com exists in users table
cursor.execute("SELECT id, email, name FROM users WHERE email = ?", ('info@kamioi.com',))
user_row = cursor.fetchone()

if user_row:
    print(f"Found user: ID {user_row[0]}, Email: {user_row[1]}, Name: {user_row[2]}")
    
    # Delete from users table
    cursor.execute("DELETE FROM users WHERE email = ?", ('info@kamioi.com',))
    print("Removed info@kamioi.com from users table")
    
    # Also remove any associated transactions, notifications, etc.
    cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_row[0],))
    cursor.execute("DELETE FROM notifications WHERE user_id = ?", (user_row[0],))
    print("Removed associated data")
else:
    print("info@kamioi.com not found in users table")

# Verify removal
cursor.execute("SELECT COUNT(*) FROM users WHERE email = ?", ('info@kamioi.com',))
count = cursor.fetchone()[0]
print(f"Users with info@kamioi.com: {count}")

# Check admins table
cursor.execute("SELECT id, email, name, role FROM admins WHERE email = ?", ('info@kamioi.com',))
admin_row = cursor.fetchone()
if admin_row:
    print(f"Admin account exists: ID {admin_row[0]}, Email: {admin_row[1]}, Name: {admin_row[2]}, Role: {admin_row[3]}")
else:
    print("No admin account found for info@kamioi.com")

conn.commit()
conn.close()

print("\nCleanup complete!")
print("info@kamioi.com is now only in the admins table, not in users table")
