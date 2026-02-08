#!/usr/bin/env python3
"""
Cleanup script to remove test/old data from the database.
This will remove all users and transactions except for the specified user.
"""

import sqlite3
from datetime import datetime
import sys

# User ID to keep (Al Bell - the real user)
KEEP_USER_ID = 94

def cleanup_database():
    """Remove all users and transactions except for the specified user"""
    db_path = 'kamioi.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # Get user info before deletion
        cur.execute('SELECT id, name, email FROM users WHERE id = ?', (KEEP_USER_ID,))
        user = cur.fetchone()
        
        if not user:
            print(f"[ERROR] User ID {KEEP_USER_ID} not found!")
            conn.close()
            return False
        
        print(f"[OK] Keeping user: ID {user[0]} - {user[1]} ({user[2]})")
        
        # Count transactions to keep
        cur.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (KEEP_USER_ID,))
        transactions_to_keep = cur.fetchone()[0]
        print(f"[OK] Keeping {transactions_to_keep} transactions for user {KEEP_USER_ID}")
        
        # Count what will be deleted
        cur.execute('SELECT COUNT(*) FROM transactions WHERE user_id != ?', (KEEP_USER_ID,))
        transactions_to_delete = cur.fetchone()[0]
        
        cur.execute('SELECT COUNT(*) FROM users WHERE id != ?', (KEEP_USER_ID,))
        users_to_delete = cur.fetchone()[0]
        
        print(f"\n[WARNING] About to delete:")
        print(f"   - {transactions_to_delete} transactions")
        print(f"   - {users_to_delete} users")
        
        # Ask for confirmation
        response = input(f"\n[?] Are you sure you want to delete this data? (yes/no): ")
        if response.lower() != 'yes':
            print("[CANCELLED] Cleanup cancelled.")
            conn.close()
            return False
        
        print("\n[DELETING] Starting cleanup...")
        
        # Delete transactions from other users
        cur.execute('DELETE FROM transactions WHERE user_id != ?', (KEEP_USER_ID,))
        deleted_transactions = cur.rowcount
        print(f"   [OK] Deleted {deleted_transactions} transactions")
        
        # Delete other users
        cur.execute('DELETE FROM users WHERE id != ?', (KEEP_USER_ID,))
        deleted_users = cur.rowcount
        print(f"   [OK] Deleted {deleted_users} users")
        
        # Also clean up related data
        # Delete mappings from deleted users (if any remain)
        cur.execute('DELETE FROM llm_mappings WHERE user_id NOT IN (SELECT id FROM users)')
        deleted_mappings = cur.rowcount
        if deleted_mappings > 0:
            print(f"   [OK] Deleted {deleted_mappings} orphaned mappings")
        
        # Delete notifications from deleted users
        cur.execute('DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM users)')
        deleted_notifications = cur.rowcount
        if deleted_notifications > 0:
            print(f"   [OK] Deleted {deleted_notifications} orphaned notifications")
        
        # Delete user settings from deleted users
        cur.execute('DELETE FROM user_settings WHERE user_id NOT IN (SELECT id FROM users)')
        deleted_settings = cur.rowcount
        if deleted_settings > 0:
            print(f"   [OK] Deleted {deleted_settings} orphaned user settings")
        
        conn.commit()
        
        # Verify final state
        cur.execute('SELECT COUNT(*) FROM users')
        final_users = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM transactions')
        final_transactions = cur.fetchone()[0]
        
        print(f"\n[OK] Cleanup complete!")
        print(f"   Final state: {final_users} user(s), {final_transactions} transaction(s)")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"[ERROR] Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Database Cleanup Script")
    print("=" * 60)
    print(f"Keeping only user ID {KEEP_USER_ID} and their transactions")
    print("=" * 60)
    
    success = cleanup_database()
    
    if success:
        print("\n[OK] Database cleanup completed successfully!")
        sys.exit(0)
    else:
        print("\n[ERROR] Database cleanup failed or was cancelled.")
        sys.exit(1)

