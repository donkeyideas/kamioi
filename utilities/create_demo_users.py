"""
Create Demo Users for Kamioi

Creates 3 demo accounts with realistic mock data for presentations and testing:
1. demo_user@kamioi.com - Individual account
2. demo_family@kamioi.com - Family account
3. demo_business@kamioi.com - Business account

Run with: python utilities/create_demo_users.py
"""

import os
import sys
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

# Add backend directory to path for imports
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
sys.path.insert(0, backend_dir)

from database_manager import db_manager


# Demo account configurations
DEMO_PASSWORD = "Demo123!"  # Easy to remember for demos
DEMO_ACCOUNTS = [
    {
        "email": "demo_user@kamioi.com",
        "name": "Demo User",
        "account_type": "individual",
        "description": "Individual account demo"
    },
    {
        "email": "demo_family@kamioi.com",
        "name": "Demo Family Admin",
        "account_type": "family",
        "description": "Family account demo"
    },
    {
        "email": "demo_business@kamioi.com",
        "name": "Demo Business",
        "account_type": "business",
        "description": "Business account demo"
    }
]

# Mock data generators
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
    ("Best Buy", "BBY", "Electronics"),
    ("Lowe's", "LOW", "Home Improvement"),
    ("Walgreens", "WBA", "Healthcare"),
    ("Kroger", "KR", "Grocery"),
    ("Dunkin", "DNKN", "Food & Beverage")
]

PORTFOLIO_HOLDINGS = [
    ("AAPL", "Apple Inc.", 150.25, 178.50),
    ("GOOGL", "Alphabet Inc.", 140.75, 155.25),
    ("AMZN", "Amazon.com", 180.50, 195.75),
    ("MSFT", "Microsoft Corp.", 380.25, 412.00),
    ("NVDA", "NVIDIA Corp.", 800.50, 875.25),
    ("TSLA", "Tesla Inc.", 250.00, 265.75),
    ("META", "Meta Platforms", 480.25, 510.50),
    ("SBUX", "Starbucks Corp.", 95.50, 102.25),
    ("NKE", "Nike Inc.", 105.75, 112.50),
    ("DIS", "Walt Disney Co.", 95.25, 102.00)
]

GOALS = [
    ("Emergency Fund", "Build 6-month emergency fund", 15000, 8500),
    ("New Car", "Save for down payment on new car", 10000, 3200),
    ("Vacation Fund", "Family vacation to Hawaii", 5000, 2100),
    ("Home Renovation", "Kitchen remodel savings", 20000, 4500),
    ("Investment Growth", "Long-term wealth building", 50000, 12000)
]


def generate_transactions(user_id, num_transactions=50, days_back=90):
    """Generate realistic transactions for a user"""
    transactions = []
    now = datetime.now()

    for i in range(num_transactions):
        merchant, ticker, category = random.choice(MERCHANTS)
        amount = round(random.uniform(5, 150), 2)
        roundup = round(amount - int(amount), 2) if amount != int(amount) else round(random.uniform(0.01, 0.99), 2)
        date = now - timedelta(days=random.randint(0, days_back))

        transactions.append({
            "user_id": user_id,
            "merchant": merchant,
            "amount": amount,
            "roundup": roundup,
            "ticker": ticker,
            "category": category,
            "date": date.strftime("%Y-%m-%d"),
            "status": "completed",
            "created_at": date.isoformat()
        })

    return transactions


def generate_portfolio(user_id, num_holdings=5):
    """Generate portfolio holdings for a user"""
    holdings = []
    selected = random.sample(PORTFOLIO_HOLDINGS, min(num_holdings, len(PORTFOLIO_HOLDINGS)))

    for ticker, name, cost_basis, current_price in selected:
        shares = round(random.uniform(0.5, 10), 4)
        holdings.append({
            "user_id": user_id,
            "ticker": ticker,
            "shares": shares,
            "cost_basis": cost_basis,
            "current_price": current_price,
            "created_at": datetime.now().isoformat()
        })

    return holdings


def generate_goals(user_id, num_goals=3):
    """Generate goals for a user"""
    goals = []
    selected = random.sample(GOALS, min(num_goals, len(GOALS)))

    for name, description, target, current in selected:
        goals.append({
            "user_id": user_id,
            "name": name,
            "description": description,
            "target_amount": target,
            "current_amount": current,
            "status": "active",
            "created_at": datetime.now().isoformat()
        })

    return goals


def create_demo_user(account_config):
    """Create a single demo user with all associated data"""
    print(f"\n{'='*60}")
    print(f"Creating: {account_config['email']}")
    print(f"Type: {account_config['account_type']}")
    print(f"{'='*60}")

    conn = db_manager.get_connection()
    use_postgresql = getattr(db_manager, '_use_postgresql', False)

    try:
        # Check if user already exists
        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text(
                "SELECT id FROM users WHERE LOWER(email) = LOWER(:email)"
            ), {'email': account_config['email']})
            existing = result.fetchone()
            if existing:
                print(f"[SKIP] User already exists with ID: {existing[0]}")
                db_manager.release_connection(conn)
                return existing[0]
        else:
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE email = ?", (account_config['email'],))
            existing = cur.fetchone()
            if existing:
                print(f"[SKIP] User already exists with ID: {existing[0]}")
                conn.close()
                return existing[0]

        # Create the user
        hashed_password = generate_password_hash(DEMO_PASSWORD)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('''
                INSERT INTO users (email, password, name, account_type, created_at)
                VALUES (:email, :password, :name, :account_type, CURRENT_TIMESTAMP)
                RETURNING id
            '''), {
                'email': account_config['email'],
                'password': hashed_password,
                'name': account_config['name'],
                'account_type': account_config['account_type']
            })
            user_id = result.fetchone()[0]
            conn.commit()
        else:
            cur.execute('''
                INSERT INTO users (email, password, name, account_type, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            ''', (
                account_config['email'],
                hashed_password,
                account_config['name'],
                account_config['account_type']
            ))
            user_id = cur.lastrowid
            conn.commit()

        print(f"[OK] Created user with ID: {user_id}")

        # Generate transactions
        num_transactions = {
            'individual': 50,
            'family': 100,
            'business': 150
        }.get(account_config['account_type'], 50)

        transactions = generate_transactions(user_id, num_transactions)
        tx_count = 0

        for tx in transactions:
            try:
                if use_postgresql:
                    conn.execute(text('''
                        INSERT INTO transactions (user_id, merchant, amount, roundup, ticker, category, date, status, created_at)
                        VALUES (:user_id, :merchant, :amount, :roundup, :ticker, :category, :date, :status, :created_at)
                    '''), tx)
                else:
                    cur.execute('''
                        INSERT INTO transactions (user_id, merchant, amount, roundup, ticker, category, date, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (tx['user_id'], tx['merchant'], tx['amount'], tx['roundup'],
                          tx['ticker'], tx['category'], tx['date'], tx['status'], tx['created_at']))
                tx_count += 1
            except Exception as e:
                print(f"  Warning: Could not create transaction: {e}")

        conn.commit()
        print(f"[OK] Created {tx_count} transactions")

        # Generate portfolio
        num_holdings = {
            'individual': 5,
            'family': 7,
            'business': 10
        }.get(account_config['account_type'], 5)

        holdings = generate_portfolio(user_id, num_holdings)
        holding_count = 0

        for holding in holdings:
            try:
                if use_postgresql:
                    conn.execute(text('''
                        INSERT INTO portfolios (user_id, ticker, shares, cost_basis, created_at)
                        VALUES (:user_id, :ticker, :shares, :cost_basis, :created_at)
                    '''), holding)
                else:
                    cur.execute('''
                        INSERT INTO portfolios (user_id, ticker, shares, cost_basis, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (holding['user_id'], holding['ticker'], holding['shares'],
                          holding['cost_basis'], holding['created_at']))
                holding_count += 1
            except Exception as e:
                print(f"  Warning: Could not create portfolio holding: {e}")

        conn.commit()
        print(f"[OK] Created {holding_count} portfolio holdings")

        # Generate goals
        num_goals = {
            'individual': 3,
            'family': 4,
            'business': 5
        }.get(account_config['account_type'], 3)

        goals = generate_goals(user_id, num_goals)
        goal_count = 0

        for goal in goals:
            try:
                if use_postgresql:
                    conn.execute(text('''
                        INSERT INTO goals (user_id, name, description, target_amount, current_amount, status, created_at)
                        VALUES (:user_id, :name, :description, :target_amount, :current_amount, :status, :created_at)
                    '''), goal)
                else:
                    cur.execute('''
                        INSERT INTO goals (user_id, name, description, target_amount, current_amount, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (goal['user_id'], goal['name'], goal['description'],
                          goal['target_amount'], goal['current_amount'], goal['status'], goal['created_at']))
                goal_count += 1
            except Exception as e:
                print(f"  Warning: Could not create goal: {e}")

        conn.commit()
        print(f"[OK] Created {goal_count} goals")

        # Cleanup connection
        if use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

        return user_id

    except Exception as e:
        print(f"[ERROR] Failed to create demo user: {e}")
        import traceback
        traceback.print_exc()
        return None


def run_migration():
    """Create all demo users"""
    print("=" * 70)
    print("Kamioi Demo User Creation Script")
    print("=" * 70)
    print(f"\nDemo Password for all accounts: {DEMO_PASSWORD}")
    print("\nCreating demo accounts...")

    created = []
    skipped = []
    failed = []

    for account in DEMO_ACCOUNTS:
        user_id = create_demo_user(account)
        if user_id:
            created.append(account['email'])
        else:
            failed.append(account['email'])

    # Summary
    print("\n" + "=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"  Created/Existing: {len(created)}")
    print(f"  Failed: {len(failed)}")

    if created:
        print("\nDemo Accounts Ready:")
        for email in created:
            print(f"  - {email}")
        print(f"\nPassword: {DEMO_PASSWORD}")

    if failed:
        print("\nFailed to create:")
        for email in failed:
            print(f"  - {email}")

    return len(created), len(failed)


if __name__ == "__main__":
    run_migration()
