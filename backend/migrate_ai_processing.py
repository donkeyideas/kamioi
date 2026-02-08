#!/usr/bin/env python3
"""
Database migration script to add AI processing fields to llm_mappings table
"""

import sqlite3
import sys
from datetime import datetime

def migrate_ai_processing():
    """Add AI processing fields to llm_mappings table"""
    
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    try:
        # Check if AI processing columns already exist
        cursor.execute("PRAGMA table_info(llm_mappings)")
        columns = [column[1] for column in cursor.fetchall()]
        
        print("Current llm_mappings columns:", columns)
        
        # Add AI processing fields if they don't exist
        ai_fields = [
            ('ai_attempted', 'BOOLEAN DEFAULT 0'),
            ('ai_status', 'TEXT DEFAULT "pending"'),
            ('ai_confidence', 'REAL DEFAULT 0.0'),
            ('ai_reasoning', 'TEXT'),
            ('ai_processing_time', 'DATETIME'),
            ('ai_model_version', 'TEXT DEFAULT "v1.0"'),
            ('ai_auto_approved', 'BOOLEAN DEFAULT 0'),
            ('ai_processing_duration', 'INTEGER DEFAULT 0'),  # milliseconds
            ('ai_decision_timestamp', 'DATETIME')
        ]
        
        for field_name, field_type in ai_fields:
            if field_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE llm_mappings ADD COLUMN {field_name} {field_type}")
                    print(f"Added column: {field_name}")
                except sqlite3.Error as e:
                    print(f"Error adding {field_name}: {e}")
            else:
                print(f"Column {field_name} already exists")
        
        # Create LLM Data Assets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS llm_data_assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_name TEXT NOT NULL,
                asset_type TEXT NOT NULL,  -- 'model', 'dataset', 'training_data'
                current_value REAL DEFAULT 0.0,
                training_cost REAL DEFAULT 0.0,
                performance_score REAL DEFAULT 0.0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                model_version TEXT DEFAULT "v1.0",
                accuracy_rate REAL DEFAULT 0.0,
                processing_speed REAL DEFAULT 0.0,  -- predictions per second
                roi_percentage REAL DEFAULT 0.0,
                gl_account TEXT DEFAULT "15200",
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Created llm_data_assets table")
        
        # Insert initial LLM Data Assets
        initial_assets = [
            ('KamioiGPT v1.0', 'model', 2400000.0, 180000.0, 94.2, 'v1.0', 94.2, 150.0, 340.0),
            ('Transaction Dataset v1.0', 'dataset', 1200000.0, 50000.0, 92.8, 'v1.0', 92.8, 0.0, 2400.0),
            ('Merchant Mapping Model', 'model', 800000.0, 75000.0, 96.5, 'v1.0', 96.5, 200.0, 1067.0)
        ]
        
        for asset in initial_assets:
            cursor.execute("""
                INSERT OR IGNORE INTO llm_data_assets 
                (asset_name, asset_type, current_value, training_cost, performance_score, 
                 model_version, accuracy_rate, processing_speed, roi_percentage)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, asset)
        
        print("Inserted initial LLM Data Assets")
        
        # Create AI processing analytics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_processing_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE DEFAULT CURRENT_DATE,
                total_processed INTEGER DEFAULT 0,
                auto_approved INTEGER DEFAULT 0,
                admin_reviewed INTEGER DEFAULT 0,
                rejected INTEGER DEFAULT 0,
                average_confidence REAL DEFAULT 0.0,
                processing_time_avg REAL DEFAULT 0.0,
                accuracy_rate REAL DEFAULT 0.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Created ai_processing_analytics table")
        
        conn.commit()
        print("AI processing migration completed successfully!")
        
        # Verify the changes
        cursor.execute("PRAGMA table_info(llm_mappings)")
        new_columns = [column[1] for column in cursor.fetchall()]
        print(f"Updated llm_mappings columns: {len(new_columns)} total")
        
        # Show LLM Data Assets
        cursor.execute("SELECT asset_name, current_value, roi_percentage FROM llm_data_assets")
        assets = cursor.fetchall()
        print(f"LLM Data Assets: {len(assets)} assets")
        for asset in assets:
            print(f"  - {asset[0]}: ${asset[1]:,.0f} (ROI: {asset[2]:.0f}%)")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()
    
    return True

if __name__ == '__main__':
    print("Starting AI processing migration...")
    success = migrate_ai_processing()
    if success:
        print("Migration completed successfully!")
        sys.exit(0)
    else:
        print("Migration failed!")
        sys.exit(1)
