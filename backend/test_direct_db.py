import sqlite3
import os
from database_manager import db_manager

def test_direct_database():
    print("Testing direct database connection...")
    
    try:
        # Test using database_manager
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        # Test the exact query from the login function
        email = "info@kamioi.com"
        cur.execute("SELECT id, email, password, name, account_type FROM users WHERE email = ? AND account_type = 'admin'", (email,))
        row = cur.fetchone()
        
        print(f"Query result: {row}")
        
        if row:
            print(f"ID: {row[0]}")
            print(f"Email: {row[1]}")
            print(f"Password: '{row[2]}' (Length: {len(row[2])})")
            print(f"Name: {row[3]}")
            print(f"Account Type: {row[4]}")
            
            # Test password comparison
            stored_password = row[2]
            test_password = "admin123"
            print(f"Stored password: '{stored_password}'")
            print(f"Test password: '{test_password}'")
            print(f"Passwords match: {stored_password == test_password}")
            print(f"Stored password type: {type(stored_password)}")
            print(f"Test password type: {type(test_password)}")
            
        conn.close()
        
    except Exception as e:
        print(f"Database test failed: {e}")

if __name__ == "__main__":
    test_direct_database()
