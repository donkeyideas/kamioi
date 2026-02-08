#!/usr/bin/env python3
"""
Script to find orphaned transactions (transactions with invalid user_id or users with invalid account_type)
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def find_orphaned_transactions():
    """Find transactions that don't match any user type breakdown"""
    print("[FIND ORPHANED] Starting orphaned transaction search...")
    
    # Ensure database manager is initialized
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            print("[FIND ORPHANED] Checking PostgreSQL database...")
            
            # Find transactions with user_id that doesn't exist in users table
            print("\n1. Checking for transactions with non-existent user_id...")
            result = conn.execute(text('''
                SELECT t.id, t.user_id, t.merchant, t.amount, t.date
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE u.id IS NULL
            '''))
            orphaned = result.fetchall()
            if orphaned:
                print(f"   Found {len(orphaned)} orphaned transaction(s):")
                for row in orphaned:
                    print(f"   - Transaction ID: {row[0]}, User ID: {row[1]}, Merchant: {row[2]}, Amount: ${row[3]}, Date: {row[4]}")
            else:
                print("   No orphaned transactions found (all have valid user_id)")
            
            # Find transactions with users that have NULL or invalid account_type
            print("\n2. Checking for transactions with users that have NULL/invalid account_type...")
            result = conn.execute(text('''
                SELECT t.id, t.user_id, u.email, u.account_type, u.account_number, t.merchant, t.amount, t.date
                FROM transactions t
                JOIN users u ON t.user_id = u.id
                WHERE u.account_type IS NULL 
                   OR u.account_type NOT IN ('individual', 'family', 'business', 'admin')
            '''))
            invalid_account_type = result.fetchall()
            if invalid_account_type:
                print(f"   Found {len(invalid_account_type)} transaction(s) with invalid account_type:")
                for row in invalid_account_type:
                    print(f"   - Transaction ID: {row[0]}, User ID: {row[1]}, Email: {row[2]}, Account Type: {row[3] or 'NULL'}, Account Number: {row[4]}")
                    print(f"     Merchant: {row[5]}, Amount: ${row[6]}, Date: {row[7]}")
            else:
                print("   No transactions found with invalid account_type")
            
            # Get total transaction count
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            total_txns = result.scalar() or 0
            
            # Get breakdown counts
            breakdown_total = 0
            for account_type in ['individual', 'family', 'business', 'admin']:
                result = conn.execute(text('''
                    SELECT COUNT(*) FROM transactions t
                    JOIN users u ON t.user_id = u.id
                    WHERE u.account_type = :account_type
                '''), {'account_type': account_type})
                count = result.scalar() or 0
                breakdown_total += count
                print(f"\n   {account_type.capitalize()} transactions: {count}")
            
            print(f"\n3. Summary:")
            print(f"   Total transactions: {total_txns}")
            print(f"   Breakdown total: {breakdown_total}")
            print(f"   Missing from breakdown: {total_txns - breakdown_total}")
            
            db_manager.release_connection(conn)
        else:
            # SQLite version
            print("[FIND ORPHANED] Checking SQLite database...")
            cursor = conn.cursor()
            
            # Find orphaned transactions
            print("\n1. Checking for transactions with non-existent user_id...")
            cursor.execute('''
                SELECT t.id, t.user_id, t.merchant, t.amount, t.date
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE u.id IS NULL
            ''')
            orphaned = cursor.fetchall()
            if orphaned:
                print(f"   Found {len(orphaned)} orphaned transaction(s):")
                for row in orphaned:
                    print(f"   - Transaction ID: {row[0]}, User ID: {row[1]}, Merchant: {row[2]}, Amount: ${row[3]}, Date: {row[4]}")
            else:
                print("   No orphaned transactions found (all have valid user_id)")
            
            # Find transactions with invalid account_type
            print("\n2. Checking for transactions with users that have NULL/invalid account_type...")
            cursor.execute('''
                SELECT t.id, t.user_id, u.email, u.account_type, u.account_number, t.merchant, t.amount, t.date
                FROM transactions t
                JOIN users u ON t.user_id = u.id
                WHERE u.account_type IS NULL 
                   OR u.account_type NOT IN ('individual', 'family', 'business', 'admin')
            ''')
            invalid_account_type = cursor.fetchall()
            if invalid_account_type:
                print(f"   Found {len(invalid_account_type)} transaction(s) with invalid account_type:")
                for row in invalid_account_type:
                    print(f"   - Transaction ID: {row[0]}, User ID: {row[1]}, Email: {row[2]}, Account Type: {row[3] or 'NULL'}, Account Number: {row[4]}")
                    print(f"     Merchant: {row[5]}, Amount: ${row[6]}, Date: {row[7]}")
            else:
                print("   No transactions found with invalid account_type")
            
            # Get totals
            cursor.execute('SELECT COUNT(*) FROM transactions')
            total_txns = cursor.fetchone()[0] or 0
            
            breakdown_total = 0
            for account_type in ['individual', 'family', 'business', 'admin']:
                cursor.execute('''
                    SELECT COUNT(*) FROM transactions t
                    JOIN users u ON t.user_id = u.id
                    WHERE u.account_type = ?
                ''', (account_type,))
                count = cursor.fetchone()[0] or 0
                breakdown_total += count
                print(f"\n   {account_type.capitalize()} transactions: {count}")
            
            print(f"\n3. Summary:")
            print(f"   Total transactions: {total_txns}")
            print(f"   Breakdown total: {breakdown_total}")
            print(f"   Missing from breakdown: {total_txns - breakdown_total}")
            
            conn.close()
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Error finding orphaned transactions: {e}")
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        sys.exit(1)

if __name__ == '__main__':
    find_orphaned_transactions()


