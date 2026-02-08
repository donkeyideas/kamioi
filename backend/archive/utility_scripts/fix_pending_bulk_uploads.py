"""
Fix existing bulk uploads that are stuck in pending status
This script will approve all bulk uploads (user_id=2) that are currently pending
"""

import sqlite3
import os

def fix_pending_bulk_uploads():
    """Approve all bulk upload mappings that are currently pending"""
    # Get database path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(current_dir, "kamioi.db")
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Count pending bulk uploads
        cursor.execute('''
            SELECT COUNT(*) FROM llm_mappings 
            WHERE user_id = 2 AND admin_approved = 0
        ''')
        pending_count = cursor.fetchone()[0]
        
        print(f"Found {pending_count:,} pending bulk uploads (user_id=2)")
        
        if pending_count == 0:
            print("No pending bulk uploads to fix!")
            return
        
        # Update all pending bulk uploads to approved
        print(f"\nUpdating {pending_count:,} bulk uploads to approved...")
        cursor.execute('''
            UPDATE llm_mappings 
            SET admin_approved = 1, status = 'approved'
            WHERE user_id = 2 AND admin_approved = 0
        ''')
        
        conn.commit()
        updated_count = cursor.rowcount
        
        print(f"Successfully approved {updated_count:,} bulk upload mappings")
        
        # Verify the update
        cursor.execute('''
            SELECT COUNT(*) FROM llm_mappings 
            WHERE user_id = 2 AND admin_approved = 0
        ''')
        remaining_pending = cursor.fetchone()[0]
        
        if remaining_pending == 0:
            print("All bulk uploads are now approved!")
        else:
            print(f"Warning: {remaining_pending:,} bulk uploads are still pending")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Fixing Pending Bulk Uploads")
    print("=" * 60)
    fix_pending_bulk_uploads()
    print("=" * 60)

