#!/usr/bin/env python3

import sqlite3
import os

def update_llm_schema():
    """Update LLM mappings schema to add source tracking"""
    print("UPDATING LLM MAPPINGS SCHEMA")
    print("=" * 40)
    
    db_path = "kamioi.db"
    if not os.path.exists(db_path):
        print(f"[ERROR] Database file not found: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current schema
        cursor.execute("PRAGMA table_info(llm_mappings)")
        columns = cursor.fetchall()
        print("Current schema:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        # Add new columns if they don't exist
        new_columns = [
            ("source_type", "VARCHAR(20) DEFAULT 'admin'"),  # 'user', 'admin', 'auto'
            ("user_id", "INTEGER"),  # Link to user who submitted
            ("dashboard_type", "VARCHAR(20)"),  # 'individual', 'family', 'business'
            ("transaction_id", "INTEGER"),  # Link to transaction
            ("submission_method", "VARCHAR(20) DEFAULT 'bulk_upload'"),  # 'bulk_upload', 'manual', 'user_submission'
            ("llm_attempts", "INTEGER DEFAULT 1"),  # Number of LLM attempts
            ("auto_approved", "BOOLEAN DEFAULT 0"),  # Whether auto-approved by LLM
            ("admin_reviewed", "BOOLEAN DEFAULT 0"),  # Whether admin has reviewed
            ("learning_weight", "REAL DEFAULT 1.0")  # Weight for learning algorithm
        ]
        
        for col_name, col_type in new_columns:
            try:
                cursor.execute(f"ALTER TABLE llm_mappings ADD COLUMN {col_name} {col_type}")
                print(f"[OK] Added column: {col_name}")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e).lower():
                    print(f"[SKIP] Column {col_name} already exists")
                else:
                    print(f"[ERROR] Failed to add {col_name}: {e}")
        
        # Update existing records to have proper source tracking
        print("\nUpdating existing records...")
        
        # Mark all existing records as admin bulk uploads
        cursor.execute("""
            UPDATE llm_mappings 
            SET source_type = 'admin',
                submission_method = 'bulk_upload',
                admin_reviewed = 1,
                auto_approved = 1
            WHERE source_type IS NULL
        """)
        
        updated_count = cursor.rowcount
        print(f"[OK] Updated {updated_count} existing records as admin bulk uploads")
        
        # Create indexes for better performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_llm_source_type ON llm_mappings(source_type)",
            "CREATE INDEX IF NOT EXISTS idx_llm_user_id ON llm_mappings(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_llm_dashboard_type ON llm_mappings(dashboard_type)",
            "CREATE INDEX IF NOT EXISTS idx_llm_status_source ON llm_mappings(status, source_type)",
            "CREATE INDEX IF NOT EXISTS idx_llm_admin_reviewed ON llm_mappings(admin_reviewed)"
        ]
        
        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
                print(f"[OK] Created index: {index_sql.split()[-1]}")
            except sqlite3.OperationalError as e:
                print(f"[SKIP] Index already exists or error: {e}")
        
        conn.commit()
        conn.close()
        
        print("\n[SUCCESS] Database schema updated successfully")
        print("New columns added:")
        for col_name, _ in new_columns:
            print(f"  - {col_name}")
        
    except Exception as e:
        print(f"[ERROR] Failed to update schema: {e}")

if __name__ == "__main__":
    update_llm_schema()
