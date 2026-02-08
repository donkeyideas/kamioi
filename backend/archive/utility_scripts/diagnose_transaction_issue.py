#!/usr/bin/env python3
"""Diagnose transaction storage issue"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager

def diagnose():
    """Diagnose why transactions show in UI but not in database"""
    print("=" * 60)
    print("TRANSACTION STORAGE DIAGNOSTIC")
    print("=" * 60)
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # 1. Check user 108 exists
            result = conn.execute(text('SELECT id, email, name, account_number FROM users WHERE id = 108'))
            user = result.fetchone()
            if user:
                print(f"\n[USER] Found user 108:")
                print(f"   ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Account: {user[3]}")
            else:
                print("\n[ERROR] User 108 not found!")
            
            # 2. Count ALL transactions
            result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            total = result.scalar() or 0
            print(f"\n[TOTAL] All transactions in database: {total}")
            
            # 3. Count transactions for user 108
            result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = 108'))
            count_108 = result.scalar() or 0
            print(f"[USER 108] Transactions: {count_108}")
            
            # 4. Check if user_id is stored as string
            result = conn.execute(text("SELECT COUNT(*) FROM transactions WHERE user_id::text = '108'"))
            count_str = result.scalar() or 0
            print(f"[USER 108] Transactions (as string): {count_str}")
            
            # 5. Get all unique user_ids with transaction counts
            result = conn.execute(text('''
                SELECT user_id, COUNT(*) as count
                FROM transactions
                GROUP BY user_id
                ORDER BY count DESC
                LIMIT 20
            '''))
            user_counts = result.fetchall()
            print(f"\n[ALL USERS] Transaction counts:")
            for uid, count in user_counts:
                print(f"   User ID {uid}: {count} transactions")
            
            # 6. Check recent transactions (last 20)
            result = conn.execute(text('''
                SELECT id, user_id, merchant, status, created_at, date
                FROM transactions
                ORDER BY created_at DESC, id DESC
                LIMIT 20
            '''))
            recent = result.fetchall()
            print(f"\n[RECENT] Last 20 transactions:")
            for tx in recent:
                print(f"   ID: {tx[0]}, User: {tx[1]}, Merchant: {tx[2]}, Status: {tx[3]}, Created: {tx[4]}, Date: {tx[5]}")
            
            # 7. Check if there are transactions with similar merchants to what we see in UI
            merchants_to_check = ['Office Depot', 'Staples', 'QuickBooks', 'Verizon Business', 'Amazon Business']
            print(f"\n[MERCHANT CHECK] Looking for specific merchants:")
            for merchant in merchants_to_check:
                result = conn.execute(text('''
                    SELECT id, user_id, merchant, status
                    FROM transactions
                    WHERE merchant ILIKE :pattern
                    ORDER BY created_at DESC
                    LIMIT 5
                '''), {'pattern': f'%{merchant}%'})
                matches = result.fetchall()
                if matches:
                    print(f"   {merchant}: Found {len(matches)} transactions")
                    for match in matches:
                        print(f"      ID: {match[0]}, User: {match[1]}, Status: {match[3]}")
                else:
                    print(f"   {merchant}: NOT FOUND")
            
            # 8. Check if there's a different table or view
            result = conn.execute(text('''
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE '%transaction%'
                ORDER BY table_name
            '''))
            tables = result.fetchall()
            print(f"\n[TABLES] Transaction-related tables:")
            for table in tables:
                print(f"   {table[0]}")
            
            # 9. Check for pending transactions specifically
            result = conn.execute(text('''
                SELECT COUNT(*) FROM transactions WHERE status = 'pending'
            '''))
            pending_count = result.scalar() or 0
            print(f"\n[STATUS] Pending transactions: {pending_count}")
            
            result = conn.execute(text('''
                SELECT COUNT(*) FROM transactions WHERE status = 'mapped'
            '''))
            mapped_count = result.scalar() or 0
            print(f"[STATUS] Mapped transactions: {mapped_count}")
            
        else:
            cursor = conn.cursor()
            
            # SQLite version
            cursor.execute('SELECT id, email, name, account_number FROM users WHERE id = 108')
            user = cursor.fetchone()
            if user:
                print(f"\n[USER] Found user 108:")
                print(f"   ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Account: {user[3]}")
            
            cursor.execute('SELECT COUNT(*) FROM transactions')
            total = cursor.fetchone()[0] or 0
            print(f"\n[TOTAL] All transactions: {total}")
            
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = 108')
            count_108 = cursor.fetchone()[0] or 0
            print(f"[USER 108] Transactions: {count_108}")
            
            cursor.execute('''
                SELECT user_id, COUNT(*) as count
                FROM transactions
                GROUP BY user_id
                ORDER BY count DESC
                LIMIT 20
            ''')
            user_counts = cursor.fetchall()
            print(f"\n[ALL USERS] Transaction counts:")
            for uid, count in user_counts:
                print(f"   User ID {uid}: {count} transactions")
        
    except Exception as e:
        import traceback
        print(f"\n[ERROR] {e}")
        print(traceback.format_exc())
    finally:
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == "__main__":
    diagnose()

