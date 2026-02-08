#!/usr/bin/env python3
"""
Export pending LLM mappings to Excel file
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
import pandas as pd
import sqlite3

def export_pending_mappings():
    """Export pending mappings to Excel"""
    print("=" * 60)
    print("Exporting Pending LLM Mappings to Excel")
    print("=" * 60)
    print()
    
    # Check SQLite database directly (the dashboard is likely using this)
    sqlite_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kamioi.db")
    rows = None
    columns = None
    
    if os.path.exists(sqlite_db_path):
        print(f"Found SQLite database: {sqlite_db_path}")
        print("Checking SQLite database for pending mappings...")
        try:
            sqlite_conn = sqlite3.connect(sqlite_db_path, timeout=60)
            sqlite_cursor = sqlite_conn.cursor()
            
            # Check pending count
            sqlite_cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
            sqlite_pending = sqlite_cursor.fetchone()[0]
            print(f"SQLite database has {sqlite_pending:,} pending mappings")
            
            if sqlite_pending > 0:
                # Export from SQLite
                sqlite_cursor.execute("""
                    SELECT 
                        id,
                        transaction_id,
                        merchant_name,
                        ticker,
                        category,
                        confidence,
                        status,
                        admin_approved,
                        ai_processed,
                        company_name,
                        user_id,
                        created_at
                    FROM llm_mappings
                    WHERE status = 'pending'
                    ORDER BY created_at DESC
                """)
                rows = sqlite_cursor.fetchall()
                columns = ['id', 'transaction_id', 'merchant_name', 'ticker', 
                          'category', 'confidence', 'status', 'admin_approved', 
                          'ai_processed', 'company_name', 'user_id', 'created_at']
                sqlite_conn.close()
                print(f"Retrieved {len(rows):,} pending mappings from SQLite database")
            else:
                sqlite_conn.close()
                print("No pending mappings found in SQLite database")
        except Exception as e:
            print(f"Error checking SQLite: {e}")
            import traceback
            print(traceback.format_exc())
    
    if not rows:
        print("\nNo pending mappings found!")
        return
    
    print(f"\nCreating Excel file with {len(rows):,} pending mappings...")
    
    # Create DataFrame
    df = pd.DataFrame(rows, columns=columns)
    
    # Format admin_approved for readability
    df['admin_approved_label'] = df['admin_approved'].map({
        0: 'Not Reviewed',
        1: 'Approved',
        -1: 'Rejected'
    }).fillna('Unknown')
    
    # Reorder columns for better readability
    column_order = ['id', 'user_id', 'transaction_id', 'merchant_name', 'company_name', 'ticker', 
                   'category', 'confidence', 'status', 'admin_approved', 'admin_approved_label',
                   'ai_processed', 'created_at']
    
    # Only include columns that exist
    available_columns = [col for col in column_order if col in df.columns]
    df = df[available_columns]
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"pending_llm_mappings_{timestamp}.xlsx"
    filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)
    
    print(f"Exporting to: {filepath}")
    
    # Export to Excel with formatting
    with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Pending Mappings', index=False)
        
        # Get the worksheet
        worksheet = writer.sheets['Pending Mappings']
        
        # Auto-adjust column widths
        for idx, col in enumerate(df.columns):
            max_length = max(
                df[col].astype(str).map(len).max(),
                len(str(col))
            )
            # Set column width (add some padding, max 50)
            col_letter = chr(65 + idx) if idx < 26 else chr(65 + idx // 26 - 1) + chr(65 + idx % 26)
            worksheet.column_dimensions[col_letter].width = min(max_length + 2, 50)
    
    print(f"\n[SUCCESS] Successfully exported {len(df):,} pending mappings to:")
    print(f"   {filepath}")
    print()
    print("Summary:")
    print(f"  - Total pending: {len(df):,}")
    print(f"  - Unique users: {df['user_id'].nunique()}")
    print(f"  - Unique merchants: {df['merchant_name'].nunique()}")
    if 'ticker' in df.columns:
        print(f"  - Mappings with ticker: {df['ticker'].notna().sum()}")
    if 'confidence' in df.columns:
        print(f"  - Average confidence: {df['confidence'].mean():.2f}")
    print()
    print("=" * 60)

if __name__ == '__main__':
    export_pending_mappings()
