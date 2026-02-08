from database_manager import db_manager

conn = db_manager.get_connection()
use_postgresql = getattr(db_manager, '_use_postgresql', False)

user_id = 108

if use_postgresql:
    from sqlalchemy import text
    # Use the EXACT same query as business_transactions endpoint
    query = text('''
        SELECT id, user_id, merchant, amount, date, category, description,
               round_up, investable, total_debit, fee, status, ticker,
               shares, price_per_share, stock_price, created_at
        FROM transactions 
        WHERE user_id = CAST(:user_id AS INTEGER)
        ORDER BY date DESC NULLS LAST, id DESC
        LIMIT 1000
    ''')
    result = conn.execute(query, {'user_id': user_id})
    transactions = [dict(row._mapping) for row in result]
    
    print(f"Business transactions query result: {len(transactions)} transactions")
    if transactions:
        print(f"Sample transaction: {transactions[0]}")
    else:
        print("No transactions found with business transactions query")
        
        # Check all transactions
        result = conn.execute(text('SELECT user_id, COUNT(*) FROM transactions GROUP BY user_id'))
        print("\nAll user_ids with transactions:")
        for row in result:
            print(f"  user_id: {row[0]}, count: {row[1]}")
    
    db_manager.release_connection(conn)
else:
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, user_id, merchant, amount, date, category, description,
               round_up, investable, total_debit, fee, status, ticker,
               shares, price_per_share, stock_price, created_at
        FROM transactions 
        WHERE user_id = ?
        ORDER BY date DESC, id DESC
        LIMIT 1000
    ''', (user_id,))
    columns = [description[0] for description in cursor.description]
    transactions = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    print(f"Business transactions query result: {len(transactions)} transactions")
    if transactions:
        print(f"Sample transaction: {transactions[0]}")
    
    conn.close()

