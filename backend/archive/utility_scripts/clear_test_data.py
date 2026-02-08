#!/usr/bin/env python3

import sqlite3
import os

def clear_test_data():
    print("CLEARING ALL TEST DATA FROM DATABASE")
    print("=" * 50)
    
    # Connect to database
    db_path = "kamioi.db"
    if not os.path.exists(db_path):
        print(f"[ERROR] Database file not found: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current data
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_before = cursor.fetchone()[0]
        print(f"Total mappings before: {total_before}")
        
        # Clear all test data
        cursor.execute("DELETE FROM llm_mappings")
        conn.commit()
        
        # Verify deletion
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_after = cursor.fetchone()[0]
        print(f"Total mappings after: {total_after}")
        
        conn.close()
        print("[OK] All test data cleared successfully")
        
    except Exception as e:
        print(f"[ERROR] Failed to clear test data: {e}")

if __name__ == "__main__":
    clear_test_data()
