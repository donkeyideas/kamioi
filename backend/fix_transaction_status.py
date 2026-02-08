#!/usr/bin/env python3
"""
Fix transaction status for existing transactions
"""

import os
import sys
import sqlite3

# Add the backend directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database_manager import db_manager

def fix_transaction_status():
    """Fix transaction status for existing transactions"""
    print("Fixing transaction status...")
    
    conn = db_manager.get_connection()
    cursor = conn.cursor()
    
    # Update all transactions that have 'completed' status but no ticker (not actually completed)
    cursor.execute("""
        UPDATE transactions 
        SET status = 'pending' 
        WHERE status = 'completed' 
        AND (ticker IS NULL OR ticker = '')
    """)
    
    updated_count = cursor.rowcount
    print(f"Updated {updated_count} transactions from 'completed' to 'pending'")
    
    # Also update transactions that have investable = 0 to pending
    cursor.execute("""
        UPDATE transactions 
        SET status = 'pending' 
        WHERE investable = 0 
        AND status = 'completed'
    """)
    
    additional_updated = cursor.rowcount
    print(f"Updated {additional_updated} additional transactions to 'pending'")
    
    conn.commit()
    conn.close()
    
    print("Transaction status fix completed!")
    
    # Verify the changes
    conn = db_manager.get_connection()
    cursor = conn.cursor()
    
    print("\nVerification:")
    cursor.execute("SELECT status, COUNT(*) FROM transactions GROUP BY status")
    status_counts = cursor.fetchall()
    
    for status, count in status_counts:
        print(f"  {status}: {count} transactions")
    
    conn.close()

if __name__ == '__main__':
    fix_transaction_status()

