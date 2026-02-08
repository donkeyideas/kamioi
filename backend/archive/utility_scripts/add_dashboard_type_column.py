import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def add_dashboard_type_column():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Adding dashboard_type column to llm_mappings table...")
    print("=" * 50)
    
    try:
        # Add dashboard_type column
        cursor.execute("ALTER TABLE llm_mappings ADD COLUMN dashboard_type TEXT DEFAULT 'individual'")
        print("dashboard_type column added successfully")
        
        # Update existing records to have dashboard_type = 'individual'
        cursor.execute("UPDATE llm_mappings SET dashboard_type = 'individual' WHERE dashboard_type IS NULL")
        updated_count = cursor.rowcount
        print(f"Updated {updated_count} existing records with dashboard_type")
        
        # Commit changes
        conn.commit()
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(llm_mappings)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        if 'dashboard_type' in column_names:
            print("✅ dashboard_type column successfully added")
        else:
            print("❌ dashboard_type column not found")
        
        # Check total records
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_count = cursor.fetchone()[0]
        print(f"Total llm_mappings records: {total_count}")
        
        print("\n" + "=" * 50)
        print("LLM mappings table fixed!")
        print("The dashboard_type column has been added")
        print("The AI mapping system should now work properly")
        
    except Exception as e:
        print(f"Error: {e}")
        print("The column might already exist")
    
    conn.close()
    return True

if __name__ == "__main__":
    add_dashboard_type_column()
