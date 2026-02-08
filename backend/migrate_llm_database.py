#!/usr/bin/env python3

import sqlite3
import os
from datetime import datetime

def migrate_llm_database():
    """
    Migrate LLM database to add missing columns and fix data
    """
    print("=== MIGRATING LLM DATABASE ===")
    
    # Connect to database
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. CHECK CURRENT SCHEMA
        print("\n1. CHECKING CURRENT SCHEMA...")
        cursor.execute("PRAGMA table_info(llm_mappings)")
        columns = cursor.fetchall()
        print("Current columns:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        # 2. ADD MISSING COLUMNS
        print("\n2. ADDING MISSING COLUMNS...")
        
        # Add processed_at column
        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN processed_at TIMESTAMP")
            print("Added processed_at column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("processed_at column already exists")
            else:
                print(f"Error adding processed_at: {e}")
        
        # Add status column if it doesn't exist
        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN status TEXT DEFAULT 'pending'")
            print("Added status column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("status column already exists")
            else:
                print(f"Error adding status: {e}")
        
        # 3. UPDATE DATA
        print("\n3. UPDATING DATA...")
        
        # Set default status for all mappings
        cursor.execute("UPDATE llm_mappings SET status = 'pending' WHERE status IS NULL")
        status_updated = cursor.rowcount
        print(f"Updated status for {status_updated} mappings")
        
        # Set processed_at for approved mappings
        cursor.execute("""
            UPDATE llm_mappings 
            SET processed_at = created_at
            WHERE admin_approved = 1 AND processed_at IS NULL
        """)
        processed_updated = cursor.rowcount
        print(f"Updated processed_at for {processed_updated} mappings")
        
        # 4. AUTO-APPROVE BULK UPLOADS
        print("\n4. AUTO-APPROVING BULK UPLOADS...")
        
        # Auto-approve bulk uploads
        cursor.execute("""
            UPDATE llm_mappings 
            SET admin_approved = 1, 
                processed_at = CURRENT_TIMESTAMP,
                status = 'approved'
            WHERE admin_id = 'admin_bulk_upload' AND admin_approved = 0
        """)
        
        auto_approved = cursor.rowcount
        print(f"Auto-approved {auto_approved} bulk upload mappings")
        
        # 5. UPDATE STATUS FOR APPROVED MAPPINGS
        print("\n5. UPDATING STATUS FOR APPROVED MAPPINGS...")
        
        cursor.execute("""
            UPDATE llm_mappings 
            SET status = 'approved'
            WHERE admin_approved = 1 AND status != 'approved'
        """)
        
        status_updated = cursor.rowcount
        print(f"Updated status for {status_updated} mappings")
        
        # 6. FINAL STATUS
        print("\n6. FINAL STATUS...")
        
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
        
        # Commit changes
        conn.commit()
        print("\nDATABASE MIGRATION COMPLETE!")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_llm_database()
