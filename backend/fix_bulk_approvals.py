#!/usr/bin/env python3

import sqlite3
import time

def fix_bulk_approvals():
    """Fix the 14.6M mappings that were bulk uploaded but not auto-approved"""
    
    print("Fixing bulk upload auto-approvals...")
    
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    # Check current status
    cursor.execute('SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 1')
    approved_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 0 AND admin_id = "admin_bulk_upload"')
    pending_bulk_count = cursor.fetchone()[0]
    
    print(f"Current status:")
    print(f"- Approved mappings: {approved_count:,}")
    print(f"- Pending bulk uploads: {pending_bulk_count:,}")
    
    if pending_bulk_count == 0:
        print("No pending bulk uploads to fix!")
        conn.close()
        return
    
    # Update bulk uploads to approved
    print(f"\nUpdating {pending_bulk_count:,} bulk uploads to approved...")
    start_time = time.time()
    
    # Use batch update for performance
    cursor.execute('''
        UPDATE llm_mappings 
        SET admin_approved = 1 
        WHERE admin_approved = 0 AND admin_id = "admin_bulk_upload"
    ''')
    
    conn.commit()
    end_time = time.time()
    
    # Verify the update
    cursor.execute('SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 1')
    new_approved_count = cursor.fetchone()[0]
    
    print(f"Update completed in {end_time - start_time:.2f} seconds")
    print(f"Approved mappings: {new_approved_count:,}")
    print(f"Auto-approval rate should now be: {((new_approved_count - approved_count) / pending_bulk_count * 100):.1f}%")
    
    conn.close()

if __name__ == "__main__":
    fix_bulk_approvals()
