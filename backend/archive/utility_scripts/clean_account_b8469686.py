#!/usr/bin/env python3
"""
Complete cleanup script for account B8469686
Deletes all transactions, round-up allocations, and related data
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import DatabaseManager

def clean_account_b8469686():
    db_manager = DatabaseManager()
    conn = db_manager.get_connection()
    
    try:
        # Find the user_id for account_number B8469686
        if db_manager._use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('SELECT id, email, name, account_number FROM users WHERE account_number = :acc'), {'acc': 'B8469686'})
            user_row = result.fetchone()
        else:
            cursor = conn.cursor()
            cursor.execute('SELECT id, email, name, account_number FROM users WHERE account_number = ?', ('B8469686',))
            user_row = cursor.fetchone()
        
        if not user_row:
            print(f"ERROR: User with account_number 'B8469686' not found!")
            return
        
        user_id = user_row[0]
        email = user_row[1]
        name = user_row[2]
        account_number = user_row[3] if len(user_row) > 3 else 'N/A'
        
        print(f"Found user: ID={user_id}, Email={email}, Name={name}, Account={account_number}")
        print()
        
        # Count and delete round-up allocations first (foreign key constraint)
        # Check if table exists first
        try:
            if db_manager._use_postgresql:
                from sqlalchemy import text
                # Check if table exists
                table_check = conn.execute(text('''
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'round_up_allocations'
                    )
                '''))
                table_exists = table_check.scalar()
                
                if table_exists:
                    count_alloc = conn.execute(text('''
                        SELECT COUNT(*) FROM round_up_allocations ra 
                        JOIN transactions t ON ra.transaction_id = t.id 
                        WHERE t.user_id = :uid
                    '''), {'uid': user_id})
                    alloc_count = count_alloc.scalar() or 0
                    
                    if alloc_count > 0:
                        print(f"Deleting {alloc_count} round-up allocations...")
                        delete_alloc = conn.execute(text('''
                            DELETE FROM round_up_allocations 
                            WHERE transaction_id IN (
                                SELECT id FROM transactions WHERE user_id = :uid
                            )
                        '''), {'uid': user_id})
                        print(f"Deleted {delete_alloc.rowcount} round-up allocations")
                    else:
                        print("No round-up allocations to delete.")
                else:
                    print("round_up_allocations table does not exist, skipping...")
            else:
                cursor_check = conn.cursor()
                cursor_check.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='round_up_allocations'")
                table_exists = cursor_check.fetchone() is not None
                cursor_check.close()
                
                if table_exists:
                    cursor_alloc = conn.cursor()
                    cursor_alloc.execute('''
                        SELECT COUNT(*) FROM round_up_allocations ra 
                        JOIN transactions t ON ra.transaction_id = t.id 
                        WHERE t.user_id = ?
                    ''', (user_id,))
                    alloc_count = cursor_alloc.fetchone()[0] or 0
                    
                    if alloc_count > 0:
                        print(f"Deleting {alloc_count} round-up allocations...")
                        cursor_alloc.execute('''
                            DELETE FROM round_up_allocations 
                            WHERE transaction_id IN (
                                SELECT id FROM transactions WHERE user_id = ?
                            )
                        ''', (user_id,))
                        print(f"Deleted {cursor_alloc.rowcount} round-up allocations")
                    else:
                        print("No round-up allocations to delete.")
                    cursor_alloc.close()
                else:
                    print("round_up_allocations table does not exist, skipping...")
        except Exception as e:
            print(f"Note: Could not check/delete round-up allocations: {e}")
        
        # Count and delete transactions
        if db_manager._use_postgresql:
            from sqlalchemy import text
            count_result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            transaction_count = count_result.scalar() or 0
        else:
            cursor_count = conn.cursor()
            cursor_count.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
            transaction_count = cursor_count.fetchone()[0] or 0
            cursor_count.close()
        
        print(f"Found {transaction_count} transactions for user {user_id} (B8469686)")
        
        if transaction_count > 0:
            print(f"Deleting {transaction_count} transactions...")
            if db_manager._use_postgresql:
                from sqlalchemy import text
                delete_result = conn.execute(text('DELETE FROM transactions WHERE user_id = :uid'), {'uid': user_id})
                deleted_count = delete_result.rowcount
            else:
                cursor_delete = conn.cursor()
                cursor_delete.execute('DELETE FROM transactions WHERE user_id = ?', (user_id,))
                deleted_count = cursor_delete.rowcount
                cursor_delete.close()
            
            print(f"SUCCESS: Deleted {deleted_count} transactions")
        else:
            print("No transactions to delete.")
        
        # Count and delete LLM mappings for this user (user_id is stored as string in llm_mappings)
        if db_manager._use_postgresql:
            from sqlalchemy import text
            count_mappings = conn.execute(text('SELECT COUNT(*) FROM llm_mappings WHERE user_id = CAST(:uid AS TEXT)'), {'uid': user_id})
            mapping_count = count_mappings.scalar() or 0
            
            if mapping_count > 0:
                print(f"Deleting {mapping_count} LLM mappings...")
                delete_mappings = conn.execute(text('DELETE FROM llm_mappings WHERE user_id = CAST(:uid AS TEXT)'), {'uid': user_id})
                print(f"Deleted {delete_mappings.rowcount} LLM mappings")
            else:
                print("No LLM mappings to delete.")
        else:
            cursor_mappings = conn.cursor()
            cursor_mappings.execute('SELECT COUNT(*) FROM llm_mappings WHERE user_id = ?', (str(user_id),))
            mapping_count = cursor_mappings.fetchone()[0] or 0
            
            if mapping_count > 0:
                print(f"Deleting {mapping_count} LLM mappings...")
                cursor_mappings.execute('DELETE FROM llm_mappings WHERE user_id = ?', (str(user_id),))
                print(f"Deleted {cursor_mappings.rowcount} LLM mappings")
            else:
                print("No LLM mappings to delete.")
            cursor_mappings.close()
        
        # Commit all deletions
        conn.commit()
        print()
        print("=" * 60)
        print("CLEANUP COMPLETE")
        print("=" * 60)
        
        # Verify everything is clean
        if db_manager._use_postgresql:
            from sqlalchemy import text
            verify_tx = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            remaining_tx = verify_tx.scalar() or 0
            
            # Check allocations if table exists
            try:
                table_check = conn.execute(text('''
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'round_up_allocations'
                    )
                '''))
                if table_check.scalar():
                    verify_alloc = conn.execute(text('''
                        SELECT COUNT(*) FROM round_up_allocations ra 
                        JOIN transactions t ON ra.transaction_id = t.id 
                        WHERE t.user_id = :uid
                    '''), {'uid': user_id})
                    remaining_alloc = verify_alloc.scalar() or 0
                else:
                    remaining_alloc = 0
            except:
                remaining_alloc = 0
            
            verify_mappings = conn.execute(text('SELECT COUNT(*) FROM llm_mappings WHERE user_id = CAST(:uid AS TEXT)'), {'uid': user_id})
            remaining_mappings = verify_mappings.scalar() or 0
        else:
            cursor_verify = conn.cursor()
            cursor_verify.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
            remaining_tx = cursor_verify.fetchone()[0] or 0
            
            # Check allocations if table exists
            try:
                cursor_verify.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='round_up_allocations'")
                if cursor_verify.fetchone():
                    cursor_verify.execute('''
                        SELECT COUNT(*) FROM round_up_allocations ra 
                        JOIN transactions t ON ra.transaction_id = t.id 
                        WHERE t.user_id = ?
                    ''', (user_id,))
                    remaining_alloc = cursor_verify.fetchone()[0] or 0
                else:
                    remaining_alloc = 0
            except:
                remaining_alloc = 0
            
            cursor_verify.execute('SELECT COUNT(*) FROM llm_mappings WHERE user_id = ?', (str(user_id),))
            remaining_mappings = cursor_verify.fetchone()[0] or 0
            cursor_verify.close()
        
        print(f"Verification:")
        print(f"  - Remaining transactions: {remaining_tx}")
        print(f"  - Remaining round-up allocations: {remaining_alloc}")
        print(f"  - Remaining LLM mappings: {remaining_mappings}")
        
        if remaining_tx == 0 and remaining_alloc == 0 and remaining_mappings == 0:
            print()
            print("SUCCESS: Account B8469686 is completely clean!")
        else:
            print()
            print("WARNING: Some data may still remain. Check the counts above.")
        
    except Exception as e:
        import traceback
        print(f"ERROR: Failed to clean account: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        conn.rollback()
    finally:
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == '__main__':
    print("=" * 60)
    print("Complete Cleanup for Account B8469686")
    print("=" * 60)
    print()
    clean_account_b8469686()
    print("=" * 60)

