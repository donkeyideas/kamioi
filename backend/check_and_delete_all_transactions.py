#!/usr/bin/env python3
"""
Check and delete ALL transactions for user B8469686 from BOTH databases
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import DatabaseManager

def check_and_delete():
    db_manager = DatabaseManager()
    
    # Check PostgreSQL
    print("=" * 60)
    print("CHECKING POSTGRESQL DATABASE")
    print("=" * 60)
    
    try:
        conn = db_manager.get_connection()
        
        # Find user
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('SELECT id, email, name, account_number FROM users WHERE account_number = :acc'), {'acc': 'B8469686'})
            user_row = result.fetchone()
            
            if user_row:
                user_id = user_row[0]
                print(f"Found user in PostgreSQL: ID={user_id}, Email={user_row[1]}, Name={user_row[2]}")
                
                # Count transactions
                count_result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
                transaction_count = count_result.scalar() or 0
                print(f"PostgreSQL: Found {transaction_count} transactions for user {user_id}")
                
                if transaction_count > 0:
                    # Get transaction IDs
                    tx_result = conn.execute(text('SELECT id, merchant, date FROM transactions WHERE user_id = :uid LIMIT 10'), {'uid': user_id})
                    print("Sample transactions:")
                    for row in tx_result:
                        print(f"  - ID: {row[0]}, Merchant: {row[1]}, Date: {row[2]}")
                    
                    # Delete all transactions
                    print(f"\nDeleting {transaction_count} transactions from PostgreSQL...")
                    delete_result = conn.execute(text('DELETE FROM transactions WHERE user_id = :uid'), {'uid': user_id})
                    deleted_count = delete_result.rowcount
                    conn.commit()
                    print(f"SUCCESS: Deleted {deleted_count} transactions from PostgreSQL")
                    
                    # Verify
                    verify_result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
                    remaining = verify_result.scalar() or 0
                    print(f"Verification: {remaining} transactions remaining in PostgreSQL")
                else:
                    print("No transactions to delete in PostgreSQL")
                
                db_manager.release_connection(conn)
            else:
                print("User B8469686 not found in PostgreSQL")
                if db_manager._use_postgresql:
                    db_manager.release_connection(conn)
        else:
            print("Not using PostgreSQL, checking SQLite...")
            cursor = conn.cursor()
            cursor.execute('SELECT id, email, name, account_number FROM users WHERE account_number = ?', ('B8469686',))
            user_row = cursor.fetchone()
            
            if user_row:
                user_id = user_row[0]
                print(f"Found user in SQLite: ID={user_id}, Email={user_row[1]}, Name={user_row[2]}")
                
                # Count transactions
                cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
                transaction_count = cursor.fetchone()[0] or 0
                print(f"SQLite: Found {transaction_count} transactions for user {user_id}")
                
                if transaction_count > 0:
                    # Get sample transactions
                    cursor.execute('SELECT id, merchant, date FROM transactions WHERE user_id = ? LIMIT 10', (user_id,))
                    print("Sample transactions:")
                    for row in cursor.fetchall():
                        print(f"  - ID: {row[0]}, Merchant: {row[1]}, Date: {row[2]}")
                    
                    # Delete all transactions
                    print(f"\nDeleting {transaction_count} transactions from SQLite...")
                    cursor.execute('DELETE FROM transactions WHERE user_id = ?', (user_id,))
                    deleted_count = cursor.rowcount
                    conn.commit()
                    print(f"SUCCESS: Deleted {deleted_count} transactions from SQLite")
                    
                    # Verify
                    cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
                    remaining = cursor.fetchone()[0] or 0
                    print(f"Verification: {remaining} transactions remaining in SQLite")
                else:
                    print("No transactions to delete in SQLite")
            
            cursor.close()
            conn.close()
    except Exception as e:
        import traceback
        print(f"ERROR: {e}")
        print(f"Traceback: {traceback.format_exc()}")
    
    print("\n" + "=" * 60)
    print("IMPORTANT: Clear browser localStorage to remove cached transactions")
    print("=" * 60)
    print("Open browser console and run:")
    print("  localStorage.removeItem('kamioi_transactions')")
    print("  localStorage.removeItem('kamioi_business_transactions')")
    print("  localStorage.clear()  // Or refresh the page after clearing")
    print("=" * 60)

if __name__ == '__main__':
    check_and_delete()

