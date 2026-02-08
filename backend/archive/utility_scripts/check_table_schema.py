#!/usr/bin/env python3

import sqlite3
import os

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def check_schema():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check current schema
        cursor.execute("PRAGMA table_info(llm_mappings)")
        columns = cursor.fetchall()
        
        print("Current llm_mappings schema:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        # Check if there are any records
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        count = cursor.fetchone()[0]
        print(f"\nTotal records: {count}")
        
        if count > 0:
            # Get a sample record
            cursor.execute("SELECT * FROM llm_mappings LIMIT 1")
            sample = cursor.fetchone()
            print(f"\nSample record:")
            for i, col in enumerate(columns):
                print(f"  {col[1]}: {sample[i] if i < len(sample) else 'N/A'}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_schema()
