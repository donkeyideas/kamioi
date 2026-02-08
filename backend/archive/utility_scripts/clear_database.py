#!/usr/bin/env python3

import sqlite3
import os

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def clear_llm_mappings():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check current count
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        count_before = cursor.fetchone()[0]
        print(f"Records before clearing: {count_before:,}")
        
        # Clear the table
        cursor.execute("DELETE FROM llm_mappings")
        conn.commit()
        
        # Check count after clearing
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        count_after = cursor.fetchone()[0]
        print(f"Records after clearing: {count_after:,}")
        
        if count_after == 0:
            print("✅ Database cleared successfully!")
        else:
            print("❌ Database not fully cleared")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    clear_llm_mappings()