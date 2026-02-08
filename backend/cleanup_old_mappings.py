"""Cleanup script to remove old test mappings and verify user_id filtering"""
import sqlite3
import sys
from datetime import datetime, timedelta

db_path = 'kamioi.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 60)
print("CLEANUP: Old Receipt Mappings")
print("=" * 60)

# First, show what we have
print("\n1. Current receipt mappings:")
cursor.execute("""
    SELECT id, user_id, merchant_name, ticker, receipt_id, created_at, source_type
    FROM llm_mappings
    WHERE source_type = 'receipt_processing'
    AND receipt_id IS NOT NULL
    ORDER BY created_at DESC
""")
all_mappings = cursor.fetchall()
print(f"   Total mappings: {len(all_mappings)}")
for m in all_mappings:
    mapping_id = str(m[0])[:20] if len(str(m[0])) > 20 else str(m[0])
    print(f"   ID {mapping_id}... | user_id={m[1]} | merchant={m[2]} | ticker={m[3]} | receipt_id={m[4]} | created={m[5]}")

# Show mappings by user
print("\n2. Mappings by user_id:")
cursor.execute("""
    SELECT user_id, COUNT(*) as count
    FROM llm_mappings
    WHERE source_type = 'receipt_processing'
    AND receipt_id IS NOT NULL
    GROUP BY user_id
""")
by_user = cursor.fetchall()
for u in by_user:
    print(f"   user_id={u[0]}: {u[1]} mappings")

# Get choice from command line argument or prompt
if len(sys.argv) > 1:
    choice = sys.argv[1].strip().upper()
    print(f"\n3. Using command-line argument: {choice}")
else:
    print("\n3. Options:")
    print("   A) Delete ALL old mappings (user_id != 108)")
    print("   B) Delete only test data (receipt_id='999999', merchant='Test Merchant', ticker='TEST')")
    print("   C) Delete mappings older than 30 days")
    print("   D) Show mappings for user_id=108 only")
    print("   E) Exit without changes")
    print("\n   Usage: python cleanup_old_mappings.py [A|B|C|D|E]")
    choice = 'E'  # Default to exit if no argument

if choice == 'A':
    # Delete all mappings not belonging to user 108
    cursor.execute("""
        DELETE FROM llm_mappings
        WHERE source_type = 'receipt_processing'
        AND receipt_id IS NOT NULL
        AND user_id != 108
    """)
    deleted = cursor.rowcount
    conn.commit()
    print(f"\n[SUCCESS] Deleted {deleted} mappings not belonging to user_id=108")
    
elif choice == 'B':
    # Delete test data
    cursor.execute("""
        DELETE FROM llm_mappings
        WHERE source_type = 'receipt_processing'
        AND (
            receipt_id = '999999'
            OR merchant_name = 'Test Merchant'
            OR ticker = 'TEST'
        )
    """)
    deleted = cursor.rowcount
    conn.commit()
    print(f"\n[SUCCESS] Deleted {deleted} test mappings")
    
elif choice == 'C':
    # Delete old mappings
    cutoff = (datetime.now() - timedelta(days=30)).isoformat()
    cursor.execute("""
        DELETE FROM llm_mappings
        WHERE source_type = 'receipt_processing'
        AND receipt_id IS NOT NULL
        AND created_at < ?
    """, (cutoff,))
    deleted = cursor.rowcount
    conn.commit()
    print(f"\n[SUCCESS] Deleted {deleted} mappings older than 30 days")
    
elif choice == 'D':
    # Show mappings for user 108
    cursor.execute("""
        SELECT id, user_id, merchant_name, ticker, receipt_id, created_at
        FROM llm_mappings
        WHERE source_type = 'receipt_processing'
        AND receipt_id IS NOT NULL
        AND user_id = 108
        ORDER BY created_at DESC
    """)
    user108_mappings = cursor.fetchall()
    print(f"\n   Mappings for user_id=108: {len(user108_mappings)}")
    for m in user108_mappings:
        mapping_id = str(m[0])[:20] if len(str(m[0])) > 20 else str(m[0])
        print(f"   ID {mapping_id}... | merchant={m[2]} | ticker={m[3]} | receipt_id={m[4]} | created={m[5]}")
    
else:
    print("\n[INFO] No changes made")

# Final count
cursor.execute("""
    SELECT COUNT(*) FROM llm_mappings
    WHERE source_type = 'receipt_processing'
    AND receipt_id IS NOT NULL
""")
final_count = cursor.fetchone()[0]
print(f"\n[INFO] Final count: {final_count} receipt mappings remaining")

conn.close()
print("\n[SUCCESS] Done!")

