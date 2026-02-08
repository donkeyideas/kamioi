#!/usr/bin/env python3
"""
Test database update functionality
"""

import sqlite3
import requests
import json

def test_db_update():
    """Test if database updates are working"""
    print("Testing Database Update...")
    
    # First, check current state
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, merchant_name, ai_attempted FROM llm_mappings WHERE id = 37558529")
    mapping = cursor.fetchone()
    print(f"Before update - Mapping 37558529: {mapping}")
    
    # Update the mapping
    cursor.execute("""
        UPDATE llm_mappings 
        SET ai_attempted = 1,
            ai_status = 'test_status',
            ai_confidence = 0.85,
            ai_reasoning = 'Test update'
        WHERE id = 37558529
    """)
    
    conn.commit()
    conn.close()
    
    # Check if update worked
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, merchant_name, ai_attempted, ai_status, ai_confidence FROM llm_mappings WHERE id = 37558529")
    mapping = cursor.fetchone()
    print(f"After update - Mapping 37558529: {mapping}")
    
    conn.close()

if __name__ == '__main__':
    test_db_update()

