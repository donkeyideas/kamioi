"""
Clear hardcoded account balances that don't correspond to actual transactions.
This script will remove all balances from account_balances table so that 
balances are only calculated from actual transactions.
"""

import sqlite3
from datetime import datetime

def clear_hardcoded_balances():
    """Remove all hardcoded balances from account_balances table"""
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    try:
        # Get count of balances before deletion
        cursor.execute("SELECT COUNT(*) FROM account_balances")
        count_before = cursor.fetchone()[0]
        
        print(f"Found {count_before} hardcoded balances in account_balances table")
        
        # Check if there are actual transactions
        cursor.execute("SELECT COUNT(*) FROM transactions")
        transaction_count = cursor.fetchone()[0]
        
        print(f"Found {transaction_count} transactions in the system")
        
        if transaction_count == 0:
            print("\nWARNING: No transactions found in the system.")
            print("Since there are no transactions, all account balances should be zero.")
            print("Clearing all hardcoded balances...")
            
            # Delete all balances
            cursor.execute("DELETE FROM account_balances")
            deleted_count = cursor.rowcount
            
            conn.commit()
            print(f"Successfully deleted {deleted_count} hardcoded balances")
        else:
            print(f"\nWARNING: {transaction_count} transactions exist in the system.")
            print("However, if these balances don't correspond to actual transactions,")
            print("you may want to clear them and recalculate from transactions.")
            print("\nNote: The balances in account_balances table were set on 2025-10-29")
            print("and may be hardcoded initial balances rather than transaction-derived.")
            
            response = input("\nDo you want to clear all hardcoded balances? (yes/no): ")
            if response.lower() == 'yes':
                cursor.execute("DELETE FROM account_balances")
                deleted_count = cursor.rowcount
                conn.commit()
                print(f"Successfully deleted {deleted_count} hardcoded balances")
            else:
                print("Cancelled. Balances remain unchanged.")
        
        conn.close()
        print("\nComplete!")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
        conn.close()

if __name__ == '__main__':
    print("=" * 60)
    print("Clear Hardcoded Account Balances")
    print("=" * 60)
    clear_hardcoded_balances()

