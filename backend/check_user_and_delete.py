#!/usr/bin/env python3
"""Check user and delete transactions"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager

def check_and_delete():
    """Check user structure and delete transactions"""
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # First, check what columns exist in users table
            result = conn.execute(text('''
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users'
                ORDER BY ordinal_position
            '''))
            columns = [row[0] for row in result.fetchall()]
            print(f"Users table columns: {columns}")
            
            # Try to find user by account_number
            result = conn.execute(text('''
                SELECT * FROM users WHERE account_number = :acc_num LIMIT 1
            '''), {'acc_num': 'B8469686'})
            user = result.fetchone()
            
            if not user:
                # Try user_id 108
                result = conn.execute(text('SELECT * FROM users WHERE id = :uid'), {'uid': 108})
                user = result.fetchone()
            
            if user:
                # Get column names
                result = conn.execute(text('''
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users'
                    ORDER BY ordinal_position
                '''))
                col_names = [row[0] for row in result.fetchall()]
                user_dict = dict(zip(col_names, user))
                print(f"\nFound user: {user_dict}")
                
                user_id = user_dict.get('id') or user[0]
                print(f"\nUser ID: {user_id}")
                
                # Count transactions
                result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
                count = result.scalar() or 0
                print(f"Transactions found: {count}")
                
                if count > 0:
                    print(f"\n[WARNING] About to delete {count} transactions for user {user_id}")
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
                    else:
                        print("[CANCELLED]")
            else:
                print("User not found")
        else:
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(users)")
            columns = cursor.fetchall()
            print(f"Users table columns: {columns}")
            
            cursor.execute("SELECT * FROM users WHERE account_number = ? LIMIT 1", ('B8469686',))
            user = cursor.fetchone()
            
            if not user:
                cursor.execute("SELECT * FROM users WHERE id = ?", (108,))
                user = cursor.fetchone()
            
            if user:
                cursor.execute("PRAGMA table_info(users)")
                col_info = cursor.fetchall()
                col_names = [col[1] for col in col_info]
                user_dict = dict(zip(col_names, user))
                print(f"\nFound user: {user_dict}")
                
                user_id = user_dict.get('id') or user[0]
                print(f"\nUser ID: {user_id}")
                
                cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,))
                count = cursor.fetchone()[0] or 0
                print(f"Transactions found: {count}")
                
                if count > 0:
                    print(f"\n[WARNING] About to delete {count} transactions for user {user_id}")
                    response = input("Type 'DELETE' to confirm: ")
                    
                    if response == 'DELETE':
                        cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
                        deleted = cursor.rowcount
                        conn.commit()
                        print(f"[SUCCESS] Deleted {deleted} transactions!")
                        
                        cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,))
                        remaining = cursor.fetchone()[0] or 0
                        print(f"Remaining transactions: {remaining}")
                    else:
                        print("[CANCELLED]")
            else:
                print("User not found")
        
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
    check_and_delete()

