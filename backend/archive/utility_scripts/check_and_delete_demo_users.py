#!/usr/bin/env python3
"""
Script to check and delete demo users directly
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def check_and_delete():
    """Check if demo users exist and delete them"""
    print("[CHECK] Checking for demo users...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    demo_user_ids = [1000, 1001, 1002]
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Check which demo users exist
            print("\n1. Checking which demo users exist...")
            for user_id in demo_user_ids:
                result = conn.execute(text('SELECT id, email, account_type FROM users WHERE id = :user_id'), {'user_id': user_id})
                row = result.fetchone()
                if row:
                    print(f"   User {user_id}: {row[1]} ({row[2]}) - EXISTS")
                else:
                    print(f"   User {user_id}: NOT FOUND")
            
            # Delete demo users directly (data should already be deleted)
            print("\n2. Deleting demo users...")
            for user_id in demo_user_ids:
                try:
                    result = conn.execute(text('DELETE FROM users WHERE id = :user_id'), {'user_id': user_id})
                    deleted = result.rowcount
                    conn.commit()
                    if deleted > 0:
                        print(f"   [OK] Deleted user {user_id}")
                    else:
                        print(f"   [INFO] User {user_id} not found")
                except Exception as e:
                    print(f"   [ERROR] Failed to delete user {user_id}: {e}")
                    conn.rollback()
            
            # Verify deletion
            print("\n3. Verifying deletion...")
            for user_id in demo_user_ids:
                result = conn.execute(text('SELECT id FROM users WHERE id = :user_id'), {'user_id': user_id})
                if result.fetchone():
                    print(f"   [WARNING] User {user_id} still exists!")
                else:
                    print(f"   [OK] User {user_id} deleted")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            
            for user_id in demo_user_ids:
                cursor.execute('SELECT id, email, account_type FROM users WHERE id = ?', (user_id,))
                row = cursor.fetchone()
                if row:
                    print(f"   User {user_id}: {row[1]} ({row[2]}) - EXISTS")
                else:
                    print(f"   User {user_id}: NOT FOUND")
            
            for user_id in demo_user_ids:
                try:
                    cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
                    deleted = cursor.rowcount
                    conn.commit()
                    if deleted > 0:
                        print(f"   [OK] Deleted user {user_id}")
                except Exception as e:
                    print(f"   [ERROR] Failed to delete user {user_id}: {e}")
                    conn.rollback()
            
            conn.close()
        
        # Final check - count transactions
        print("\n4. Final transaction count...")
        final_conn = db_manager.get_connection()
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = final_conn.execute(text('SELECT COUNT(*) FROM transactions'))
            count = result.scalar() or 0
            print(f"   Total transactions: {count}")
            db_manager.release_connection(final_conn)
        else:
            cursor = final_conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions')
            count = cursor.fetchone()[0] or 0
            print(f"   Total transactions: {count}")
            final_conn.close()
        
    except Exception as e:
        import traceback
        print(f"[ERROR] {e}")
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == '__main__':
    check_and_delete()


