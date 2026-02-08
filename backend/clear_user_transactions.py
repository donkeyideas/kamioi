#!/usr/bin/env python3

import sqlite3
import os

def clear_user_transactions():
    """Clear all transactions for user beltranalain@gmail.com"""
    
    # Database path
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get user ID for beltranalain@gmail.com
        cursor.execute("SELECT id FROM users WHERE email = 'beltranalain@gmail.com'")
        user_result = cursor.fetchone()
        
        if not user_result:
            print("User beltranalain@gmail.com not found in database")
            return False
        
        user_id = user_result[0]
        print(f"Found user ID: {user_id} for beltranalain@gmail.com")
        
        # Check what transactions exist for this user
        cursor.execute("""
            SELECT COUNT(*) FROM transactions 
            WHERE user_id = ?
        """, (user_id,))
        transaction_count = cursor.fetchone()[0]
        
        print(f"Found {transaction_count} transactions for user ID {user_id}")
        
        if transaction_count > 0:
            # Show some sample transactions before clearing
            cursor.execute("""
                SELECT id, description, amount, date, category 
                FROM transactions 
                WHERE user_id = ?
                LIMIT 5
            """, (user_id,))
            sample_transactions = cursor.fetchall()
            
            print("\nSample transactions to be cleared:")
            for txn in sample_transactions:
                print(f"  - ID: {txn[0]}, {txn[1]}, ${txn[2]}, {txn[3]}, {txn[4]}")
            
            # Clear all transactions for this user
            cursor.execute("""
                DELETE FROM transactions 
                WHERE user_id = ?
            """, (user_id,))
            
            deleted_count = cursor.rowcount
            conn.commit()
            
            print(f"\nSuccessfully cleared {deleted_count} transactions for user ID {user_id}")
            
            # Verify the deletion
            cursor.execute("""
                SELECT COUNT(*) FROM transactions 
                WHERE user_id = ?
            """, (user_id,))
            remaining_count = cursor.fetchone()[0]
            
            print(f"Verification: {remaining_count} transactions remaining for this user")
            
        else:
            print("No transactions found for this user")
        
        # Also check and clear any related data
        cursor.execute("""
            SELECT COUNT(*) FROM llm_mappings 
            WHERE user_id = ?
        """, (user_id,))
        mapping_count = cursor.fetchone()[0]
        
        if mapping_count > 0:
            print(f"\nFound {mapping_count} LLM mappings for user ID {user_id}")
            
            cursor.execute("""
                DELETE FROM llm_mappings 
                WHERE user_id = ?
            """, (user_id,))
            
            deleted_mappings = cursor.rowcount
            conn.commit()
            print(f"Cleared {deleted_mappings} LLM mappings")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error clearing transactions: {e}")
        return False

if __name__ == "__main__":
    print("Clearing transactions for beltranalain@gmail.com...")
    success = clear_user_transactions()
    
    if success:
        print("\nTransaction clearing completed successfully!")
        print("The user dashboard should now show no transactions.")
    else:
        print("\nFailed to clear transactions.")
