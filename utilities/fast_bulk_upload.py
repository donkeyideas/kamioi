#!/usr/bin/env python3
"""
FAST Bulk Upload Utility for Kamioi LLM Mappings

This script uploads CSV files directly to the PostgreSQL database using the COPY
command, which is 50-100x faster than INSERT statements.

Expected performance:
- Regular API upload: ~824 rows/sec (50M rows = 17 hours)
- This utility: 50,000-100,000+ rows/sec (50M rows = 8-17 minutes)

Usage:
    python utilities/fast_bulk_upload.py path/to/mappings.csv

CSV Format (flexible column names accepted):
    Merchant Name, Ticker Symbol, Company Name, Category, Confidence, Notes

Environment:
    Requires DATABASE_URL environment variable or .env file
"""

import os
import sys
import csv
import io
import time
import argparse
from datetime import datetime

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
sys.path.insert(0, backend_dir)

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


# Ticker to company name mapping
TICKER_TO_COMPANY = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'META': 'Meta Platforms Inc.',
    'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix Inc.',
    'SBUX': 'Starbucks Corporation',
    'WMT': 'Walmart Inc.',
    'MA': 'Mastercard Inc.',
    'V': 'Visa Inc.',
    'JPM': 'JPMorgan Chase & Co.',
    'BAC': 'Bank of America Corporation',
    'WFC': 'Wells Fargo & Company',
    'UNH': 'UnitedHealth Group Inc.',
    'JNJ': 'Johnson & Johnson',
    'PG': 'Procter & Gamble Company',
    'KO': 'The Coca-Cola Company',
    'PFE': 'Pfizer Inc.',
    'DIS': 'Walt Disney Company',
    'HD': 'Home Depot Inc.',
    'NKE': 'Nike Inc.',
    'MCD': 'McDonald\'s Corporation',
    'COST': 'Costco Wholesale Corporation',
}


def get_db_connection():
    """Get database connection from environment"""
    # Try to load from .env file
    env_file = os.path.join(backend_dir, '.env')
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ.setdefault(key, value)

    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        print("Set it directly or create backend/.env file")
        sys.exit(1)

    return psycopg2.connect(database_url)


def get_col(row, *names):
    """Flexible column name matching"""
    for name in names:
        if name in row:
            return row[name].strip() if row[name] else ''
        for k in row.keys():
            if k.lower() == name.lower():
                return row[k].strip() if row[k] else ''
    return ''


def fast_bulk_upload(csv_path, clear_existing=False, batch_report_size=1000000):
    """
    Upload CSV to llm_mappings table using PostgreSQL COPY command.

    Args:
        csv_path: Path to the CSV file
        clear_existing: If True, TRUNCATE existing data first
        batch_report_size: Report progress every N rows
    """
    start_time = time.time()

    print("=" * 70)
    print("FAST BULK UPLOAD - PostgreSQL COPY")
    print("=" * 70)
    print(f"File: {csv_path}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Read and validate file
    if not os.path.exists(csv_path):
        print(f"ERROR: File not found: {csv_path}")
        sys.exit(1)

    file_size = os.path.getsize(csv_path)
    print(f"File size: {file_size / (1024*1024):.1f} MB")

    # Read file content
    print("Reading CSV file...")
    read_start = time.time()
    try:
        with open(csv_path, 'rb') as f:
            content = f.read().decode('utf-8')
    except UnicodeDecodeError:
        with open(csv_path, 'rb') as f:
            content = f.read().decode('utf-8', errors='ignore')

    print(f"  Read complete in {time.time() - read_start:.1f}s")

    # Pre-process CSV into COPY format
    print("Pre-processing CSV data...")
    preprocess_start = time.time()

    reader = csv.DictReader(io.StringIO(content))
    rows_buffer = io.StringIO()
    writer = csv.writer(rows_buffer, delimiter='\t', quoting=csv.QUOTE_MINIMAL)

    row_count = 0
    error_count = 0

    for row in reader:
        row_count += 1
        try:
            merchant_name = get_col(row, 'Merchant Name', 'merchant_name', 'merchant', 'name')
            if not merchant_name:
                error_count += 1
                continue

            # Handle confidence
            confidence_str = get_col(row, 'Confidence', 'confidence', 'conf', 'score') or '0'
            try:
                if confidence_str.endswith('%'):
                    confidence = float(confidence_str[:-1]) / 100.0
                else:
                    confidence = float(confidence_str) if confidence_str else 0.0
            except:
                confidence = 0.0

            ticker = get_col(row, 'Ticker Symbol', 'ticker_symbol', 'ticker', 'symbol')
            company = get_col(row, 'Company Name', 'company_name', 'company') or TICKER_TO_COMPANY.get(ticker, '')
            category = get_col(row, 'Category', 'category', 'cat', 'type')
            notes = get_col(row, 'Notes', 'notes', 'note', 'description')

            # Write tab-separated row
            writer.writerow([
                merchant_name,
                category,
                notes,
                ticker,
                confidence,
                'approved',
                1,  # admin_approved
                'cli_fast_upload',
                company
            ])

            if row_count % batch_report_size == 0:
                elapsed = time.time() - preprocess_start
                rate = row_count / elapsed
                print(f"  Pre-processed {row_count:,} rows ({rate:,.0f} rows/sec)")

        except Exception as e:
            error_count += 1
            if error_count <= 5:
                print(f"  Warning: Row {row_count}: {e}")

    preprocess_time = time.time() - preprocess_start
    print(f"  Pre-processing complete: {row_count:,} rows in {preprocess_time:.1f}s")
    print(f"  Errors skipped: {error_count}")

    # Reset buffer for reading
    rows_buffer.seek(0)

    # Connect to database
    print("\nConnecting to database...")
    conn = get_db_connection()
    cursor = conn.cursor()
    print("  Connected!")

    # Optionally clear existing data
    if clear_existing:
        print("\nTruncating existing data...")
        truncate_start = time.time()
        cursor.execute("TRUNCATE TABLE llm_mappings RESTART IDENTITY")
        conn.commit()
        print(f"  Truncated in {time.time() - truncate_start:.1f}s")

    # Drop indexes for faster insert
    print("\nDropping indexes...")
    index_start = time.time()
    indexes_to_drop = [
        'idx_llm_admin_approved', 'idx_llm_status', 'idx_llm_created_at',
        'idx_llm_category', 'idx_llm_merchant', 'idx_llm_ticker',
        'idx_llm_mappings_status', 'idx_llm_mappings_admin_approved',
        'idx_llm_mappings_created_at', 'idx_llm_mappings_status_created',
        'idx_llm_mappings_merchant_trgm', 'idx_llm_mappings_ticker_trgm'
    ]
    for idx in indexes_to_drop:
        try:
            cursor.execute(f"DROP INDEX IF EXISTS {idx}")
        except:
            pass
    conn.commit()
    print(f"  Indexes dropped in {time.time() - index_start:.1f}s")

    # Execute COPY command
    print("\nExecuting PostgreSQL COPY command...")
    print("  This is the fastest way to bulk load data!")
    copy_start = time.time()

    cursor.copy_expert(
        """
        COPY llm_mappings (merchant_name, category, notes, ticker_symbol, confidence, status, admin_approved, admin_id, company_name)
        FROM STDIN WITH (FORMAT csv, DELIMITER E'\\t', QUOTE '"', NULL '')
        """,
        rows_buffer
    )
    conn.commit()

    copy_time = time.time() - copy_start
    copy_rate = row_count / copy_time if copy_time > 0 else 0
    print(f"  COPY complete: {row_count:,} rows in {copy_time:.1f}s ({copy_rate:,.0f} rows/sec)")

    # Recreate indexes
    print("\nRecreating indexes...")
    reindex_start = time.time()

    indexes_to_create = [
        ('idx_llm_admin_approved', 'CREATE INDEX idx_llm_admin_approved ON llm_mappings(admin_approved)'),
        ('idx_llm_status', 'CREATE INDEX idx_llm_status ON llm_mappings(status)'),
        ('idx_llm_created_at', 'CREATE INDEX idx_llm_created_at ON llm_mappings(created_at DESC)'),
        ('idx_llm_category', 'CREATE INDEX idx_llm_category ON llm_mappings(category)'),
        ('idx_llm_merchant', 'CREATE INDEX idx_llm_merchant ON llm_mappings(merchant_name)'),
        ('idx_llm_ticker', 'CREATE INDEX idx_llm_ticker ON llm_mappings(ticker_symbol)'),
        ('idx_llm_mappings_status', 'CREATE INDEX IF NOT EXISTS idx_llm_mappings_status ON llm_mappings(status)'),
        ('idx_llm_mappings_admin_approved', 'CREATE INDEX IF NOT EXISTS idx_llm_mappings_admin_approved ON llm_mappings(admin_approved)'),
        ('idx_llm_mappings_created_at', 'CREATE INDEX IF NOT EXISTS idx_llm_mappings_created_at ON llm_mappings(created_at DESC)'),
        ('idx_llm_mappings_status_created', 'CREATE INDEX IF NOT EXISTS idx_llm_mappings_status_created ON llm_mappings(status, created_at DESC)'),
    ]

    for idx_name, idx_sql in indexes_to_create:
        try:
            cursor.execute(idx_sql)
            print(f"  Created: {idx_name}")
        except Exception as e:
            print(f"  Warning: {idx_name}: {e}")

    conn.commit()
    reindex_time = time.time() - reindex_start
    print(f"  Indexes recreated in {reindex_time:.1f}s")

    # Verify count
    cursor.execute("SELECT COUNT(*) FROM llm_mappings")
    total_count = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    # Final summary
    total_time = time.time() - start_time
    overall_rate = row_count / total_time if total_time > 0 else 0

    print()
    print("=" * 70)
    print("UPLOAD COMPLETE!")
    print("=" * 70)
    print(f"  Rows uploaded: {row_count:,}")
    print(f"  Total in DB:   {total_count:,}")
    print(f"  Errors:        {error_count}")
    print()
    print(f"  Time breakdown:")
    print(f"    Pre-process: {preprocess_time:.1f}s")
    print(f"    COPY:        {copy_time:.1f}s ({copy_rate:,.0f} rows/sec)")
    print(f"    Indexing:    {reindex_time:.1f}s")
    print(f"    TOTAL:       {total_time:.1f}s ({overall_rate:,.0f} rows/sec)")
    print()
    print(f"  Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(
        description='Fast bulk upload LLM mappings to PostgreSQL',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Upload a CSV file
    python fast_bulk_upload.py mappings.csv

    # Clear existing data first
    python fast_bulk_upload.py mappings.csv --clear

    # Large file with progress every 5M rows
    python fast_bulk_upload.py huge_file.csv --batch-report 5000000
        """
    )
    parser.add_argument('csv_file', help='Path to CSV file to upload')
    parser.add_argument('--clear', action='store_true',
                       help='TRUNCATE existing data before upload')
    parser.add_argument('--batch-report', type=int, default=1000000,
                       help='Report progress every N rows (default: 1000000)')

    args = parser.parse_args()

    fast_bulk_upload(
        args.csv_file,
        clear_existing=args.clear,
        batch_report_size=args.batch_report
    )


if __name__ == '__main__':
    main()
