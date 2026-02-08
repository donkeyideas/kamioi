#!/usr/bin/env python3
"""Test database stats breakdown"""
from database_manager import db_manager
from sqlalchemy import text

conn = db_manager.get_connection()
print("Users by account_type:")
print("-" * 50)

for account_type in ['individual', 'family', 'business', 'admin']:
    result = conn.execute(text('SELECT COUNT(*) FROM users WHERE account_type = :at'), {'at': account_type})
    user_count = result.scalar() or 0
    
    result2 = conn.execute(text('''
        SELECT COUNT(*) FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE u.account_type = :at
    '''), {'at': account_type})
    tx_count = result2.scalar() or 0
    
    print(f"{account_type.capitalize()}:")
    print(f"  Users: {user_count}")
    print(f"  Transactions: {tx_count}")
    print()

db_manager.release_connection(conn)

