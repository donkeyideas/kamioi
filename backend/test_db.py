#!/usr/bin/env python3
"""
Test database connection and create user_settings table if needed
"""

import sqlite3
import os

def test_database():
    """Test database and create user_settings table"""
    
    db_path = "kamioi.db"
    
    if not os.path.exists(db_path):
        print("Database file not found!")
        return
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        print("Checking if user_settings table exists...")
        
        # Check if user_settings table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='user_settings'
        """)
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("user_settings table does not exist. Creating it...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_settings (
                    user_id INTEGER PRIMARY KEY,
                    roundup_multiplier REAL DEFAULT 1.0,
                    auto_invest BOOLEAN DEFAULT 0,
                    notifications BOOLEAN DEFAULT 0,
                    email_alerts BOOLEAN DEFAULT 0,
                    theme TEXT DEFAULT 'dark',
                    business_sharing BOOLEAN DEFAULT 0,
                    budget_alerts BOOLEAN DEFAULT 0,
                    department_limits TEXT DEFAULT '{}',
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            conn.commit()
            print("user_settings table created successfully!")
        else:
            print("user_settings table already exists.")
        
        # Test the table
        cursor.execute("SELECT COUNT(*) as count FROM user_settings")
        count = cursor.fetchone()['count']
        print(f"user_settings table has {count} records")
        
        conn.close()
        print("Database test completed successfully!")
        
    except Exception as e:
        print(f"Database test error: {e}")

if __name__ == "__main__":
    test_database()
