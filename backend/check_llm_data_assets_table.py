import sqlite3
import os

def check_llm_data_assets_table():
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Checking llm_data_assets table...")
        print("=" * 50)
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='llm_data_assets'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            print("[OK] llm_data_assets table exists")
            
            # Get table schema
            cursor.execute("PRAGMA table_info(llm_data_assets)")
            columns = cursor.fetchall()
            print("\nTable Schema:")
            for col in columns:
                print(f"   {col[1]} ({col[2]})")
            
            # Get all data
            cursor.execute("SELECT * FROM llm_data_assets")
            rows = cursor.fetchall()
            print(f"\nTotal rows: {len(rows)}")
            
            if rows:
                print("\nData in table:")
                for row in rows:
                    print(f"   {row}")
        else:
            print("[NOT FOUND] llm_data_assets table does not exist")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_llm_data_assets_table()

