#!/usr/bin/env python3
"""Reset mapping to pending status"""

import sqlite3

conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()

cursor.execute("""
    UPDATE llm_mappings 
    SET ai_attempted = 0, 
        ai_status = 'pending', 
        ai_confidence = 0.0,
        ai_reasoning = NULL
    WHERE id = 37558529
""")

conn.commit()
conn.close()

print("Reset mapping 37558529 to pending status")


