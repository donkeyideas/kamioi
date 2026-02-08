import sqlite3
import os

def check_admin_user():
    """Check the admin user status in the database"""
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Checking admin user status...")
        print("=" * 50)
        
        # Check if info@kamioi.com exists in users table
        cursor.execute("SELECT * FROM users WHERE email = 'info@kamioi.com'")
        user_result = cursor.fetchone()
        
        if user_result:
            print("[PROBLEM] info@kamioi.com exists in users table!")
            print(f"   User ID: {user_result[0]}")
            print(f"   Email: {user_result[1]}")
            print(f"   Name: {user_result[2]}")
            print(f"   Dashboard Type: {user_result[3] if len(user_result) > 3 else 'N/A'}")
        else:
            print("[OK] info@kamioi.com NOT found in users table")
        
        # Check if info@kamioi.com exists in admins table
        cursor.execute("SELECT * FROM admins WHERE email = 'info@kamioi.com'")
        admin_result = cursor.fetchone()
        
        if admin_result:
            print("[OK] info@kamioi.com found in admins table (CORRECT)")
            print(f"   Admin ID: {admin_result[0]}")
            print(f"   Email: {admin_result[1]}")
            print(f"   Name: {admin_result[2]}")
        else:
            print("[ERROR] info@kamioi.com NOT found in admins table")
        
        # Check all users with info@kamioi.com
        cursor.execute("SELECT * FROM users WHERE email LIKE '%kamioi.com%'")
        kamioi_users = cursor.fetchall()
        
        if kamioi_users:
            print(f"\nFound {len(kamioi_users)} users with kamioi.com email:")
            for user in kamioi_users:
                print(f"   ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")
        
        # Check all admins
        cursor.execute("SELECT * FROM admins")
        all_admins = cursor.fetchall()
        
        if all_admins:
            print(f"\nAll admins in database:")
            for admin in all_admins:
                print(f"   ID: {admin[0]}, Email: {admin[1]}, Name: {admin[2]}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error checking admin user: {e}")

if __name__ == "__main__":
    check_admin_user()
