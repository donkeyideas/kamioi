#!/usr/bin/env python3
"""
Add transactions to demo_user@kamioi.com for testing

Run with: python utilities/add_demo_transactions.py
"""

import os
import sys
import random
from datetime import datetime, timedelta

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
sys.path.insert(0, backend_dir)

try:
    import psycopg2
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


# Sample merchants with tickers and categories
MERCHANTS = [
    ("Starbucks", "SBUX", "Food & Beverage"),
    ("Amazon", "AMZN", "E-commerce"),
    ("Apple Store", "AAPL", "Technology"),
    ("Walmart", "WMT", "Retail"),
    ("Target", "TGT", "Retail"),
    ("McDonald's", "MCD", "Food & Beverage"),
    ("Netflix", "NFLX", "Entertainment"),
    ("Uber", "UBER", "Transportation"),
    ("Home Depot", "HD", "Home Improvement"),
    ("Nike", "NKE", "Apparel"),
    ("Costco", "COST", "Retail"),
    ("CVS Pharmacy", "CVS", "Healthcare"),
    ("Shell Gas", "SHEL", "Energy"),
    ("Spotify", "SPOT", "Entertainment"),
    ("Chipotle", "CMG", "Food & Beverage"),
]


def get_db_connection():
    """Get database connection from environment"""
    # Try to load from .env file
    env_file = os.path.join(backend_dir, '.env')
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ.setdefault(key, value)

    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        print("Set it directly or create backend/.env file")
        sys.exit(1)

    return psycopg2.connect(database_url)


def main():
    print("=" * 60)
    print("Add Demo Transactions")
    print("=" * 60)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Find demo_user@kamioi.com
    cursor.execute("SELECT id, email, name FROM users WHERE LOWER(email) = LOWER(%s)", ('demo_user@kamioi.com',))
    user = cursor.fetchone()

    if not user:
        print("\n[!] User demo_user@kamioi.com not found. Creating...")
        from werkzeug.security import generate_password_hash
        hashed_password = generate_password_hash("Demo123!")
        cursor.execute("""
            INSERT INTO users (email, password, name, account_type, created_at)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING id
        """, ('demo_user@kamioi.com', hashed_password, 'Demo User', 'individual'))
        user_id = cursor.fetchone()[0]
        conn.commit()
        print(f"[OK] Created user with ID: {user_id}")
    else:
        user_id = user[0]
        print(f"\n[OK] Found user: {user[1]} (ID: {user_id})")

    # Check existing transactions
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = %s", (user_id,))
    existing_count = cursor.fetchone()[0]
    print(f"[INFO] User has {existing_count} existing transactions")

    # Add 20 new transactions
    num_transactions = 20
    now = datetime.now()

    print(f"\n[...] Adding {num_transactions} new transactions...")

    for i in range(num_transactions):
        merchant, ticker, category = random.choice(MERCHANTS)
        amount = round(random.uniform(5, 150), 2)
        round_up = round(1 - (amount % 1), 2) if (amount % 1) > 0 else round(random.uniform(0.01, 0.99), 2)
        date = now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        fee = round(amount * 0.001, 2)  # 0.1% fee
        total_debit = round(amount + round_up + fee, 2)
        description = f"Purchase at {merchant}"

        cursor.execute("""
            INSERT INTO transactions
            (user_id, amount, merchant, category, date, description, round_up, fee, total_debit, status, account_type, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, amount, merchant, category, date, description,
            round_up, fee, total_debit, 'completed', 'individual', date
        ))

        print(f"  [{i+1}] {merchant}: ${amount} (round-up: ${round_up})")

    conn.commit()

    # Verify
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = %s", (user_id,))
    new_count = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    print(f"\n" + "=" * 60)
    print(f"DONE!")
    print(f"=" * 60)
    print(f"  Added: {num_transactions} transactions")
    print(f"  Total: {new_count} transactions for demo_user@kamioi.com")
    print(f"\n  Login: demo_user@kamioi.com")
    print(f"  Password: Demo123!")
    print("=" * 60)


if __name__ == '__main__':
    main()
