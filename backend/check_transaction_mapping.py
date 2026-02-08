#!/usr/bin/env python3
"""Check why transactions aren't being mapped"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager

def check_merchant_mappings():
    """Check if merchants from transactions exist in llm_mappings"""
    print("=" * 60)
    print("Transaction LLM Mapping Diagnostic")
    print("=" * 60)
    
    conn = db_manager.get_connection()
    
    # Get recent pending transactions
    if db_manager._use_postgresql:
        from sqlalchemy import text
        result = conn.execute(text('''
            SELECT id, merchant, status, ticker, created_at
            FROM transactions
            WHERE user_id = 108
            ORDER BY created_at DESC
            LIMIT 30
        '''))
        transactions = result.fetchall()
        
        print(f"\nFound {len(transactions)} recent transactions for user 108:\n")
        
        for tx in transactions:
            tx_id, merchant, status, ticker, created_at = tx
            print(f"Transaction {tx_id}: {merchant}")
            print(f"  Status: {status}, Ticker: {ticker or 'NULL'}, Created: {created_at}")
            
            # Check if merchant exists in llm_mappings
            if merchant:
                # Try exact match
                mapping_result = conn.execute(text('''
                    SELECT merchant_name, ticker, status, admin_approved
                    FROM llm_mappings
                    WHERE LOWER(merchant_name) = LOWER(:merchant)
                    LIMIT 5
                '''), {'merchant': merchant})
                exact_matches = mapping_result.fetchall()
                
                # Try partial match
                import re
                normalized = merchant.upper().strip()
                normalized = re.sub(r'\s+#\d+.*$', '', normalized)
                key_words = normalized.split()[:2]
                if len(key_words) >= 1:
                    search_pattern = ' '.join(key_words)
                    partial_result = conn.execute(text('''
                        SELECT merchant_name, ticker, status, admin_approved
                        FROM llm_mappings
                        WHERE LOWER(merchant_name) LIKE LOWER(:pattern)
                        AND status = 'approved'
                        AND admin_approved = 1
                        LIMIT 5
                    '''), {'pattern': f'%{search_pattern}%'})
                    partial_matches = partial_result.fetchall()
                else:
                    partial_matches = []
                
                if exact_matches:
                    print(f"  ✅ Found {len(exact_matches)} exact match(es) in llm_mappings:")
                    for match in exact_matches:
                        print(f"     - {match[0]} -> {match[1]} (status: {match[2]}, approved: {match[3]})")
                elif partial_matches:
                    print(f"  ✅ Found {len(partial_matches)} partial match(es) in llm_mappings:")
                    for match in partial_matches:
                        print(f"     - {match[0]} -> {match[1]} (status: {match[2]}, approved: {match[3]})")
                else:
                    print(f"  ❌ No mapping found in llm_mappings")
                    print(f"     Searched for: '{merchant}' and pattern '{search_pattern if len(key_words) >= 1 else 'N/A'}'")
            print()
        
        db_manager.release_connection(conn)
    else:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, merchant, status, ticker, created_at
            FROM transactions
            WHERE user_id = 108
            ORDER BY created_at DESC
            LIMIT 30
        ''')
        transactions = cursor.fetchall()
        
        print(f"\nFound {len(transactions)} recent transactions for user 108:\n")
        
        for tx in transactions:
            tx_id, merchant, status, ticker, created_at = tx
            print(f"Transaction {tx_id}: {merchant}")
            print(f"  Status: {status}, Ticker: {ticker or 'NULL'}, Created: {created_at}")
            
            if merchant:
                cursor.execute('''
                    SELECT merchant_name, ticker, status, admin_approved
                    FROM llm_mappings
                    WHERE LOWER(merchant_name) = LOWER(?)
                    LIMIT 5
                ''', (merchant,))
                exact_matches = cursor.fetchall()
                
                import re
                normalized = merchant.upper().strip()
                normalized = re.sub(r'\s+#\d+.*$', '', normalized)
                key_words = normalized.split()[:2]
                if len(key_words) >= 1:
                    search_pattern = ' '.join(key_words)
                    cursor.execute('''
                        SELECT merchant_name, ticker, status, admin_approved
                        FROM llm_mappings
                        WHERE LOWER(merchant_name) LIKE LOWER(?)
                        AND status = 'approved'
                        AND admin_approved = 1
                        LIMIT 5
                    ''', (f'%{search_pattern}%',))
                    partial_matches = cursor.fetchall()
                else:
                    partial_matches = []
                
                if exact_matches:
                    print(f"  ✅ Found {len(exact_matches)} exact match(es) in llm_mappings:")
                    for match in exact_matches:
                        print(f"     - {match[0]} -> {match[1]} (status: {match[2]}, approved: {match[3]})")
                elif partial_matches:
                    print(f"  ✅ Found {len(partial_matches)} partial match(es) in llm_mappings:")
                    for match in partial_matches:
                        print(f"     - {match[0]} -> {match[1]} (status: {match[2]}, approved: {match[3]})")
                else:
                    print(f"  ❌ No mapping found in llm_mappings")
                    print(f"     Searched for: '{merchant}' and pattern '{search_pattern if len(key_words) >= 1 else 'N/A'}'")
            print()
        
        conn.close()

if __name__ == "__main__":
    check_merchant_mappings()

