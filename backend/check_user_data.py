"""
Check what data is actually stored for a user in the database
"""
import sqlite3
import json
import sys

DB_PATH = "kamioi.db"

def check_user_data(user_id=None, email=None):
    """Check user data in database"""
    print("=" * 60)
    print("CHECKING USER DATA IN DATABASE")
    print("=" * 60)
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get user
        if user_id:
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        elif email:
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        else:
            # Get most recent user
            cursor.execute("SELECT * FROM users ORDER BY id DESC LIMIT 1")
        
        user = cursor.fetchone()
        
        if not user:
            print("[ERROR] User not found")
            return
        
        # Get column names
        cursor.execute("PRAGMA table_info(users)")
        columns_info = cursor.fetchall()
        column_names = [col[1] for col in columns_info]
        
        print(f"\nUser ID: {user[0]}")
        print(f"Email: {user[1]}")
        print(f"\nAll stored data:")
        for i, col_name in enumerate(column_names):
            value = user[i] if i < len(user) else None
            if value:
                print(f"  {col_name}: {value}")
            else:
                print(f"  {col_name}: (empty)")
        
        # Check subscription
        cursor.execute("SELECT * FROM user_subscriptions WHERE user_id = ?", (user[0],))
        subs = cursor.fetchall()
        if subs:
            print(f"\nSubscriptions found: {len(subs)}")
            for sub in subs:
                print(f"  Subscription ID: {sub[0]}, Plan ID: {sub[2]}, Status: {sub[3]}")
        else:
            print("\nNo subscriptions found")
        
        conn.close()
        
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    email = sys.argv[2] if len(sys.argv) > 2 else None
    check_user_data(user_id=user_id, email=email)
