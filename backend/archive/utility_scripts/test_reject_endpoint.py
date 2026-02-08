#!/usr/bin/env python3
"""Test the reject endpoint to see what it does"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import sqlite3

# Test what happens when we reject a mapping
sqlite_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kamioi.db")

if os.path.exists(sqlite_db_path):
    conn = sqlite3.connect(sqlite_db_path, timeout=60)
    cursor = conn.cursor()
    
    # Get a sample pending mapping
    cursor.execute("""
        SELECT id, status, admin_approved, merchant_name, ticker
        FROM llm_mappings
        WHERE status = 'pending' AND admin_approved != -1
        LIMIT 1
    """)
    sample = cursor.fetchone()
    
    if sample:
        mapping_id, status, admin_approved, merchant, ticker = sample
        print(f"Sample pending mapping:")
        print(f"  ID: {mapping_id}")
        print(f"  Status: {status}")
        print(f"  Admin Approved: {admin_approved}")
        print(f"  Merchant: {merchant}")
        print(f"  Ticker: {ticker}")
        print()
        
        # Simulate what the reject endpoint should do
        print("What reject endpoint should do:")
        print("  - Set status = 'rejected'")
        print("  - Set admin_approved = -1")
        print()
        
        # Check if it would be excluded from pending
        cursor.execute("""
            SELECT COUNT(*) FROM llm_mappings
            WHERE status = 'pending' AND admin_approved != -1
        """)
        pending_count = cursor.fetchone()[0]
        print(f"Current pending count (status='pending' AND admin_approved != -1): {pending_count}")
        
        # Check rejected count
        cursor.execute("""
            SELECT COUNT(*) FROM llm_mappings
            WHERE (admin_approved = -1 OR status = 'rejected')
        """)
        rejected_count = cursor.fetchone()[0]
        print(f"Current rejected count: {rejected_count}")
        
    else:
        print("No pending mappings found to test")
    
    conn.close()
else:
    print("SQLite database not found")


