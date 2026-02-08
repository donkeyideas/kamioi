#!/usr/bin/env python3

import sqlite3
import os
from datetime import datetime

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def update_existing_transactions():
    """Update all existing transactions to use flat investment logic"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print("Updating existing transactions to use flat investment logic...")
        
        # Get all transactions
        cursor.execute("SELECT id, user_id, amount, round_up, fee, total_debit FROM transactions")
        transactions = cursor.fetchall()
        
        print(f"Found {len(transactions)} transactions to update")
        
        updated_count = 0
        
        for txn in transactions:
            user_id = txn['user_id']
            original_amount = txn['amount']
            
            # Get user's investment preference
            cursor.execute("SELECT round_up_amount FROM users WHERE id = ?", (user_id,))
            user_pref = cursor.fetchone()
            investment_amount = user_pref['round_up_amount'] if user_pref else 1.0
            
            # Calculate new values using flat investment logic
            new_investment = float(investment_amount)
            new_fee = new_investment * 0.25  # 25% platform fee
            new_total_debit = original_amount + new_investment + new_fee
            
            # Update the transaction
            cursor.execute("""
                UPDATE transactions 
                SET round_up = ?, fee = ?, total_debit = ?
                WHERE id = ?
            """, (new_investment, new_fee, new_total_debit, txn['id']))
            
            updated_count += 1
            
            if updated_count % 10 == 0:
                print(f"Updated {updated_count} transactions...")
        
        conn.commit()
        print(f"Successfully updated {updated_count} transactions!")
        
        # Show some examples
        print("\nSample updated transactions:")
        cursor.execute("""
            SELECT id, amount, round_up, fee, total_debit, merchant 
            FROM transactions 
            ORDER BY id DESC 
            LIMIT 5
        """)
        samples = cursor.fetchall()
        
        for sample in samples:
            print(f"  Transaction {sample['id']}: ${sample['amount']} + ${sample['round_up']} investment + ${sample['fee']} fee = ${sample['total_debit']} total")
        
    except Exception as e:
        print(f"Error updating transactions: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Starting transaction update process...")
    update_existing_transactions()
    print("Update process completed!")
