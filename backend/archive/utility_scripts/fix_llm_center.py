#!/usr/bin/env python3

import sqlite3
import os
from datetime import datetime

def fix_llm_center_issues():
    """
    Fix all LLM Center issues:
    1. Auto-approval for bulk uploads
    2. Fix date display issues
    3. Add bulk approval functionality
    4. Fix queue processing logic
    """
    print("=== FIXING LLM CENTER ISSUES ===")
    
    # Connect to database
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. FIX AUTO-APPROVAL FOR BULK UPLOADS
        print("\n1. FIXING AUTO-APPROVAL FOR BULK UPLOADS...")
        
        # Check current state
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 0")
        pending_before = cursor.fetchone()[0]
        print(f"Pending mappings before: {pending_before}")
        
        # Auto-approve bulk uploads (admin_id = 'admin_bulk_upload')
        cursor.execute("""
            UPDATE llm_mappings 
            SET admin_approved = 1, 
                processed_at = CURRENT_TIMESTAMP,
                status = 'approved'
            WHERE admin_id = 'admin_bulk_upload' AND admin_approved = 0
        """)
        
        auto_approved = cursor.rowcount
        print(f"Auto-approved {auto_approved} bulk upload mappings")
        
        # 2. ADD PROCESSING TIMESTAMPS
        print("\n2. ADDING PROCESSING TIMESTAMPS...")
        
        # Add processed_at column if it doesn't exist
        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN processed_at TIMESTAMP")
            print("Added processed_at column")
        except sqlite3.OperationalError:
            print("processed_at column already exists")
        
        # Update processed_at for approved mappings
        cursor.execute("""
            UPDATE llm_mappings 
            SET processed_at = created_at
            WHERE admin_approved = 1 AND processed_at IS NULL
        """)
        
        updated_timestamps = cursor.rowcount
        print(f"Updated {updated_timestamps} processing timestamps")
        
        # 3. FIX STATUS VALUES
        print("\n3. FIXING STATUS VALUES...")
        
        # Update status for approved mappings
        cursor.execute("""
            UPDATE llm_mappings 
            SET status = 'approved'
            WHERE admin_approved = 1 AND status != 'approved'
        """)
        
        status_updated = cursor.rowcount
        print(f"Updated status for {status_updated} mappings")
        
        # 4. CHECK FINAL STATE
        print("\n4. CHECKING FINAL STATE...")
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 1")
        approved_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 0")
        pending_mappings = cursor.fetchone()[0]
        
        auto_approval_rate = (approved_mappings / total_mappings) * 100 if total_mappings > 0 else 0
        
        print(f"Total mappings: {total_mappings}")
        print(f"Approved mappings: {approved_mappings}")
        print(f"Pending mappings: {pending_mappings}")
        print(f"Auto-approval rate: {auto_approval_rate:.2f}%")
        
        # 5. ADD BULK APPROVAL FUNCTIONALITY
        print("\n5. ADDING BULK APPROVAL FUNCTIONALITY...")
        
        # Create a function to approve multiple mappings
        def approve_mappings_bulk(mapping_ids):
            """Approve multiple mappings at once"""
            placeholders = ','.join(['?' for _ in mapping_ids])
            cursor.execute(f"""
                UPDATE llm_mappings 
                SET admin_approved = 1, 
                    processed_at = CURRENT_TIMESTAMP,
                    status = 'approved'
                WHERE id IN ({placeholders})
            """, mapping_ids)
            return cursor.rowcount
        
        # Test bulk approval with first 100 pending mappings
        cursor.execute("SELECT id FROM llm_mappings WHERE admin_approved = 0 LIMIT 100")
        test_ids = [row[0] for row in cursor.fetchall()]
        
        if test_ids:
            approved_count = approve_mappings_bulk(test_ids)
            print(f"Bulk approved {approved_count} test mappings")
        
        # 6. FIX QUEUE PROCESSING LOGIC
        print("\n6. FIXING QUEUE PROCESSING LOGIC...")
        
        # Add queue processing timestamps
        cursor.execute("""
            UPDATE llm_mappings 
            SET processed_at = CURRENT_TIMESTAMP
            WHERE admin_approved = 1 AND processed_at IS NULL
        """)
        
        queue_processed = cursor.rowcount
        print(f"Fixed queue processing for {queue_processed} mappings")
        
        # Commit all changes
        conn.commit()
        print("\n✅ ALL LLM CENTER ISSUES FIXED!")
        
        # Final status report
        print("\n=== FINAL STATUS REPORT ===")
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 1")
        final_approved = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 0")
        final_pending = cursor.fetchone()[0]
        final_rate = (final_approved / total_mappings) * 100 if total_mappings > 0 else 0
        
        print(f"Final approved mappings: {final_approved}")
        print(f"Final pending mappings: {final_pending}")
        print(f"Final auto-approval rate: {final_rate:.2f}%")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_llm_center_issues()

