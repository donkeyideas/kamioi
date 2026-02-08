"""
Cleanup script to remove ALL subscriptions and ensure clean slate.
This removes all user_subscriptions so analytics show 0.
"""

import sqlite3
import os

# Get database path
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "kamioi.db")

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Cleaning up ALL subscriptions...")

# Count before cleanup
cursor.execute("SELECT COUNT(*) FROM user_subscriptions")
before_count = cursor.fetchone()[0]

# Delete ALL user subscriptions
cursor.execute("DELETE FROM user_subscriptions")
deleted_count = cursor.rowcount

# Also reset subscription_status in users table
cursor.execute("UPDATE users SET subscription_status = NULL WHERE subscription_status IS NOT NULL")
users_updated = cursor.rowcount

conn.commit()

print(f"\n[SUCCESS] Cleanup complete!")
print(f"   - Deleted {deleted_count} user subscriptions")
print(f"   - Reset subscription_status for {users_updated} users")
print(f"   - Analytics will now show 0 subscriptions, $0.00 MRR")

conn.close()

