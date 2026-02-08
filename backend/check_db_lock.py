#!/usr/bin/env python3
"""
Quick script to check if database is locked and by what process.
"""

import sqlite3
import os

db_path = 'kamioi.db'

if not os.path.exists(db_path):
    print(f"Database file {db_path} does not exist")
    exit(1)

try:
    conn = sqlite3.connect(db_path, timeout=1)
    conn.execute('SELECT 1')
    conn.close()
    print("[OK] Database is NOT locked - ready to use")
except sqlite3.OperationalError as e:
    if 'locked' in str(e).lower():
        print(f"[ERROR] Database is LOCKED")
        print(f"[ERROR] Another process is using the database")
        print(f"[ERROR] Please close:")
        print(f"   - SQLite Browser or DB Browser for SQLite")
        print(f"   - Any other Python processes running app.py")
        print(f"   - Backup scripts or database tools")
        print(f"\n[INFO] Database file: {os.path.abspath(db_path)}")
    else:
        print(f"[ERROR] Database error: {e}")


