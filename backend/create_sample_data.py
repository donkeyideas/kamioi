import sqlite3
import os
import random
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def create_sample_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    user_email = 'beltranalain@gmail.com'
    print(f"Creating sample data for user: {user_email}")
    print("=" * 50)
    
    # Get user ID
    cursor.execute("SELECT id FROM users WHERE email = ?", (user_email,))
    user_result = cursor.fetchone()
    
    if not user_result:
        print("User not found!")
        return False
    
    user_id = user_result[0]
    print(f"User ID: {user_id}")
    
    # Sample transaction categories
    categories = [
        'Groceries', 'Gas', 'Coffee', 'Restaurant', 'Shopping',
        'Entertainment', 'Utilities', 'Insurance', 'Healthcare',
        'Transportation', 'Education', 'Travel', 'Subscription'
    ]
    
    # Sample merchants
    merchants = [
        'Whole Foods', 'Shell Gas Station', 'Starbucks', 'McDonald\'s',
        'Amazon', 'Netflix', 'Spotify', 'Uber', 'Lyft', 'Target',
        'Walmart', 'CVS Pharmacy', 'Apple Store', 'Best Buy',
        'Home Depot', 'Costco', 'Trader Joe\'s', 'Chipotle'
    ]
    
    # Create sample transactions
    print("Creating sample transactions...")
    transactions = []
    base_date = datetime.now() - timedelta(days=90)
    
    for i in range(50):  # Create 50 sample transactions
        transaction_date = base_date + timedelta(days=random.randint(0, 90))
        amount = round(random.uniform(5.00, 500.00), 2)
        category = random.choice(categories)
        merchant = random.choice(merchants)
        
        # Make some transactions negative (refunds/credits)
        if random.random() < 0.1:  # 10% chance of negative
            amount = -amount
        
        transaction = {
            'user_id': user_id,
            'amount': amount,
            'description': f'{merchant} - {category}',
            'category': category,
            'merchant': merchant,
            'date': transaction_date.isoformat(),
            'status': 'completed',
            'total_debit': amount if amount > 0 else 0,
            'round_up': round(random.uniform(0, 0.99), 2) if amount > 0 else 0,
            'fee': round(random.uniform(0, 2.50), 2) if amount > 0 else 0,
            'investable': random.choice([True, False]),
            'account_type': 'checking',
            'created_at': transaction_date.isoformat()
        }
        
        transactions.append(transaction)
    
    # Insert transactions
    for transaction in transactions:
        cursor.execute("""
            INSERT INTO transactions (user_id, amount, description, category, merchant, 
                                    date, status, total_debit, round_up, fee, 
                                    investable, account_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            transaction['user_id'], transaction['amount'], transaction['description'],
            transaction['category'], transaction['merchant'], transaction['date'],
            transaction['status'], transaction['total_debit'], transaction['round_up'],
            transaction['fee'], transaction['investable'], transaction['account_type'],
            transaction['created_at']
        ))
    
    print(f"Created {len(transactions)} sample transactions")
    
    # Create sample notifications
    print("Creating sample notifications...")
    notifications = [
        {
            'user_id': user_id,
            'title': 'Welcome to Kamioi!',
            'message': 'Your account has been successfully set up.',
            'type': 'welcome',
            'is_read': True,
            'created_at': (datetime.now() - timedelta(days=7)).isoformat()
        },
        {
            'user_id': user_id,
            'title': 'Roundup Available',
            'message': 'You have $12.50 available for roundup investment.',
            'type': 'roundup',
            'is_read': False,
            'created_at': (datetime.now() - timedelta(days=2)).isoformat()
        },
        {
            'user_id': user_id,
            'title': 'Investment Opportunity',
            'message': 'New AI-recommended stocks are available in your portfolio.',
            'type': 'investment',
            'is_read': False,
            'created_at': (datetime.now() - timedelta(days=1)).isoformat()
        }
    ]
    
    for notification in notifications:
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, read, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            notification['user_id'], notification['title'], notification['message'],
            notification['type'], notification['is_read'], notification['created_at']
        ))
    
    print(f"Created {len(notifications)} sample notifications")
    
    # Create sample goals
    print("Creating sample goals...")
    goals = [
        {
            'user_id': user_id,
            'title': 'Emergency Fund',
            'target_amount': 10000.00,
            'current_amount': 2500.00,
            'progress': 25.0,
            'goal_type': 'savings',
            'created_at': (datetime.now() - timedelta(days=30)).isoformat()
        },
        {
            'user_id': user_id,
            'title': 'Vacation Fund',
            'target_amount': 5000.00,
            'current_amount': 1200.00,
            'progress': 24.0,
            'goal_type': 'savings',
            'created_at': (datetime.now() - timedelta(days=15)).isoformat()
        },
        {
            'user_id': user_id,
            'title': 'New Car',
            'target_amount': 25000.00,
            'current_amount': 5000.00,
            'progress': 20.0,
            'goal_type': 'savings',
            'created_at': (datetime.now() - timedelta(days=60)).isoformat()
        }
    ]
    
    for goal in goals:
        cursor.execute("""
            INSERT INTO goals (user_id, title, target_amount, current_amount, progress, goal_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            goal['user_id'], goal['title'], goal['target_amount'], goal['current_amount'],
            goal['progress'], goal['goal_type'], goal['created_at']
        ))
    
    print(f"Created {len(goals)} sample goals")
    
    # Create sample user settings
    print("Creating sample user settings...")
    settings = {
        'user_id': user_id,
        'roundup_multiplier': 1.0,
        'auto_invest': False,
        'notifications': True,
        'email_alerts': True,
        'theme': 'light',
        'business_sharing': False,
        'budget_alerts': True,
        'department_limits': '{}',
        'updated_at': datetime.now().isoformat()
    }
    
    cursor.execute("""
        INSERT OR REPLACE INTO user_settings 
        (user_id, roundup_multiplier, auto_invest, notifications, 
         email_alerts, theme, business_sharing, budget_alerts, 
         department_limits, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        settings['user_id'], settings['roundup_multiplier'], settings['auto_invest'],
        settings['notifications'], settings['email_alerts'], settings['theme'],
        settings['business_sharing'], settings['budget_alerts'], 
        settings['department_limits'], settings['updated_at']
    ))
    
    print("Created sample user settings")
    
    # Commit all changes
    conn.commit()
    print("\n" + "=" * 50)
    print("[SUCCESS] Sample data created successfully!")
    print(f"Summary for {user_email}:")
    print(f"   • {len(transactions)} transactions")
    print(f"   • {len(notifications)} notifications")
    print(f"   • {len(goals)} financial goals")
    print(f"   • User settings configured")
    print("\nReady for dashboard presentation!")
    
    conn.close()
    return True

if __name__ == "__main__":
    create_sample_data()
