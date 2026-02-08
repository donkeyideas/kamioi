#!/usr/bin/env python3

import sqlite3
import os

# Check backup database
BACKUP_DB_PATH = '../kamioi.db'

def check_backup_mappings():
    conn = None
    try:
        conn = sqlite3.connect(BACKUP_DB_PATH)
        cursor = conn.cursor()
        
        # Check if llm_mappings table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='llm_mappings'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("[ERROR] llm_mappings table does not exist in backup!")
            return
        
        # Check total mappings count
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        print(f"[INFO] Total mappings in backup database: {total_mappings}")
        
        if total_mappings > 0:
            # Get sample mappings
            cursor.execute("SELECT id, merchant_name, ticker, confidence, status, created_at FROM llm_mappings LIMIT 5")
            sample_mappings = cursor.fetchall()
            
            print("\n[INFO] Sample mappings from backup:")
            for mapping in sample_mappings:
                print(f"  ID: {mapping[0]}, Merchant: {mapping[1]}, Ticker: {mapping[2]}, Confidence: {mapping[3]}, Status: {mapping[4]}, Created: {mapping[5]}")
        else:
            print("[ERROR] No mappings found in backup database!")
            
    except sqlite3.Error as e:
        print(f"[ERROR] Database error: {e}")
    except Exception as e:
        print(f"[ERROR] An error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    check_backup_mappings()
