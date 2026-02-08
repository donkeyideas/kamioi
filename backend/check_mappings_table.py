import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def check_mappings_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Checking mappings table structure...")
    print("=" * 50)
    
    # Check if mappings table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='mappings'")
    mappings_table = cursor.fetchone()
    
    if mappings_table:
        print("Mappings table exists")
        cursor.execute("PRAGMA table_info(mappings)")
        columns = cursor.fetchall()
        print("Current mappings table columns:")
        for column in columns:
            print(f"  {column[1]} ({column[2]})")
        
        # Check if dashboard_type column exists
        column_names = [col[1] for col in columns]
        if 'dashboard_type' in column_names:
            print("\n✅ dashboard_type column exists")
        else:
            print("\n❌ dashboard_type column missing")
            
        # Check sample data
        cursor.execute("SELECT COUNT(*) FROM mappings")
        count = cursor.fetchone()[0]
        print(f"\nTotal mappings: {count}")
        
        if count > 0:
            cursor.execute("SELECT * FROM mappings LIMIT 1")
            sample = cursor.fetchone()
            print(f"Sample mapping: {sample}")
    else:
        print("Mappings table does NOT exist")
    
    conn.close()

if __name__ == "__main__":
    check_mappings_table()
