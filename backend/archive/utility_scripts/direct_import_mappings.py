#!/usr/bin/env python3
"""
Direct Database Import Script for LLM Mappings
==============================================

This script loads millions of mappings directly into PostgreSQL using the
ultra-fast COPY command. Much faster than web uploads.

Usage:
    python direct_import_mappings.py

Expected CSV format:
    Merchant Name,Ticker Symbol,Category,Confidence,Notes
"""

import os
import csv
import sys
import time
import psycopg2
from psycopg2 import sql
from io import StringIO
from datetime import datetime

# Database connection settings - Production PostgreSQL on Render
# Hardcoded to production database (ignoring local .env which has SQLite)
DATABASE_URL = "postgresql://kamioi:mIVGccLXyERPrpe9nqcz66U07tXqDmpF@dpg-d5ore98gjchc73akorrg-a.virginia-postgres.render.com/kamioi_c78i"

# Path to CSV files
CSV_FOLDER = r"C:\Users\beltr\OneDrive\Documents\Kamioi\LLM Mapping\New folder"

def get_db_connection():
    """Get database connection."""
    if DATABASE_URL:
        return psycopg2.connect(DATABASE_URL)
    else:
        # Local fallback
        return psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'kamioi'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', ''),
            port=os.getenv('DB_PORT', 5432)
        )

def parse_confidence(conf_str):
    """Convert confidence string (e.g., '93%') to decimal (0.93)."""
    if not conf_str:
        return 0.93  # Default confidence
    try:
        conf_str = str(conf_str).strip().replace('%', '')
        return float(conf_str) / 100.0
    except:
        return 0.93

def count_rows_in_file(filepath):
    """Count rows in a CSV file."""
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        return sum(1 for _ in f) - 1  # Subtract header

def import_csv_file(cursor, filepath, file_num, total_files):
    """Import a single CSV file using COPY command."""
    filename = os.path.basename(filepath)
    print(f"\n[{file_num}/{total_files}] Processing: {filename}")

    # Count rows first
    row_count = count_rows_in_file(filepath)
    print(f"    Rows to import: {row_count:,}")

    start_time = time.time()
    imported = 0
    errors = 0

    # Read CSV and prepare data for COPY
    buffer = StringIO()

    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)

        for row in reader:
            try:
                merchant_name = row.get('Merchant Name', '').strip()
                if not merchant_name:
                    continue

                ticker_symbol = row.get('Ticker Symbol', '').strip().upper()
                category = row.get('Category', '').strip()
                confidence = parse_confidence(row.get('Confidence', '93%'))
                notes = row.get('Notes', '').strip()

                # Escape special characters for COPY
                merchant_name = merchant_name.replace('\t', ' ').replace('\n', ' ').replace('\\', '\\\\')
                category = category.replace('\t', ' ').replace('\n', ' ').replace('\\', '\\\\') if category else ''
                notes = notes.replace('\t', ' ').replace('\n', ' ').replace('\\', '\\\\') if notes else ''
                ticker_symbol = ticker_symbol.replace('\t', ' ').replace('\n', ' ') if ticker_symbol else ''

                # Write tab-separated line for COPY
                line = f"{merchant_name}\t{category}\t{notes}\t{ticker_symbol}\t{confidence}\tapproved\t1\n"
                buffer.write(line)
                imported += 1

                # Progress update every 100k rows
                if imported % 100000 == 0:
                    elapsed = time.time() - start_time
                    rate = imported / elapsed if elapsed > 0 else 0
                    print(f"    Progress: {imported:,} rows ({rate:,.0f} rows/sec)")

            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"    Error on row: {e}")

    # Reset buffer position and use COPY
    buffer.seek(0)

    print(f"    Executing COPY command...")
    copy_start = time.time()

    cursor.copy_from(
        buffer,
        'llm_mappings',
        columns=('merchant_name', 'category', 'notes', 'ticker_symbol', 'confidence', 'status', 'admin_approved'),
        sep='\t'
    )

    copy_time = time.time() - copy_start
    total_time = time.time() - start_time
    rate = imported / total_time if total_time > 0 else 0

    print(f"    COPY completed in {copy_time:.1f}s")
    print(f"    Total: {imported:,} rows imported in {total_time:.1f}s ({rate:,.0f} rows/sec)")
    if errors > 0:
        print(f"    Skipped: {errors:,} rows with errors")

    return imported, errors

def main():
    print("=" * 60)
    print("LLM Mappings Direct Import Script")
    print("=" * 60)

    # Find all CSV files
    csv_files = sorted([
        os.path.join(CSV_FOLDER, f)
        for f in os.listdir(CSV_FOLDER)
        if f.endswith('.csv')
    ])

    if not csv_files:
        print(f"No CSV files found in: {CSV_FOLDER}")
        sys.exit(1)

    print(f"\nFound {len(csv_files)} CSV files to import")

    # Calculate total rows
    print("\nCounting total rows...")
    total_rows = 0
    for filepath in csv_files:
        rows = count_rows_in_file(filepath)
        total_rows += rows
        print(f"  {os.path.basename(filepath)}: {rows:,} rows")

    print(f"\nTotal rows to import: {total_rows:,}")

    # Ask for confirmation
    print("\n" + "=" * 60)
    print("OPTIONS:")
    print("  1. Clear existing mappings and import fresh (recommended)")
    print("  2. Add to existing mappings (may create duplicates)")
    print("  3. Cancel")
    print("=" * 60)

    choice = input("\nEnter choice (1/2/3): ").strip()

    if choice == '3':
        print("Cancelled.")
        sys.exit(0)

    clear_existing = (choice == '1')

    # Connect to database
    print("\nConnecting to database...")
    try:
        conn = get_db_connection()
        conn.autocommit = False
        cursor = conn.cursor()
        print("Connected successfully!")
    except Exception as e:
        print(f"Failed to connect: {e}")
        sys.exit(1)

    try:
        # Optionally clear existing data
        if clear_existing:
            print("\nClearing existing mappings...")
            cursor.execute("TRUNCATE TABLE llm_mappings RESTART IDENTITY")
            print("Existing mappings cleared.")

        # Drop indexes for faster import
        print("\nDropping indexes for faster import...")
        index_drops = [
            "DROP INDEX IF EXISTS idx_llm_admin_approved",
            "DROP INDEX IF EXISTS idx_llm_status",
            "DROP INDEX IF EXISTS idx_llm_created_at",
            "DROP INDEX IF EXISTS idx_llm_category",
            "DROP INDEX IF EXISTS idx_llm_merchant",
            "DROP INDEX IF EXISTS idx_llm_ticker",
            "DROP INDEX IF EXISTS idx_llm_mappings_status",
            "DROP INDEX IF EXISTS idx_llm_mappings_admin_approved",
            "DROP INDEX IF EXISTS idx_llm_mappings_created_at",
            "DROP INDEX IF EXISTS idx_llm_mappings_status_created",
        ]
        for drop_sql in index_drops:
            try:
                cursor.execute(drop_sql)
            except:
                pass

        # Import each file
        overall_start = time.time()
        total_imported = 0
        total_errors = 0

        for i, filepath in enumerate(csv_files, 1):
            imported, errors = import_csv_file(cursor, filepath, i, len(csv_files))
            total_imported += imported
            total_errors += errors

            # Commit after each file
            conn.commit()
            print(f"    Committed to database.")

        # Recreate indexes
        print("\n" + "=" * 60)
        print("Recreating indexes (this may take a few minutes)...")
        index_creates = [
            "CREATE INDEX IF NOT EXISTS idx_llm_admin_approved ON llm_mappings(admin_approved)",
            "CREATE INDEX IF NOT EXISTS idx_llm_status ON llm_mappings(status)",
            "CREATE INDEX IF NOT EXISTS idx_llm_created_at ON llm_mappings(created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_llm_category ON llm_mappings(category)",
            "CREATE INDEX IF NOT EXISTS idx_llm_merchant ON llm_mappings(merchant_name)",
            "CREATE INDEX IF NOT EXISTS idx_llm_ticker ON llm_mappings(ticker_symbol)",
        ]

        for create_sql in index_creates:
            print(f"  Creating index...")
            try:
                cursor.execute(create_sql)
                conn.commit()
            except Exception as e:
                print(f"  Warning: {e}")

        print("Indexes created.")

        # Final summary
        overall_time = time.time() - overall_start
        overall_rate = total_imported / overall_time if overall_time > 0 else 0

        print("\n" + "=" * 60)
        print("IMPORT COMPLETE!")
        print("=" * 60)
        print(f"Total rows imported: {total_imported:,}")
        print(f"Total errors/skipped: {total_errors:,}")
        print(f"Total time: {overall_time:.1f} seconds ({overall_time/60:.1f} minutes)")
        print(f"Average rate: {overall_rate:,.0f} rows/second")

        # Verify count
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        db_count = cursor.fetchone()[0]
        print(f"\nDatabase now has: {db_count:,} mappings")

    except Exception as e:
        print(f"\nError during import: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
        print("\nDatabase connection closed.")

if __name__ == '__main__':
    main()
