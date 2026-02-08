#!/usr/bin/env python3

import sqlite3

# Database path
DB_PATH = 'kamioi.db'

def clear_mappings():
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Clear all mappings
        cursor.execute("DELETE FROM llm_mappings")
        conn.commit()
        
        # Check remaining count
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        remaining_count = cursor.fetchone()[0]
        
        print(f"[INFO] Cleared all mappings. Remaining: {remaining_count}")
        
    except sqlite3.Error as e:
        print(f"[ERROR] Database error: {e}")
    except Exception as e:
        print(f"[ERROR] An error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    clear_mappings()
