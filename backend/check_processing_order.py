#!/usr/bin/env python3
"""Check which mappings are being processed"""

import sqlite3

conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()

# Check first 5 mappings to be processed
cursor.execute("""
    SELECT id, merchant_name, created_at 
    FROM llm_mappings 
    WHERE ai_attempted = 0 OR ai_status = 'pending' 
    ORDER BY created_at ASC 
    LIMIT 5
""")
mappings = cursor.fetchall()

print("First 5 mappings to be processed:")
for mapping in mappings:
    print(f"ID: {mapping[0]}, Merchant: {mapping[1]}, Created: {mapping[2]}")

# Check our target mapping
cursor.execute("""
    SELECT id, merchant_name, created_at 
    FROM llm_mappings 
    WHERE id = 37558529
""")
target = cursor.fetchone()

print(f"\nTarget mapping 37558529: {target}")

# Check total count of pending mappings
cursor.execute("""
    SELECT COUNT(*) 
    FROM llm_mappings 
    WHERE ai_attempted = 0 OR ai_status = 'pending'
""")
total_pending = cursor.fetchone()[0]

print(f"\nTotal pending mappings: {total_pending}")

conn.close()

