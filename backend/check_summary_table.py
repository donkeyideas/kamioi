#!/usr/bin/env python3
"""Check what's in the llm_mappings_summary table"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def check_summary():
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text("""
                SELECT * FROM llm_mappings_summary 
                ORDER BY last_updated DESC 
                LIMIT 1
            """))
            row = result.fetchone()
            if row:
                print("Summary Table Contents:")
                print(f"  Total Mappings: {row[1]:,}")
                print(f"  Approved: {row[2]:,}")
                print(f"  Pending: {row[3]:,}")
                print(f"  Rejected: {row[4]:,}")
                print(f"  Daily Processed: {row[5]:,}")
                print(f"  Avg Confidence: {row[6]:.2f}")
                print(f"  High Confidence: {row[7]:,}")
                print(f"  Last Updated: {row[8]}")
            else:
                print("No data in summary table")
            
            # Also check actual counts
            print("\nActual Database Counts:")
            result = conn.execute(text("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'"))
            actual_pending = result.scalar()
            print(f"  Status='pending': {actual_pending:,}")
            
            result = conn.execute(text("SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 0"))
            admin_pending = result.scalar()
            print(f"  admin_approved=0: {admin_pending:,}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM llm_mappings_summary ORDER BY last_updated DESC LIMIT 1")
            row = cursor.fetchone()
            if row:
                print("Summary Table Contents:")
                print(f"  Total Mappings: {row[1]:,}")
                print(f"  Approved: {row[2]:,}")
                print(f"  Pending: {row[3]:,}")
                print(f"  Rejected: {row[4]:,}")
                print(f"  Daily Processed: {row[5]:,}")
                print(f"  Avg Confidence: {row[6]:.2f}")
                print(f"  High Confidence: {row[7]:,}")
                print(f"  Last Updated: {row[8]}")
            
            cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
            actual_pending = cursor.fetchone()[0]
            print(f"\nActual Status='pending': {actual_pending:,}")
            
            conn.close()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == '__main__':
    check_summary()


