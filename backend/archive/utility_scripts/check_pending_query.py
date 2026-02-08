#!/usr/bin/env python3
"""Check what the pending mappings query should return"""

import sqlite3
import os

sqlite_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kamioi.db")

if os.path.exists(sqlite_db_path):
    conn = sqlite3.connect(sqlite_db_path, timeout=60)
    cursor = conn.cursor()
    
    # Check what the dashboard query would return
    print("Checking pending mappings with different queries:\n")
    
    # Query 1: status = 'pending' (what we found)
    cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
    count1 = cursor.fetchone()[0]
    print(f"1. status = 'pending': {count1:,}")
    
    # Query 2: admin_approved = 0 (what the endpoint uses)
    cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 0")
    count2 = cursor.fetchone()[0]
    print(f"2. admin_approved = 0: {count2:,}")
    
    # Query 3: admin_approved = 0 AND user_id != 2 (what the endpoint actually uses)
    cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 0 AND user_id != 2")
    count3 = cursor.fetchone()[0]
    print(f"3. admin_approved = 0 AND user_id != 2: {count3:,}")
    
    # Query 4: status = 'pending' AND user_id != 2
    cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending' AND user_id != 2")
    count4 = cursor.fetchone()[0]
    print(f"4. status = 'pending' AND user_id != 2: {count4:,}")
    
    # Check the actual values
    print("\nSample of pending mappings:")
    cursor.execute("""
        SELECT id, user_id, status, admin_approved, merchant_name, ticker
        FROM llm_mappings 
        WHERE status = 'pending'
        LIMIT 5
    """)
    samples = cursor.fetchall()
    for row in samples:
        print(f"  ID {row[0]}: user_id={row[1]}, status='{row[2]}', admin_approved={row[3]}, merchant={row[4]}, ticker={row[5]}")
    
    # Check user_id distribution
    print("\nUser ID distribution for pending mappings:")
    cursor.execute("""
        SELECT user_id, COUNT(*) as count
        FROM llm_mappings
        WHERE status = 'pending'
        GROUP BY user_id
    """)
    for user_id, count in cursor.fetchall():
        print(f"  user_id={user_id}: {count:,} mappings")
    
    conn.close()
else:
    print("SQLite database not found")


