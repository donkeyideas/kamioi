#!/usr/bin/env python3
"""
Script to completely delete demo users and all their data
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def delete_demo_users():
    """Completely delete demo users and all their data"""
    print("[DELETE DEMO] Starting demo user deletion...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    demo_user_ids = [1000, 1001, 1002]
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            print("[DELETE DEMO] Deleting from PostgreSQL...")
            
            for user_id in demo_user_ids:
                print(f"\n[DELETE DEMO] Deleting demo user {user_id} and all data...")
                # Get a fresh connection for each user
                user_conn = db_manager.get_connection()
                try:
                    # Delete all related data
                    user_conn.execute(text('DELETE FROM transactions WHERE user_id = :user_id'), {'user_id': user_id})
                    user_conn.execute(text('DELETE FROM portfolios WHERE user_id = :user_id'), {'user_id': user_id})
                    user_conn.execute(text('DELETE FROM goals WHERE user_id = :user_id'), {'user_id': user_id})
                    user_conn.execute(text('DELETE FROM notifications WHERE user_id = :user_id'), {'user_id': user_id})
                    
                    # Try to delete round_up_allocations if table exists
                    try:
                        user_conn.execute(text('DELETE FROM round_up_allocations WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = :user_id)'), {'user_id': user_id})
                    except Exception:
                        pass  # Table might not exist
                    
                    # Delete the user
                    result = user_conn.execute(text('DELETE FROM users WHERE id = :user_id'), {'user_id': user_id})
                    deleted = result.rowcount
                    
                    user_conn.commit()
                    
                    if deleted > 0:
                        print(f"   [OK] Deleted demo user {user_id}")
                    else:
                        print(f"   [INFO] Demo user {user_id} not found (may have been deleted already)")
                except Exception as e:
                    print(f"   [WARNING] Error deleting user {user_id}: {e}")
                    user_conn.rollback()
                finally:
                    db_manager.release_connection(user_conn)
            
            db_manager.release_connection(conn)
        else:
            # SQLite version
            print("[DELETE DEMO] Deleting from SQLite...")
            cursor = conn.cursor()
            
            for user_id in demo_user_ids:
                print(f"\n[DELETE DEMO] Deleting demo user {user_id} and all data...")
                try:
                    cursor.execute('DELETE FROM transactions WHERE user_id = ?', (user_id,))
                    cursor.execute('DELETE FROM portfolios WHERE user_id = ?', (user_id,))
                    cursor.execute('DELETE FROM goals WHERE user_id = ?', (user_id,))
                    cursor.execute('DELETE FROM notifications WHERE user_id = ?', (user_id,))
                    
                    # Try to delete round_up_allocations if table exists
                    try:
                        cursor.execute('DELETE FROM round_up_allocations WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = ?)', (user_id,))
                    except Exception:
                        pass  # Table might not exist
                    
                    cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
                    deleted = cursor.rowcount
                    
                    conn.commit()
                    
                    if deleted > 0:
                        print(f"   [OK] Deleted demo user {user_id}")
                    else:
                        print(f"   [INFO] Demo user {user_id} not found")
                except Exception as e:
                    print(f"   [WARNING] Error deleting user {user_id}: {e}")
                    conn.rollback()
                    continue
            
            conn.close()
        
        print("\n[DELETE DEMO] Demo user deletion complete!")
        print("   - All demo users (1000, 1001, 1002) deleted")
        print("   - All demo user data deleted")
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Error deleting demo users: {e}")
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        sys.exit(1)

if __name__ == '__main__':
    delete_demo_users()

