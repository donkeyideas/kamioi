#!/usr/bin/env python3
"""Check llm_mappings table structure"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def check_structure():
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'llm_mappings'
                ORDER BY ordinal_position
            """))
            print("PostgreSQL llm_mappings columns:")
            for col, dtype in result.fetchall():
                print(f"  - {col}: {dtype}")
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(llm_mappings)")
            print("SQLite llm_mappings columns:")
            for row in cursor.fetchall():
                print(f"  - {row[1]}: {row[2]}")
            conn.close()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == '__main__':
    check_structure()
