"""
Migration Script to Fix Company Names in LLM Mappings
This script validates and corrects company_name fields to match their stock tickers.
Processes in batches to handle 14M+ mappings efficiently.
"""
import sqlite3
import sys
import os
from datetime import datetime
from ticker_company_lookup import get_company_name_from_ticker, validate_ticker_company_match

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def fix_llm_mappings_batch(db_path: str = None, batch_size: int = 1000, dry_run: bool = True):
    """
    Fix company names in llm_mappings table to match stock tickers.
    
    Args:
        db_path: Path to database file (defaults to kamioi.db in current directory)
        batch_size: Number of records to process per batch
        dry_run: If True, only reports issues without fixing them
    """
    if db_path is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(current_dir, "kamioi.db")
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return
    
    print(f"{'🔍 DRY RUN MODE' if dry_run else '✅ FIX MODE'}")
    print(f"📊 Processing database: {db_path}")
    print(f"📦 Batch size: {batch_size}")
    print("=" * 80)
    
    conn = sqlite3.connect(db_path, timeout=300)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get total count
    cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE ticker IS NOT NULL AND ticker != ''")
    total_count = cursor.fetchone()[0]
    print(f"📈 Total mappings with tickers: {total_count:,}")
    
    # Process in batches
    offset = 0
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    start_time = datetime.now()
    
    while offset < total_count:
        # Fetch batch
        cursor.execute("""
            SELECT id, ticker, company_name, merchant_name
            FROM llm_mappings
            WHERE ticker IS NOT NULL AND ticker != ''
            ORDER BY id
            LIMIT ? OFFSET ?
        """, (batch_size, offset))
        
        batch = cursor.fetchall()
        if not batch:
            break
        
        print(f"\n🔄 Processing batch: {offset + 1:,} - {offset + len(batch):,} of {total_count:,}")
        
        batch_fixed = 0
        batch_skipped = 0
        batch_errors = 0
        
        for row in batch:
            mapping_id = row['id']
            ticker = row['ticker']
            current_company_name = row['company_name'] or row['merchant_name']
            
            try:
                # Validate ticker-company match
                validation = validate_ticker_company_match(ticker, current_company_name or '')
                
                if validation['needs_correction']:
                    correct_company = validation['correct_company_name']
                    
                    if correct_company:
                        if not dry_run:
                            # Update the mapping
                            cursor.execute("""
                                UPDATE llm_mappings
                                SET company_name = ?
                                WHERE id = ?
                            """, (correct_company, mapping_id))
                        
                        batch_fixed += 1
                        if batch_fixed <= 5:  # Show first 5 examples
                            print(f"  ✅ ID {mapping_id}: {ticker} - '{current_company_name}' → '{correct_company}'")
                    else:
                        batch_skipped += 1
                else:
                    batch_skipped += 1
                    
            except Exception as e:
                batch_errors += 1
                if batch_errors <= 5:  # Show first 5 errors
                    print(f"  ❌ Error processing ID {mapping_id}: {str(e)}")
        
        if not dry_run:
            conn.commit()
        
        fixed_count += batch_fixed
        skipped_count += batch_skipped
        error_count += batch_errors
        
        print(f"  📊 Batch stats: {batch_fixed} fixed, {batch_skipped} skipped, {batch_errors} errors")
        
        offset += batch_size
        
        # Progress update
        elapsed = (datetime.now() - start_time).total_seconds()
        if elapsed > 0:
            rate = offset / elapsed
            remaining = (total_count - offset) / rate if rate > 0 else 0
            print(f"  ⏱️  Progress: {offset:,}/{total_count:,} ({offset*100/total_count:.1f}%) | "
                  f"Rate: {rate:.0f} rec/s | Est. remaining: {remaining/60:.1f} min")
    
    conn.close()
    
    elapsed_time = (datetime.now() - start_time).total_seconds()
    print("\n" + "=" * 80)
    print("📊 FINAL RESULTS:")
    print(f"  ✅ Fixed: {fixed_count:,}")
    print(f"  ⏭️  Skipped (already correct): {skipped_count:,}")
    print(f"  ❌ Errors: {error_count:,}")
    print(f"  ⏱️  Total time: {elapsed_time/60:.1f} minutes")
    
    if dry_run:
        print("\n💡 This was a DRY RUN. To apply fixes, run with dry_run=False")
    else:
        print(f"\n✅ Migration complete! Fixed {fixed_count:,} company names.")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Fix company names in LLM mappings')
    parser.add_argument('--db-path', type=str, help='Path to database file')
    parser.add_argument('--batch-size', type=int, default=1000, help='Batch size (default: 1000)')
    parser.add_argument('--execute', action='store_true', help='Execute fixes (default is dry run)')
    
    args = parser.parse_args()
    
    fix_llm_mappings_batch(
        db_path=args.db_path,
        batch_size=args.batch_size,
        dry_run=not args.execute
    )

