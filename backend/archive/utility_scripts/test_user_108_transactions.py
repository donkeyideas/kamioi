import requests
import json
from database_manager import db_manager

# Get connection
conn = db_manager.get_connection()
use_postgresql = getattr(db_manager, '_use_postgresql', False)

user_id = 108

if use_postgresql:
    from sqlalchemy import text
    result = conn.execute(text('''
        SELECT 
            COUNT(*) as total,
            COALESCE(SUM(round_up), 0) as total_round_ups,
            COALESCE(SUM(fee), 0) as total_fees,
            COUNT(CASE WHEN ticker IS NOT NULL THEN 1 END) as mapped_count,
            COUNT(CASE WHEN status = 'mapped' OR status = 'completed' THEN 1 END) as processed_count
        FROM transactions 
        WHERE user_id = CAST(:user_id AS INTEGER)
    '''), {'user_id': user_id})
    row = result.fetchone()
    print("PostgreSQL Query Results:")
    print(f"  Total transactions: {row[0]}")
    print(f"  Total round-ups: ${row[1]}")
    print(f"  Total fees: ${row[2]}")
    print(f"  Mapped count: {row[3]}")
    print(f"  Processed count: {row[4]}")
    
    # Get sample transactions
    result = conn.execute(text('''
        SELECT id, merchant, amount, round_up, fee, ticker, status
        FROM transactions 
        WHERE user_id = CAST(:user_id AS INTEGER)
        LIMIT 5
    '''), {'user_id': user_id})
    print("\nSample transactions:")
    for tx in result:
        print(f"  ID: {tx[0]}, Merchant: {tx[1]}, Amount: ${tx[2]}, Round-up: ${tx[3]}, Fee: ${tx[4]}, Ticker: {tx[5]}, Status: {tx[6]}")
    
    db_manager.release_connection(conn)
else:
    cur = conn.cursor()
    cur.execute('''
        SELECT 
            COUNT(*) as total,
            COALESCE(SUM(round_up), 0) as total_round_ups,
            COALESCE(SUM(fee), 0) as total_fees,
            COUNT(CASE WHEN ticker IS NOT NULL THEN 1 END) as mapped_count,
            COUNT(CASE WHEN status = 'mapped' OR status = 'completed' THEN 1 END) as processed_count
        FROM transactions 
        WHERE user_id = ?
    ''', (user_id,))
    row = cur.fetchone()
    print("SQLite Query Results:")
    print(f"  Total transactions: {row[0]}")
    print(f"  Total round-ups: ${row[1]}")
    print(f"  Total fees: ${row[2]}")
    print(f"  Mapped count: {row[3]}")
    print(f"  Processed count: {row[4]}")
    
    # Get sample transactions
    cur.execute('''
        SELECT id, merchant, amount, round_up, fee, ticker, status
        FROM transactions 
        WHERE user_id = ?
        LIMIT 5
    ''', (user_id,))
    print("\nSample transactions:")
    for tx in cur.fetchall():
        print(f"  ID: {tx[0]}, Merchant: {tx[1]}, Amount: ${tx[2]}, Round-up: ${tx[3]}, Fee: ${tx[4]}, Ticker: {tx[5]}, Status: {tx[6]}")
    
    conn.close()

