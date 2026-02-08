#!/usr/bin/env python3

import sqlite3
import os

def update_users_schema():
    """Add missing columns to users table for registration"""
    print("UPDATING USERS TABLE SCHEMA")
    print("=" * 35)
    
    DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Add missing columns to users table
        columns_to_add = [
            "ALTER TABLE users ADD COLUMN round_up_amount REAL DEFAULT 1.00",
            "ALTER TABLE users ADD COLUMN risk_tolerance TEXT DEFAULT 'Moderate'",
            "ALTER TABLE users ADD COLUMN investment_goals TEXT DEFAULT ''",
            "ALTER TABLE users ADD COLUMN terms_agreed BOOLEAN DEFAULT 0",
            "ALTER TABLE users ADD COLUMN privacy_agreed BOOLEAN DEFAULT 0",
            "ALTER TABLE users ADD COLUMN marketing_agreed BOOLEAN DEFAULT 0"
        ]
        
        for column_sql in columns_to_add:
            try:
                cursor.execute(column_sql)
                print(f"[OK] Added column: {column_sql.split('ADD COLUMN ')[1].split(' ')[0]}")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e):
                    print(f"[SKIP] Column already exists: {column_sql.split('ADD COLUMN ')[1].split(' ')[0]}")
                else:
                    print(f"[ERROR] Failed to add column: {e}")
        
        # Update portfolios table to match the expected schema
        print(f"\n[INFO] Checking portfolios table...")
        
        # Check if portfolios table has the expected columns
        cursor.execute("PRAGMA table_info(portfolios)")
        portfolios_columns = cursor.fetchall()
        portfolio_column_names = [col[1] for col in portfolios_columns]
        
        # Add missing columns to portfolios table if needed
        portfolio_columns_to_add = [
            "ALTER TABLE portfolios ADD COLUMN total_invested REAL DEFAULT 0.0",
            "ALTER TABLE portfolios ADD COLUMN total_roundups REAL DEFAULT 0.0", 
            "ALTER TABLE portfolios ADD COLUMN total_fees REAL DEFAULT 0.0"
        ]
        
        for column_sql in portfolio_columns_to_add:
            column_name = column_sql.split('ADD COLUMN ')[1].split(' ')[0]
            if column_name not in portfolio_column_names:
                try:
                    cursor.execute(column_sql)
                    print(f"[OK] Added portfolio column: {column_name}")
                except sqlite3.OperationalError as e:
                    print(f"[ERROR] Failed to add portfolio column: {e}")
            else:
                print(f"[SKIP] Portfolio column already exists: {column_name}")
        
        conn.commit()
        conn.close()
        
        print(f"\n" + "=" * 35)
        print("DATABASE SCHEMA UPDATE COMPLETE")
        print("=" * 35)
        print("Users table now has all required columns for registration!")
        
    except Exception as e:
        print(f"Error updating database schema: {e}")

if __name__ == "__main__":
    update_users_schema()
