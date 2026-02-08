import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def check_transaction_saving():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Checking transaction saving process...")
    print("=" * 50)
    
    # Check total transactions
    cursor.execute("SELECT COUNT(*) FROM transactions")
    total_transactions = cursor.fetchone()[0]
    print(f"Total transactions in database: {total_transactions}")
    
    # Check transactions by user ID
    cursor.execute("SELECT DISTINCT user_id FROM transactions")
    user_ids = [row[0] for row in cursor.fetchall()]
    print(f"User IDs with transactions: {user_ids}")
    
    # Check recent transactions
    cursor.execute("""
        SELECT user_id, amount, merchant, category, date, status 
        FROM transactions 
        ORDER BY created_at DESC 
        LIMIT 10
    """)
    
    recent = cursor.fetchall()
    print(f"\nRecent transactions ({len(recent)}):")
    for txn in recent:
        user_id, amount, merchant, category, date, status = txn
        print(f"  User {user_id}: ${amount} - {merchant} ({category}) - {status}")
    
    # Check if there are any pending transactions
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE status = 'pending'")
    pending_count = cursor.fetchone()[0]
    print(f"\nPending transactions: {pending_count}")
    
    # Check if there are any transactions with 'Unknown' category
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE category = 'Unknown'")
    unknown_count = cursor.fetchone()[0]
    print(f"Unknown category transactions: {unknown_count}")
    
    conn.close()

if __name__ == "__main__":
    check_transaction_saving()
