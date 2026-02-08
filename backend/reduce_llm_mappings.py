#!/usr/bin/env python3
"""
Reduce llm_mappings table size by keeping only essential data
Since there are no duplicates, we need to reduce based on business logic:
- Keep only approved mappings
- Keep only recent mappings
- Limit mappings per transaction
"""

import sys
import os
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def reduce_by_status(keep_statuses=['approved'], dry_run=True):
    """
    Keep only mappings with specific statuses
    
    Args:
        keep_statuses: List of statuses to keep (default: ['approved'])
        dry_run: If True, only show what would be deleted (default: True)
    """
    print(f"[REDUCE] {'DRY RUN: ' if dry_run else ''}Keeping only {', '.join(keep_statuses)} mappings...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Count records to delete
            placeholders = ','.join([f"'{s}'" for s in keep_statuses])
            result = conn.execute(text(f"""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE status NOT IN ({placeholders})
            """))
            count_to_delete = result.scalar() or 0
            
            if dry_run:
                print(f"  Would delete {count_to_delete:,} records (keeping {', '.join(keep_statuses)} only)")
            else:
                print(f"  Deleting {count_to_delete:,} records...")
                result = conn.execute(text(f"""
                    DELETE FROM llm_mappings 
                    WHERE status NOT IN ({placeholders})
                """))
                deleted_count = result.rowcount
                conn.commit()
                print(f"  [SUCCESS] Deleted {deleted_count:,} records")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            # Count records to delete
            placeholders = ','.join(['?' for _ in keep_statuses])
            cursor.execute(f"""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE status NOT IN ({placeholders})
            """, keep_statuses)
            count_to_delete = cursor.fetchone()[0] or 0
            
            if dry_run:
                print(f"  Would delete {count_to_delete:,} records (keeping {', '.join(keep_statuses)} only)")
            else:
                print(f"  Deleting {count_to_delete:,} records...")
                cursor.execute(f"""
                    DELETE FROM llm_mappings 
                    WHERE status NOT IN ({placeholders})
                """, keep_statuses)
                deleted_count = cursor.rowcount
                conn.commit()
                print(f"  [SUCCESS] Deleted {deleted_count:,} records")
            
            conn.close()
        
        return count_to_delete
    except Exception as e:
        print(f"[ERROR] Reduction failed: {e}")
        import traceback
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return 0

def reduce_by_date(days_to_keep=30, dry_run=True):
    """
    Keep only mappings from the last N days
    
    Args:
        days_to_keep: Number of days to keep (default: 30)
        dry_run: If True, only show what would be deleted (default: True)
    """
    print(f"\n[REDUCE] {'DRY RUN: ' if dry_run else ''}Keeping only last {days_to_keep} days...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    cutoff_date = datetime.now() - timedelta(days=days_to_keep)
    cutoff_str = cutoff_date.strftime('%Y-%m-%d %H:%M:%S')
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Count records to delete
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE created_at < :cutoff
            """), {'cutoff': cutoff_str})
            count_to_delete = result.scalar() or 0
            
            if dry_run:
                print(f"  Would delete {count_to_delete:,} records (older than {cutoff_str})")
            else:
                print(f"  Deleting {count_to_delete:,} records...")
                result = conn.execute(text("""
                    DELETE FROM llm_mappings 
                    WHERE created_at < :cutoff
                """), {'cutoff': cutoff_str})
                deleted_count = result.rowcount
                conn.commit()
                print(f"  [SUCCESS] Deleted {deleted_count:,} records")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE created_at < ?
            """, (cutoff_str,))
            count_to_delete = cursor.fetchone()[0] or 0
            
            if dry_run:
                print(f"  Would delete {count_to_delete:,} records (older than {cutoff_str})")
            else:
                print(f"  Deleting {count_to_delete:,} records...")
                cursor.execute("""
                    DELETE FROM llm_mappings 
                    WHERE created_at < ?
                """, (cutoff_str,))
                deleted_count = cursor.rowcount
                conn.commit()
                print(f"  [SUCCESS] Deleted {deleted_count:,} records")
            
            conn.close()
        
        return count_to_delete
    except Exception as e:
        print(f"[ERROR] Reduction failed: {e}")
        import traceback
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return 0

def reduce_by_confidence(min_confidence=0.5, dry_run=True):
    """
    Keep only mappings above a confidence threshold
    
    Args:
        min_confidence: Minimum confidence to keep (default: 0.5)
        dry_run: If True, only show what would be deleted (default: True)
    """
    print(f"\n[REDUCE] {'DRY RUN: ' if dry_run else ''}Keeping only mappings with confidence >= {min_confidence}...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Count records to delete
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE confidence < :min_conf OR confidence IS NULL
            """), {'min_conf': min_confidence})
            count_to_delete = result.scalar() or 0
            
            if dry_run:
                print(f"  Would delete {count_to_delete:,} records (confidence < {min_confidence})")
            else:
                print(f"  Deleting {count_to_delete:,} records...")
                result = conn.execute(text("""
                    DELETE FROM llm_mappings 
                    WHERE confidence < :min_conf OR confidence IS NULL
                """), {'min_conf': min_confidence})
                deleted_count = result.rowcount
                conn.commit()
                print(f"  [SUCCESS] Deleted {deleted_count:,} records")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE confidence < ? OR confidence IS NULL
            """, (min_confidence,))
            count_to_delete = cursor.fetchone()[0] or 0
            
            if dry_run:
                print(f"  Would delete {count_to_delete:,} records (confidence < {min_confidence})")
            else:
                print(f"  Deleting {count_to_delete:,} records...")
                cursor.execute("""
                    DELETE FROM llm_mappings 
                    WHERE confidence < ? OR confidence IS NULL
                """, (min_confidence,))
                deleted_count = cursor.rowcount
                conn.commit()
                print(f"  [SUCCESS] Deleted {deleted_count:,} records")
            
            conn.close()
        
        return count_to_delete
    except Exception as e:
        print(f"[ERROR] Reduction failed: {e}")
        import traceback
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return 0

def main():
    """Main reduction function"""
    print("=" * 60)
    print("LLM Mappings Reduction Tool")
    print("=" * 60)
    print()
    print("[INFO] No duplicates found - all 14.6M rows are unique")
    print("       Reducing based on business logic instead")
    print()
    
    # Option 1: Keep only approved
    print("[OPTION 1] Keep only approved mappings...")
    count1 = reduce_by_status(keep_statuses=['approved'], dry_run=True)
    
    # Option 2: Keep only last 7 days
    print("\n[OPTION 2] Keep only last 7 days...")
    count2 = reduce_by_date(days_to_keep=7, dry_run=True)
    
    # Option 3: Keep only high confidence
    print("\n[OPTION 3] Keep only high confidence (>= 0.5)...")
    count3 = reduce_by_confidence(min_confidence=0.5, dry_run=True)
    
    print()
    print("=" * 60)
    print("REDUCTION OPTIONS SUMMARY")
    print("=" * 60)
    print(f"Option 1 (Keep approved only): Would delete {count1:,} records")
    print(f"Option 2 (Keep last 7 days): Would delete {count2:,} records")
    print(f"Option 3 (Keep confidence >= 0.5): Would delete {count3:,} records")
    print()
    print("[RECOMMENDATION]")
    print("  Since 14,631,593 are approved and only 710 are pending/rejected,")
    print("  Option 1 would only delete 710 records (minimal impact)")
    print()
    print("  Best approach: Combine options or investigate why so many")
    print("  mappings are being generated in the first place.")
    print()
    print("=" * 60)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Reduce llm_mappings table size')
    parser.add_argument('--execute', action='store_true', help='Actually perform the reduction')
    parser.add_argument('--keep-status', nargs='+', default=['approved'], help='Statuses to keep (default: approved)')
    parser.add_argument('--days', type=int, default=7, help='Days to keep (default: 7)')
    parser.add_argument('--min-confidence', type=float, default=0.5, help='Minimum confidence (default: 0.5)')
    parser.add_argument('--strategy', choices=['status', 'date', 'confidence', 'all'], default='status',
                       help='Reduction strategy (default: status)')
    args = parser.parse_args()
    
    if args.execute:
        print("=" * 60)
        print("[WARNING] EXECUTING REDUCTION - This will DELETE data!")
        print("=" * 60)
        print()
        response = input("Are you sure? (yes/no): ")
        if response.lower() != 'yes':
            print("Reduction cancelled.")
            sys.exit(0)
        
        total_deleted = 0
        
        if args.strategy in ['status', 'all']:
            count = reduce_by_status(keep_statuses=args.keep_status, dry_run=False)
            total_deleted += count
        
        if args.strategy in ['date', 'all']:
            count = reduce_by_date(days_to_keep=args.days, dry_run=False)
            total_deleted += count
        
        if args.strategy in ['confidence', 'all']:
            count = reduce_by_confidence(min_confidence=args.min_confidence, dry_run=False)
            total_deleted += count
        
        print()
        print("=" * 60)
        print(f"[SUCCESS] Reduction complete! Deleted {total_deleted:,} records total")
        print("=" * 60)
    else:
        main()


