#!/usr/bin/env python3
"""Check all status values in llm_mappings"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def check_all():
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Check all status values
            result = conn.execute(text("""
                SELECT status, COUNT(*) as count
                FROM llm_mappings
                GROUP BY status
                ORDER BY count DESC
            """))
            print("All status values:")
            total = 0
            for status, count in result.fetchall():
                print(f"  - '{status}': {count:,}")
                total += count
            print(f"\nTotal: {total:,}")
            
            # Check admin_approved breakdown
            result = conn.execute(text("""
                SELECT admin_approved, COUNT(*) as count
                FROM llm_mappings
                GROUP BY admin_approved
                ORDER BY admin_approved
            """))
            print("\nAdmin approved breakdown:")
            for admin_status, count in result.fetchall():
                status_name = {0: 'Not Reviewed', 1: 'Approved', -1: 'Rejected'}.get(admin_status, f'Unknown ({admin_status})')
                print(f"  - {admin_status} ({status_name}): {count:,}")
            
            # Check what the dashboard query would return
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE status = 'pending' AND CAST(user_id AS TEXT) != '2'
            """))
            dashboard_count = result.scalar()
            print(f"\nDashboard query (status='pending' AND user_id != '2'): {dashboard_count:,}")
            
            # Check without user_id filter
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE status = 'pending'
            """))
            all_pending = result.scalar()
            print(f"All pending (no user filter): {all_pending:,}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT status, COUNT(*) as count
                FROM llm_mappings
                GROUP BY status
                ORDER BY count DESC
            """)
            print("All status values:")
            for status, count in cursor.fetchall():
                print(f"  - '{status}': {count:,}")
            conn.close()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == '__main__':
    check_all()


