"""
Cleanup script to remove all subscription plans except the 3 required ones:
- Essentials: $3.99/month, $45/year
- Family Plus: $7.99/month, $90/year
- Business Edge: $14.99/month, $165/year
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

# List of plans to keep
plans_to_keep = ['Essentials', 'Family Plus', 'Business Edge']

print("Cleaning up subscription plans...")
print(f"Keeping only: {', '.join(plans_to_keep)}")

# Get all current plans
cursor.execute("SELECT id, name FROM subscription_plans")
all_plans = cursor.fetchall()

print(f"\nFound {len(all_plans)} plans in database:")
for plan_id, plan_name in all_plans:
    if plan_name in plans_to_keep:
        print(f"  [KEEP] {plan_name} (ID: {plan_id})")
    else:
        print(f"  [DELETE] {plan_name} (ID: {plan_id})")

# First, delete ALL plans
cursor.execute("DELETE FROM subscription_plans")
deleted_count = cursor.rowcount

# Then insert only the 3 required plans (this ensures no duplicates)
required_plans = [
    ('Essentials', 'family', 'essentials', 3.99, 45.00, '["Core features", "Basic family support", "Shared goals"]', '{"transactions": 200, "users": 4}', 1),
    ('Family Plus', 'family', 'plus', 7.99, 90.00, '["Up to 8 family members", "Shared goals", "Advanced family features"]', '{"transactions": 500, "users": 8}', 1),
    ('Business Edge', 'business', 'edge', 14.99, 165.00, '["Business analytics", "Team management", "Business dashboard"]', '{"transactions": 1000, "users": 10}', 1)
]

cursor.executemany("""
    INSERT INTO subscription_plans (name, account_type, tier, price_monthly, price_yearly, features, limits, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", required_plans)

conn.commit()

print(f"\n[SUCCESS] Cleanup complete!")
print(f"   - Deleted all {deleted_count} existing plans")
print(f"   - Inserted {len(required_plans)} new plans (no duplicates)")

# Verify final state
cursor.execute("SELECT name, price_monthly, price_yearly FROM subscription_plans ORDER BY name")
remaining = cursor.fetchall()

print(f"\nRemaining plans ({len(remaining)}):")
for name, monthly, yearly in remaining:
    print(f"  - {name}: ${monthly:.2f}/month, ${yearly:.2f}/year")

conn.close()

