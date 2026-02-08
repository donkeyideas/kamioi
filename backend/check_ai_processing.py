#!/usr/bin/env python3
"""
Check which mappings have been processed by AI
"""

import sqlite3
import json

def check_ai_processing():
    """Check AI processing status of mappings"""
    print("Checking AI Processing Status...")
    
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    # Get all mappings with AI processing info
    cursor.execute("""
        SELECT id, merchant_name, ticker_symbol, category, user_id, 
               ai_attempted, ai_status, ai_confidence, ai_reasoning, 
               ai_processing_time, ai_model_version
        FROM llm_mappings 
        ORDER BY created_at DESC
        LIMIT 20
    """)
    
    mappings = cursor.fetchall()
    
    print(f"\nFound {len(mappings)} mappings:")
    print("=" * 80)
    
    for mapping in mappings:
        mapping_id, merchant_name, ticker_symbol, category, user_id, \
        ai_attempted, ai_status, ai_confidence, ai_reasoning, \
        ai_processing_time, ai_model_version = mapping
        
        print(f"\nMapping ID: {mapping_id}")
        print(f"   Merchant: {merchant_name}")
        print(f"   Ticker: {ticker_symbol}")
        print(f"   Category: {category}")
        print(f"   User ID: {user_id}")
        print(f"   AI Attempted: {ai_attempted}")
        print(f"   AI Status: {ai_status}")
        print(f"   AI Confidence: {ai_confidence}")
        print(f"   AI Reasoning: {ai_reasoning}")
        print(f"   AI Processing Time: {ai_processing_time}")
        print(f"   AI Model Version: {ai_model_version}")
        print("-" * 40)
    
    # Check specifically for the "UNKNOWN ONLINE SERVICE" mapping
    print("\nLooking for 'UNKNOWN ONLINE SERVICE' mapping...")
    cursor.execute("""
        SELECT id, merchant_name, ticker_symbol, category, user_id, 
               ai_attempted, ai_status, ai_confidence, ai_reasoning, 
               ai_processing_time, ai_model_version
        FROM llm_mappings 
        WHERE merchant_name LIKE '%UNKNOWN ONLINE SERVICE%'
        OR merchant_name LIKE '%UNKNOWN%'
    """)
    
    unknown_mappings = cursor.fetchall()
    
    print(f"\nFound {len(unknown_mappings)} 'UNKNOWN' mappings:")
    for mapping in unknown_mappings:
        mapping_id, merchant_name, ticker_symbol, category, user_id, \
        ai_attempted, ai_status, ai_confidence, ai_reasoning, \
        ai_processing_time, ai_model_version = mapping
        
        print(f"\nMapping ID: {mapping_id}")
        print(f"   Merchant: {merchant_name}")
        print(f"   Ticker: {ticker_symbol}")
        print(f"   AI Attempted: {ai_attempted}")
        print(f"   AI Status: {ai_status}")
        print(f"   AI Confidence: {ai_confidence}")
        print("-" * 40)
    
    conn.close()

if __name__ == '__main__':
    check_ai_processing()
