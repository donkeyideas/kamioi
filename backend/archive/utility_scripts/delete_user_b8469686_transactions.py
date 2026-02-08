#!/usr/bin/env python3
"""
Delete all transactions for user with account_number B8469686
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import DatabaseManager

def delete_transactions_for_user():
    db_manager = DatabaseManager()
    conn = db_manager.get_connection()
    
    try:
        # First, find the user_id for account_number B8469686
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('SELECT id, email, name, account_number FROM users WHERE account_number = :acc'), {'acc': 'B8469686'})
            user_row = result.fetchone()
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT id, email, name, account_number FROM users WHERE account_number = ?', ('B8469686',))
            user_row = cursor.fetchone()
        
        if not user_row:
            print(f"ERROR: User with account_number 'B8469686' not found!")
            return
        
        user_id = user_row[0]
        email = user_row[1]
        name = user_row[2]
        account_number = user_row[3] if len(user_row) > 3 else 'N/A'
        
        print(f"Found user: ID={user_id}, Email={email}, Name={name}, Account={account_number}")
        
        # Count transactions before deletion
        if db_manager._use_postgresql:
            from sqlalchemy import text
            count_result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            transaction_count = count_result.scalar() or 0
        else:
            cursor_count = conn.cursor()
            cursor_count.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
            transaction_count = cursor_count.fetchone()[0] or 0
            cursor_count.close()
        
        print(f"Found {transaction_count} transactions for user {user_id} (B8469686)")
        
        if transaction_count == 0:
            print("No transactions to delete.")
            return
        
        # Delete all transactions for this user
        print(f"Deleting {transaction_count} transactions...")
        
        if db_manager._use_postgresql:
            from sqlalchemy import text
            delete_result = conn.execute(text('DELETE FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            deleted_count = delete_result.rowcount
        else:
            cursor_delete = conn.cursor()
            cursor_delete.execute('DELETE FROM transactions WHERE user_id = ?', (user_id,))
            deleted_count = cursor_delete.rowcount
            cursor_delete.close()
        
        # Commit the deletion
        conn.commit()
        print(f"SUCCESS: Deleted {deleted_count} transactions for user {user_id} (B8469686)")
        
        # Verify deletion
        if db_manager._use_postgresql:
            from sqlalchemy import text
            verify_result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            remaining_count = verify_result.scalar() or 0
        else:
            cursor_verify = conn.cursor()
            cursor_verify.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
            remaining_count = cursor_verify.fetchone()[0] or 0
            cursor_verify.close()
        
        if remaining_count == 0:
            print(f"VERIFICATION: All transactions deleted. Remaining count: {remaining_count}")
        else:
            print(f"WARNING: Some transactions may still exist. Remaining count: {remaining_count}")
        
    except Exception as e:
        import traceback
        print(f"ERROR: Failed to delete transactions: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        conn.rollback()
    finally:
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == '__main__':
    print("=" * 60)
    print("Delete Transactions for User B8469686")
    print("=" * 60)
    delete_transactions_for_user()
    print("=" * 60)

