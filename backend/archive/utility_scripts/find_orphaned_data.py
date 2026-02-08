#!/usr/bin/env python3
"""
Find orphaned transactions and round-up allocations
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def find_orphaned_data():
    """Find orphaned transactions and round-up allocations"""
    print("[FIND ORPHANED] Searching for orphaned data...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Find transactions that don't match any account type
            print("\n1. Finding orphaned transactions...")
            result = conn.execute(text('''
                SELECT t.id, t.user_id, t.merchant, t.amount, t.date,
                       u.id as user_exists, u.account_type
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE u.id IS NULL 
                   OR u.account_type IS NULL
                   OR u.account_type NOT IN ('individual', 'family', 'business', 'admin')
            '''))
            
            orphaned_txns = result.fetchall()
            if orphaned_txns:
                print(f"   Found {len(orphaned_txns)} orphaned transaction(s):")
                for row in orphaned_txns:
                    txn_id, user_id, merchant, amount, date, user_exists, account_type = row
                    print(f"   - Transaction ID: {txn_id}, User ID: {user_id}")
                    if user_exists:
                        print(f"     Account type: {account_type or 'NULL'}")
                    else:
                        print(f"     [ORPHANED] User does not exist")
                    print(f"     Merchant: {merchant}, Amount: ${amount}, Date: {date}")
            else:
                print("   No orphaned transactions found")
            
            # Find round-up allocations that don't match any account type
            print("\n2. Finding orphaned round-up allocations...")
            try:
                result = conn.execute(text('''
                    SELECT ra.id, ra.transaction_id, t.user_id,
                           u.id as user_exists, u.account_type
                    FROM round_up_allocations ra
                    LEFT JOIN transactions t ON ra.transaction_id = t.id
                    LEFT JOIN users u ON t.user_id = u.id
                    WHERE t.id IS NULL
                       OR u.id IS NULL
                       OR u.account_type IS NULL
                       OR u.account_type NOT IN ('individual', 'family', 'business', 'admin')
                '''))
                
                orphaned_roundups = result.fetchall()
                if orphaned_roundups:
                    print(f"   Found {len(orphaned_roundups)} orphaned round-up allocation(s):")
                    for row in orphaned_roundups:
                        ra_id, tx_id, user_id, user_exists, account_type = row
                        print(f"   - Round-up ID: {ra_id}, Transaction ID: {tx_id}, User ID: {user_id}")
                        if user_exists:
                            print(f"     Account type: {account_type or 'NULL'}")
                        else:
                            print(f"     [ORPHANED] User or transaction does not exist")
                else:
                    print("   No orphaned round-up allocations found")
            except Exception as e:
                print(f"   Table doesn't exist or error: {e}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT t.id, t.user_id, t.merchant, t.amount, t.date,
                       u.id, u.account_type
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE u.id IS NULL 
                   OR u.account_type IS NULL
                   OR u.account_type NOT IN ('individual', 'family', 'business', 'admin')
            ''')
            
            orphaned_txns = cursor.fetchall()
            if orphaned_txns:
                print(f"Found {len(orphaned_txns)} orphaned transactions")
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
    find_orphaned_data()


