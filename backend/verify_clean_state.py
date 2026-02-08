#!/usr/bin/env python3
"""
Script to verify the database is clean - 0 transactions, no demo users
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def verify_clean():
    """Verify database is clean"""
    print("[VERIFY] Verifying clean database state...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Check transactions
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            tx_count = result.scalar() or 0
            print(f"\n1. Total Transactions: {tx_count}")
            
            # Check demo users
            print("\n2. Checking for demo users...")
            demo_user_ids = [1000, 1001, 1002]
            demo_found = []
            for user_id in demo_user_ids:
                result = conn.execute(text('SELECT id, email FROM users WHERE id = :user_id'), {'user_id': user_id})
                row = result.fetchone()
                if row:
                    demo_found.append(f"User {row[0]} ({row[1]})")
            
            if demo_found:
                print(f"   [WARNING] Found demo users: {', '.join(demo_found)}")
            else:
                print("   [OK] No demo users found")
            
            # Check total users
            result = conn.execute(text('SELECT COUNT(*) FROM users'))
            user_count = result.scalar() or 0
            print(f"\n3. Total Users: {user_count}")
            
            # Summary
            print("\n4. Summary:")
            if tx_count == 0 and not demo_found:
                print("   [OK] Database is clean!")
                print("   - 0 transactions")
                print("   - No demo users")
            else:
                print("   [WARNING] Database not fully clean:")
                if tx_count > 0:
                    print(f"   - {tx_count} transactions still exist")
                if demo_found:
                    print(f"   - Demo users still exist: {', '.join(demo_found)}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions')
            tx_count = cursor.fetchone()[0] or 0
            print(f"\n1. Total Transactions: {tx_count}")
            
            demo_user_ids = [1000, 1001, 1002]
            demo_found = []
            for user_id in demo_user_ids:
                cursor.execute('SELECT id, email FROM users WHERE id = ?', (user_id,))
                row = cursor.fetchone()
                if row:
                    demo_found.append(f"User {row[0]} ({row[1]})")
            
            if demo_found:
                print(f"   [WARNING] Found demo users: {', '.join(demo_found)}")
            else:
                print("   [OK] No demo users found")
            
            cursor.execute('SELECT COUNT(*) FROM users')
            user_count = cursor.fetchone()[0] or 0
            print(f"\n3. Total Users: {user_count}")
            
            print("\n4. Summary:")
            if tx_count == 0 and not demo_found:
                print("   [OK] Database is clean!")
            else:
                print("   [WARNING] Database not fully clean")
            
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
    verify_clean()


