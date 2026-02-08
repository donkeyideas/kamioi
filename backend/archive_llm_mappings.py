#!/usr/bin/env python3
"""
Archive old llm_mappings data to improve performance
The llm_mappings table has 14.6M rows which is causing performance issues.
This script archives old data (keeps last N days).
"""

import sys
import os
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def analyze_llm_mappings():
    """Analyze the llm_mappings table"""
    print("[ANALYSIS] Analyzing llm_mappings table...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Get total count
            result = conn.execute(text("SELECT COUNT(*) FROM llm_mappings"))
            total_count = result.scalar() or 0
            
            # Get date range
            result = conn.execute(text("""
                SELECT 
                    MIN(created_at) as oldest,
                    MAX(created_at) as newest
                FROM llm_mappings
            """))
            row = result.fetchone()
            oldest = row[0] if row else None
            newest = row[1] if row else None
            
            # Get count by status
            result = conn.execute(text("""
                SELECT status, COUNT(*) as count
                FROM llm_mappings
                GROUP BY status
                ORDER BY count DESC
            """))
            status_counts = {row[0]: row[1] for row in result}
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            # Get total count
            cursor.execute("SELECT COUNT(*) FROM llm_mappings")
            total_count = cursor.fetchone()[0] or 0
            
            # Get date range
            cursor.execute("""
                SELECT 
                    MIN(created_at) as oldest,
                    MAX(created_at) as newest
                FROM llm_mappings
            """)
            row = cursor.fetchone()
            oldest = row[0] if row else None
            newest = row[1] if row else None
            
            # Get count by status
            cursor.execute("""
                SELECT status, COUNT(*) as count
                FROM llm_mappings
                GROUP BY status
                ORDER BY count DESC
            """)
            status_counts = {row[0]: row[1] for row in cursor.fetchall()}
            
            conn.close()
        
        print(f"\n  Total rows: {total_count:,}")
        print(f"  Date range: {oldest} to {newest}")
        print(f"\n  By status:")
        for status, count in status_counts.items():
            print(f"    - {status}: {count:,}")
        
        return {
            'total': total_count,
            'oldest': oldest,
            'newest': newest,
            'status_counts': status_counts
        }
    except Exception as e:
        print(f"[ERROR] Analysis failed: {e}")
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return None

def archive_old_mappings(days_to_keep=90, dry_run=True):
    """
    Archive llm_mappings older than N days
    
    Args:
        days_to_keep: Number of days to keep (default: 90)
        dry_run: If True, only show what would be deleted (default: True)
    """
    print(f"\n[ARCHIVE] {'DRY RUN: ' if dry_run else ''}Archiving llm_mappings older than {days_to_keep} days...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    cutoff_date = datetime.now() - timedelta(days=days_to_keep)
    cutoff_str = cutoff_date.strftime('%Y-%m-%d %H:%M:%S')
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            # Count records to be archived
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE created_at < :cutoff
            """), {'cutoff': cutoff_str})
            count_to_archive = result.scalar() or 0
            
            if dry_run:
                print(f"  Would archive {count_to_archive:,} records (older than {cutoff_str})")
                print(f"  Would keep records from {cutoff_str} onwards")
            else:
                print(f"  Archiving {count_to_archive:,} records...")
                result = conn.execute(text("""
                    DELETE FROM llm_mappings 
                    WHERE created_at < :cutoff
                """), {'cutoff': cutoff_str})
                deleted_count = result.rowcount
                conn.commit()
                print(f"  ✅ Archived {deleted_count:,} records")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            # Count records to be archived
            cursor.execute("""
                SELECT COUNT(*) 
                FROM llm_mappings 
                WHERE created_at < ?
            """, (cutoff_str,))
            count_to_archive = cursor.fetchone()[0] or 0
            
            if dry_run:
                print(f"  Would archive {count_to_archive:,} records (older than {cutoff_str})")
                print(f"  Would keep records from {cutoff_str} onwards")
            else:
                print(f"  Archiving {count_to_archive:,} records...")
                cursor.execute("""
                    DELETE FROM llm_mappings 
                    WHERE created_at < ?
                """, (cutoff_str,))
                deleted_count = cursor.rowcount
                conn.commit()
                print(f"  ✅ Archived {deleted_count:,} records")
            
            conn.close()
        
        return count_to_archive
    except Exception as e:
        print(f"[ERROR] Archive failed: {e}")
        import traceback
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
        return 0

def main():
    """Main function"""
    print("=" * 60)
    print("LLM Mappings Archive Tool")
    print("=" * 60)
    print()
    print("⚠️  WARNING: The llm_mappings table has 14.6M rows!")
    print("   This script helps archive old data to improve performance.")
    print()
    
    # Step 1: Analyze
    analysis = analyze_llm_mappings()
    if not analysis:
        print("[ERROR] Could not analyze table")
        return
    
    print()
    
    # Step 2: Dry run
    print("[1/2] DRY RUN - Checking what would be archived...")
    days_to_keep = 90  # Keep last 90 days
    count_to_archive = archive_old_mappings(days_to_keep, dry_run=True)
    
    if count_to_archive == 0:
        print("\n  ✅ No old records to archive!")
        return
    
    print()
    print("=" * 60)
    print("⚠️  IMPORTANT:")
    print(f"   This would delete {count_to_archive:,} records")
    print(f"   Keeping only the last {days_to_keep} days of data")
    print()
    print("   To actually archive, run:")
    print("   python archive_llm_mappings.py --execute")
    print("=" * 60)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Archive old llm_mappings data')
    parser.add_argument('--execute', action='store_true', help='Actually perform the archive (default is dry run)')
    parser.add_argument('--days', type=int, default=90, help='Number of days to keep (default: 90)')
    args = parser.parse_args()
    
    if args.execute:
        print("=" * 60)
        print("⚠️  EXECUTING ARCHIVE - This will DELETE data!")
        print("=" * 60)
        print()
        response = input("Are you sure you want to archive old llm_mappings? (yes/no): ")
        if response.lower() != 'yes':
            print("Archive cancelled.")
            sys.exit(0)
        
        analysis = analyze_llm_mappings()
        if analysis:
            count = archive_old_mappings(args.days, dry_run=False)
            print()
            print("=" * 60)
            print(f"✅ Archive complete! Deleted {count:,} records")
            print("=" * 60)
    else:
        main()

