#!/usr/bin/env python3
"""
Script to find all foreign key references to user 1002 and delete them
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def find_and_delete_refs():
    """Find and delete all references to user 1002"""
    print("[FIND REFS] Finding references to user 1002...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    user_id = 1002
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Find all tables that might reference this user
            print("\n1. Checking business_bank_connections...")
            result = conn.execute(text('SELECT COUNT(*) FROM business_bank_connections WHERE user_id = :user_id'), {'user_id': user_id})
            count = result.scalar() or 0
            print(f"   Found {count} business_bank_connections")
            if count > 0:
                conn.execute(text('DELETE FROM business_bank_connections WHERE user_id = :user_id'), {'user_id': user_id})
                conn.commit()
                print(f"   [OK] Deleted {count} business_bank_connections")
            
            # Try other possible table names
            tables_to_check = [
                'bank_connections',
                'mx_connections',
                'plaid_connections',
                'user_bank_connections'
            ]
            
            for table_name in tables_to_check:
                try:
                    result = conn.execute(text(f'SELECT COUNT(*) FROM {table_name} WHERE user_id = :user_id'), {'user_id': user_id})
                    count = result.scalar() or 0
                    if count > 0:
                        print(f"   Found {count} records in {table_name}")
                        conn.execute(text(f'DELETE FROM {table_name} WHERE user_id = :user_id'), {'user_id': user_id})
                        conn.commit()
                        print(f"   [OK] Deleted from {table_name}")
                except Exception:
                    pass  # Table doesn't exist
            
            db_manager.release_connection(conn)
            
            # Get a fresh connection to delete the user
            print("\n2. Deleting user 1002...")
            fresh_conn = db_manager.get_connection()
            try:
                result = fresh_conn.execute(text('DELETE FROM users WHERE id = :user_id'), {'user_id': user_id})
                deleted = result.rowcount
                fresh_conn.commit()
                
                if deleted > 0:
                    print(f"   [OK] Deleted user 1002")
                else:
                    print(f"   [INFO] User 1002 not found")
                
                # Verify
                result = fresh_conn.execute(text('SELECT id FROM users WHERE id = :user_id'), {'user_id': user_id})
                if result.fetchone():
                    print(f"   [WARNING] User 1002 still exists!")
                else:
                    print(f"   [OK] User 1002 successfully deleted")
            finally:
                db_manager.release_connection(fresh_conn)
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM business_bank_connections WHERE user_id = ?', (user_id,))
            count = cursor.fetchone()[0] or 0
            if count > 0:
                cursor.execute('DELETE FROM business_bank_connections WHERE user_id = ?', (user_id,))
                conn.commit()
            
            cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
            conn.commit()
            conn.close()
        
    except Exception as e:
        import traceback
        print(f"[ERROR] {e}")
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == '__main__':
    find_and_delete_refs()

