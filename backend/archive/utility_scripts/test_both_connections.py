from database_manager import db_manager
from sqlalchemy import text

user_id = 108

print("Testing with business_transactions endpoint connection method:")
# Use the same connection method as business_transactions
conn = db_manager.get_connection()
try:
    query = text('''
        SELECT id, user_id, merchant, amount, round_up, fee, ticker, status
        FROM transactions 
        WHERE user_id = CAST(:user_id AS INTEGER)
        ORDER BY date DESC NULLS LAST, id DESC
        LIMIT 5
    ''')
    result = conn.execute(query, {'user_id': user_id})
    transactions = [dict(row._mapping) for row in result]
    
    print(f"Found {len(transactions)} transactions")
    if transactions:
        for tx in transactions[:3]:
            print(f"  ID: {tx['id']}, round_up: {tx.get('round_up')}, fee: {tx.get('fee')}")
    else:
        print("  No transactions found")
        
        # Check all user_ids
        result = conn.execute(text('SELECT user_id, COUNT(*) FROM transactions GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 10'))
        print("\nAll user_ids with transactions:")
        for row in result:
            print(f"  user_id: {row[0]}, count: {row[1]}")
finally:
    if db_manager._use_postgresql:
        db_manager.release_connection(conn)
    else:
        conn.close()

print("\n" + "="*50)
print("Testing with _calculate_user_metrics connection method:")
# Use the same connection method as _calculate_user_metrics
conn2 = db_manager.get_connection()
try:
    query2 = text('''
        SELECT id, user_id, merchant, amount, round_up, fee, ticker, status
        FROM transactions 
        WHERE user_id = CAST(:user_id AS INTEGER)
        ORDER BY date DESC NULLS LAST, id DESC
        LIMIT 5
    ''')
    result2 = conn2.execute(query2, {'user_id': user_id})
    transactions2 = [dict(row._mapping) for row in result2]
    
    print(f"Found {len(transactions2)} transactions")
    if transactions2:
        for tx in transactions2[:3]:
            print(f"  ID: {tx['id']}, round_up: {tx.get('round_up')}, fee: {tx.get('fee')}")
    else:
        print("  No transactions found")
finally:
    if db_manager._use_postgresql:
        db_manager.release_connection(conn2)
    else:
        conn2.close()

