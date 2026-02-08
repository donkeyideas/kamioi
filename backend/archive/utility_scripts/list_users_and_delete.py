#!/usr/bin/env python3
"""List users and delete transactions"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager

def list_and_delete():
    """List users and delete transactions for B8469686"""
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # List all users with account_number containing B8469686
            result = conn.execute(text('''
                SELECT id, email, name, account_type, account_number
                FROM users
                WHERE account_number LIKE :pattern OR id = 108
                ORDER BY id
            '''), {'pattern': '%B8469686%'})
            users = result.fetchall()
            
            print("Users found:")
            for user in users:
                print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Type: {user[3]}, Account: {user[4]}")
            
            # Try to find the user
            user_id = None
            for user in users:
                if user[4] and 'B8469686' in str(user[4]).upper():
                    user_id = user[0]
                    print(f"\nFound matching user: ID {user_id}")
                    break
            
            if not user_id and users:
                # Use first user if found
                user_id = users[0][0]
                print(f"\nUsing user ID: {user_id}")
            
            if not user_id:
                # Try direct query
                result = conn.execute(text('SELECT id FROM users WHERE id = 108'))
                row = result.fetchone()
                if row:
                    user_id = row[0]
                    print(f"\nFound user by ID 108: {user_id}")
            
            if user_id:
                # Count transactions
                result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
                count = result.scalar() or 0
                print(f"\nTransactions found for user {user_id}: {count}")
                
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
                    print("No transactions to delete.")
            else:
                print("User not found. Cannot delete transactions.")
        else:
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, name, account_type, account_number FROM users WHERE account_number LIKE ? OR id = 108", ('%B8469686%',))
            users = cursor.fetchall()
            
            print("Users found:")
            for user in users:
                print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Type: {user[3]}, Account: {user[4]}")
            
            user_id = None
            for user in users:
                if user[4] and 'B8469686' in str(user[4]).upper():
                    user_id = user[0]
                    break
            
            if not user_id and users:
                user_id = users[0][0]
            
            if user_id:
                cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,))
                count = cursor.fetchone()[0] or 0
                print(f"\nTransactions found: {count}")
                
                if count > 0:
                    print(f"\n[WARNING] About to delete {count} transactions")
                    response = input("Type 'DELETE' to confirm: ")
                    
                    if response == 'DELETE':
                        cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
                        deleted = cursor.rowcount
                        conn.commit()
                        print(f"[SUCCESS] Deleted {deleted} transactions!")
                    else:
                        print("[CANCELLED]")
        
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
    list_and_delete()

