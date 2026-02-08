#!/usr/bin/env python3
"""
Script to remove all fake transactions from the database
"""

import sqlite3
import os

def clear_all_transactions():
    """Remove all transactions from the database"""
    DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get count before clearing
        cursor.execute("SELECT COUNT(*) FROM transactions")
        count_before = cursor.fetchone()[0]
        print(f"Found {count_before} transactions to remove")
        
        # Clear all transactions
        cursor.execute("DELETE FROM transactions")
        
        # Also clear related mappings
        cursor.execute("DELETE FROM llm_mappings")
        
        # Commit changes
        conn.commit()
        
        # Verify cleanup
        cursor.execute("SELECT COUNT(*) FROM transactions")
        count_after = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        mappings_after = cursor.fetchone()[0]
        
        print(f"Successfully removed all transactions")
        print(f"   - Transactions before: {count_before}")
        print(f"   - Transactions after: {count_after}")
        print(f"   - Mappings after: {mappings_after}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error clearing transactions: {e}")
        return False

if __name__ == "__main__":
    print("Clearing all fake transactions from database...")
    success = clear_all_transactions()
    
    if success:
        print("Database cleanup completed successfully!")
    else:
        print("Database cleanup failed!")
