#!/usr/bin/env python3
"""Check actual pending mappings in PostgreSQL"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def check_actual():
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
            print("Mappings by Status:")
            for status, count in result.fetchall():
                print(f"  - {status or 'NULL'}: {count:,}")
            
            # Check admin_approved values
            result = conn.execute(text("""
                SELECT admin_approved, COUNT(*) as count
                FROM llm_mappings
                GROUP BY admin_approved
                ORDER BY admin_approved
            """))
            print("\nMappings by admin_approved:")
            for admin_status, count in result.fetchall():
                status_name = {0: 'Not Reviewed', 1: 'Approved', -1: 'Rejected'}.get(admin_status, f'Unknown ({admin_status})')
                print(f"  - {admin_status} ({status_name}): {count:,}")
            
            # Check combinations
            result = conn.execute(text("""
                SELECT 
                    status,
                    admin_approved,
                    COUNT(*) as count
                FROM llm_mappings
                GROUP BY status, admin_approved
                ORDER BY count DESC
                LIMIT 10
            """))
            print("\nTop 10 Status + Admin_approved Combinations:")
            for status, admin_status, count in result.fetchall():
                print(f"  - status='{status}', admin_approved={admin_status}: {count:,}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT status, COUNT(*) as count
                FROM llm_mappings
                GROUP BY status
                ORDER BY count DESC
            """)
            print("Mappings by Status:")
            for status, count in cursor.fetchall():
                print(f"  - {status or 'NULL'}: {count:,}")
            
            conn.close()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == '__main__':
    check_actual()


