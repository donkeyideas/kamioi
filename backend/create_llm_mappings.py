import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def create_llm_mappings():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Creating LLM mappings for pending transactions...")
    print("=" * 50)
    
    # Get pending transactions
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE status = 'pending'")
    pending_count = cursor.fetchone()[0]
    print(f"Pending transactions: {pending_count}")
    
    if pending_count > 0:
        # Get pending transactions
        cursor.execute("""
            SELECT id, user_id, merchant, category, description 
            FROM transactions 
            WHERE status = 'pending' 
            ORDER BY created_at DESC
        """)
        
        pending_transactions = cursor.fetchall()
        
        mappings_created = 0
        for txn in pending_transactions:
            txn_id, user_id, merchant, category, description = txn
            
            # Check if mapping already exists
            cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE transaction_id = ?", (txn_id,))
            exists = cursor.fetchone()[0]
            
            if exists == 0:
                # Create llm_mapping entry
                cursor.execute("""
                    INSERT INTO llm_mappings (user_id, transaction_id, merchant_name, category, status, dashboard_type)
                    VALUES (?, ?, ?, ?, 'pending', 'individual')
                """, (user_id, txn_id, merchant, category))
                mappings_created += 1
        
        print(f"Created {mappings_created} new llm_mapping entries")
        
        # Commit changes
        conn.commit()
        
        # Check total mappings
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        print(f"Total llm_mappings: {total_mappings}")
        
        # Check pending mappings
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
        pending_mappings = cursor.fetchone()[0]
        print(f"Pending llm_mappings: {pending_mappings}")
        
        print("\n" + "=" * 50)
        print("LLM mappings created successfully!")
        print("The AI mapping system should now be able to process these transactions")
        
    else:
        print("No pending transactions found")
    
    conn.close()
    return True

if __name__ == "__main__":
    create_llm_mappings()
