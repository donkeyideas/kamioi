#!/usr/bin/env python3
"""
Check database directly using the EXACT same query as the API
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import DatabaseManager

db_manager = DatabaseManager()
conn = db_manager.get_connection()
user_id = 108

print("=" * 60)
print("CHECKING DATABASE WITH EXACT API QUERY")
print("=" * 60)

try:
    if db_manager._use_postgresql:
        from sqlalchemy import text
        
        # Use EXACT same query as get_user_transactions
        query = text('''
            SELECT * FROM transactions 
            WHERE user_id = :user_id 
            ORDER BY date DESC, id DESC
            LIMIT :limit OFFSET :offset
        ''')
        result = conn.execute(query, {'user_id': user_id, 'limit': 1000, 'offset': 0})
        transactions = [dict(row._mapping) for row in result]
        
        print(f"PostgreSQL Query Result: {len(transactions)} transactions")
        
        if len(transactions) > 0:
            print(f"Sample transaction IDs: {[tx.get('id') for tx in transactions[:5]]}")
            print(f"Sample user_ids: {[tx.get('user_id') for tx in transactions[:5]]}")
            print(f"Sample merchants: {[tx.get('merchant') for tx in transactions[:5]]}")
            
            # Also check with a simpler query
            print("\n--- Checking with simpler COUNT query ---")
            count_result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            count = count_result.scalar() or 0
            print(f"COUNT query result: {count} transactions")
            
            # Check ALL transactions in table
            print("\n--- Checking ALL transactions in table ---")
            all_result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
            all_count = all_result.scalar() or 0
            print(f"Total transactions in table: {all_count}")
            
            # Check transactions by user_id distribution
            print("\n--- User ID distribution ---")
            dist_result = conn.execute(text('SELECT user_id, COUNT(*) as cnt FROM transactions GROUP BY user_id ORDER BY cnt DESC'))
            for row in dist_result:
                print(f"  User {row[0]}: {row[1]} transactions")
        else:
            print("No transactions found - database is clean")
        
        db_manager.release_connection(conn)
    else:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM transactions 
            WHERE user_id = ? 
            ORDER BY date DESC, id DESC
            LIMIT ? OFFSET ?
        ''', (user_id, 1000, 0))
        
        columns = [description[0] for description in cursor.description]
        transactions = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        print(f"SQLite Query Result: {len(transactions)} transactions")
        
        if len(transactions) > 0:
            print(f"Sample transaction IDs: {[tx.get('id') for tx in transactions[:5]]}")
        else:
            print("No transactions found - database is clean")
        
        cursor.close()
        conn.close()
        
except Exception as e:
    import traceback
    print(f"ERROR: {e}")
    traceback.print_exc()
    if db_manager._use_postgresql:
        db_manager.release_connection(conn)
    else:
        conn.close()

print("=" * 60)

