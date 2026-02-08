import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def fix_llm_mappings_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Fixing LLM mappings table...")
    print("=" * 50)
    
    # Drop the incorrect mappings table
    print("Dropping incorrect mappings table...")
    cursor.execute("DROP TABLE IF EXISTS mappings")
    
    # Create the correct llm_mappings table
    print("Creating correct llm_mappings table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS llm_mappings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            merchant_name TEXT NOT NULL,
            ticker_symbol TEXT,
            category TEXT,
            confidence REAL DEFAULT 0.0,
            notes TEXT,
            user_id INTEGER NOT NULL,
            dashboard_type TEXT DEFAULT 'individual',
            transaction_id INTEGER,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_by INTEGER,
            rejected_reason TEXT
        )
    """)
    
    print("llm_mappings table created")
    
    # Get pending transactions and create mappings
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE status = 'pending'")
    pending_count = cursor.fetchone()[0]
    print(f"Pending transactions: {pending_count}")
    
    if pending_count > 0:
        print("Creating llm_mappings for pending transactions...")
        
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
            
            # Create llm_mapping entry
            cursor.execute("""
                INSERT INTO llm_mappings (user_id, transaction_id, merchant_name, category, status, dashboard_type)
                VALUES (?, ?, ?, ?, 'pending', 'individual')
            """, (user_id, txn_id, merchant, category))
            mappings_created += 1
        
        print(f"Created {mappings_created} llm_mapping entries")
    
    # Commit changes
    conn.commit()
    
    # Verify the fix
    cursor.execute("SELECT COUNT(*) FROM llm_mappings")
    total_mappings = cursor.fetchone()[0]
    print(f"Total llm_mappings in database: {total_mappings}")
    
    # Check table structure
    cursor.execute("PRAGMA table_info(llm_mappings)")
    columns = cursor.fetchall()
    print("\nllm_mappings table columns:")
    for column in columns:
        print(f"  {column[1]} ({column[2]})")
    
    print("\n" + "=" * 50)
    print("LLM mappings table fixed!")
    print("The correct llm_mappings table has been created and populated")
    print("Pending transactions should now be processable by the AI mapping system")
    
    conn.close()
    return True

if __name__ == "__main__":
    fix_llm_mappings_table()
