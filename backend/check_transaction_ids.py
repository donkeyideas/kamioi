#!/usr/bin/env python3
"""Check which user_id these transaction IDs belong to"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager

def check_transaction_ids():
    """Check transaction IDs from the logs"""
    # Transaction IDs from the console logs
    transaction_ids = [519, 518, 521, 520, 523, 522, 494, 493, 525, 527, 526, 498, 529, 531, 502, 533, 532, 504, 535, 537, 508, 538, 509, 540]
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Check these specific transaction IDs
            placeholders = ','.join([str(tid) for tid in transaction_ids])
            result = conn.execute(text(f'''
                SELECT id, user_id, merchant, status, date, created_at
                FROM transactions
                WHERE id IN ({placeholders})
                ORDER BY id
            '''))
            transactions = result.fetchall()
            
            print(f"\n[TRANSACTIONS] Found {len(transactions)} transactions with those IDs:")
            user_ids = set()
            for tx in transactions:
                print(f"   ID: {tx[0]}, User ID: {tx[1]}, Merchant: {tx[2]}, Status: {tx[3]}")
                user_ids.add(tx[1])
            
            print(f"\n[USER IDs] These transactions belong to user_ids: {sorted(user_ids)}")
            
            # Check if any belong to user 108
            result = conn.execute(text(f'''
                SELECT COUNT(*) FROM transactions
                WHERE id IN ({placeholders}) AND user_id = 108
            '''))
            count_108 = result.scalar() or 0
            print(f"[USER 108] Transactions with these IDs: {count_108}")
            
            # Get ALL transactions for user 108
            result = conn.execute(text('''
                SELECT id, user_id, merchant, status, date
                FROM transactions
                WHERE user_id = 108
                ORDER BY id DESC
                LIMIT 100
            '''))
            all_108 = result.fetchall()
            print(f"\n[USER 108] All transactions for user 108: {len(all_108)}")
            for tx in all_108[:20]:
                print(f"   ID: {tx[0]}, Merchant: {tx[2]}, Status: {tx[3]}")
            
            # Check what get_user_transactions actually returns
            print(f"\n[TEST] Testing get_user_transactions(108)...")
            transactions = db_manager.get_user_transactions(108, limit=1000, offset=0)
            print(f"[TEST] get_user_transactions returned: {len(transactions)} transactions")
            if transactions:
                print(f"[TEST] First transaction: ID={transactions[0].get('id')}, User ID={transactions[0].get('user_id')}, Merchant={transactions[0].get('merchant')}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            placeholders = ','.join(['?' for _ in transaction_ids])
            cursor.execute(f'''
                SELECT id, user_id, merchant, status, date, created_at
                FROM transactions
                WHERE id IN ({placeholders})
                ORDER BY id
            ''', transaction_ids)
            transactions = cursor.fetchall()
            
            print(f"\n[TRANSACTIONS] Found {len(transactions)} transactions:")
            user_ids = set()
            for tx in transactions:
                print(f"   ID: {tx[0]}, User ID: {tx[1]}, Merchant: {tx[2]}, Status: {tx[3]}")
                user_ids.add(tx[1])
            
            print(f"\n[USER IDs] These transactions belong to: {sorted(user_ids)}")
            
            cursor.execute(f'''
                SELECT COUNT(*) FROM transactions
                WHERE id IN ({placeholders}) AND user_id = 108
            ''', transaction_ids)
            count_108 = cursor.fetchone()[0] or 0
            print(f"[USER 108] Transactions: {count_108}")
            
            cursor.execute('''
                SELECT id, user_id, merchant, status, date
                FROM transactions
                WHERE user_id = 108
                ORDER BY id DESC
                LIMIT 100
            ''')
            all_108 = cursor.fetchall()
            print(f"\n[USER 108] All transactions: {len(all_108)}")
            
            transactions = db_manager.get_user_transactions(108, limit=1000, offset=0)
            print(f"\n[TEST] get_user_transactions returned: {len(transactions)} transactions")
            
            conn.close()
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == "__main__":
    check_transaction_ids()

