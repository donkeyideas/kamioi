import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def clear_user_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    email = 'beltranalain@gmail.com'
    print(f"Clearing data for user: {email}")
    print("=" * 50)
    
    # Get user ID
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    user_result = cursor.fetchone()
    
    if not user_result:
        print("User not found!")
        return False
    
    user_id = user_result[0]
    print(f"User ID: {user_id}")
    
    # Tables to clear (with user_id column)
    tables_to_clear = [
        'transactions',
        'notifications', 
        'goals',
        'roundups',
        'fees',
        'ai_insights',
        'stock_status',
        'user_settings',
        'user_profile',
        'user_statements',
        'user_rewards',
        'user_export_transactions',
        'user_export_portfolio'
    ]
    
    # Check which tables exist and clear them
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    existing_tables = [row[0] for row in cursor.fetchall()]
    
    cleared_count = 0
    for table in tables_to_clear:
        if table in existing_tables:
            try:
                # Check if table has user_id column
                cursor.execute(f"PRAGMA table_info({table})")
                columns = [row[1] for row in cursor.fetchall()]
                
                if 'user_id' in columns:
                    cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE user_id = ?", (user_id,))
                    count = cursor.fetchone()[0]
                    if count > 0:
                        cursor.execute(f"DELETE FROM {table} WHERE user_id = ?", (user_id,))
                        print(f"Cleared {count} records from {table}")
                        cleared_count += count
                    else:
                        print(f"No records in {table}")
                else:
                    print(f"Table {table} doesn't have user_id column")
            except Exception as e:
                print(f"Error clearing {table}: {e}")
        else:
            print(f"Table {table} doesn't exist")
    
    # Commit changes
    conn.commit()
    print(f"\nTotal records cleared: {cleared_count}")
    print("User data cleared successfully!")
    
    conn.close()
    return True

if __name__ == "__main__":
    clear_user_data()
