#!/usr/bin/env python3

import sqlite3

def check_schema():
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    # Check llm_mappings table schema
    cursor.execute('PRAGMA table_info(llm_mappings)')
    columns = cursor.fetchall()
    
    print('LLM Mappings table schema:')
    for col in columns:
        print(f'{col[1]} ({col[2]})')
    
    # Check a sample record to see what fields are actually set
    cursor.execute('SELECT * FROM llm_mappings LIMIT 1')
    sample = cursor.fetchone()
    if sample:
        print(f'\nSample record: {sample}')
    
    conn.close()

if __name__ == "__main__":
    check_schema()
