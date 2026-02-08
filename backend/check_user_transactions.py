import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def check_user_transactions():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    user_email = 'beltranalain@gmail.com'
    print(f"Checking transactions for user: {user_email}")
    print("=" * 50)
    
    # Get user ID
    cursor.execute("SELECT id FROM users WHERE email = ?", (user_email,))
    user_result = cursor.fetchone()
    
    if not user_result:
        print("User not found!")
        return
    
    user_id = user_result[0]
    print(f"User ID: {user_id}")
    
    # Check transactions for this user
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,))
    count = cursor.fetchone()[0]
    print(f"Transaction count: {count}")
    
    if count > 0:
        # Show sample transactions
        cursor.execute("""
            SELECT amount, merchant, category, date, description 
            FROM transactions 
            WHERE user_id = ? 
            ORDER BY date DESC 
            LIMIT 5
        """, (user_id,))
        
        transactions = cursor.fetchall()
        print("\nSample transactions:")
        for i, txn in enumerate(transactions, 1):
            amount, merchant, category, date, description = txn
            print(f"  {i}. ${amount} - {merchant} ({category}) - {date}")
    
    # Check all transactions in database
    cursor.execute("SELECT COUNT(*) FROM transactions")
    total_count = cursor.fetchone()[0]
    print(f"\nTotal transactions in database: {total_count}")
    
    # Check user IDs in transactions
    cursor.execute("SELECT DISTINCT user_id FROM transactions")
    user_ids = [row[0] for row in cursor.fetchall()]
    print(f"User IDs with transactions: {user_ids}")
    
    conn.close()

if __name__ == "__main__":
    check_user_transactions()
