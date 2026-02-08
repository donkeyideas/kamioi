#!/usr/bin/env python3
"""
Debug transaction persistence issue
"""

import os
import sys
import sqlite3

# Add the backend directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database_manager import db_manager

def debug_transactions():
    """Debug transaction persistence"""
    print("DEBUGGING TRANSACTION PERSISTENCE")
    print("=" * 50)
    
    conn = db_manager.get_connection()
    cursor = conn.cursor()
    
    # Check all transactions
    cursor.execute("SELECT COUNT(*) FROM transactions")
    total_transactions = cursor.fetchone()[0]
    print(f"Total transactions in database: {total_transactions}")
    
    if total_transactions > 0:
        print("\nAll transactions:")
        cursor.execute("SELECT id, user_id, merchant, amount, status, created_at FROM transactions ORDER BY created_at DESC")
        transactions = cursor.fetchall()
        
        for tx in transactions:
            print(f"  ID: {tx[0]}, User: {tx[1]}, Merchant: {tx[2]}, Amount: ${tx[3]}, Status: {tx[4]}, Created: {tx[5]}")
    
    # Check users
    print(f"\nUsers in database:")
    cursor.execute("SELECT id, email, name FROM users")
    users = cursor.fetchall()
    for user in users:
        print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")
    
    # Check mappings
    cursor.execute("SELECT COUNT(*) FROM llm_mappings")
    total_mappings = cursor.fetchone()[0]
    print(f"\nTotal mappings: {total_mappings}")
    
    if total_mappings > 0:
        cursor.execute("SELECT id, user_id, merchant_name, ticker, status FROM llm_mappings")
        mappings = cursor.fetchall()
        for mapping in mappings:
            print(f"  ID: {mapping[0]}, User: {mapping[1]}, Merchant: {mapping[2]}, Ticker: {mapping[3]}, Status: {mapping[4]}")
    
    conn.close()

if __name__ == '__main__':
    debug_transactions()
