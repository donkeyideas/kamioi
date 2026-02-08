"""Script to check and create indexes for LLM Center performance"""
import sqlite3
import os

def check_sqlite_indexes():
    """Check existing indexes on llm_mappings table in SQLite"""
    db_path = 'kamioi.db'
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("Checking existing indexes on llm_mappings table")
    print("=" * 60)
    
    # Get all indexes on llm_mappings
    cursor.execute("""
        SELECT name, sql 
        FROM sqlite_master 
        WHERE type='index' 
        AND tbl_name='llm_mappings'
    """)
    
    indexes = cursor.fetchall()
    
    if indexes:
        print(f"\nFound {len(indexes)} indexes:")
        for name, sql in indexes:
            print(f"  - {name}")
            if sql:
                print(f"    SQL: {sql}")
    else:
        print("\nNo indexes found on llm_mappings table")
    
    # Check table structure
    cursor.execute("PRAGMA table_info(llm_mappings)")
    columns = cursor.fetchall()
    
    print(f"\nTable structure ({len(columns)} columns):")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    conn.close()
    
    print("\n" + "=" * 60)
    print("Recommended indexes for LLM Center queries:")
    print("=" * 60)
    print("""
Based on the queries used in LLM Center dashboard, these indexes would help:

1. Index on (status, admin_approved) - for filtering by status
2. Index on (created_at) - for date filtering and sorting
3. Index on (user_id, status) - for filtering user submissions
4. Index on (status, category) - for category distribution queries
5. Index on (status, confidence) - for confidence-based queries

These indexes will speed up:
- COUNT queries with WHERE status = 'approved'
- DATE(created_at) = CURRENT_DATE filtering
- ORDER BY created_at DESC (for recent mappings)
- GROUP BY category WHERE status = 'approved'
- Filtering by user_id AND status
""")

def create_sqlite_indexes():
    """Create recommended indexes for SQLite (only missing ones)"""
    db_path = 'kamioi.db'
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check existing indexes
    cursor.execute("""
        SELECT name 
        FROM sqlite_master 
        WHERE type='index' 
        AND tbl_name='llm_mappings'
    """)
    existing_indexes = {row[0] for row in cursor.fetchall()}
    
    indexes_to_create = [
        ("idx_llm_mappings_status_admin", 
         "CREATE INDEX IF NOT EXISTS idx_llm_mappings_status_admin ON llm_mappings(status, admin_approved)",
         "For filtering by status AND admin_approved (used in main analytics query)"),
        
        ("idx_llm_mappings_user_status", 
         "CREATE INDEX IF NOT EXISTS idx_llm_mappings_user_status ON llm_mappings(user_id, status)",
         "For filtering user submissions by status (pending_count query)"),
        
        ("idx_llm_mappings_status_category", 
         "CREATE INDEX IF NOT EXISTS idx_llm_mappings_status_category ON llm_mappings(status, category)",
         "For category distribution queries (GROUP BY category WHERE status = 'approved')"),
        
        ("idx_llm_mappings_status_confidence", 
         "CREATE INDEX IF NOT EXISTS idx_llm_mappings_status_confidence ON llm_mappings(status, confidence)",
         "For confidence-based filtering (high_confidence_count, good_confidence_count queries)"),
    ]
    
    print("=" * 60)
    print("Checking and creating missing indexes...")
    print("=" * 60)
    
    created_count = 0
    skipped_count = 0
    
    for name, sql, description in indexes_to_create:
        if name in existing_indexes:
            print(f"[SKIP] Index already exists: {name}")
            skipped_count += 1
        else:
            try:
                cursor.execute(sql)
                print(f"[OK] Created index: {name}")
                print(f"     Purpose: {description}")
                created_count += 1
            except Exception as e:
                print(f"[ERROR] Failed to create {name}: {e}")
    
    if created_count > 0:
        conn.commit()
        print(f"\n[SUCCESS] Created {created_count} new index(es), skipped {skipped_count} existing")
    else:
        print(f"\n[INFO] All recommended indexes already exist ({skipped_count} skipped)")
    
    conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "create":
        print("Creating indexes...")
        create_sqlite_indexes()
    else:
        print("Checking indexes... (use 'python check_indexes.py create' to create them)")
        check_sqlite_indexes()

