#!/usr/bin/env python3
"""
Test mapping history functionality
"""

import os
import sys
import sqlite3

# Add the backend directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database_manager import db_manager

def test_mapping_history():
    """Test mapping history functionality"""
    print("Testing mapping history...")
    
    # Check if there are any mappings in the database
    conn = db_manager.get_connection()
    cursor = conn.cursor()
    
    # Check all mappings
    cursor.execute("SELECT COUNT(*) FROM llm_mappings")
    total_mappings = cursor.fetchone()[0]
    print(f"Total mappings in database: {total_mappings}")
    
    if total_mappings > 0:
        # Show all mappings
        cursor.execute("SELECT * FROM llm_mappings ORDER BY created_at DESC")
        mappings = cursor.fetchall()
        columns = [description[0] for description in cursor.description]
        
        print("\nAll mappings:")
        for mapping in mappings:
            mapping_dict = dict(zip(columns, mapping))
            print(f"  ID: {mapping_dict.get('id')}, User: {mapping_dict.get('user_id')}, Merchant: {mapping_dict.get('merchant_name')}, Status: {mapping_dict.get('status')}")
    
    # Test get_llm_mappings method
    print("\nTesting get_llm_mappings method:")
    all_mappings = db_manager.get_llm_mappings()
    print(f"get_llm_mappings() returned: {len(all_mappings)} mappings")
    
    # Test with user_id filter
    user_mappings = db_manager.get_llm_mappings(user_id="1")
    print(f"get_llm_mappings(user_id='1') returned: {len(user_mappings)} mappings")
    
    conn.close()

if __name__ == '__main__':
    test_mapping_history()

