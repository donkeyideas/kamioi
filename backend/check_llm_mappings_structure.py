import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def check_llm_mappings_structure():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Checking llm_mappings table structure...")
    print("=" * 50)
    
    # Check if llm_mappings table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='llm_mappings'")
    table_exists = cursor.fetchone()
    
    if table_exists:
        print("llm_mappings table exists")
        cursor.execute("PRAGMA table_info(llm_mappings)")
        columns = cursor.fetchall()
        print("Current llm_mappings table columns:")
        for column in columns:
            print(f"  {column[1]} ({column[2]})")
    else:
        print("llm_mappings table does NOT exist")
    
    conn.close()

if __name__ == "__main__":
    check_llm_mappings_structure()
