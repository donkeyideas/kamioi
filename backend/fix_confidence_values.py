import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def fix_confidence_values():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Fixing confidence values in llm_mappings...")
    print("=" * 50)
    
    # Update NULL confidence values to 0.5 (medium confidence)
    cursor.execute("UPDATE llm_mappings SET confidence = 0.5 WHERE confidence IS NULL")
    updated_count = cursor.rowcount
    print(f"Updated {updated_count} mappings with confidence = 0.5")
    
    # Update NULL ticker_symbol values to empty string
    cursor.execute("UPDATE llm_mappings SET ticker_symbol = '' WHERE ticker_symbol IS NULL")
    ticker_updated = cursor.rowcount
    print(f"Updated {ticker_updated} mappings with empty ticker_symbol")
    
    # Commit changes
    conn.commit()
    
    # Check the results
    cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
    pending_count = cursor.fetchone()[0]
    print(f"Pending mappings: {pending_count}")
    
    cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE confidence IS NOT NULL")
    confidence_count = cursor.fetchone()[0]
    print(f"Mappings with confidence values: {confidence_count}")
    
    print("\n" + "=" * 50)
    print("Confidence values fixed!")
    print("The AI mapping system should now work properly")
    
    conn.close()
    return True

if __name__ == "__main__":
    fix_confidence_values()
