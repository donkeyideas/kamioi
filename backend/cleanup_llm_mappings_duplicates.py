#!/usr/bin/env python3
"""
Clean up duplicate llm_mappings
Keeps only the most recent mapping for each unique combination
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def cleanup_duplicates(dry_run=True):
    """
    Remove duplicate llm_mappings, keeping only the most recent one
    
    Args:
        dry_run: If True, only show what would be deleted (default: True)
    """
    print(f"[CLEANUP] {'DRY RUN: ' if dry_run else ''}Removing duplicate llm_mappings...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Count duplicates first
            result = conn.execute(text("""
                SELECT SUM(cnt - 1) as total_duplicate_records
                FROM (
                    SELECT COUNT(*) as cnt
                    FROM llm_mappings
                    GROUP BY transaction_id, merchant_name, ticker, category
                    HAVING COUNT(*) > 1
                ) duplicates
            """))
            count_to_delete = result.scalar() or 0
            
            if dry_run:
                print(f"  Would delete {count_to_delete:,} duplicate records")
                print(f"  Would keep the most recent mapping for each unique combination")
            else:
                print(f"  Deleting {count_to_delete:,} duplicate records...")
                # Delete duplicates, keeping the one with the highest id (most recent)
                result = conn.execute(text("""
                    DELETE FROM llm_mappings
                    WHERE id NOT IN (
                        SELECT MAX(id)
                        FROM llm_mappings
                        GROUP BY transaction_id, merchant_name, ticker, category
                    )
                """))
                deleted_count = result.rowcount
                conn.commit()
                print(f"  ✅ Deleted {deleted_count:,} duplicate records")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            # Count duplicates first
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
            count_to_delete = result[0] if result and result[0] else 0
            
            if dry_run:
                print(f"  Would delete {count_to_delete:,} duplicate records")
                print(f"  Would keep the most recent mapping for each unique combination")
            else:
                print(f"  Deleting {count_to_delete:,} duplicate records...")
                # SQLite: Delete duplicates, keeping the one with the highest id
                cursor.execute("""
                    DELETE FROM llm_mappings
                    WHERE id NOT IN (
                        SELECT MAX(id)
                        FROM llm_mappings
                        GROUP BY transaction_id, merchant_name, ticker, category
                    )
                """)
                deleted_count = cursor.rowcount
                conn.commit()
                print(f"  ✅ Deleted {deleted_count:,} duplicate records")
            
            conn.close()
        
        return count_to_delete
    except Exception as e:
        print(f"[ERROR] Cleanup failed: {e}")
        import traceback
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return 0

def cleanup_excessive_mappings(max_per_transaction=10, dry_run=True):
    """
    Remove excessive mappings per transaction (keep only top N)
    
    Args:
        max_per_transaction: Maximum mappings to keep per transaction (default: 10)
        dry_run: If True, only show what would be deleted (default: True)
    """
    print(f"\n[CLEANUP] {'DRY RUN: ' if dry_run else ''}Removing excessive mappings per transaction (keeping top {max_per_transaction})...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Count excessive mappings
            result = conn.execute(text(f"""
                SELECT COUNT(*) - (
                    SELECT COUNT(DISTINCT transaction_id) * :max_per_txn
                    FROM llm_mappings
                )
                FROM llm_mappings
                WHERE (
                    SELECT COUNT(*) 
                    FROM llm_mappings lm2 
                    WHERE lm2.transaction_id = llm_mappings.transaction_id
                ) > :max_per_txn
            """), {'max_per_txn': max_per_transaction})
            count_to_delete = result.scalar() or 0
            
            if dry_run:
                print(f"  Would delete {count_to_delete:,} excessive mappings")
            else:
                print(f"  Deleting {count_to_delete:,} excessive mappings...")
                # Keep only top N mappings per transaction (by confidence or id)
                result = conn.execute(text(f"""
                    DELETE FROM llm_mappings
                    WHERE id NOT IN (
                        SELECT id FROM (
                            SELECT id,
                                ROW_NUMBER() OVER (
                                    PARTITION BY transaction_id 
                                    ORDER BY confidence DESC, id DESC
                                ) as rn
                            FROM llm_mappings
                        ) ranked
                        WHERE rn <= :max_per_txn
                    )
                """), {'max_per_txn': max_per_transaction})
                deleted_count = result.rowcount
                conn.commit()
                print(f"  ✅ Deleted {deleted_count:,} excessive mappings")
            
            db_manager.release_connection(conn)
        else:
            # SQLite doesn't support window functions easily, use a different approach
            # This is more complex for SQLite, so we'll use a simpler method
            cursor = conn.cursor()
            
            if dry_run:
                # Count transactions with more than max_per_transaction mappings
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM (
                        SELECT transaction_id
                        FROM llm_mappings
                        GROUP BY transaction_id
                        HAVING COUNT(*) > {max_per_transaction}
                    )
                """)
                txn_count = cursor.fetchone()[0] or 0
                
                # Estimate deletions
                cursor.execute(f"""
                    SELECT SUM(cnt - {max_per_transaction})
                    FROM (
                        SELECT transaction_id, COUNT(*) as cnt
                        FROM llm_mappings
                        GROUP BY transaction_id
                        HAVING COUNT(*) > {max_per_transaction}
                    )
                """)
                result = cursor.fetchone()
                count_to_delete = result[0] if result and result[0] else 0
                
                print(f"  Would delete {count_to_delete:,} excessive mappings from {txn_count} transactions")
            else:
                print(f"  Note: SQLite cleanup of excessive mappings is complex.")
                print(f"  Consider using the duplicate cleanup instead, or upgrade to PostgreSQL.")
                count_to_delete = 0
            
            conn.close()
        
        return count_to_delete
    except Exception as e:
        print(f"[ERROR] Cleanup failed: {e}")
        import traceback
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return 0

def main():
    """Main cleanup function"""
    print("=" * 60)
    print("LLM Mappings Duplicate Cleanup")
    print("=" * 60)
    print()
    print("⚠️  This will remove duplicate llm_mappings")
    print("   Keeping only the most recent mapping for each unique combination")
    print()
    
    # Step 1: Clean up exact duplicates
    print("[1/2] Cleaning up exact duplicates...")
    count = cleanup_duplicates(dry_run=True)
    
    if count == 0:
        print("\n  ✅ No exact duplicates found!")
    else:
        print(f"\n  Found {count:,} duplicate records that can be deleted")
        print(f"  This would reduce the table from 14.6M to ~{14632303 - count:,} rows")
    
    # Step 2: Clean up excessive mappings per transaction
    print("\n[2/2] Checking for excessive mappings per transaction...")
    excessive = cleanup_excessive_mappings(max_per_transaction=10, dry_run=True)
    
    if excessive > 0:
        print(f"\n  Found {excessive:,} excessive mappings that could be removed")
    
    print()
    print("=" * 60)
    print("⚠️  IMPORTANT:")
    if count > 0:
        print(f"   This would delete {count:,} duplicate records")
        print(f"   Reducing table from 14.6M to ~{14632303 - count:,} rows")
    print()
    print("   To actually clean up, run:")
    print("   python cleanup_llm_mappings_duplicates.py --execute")
    print("=" * 60)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Clean up duplicate llm_mappings')
    parser.add_argument('--execute', action='store_true', help='Actually perform the cleanup (default is dry run)')
    parser.add_argument('--max-per-txn', type=int, default=10, help='Max mappings per transaction (default: 10)')
    args = parser.parse_args()
    
    if args.execute:
        print("=" * 60)
        print("⚠️  EXECUTING CLEANUP - This will DELETE data!")
        print("=" * 60)
        print()
        response = input("Are you sure you want to remove duplicate llm_mappings? (yes/no): ")
        if response.lower() != 'yes':
            print("Cleanup cancelled.")
            sys.exit(0)
        
        count = cleanup_duplicates(dry_run=False)
        print()
        print("=" * 60)
        if count > 0:
            print(f"✅ Cleanup complete! Deleted {count:,} duplicate records")
            print(f"   Table reduced from 14.6M to ~{14632303 - count:,} rows")
        else:
            print("✅ No duplicates found to clean up")
        print("=" * 60)
    else:
        main()


