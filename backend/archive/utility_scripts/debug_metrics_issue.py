from database_manager import db_manager
from sqlalchemy import text

conn = db_manager.get_connection()
use_postgresql = getattr(db_manager, '_use_postgresql', False)
user_id = 108

print(f"Testing query for user_id={user_id} (type: {type(user_id)})")

if use_postgresql:
    # Test the exact query from _calculate_user_metrics
    query = text('''
        SELECT id, user_id, merchant, amount, round_up, fee, ticker, status
        FROM transactions 
        WHERE user_id = CAST(:user_id AS INTEGER)
        ORDER BY date DESC NULLS LAST, id DESC
        LIMIT 5
    ''')
    result = conn.execute(query, {'user_id': user_id})
    transactions = [dict(row._mapping) for row in result]
    
    print(f"\nQuery result: {len(transactions)} transactions")
    if transactions:
        for tx in transactions[:3]:
            print(f"  ID: {tx['id']}, user_id: {tx['user_id']} (type: {type(tx['user_id'])}), round_up: {tx.get('round_up')}, fee: {tx.get('fee')}")
    else:
        print("  No transactions found!")
        
        # Check what user_ids actually exist
        result = conn.execute(text('SELECT DISTINCT user_id FROM transactions LIMIT 10'))
        print("\nUser IDs in transactions table:")
        for row in result:
            print(f"  user_id: {row[0]} (type: {type(row[0])})")
        
        # Try without CAST
        query2 = text('SELECT COUNT(*) FROM transactions WHERE user_id = :user_id')
        result2 = conn.execute(query2, {'user_id': user_id})
        count2 = result2.scalar()
        print(f"\nQuery without CAST: {count2} transactions")
        
        # Try with string
        query3 = text('SELECT COUNT(*) FROM transactions WHERE user_id::text = :user_id')
        result3 = conn.execute(query3, {'user_id': str(user_id)})
        count3 = result3.scalar()
        print(f"Query with user_id::text: {count3} transactions")
    
    db_manager.release_connection(conn)

