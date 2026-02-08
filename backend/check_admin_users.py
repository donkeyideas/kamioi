import sqlite3
import os

# Determine the absolute path to the database file
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "kamioi.db")

def check_admin_users():
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()

        print("=== Admin Users in Database ===")
        cur.execute("SELECT id, email, password, name, account_type FROM users WHERE account_type = 'admin'")
        admin_users = cur.fetchall()
        
        if admin_users:
            for user in admin_users:
                print(f"ID: {user[0]}")
                print(f"Email: {user[1]}")
                print(f"Password: '{user[2]}' (Length: {len(user[2])})")
                print(f"Name: {user[3]}")
                print(f"Type: {user[4]}")
                print("---")
        else:
            print("No admin users found.")
            
        print("\n=== All Users ===")
        cur.execute("SELECT id, email, name, account_type FROM users")
        all_users = cur.fetchall()
        for user in all_users:
            print(f"ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Type: {user[3]}")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_admin_users()
