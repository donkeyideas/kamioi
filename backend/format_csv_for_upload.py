import pandas as pd
import os

def format_csv_for_upload():
    """Format CSV files for bulk upload"""
    print("CSV Formatting Tool for LLM Mapping Bulk Upload")
    print("=" * 60)
    
    # Your CSV files
    csv_files = [
        r"C:\Users\beltr\Dropbox\LLM Mapping\Mapping Master.10152015.v1.csv",
        r"C:\Users\beltr\Dropbox\LLM Mapping\Mapping Master.10152015.v2.csv"
    ]
    
    for csv_file in csv_files:
        print(f"\nProcessing: {os.path.basename(csv_file)}")
        print("-" * 40)
        
        try:
            # Check if file exists
            if not os.path.exists(csv_file):
                print(f"[ERROR] File not found: {csv_file}")
                continue
            
            # Read CSV file
            df = pd.read_csv(csv_file)
            print(f"[OK] File loaded successfully")
            print(f"Columns found: {list(df.columns)}")
            print(f"Total rows: {len(df)}")
            
            # Check for required columns
            required_columns = ['merchant_name', 'ticker_symbol', 'category', 'confidence']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                print(f"[WARNING] Missing required columns: {missing_columns}")
                print("Required columns: merchant_name, ticker_symbol, category, confidence")
                
                # Try to map common column names
                column_mapping = {
                    'merchant_name': ['merchant', 'name', 'company', 'business'],
                    'ticker_symbol': ['ticker', 'symbol', 'stock', 'code'],
                    'category': ['cat', 'type', 'industry', 'sector'],
                    'confidence': ['conf', 'score', 'accuracy', 'rate']
                }
                
                print("\nSuggested column mappings:")
                for req_col, alternatives in column_mapping.items():
                    if req_col in missing_columns:
                        matching_cols = [col for col in df.columns if any(alt.lower() in col.lower() for alt in alternatives)]
                        if matching_cols:
                            print(f"  {req_col} -> {matching_cols[0]}")
                        else:
                            print(f"  {req_col} -> [NOT FOUND]")
            else:
                print("[OK] All required columns found")
            
            # Show sample data
            print("\nSample data (first 3 rows):")
            print(df.head(3).to_string())
            
            # Check for missing values
            missing_data = df[required_columns].isnull().sum()
            if missing_data.any():
                print(f"\n[WARNING] Missing values found:")
                for col, count in missing_data.items():
                    if count > 0:
                        print(f"  {col}: {count} missing values")
            
            # Create formatted version
            output_file = csv_file.replace('.csv', '_formatted.csv')
            
            # Ensure required columns exist with defaults
            if 'merchant_name' not in df.columns:
                df['merchant_name'] = df.get('merchant', df.get('name', df.get('company', 'Unknown')))
            if 'ticker_symbol' not in df.columns:
                df['ticker_symbol'] = df.get('ticker', df.get('symbol', df.get('stock', 'UNKNOWN')))
            if 'category' not in df.columns:
                df['category'] = df.get('cat', df.get('type', df.get('industry', 'Unknown')))
            if 'confidence' not in df.columns:
                df['confidence'] = 0.5  # Default confidence
            
            # Add tags column if not exists
            if 'tags' not in df.columns:
                df['tags'] = ''
            
            # Select only required columns
            formatted_df = df[['merchant_name', 'ticker_symbol', 'category', 'confidence', 'tags']].copy()
            
            # Clean data
            formatted_df['merchant_name'] = formatted_df['merchant_name'].astype(str).str.strip()
            formatted_df['ticker_symbol'] = formatted_df['ticker_symbol'].astype(str).str.strip().str.upper()
            formatted_df['category'] = formatted_df['category'].astype(str).str.strip()
            formatted_df['confidence'] = pd.to_numeric(formatted_df['confidence'], errors='coerce').fillna(0.5)
            formatted_df['tags'] = formatted_df['tags'].astype(str).str.strip()
            
            # Remove rows with empty merchant_name
            formatted_df = formatted_df[formatted_df['merchant_name'] != '']
            formatted_df = formatted_df[formatted_df['merchant_name'] != 'Unknown']
            
            # Save formatted file
            formatted_df.to_csv(output_file, index=False)
            print(f"\n[SUCCESS] Formatted file saved: {output_file}")
            print(f"Formatted rows: {len(formatted_df)}")
            
        except Exception as e:
            print(f"[ERROR] Failed to process {csv_file}: {e}")
    
    print("\n" + "=" * 60)
    print("CSV Formatting Complete!")
    print("\nNext steps:")
    print("1. Check the formatted files")
    print("2. Use the 'Bulk Upload' button in the LLM Center")
    print("3. Select the formatted CSV files")

if __name__ == "__main__":
    format_csv_for_upload()
