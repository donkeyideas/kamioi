import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def delete_user():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    user_email = 'beltranalain@gmail.com'
    print(f"Deleting user: {user_email}")
    print("=" * 50)
    
    # Get user ID first
    cursor.execute("SELECT id FROM users WHERE email = ?", (user_email,))
    user_result = cursor.fetchone()
    
    if not user_result:
        print("User not found!")
        return False
    
    user_id = user_result[0]
    print(f"User ID: {user_id}")
    
    # Delete all user data
    print("Deleting user data...")
    
    # Delete from all tables that might have user_id
    tables_to_clean = [
        'transactions',
        'notifications', 
        'goals',
        'user_settings'
    ]
    
    for table in tables_to_clean:
        try:
            cursor.execute(f"DELETE FROM {table} WHERE user_id = ?", (user_id,))
            deleted = cursor.rowcount
            if deleted > 0:
                print(f"Deleted {deleted} records from {table}")
        except Exception as e:
            print(f"Error deleting from {table}: {e}")
    
    # Finally delete the user
    cursor.execute("DELETE FROM users WHERE email = ?", (user_email,))
    user_deleted = cursor.rowcount
    
    if user_deleted > 0:
        print(f"Deleted user: {user_email}")
    else:
        print("User not found to delete")
    
    # Commit all changes
    conn.commit()
    
    print("\n" + "=" * 50)
    print("User completely deleted from database")
    
    conn.close()
    return True

if __name__ == "__main__":
    delete_user()
