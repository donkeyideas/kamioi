#!/usr/bin/env python3
"""
Clear business transaction data from the database
"""

import sqlite3
import os

def clear_business_transactions():
    """Clear all business transaction data from the database"""
    
    # Database path
    db_path = "kamioi.db"
    
    if not os.path.exists(db_path):
        print("Database file not found!")
        return
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        print("Checking for business users...")
        
        # Get all business users
        cursor.execute("SELECT id, email, account_type FROM users WHERE account_type = 'business'")
        business_users = cursor.fetchall()
        
        if not business_users:
            print("No business users found - nothing to clear")
            conn.close()
            return
        
        print(f"Found {len(business_users)} business users:")
        for user in business_users:
            print(f"   - ID: {user['id']}, Email: {user['email']}")
        
        # Clear transactions for business users
        business_user_ids = [str(user['id']) for user in business_users]
        placeholders = ','.join(['?' for _ in business_user_ids])
        
        print("Clearing business transactions...")
        cursor.execute(f"DELETE FROM transactions WHERE user_id IN ({placeholders})", business_user_ids)
        deleted_transactions = cursor.rowcount
        print(f"Deleted {deleted_transactions} business transactions")
        
        # Clear other business-related data
        print("Clearing business goals...")
        cursor.execute(f"DELETE FROM goals WHERE user_id IN ({placeholders})", business_user_ids)
        deleted_goals = cursor.rowcount
        print(f"Deleted {deleted_goals} business goals")
        
        print("Clearing business notifications...")
        cursor.execute(f"DELETE FROM notifications WHERE user_id IN ({placeholders})", business_user_ids)
        deleted_notifications = cursor.rowcount
        print(f"Deleted {deleted_notifications} business notifications")
        
        # Commit changes
        conn.commit()
        conn.close()
        
        print("Business transaction data cleared successfully!")
        print(f"Summary:")
        print(f"   - Business users: {len(business_users)}")
        print(f"   - Transactions deleted: {deleted_transactions}")
        print(f"   - Goals deleted: {deleted_goals}")
        print(f"   - Notifications deleted: {deleted_notifications}")
        
    except Exception as e:
        print(f"Error clearing business transactions: {e}")

if __name__ == "__main__":
    clear_business_transactions()
