#!/usr/bin/env python3
"""
Script to find ANY transactions in the database, including orphaned ones
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def find_any_transactions():
    """Find ANY transactions in the database"""
    print("[FIND ANY] Searching for ALL transactions...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Count all transactions
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            total = result.scalar() or 0
            print(f"\n1. Total transactions in database: {total}")
            
            if total > 0:
                # Get all transactions with details
                print("\n2. Transaction details:")
                result = conn.execute(text('''
                    SELECT t.id, t.user_id, t.merchant, t.amount, t.date, t.status,
                           u.id as user_exists, u.email, u.account_type
                    FROM transactions t
                    LEFT JOIN users u ON t.user_id = u.id
                    ORDER BY t.id
                '''))
                
                for row in result:
                    txn_id, user_id, merchant, amount, date, status, user_exists, email, account_type = row
                    print(f"\n   Transaction ID: {txn_id}")
                    print(f"   - User ID: {user_id}")
                    print(f"   - User exists: {user_exists is not None}")
                    if user_exists:
                        print(f"   - User email: {email}")
                        print(f"   - Account type: {account_type}")
                    else:
                        print(f"   - [ORPHANED] User does not exist!")
                    print(f"   - Merchant: {merchant}")
                    print(f"   - Amount: ${amount}")
                    print(f"   - Date: {date}")
                    print(f"   - Status: {status}")
            else:
                print("\n   [OK] No transactions found in database")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions')
            total = cursor.fetchone()[0] or 0
            print(f"\n1. Total transactions: {total}")
            
            if total > 0:
                cursor.execute('''
                    SELECT t.id, t.user_id, t.merchant, t.amount, t.date, t.status,
                           u.id, u.email, u.account_type
                    FROM transactions t
                    LEFT JOIN users u ON t.user_id = u.id
                    ORDER BY t.id
                ''')
                
                for row in cursor.fetchall():
                    txn_id, user_id, merchant, amount, date, status, user_exists, email, account_type = row
                    print(f"\n   Transaction ID: {txn_id}")
                    print(f"   - User ID: {user_id}")
                    print(f"   - User exists: {user_exists is not None}")
                    if user_exists:
                        print(f"   - User email: {email}")
                        print(f"   - Account type: {account_type}")
                    print(f"   - Merchant: {merchant}")
                    print(f"   - Amount: ${amount}")
                    print(f"   - Date: {date}")
                    print(f"   - Status: {status}")
            
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
    find_any_transactions()


