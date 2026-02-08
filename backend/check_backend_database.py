import sqlite3
import os

# Define the path to the backend database
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "kamioi.db")

def check_backend_database():
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("=== BACKEND DATABASE CHECK ===")
        print(f"Database path: {db_path}")
        print()

        # Check all users in backend database
        print("All users in backend database:")
        cursor.execute("SELECT id, email, name, role FROM users")
        users = cursor.fetchall()
        
        if users:
            for user in users:
                print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Role: {user[3]}")
        else:
            print("  No users found in database")
        
        print()
        
        # Check specifically for testuser@test.com
        print("Checking for testuser@test.com:")
        cursor.execute("SELECT id, email, name FROM users WHERE email = 'testuser@test.com'")
        testuser = cursor.fetchone()
        
        if testuser:
            print(f"  FOUND: ID {testuser[0]}, Email: {testuser[1]}, Name: {testuser[2]}")
            print("  DELETING testuser@test.com...")
            
            # Delete all associated data
            user_id = testuser[0]
            cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM notifications WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM user_settings WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM password_reset_tokens WHERE email = ?", (testuser[1],))
            cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
            
            conn.commit()
            print("  DELETED: testuser@test.com and all associated data")
        else:
            print("  NOT FOUND: testuser@test.com not in database")
        
        print()
        
        # Final verification
        print("Final user count:")
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        print(f"  Total users: {count}")
        
        cursor.execute("SELECT id, email, name FROM users")
        final_users = cursor.fetchall()
        for user in final_users:
            print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_backend_database()
