#!/usr/bin/env python3
"""
Delete sample subscription data from the database
"""

import sqlite3
import os

def delete_sample_subscriptions():
    """Delete all sample subscription data from the database"""
    
    # Connect to database
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Delete all user subscriptions
        cursor.execute("DELETE FROM user_subscriptions")
        deleted_subscriptions = cursor.rowcount
        
        # Delete all renewal queue entries
        cursor.execute("DELETE FROM renewal_queue")
        deleted_renewals = cursor.rowcount
        
        # Delete all renewal history
        cursor.execute("DELETE FROM renewal_history")
        deleted_history = cursor.rowcount
        
        # Reset user subscription status
        cursor.execute("""
            UPDATE users 
            SET subscription_status = 'trial', subscription_tier = NULL
        """)
        updated_users = cursor.rowcount
        
        conn.commit()
        
        print("Sample subscription data deleted successfully!")
        print(f"- Deleted {deleted_subscriptions} user subscriptions")
        print(f"- Deleted {deleted_renewals} renewal queue entries")
        print(f"- Deleted {deleted_history} renewal history entries")
        print(f"- Reset {updated_users} users to trial status")
        print("\nThe subscription analytics will now show zero values.")
        
    except Exception as e:
        print(f"Error deleting sample subscriptions: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    delete_sample_subscriptions()



