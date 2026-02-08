#!/usr/bin/env python3
"""
Script to completely delete demo users by removing all foreign key references first
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def delete_demo_users_final():
    """Delete demo users and all their foreign key references"""
    print("[DELETE FINAL] Starting final demo user deletion...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    demo_user_ids = [1001, 1002]  # 1000 already deleted
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            for user_id in demo_user_ids:
                print(f"\n[DELETE FINAL] Deleting demo user {user_id}...")
                conn = db_manager.get_connection()
                try:
                    # Delete all foreign key references first
                    print(f"   Deleting bank connections...")
                    try:
                        conn.execute(text('DELETE FROM family_bank_connections WHERE user_id = :user_id'), {'user_id': user_id})
                    except Exception:
                        try:
                            conn.execute(text('DELETE FROM business_bank_connections WHERE user_id = :user_id'), {'user_id': user_id})
                        except Exception:
                            pass
                    
                    # Delete other related data
                    print(f"   Deleting related data...")
                    conn.execute(text('DELETE FROM transactions WHERE user_id = :user_id'), {'user_id': user_id})
                    conn.execute(text('DELETE FROM portfolios WHERE user_id = :user_id'), {'user_id': user_id})
                    conn.execute(text('DELETE FROM goals WHERE user_id = :user_id'), {'user_id': user_id})
                    conn.execute(text('DELETE FROM notifications WHERE user_id = :user_id'), {'user_id': user_id})
                    
                    # Delete the user
                    print(f"   Deleting user...")
                    result = conn.execute(text('DELETE FROM users WHERE id = :user_id'), {'user_id': user_id})
                    deleted = result.rowcount
                    
                    conn.commit()
                    
                    if deleted > 0:
                        print(f"   [OK] Deleted demo user {user_id}")
                    else:
                        print(f"   [INFO] User {user_id} not found")
                except Exception as e:
                    print(f"   [ERROR] Failed to delete user {user_id}: {e}")
                    conn.rollback()
                finally:
                    db_manager.release_connection(conn)
        else:
            # SQLite version
            for user_id in demo_user_ids:
                print(f"\n[DELETE FINAL] Deleting demo user {user_id}...")
                conn = db_manager.get_connection()
                cursor = conn.cursor()
                try:
                    cursor.execute('DELETE FROM family_bank_connections WHERE user_id = ?', (user_id,))
                    cursor.execute('DELETE FROM business_bank_connections WHERE user_id = ?', (user_id,))
                    cursor.execute('DELETE FROM transactions WHERE user_id = ?', (user_id,))
                    cursor.execute('DELETE FROM portfolios WHERE user_id = ?', (user_id,))
                    cursor.execute('DELETE FROM goals WHERE user_id = ?', (user_id,))
                    cursor.execute('DELETE FROM notifications WHERE user_id = ?', (user_id,))
                    cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
                    deleted = cursor.rowcount
                    conn.commit()
                    if deleted > 0:
                        print(f"   [OK] Deleted demo user {user_id}")
                except Exception as e:
                    print(f"   [ERROR] Failed to delete user {user_id}: {e}")
                    conn.rollback()
                finally:
                    conn.close()
        
        # Final verification
        print("\n[DELETE FINAL] Final verification...")
        conn = db_manager.get_connection()
        if db_manager._use_postgresql:
            from sqlalchemy import text
            for user_id in [1000, 1001, 1002]:
                result = conn.execute(text('SELECT id FROM users WHERE id = :user_id'), {'user_id': user_id})
                if result.fetchone():
                    print(f"   [WARNING] User {user_id} still exists!")
                else:
                    print(f"   [OK] User {user_id} deleted")
            
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            tx_count = result.scalar() or 0
            print(f"\n   Total transactions: {tx_count}")
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            for user_id in [1000, 1001, 1002]:
                cursor.execute('SELECT id FROM users WHERE id = ?', (user_id,))
                if cursor.fetchone():
                    print(f"   [WARNING] User {user_id} still exists!")
                else:
                    print(f"   [OK] User {user_id} deleted")
            cursor.execute('SELECT COUNT(*) FROM transactions')
            tx_count = cursor.fetchone()[0] or 0
            print(f"\n   Total transactions: {tx_count}")
            conn.close()
        
        print("\n[DELETE FINAL] Complete!")
        
    except Exception as e:
        import traceback
        print(f"[ERROR] {e}")
        print(traceback.format_exc())

if __name__ == '__main__':
    delete_demo_users_final()


