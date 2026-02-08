#!/usr/bin/env python3

import sqlite3
import os

def inspect_database():
    """Inspect the database structure to understand the schema"""
    
    # Database path
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("Database Tables:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Check transactions table structure
        print("\nTransactions table structure:")
        cursor.execute("PRAGMA table_info(transactions);")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        # Check if there are any transactions
        cursor.execute("SELECT COUNT(*) FROM transactions")
        total_transactions = cursor.fetchone()[0]
        print(f"\nTotal transactions in database: {total_transactions}")
        
        # Show sample transactions
        if total_transactions > 0:
            cursor.execute("SELECT * FROM transactions LIMIT 3")
            sample_transactions = cursor.fetchall()
            print("\nSample transactions:")
            for i, txn in enumerate(sample_transactions):
                print(f"  Transaction {i+1}: {txn}")
        
        # Check users table
        print("\nUsers table structure:")
        cursor.execute("PRAGMA table_info(users);")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        # Check if beltranalain@gmail.com exists in users
        cursor.execute("SELECT * FROM users WHERE email = 'beltranalain@gmail.com'")
        user = cursor.fetchone()
        if user:
            print(f"\nUser found: {user}")
        else:
            print("\nUser beltranalain@gmail.com not found in users table")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error inspecting database: {e}")
        return False

if __name__ == "__main__":
    print("Inspecting database structure...")
    inspect_database()
