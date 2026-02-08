import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def fix_llm_mapping_system():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Fixing LLM mapping system...")
    print("=" * 50)
    
    # Create mappings table if it doesn't exist
    print("Creating mappings table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mappings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            transaction_id INTEGER,
            merchant_name TEXT NOT NULL,
            suggested_category TEXT,
            confidence_score REAL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_by INTEGER,
            rejected_reason TEXT,
            dashboard_type TEXT DEFAULT 'individual'
        )
    """)
    
    print("Mappings table created/verified")
    
    # Check if there are pending transactions that need mapping
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE status = 'pending'")
    pending_count = cursor.fetchone()[0]
    print(f"Pending transactions: {pending_count}")
    
    if pending_count > 0:
        print("Creating mappings for pending transactions...")
        
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
            
            # Create mapping entry
            cursor.execute("""
                INSERT INTO mappings (user_id, transaction_id, merchant_name, suggested_category, status)
                VALUES (?, ?, ?, ?, 'pending')
            """, (user_id, txn_id, merchant, category))
            mappings_created += 1
        
        print(f"Created {mappings_created} mapping entries")
    
    # Commit changes
    conn.commit()
    
    # Verify the fix
    cursor.execute("SELECT COUNT(*) FROM mappings")
    total_mappings = cursor.fetchone()[0]
    print(f"Total mappings in database: {total_mappings}")
    
    print("\n" + "=" * 50)
    print("LLM mapping system fixed!")
    print("The mappings table has been created and populated")
    print("Pending transactions should now be processable by the AI mapping system")
    
    conn.close()
    return True

if __name__ == "__main__":
    fix_llm_mapping_system()
