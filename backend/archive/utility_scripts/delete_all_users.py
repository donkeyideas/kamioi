#!/usr/bin/env python3

import sqlite3
import os

def delete_all_users():
    """Delete all users from the database"""
    print("DELETING ALL USERS FROM DATABASE")
    print("=" * 40)
    
    DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # First, check how many users we have
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        print(f"Total users before deletion: {total_users}")
        
        # Get all users before deletion
        cursor.execute("SELECT id, email, name, role FROM users")
        users = cursor.fetchall()
        
        print(f"\nUsers to be deleted:")
        print("-" * 30)
        for user in users:
            print(f"ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Role: {user[3]}")
        
        # Delete all users
        cursor.execute("DELETE FROM users")
        deleted_count = cursor.rowcount
        
        # Commit the changes
        conn.commit()
        
        # Verify deletion
        cursor.execute("SELECT COUNT(*) FROM users")
        remaining_users = cursor.fetchone()[0]
        
        conn.close()
        
        print(f"\n" + "=" * 40)
        print(f"DELETION COMPLETE")
        print(f"Users deleted: {deleted_count}")
        print(f"Users remaining: {remaining_users}")
        print("=" * 40)
        
        if remaining_users == 0:
            print("✅ All users successfully deleted!")
        else:
            print(f"⚠️ Warning: {remaining_users} users still remain")
        
    except Exception as e:
        print(f"Error deleting users: {e}")

if __name__ == "__main__":
    delete_all_users()