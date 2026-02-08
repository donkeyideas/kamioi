#!/usr/bin/env python3
"""
Clean up subscription plans - keep only 3 plans (one for each account type)
"""
import sqlite3
import sys
from datetime import datetime

DB_PATH = 'kamioi.db'

def cleanup_plans():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Get all plans grouped by account_type
        cursor.execute("""
            SELECT id, name, account_type, tier, price_monthly, price_yearly
            FROM subscription_plans
            ORDER BY account_type, id
        """)
        
        all_plans = cursor.fetchall()
        print(f"Found {len(all_plans)} subscription plans")
        
        # Find the first plan for each account type to keep
        plans_to_keep = {}
        for plan in all_plans:
            plan_id, name, account_type, tier, price_monthly, price_yearly = plan
            if account_type not in plans_to_keep:
                plans_to_keep[account_type] = plan_id
                print(f"Keeping plan ID {plan_id}: {name} ({account_type})")
        
        # Get all plan IDs to delete
        keep_ids = list(plans_to_keep.values())
        
        if len(keep_ids) == 0:
            print("No plans found!")
            return
        
        # Delete all other plans
        placeholders = ','.join(['?'] * len(keep_ids))
        cursor.execute(f"""
            DELETE FROM subscription_plans
            WHERE id NOT IN ({placeholders})
        """, keep_ids)
        
        deleted_count = cursor.rowcount
        conn.commit()
        
        print(f"\nCleanup complete!")
        print(f"   Kept: {len(keep_ids)} plans (one for each account type)")
        print(f"   Deleted: {deleted_count} plans")
        
        # Verify final state
        cursor.execute("SELECT COUNT(*) FROM subscription_plans")
        remaining = cursor.fetchone()[0]
        print(f"   Remaining: {remaining} plans")
        
        # Show what's left
        cursor.execute("""
            SELECT id, name, account_type, tier, price_monthly
            FROM subscription_plans
            ORDER BY account_type
        """)
        remaining_plans = cursor.fetchall()
        print("\nRemaining plans:")
        for plan in remaining_plans:
            print(f"   ID {plan[0]}: {plan[1]} ({plan[2]}) - ${plan[4]}/month")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    print("Cleaning up subscription plans...")
    print("This will keep only 1 plan for each account type (individual, family, business)\n")
    
    response = input("Are you sure you want to proceed? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("Cancelled.")
        sys.exit(0)
    
    cleanup_plans()

