import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def restore_original_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    user_email = 'beltranalain@gmail.com'
    print(f"Restoring original data for user: {user_email}")
    print("=" * 50)
    
    # Get user ID
    cursor.execute("SELECT id FROM users WHERE email = ?", (user_email,))
    user_result = cursor.fetchone()
    
    if not user_result:
        print("User not found!")
        return False
    
    user_id = user_result[0]
    print(f"User ID: {user_id}")
    
    # Remove sample transactions I added
    print("Removing sample transactions...")
    cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
    deleted_transactions = cursor.rowcount
    print(f"Removed {deleted_transactions} sample transactions")
    
    # Remove sample notifications
    print("Removing sample notifications...")
    cursor.execute("DELETE FROM notifications WHERE user_id = ?", (user_id,))
    deleted_notifications = cursor.rowcount
    print(f"Removed {deleted_notifications} sample notifications")
    
    # Remove sample goals
    print("Removing sample goals...")
    cursor.execute("DELETE FROM goals WHERE user_id = ?", (user_id,))
    deleted_goals = cursor.rowcount
    print(f"Removed {deleted_goals} sample goals")
    
    # Remove sample user settings
    print("Removing sample user settings...")
    cursor.execute("DELETE FROM user_settings WHERE user_id = ?", (user_id,))
    deleted_settings = cursor.rowcount
    print(f"Removed {deleted_settings} sample settings")
    
    # Commit changes
    conn.commit()
    
    print("\n" + "=" * 50)
    print("Original data restored!")
    print(f"Removed:")
    print(f"  • {deleted_transactions} transactions")
    print(f"  • {deleted_notifications} notifications") 
    print(f"  • {deleted_goals} goals")
    print(f"  • {deleted_settings} settings")
    print("\nUser account preserved - ready for your original data")
    
    conn.close()
    return True

if __name__ == "__main__":
    restore_original_data()
