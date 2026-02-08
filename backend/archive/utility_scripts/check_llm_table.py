#!/usr/bin/env python3

import sqlite3

conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()

# Get table schema
cursor.execute("PRAGMA table_info(llm_mappings)")
columns = cursor.fetchall()

print("LLM Mappings table structure:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

# Get a sample row
cursor.execute("SELECT * FROM llm_mappings LIMIT 1")
sample = cursor.fetchone()
if sample:
    print(f"\nSample row: {sample}")

conn.close()
