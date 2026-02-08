#!/usr/bin/env python3
"""
Script to find where the $220.05 revenue is coming from
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def find_revenue_source():
    """Find the source of the revenue amount"""
    print("[FIND REVENUE] Searching for revenue source...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Check total transactions
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            total_txns = result.scalar() or 0
            print(f"\n1. Total transactions: {total_txns}")
            
            # Check revenue calculation (same as endpoint)
            result = conn.execute(text('SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE amount > 0 AND user_id != 2'))
            total_revenue = float(result.scalar() or 0)
            print(f"\n2. Total Revenue (amount > 0, user_id != 2): ${total_revenue:.2f}")
            
            if total_revenue > 0:
                # Find all transactions with positive amounts
                print("\n3. Transactions contributing to revenue:")
                result = conn.execute(text('''
                    SELECT 
                        t.id,
                        t.user_id,
                        t.merchant,
                        t.amount,
                        t.date,
                        t.description,
                        u.email,
                        u.account_type,
                        u.id as user_exists
                    FROM transactions t
                    LEFT JOIN users u ON t.user_id = u.id
                    WHERE t.amount > 0 AND t.user_id != 2
                    ORDER BY t.amount DESC
                '''))
                
                for row in result:
                    txn_id, user_id, merchant, amount, date, desc, email, account_type, user_exists = row
                    print(f"\n   Transaction ID: {txn_id}")
                    print(f"   - User ID: {user_id}")
                    if user_exists:
                        print(f"   - User email: {email}")
                        print(f"   - Account type: {account_type or 'NULL'}")
                    else:
                        print(f"   - [ORPHANED] User does not exist")
                    print(f"   - Merchant: {merchant}")
                    print(f"   - Amount: ${amount}")
                    print(f"   - Date: {date}")
                    print(f"   - Description: {desc or 'N/A'}")
            else:
                print("\n   [OK] No transactions with positive amounts found")
            
            # Check if there are any transactions at all
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            all_txns = result.scalar() or 0
            if all_txns > 0:
                print(f"\n4. All transactions (including negative/zero):")
                result = conn.execute(text('''
                    SELECT 
                        t.id,
                        t.user_id,
                        t.amount,
                        t.merchant,
                        u.email,
                        u.account_type
                    FROM transactions t
                    LEFT JOIN users u ON t.user_id = u.id
                    ORDER BY t.id
                '''))
                
                for row in result:
                    txn_id, user_id, amount, merchant, email, account_type = row
                    print(f"   Transaction {txn_id}: User {user_id} ({email or 'N/A'}), Amount: ${amount}, Merchant: {merchant}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions')
            total_txns = cursor.fetchone()[0] or 0
            print(f"\n1. Total transactions: {total_txns}")
            
            cursor.execute('SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE amount > 0 AND user_id != 2')
            total_revenue = float(cursor.fetchone()[0] or 0)
            print(f"\n2. Total Revenue: ${total_revenue:.2f}")
            
            if total_revenue > 0:
                cursor.execute('''
                    SELECT 
                        t.id,
                        t.user_id,
                        t.merchant,
                        t.amount,
                        t.date,
                        u.email,
                        u.account_type
                    FROM transactions t
                    LEFT JOIN users u ON t.user_id = u.id
                    WHERE t.amount > 0 AND t.user_id != 2
                    ORDER BY t.amount DESC
                ''')
                
                for row in cursor.fetchall():
                    print(f"\n   Transaction {row[0]}: User {row[1]}, Amount: ${row[3]}, Merchant: {row[2]}")
            
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
    find_revenue_source()


