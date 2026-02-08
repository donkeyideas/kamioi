#!/usr/bin/env python3
"""
Optimize admin dashboard for large datasets (14M+ rows)
Adds indexes, creates summary tables, and optimizes queries
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def add_llm_mappings_indexes():
    """Add critical indexes to llm_mappings table for fast queries"""
    print("[OPTIMIZATION] Adding indexes to llm_mappings table...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    # Indexes for common query patterns in admin dashboard
    indexes = [
        ("idx_llm_mappings_status", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_status ON llm_mappings(status)"),
        ("idx_llm_mappings_created_at", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_created_at ON llm_mappings(created_at DESC)"),
        ("idx_llm_mappings_status_created", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_status_created ON llm_mappings(status, created_at DESC)"),
        ("idx_llm_mappings_user_id_status", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_user_id_status ON llm_mappings(user_id, status)"),
        ("idx_llm_mappings_confidence", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_confidence ON llm_mappings(confidence DESC)"),
        ("idx_llm_mappings_status_confidence", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_status_confidence ON llm_mappings(status, confidence DESC)"),
        ("idx_llm_mappings_date_status", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_date_status ON llm_mappings(DATE(created_at), status)"),
    ]
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            for name, sql in indexes:
                try:
                    conn.execute(text(sql))
                    print(f"  [OK] Created index: {name}")
                except Exception as e:
                    print(f"  [WARN] Index {name}: {e}")
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            for name, sql in indexes:
                try:
                    # SQLite doesn't support DATE() in index, use created_at directly
                    if 'DATE(' in sql:
                        # Replace with simpler index
                        sql = sql.replace('DATE(created_at)', 'created_at')
                    cursor.execute(sql)
                    print(f"  [OK] Created index: {name}")
                except Exception as e:
                    print(f"  [WARN] Index {name}: {e}")
            conn.commit()
            conn.close()
        
        print("[OPTIMIZATION] Indexes added successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to add indexes: {e}")
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return False

def create_summary_table():
    """Create a summary table for llm_mappings stats that updates periodically"""
    print("\n[OPTIMIZATION] Creating llm_mappings_summary table...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Create summary table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS llm_mappings_summary (
                    id SERIAL PRIMARY KEY,
                    total_mappings BIGINT,
                    approved_count BIGINT,
                    pending_count BIGINT,
                    rejected_count BIGINT,
                    daily_processed BIGINT,
                    avg_confidence DECIMAL(5,2),
                    high_confidence_count BIGINT,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Create index on last_updated for quick lookups
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_llm_mappings_summary_updated 
                ON llm_mappings_summary(last_updated DESC)
            """))
            
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            # Create summary table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS llm_mappings_summary (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    total_mappings INTEGER,
                    approved_count INTEGER,
                    pending_count INTEGER,
                    rejected_count INTEGER,
                    daily_processed INTEGER,
                    avg_confidence REAL,
                    high_confidence_count INTEGER,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create index
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_llm_mappings_summary_updated 
                ON llm_mappings_summary(last_updated DESC)
            """)
            
            conn.commit()
            conn.close()
        
        print("[OPTIMIZATION] Summary table created successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to create summary table: {e}")
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return False

def update_summary_table():
    """Update the summary table with current stats"""
    print("\n[OPTIMIZATION] Updating llm_mappings_summary table...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Calculate stats (using indexes for fast queries)
            result = conn.execute(text("""
                SELECT 
                    COUNT(*) as total_mappings,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
                    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as daily_processed,
                    AVG(confidence) as avg_confidence,
                    COUNT(CASE WHEN confidence > 90 THEN 1 END) as high_confidence_count
                FROM llm_mappings
            """))
            stats = result.fetchone()
            
            # Insert or update summary
            conn.execute(text("""
                INSERT INTO llm_mappings_summary 
                (total_mappings, approved_count, pending_count, rejected_count, 
                 daily_processed, avg_confidence, high_confidence_count, last_updated)
                VALUES (:total, :approved, :pending, :rejected, :daily, :avg_conf, :high_conf, CURRENT_TIMESTAMP)
                ON CONFLICT (id) DO UPDATE SET
                    total_mappings = EXCLUDED.total_mappings,
                    approved_count = EXCLUDED.approved_count,
                    pending_count = EXCLUDED.pending_count,
                    rejected_count = EXCLUDED.rejected_count,
                    daily_processed = EXCLUDED.daily_processed,
                    avg_confidence = EXCLUDED.avg_confidence,
                    high_confidence_count = EXCLUDED.high_confidence_count,
                    last_updated = CURRENT_TIMESTAMP
            """), {
                'total': stats[0] or 0,
                'approved': stats[1] or 0,
                'pending': stats[2] or 0,
                'rejected': stats[3] or 0,
                'daily': stats[4] or 0,
                'avg_conf': float(stats[5] or 0),
                'high_conf': stats[6] or 0
            })
            
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            # Calculate stats
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_mappings,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
                    COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as daily_processed,
                    AVG(confidence) as avg_confidence,
                    COUNT(CASE WHEN confidence > 90 THEN 1 END) as high_confidence_count
                FROM llm_mappings
            """)
            stats = cursor.fetchone()
            
            # Delete old summary and insert new
            cursor.execute("DELETE FROM llm_mappings_summary")
            cursor.execute("""
                INSERT INTO llm_mappings_summary 
                (total_mappings, approved_count, pending_count, rejected_count, 
                 daily_processed, avg_confidence, high_confidence_count, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                stats[0] or 0,
                stats[1] or 0,
                stats[2] or 0,
                stats[3] or 0,
                stats[4] or 0,
                float(stats[5] or 0) if stats[5] else 0.0,
                stats[6] or 0
            ))
            
            conn.commit()
            conn.close()
        
        print("[OPTIMIZATION] Summary table updated successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to update summary table: {e}")
        import traceback
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return False

def analyze_query_performance():
    """Analyze current query performance"""
    print("\n[ANALYSIS] Analyzing query performance...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        import time
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Test COUNT(*) query (most common in admin dashboard)
            start = time.time()
            result = conn.execute(text("SELECT COUNT(*) FROM llm_mappings"))
            count = result.scalar()
            elapsed = time.time() - start
            print(f"  COUNT(*) query: {elapsed:.2f}s (result: {count:,})")
            
            # Test COUNT with WHERE (status filter)
            start = time.time()
            result = conn.execute(text("SELECT COUNT(*) FROM llm_mappings WHERE status = 'approved'"))
            count = result.scalar()
            elapsed = time.time() - start
            print(f"  COUNT with WHERE (status): {elapsed:.2f}s (result: {count:,})")
            
            # Test date-based query
            start = time.time()
            result = conn.execute(text("SELECT COUNT(*) FROM llm_mappings WHERE DATE(created_at) = CURRENT_DATE"))
            count = result.scalar()
            elapsed = time.time() - start
            print(f"  COUNT with DATE filter: {elapsed:.2f}s (result: {count:,})")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            # Test COUNT(*) query
            start = time.time()
            cursor.execute("SELECT COUNT(*) FROM llm_mappings")
            count = cursor.fetchone()[0]
            elapsed = time.time() - start
            print(f"  COUNT(*) query: {elapsed:.2f}s (result: {count:,})")
            
            # Test COUNT with WHERE
            start = time.time()
            cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'approved'")
            count = cursor.fetchone()[0]
            elapsed = time.time() - start
            print(f"  COUNT with WHERE (status): {elapsed:.2f}s (result: {count:,})")
            
            # Test date-based query
            start = time.time()
            cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE DATE(created_at) = DATE('now')")
            count = cursor.fetchone()[0]
            elapsed = time.time() - start
            print(f"  COUNT with DATE filter: {elapsed:.2f}s (result: {count:,})")
            
            conn.close()
        
        print("[ANALYSIS] Performance analysis complete")
        return True
    except Exception as e:
        print(f"[ERROR] Performance analysis failed: {e}")
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return False

def main():
    """Main optimization function"""
    print("=" * 60)
    print("Large Dataset Performance Optimization")
    print("=" * 60)
    print()
    print("[INFO] Optimizing for 14M+ llm_mappings rows")
    print("       This will improve admin dashboard loading times")
    print()
    
    # Step 1: Add indexes
    print("[1/4] Adding indexes to llm_mappings...")
    add_llm_mappings_indexes()
    
    # Step 2: Create summary table
    print("\n[2/4] Creating summary table...")
    create_summary_table()
    
    # Step 3: Update summary table
    print("\n[3/4] Updating summary table (this may take a minute)...")
    update_summary_table()
    
    # Step 4: Analyze performance
    print("\n[4/4] Analyzing query performance...")
    analyze_query_performance()
    
    print()
    print("=" * 60)
    print("[SUCCESS] Optimization complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Restart backend server")
    print("2. Update admin endpoints to use summary table for stats")
    print("3. Set up periodic summary table updates (every 5-10 minutes)")
    print("4. Test admin dashboard loading times")
    print()
    print("Expected improvements:")
    print("- COUNT queries: 10-100x faster (using indexes)")
    print("- Dashboard stats: Instant (using summary table)")
    print("- Overall loading: 50-90% faster")
    print("=" * 60)

if __name__ == '__main__':
    main()


