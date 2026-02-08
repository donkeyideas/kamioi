#!/usr/bin/env python3
"""
Analyze llm_mappings table for duplicates and excessive data
The table has 14.6M rows in just 15 days - likely duplicates or excessive generation
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def analyze_duplicates():
    """Check for duplicate llm_mappings"""
    print("[ANALYSIS] Checking for duplicate llm_mappings...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Check for exact duplicates (same transaction_id, merchant_name, ticker, category)
            result = conn.execute(text("""
                SELECT 
                    transaction_id,
                    merchant_name,
                    ticker,
                    category,
                    COUNT(*) as duplicate_count
                FROM llm_mappings
                GROUP BY transaction_id, merchant_name, ticker, category
                HAVING COUNT(*) > 1
                ORDER BY duplicate_count DESC
                LIMIT 10
            """))
            duplicates = result.fetchall()
            
            # Get total duplicate count
            result = conn.execute(text("""
                SELECT COUNT(*) as total_duplicates
                FROM (
                    SELECT transaction_id, merchant_name, ticker, category
                    FROM llm_mappings
                    GROUP BY transaction_id, merchant_name, ticker, category
                    HAVING COUNT(*) > 1
                ) duplicates
            """))
            total_duplicate_groups = result.scalar() or 0
            
            # Get count of records that are duplicates
            result = conn.execute(text("""
                SELECT SUM(cnt - 1) as total_duplicate_records
                FROM (
                    SELECT COUNT(*) as cnt
                    FROM llm_mappings
                    GROUP BY transaction_id, merchant_name, ticker, category
                    HAVING COUNT(*) > 1
                ) duplicates
            """))
            total_duplicate_records = result.scalar() or 0
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            # Check for exact duplicates
            cursor.execute("""
                SELECT 
                    transaction_id,
                    merchant_name,
                    ticker,
                    category,
                    COUNT(*) as duplicate_count
                FROM llm_mappings
                GROUP BY transaction_id, merchant_name, ticker, category
                HAVING COUNT(*) > 1
                ORDER BY duplicate_count DESC
                LIMIT 10
            """)
            duplicates = cursor.fetchall()
            
            # Get total duplicate groups
            cursor.execute("""
                SELECT COUNT(*) 
                FROM (
                    SELECT transaction_id, merchant_name, ticker, category
                    FROM llm_mappings
                    GROUP BY transaction_id, merchant_name, ticker, category
                    HAVING COUNT(*) > 1
                )
            """)
            total_duplicate_groups = cursor.fetchone()[0] or 0
            
            # Get count of duplicate records
            cursor.execute("""
                SELECT SUM(cnt - 1)
                FROM (
                    SELECT COUNT(*) as cnt
                    FROM llm_mappings
                    GROUP BY transaction_id, merchant_name, ticker, category
                    HAVING COUNT(*) > 1
                )
            """)
            result = cursor.fetchone()
            total_duplicate_records = result[0] if result and result[0] else 0
            
            conn.close()
        
        print(f"\n  Total duplicate groups: {total_duplicate_groups:,}")
        print(f"  Total duplicate records (can be deleted): {total_duplicate_records:,}")
        print(f"\n  Top 10 duplicate groups:")
        for dup in duplicates[:10]:
            print(f"    - Transaction {dup[0]}, {dup[1]} -> {dup[2]} ({dup[3]}): {dup[4]} copies")
        
        return {
            'total_duplicate_groups': total_duplicate_groups,
            'total_duplicate_records': total_duplicate_records,
            'top_duplicates': duplicates
        }
    except Exception as e:
        print(f"[ERROR] Analysis failed: {e}")
        import traceback
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return None

def analyze_by_transaction():
    """Analyze mappings per transaction"""
    print("\n[ANALYSIS] Analyzing mappings per transaction...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text("""
                SELECT 
                    transaction_id,
                    COUNT(*) as mapping_count
                FROM llm_mappings
                GROUP BY transaction_id
                ORDER BY mapping_count DESC
                LIMIT 20
            """))
            top_transactions = result.fetchall()
            
            # Get average mappings per transaction
            result = conn.execute(text("""
                SELECT 
                    AVG(mapping_count) as avg_mappings,
                    MAX(mapping_count) as max_mappings,
                    MIN(mapping_count) as min_mappings
                FROM (
                    SELECT transaction_id, COUNT(*) as mapping_count
                    FROM llm_mappings
                    GROUP BY transaction_id
                ) t
            """))
            stats = result.fetchone()
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    transaction_id,
                    COUNT(*) as mapping_count
                FROM llm_mappings
                GROUP BY transaction_id
                ORDER BY mapping_count DESC
                LIMIT 20
            """)
            top_transactions = cursor.fetchall()
            
            cursor.execute("""
                SELECT 
                    AVG(mapping_count) as avg_mappings,
                    MAX(mapping_count) as max_mappings,
                    MIN(mapping_count) as min_mappings
                FROM (
                    SELECT transaction_id, COUNT(*) as mapping_count
                    FROM llm_mappings
                    GROUP BY transaction_id
                )
            """)
            stats = cursor.fetchone()
            
            conn.close()
        
        print(f"\n  Average mappings per transaction: {stats[0]:.2f}")
        print(f"  Max mappings for one transaction: {stats[1]:,}")
        print(f"  Min mappings for one transaction: {stats[2]:,}")
        print(f"\n  Top 20 transactions by mapping count:")
        for txn in top_transactions[:20]:
            print(f"    - Transaction {txn[0]}: {txn[1]:,} mappings")
        
        return {
            'avg_mappings': stats[0],
            'max_mappings': stats[1],
            'min_mappings': stats[2],
            'top_transactions': top_transactions
        }
    except Exception as e:
        print(f"[ERROR] Analysis failed: {e}")
        import traceback
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return None

def analyze_by_date():
    """Analyze mappings by creation date"""
    print("\n[ANALYSIS] Analyzing mappings by creation date...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text("""
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM llm_mappings
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            """))
            daily_counts = result.fetchall()
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM llm_mappings
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            """)
            daily_counts = cursor.fetchall()
            
            conn.close()
        
        print(f"\n  Daily mapping counts:")
        total = 0
        for day in daily_counts:
            print(f"    - {day[0]}: {day[1]:,} mappings")
            total += day[1]
        print(f"\n  Total: {total:,} mappings")
        
        return daily_counts
    except Exception as e:
        print(f"[ERROR] Analysis failed: {e}")
        import traceback
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return None

def main():
    """Main analysis function"""
    print("=" * 60)
    print("LLM Mappings Duplicate Analysis")
    print("=" * 60)
    print()
    print("[CRITICAL] 14.6M rows created in just 15 days!")
    print("   This suggests duplicates or excessive data generation.")
    print()
    
    # Analyze duplicates
    dup_analysis = analyze_duplicates()
    
    # Analyze by transaction
    txn_analysis = analyze_by_transaction()
    
    # Analyze by date
    date_analysis = analyze_by_date()
    
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    if dup_analysis:
        print(f"\n[Duplicates]")
        print(f"   - {dup_analysis['total_duplicate_groups']:,} duplicate groups")
        print(f"   - {dup_analysis['total_duplicate_records']:,} duplicate records (can be deleted)")
        
        if dup_analysis['total_duplicate_records'] > 0:
            percentage = (dup_analysis['total_duplicate_records'] / 14632303) * 100
            print(f"   - This represents {percentage:.1f}% of all records")
            print(f"\n[RECOMMENDATION] Delete duplicates to reduce table size")
    
    if txn_analysis:
        print(f"\n[Mappings per Transaction]")
        print(f"   - Average: {txn_analysis['avg_mappings']:.2f} mappings per transaction")
        print(f"   - Maximum: {txn_analysis['max_mappings']:,} mappings for one transaction")
        
        if txn_analysis['max_mappings'] > 1000:
            print(f"\n[WARNING] Some transactions have excessive mappings!")
            print(f"   This suggests a bug in the mapping generation process.")
    
    print()
    print("=" * 60)

if __name__ == '__main__':
    main()

