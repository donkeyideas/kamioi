#!/usr/bin/env python3
"""
Script to find all round-up allocations and see which user types they belong to
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def find_roundup_allocations():
    """Find all round-up allocations and their user types"""
    print("[FIND ROUNDUP] Searching for round-up allocations...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Total count
            result = conn.execute(text('SELECT COUNT(*) FROM round_up_allocations'))
            total = result.scalar() or 0
            print(f"\n1. Total round_up_allocations: {total}")
            
            if total > 0:
                # Get all round-up allocations with user info
                print("\n2. Round-up allocations by user type:")
                result = conn.execute(text('''
                    SELECT 
                        ra.id,
                        ra.transaction_id,
                        t.user_id,
                        u.email,
                        u.account_type,
                        u.id as user_exists
                    FROM round_up_allocations ra
                    LEFT JOIN transactions t ON ra.transaction_id = t.id
                    LEFT JOIN users u ON t.user_id = u.id
                    ORDER BY ra.id
                '''))
                
                for row in result:
                    ra_id, tx_id, user_id, email, account_type, user_exists = row
                    print(f"\n   Round-up Allocation ID: {ra_id}")
                    print(f"   - Transaction ID: {tx_id}")
                    print(f"   - User ID: {user_id}")
                    if user_exists:
                        print(f"   - User email: {email}")
                        print(f"   - Account type: {account_type or 'NULL'}")
                    else:
                        print(f"   - [ORPHANED] User does not exist or transaction does not exist")
                    
                # Count by account_type
                print("\n3. Count by account_type:")
                for account_type in ['individual', 'family', 'business', 'admin']:
                    result = conn.execute(text('''
                        SELECT COUNT(*) FROM round_up_allocations ra
                        JOIN transactions t ON ra.transaction_id = t.id
                        JOIN users u ON t.user_id = u.id
                        WHERE u.account_type = :account_type
                    '''), {'account_type': account_type})
                    count = result.scalar() or 0
                    print(f"   {account_type.capitalize()}: {count}")
                
                # Check for NULL or invalid account_type
                result = conn.execute(text('''
                    SELECT COUNT(*) FROM round_up_allocations ra
                    JOIN transactions t ON ra.transaction_id = t.id
                    JOIN users u ON t.user_id = u.id
                    WHERE u.account_type IS NULL 
                       OR u.account_type NOT IN ('individual', 'family', 'business', 'admin')
                '''))
                invalid_count = result.scalar() or 0
                if invalid_count > 0:
                    print(f"   Other (NULL/invalid): {invalid_count}")
                
                # Check for orphaned (no transaction or no user)
                result = conn.execute(text('''
                    SELECT COUNT(*) FROM round_up_allocations ra
                    LEFT JOIN transactions t ON ra.transaction_id = t.id
                    LEFT JOIN users u ON t.user_id = u.id
                    WHERE t.id IS NULL OR u.id IS NULL
                '''))
                orphaned_count = result.scalar() or 0
                if orphaned_count > 0:
                    print(f"   Orphaned (no transaction/user): {orphaned_count}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM round_up_allocations')
            total = cursor.fetchone()[0] or 0
            print(f"\n1. Total round_up_allocations: {total}")
            
            if total > 0:
                cursor.execute('''
                    SELECT 
                        ra.id,
                        ra.transaction_id,
                        t.user_id,
                        u.email,
                        u.account_type,
                        u.id
                    FROM round_up_allocations ra
                    LEFT JOIN transactions t ON ra.transaction_id = t.id
                    LEFT JOIN users u ON t.user_id = u.id
                    ORDER BY ra.id
                ''')
                
                for row in cursor.fetchall():
                    ra_id, tx_id, user_id, email, account_type, user_exists = row
                    print(f"\n   Round-up Allocation ID: {ra_id}")
                    print(f"   - Transaction ID: {tx_id}")
                    print(f"   - User ID: {user_id}")
                    if user_exists:
                        print(f"   - User email: {email}")
                        print(f"   - Account type: {account_type or 'NULL'}")
                    else:
                        print(f"   - [ORPHANED] User does not exist or transaction does not exist")
                
                for account_type in ['individual', 'family', 'business', 'admin']:
                    cursor.execute('''
                        SELECT COUNT(*) FROM round_up_allocations ra
                        JOIN transactions t ON ra.transaction_id = t.id
                        JOIN users u ON t.user_id = u.id
                        WHERE u.account_type = ?
                    ''', (account_type,))
                    count = cursor.fetchone()[0] or 0
                    print(f"   {account_type.capitalize()}: {count}")
            
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
    find_roundup_allocations()


