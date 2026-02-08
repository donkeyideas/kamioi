#!/usr/bin/env python3
"""Test the business transactions API endpoint directly"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager

def test_endpoint():
    """Test what get_user_transactions returns"""
    user_id = 108
    
    print("=" * 60)
    print(f"TESTING get_user_transactions({user_id})")
    print("=" * 60)
    
    # Test the actual function
    transactions = db_manager.get_user_transactions(user_id, limit=1000, offset=0)
    
    print(f"\n[RESULT] get_user_transactions returned: {len(transactions)} transactions")
    
    if transactions:
        print(f"\n[FIRST 5 TRANSACTIONS]")
        for i, tx in enumerate(transactions[:5]):
            print(f"   {i+1}. ID: {tx.get('id')}, User ID: {tx.get('user_id')}, Merchant: {tx.get('merchant')}, Status: {tx.get('status')}")
        
        # Check user_ids
        user_ids = set([tx.get('user_id') for tx in transactions])
        print(f"\n[USER IDs] Transactions belong to user_ids: {sorted(user_ids)}")
        
        # Count by user_id
        from collections import Counter
        user_id_counts = Counter([tx.get('user_id') for tx in transactions])
        print(f"\n[COUNTS BY USER ID]")
        for uid, count in user_id_counts.most_common():
            print(f"   User {uid}: {count} transactions")
    else:
        print("\n[RESULT] No transactions returned (empty array)")
    
    # Also check database directly
    print(f"\n[DIRECT DB QUERY] Checking database directly...")
    conn = db_manager.get_connection()
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            count = result.scalar() or 0
            print(f"   Direct query count: {count}")
            
            if count > 0:
                result = conn.execute(text('''
                    SELECT id, user_id, merchant, status
                    FROM transactions
                    WHERE user_id = :uid
                    ORDER BY id DESC
                    LIMIT 10
                '''), {'uid': user_id})
                rows = result.fetchall()
                print(f"   Sample transactions:")
                for row in rows:
                    print(f"      ID: {row[0]}, User: {row[1]}, Merchant: {row[2]}, Status: {row[3]}")
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
            count = cursor.fetchone()[0] or 0
            print(f"   Direct query count: {count}")
        
        db_manager.release_connection(conn) if db_manager._use_postgresql else conn.close()
    except Exception as e:
        print(f"   Error: {e}")
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == "__main__":
    test_endpoint()
