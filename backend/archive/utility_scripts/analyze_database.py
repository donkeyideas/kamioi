#!/usr/bin/env python3
"""
Analyze database to show what data exists.
"""

import sqlite3

def analyze_database():
    """Show detailed breakdown of database contents"""
    db_path = 'kamioi.db'
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    print("=" * 70)
    print("DATABASE ANALYSIS")
    print("=" * 70)
    
    # Users breakdown
    print("\nUSERS:")
    print("-" * 70)
    cur.execute('SELECT id, name, email, account_type, created_at FROM users ORDER BY id')
    users = cur.fetchall()
    for user in users:
        cur.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user[0],))
        txn_count = cur.fetchone()[0]
        print(f"  ID {user[0]:3d}: {user[1]:30s} ({user[2]:30s}) - {user[3]:10s} - {txn_count:3d} transactions")
    
    # Transaction summary
    print(f"\nTRANSACTIONS:")
    print("-" * 70)
    cur.execute('SELECT COUNT(*) FROM transactions')
    total = cur.fetchone()[0]
    print(f"  Total: {total} transactions")
    
    cur.execute('SELECT COUNT(DISTINCT user_id) FROM transactions')
    unique_users = cur.fetchone()[0]
    print(f"  From {unique_users} different users")
    
    # Date range
    cur.execute('SELECT MIN(date), MAX(date) FROM transactions')
    dates = cur.fetchone()
    print(f"  Date range: {dates[0]} to {dates[1]}")
    
    # Real user (ID 94)
    print(f"\nREAL USER (ID 94 - Al Bell):")
    print("-" * 70)
    cur.execute('SELECT COUNT(*) FROM transactions WHERE user_id = 94')
    real_user_txns = cur.fetchone()[0]
    print(f"  Transactions: {real_user_txns}")
    
    # Test data
    print(f"\nTEST DATA:")
    print("-" * 70)
    cur.execute('SELECT COUNT(*) FROM transactions WHERE user_id != 94')
    test_txns = cur.fetchone()[0]
    print(f"  Transactions from other users: {test_txns}")
    print(f"  Users to delete: {len(users) - 1}")
    
    conn.close()

if __name__ == '__main__':
    analyze_database()


