#!/usr/bin/env python3
"""Check why recent activity shows transactions when count is 0"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import sqlite3

sqlite_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kamioi.db")

if os.path.exists(sqlite_db_path):
    conn = sqlite3.connect(sqlite_db_path, timeout=60)
    cursor = conn.cursor()
    
    # Check total transactions count
    cursor.execute('''
        SELECT COUNT(DISTINCT t.id) as totalTransactions
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.user_id != 2
    ''')
    total = cursor.fetchone()[0]
    print(f"Total transactions (user_id != 2): {total}")
    
    # Check active users
    cursor.execute('''
        SELECT COUNT(DISTINCT u.id) as activeUsers
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.user_id != 2
    ''')
    active_users = cursor.fetchone()[0]
    print(f"Active users with transactions: {active_users}")
    
    # Get recent transactions (what the dashboard shows)
    cursor.execute('''
        SELECT id, user_id, merchant, amount, date, description, status
        FROM transactions
        WHERE user_id != 2
        ORDER BY date DESC, id DESC
        LIMIT 5
    ''')
    recent = cursor.fetchall()
    print(f"\nRecent transactions (limit 5):")
    for row in recent:
        txn_id, user_id, merchant, amount, date, description, status = row
        print(f"  ID: {txn_id}, User: {user_id}, Merchant: {merchant}, Date: {date}, Description: {description}")
    
    # Check if these users exist
    print(f"\nChecking if users exist:")
    for row in recent:
        user_id = row[1]
        cursor.execute("SELECT id, email FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if user:
            print(f"  User {user_id}: {user[1]} - EXISTS")
        else:
            print(f"  User {user_id}: DOES NOT EXIST (orphaned transaction)")
    
    # Check all transactions
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id != 2")
    all_txns = cursor.fetchone()[0]
    print(f"\nAll transactions (user_id != 2): {all_txns}")
    
    # Check transactions with valid users
    cursor.execute('''
        SELECT COUNT(*) 
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.user_id != 2
    ''')
    valid_txns = cursor.fetchone()[0]
    print(f"Transactions with valid users: {valid_txns}")
    
    conn.close()
else:
    print("SQLite database not found")


