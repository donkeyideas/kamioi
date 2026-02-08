#!/usr/bin/env python3
"""
Inspect what's in the pending LLM mappings queue (700 items)
Shows details about pending mappings waiting for approval
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def inspect_pending_queue():
    """Inspect pending LLM mappings queue"""
    print("=" * 60)
    print("Pending LLM Mappings Queue Inspection")
    print("=" * 60)
    print()
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Get total pending count (using status = 'pending' like the dashboard)
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE status = 'pending' AND CAST(user_id AS TEXT) != '2'
            """))
            total_pending = result.scalar() or 0
            
            # Also check admin_approved = 0
            result2 = conn.execute(text("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE admin_approved = 0
            """))
            total_admin_pending = result2.scalar() or 0
            
            # Get pending by user_id (status = 'pending')
            result = conn.execute(text("""
                SELECT user_id, COUNT(*) as count
                FROM llm_mappings
                WHERE status = 'pending' AND CAST(user_id AS TEXT) != '2'
                GROUP BY user_id
                ORDER BY count DESC
                LIMIT 10
            """))
            by_user = result.fetchall()
            
            # Get breakdown by admin_approved status
            result = conn.execute(text("""
                SELECT 
                    admin_approved,
                    COUNT(*) as count
                FROM llm_mappings
                WHERE status = 'pending' AND CAST(user_id AS TEXT) != '2'
                GROUP BY admin_approved
                ORDER BY admin_approved
            """))
            by_admin_status = result.fetchall()
            
            # Get pending by date (recent)
            result = conn.execute(text("""
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM llm_mappings
                WHERE status = 'pending' AND CAST(user_id AS TEXT) != '2'
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 7
            """))
            by_date = result.fetchall()
            
            # Get sample pending mappings
            result = conn.execute(text("""
                SELECT 
                    id, user_id, merchant_name, ticker, category, 
                    confidence, created_at, status, admin_approved
                FROM llm_mappings
                WHERE status = 'pending' AND CAST(user_id AS TEXT) != '2'
                ORDER BY created_at DESC
                LIMIT 10
            """))
            samples = result.fetchall()
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            # Get total pending count (using status = 'pending' like the dashboard)
            cursor.execute("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE status = 'pending' AND user_id != 2
            """)
            total_pending = cursor.fetchone()[0] or 0
            
            # Also check admin_approved = 0
            cursor.execute("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE admin_approved = 0
            """)
            total_admin_pending = cursor.fetchone()[0] or 0
            
            # Get pending by user_id
            cursor.execute("""
                SELECT user_id, COUNT(*) as count
                FROM llm_mappings
                WHERE status = 'pending' AND user_id != 2
                GROUP BY user_id
                ORDER BY count DESC
                LIMIT 10
            """)
            by_user = cursor.fetchall()
            
            # Get breakdown by admin_approved status
            cursor.execute("""
                SELECT 
                    admin_approved,
                    COUNT(*) as count
                FROM llm_mappings
                WHERE status = 'pending' AND user_id != 2
                GROUP BY admin_approved
                ORDER BY admin_approved
            """)
            by_admin_status = cursor.fetchall()
            
            # Get pending by date
            cursor.execute("""
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM llm_mappings
                WHERE status = 'pending' AND user_id != 2
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 7
            """)
            by_date = cursor.fetchall()
            
            # Get sample pending mappings
            cursor.execute("""
                SELECT 
                    id, user_id, merchant_name, ticker, category, 
                    confidence, created_at, status, admin_approved
                FROM llm_mappings
                WHERE status = 'pending' AND user_id != 2
                ORDER BY created_at DESC
                LIMIT 10
            """)
            samples = cursor.fetchall()
            
            conn.close()
        
        print(f"Total Pending Mappings (status='pending', user_id != 2): {total_pending:,}")
        print(f"Total with admin_approved=0: {total_admin_pending:,}")
        print()
        
        if total_pending > 0:
            print("Pending by User ID (Top 10):")
            for user_id, count in by_user:
                print(f"  - User {user_id}: {count:,} pending mappings")
            print()
            
            print("Pending by Admin Approval Status:")
            for admin_status, count in by_admin_status:
                status_name = {0: 'Not Reviewed', 1: 'Approved', -1: 'Rejected'}.get(admin_status, f'Unknown ({admin_status})')
                print(f"  - admin_approved={admin_status} ({status_name}): {count:,} mappings")
            print()
        else:
            print("No pending mappings found with status='pending' AND user_id != 2")
            print()
        
        print("Pending by Date (Last 7 days):")
        for date, count in by_date:
            print(f"  - {date}: {count:,} mappings")
        print()
        
        if samples:
            print("Sample Pending Mappings (Most Recent 10):")
            for sample in samples:
                admin_status = sample[8] if len(sample) > 8 else 'N/A'
                admin_status_name = {0: 'Not Reviewed', 1: 'Approved', -1: 'Rejected'}.get(admin_status, f'Unknown ({admin_status})')
                print(f"  - ID {sample[0]}: User {sample[1]}, {sample[2]} -> {sample[3]} ({sample[4]})")
                print(f"    Confidence: {sample[5]}, Status: {sample[7]}, Admin: {admin_status_name}, Created: {sample[6]}")
            print()
        else:
            print("No sample pending mappings to display")
            print()
        
        print("=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"The queue contains {total_pending:,} LLM mappings waiting for admin approval.")
        print("These are mappings where admin_approved = 0 (not yet approved or rejected).")
        print()
        print("What happens to these:")
        print("1. They wait in the queue until an admin reviews them")
        print("2. Admin can approve (admin_approved = 1) or reject (admin_approved = -1)")
        print("3. Once approved, they can be used for transaction processing")
        print()
        print("=" * 60)
        
    except Exception as e:
        print(f"[ERROR] Inspection failed: {e}")
        import traceback
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == '__main__':
    inspect_pending_queue()

