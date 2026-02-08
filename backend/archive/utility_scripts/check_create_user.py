#!/usr/bin/env python3
"""Check and create user 108 (B8469686) if it doesn't exist"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager
from datetime import datetime

def check_and_create_user():
    """Check if user 108 exists, create if missing"""
    print("=" * 60)
    print("USER CHECK AND CREATE SCRIPT")
    print("=" * 60)
    
    user_id = 108
    account_number = "B8469686"
    email = "bus@bus.com"
    name = "Nick Al"
    account_type = "business"
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Check if user exists
            result = conn.execute(text('''
                SELECT id, email, name, account_type, account_number
                FROM users
                WHERE id = :uid OR account_number = :acc_num
            '''), {'uid': user_id, 'acc_num': account_number})
            user = result.fetchone()
            
            if user:
                print(f"\n[SUCCESS] User found:")
                print(f"   ID: {user[0]}")
                print(f"   Email: {user[1]}")
                print(f"   Name: {user[2]}")
                print(f"   Account Type: {user[3]}")
                print(f"   Account Number: {user[4]}")
                
                # Check if details match
                if user[0] != user_id:
                    print(f"\n[WARNING] User found with different ID: {user[0]} (expected {user_id})")
                if user[4] != account_number:
                    print(f"[WARNING] Account number mismatch: {user[4]} (expected {account_number})")
                
                # Check transaction count
                result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user[0]})
                tx_count = result.scalar() or 0
                print(f"\n[INFO] Transactions for this user: {tx_count}")
                
                db_manager.release_connection(conn)
                return True
            else:
                print(f"\n[INFO] User {user_id} (account {account_number}) not found. Creating...")
                
                # Get table structure to see what columns exist
                result = conn.execute(text('''
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = 'users'
                    ORDER BY ordinal_position
                '''))
                columns = result.fetchall()
                print(f"\n[DEBUG] Users table columns: {[col[0] for col in columns]}")
                
                # Build INSERT statement with available columns
                column_names = [col[0] for col in columns]
                
                # Required fields
                insert_data = {
                    'id': user_id,
                    'email': email,
                    'name': name,
                    'account_type': account_type,
                    'account_number': account_number
                }
                
                # Add optional fields if they exist
                if 'created_at' in column_names:
                    insert_data['created_at'] = datetime.now().isoformat()
                if 'updated_at' in column_names:
                    insert_data['updated_at'] = datetime.now().isoformat()
                
                # Build INSERT query
                columns_str = ', '.join(insert_data.keys())
                placeholders = ', '.join([f':{k}' for k in insert_data.keys()])
                
                insert_query = f'''
                    INSERT INTO users ({columns_str})
                    VALUES ({placeholders})
                '''
                
                print(f"\n[CREATING] Inserting user with query:")
                print(f"   {insert_query}")
                print(f"   Data: {insert_data}")
                
                try:
                    result = conn.execute(text(insert_query), insert_data)
                    conn.commit()
                    print(f"[SUCCESS] User {user_id} created successfully!")
                    
                    # Verify creation
                    result = conn.execute(text('''
                        SELECT id, email, name, account_type, account_number
                        FROM users
                        WHERE id = :uid
                    '''), {'uid': user_id})
                    new_user = result.fetchone()
                    
                    if new_user:
                        print(f"\n[VERIFIED] User created:")
                        print(f"   ID: {new_user[0]}")
                        print(f"   Email: {new_user[1]}")
                        print(f"   Name: {new_user[2]}")
                        print(f"   Account Type: {new_user[3]}")
                        print(f"   Account Number: {new_user[4]}")
                        
                        # Check transaction count (should be 0)
                        result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
                        tx_count = result.scalar() or 0
                        print(f"\n[INFO] Current transactions for user {user_id}: {tx_count}")
                        print(f"[INFO] User is ready to receive transactions!")
                        
                        db_manager.release_connection(conn)
                        return True
                    else:
                        print(f"[ERROR] User creation verification failed!")
                        db_manager.release_connection(conn)
                        return False
                        
                except Exception as insert_err:
                    import traceback
                    print(f"[ERROR] Failed to create user: {insert_err}")
                    print(f"[ERROR] Traceback: {traceback.format_exc()}")
                    conn.rollback()
                    db_manager.release_connection(conn)
                    return False
        else:
            # SQLite version
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute('''
                SELECT id, email, name, account_type, account_number
                FROM users
                WHERE id = ? OR account_number = ?
            ''', (user_id, account_number))
            user = cursor.fetchone()
            
            if user:
                print(f"\n[SUCCESS] User found:")
                print(f"   ID: {user[0]}")
                print(f"   Email: {user[1]}")
                print(f"   Name: {user[2]}")
                print(f"   Account Type: {user[3]}")
                print(f"   Account Number: {user[4]}")
                
                # Check transaction count
                cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user[0],))
                tx_count = cursor.fetchone()[0] or 0
                print(f"\n[INFO] Transactions for this user: {tx_count}")
                
                conn.close()
                return True
            else:
                print(f"\n[INFO] User {user_id} (account {account_number}) not found. Creating...")
                
                # Get table structure
                cursor.execute("PRAGMA table_info(users)")
                columns = cursor.fetchall()
                column_names = [col[1] for col in columns]
                print(f"\n[DEBUG] Users table columns: {column_names}")
                
                # Build INSERT
                try:
                    # Try with all common fields
                    cursor.execute('''
                        INSERT INTO users (id, email, name, account_type, account_number, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (user_id, email, name, account_type, account_number, datetime.now().isoformat()))
                    
                    conn.commit()
                    print(f"[SUCCESS] User {user_id} created successfully!")
                    
                    # Verify
                    cursor.execute('''
                        SELECT id, email, name, account_type, account_number
                        FROM users
                        WHERE id = ?
                    ''', (user_id,))
                    new_user = cursor.fetchone()
                    
                    if new_user:
                        print(f"\n[VERIFIED] User created:")
                        print(f"   ID: {new_user[0]}")
                        print(f"   Email: {new_user[1]}")
                        print(f"   Name: {new_user[2]}")
                        print(f"   Account Type: {new_user[3]}")
                        print(f"   Account Number: {new_user[4]}")
                        
                        cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
                        tx_count = cursor.fetchone()[0] or 0
                        print(f"\n[INFO] Current transactions: {tx_count}")
                        print(f"[INFO] User is ready to receive transactions!")
                        
                        conn.close()
                        return True
                    else:
                        print(f"[ERROR] User creation verification failed!")
                        conn.close()
                        return False
                        
                except Exception as insert_err:
                    import traceback
                    print(f"[ERROR] Failed to create user: {insert_err}")
                    print(f"[ERROR] Traceback: {traceback.format_exc()}")
                    conn.rollback()
                    conn.close()
                    return False
        
    except Exception as e:
        import traceback
        print(f"\n[ERROR] Unexpected error: {e}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return False

if __name__ == "__main__":
    success = check_and_create_user()
    if success:
        print("\n" + "=" * 60)
        print("[SUCCESS] Script completed successfully!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("[ERROR] Script failed!")
        print("=" * 60)
        sys.exit(1)

