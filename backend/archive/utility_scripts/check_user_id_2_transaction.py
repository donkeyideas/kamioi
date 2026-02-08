#!/usr/bin/env python3
"""
Check if there's a transaction with user_id = 2
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def check_user_2():
    """Check for transactions with user_id = 2"""
    print("[CHECK USER 2] Checking for transactions with user_id = 2...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Check all transactions
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            total = result.scalar() or 0
            print(f"\n1. Total transactions (all): {total}")
            
            # Check transactions with user_id = 2
            result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = 2'))
            user_2_count = result.scalar() or 0
            print(f"2. Transactions with user_id = 2: {user_2_count}")
            
            if user_2_count > 0:
                result = conn.execute(text('''
                    SELECT id, user_id, merchant, amount, date, description
                    FROM transactions
                    WHERE user_id = 2
                '''))
                print("\n3. Transactions with user_id = 2:")
                for row in result:
                    print(f"   - Transaction ID: {row[0]}, User ID: {row[1]}, Merchant: {row[2]}, Amount: ${row[3]}, Date: {row[4]}")
            
            # Check transactions excluding user_id = 2
            result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id != 2'))
            excluding_2 = result.scalar() or 0
            print(f"\n4. Transactions excluding user_id = 2: {excluding_2}")
            
            # Check transactions with NULL user_id
            result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id IS NULL'))
            null_user = result.scalar() or 0
            print(f"5. Transactions with NULL user_id: {null_user}")
            
            if null_user > 0:
                result = conn.execute(text('SELECT id, user_id, merchant, amount, date FROM transactions WHERE user_id IS NULL'))
                print("\n6. Transactions with NULL user_id:")
                for row in result:
                    print(f"   - Transaction ID: {row[0]}, User ID: {row[1]}, Merchant: {row[2]}, Amount: ${row[3]}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions')
            total = cursor.fetchone()[0] or 0
            print(f"Total transactions: {total}")
            
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = 2')
            user_2_count = cursor.fetchone()[0] or 0
            print(f"Transactions with user_id = 2: {user_2_count}")
            
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
    check_user_2()


