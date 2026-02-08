#!/usr/bin/env python3
"""Check transactions table"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager

def check_transactions():
    """Check transactions table structure and data"""
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Get table structure
            result = conn.execute(text('''
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'transactions'
                ORDER BY ordinal_position
            '''))
            columns = result.fetchall()
            print("Transactions table columns:")
            for col in columns:
                print(f"  {col[0]}: {col[1]}")
            
            # Count all transactions
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            total = result.scalar() or 0
            print(f"\nTotal transactions in database: {total}")
            
            # Get sample transactions
            result = conn.execute(text('''
                SELECT id, user_id, merchant, status, created_at
                FROM transactions
                ORDER BY created_at DESC
                LIMIT 10
            '''))
            transactions = result.fetchall()
            
            print(f"\nSample transactions (last 10):")
            for tx in transactions:
                print(f"  ID: {tx[0]}, User ID: {tx[1]} (type: {type(tx[1])}), Merchant: {tx[2]}, Status: {tx[3]}, Created: {tx[4]}")
            
            # Check for user_id 108 with different types
            result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = 108'))
            count_int = result.scalar() or 0
            print(f"\nTransactions with user_id = 108 (integer): {count_int}")
            
            result = conn.execute(text("SELECT COUNT(*) FROM transactions WHERE user_id = '108'"))
            count_str = result.scalar() or 0
            print(f"Transactions with user_id = '108' (string): {count_str}")
            
            result = conn.execute(text("SELECT COUNT(*) FROM transactions WHERE CAST(user_id AS TEXT) = '108'"))
            count_cast = result.scalar() or 0
            print(f"Transactions with user_id cast to text = '108': {count_cast}")
            
            # Get all unique user_ids
            result = conn.execute(text('SELECT DISTINCT user_id FROM transactions ORDER BY user_id LIMIT 20'))
            user_ids = result.fetchall()
            print(f"\nUnique user_ids in transactions (first 20):")
            for uid in user_ids:
                result2 = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': uid[0]})
                count = result2.scalar() or 0
                print(f"  User ID {uid[0]} (type: {type(uid[0])}): {count} transactions")
        else:
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(transactions)")
            columns = cursor.fetchall()
            print("Transactions table columns:")
            for col in columns:
                print(f"  {col[1]}: {col[2]}")
            
            cursor.execute("SELECT COUNT(*) FROM transactions")
            total = cursor.fetchone()[0] or 0
            print(f"\nTotal transactions: {total}")
            
            cursor.execute("SELECT id, user_id, merchant, status, created_at FROM transactions ORDER BY created_at DESC LIMIT 10")
            transactions = cursor.fetchall()
            print(f"\nSample transactions:")
            for tx in transactions:
                print(f"  ID: {tx[0]}, User ID: {tx[1]}, Merchant: {tx[2]}, Status: {tx[3]}, Created: {tx[4]}")
            
            cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = 108")
            count = cursor.fetchone()[0] or 0
            print(f"\nTransactions with user_id = 108: {count}")
            
            cursor.execute("SELECT DISTINCT user_id FROM transactions LIMIT 20")
            user_ids = cursor.fetchall()
            print(f"\nUnique user_ids:")
            for uid in user_ids:
                cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (uid[0],))
                count = cursor.fetchone()[0] or 0
                print(f"  User ID {uid[0]}: {count} transactions")
        
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        print(traceback.format_exc())
    finally:
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == "__main__":
    check_transactions()

