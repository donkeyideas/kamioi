#!/usr/bin/env python3
"""
Quick performance optimization script for admin dashboard
Implements Phase 1 quick wins from ADMIN_DASHBOARD_PERFORMANCE_OPTIMIZATION_OPTIONS.md
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def check_column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = :table AND column_name = :column
            """), {'table': table_name, 'column': column_name})
            exists = result.fetchone() is not None
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = [row[1] for row in cursor.fetchall()]
            exists = column_name in columns
            conn.close()
        return exists
    except Exception as e:
        print(f"  ⚠️  Error checking column {table_name}.{column_name}: {e}")
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return False

def add_database_indexes():
    """Add critical database indexes for performance"""
    print("[OPTIMIZATION] Adding database indexes...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    # Check which columns exist before creating indexes
    has_dashboard = check_column_exists('transactions', 'dashboard')
    
    indexes = [
        ("idx_transactions_user_id", "CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)"),
        ("idx_transactions_status", "CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)"),
        ("idx_transactions_date", "CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC)"),
        ("idx_transactions_user_id_status", "CREATE INDEX IF NOT EXISTS idx_transactions_user_id_status ON transactions(user_id, status)"),
        ("idx_users_account_type", "CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type)"),
        ("idx_users_created_at", "CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)"),
        ("idx_llm_mappings_user_id", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_user_id ON llm_mappings(user_id)"),
    ]
    
    # Only add dashboard index if column exists
    if has_dashboard:
        indexes.insert(2, ("idx_transactions_dashboard", "CREATE INDEX IF NOT EXISTS idx_transactions_dashboard ON transactions(dashboard)"))
    else:
        print("  ℹ️  Skipping idx_transactions_dashboard (column 'dashboard' doesn't exist)")
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            for name, sql in indexes:
                try:
                    conn.execute(text(sql))
                    print(f"  ✅ Created index: {name}")
                except Exception as e:
                    print(f"  ⚠️  Index {name} may already exist or error: {e}")
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            for name, sql in indexes:
                try:
                    cursor.execute(sql)
                    print(f"  ✅ Created index: {name}")
                except Exception as e:
                    print(f"  ⚠️  Index {name} may already exist or error: {e}")
            conn.commit()
            conn.close()
        
        print("[OPTIMIZATION] ✅ Database indexes added successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to add indexes: {e}")
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return False

def check_existing_indexes():
    """Check which indexes already exist"""
    print("[CHECK] Checking existing indexes...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text("""
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename IN ('transactions', 'users', 'llm_mappings')
                ORDER BY tablename, indexname
            """))
            indexes = [row[0] for row in result]
            print(f"  Found {len(indexes)} existing indexes:")
            for idx in indexes:
                print(f"    - {idx}")
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT name 
                FROM sqlite_master 
                WHERE type='index' 
                AND tbl_name IN ('transactions', 'users', 'llm_mappings')
                ORDER BY name
            """)
            indexes = [row[0] for row in cursor.fetchall()]
            print(f"  Found {len(indexes)} existing indexes:")
            for idx in indexes:
                print(f"    - {idx}")
            conn.close()
        
        return indexes
    except Exception as e:
        print(f"[ERROR] Failed to check indexes: {e}")
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return []

def analyze_slow_queries():
    """Analyze potential slow queries"""
    print("[ANALYSIS] Analyzing query performance...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Check if pg_stat_statements is available
            try:
                result = conn.execute(text("""
                    SELECT query, mean_exec_time, calls
                    FROM pg_stat_statements
                    WHERE query LIKE '%transactions%' OR query LIKE '%users%'
                    ORDER BY mean_exec_time DESC
                    LIMIT 5
                """))
                print("  Top 5 slow queries:")
                for row in result:
                    query = row[0][:80] + "..." if len(row[0]) > 80 else row[0]
                    print(f"    - {query}")
                    print(f"      Avg time: {row[1]:.2f}ms, Calls: {row[2]}")
            except Exception as e:
                print(f"  ⚠️  pg_stat_statements not available: {e}")
            
            # Check table sizes
            result = conn.execute(text("""
                SELECT 
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
                FROM pg_tables
                WHERE tablename IN ('transactions', 'users', 'llm_mappings')
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            """))
            print("\n  Table sizes:")
            for row in result:
                print(f"    - {row[1]}: {row[2]}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            # SQLite doesn't have query stats, but we can check table info
            print("  Table info:")
            for table in ['transactions', 'users', 'llm_mappings']:
                try:
                    # Get index count for this table
                    cursor.execute("""
                        SELECT COUNT(*) 
                        FROM sqlite_master 
                        WHERE type='index' AND tbl_name = ?
                    """, (table,))
                    index_count = cursor.fetchone()[0]
                    
                    # Get row count
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    row_count = cursor.fetchone()[0]
                    
                    # Format row count with commas
                    row_count_str = f"{row_count:,}" if row_count > 1000 else str(row_count)
                    
                    print(f"    - {table}: {index_count} indexes, {row_count_str} rows")
                    
                    # Warn about large tables
                    if table == 'llm_mappings' and row_count > 1000000:
                        print(f"      ⚠️  WARNING: {table} has {row_count_str} rows - this may cause performance issues!")
                        print(f"      💡 Consider archiving old data or partitioning this table")
                except Exception as e:
                    print(f"    - {table}: Error getting info ({e})")
            
            conn.close()
        
        print("[ANALYSIS] ✅ Analysis complete")
        return True
    except Exception as e:
        print(f"[ERROR] Analysis failed: {e}")
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return False

def main():
    """Main optimization function"""
    print("=" * 60)
    print("Admin Dashboard Performance Optimization - Phase 1")
    print("=" * 60)
    print()
    
    # Step 1: Check existing indexes
    print("[1/3] Checking existing indexes...")
    existing = check_existing_indexes()
    print()
    
    # Step 2: Add missing indexes
    print("[2/3] Adding database indexes...")
    success = add_database_indexes()
    print()
    
    # Step 3: Analyze performance
    print("[3/3] Analyzing query performance...")
    analyze_slow_queries()
    print()
    
    print("=" * 60)
    if success:
        print("✅ Phase 1 optimizations completed successfully!")
        print()
        print("⚠️  CRITICAL FINDING:")
        print("   The llm_mappings table has 14.6 MILLION rows!")
        print("   This is likely causing major performance issues.")
        print()
        print("💡 RECOMMENDED ACTIONS:")
        print("   1. Archive old llm_mappings data (keep last 30-90 days)")
        print("   2. Add indexes on frequently queried columns")
        print("   3. Consider partitioning the table by date")
        print("   4. Review if all this data needs to be kept")
        print()
        print("Next steps:")
        print("1. Restart the backend server")
        print("2. Test admin dashboard loading times")
        print("3. Monitor performance improvements")
        print("4. Address the llm_mappings table size (see above)")
        print("5. Consider implementing Phase 2 optimizations")
    else:
        print("⚠️  Some optimizations may have failed. Check errors above.")
    print("=" * 60)

if __name__ == '__main__':
    main()

