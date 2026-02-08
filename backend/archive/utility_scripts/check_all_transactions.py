#!/usr/bin/env python3
"""
Check ALL transactions including user_id = 2
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def check_all_transactions():
    """Check all transactions"""
    print("[CHECK ALL] Checking all transactions...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Total count (same as stats endpoint)
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            total = result.scalar() or 0
            print(f"\n1. Total transactions (all): {total}")
            
            if total > 0:
                # Get all transactions
                result = conn.execute(text('''
                    SELECT t.id, t.user_id, t.merchant, t.amount, t.date,
                           u.id as user_exists, u.email, u.account_type
                    FROM transactions t
                    LEFT JOIN users u ON t.user_id = u.id
                    ORDER BY t.id
                '''))
                
                print("\n2. All transactions:")
                for row in result:
                    txn_id, user_id, merchant, amount, date, user_exists, email, account_type = row
                    print(f"\n   Transaction ID: {txn_id}")
                    print(f"   - User ID: {user_id}")
                    if user_exists:
                        print(f"   - User email: {email}")
                        print(f"   - Account type: {account_type or 'NULL'}")
                    else:
                        print(f"   - [ORPHANED] User does not exist")
                    print(f"   - Merchant: {merchant}")
                    print(f"   - Amount: ${amount}")
                    print(f"   - Date: {date}")
            
            # Check round_up_allocations
            print("\n3. Checking round_up_allocations table...")
            try:
                result = conn.execute(text('SELECT COUNT(*) FROM round_up_allocations'))
                total_roundups = result.scalar() or 0
                print(f"   Total round_up_allocations: {total_roundups}")
                
                if total_roundups > 0:
                    result = conn.execute(text('''
                        SELECT ra.id, ra.transaction_id
                        FROM round_up_allocations ra
                        ORDER BY ra.id
                    '''))
                    print(f"   Round-up allocations:")
                    for row in result:
                        print(f"   - ID: {row[0]}, Transaction ID: {row[1]}")
            except Exception as e:
                print(f"   Table doesn't exist: {e}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions')
            total = cursor.fetchone()[0] or 0
            print(f"Total transactions: {total}")
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
    check_all_transactions()
