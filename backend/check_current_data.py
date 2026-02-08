import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def check_current_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Checking current database state...")
    print("=" * 50)
    
    # Check total transactions
    cursor.execute("SELECT COUNT(*) FROM transactions")
    total_transactions = cursor.fetchone()[0]
    print(f"Total transactions: {total_transactions}")
    
    # Check users
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]
    print(f"Total users: {total_users}")
    
    # Check specific user
    cursor.execute("SELECT id, email, name FROM users WHERE email = 'beltranalain@gmail.com'")
    user = cursor.fetchone()
    if user:
        user_id, email, name = user
        print(f"User found: {name} ({email}) - ID: {user_id}")
        
        # Check user's transactions
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,))
        user_transactions = cursor.fetchone()[0]
        print(f"User transactions: {user_transactions}")
        
        # Show recent transactions
        cursor.execute("""
            SELECT amount, merchant, category, date 
            FROM transactions 
            WHERE user_id = ? 
            ORDER BY date DESC 
            LIMIT 3
        """, (user_id,))
        
        recent = cursor.fetchall()
        print("Recent transactions:")
        for txn in recent:
            amount, merchant, category, date = txn
            print(f"  ${amount} - {merchant} ({category})")
    else:
        print("User beltranalain@gmail.com not found")
    
    conn.close()

if __name__ == "__main__":
    check_current_data()
