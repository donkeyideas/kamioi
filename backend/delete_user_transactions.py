#!/usr/bin/env python3
"""Delete all transactions for a specific user by account_number or user_id"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager

def delete_user_transactions(account_number=None, user_id=None):
    """Delete all transactions for a user by account_number or user_id"""
    print("=" * 60)
    if account_number:
        print(f"Deleting Transactions for Account: {account_number}")
    elif user_id:
        print(f"Deleting Transactions for User ID: {user_id}")
    print("=" * 60)
    
    conn = db_manager.get_connection()
    
    try:
        # First, find the user_id
        if account_number:
            if db_manager._use_postgresql:
                from sqlalchemy import text
                result = conn.execute(text('''
                    SELECT id, email, name, account_type, account_number
                    FROM users
                    WHERE account_number = :account_number
                '''), {'account_number': account_number})
                user_row = result.fetchone()
            else:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, email, name, account_type, account_number
                    FROM users
                    WHERE account_number = ?
                ''', (account_number,))
                user_row = cursor.fetchone()
        elif user_id:
            if db_manager._use_postgresql:
                from sqlalchemy import text
                result = conn.execute(text('''
                    SELECT id, email, name, account_type, account_number
                    FROM users
                    WHERE id = :user_id
                '''), {'user_id': user_id})
                user_row = result.fetchone()
            else:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, email, name, account_type, account_number
                    FROM users
                    WHERE id = ?
                ''', (user_id,))
                user_row = cursor.fetchone()
        else:
            print("[ERROR] Must provide either account_number or user_id")
            return False
        
        if not user_row:
            print(f"[ERROR] User not found!")
            return False
        
        user_id = user_row[0]
        email = user_row[1] if len(user_row) > 1 else 'N/A'
        name = user_row[2] if len(user_row) > 2 else 'N/A'
        account_type = user_row[3] if len(user_row) > 3 else 'N/A'
        account_num = user_row[4] if len(user_row) > 4 else 'N/A'
        
        print(f"\n[SUCCESS] Found user:")
        print(f"   User ID: {user_id}")
        print(f"   Email: {email}")
        print(f"   Name: {name}")
        print(f"   Account Type: {account_type}")
        print(f"   Account Number: {account_num}")
        
        # Count transactions before deletion
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('''
                SELECT COUNT(*) FROM transactions WHERE user_id = :user_id
            '''), {'user_id': user_id})
            count_before = result.scalar() or 0
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
            count_before = cursor.fetchone()[0] or 0
        
        print(f"\n[INFO] Transactions to delete: {count_before}")
        
        if count_before == 0:
            print("[SUCCESS] No transactions found. Nothing to delete.")
            return True
        
        # Confirm deletion
        print(f"\n[WARNING] This will delete {count_before} transactions for user {user_id}")
        response = input("Type 'DELETE' to confirm: ")
        
        if response != 'DELETE':
            print("[CANCELLED] Deletion cancelled.")
            return False
        
        # Delete transactions
        print(f"\n[DELETING] Deleting transactions...")
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('''
                DELETE FROM transactions WHERE user_id = :user_id
            '''), {'user_id': user_id})
            deleted_count = result.rowcount
            conn.commit()
        else:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM transactions WHERE user_id = ?', (user_id,))
            deleted_count = cursor.rowcount
            conn.commit()
        
        print(f"[SUCCESS] Successfully deleted {deleted_count} transactions!")
        
        # Verify deletion
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('''
                SELECT COUNT(*) FROM transactions WHERE user_id = :user_id
            '''), {'user_id': user_id})
            count_after = result.scalar() or 0
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
            count_after = cursor.fetchone()[0] or 0
        
        print(f"[INFO] Remaining transactions: {count_after}")
        
        if count_after == 0:
            print("[SUCCESS] All transactions deleted successfully!")
        else:
            print(f"[WARNING] {count_after} transactions still remain.")
        
        return True
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Error deleting transactions: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        if db_manager._use_postgresql:
            conn.rollback()
        else:
            conn.rollback()
        return False
    finally:
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == "__main__":
    # Try account_number first, then fall back to user_id 108 (from logs)
    account_number = "B8469686"
    user_id = 108  # From the logs, we know this is the user_id
    
    # Try by account_number first
    success = delete_user_transactions(account_number=account_number)
    
    # If that fails, try by user_id
    if not success:
        print("\nTrying by user_id instead...")
        success = delete_user_transactions(user_id=user_id)
    
    sys.exit(0 if success else 1)
