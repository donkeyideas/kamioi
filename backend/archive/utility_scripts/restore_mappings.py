#!/usr/bin/env python3

import sqlite3
import csv
import os
from datetime import datetime

# Database path
DB_PATH = 'kamioi.db'

def restore_mappings():
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Clear existing mappings first
        cursor.execute("DELETE FROM llm_mappings")
        print("[INFO] Cleared existing mappings")
        
        # Get the largest training data file
        training_file = 'training_exports/training_data_20251015_105739.csv'
        
        if not os.path.exists(training_file):
            print(f"[ERROR] Training file not found: {training_file}")
            return
        
        print(f"[INFO] Loading mappings from {training_file}")
        
        # Read and insert mappings
        with open(training_file, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            count = 0
            
            for row in csv_reader:
                # Insert mapping into database
                cursor.execute("""
                    INSERT INTO llm_mappings 
                    (merchant_name, ticker, confidence, status, created_at, ai_processed)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    row['merchant_name'],
                    row['ticker'],
                    float(row['confidence']),
                    'approved',  # Set as approved since these are training data
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    1  # Mark as AI processed
                ))
                
                count += 1
                if count % 10000 == 0:
                    print(f"[INFO] Processed {count} mappings...")
                    conn.commit()  # Commit every 10k records
            
            conn.commit()
            print(f"[INFO] Successfully restored {count} mappings to database!")
            
            # Verify the count
            cursor.execute("SELECT COUNT(*) FROM llm_mappings")
            total_mappings = cursor.fetchone()[0]
            print(f"[INFO] Total mappings in database: {total_mappings}")
        
    except sqlite3.Error as e:
        print(f"[ERROR] Database error: {e}")
    except Exception as e:
        print(f"[ERROR] An error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    restore_mappings()
