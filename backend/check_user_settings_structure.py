import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def check_user_settings_structure():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("User_settings table structure:")
    cursor.execute("PRAGMA table_info(user_settings)")
    columns = cursor.fetchall()
    for column in columns:
        print(f"  {column[1]} ({column[2]})")
    
    conn.close()

if __name__ == "__main__":
    check_user_settings_structure()
