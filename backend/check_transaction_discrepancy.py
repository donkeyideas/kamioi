#!/usr/bin/env python3
"""
Script to check for transaction counting discrepancies
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def check_discrepancy():
    """Check for transaction counting discrepancies"""
    print("[CHECK] Starting transaction discrepancy check...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Get all account_types in the database
            print("\n1. Checking all account_types in users table...")
            result = conn.execute(text('SELECT DISTINCT account_type FROM users ORDER BY account_type'))
            account_types = [row[0] for row in result if row[0]]
            print(f"   Found account_types: {account_types}")
            
            # Get transactions count by each account_type
            print("\n2. Transaction counts by account_type:")
            for account_type in account_types:
                result = conn.execute(text('''
                    SELECT COUNT(*) FROM transactions t
                    JOIN users u ON t.user_id = u.id
                    WHERE u.account_type = :account_type
                '''), {'account_type': account_type})
                count = result.scalar() or 0
                print(f"   '{account_type}': {count} transactions")
            
            # Check for NULL account_type
            result = conn.execute(text('''
                SELECT COUNT(*) FROM transactions t
                JOIN users u ON t.user_id = u.id
                WHERE u.account_type IS NULL
            '''))
            null_count = result.scalar() or 0
            if null_count > 0:
                print(f"   NULL account_type: {null_count} transactions")
            
            # Get total
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            total = result.scalar() or 0
            print(f"\n3. Total transactions: {total}")
            
            # Get breakdown sum
            breakdown_sum = 0
            for account_type in ['individual', 'family', 'business', 'admin']:
                result = conn.execute(text('''
                    SELECT COUNT(*) FROM transactions t
                    JOIN users u ON t.user_id = u.id
                    WHERE u.account_type = :account_type
                '''), {'account_type': account_type})
                count = result.scalar() or 0
                breakdown_sum += count
            
            print(f"   Breakdown sum (individual+family+business+admin): {breakdown_sum}")
            print(f"   Difference: {total - breakdown_sum}")
            
            if total != breakdown_sum:
                print(f"\n4. Investigating difference of {total - breakdown_sum}...")
                # Check for any account_type not in the standard list
                result = conn.execute(text('''
                    SELECT DISTINCT u.account_type, COUNT(t.id) as tx_count
                    FROM transactions t
                    JOIN users u ON t.user_id = u.id
                    WHERE u.account_type NOT IN ('individual', 'family', 'business', 'admin')
                       OR u.account_type IS NULL
                    GROUP BY u.account_type
                '''))
                for row in result:
                    print(f"   Account type '{row[0] or 'NULL'}': {row[1]} transactions")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            
            cursor.execute('SELECT DISTINCT account_type FROM users WHERE account_type IS NOT NULL ORDER BY account_type')
            account_types = [row[0] for row in cursor.fetchall()]
            print(f"\n1. Found account_types: {account_types}")
            
            print("\n2. Transaction counts by account_type:")
            for account_type in account_types:
                cursor.execute('''
                    SELECT COUNT(*) FROM transactions t
                    JOIN users u ON t.user_id = u.id
                    WHERE u.account_type = ?
                ''', (account_type,))
                count = cursor.fetchone()[0] or 0
                print(f"   '{account_type}': {count} transactions")
            
            cursor.execute('SELECT COUNT(*) FROM transactions')
            total = cursor.fetchone()[0] or 0
            print(f"\n3. Total transactions: {total}")
            
            breakdown_sum = 0
            for account_type in ['individual', 'family', 'business', 'admin']:
                cursor.execute('''
                    SELECT COUNT(*) FROM transactions t
                    JOIN users u ON t.user_id = u.id
                    WHERE u.account_type = ?
                ''', (account_type,))
                count = cursor.fetchone()[0] or 0
                breakdown_sum += count
            
            print(f"   Breakdown sum: {breakdown_sum}")
            print(f"   Difference: {total - breakdown_sum}")
            
            conn.close()
        
    except Exception as e:
        import traceback
        print(f"[ERROR] {e}")
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == '__main__':
    check_discrepancy()


