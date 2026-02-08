#!/usr/bin/env python3
"""Delete all transactions for user 108"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager

def delete_transactions():
    """Delete all transactions for user 108"""
    print("=" * 60)
    print("DELETE TRANSACTIONS FOR USER 108")
    print("=" * 60)
    
    user_id = 108
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Count transactions before deletion
            result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            count_before = result.scalar() or 0
            print(f"\n[INFO] Transactions found for user {user_id}: {count_before}")
            
            if count_before == 0:
                print("[INFO] No transactions to delete.")
                db_manager.release_connection(conn)
                return True
            
            # Show sample transactions
            result = conn.execute(text('''
                SELECT id, merchant, amount, status, date, created_at
                FROM transactions
                WHERE user_id = :uid
                ORDER BY created_at DESC
                LIMIT 10
            '''), {'uid': user_id})
            samples = result.fetchall()
            
            print(f"\n[INFO] Sample transactions (first 10):")
            for tx in samples:
                print(f"   ID: {tx[0]}, Merchant: {tx[1]}, Amount: {tx[2]}, Status: {tx[3]}, Date: {tx[4]}, Created: {tx[5]}")
            
            # Confirm deletion
            print(f"\n[WARNING] About to delete {count_before} transactions for user {user_id}")
            response = input("Type 'DELETE' to confirm: ")
            
            if response != 'DELETE':
                print("[CANCELLED] Deletion cancelled.")
                db_manager.release_connection(conn)
                return False
            
            # Delete transactions
            print(f"\n[DELETING] Deleting transactions...")
            result = conn.execute(text('DELETE FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            deleted_count = result.rowcount
            conn.commit()
            
            print(f"[SUCCESS] Deleted {deleted_count} transactions!")
            
            # Verify deletion
            result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            count_after = result.scalar() or 0
            
            print(f"[INFO] Remaining transactions: {count_after}")
            
            if count_after == 0:
                print("[SUCCESS] All transactions deleted successfully!")
            else:
                print(f"[WARNING] {count_after} transactions still remain.")
            
            db_manager.release_connection(conn)
            return True
            
        else:
            # SQLite version
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
            count_before = cursor.fetchone()[0] or 0
            print(f"\n[INFO] Transactions found: {count_before}")
            
            if count_before == 0:
                print("[INFO] No transactions to delete.")
                conn.close()
                return True
            
            # Show samples
            cursor.execute('''
                SELECT id, merchant, amount, status, date, created_at
                FROM transactions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            ''', (user_id,))
            samples = cursor.fetchall()
            
            print(f"\n[INFO] Sample transactions:")
            for tx in samples:
                print(f"   ID: {tx[0]}, Merchant: {tx[1]}, Amount: {tx[2]}, Status: {tx[3]}, Date: {tx[4]}, Created: {tx[5]}")
            
            print(f"\n[WARNING] About to delete {count_before} transactions")
            response = input("Type 'DELETE' to confirm: ")
            
            if response != 'DELETE':
                print("[CANCELLED]")
                conn.close()
                return False
            
            cursor.execute('DELETE FROM transactions WHERE user_id = ?', (user_id,))
            deleted_count = cursor.rowcount
            conn.commit()
            
            print(f"[SUCCESS] Deleted {deleted_count} transactions!")
            
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
            count_after = cursor.fetchone()[0] or 0
            print(f"[INFO] Remaining: {count_after}")
            
            conn.close()
            return True
            
    except Exception as e:
        import traceback
        print(f"\n[ERROR] Error: {e}")
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            conn.rollback()
            db_manager.release_connection(conn)
        else:
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    success = delete_transactions()
    sys.exit(0 if success else 1)

