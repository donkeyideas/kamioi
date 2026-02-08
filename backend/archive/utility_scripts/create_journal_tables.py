#!/usr/bin/env python3
"""
Create journal entries tables for the Financial Analytics system
"""

import sqlite3
import os

def create_journal_tables():
    """Create journal entries and journal entry lines tables"""
    
    # Connect to database
    db_path = 'kamioi.db'
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found!")
        return False
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    try:
        # Create journal_entries table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS journal_entries (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                reference TEXT,
                description TEXT,
                location TEXT,
                department TEXT,
                transaction_type TEXT NOT NULL,
                vendor_name TEXT,
                customer_name TEXT,
                amount REAL NOT NULL,
                from_account TEXT NOT NULL,
                to_account TEXT NOT NULL,
                status TEXT DEFAULT 'draft',
                created_at TEXT NOT NULL,
                created_by TEXT NOT NULL,
                updated_at TEXT,
                updated_by TEXT
            )
        """)
        
        # Create journal_entry_lines table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS journal_entry_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                journal_entry_id TEXT NOT NULL,
                account_code TEXT NOT NULL,
                debit REAL DEFAULT 0,
                credit REAL DEFAULT 0,
                description TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (journal_entry_id) REFERENCES journal_entries (id)
            )
        """)
        
        # Create index for better performance
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_journal_entries_date 
            ON journal_entries (date)
        """)
        
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_journal_entries_status 
            ON journal_entries (status)
        """)
        
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_journal_id 
            ON journal_entry_lines (journal_entry_id)
        """)
        
        conn.commit()
        print("SUCCESS: Journal entries tables created successfully!")
        return True
        
    except Exception as e:
        print(f"ERROR: Error creating journal tables: {str(e)}")
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    print("Creating journal entries tables...")
    success = create_journal_tables()
    if success:
        print("SUCCESS: Journal entries system ready!")
    else:
        print("ERROR: Failed to create journal entries tables!")
