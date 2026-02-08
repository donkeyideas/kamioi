import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def check_database_schema():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Checking database schema for LLM mapping...")
    print("=" * 50)
    
    # Check if mappings table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='mappings'")
    mappings_table = cursor.fetchone()
    
    if mappings_table:
        print("Mappings table exists")
        cursor.execute("PRAGMA table_info(mappings)")
        columns = cursor.fetchall()
        print("Mappings table columns:")
        for column in columns:
            print(f"  {column[1]} ({column[2]})")
    else:
        print("Mappings table does NOT exist")
    
    # Check if there are any mappings
    if mappings_table:
        cursor.execute("SELECT COUNT(*) FROM mappings")
        count = cursor.fetchone()[0]
        print(f"\nTotal mappings: {count}")
        
        if count > 0:
            cursor.execute("SELECT * FROM mappings LIMIT 3")
            sample_mappings = cursor.fetchall()
            print("Sample mappings:")
            for mapping in sample_mappings:
                print(f"  {mapping}")
    
    # Check transactions table for pending transactions
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE status = 'pending'")
    pending_count = cursor.fetchone()[0]
    print(f"\nPending transactions: {pending_count}")
    
    if pending_count > 0:
        cursor.execute("SELECT user_id, merchant, category FROM transactions WHERE status = 'pending' LIMIT 5")
        pending = cursor.fetchall()
        print("Sample pending transactions:")
        for txn in pending:
            user_id, merchant, category = txn
            print(f"  User {user_id}: {merchant} ({category})")
    
    conn.close()

if __name__ == "__main__":
    check_database_schema()