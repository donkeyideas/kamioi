#!/usr/bin/env python3
"""Delete transactions directly by user_id"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager

def delete_transactions(user_id=108):
    """Delete all transactions for user_id"""
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Count transactions
            result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            count = result.scalar() or 0
            print(f"Transactions found for user_id {user_id}: {count}")
            
            if count > 0:
                print(f"\n[WARNING] About to delete {count} transactions for user_id {user_id}")
                response = input("Type 'DELETE' to confirm: ")
                
                if response == 'DELETE':
                    result = conn.execute(text('DELETE FROM transactions WHERE user_id = :uid'), {'uid': user_id})
                    deleted = result.rowcount
                    conn.commit()
                    print(f"[SUCCESS] Deleted {deleted} transactions!")
                    
                    # Verify
                    result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
                    remaining = result.scalar() or 0
                    print(f"Remaining transactions: {remaining}")
                    return True
                else:
                    print("[CANCELLED]")
                    return False
            else:
                print("No transactions to delete.")
                return True
        else:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,))
            count = cursor.fetchone()[0] or 0
            print(f"Transactions found for user_id {user_id}: {count}")
            
            if count > 0:
                print(f"\n[WARNING] About to delete {count} transactions for user_id {user_id}")
                response = input("Type 'DELETE' to confirm: ")
                
                if response == 'DELETE':
                    cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
                    deleted = cursor.rowcount
                    conn.commit()
                    print(f"[SUCCESS] Deleted {deleted} transactions!")
                    
                    cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,))
                    remaining = cursor.fetchone()[0] or 0
                    print(f"Remaining transactions: {remaining}")
                    return True
                else:
                    print("[CANCELLED]")
                    return False
            else:
                print("No transactions to delete.")
                return True
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        print(traceback.format_exc())
        return False
    finally:
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == "__main__":
    # From logs, we know user_id 108 has account_number B8469686
    success = delete_transactions(user_id=108)
    sys.exit(0 if success else 1)

