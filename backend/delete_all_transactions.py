#!/usr/bin/env python3
"""
Script to delete ALL transactions from the database
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def delete_all_transactions():
    """Delete ALL transactions from the database"""
    print("[DELETE ALL] Starting transaction deletion...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            print("[DELETE ALL] Checking PostgreSQL database...")
            
            # First, show what we're about to delete
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            total = result.scalar() or 0
            print(f"   Found {total} transactions to delete")
            
            if total > 0:
                # Show breakdown by user
                result = conn.execute(text('''
                    SELECT u.id, u.email, u.account_type, COUNT(t.id) as tx_count
                    FROM transactions t
                    JOIN users u ON t.user_id = u.id
                    GROUP BY u.id, u.email, u.account_type
                    ORDER BY tx_count DESC
                '''))
                print("\n   Transactions by user:")
                for row in result:
                    print(f"   - User ID {row[0]} ({row[1]}, {row[2]}): {row[3]} transactions")
            
            # Delete ALL transactions
            print("\n[DELETE ALL] Deleting ALL transactions...")
            result = conn.execute(text('DELETE FROM transactions'))
            deleted_count = result.rowcount
            conn.commit()
            
            # Verify deletion
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            remaining = result.scalar() or 0
            
            print(f"[DELETE ALL] Deleted {deleted_count} transactions")
            print(f"[DELETE ALL] Remaining transactions: {remaining}")
            
            if remaining > 0:
                print(f"[WARNING] {remaining} transactions still remain!")
            else:
                print("[DELETE ALL] All transactions successfully deleted!")
            
            db_manager.release_connection(conn)
        else:
            # SQLite version
            print("[DELETE ALL] Checking SQLite database...")
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) FROM transactions')
            total = cursor.fetchone()[0] or 0
            print(f"   Found {total} transactions to delete")
            
            if total > 0:
                cursor.execute('''
                    SELECT u.id, u.email, u.account_type, COUNT(t.id) as tx_count
                    FROM transactions t
                    JOIN users u ON t.user_id = u.id
                    GROUP BY u.id, u.email, u.account_type
                    ORDER BY tx_count DESC
                ''')
                print("\n   Transactions by user:")
                for row in cursor.fetchall():
                    print(f"   - User ID {row[0]} ({row[1]}, {row[2]}): {row[3]} transactions")
            
            print("\n[DELETE ALL] Deleting ALL transactions...")
            cursor.execute('DELETE FROM transactions')
            deleted_count = cursor.rowcount
            conn.commit()
            
            cursor.execute('SELECT COUNT(*) FROM transactions')
            remaining = cursor.fetchone()[0] or 0
            
            print(f"[DELETE ALL] Deleted {deleted_count} transactions")
            print(f"[DELETE ALL] Remaining transactions: {remaining}")
            
            if remaining > 0:
                print(f"[WARNING] {remaining} transactions still remain!")
            else:
                print("[DELETE ALL] All transactions successfully deleted!")
            
            conn.close()
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Error deleting transactions: {e}")
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        sys.exit(1)

if __name__ == '__main__':
    delete_all_transactions()


