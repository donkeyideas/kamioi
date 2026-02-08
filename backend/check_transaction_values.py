from database_manager import db_manager

conn = db_manager.get_connection()
use_postgresql = getattr(db_manager, '_use_postgresql', False)
user_id = 108

if use_postgresql:
    from sqlalchemy import text
    # Get sample transactions with actual values
    result = conn.execute(text('''
        SELECT id, merchant, amount, round_up, fee, ticker, status, date
        FROM transactions 
        WHERE user_id = CAST(:user_id AS INTEGER)
        LIMIT 5
    '''), {'user_id': user_id})
    
    print(f"Sample transactions for user {user_id}:")
    for row in result:
        print(f"  ID: {row[0]}, Merchant: {row[1]}, Amount: ${row[2]}, Round-up: ${row[3]}, Fee: ${row[4]}, Ticker: {row[5]}, Status: {row[6]}, Date: {row[7]}")
    
    # Check sums
    result = conn.execute(text('''
        SELECT 
            COUNT(*) as count,
            SUM(round_up) as sum_round_up,
            SUM(fee) as sum_fee,
            COUNT(CASE WHEN round_up IS NOT NULL AND round_up > 0 THEN 1 END) as round_up_count,
            COUNT(CASE WHEN fee IS NOT NULL AND fee > 0 THEN 1 END) as fee_count
        FROM transactions 
        WHERE user_id = CAST(:user_id AS INTEGER)
    '''), {'user_id': user_id})
    row = result.fetchone()
    print(f"\nAggregates:")
    print(f"  Total count: {row[0]}")
    print(f"  SUM(round_up): {row[1]}")
    print(f"  SUM(fee): {row[2]}")
    print(f"  Transactions with round_up > 0: {row[3]}")
    print(f"  Transactions with fee > 0: {row[4]}")
    
    db_manager.release_connection(conn)
else:
    cur = conn.cursor()
    cur.execute('''
        SELECT id, merchant, amount, round_up, fee, ticker, status, date
        FROM transactions 
        WHERE user_id = ?
        LIMIT 5
    ''', (user_id,))
    print(f"Sample transactions for user {user_id}:")
    for row in cur.fetchall():
        print(f"  ID: {row[0]}, Merchant: {row[1]}, Amount: ${row[2]}, Round-up: ${row[3]}, Fee: ${row[4]}, Ticker: {row[5]}, Status: {row[6]}, Date: {row[7]}")
    
    conn.close()

