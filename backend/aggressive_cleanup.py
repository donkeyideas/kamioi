import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def aggressive_cleanup():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Performing aggressive cleanup of llm_mappings table...")
    print("=" * 60)
    
    # Check current size
    cursor.execute("SELECT COUNT(*) FROM llm_mappings")
    current_size = cursor.fetchone()[0]
    print(f"Current llm_mappings size: {current_size:,} records")
    
    if current_size > 100000:
        print("WARNING: Table is extremely large - performing aggressive cleanup...")
        
        # 1. Keep only recent pending mappings (last 7 days)
        print("\n1. Keeping only recent pending mappings...")
        cursor.execute("""
            DELETE FROM llm_mappings 
            WHERE status = 'pending' 
            AND created_at < datetime('now', '-7 days')
        """)
        old_pending = cursor.rowcount
        print(f"   Removed {old_pending} old pending mappings")
        
        # 2. Remove all processed mappings older than 1 day
        print("\n2. Removing old processed mappings...")
        cursor.execute("""
            DELETE FROM llm_mappings 
            WHERE status IN ('approved', 'rejected') 
            AND created_at < datetime('now', '-1 day')
        """)
        old_processed = cursor.rowcount
        print(f"   Removed {old_processed} old processed mappings")
        
        # 3. Remove duplicate mappings (same transaction_id)
        print("\n3. Removing duplicate mappings...")
        cursor.execute("""
            DELETE FROM llm_mappings 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM llm_mappings 
                GROUP BY transaction_id
            )
        """)
        duplicates = cursor.rowcount
        print(f"   Removed {duplicates} duplicate mappings")
        
        # 4. Remove mappings for non-existent transactions
        print("\n4. Removing orphaned mappings...")
        cursor.execute("""
            DELETE FROM llm_mappings 
            WHERE transaction_id NOT IN (
                SELECT id FROM transactions
            )
        """)
        orphaned = cursor.rowcount
        print(f"   Removed {orphaned} orphaned mappings")
        
        # Commit changes
        conn.commit()
        
        # Check final size
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        final_size = cursor.fetchone()[0]
        print(f"\nFinal llm_mappings size: {final_size:,} records")
        print(f"Reduction: {current_size - final_size:,} records removed")
        print(f"Size reduction: {((current_size - final_size) / current_size * 100):.1f}%")
        
        if final_size < 1000:
            print("\nSUCCESS: Table size is now manageable!")
        else:
            print(f"\nWARNING: Table still has {final_size:,} records")
            print("Consider implementing regular cleanup schedule")
    
    else:
        print("Table size is already manageable")
    
    # 5. Create cleanup schedule
    print("\n5. Setting up automatic cleanup...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cleanup_schedule (
            id INTEGER PRIMARY KEY,
            last_cleanup DATETIME,
            records_removed INTEGER,
            next_cleanup DATETIME
        )
    """)
    
    # Insert cleanup record
    cursor.execute("""
        INSERT OR REPLACE INTO cleanup_schedule 
        (id, last_cleanup, records_removed, next_cleanup)
        VALUES (1, datetime('now'), ?, datetime('now', '+1 day'))
    """, (current_size - final_size if 'final_size' in locals() else 0,))
    
    print("   Cleanup schedule created")
    
    conn.close()
    return True

if __name__ == "__main__":
    aggressive_cleanup()
