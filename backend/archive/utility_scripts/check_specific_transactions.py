#!/usr/bin/env python3
"""
Check if the specific transaction IDs returned by API actually exist
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import DatabaseManager

db_manager = DatabaseManager()
conn = db_manager.get_connection()

# Transaction IDs that API is returning
transaction_ids = [606, 605, 577, 576, 548]

print("=" * 60)
print("CHECKING IF SPECIFIC TRANSACTION IDs EXIST")
print("=" * 60)

try:
    if db_manager._use_postgresql:
        from sqlalchemy import text
        
        for tx_id in transaction_ids:
            result = conn.execute(text('SELECT id, user_id, merchant, date FROM transactions WHERE id = :tx_id'), {'tx_id': tx_id})
            row = result.fetchone()
            if row:
                print(f"Transaction {tx_id}: EXISTS - User: {row[1]}, Merchant: {row[2]}, Date: {row[3]}")
            else:
                print(f"Transaction {tx_id}: DOES NOT EXIST")
        
        # Check ALL transactions
        print("\n--- ALL transactions in database ---")
        all_result = conn.execute(text('SELECT id, user_id, merchant FROM transactions ORDER BY id DESC LIMIT 20'))
        all_rows = all_result.fetchall()
        if all_rows:
            print(f"Found {len(all_rows)} transactions (showing first 20):")
            for row in all_rows:
                print(f"  ID: {row[0]}, User: {row[1]}, Merchant: {row[2]}")
        else:
            print("NO TRANSACTIONS FOUND IN DATABASE")
        
        db_manager.release_connection(conn)
    else:
        cursor = conn.cursor()
        for tx_id in transaction_ids:
            cursor.execute('SELECT id, user_id, merchant, date FROM transactions WHERE id = ?', (tx_id,))
            row = cursor.fetchone()
            if row:
                print(f"Transaction {tx_id}: EXISTS - User: {row[1]}, Merchant: {row[2]}, Date: {row[3]}")
            else:
                print(f"Transaction {tx_id}: DOES NOT EXIST")
        
        cursor.close()
        conn.close()
        
except Exception as e:
    import traceback
    print(f"ERROR: {e}")
    traceback.print_exc()
    if db_manager._use_postgresql:
        db_manager.release_connection(conn)
    else:
        conn.close()

print("=" * 60)
print("IMPORTANT: If transactions exist, they need to be deleted.")
print("If they don't exist, the backend server needs to be RESTARTED.")
print("=" * 60)

