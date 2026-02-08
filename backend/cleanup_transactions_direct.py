#!/usr/bin/env python3
"""
Direct cleanup script to remove all transactions except for user 94
Run this from the backend directory while the server is NOT running
"""

import sqlite3
import os

DB_PATH = 'kamioi.db'
KEEP_USER_ID = 94

def cleanup_transactions():
    """Remove all transactions except for user 94"""
    if not os.path.exists(DB_PATH):
        print(f"[ERROR] Database {DB_PATH} not found!")
        return False
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        
        # Verify user 94 exists
        cur.execute('SELECT id, name, email FROM users WHERE id = ?', (KEEP_USER_ID,))
        user = cur.fetchone()
        if not user:
            print(f"[ERROR] User ID {KEEP_USER_ID} not found!")
            conn.close()
            return False
        
        print(f"[OK] Keeping user: ID {user[0]} - {user[1]} ({user[2]})")
        
        # Count current state
        cur.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (KEEP_USER_ID,))
        transactions_to_keep = cur.fetchone()[0]
        
        cur.execute('SELECT COUNT(*) FROM transactions WHERE user_id != ?', (KEEP_USER_ID,))
        transactions_to_delete = cur.fetchone()[0]
        
        cur.execute('SELECT COUNT(*) FROM users WHERE id != ?', (KEEP_USER_ID,))
        users_to_delete = cur.fetchone()[0]
        
        print(f"\n[INFO] Current state:")
        print(f"  - Transactions to keep (user {KEEP_USER_ID}): {transactions_to_keep}")
        print(f"  - Transactions to delete: {transactions_to_delete}")
        print(f"  - Users to delete: {users_to_delete}")
        
        if transactions_to_delete == 0 and users_to_delete == 0:
            print("\n[INFO] No test data to clean up - database is already clean!")
            conn.close()
            return True
        
        # Ask for confirmation
        print(f"\n[WARNING] About to delete:")
        print(f"  - {transactions_to_delete} transactions from other users")
        print(f"  - {users_to_delete} test users")
        print(f"\n[INFO] This will keep only user {KEEP_USER_ID} with {transactions_to_keep} transactions")
        
        response = input(f"\n[?] Proceed with cleanup? (yes/no): ")
        if response.lower() != 'yes':
            print("[CANCELLED] Cleanup cancelled.")
            conn.close()
            return False
        
        print("\n[DELETING] Starting cleanup...")
        
        # Delete transactions from other users
        cur.execute('DELETE FROM transactions WHERE user_id != ?', (KEEP_USER_ID,))
        deleted_transactions = cur.rowcount
        print(f"  [OK] Deleted {deleted_transactions} transactions")
        
        # Delete other users
        cur.execute('DELETE FROM users WHERE id != ?', (KEEP_USER_ID,))
        deleted_users = cur.rowcount
        print(f"  [OK] Deleted {deleted_users} users")
        
        # Clean up orphaned data
        cur.execute('DELETE FROM llm_mappings WHERE user_id NOT IN (SELECT id FROM users)')
        deleted_mappings = cur.rowcount
        if deleted_mappings > 0:
            print(f"  [OK] Deleted {deleted_mappings} orphaned mappings")
        
        cur.execute('DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM users)')
        deleted_notifications = cur.rowcount
        if deleted_notifications > 0:
            print(f"  [OK] Deleted {deleted_notifications} orphaned notifications")
        
        cur.execute('DELETE FROM user_settings WHERE user_id NOT IN (SELECT id FROM users)')
        deleted_settings = cur.rowcount
        if deleted_settings > 0:
            print(f"  [OK] Deleted {deleted_settings} orphaned settings")
        
        conn.commit()
        
        # Verify final state
        cur.execute('SELECT COUNT(*) FROM users')
        final_users = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM transactions')
        final_transactions = cur.fetchone()[0]
        
        print(f"\n[OK] Cleanup complete!")
        print(f"  Final state: {final_users} user(s), {final_transactions} transaction(s)")
        
        conn.close()
        return True
        
    except sqlite3.OperationalError as e:
        if 'locked' in str(e).lower():
            print(f"[ERROR] Database is locked!")
            print(f"[ERROR] Please close any other processes using the database:")
            print(f"  - SQLite browser")
            print(f"  - Python backend server (app.py)")
            print(f"  - Other scripts")
        else:
            print(f"[ERROR] Database error: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Direct Transaction Cleanup Script")
    print("=" * 60)
    print(f"Keeping only user ID {KEEP_USER_ID} and their transactions")
    print("=" * 60)
    
    success = cleanup_transactions()
    
    if success:
        print("\n[OK] Database cleanup completed successfully!")
        print("[INFO] You can now restart your backend server")
    else:
        print("\n[ERROR] Database cleanup failed or was cancelled.")


