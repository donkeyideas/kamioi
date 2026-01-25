#!/usr/bin/env python3
"""
Add transactions to demo_user@kamioi.com for testing the COMPLETE FLOW

This script creates transactions that go through the proper Kamioi pipeline:
1. Insert transaction with status='pending'
2. Run auto-mapping to find ticker
3. Update status to 'mapped' if high-confidence match found

Then use the /api/admin/investments/process-mapped endpoint to:
4. Execute Alpaca trades
5. Update portfolios
6. Mark as 'completed'

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
# These MUST exist in llm_mappings with status='approved' for auto-mapping to work
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


def find_best_mapping(cursor, merchant_name):
    """Find best mapping for merchant name in llm_mappings table"""
    try:
        # Search for exact matches first
        cursor.execute("""
            SELECT merchant_name, ticker_symbol, category, confidence
            FROM llm_mappings
            WHERE status = 'approved'
            AND LOWER(merchant_name) LIKE LOWER(%s)
            ORDER BY confidence DESC
            LIMIT 1
        """, (f"%{merchant_name}%",))

        match = cursor.fetchone()
        if match:
            return {
                'merchant_name': match[0],
                'ticker_symbol': match[1],
                'category': match[2],
                'confidence': float(match[3]) if match[3] else 0.0
            }
        return None
    except Exception as e:
        print(f"  Warning: Error finding mapping for {merchant_name}: {e}")
        return None


def ensure_merchant_mapping(cursor, merchant, ticker, category):
    """Ensure merchant exists in llm_mappings with approved status"""
    cursor.execute("""
        SELECT id FROM llm_mappings
        WHERE merchant_name = %s AND status = 'approved'
        LIMIT 1
    """, (merchant,))

    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO llm_mappings
            (merchant_name, ticker_symbol, category, confidence, status, admin_approved, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        """, (merchant, ticker, category, 0.95, 'approved', 1))
        return True  # Created new mapping
    return False  # Already existed


def main():
    print("=" * 70)
    print("KAMIOI DEMO TRANSACTIONS - COMPLETE FLOW TEST")
    print("=" * 70)

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

    # First, ensure all demo merchants are in llm_mappings
    print("\n[STEP 1] Ensuring merchant mappings exist...")
    mappings_created = 0
    for merchant, ticker, category in MERCHANTS:
        if ensure_merchant_mapping(cursor, merchant, ticker, category):
            mappings_created += 1
    conn.commit()
    print(f"  Created {mappings_created} new merchant mappings")

    # Add transactions with PROPER FLOW
    num_transactions = 20
    now = datetime.now()

    print(f"\n[STEP 2] Adding {num_transactions} transactions with proper flow...")
    print("  Status: pending → auto-map → mapped (if high confidence)")

    transactions_added = []
    mapped_count = 0
    pending_count = 0

    for i in range(num_transactions):
        merchant, expected_ticker, category = random.choice(MERCHANTS)
        amount = round(random.uniform(5, 150), 2)
        round_up = round(1 - (amount % 1), 2) if (amount % 1) > 0 else round(random.uniform(0.01, 0.99), 2)
        date = now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        fee = round(amount * 0.001, 2)  # 0.1% fee
        total_debit = round(amount + round_up + fee, 2)
        description = f"Purchase at {merchant}"

        # Insert transaction with 'pending' status (THE CORRECT WAY)
        cursor.execute("""
            INSERT INTO transactions
            (user_id, amount, merchant, category, date, description, round_up, fee, total_debit, status, account_type, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, amount, merchant, category, date, description,
            round_up, fee, total_debit, 'pending', 'individual', date
        ))
        transaction_id = cursor.fetchone()[0]

        # Run auto-mapping (THE REAL FLOW)
        mapping = find_best_mapping(cursor, merchant)

        if mapping and mapping['confidence'] > 0.8:
            # High confidence match - update to 'mapped' with ticker
            cursor.execute("""
                UPDATE transactions
                SET status = 'mapped', ticker = %s, category = %s
                WHERE id = %s
            """, (mapping['ticker_symbol'], mapping['category'], transaction_id))
            final_status = 'mapped'
            final_ticker = mapping['ticker_symbol']
            mapped_count += 1
        else:
            final_status = 'pending'
            final_ticker = None
            pending_count += 1

        transactions_added.append({
            'id': transaction_id,
            'merchant': merchant,
            'amount': amount,
            'round_up': round_up,
            'ticker': final_ticker,
            'status': final_status
        })

        status_icon = "✓" if final_status == 'mapped' else "○"
        print(f"  [{i+1}] {status_icon} {merchant}: ${amount} → {final_ticker or 'pending review'}")

    conn.commit()

    # Verify
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = %s", (user_id,))
    new_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = %s AND status = 'mapped'", (user_id,))
    total_mapped = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    print(f"\n" + "=" * 70)
    print("COMPLETE!")
    print("=" * 70)
    print(f"  Added: {num_transactions} transactions")
    print(f"  - Mapped (ready for investment): {mapped_count}")
    print(f"  - Pending (need manual review): {pending_count}")
    print(f"\n  Total transactions: {new_count}")
    print(f"  Total mapped: {total_mapped}")
    print(f"\n  Login: demo_user@kamioi.com")
    print(f"  Password: Demo123!")
    print(f"\n[NEXT STEP] To process investments, call:")
    print(f"  POST /api/admin/investments/process-mapped")
    print(f"  This will: Execute Alpaca trades → Update portfolios → Mark as completed")
    print("=" * 70)


if __name__ == '__main__':
    main()
