#!/usr/bin/env python3

import sqlite3
import os

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def check_and_fix_schema():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if table exists and get its schema
        cursor.execute("PRAGMA table_info(llm_mappings)")
        columns = cursor.fetchall()
        
        print("Current llm_mappings schema:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        # Check if notes column exists
        has_notes = any(col[1] == 'notes' for col in columns)
        
        if not has_notes:
            print("\n'notes' column missing! Fixing schema...")
            
            # Drop and recreate table with correct schema
            cursor.execute("DROP TABLE IF EXISTS llm_mappings")
            cursor.execute('''
                CREATE TABLE llm_mappings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    merchant_name TEXT NOT NULL,
                    category TEXT,
                    notes TEXT,
                    ticker_symbol TEXT,
                    confidence REAL DEFAULT 0.0,
                    status TEXT DEFAULT 'approved',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    admin_id TEXT
                )
            ''')
            conn.commit()
            print("Table recreated with correct schema!")
        else:
            print("Schema is correct - 'notes' column exists")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_and_fix_schema()
