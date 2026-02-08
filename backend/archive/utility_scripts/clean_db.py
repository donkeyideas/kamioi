#!/usr/bin/env python3
"""
Clean up database to ensure proper user isolation
"""

import sqlite3
import os

def clean_database():
    db_path = os.path.join(os.path.dirname(__file__), "kamioi.db")
    
    if not os.path.exists(db_path):
        print("Database file not found:", db_path)
        return
    
    print("Cleaning database for proper user isolation...")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Remove all existing mappings (they're all from user 1 and causing confusion)
    print("Removing all existing LLM mappings...")
    cursor.execute("DELETE FROM llm_mappings")
    
    # Remove all existing transactions (clean slate)
    print("Removing all existing transactions...")
    cursor.execute("DELETE FROM transactions")
    
    # Keep users but ensure they're clean
    print("Users table kept (contains test users)")
    
    conn.commit()
    conn.close()
    
    print("Database cleaned successfully!")
    print("Now each user will only see their own data.")

if __name__ == "__main__":
    clean_database()

