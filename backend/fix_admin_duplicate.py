import sqlite3
import os

def fix_admin_duplicate():
    """Remove info@kamioi.com from users table since it should only be in admins table"""
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Fixing admin user duplicate...")
        print("=" * 50)
        
        # Check current state
        cursor.execute("SELECT * FROM users WHERE email = 'info@kamioi.com'")
        user_result = cursor.fetchone()
        
        if user_result:
            print(f"[FOUND] Duplicate user entry:")
            print(f"   User ID: {user_result[0]}")
            print(f"   Email: {user_result[1]}")
            print(f"   Name: {user_result[2]}")
            
            # Remove the duplicate from users table
            cursor.execute("DELETE FROM users WHERE email = 'info@kamioi.com'")
            conn.commit()
            
            print("[FIXED] Removed info@kamioi.com from users table")
            
            # Verify it's gone from users table
            cursor.execute("SELECT * FROM users WHERE email = 'info@kamioi.com'")
            user_result_after = cursor.fetchone()
            
            if user_result_after:
                print("[ERROR] Still exists in users table!")
            else:
                print("[OK] No longer exists in users table")
                
        else:
            print("[OK] info@kamioi.com not found in users table")
        
        # Verify it still exists in admins table
        cursor.execute("SELECT * FROM admins WHERE email = 'info@kamioi.com'")
        admin_result = cursor.fetchone()
        
        if admin_result:
            print("[OK] info@kamioi.com still exists in admins table (CORRECT)")
            print(f"   Admin ID: {admin_result[0]}")
            print(f"   Email: {admin_result[1]}")
            print(f"   Name: {admin_result[2]}")
        else:
            print("[ERROR] info@kamioi.com missing from admins table!")
        
        conn.close()
        print("\n[SUCCESS] Admin user duplicate fixed!")
        
    except Exception as e:
        print(f"Error fixing admin duplicate: {e}")

if __name__ == "__main__":
    fix_admin_duplicate()
