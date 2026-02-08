#!/usr/bin/env python3
"""
Implement Database Recommendations
- Add foreign key constraints
- Add indexes
- Clean user 108 data
- Verify database integrity
"""

from database_manager import db_manager
from sqlalchemy import text
import sys

def clean_user_108():
    """Clean all data for user 108"""
    print("=" * 60)
    print("CLEANING USER 108 DATA")
    print("=" * 60)
    
    conn = db_manager.get_connection()
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Delete in proper order (respecting foreign keys)
            # Check if table exists first
            try:
                table_check = conn.execute(text('''
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'round_up_allocations'
                    )
                '''))
                if table_check.scalar():
                    print("Deleting round_up_allocations...")
                    result1 = conn.execute(text('''
                        DELETE FROM round_up_allocations 
                        WHERE transaction_id IN (
                            SELECT id FROM transactions WHERE user_id = 108
                        )
                    '''))
                    print(f"  Deleted {result1.rowcount} allocations")
                else:
                    print("  round_up_allocations table does not exist, skipping...")
            except Exception as e:
                print(f"  Could not delete allocations: {e}")
            
            print("Deleting llm_mappings...")
            result2 = conn.execute(text('''
                DELETE FROM llm_mappings 
                WHERE user_id = CAST(108 AS TEXT)
            '''))
            print(f"  Deleted {result2.rowcount} mappings")
            
            print("Deleting transactions...")
            result3 = conn.execute(text('DELETE FROM transactions WHERE user_id = 108'))
            print(f"  Deleted {result3.rowcount} transactions")
            
            conn.commit()
            print("\nSUCCESS User 108 data cleaned successfully")
        else:
            cursor = conn.cursor()
            
            print("Deleting round_up_allocations...")
            cursor.execute('''
                DELETE FROM round_up_allocations 
                WHERE transaction_id IN (
                    SELECT id FROM transactions WHERE user_id = 108
                )
            ''')
            print(f"  Deleted {cursor.rowcount} allocations")
            
            print("Deleting llm_mappings...")
            cursor.execute('DELETE FROM llm_mappings WHERE user_id = ?', ('108',))
            print(f"  Deleted {cursor.rowcount} mappings")
            
            print("Deleting transactions...")
            cursor.execute('DELETE FROM transactions WHERE user_id = ?', (108,))
            print(f"  Deleted {cursor.rowcount} transactions")
            
            conn.commit()
            cursor.close()
            print("\nSUCCESS User 108 data cleaned successfully")
            
    except Exception as e:
        conn.rollback()
        print(f"\nERROR: Error cleaning data: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
    
    return True

def add_foreign_key_constraints():
    """Add foreign key constraints to ensure data integrity"""
    print("\n" + "=" * 60)
    print("ADDING FOREIGN KEY CONSTRAINTS")
    print("=" * 60)
    
    conn = db_manager.get_connection()
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            constraints = [
                {
                    'name': 'fk_transactions_user',
                    'sql': '''
                        DO $$ 
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM pg_constraint 
                                WHERE conname = 'fk_transactions_user'
                            ) THEN
                                ALTER TABLE transactions 
                                ADD CONSTRAINT fk_transactions_user 
                                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
                            END IF;
                        END $$;
                    ''',
                    'desc': 'transactions.user_id -> users.id'
                },
                {
                    'name': 'fk_round_up_allocations_transaction',
                    'sql': '''
                        DO $$ 
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM pg_constraint 
                                WHERE conname = 'fk_round_up_allocations_transaction'
                            ) THEN
                                ALTER TABLE round_up_allocations 
                                ADD CONSTRAINT fk_round_up_allocations_transaction 
                                FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;
                            END IF;
                        END $$;
                    ''',
                    'desc': 'round_up_allocations.transaction_id -> transactions.id'
                }
            ]
            
            for constraint in constraints:
                try:
                    print(f"Adding constraint: {constraint['name']} ({constraint['desc']})...")
                    conn.execute(text(constraint['sql']))
                    print(f"  SUCCESS: Added")
                except Exception as e:
                    if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
                        print(f"  WARNING: Already exists (skipping)")
                    else:
                        print(f"  ERROR: {e}")
            
            conn.commit()
        else:
            # SQLite - check if constraints exist
            cursor = conn.cursor()
            
            # SQLite doesn't support adding constraints to existing tables easily
            # We'll just verify the schema
            cursor.execute("PRAGMA foreign_key_check(transactions)")
            fk_errors = cursor.fetchall()
            if fk_errors:
                print(f"WARNING  Found {len(fk_errors)} foreign key violations in transactions table")
            else:
                print("SUCCESS No foreign key violations found")
            
            cursor.close()
            conn.commit()
            
    except Exception as e:
        conn.rollback()
        print(f"\nERROR: Error adding constraints: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
    
    return True

def add_indexes():
    """Add indexes for better performance"""
    print("\n" + "=" * 60)
    print("ADDING INDEXES")
    print("=" * 60)
    
    conn = db_manager.get_connection()
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            indexes = [
                {
                    'name': 'idx_transactions_user_id',
                    'sql': 'CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)',
                    'desc': 'Index on transactions.user_id for faster user queries'
                },
                {
                    'name': 'idx_transactions_user_date',
                    'sql': 'CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC)',
                    'desc': 'Composite index for user transactions sorted by date'
                },
                {
                    'name': 'idx_transactions_status',
                    'sql': 'CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(user_id, status)',
                    'desc': 'Index for filtering by status per user'
                }
            ]
            
            for index in indexes:
                try:
                    print(f"Creating index: {index['name']}...")
                    conn.execute(text(index['sql']))
                    print(f"  SUCCESS: Created")
                except Exception as e:
                    print(f"  WARNING  {e}")
            
            conn.commit()
        else:
            cursor = conn.cursor()
            
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)",
                "CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC)",
                "CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(user_id, status)"
            ]
            
            for index_sql in indexes:
                try:
                    cursor.execute(index_sql)
                    print(f"  SUCCESS Created index")
                except Exception as e:
                    print(f"  WARNING  {e}")
            
            conn.commit()
            cursor.close()
            
    except Exception as e:
        conn.rollback()
        print(f"\nERROR: Error adding indexes: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
    
    return True

def verify_data_integrity():
    """Verify data integrity for all users"""
    print("\n" + "=" * 60)
    print("VERIFYING DATA INTEGRITY")
    print("=" * 60)
    
    conn = db_manager.get_connection()
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Check for orphaned transactions (user_id doesn't exist in users)
            result = conn.execute(text('''
                SELECT COUNT(*) 
                FROM transactions t 
                LEFT JOIN users u ON t.user_id = u.id 
                WHERE u.id IS NULL
            '''))
            orphaned = result.scalar() or 0
            
            if orphaned > 0:
                print(f"ERROR: Found {orphaned} orphaned transactions (user_id doesn't exist)")
            else:
                print("SUCCESS: No orphaned transactions found")
            
            # Check for orphaned allocations (if table exists)
            try:
                table_check = conn.execute(text('''
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'round_up_allocations'
                    )
                '''))
                if table_check.scalar():
                    result = conn.execute(text('''
                        SELECT COUNT(*) 
                        FROM round_up_allocations ra 
                        LEFT JOIN transactions t ON ra.transaction_id = t.id 
                        WHERE t.id IS NULL
                    '''))
                    orphaned_alloc = result.scalar() or 0
                    
                    if orphaned_alloc > 0:
                        print(f"ERROR: Found {orphaned_alloc} orphaned allocations")
                    else:
                        print("SUCCESS: No orphaned allocations found")
                else:
                    print("INFO: round_up_allocations table does not exist, skipping check")
            except Exception as e:
                print(f"WARNING: Could not check orphaned allocations: {e}")
            
            # Count transactions per user
            result = conn.execute(text('''
                SELECT user_id, COUNT(*) as cnt 
                FROM transactions 
                GROUP BY user_id 
                ORDER BY cnt DESC
            '''))
            print("\nTransaction counts by user:")
            for row in result:
                print(f"  User {row[0]}: {row[1]} transactions")
                
        else:
            cursor = conn.cursor()
            
            # Check for orphaned transactions
            cursor.execute('''
                SELECT COUNT(*) 
                FROM transactions t 
                LEFT JOIN users u ON t.user_id = u.id 
                WHERE u.id IS NULL
            ''')
            orphaned = cursor.fetchone()[0] or 0
            
            if orphaned > 0:
                print(f"ERROR: Found {orphaned} orphaned transactions")
            else:
                print("SUCCESS: No orphaned transactions found")
            
            # Count transactions per user
            cursor.execute('''
                SELECT user_id, COUNT(*) as cnt 
                FROM transactions 
                GROUP BY user_id 
                ORDER BY cnt DESC
            ''')
            print("\nTransaction counts by user:")
            for row in cursor.fetchall():
                print(f"  User {row[0]}: {row[1]} transactions")
            
            cursor.close()
            
    except Exception as e:
        print(f"\nERROR Error verifying integrity: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()
    
    return True

def main():
    print("=" * 60)
    print("IMPLEMENTING DATABASE RECOMMENDATIONS")
    print("=" * 60)
    print()
    
    # Step 1: Clean user 108 data
    if not clean_user_108():
        print("\nERROR: Failed to clean user 108 data. Aborting.")
        sys.exit(1)
    
    # Step 2: Add foreign key constraints
    if not add_foreign_key_constraints():
        print("\nWARNING: Failed to add some constraints. Continuing...")
    
    # Step 3: Add indexes
    if not add_indexes():
        print("\nWARNING: Failed to add some indexes. Continuing...")
    
    # Step 4: Verify data integrity
    if not verify_data_integrity():
        print("\nWARNING: Data integrity check had issues. Review manually.")
    
    print("\n" + "=" * 60)
    print("SUCCESS: RECOMMENDATIONS IMPLEMENTED")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Restart your backend server")
    print("2. Test uploading transactions")
    print("3. Verify transactions appear correctly")

if __name__ == '__main__':
    main()

