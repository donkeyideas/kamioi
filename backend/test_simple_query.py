#!/usr/bin/env python3

import sqlite3
import os

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def test_query():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Test the exact query from the endpoint
        cursor.execute('''
            SELECT * FROM llm_mappings 
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (5, 0))
        
        mappings = cursor.fetchall()
        print(f"Found {len(mappings)} mappings")
        
        for i, mapping in enumerate(mappings):
            print(f"Mapping {i+1}:")
            print(f"  id: {mapping[0]}")
            print(f"  merchant_name: {mapping[1]}")
            print(f"  category: {mapping[2]}")
            print(f"  notes: {mapping[3]}")
            print(f"  ticker_symbol: {mapping[4]}")
            print(f"  confidence: {mapping[5]}")
            print(f"  status: {mapping[6]}")
            print(f"  created_at: {mapping[7]}")
            print(f"  admin_id: {mapping[8]}")
            print()
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_query()
