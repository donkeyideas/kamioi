#!/usr/bin/env python3
"""
Script to remove all demo dashboard data from the database
- Drops demo_codes and demo_sessions tables
- Deletes demo users (IDs 1000, 1001, 1002) and all their data
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def remove_demo_data():
    """Remove all demo-related data from the database"""
    print("[REMOVE DEMO] Starting demo data removal...")
    
    # Ensure database manager is initialized
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        demo_user_ids = [1000, 1001, 1002]
        
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            print("[REMOVE DEMO] Removing demo data from PostgreSQL...")
            
            # Delete demo user data
            for user_id in demo_user_ids:
                print(f"  [REMOVE DEMO] Deleting data for demo user {user_id}...")
                try:
                    # Delete transactions
                    conn.execute(text('DELETE FROM transactions WHERE user_id = :user_id'), {'user_id': user_id})
                    
                    # Delete portfolios
                    conn.execute(text('DELETE FROM portfolios WHERE user_id = :user_id'), {'user_id': user_id})
                    
                    # Delete goals
                    conn.execute(text('DELETE FROM goals WHERE user_id = :user_id'), {'user_id': user_id})
                    
                    # Delete notifications
                    conn.execute(text('DELETE FROM notifications WHERE user_id = :user_id'), {'user_id': user_id})
                    
                    # Delete any other user-related data (if table exists)
                    try:
                        conn.execute(text('DELETE FROM round_up_allocations WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = :user_id)'), {'user_id': user_id})
                    except Exception:
                        pass  # Table might not exist
                    
                    # Delete the user
                    conn.execute(text('DELETE FROM users WHERE id = :user_id'), {'user_id': user_id})
                    
                    # Commit after each user
                    conn.commit()
                    print(f"    [OK] Deleted demo user {user_id} and all data")
                except Exception as e:
                    print(f"    [WARNING] Error deleting data for user {user_id}: {e}")
                    conn.rollback()
                    continue
            
            # Drop demo tables
            print("  [REMOVE DEMO] Dropping demo tables...")
            try:
                conn.execute(text('DROP TABLE IF EXISTS demo_sessions CASCADE'))
                print("    [OK] Dropped demo_sessions table")
            except Exception as e:
                print(f"    [WARNING] Error dropping demo_sessions: {e}")
            
            try:
                conn.execute(text('DROP TABLE IF EXISTS demo_codes CASCADE'))
                print("    [OK] Dropped demo_codes table")
            except Exception as e:
                print(f"    [WARNING] Error dropping demo_codes: {e}")
            
            conn.commit()
            db_manager.release_connection(conn)
        else:
            # SQLite
            print("[REMOVE DEMO] Removing demo data from SQLite...")
            cursor = conn.cursor()
            
            # Delete demo user data
            for user_id in demo_user_ids:
                print(f"  [REMOVE DEMO] Deleting data for demo user {user_id}...")
                
                # Delete transactions
                cursor.execute('DELETE FROM transactions WHERE user_id = ?', (user_id,))
                
                # Delete portfolios
                cursor.execute('DELETE FROM portfolios WHERE user_id = ?', (user_id,))
                
                # Delete goals
                cursor.execute('DELETE FROM goals WHERE user_id = ?', (user_id,))
                
                # Delete notifications
                cursor.execute('DELETE FROM notifications WHERE user_id = ?', (user_id,))
                
                # Delete round_up_allocations for demo user transactions (if table exists)
                try:
                    cursor.execute('''
                        DELETE FROM round_up_allocations 
                        WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = ?)
                    ''', (user_id,))
                except Exception:
                    pass  # Table might not exist
            
            # Delete demo users
            print("  [REMOVE DEMO] Deleting demo users...")
            for user_id in demo_user_ids:
                cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
            
            # Drop demo tables
            print("  [REMOVE DEMO] Dropping demo tables...")
            try:
                cursor.execute('DROP TABLE IF EXISTS demo_sessions')
                print("    [OK] Dropped demo_sessions table")
            except Exception as e:
                print(f"    [WARNING] Error dropping demo_sessions: {e}")
            
            try:
                cursor.execute('DROP TABLE IF EXISTS demo_codes')
                print("    [OK] Dropped demo_codes table")
            except Exception as e:
                print(f"    [WARNING] Error dropping demo_codes: {e}")
            
            conn.commit()
            conn.close()
        
        print("[REMOVE DEMO] Demo data removal complete!")
        print("   - Demo users deleted (IDs: 1000, 1001, 1002)")
        print("   - Demo tables dropped (demo_codes, demo_sessions)")
        print("   - All demo-related data removed")
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Error removing demo data: {e}")
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        sys.exit(1)

if __name__ == '__main__':
    remove_demo_data()

