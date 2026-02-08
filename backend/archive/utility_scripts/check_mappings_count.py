import sqlite3
import os

def check_mappings_count():
    """Check the number of mappings in the database"""
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Checking mappings in database...")
        print("=" * 50)
        
        # Check llm_mappings table
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        llm_mappings_count = cursor.fetchone()[0]
        print(f"LLM Mappings: {llm_mappings_count}")
        
        # Check mappings table (if it exists)
        try:
            cursor.execute("SELECT COUNT(*) FROM mappings")
            mappings_count = cursor.fetchone()[0]
            print(f"Mappings: {mappings_count}")
        except sqlite3.OperationalError:
            print("Mappings table: Does not exist")
        
        # Check transactions table
        cursor.execute("SELECT COUNT(*) FROM transactions")
        transactions_count = cursor.fetchone()[0]
        print(f"Transactions: {transactions_count}")
        
        # Check pending mappings specifically
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
        pending_count = cursor.fetchone()[0]
        print(f"Pending Mappings: {pending_count}")
        
        # Check approved mappings
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'approved'")
        approved_count = cursor.fetchone()[0]
        print(f"Approved Mappings: {approved_count}")
        
        # Check rejected mappings
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'rejected'")
        rejected_count = cursor.fetchone()[0]
        print(f"Rejected Mappings: {rejected_count}")
        
        # Show sample of mappings
        cursor.execute("SELECT id, transaction_id, ticker_symbol, confidence, status FROM llm_mappings LIMIT 5")
        sample_mappings = cursor.fetchall()
        
        if sample_mappings:
            print(f"\nSample mappings (first 5):")
            for mapping in sample_mappings:
                print(f"   ID: {mapping[0]}, Transaction: {mapping[1]}, Ticker: {mapping[2]}, Confidence: {mapping[3]}, Status: {mapping[4]}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error checking mappings: {e}")

if __name__ == "__main__":
    check_mappings_count()
