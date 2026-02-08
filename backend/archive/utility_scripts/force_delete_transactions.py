#!/usr/bin/env python3
"""
Force delete ALL transactions for user 108 (B8469686) - Direct SQL
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import DatabaseManager

def force_delete():
    db_manager = DatabaseManager()
    conn = db_manager.get_connection()
    
    user_id = 108  # B8469686
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # First, check what we have
            result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            count_before = result.scalar() or 0
            print(f"Found {count_before} transactions for user_id={user_id}")
            
            if count_before > 0:
                # Get sample
                result = conn.execute(text('SELECT id, merchant, date FROM transactions WHERE user_id = :uid LIMIT 5'), {'uid': user_id})
                print("Sample transactions to delete:")
                for row in result:
                    print(f"  - ID: {row[0]}, Merchant: {row[1]}, Date: {row[2]}")
                
                # DELETE ALL
                print(f"\nDELETING ALL {count_before} transactions...")
                delete_result = conn.execute(text('DELETE FROM transactions WHERE user_id = :uid'), {'uid': user_id})
                deleted = delete_result.rowcount
                conn.commit()
                print(f"DELETED: {deleted} transactions")
                
                # Verify
                result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
                count_after = result.scalar() or 0
                print(f"VERIFICATION: {count_after} transactions remaining")
                
                if count_after == 0:
                    print("SUCCESS: All transactions deleted!")
                else:
                    print(f"WARNING: {count_after} transactions still exist!")
            else:
                print("No transactions found - database is already clean")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
            count_before = cursor.fetchone()[0] or 0
            print(f"Found {count_before} transactions for user_id={user_id}")
            
            if count_before > 0:
                cursor.execute('SELECT id, merchant, date FROM transactions WHERE user_id = ? LIMIT 5', (user_id,))
                print("Sample transactions to delete:")
                for row in cursor.fetchall():
                    print(f"  - ID: {row[0]}, Merchant: {row[1]}, Date: {row[2]}")
                
                print(f"\nDELETING ALL {count_before} transactions...")
                cursor.execute('DELETE FROM transactions WHERE user_id = ?', (user_id,))
                deleted = cursor.rowcount
                conn.commit()
                print(f"DELETED: {deleted} transactions")
                
                cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
                count_after = cursor.fetchone()[0] or 0
                print(f"VERIFICATION: {count_after} transactions remaining")
                
                if count_after == 0:
                    print("SUCCESS: All transactions deleted!")
                else:
                    print(f"WARNING: {count_after} transactions still exist!")
            
            cursor.close()
            conn.close()
            
    except Exception as e:
        import traceback
        print(f"ERROR: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        if db_manager._use_postgresql:
            conn.rollback()
            db_manager.release_connection(conn)
        else:
            conn.rollback()
            conn.close()

if __name__ == '__main__':
    print("=" * 60)
    print("FORCE DELETE ALL TRANSACTIONS FOR USER 108 (B8469686)")
    print("=" * 60)
    force_delete()
    print("=" * 60)
    print("\nIMPORTANT NEXT STEPS:")
    print("1. RESTART YOUR BACKEND SERVER")
    print("2. Clear browser localStorage (see instructions below)")
    print("3. Refresh the page")
    print("=" * 60)

