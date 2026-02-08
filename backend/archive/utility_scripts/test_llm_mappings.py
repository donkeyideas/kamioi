#!/usr/bin/env python3

import sqlite3
import os

# Check if database exists
db_path = 'kamioi.db'
if not os.path.exists(db_path):
    print("Database file not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Test the exact query from the endpoint
    cursor.execute("SELECT COUNT(*) FROM llm_mappings")
    total_mappings = cursor.fetchone()[0]
    print(f"Total mappings: {total_mappings}")
    
    # Test the pending query
    cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
    pending_review = cursor.fetchone()[0]
    print(f"Pending review: {pending_review}")
    
    # Test the recent mappings query
    cursor.execute("""
        SELECT id, transaction_id, merchant, amount, mapped_to, confidence, status, created_at 
        FROM llm_mappings 
        ORDER BY created_at DESC 
        LIMIT 5
    """)
    
    mappings = []
    for row in cursor.fetchall():
        print(f"Row: {row}")
        mappings.append({
            'id': row[0],
            'transaction_id': row[1],
            'merchant': row[2],
            'amount': row[3],
            'mapped_to': row[4],
            'confidence': row[5],
            'status': row[6],
            'created_at': row[7]
        })
    
    print(f"Found {len(mappings)} mappings")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

conn.close()
