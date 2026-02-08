#!/usr/bin/env python3
"""
Test script for Smart LLM Processor
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from smart_llm_processor import smart_llm_processor

def test_smart_llm():
    print("Testing Smart LLM Processor...")
    
    # Test getting pending transactions
    print("\n1. Getting pending transactions...")
    transactions = smart_llm_processor.get_pending_transactions(10)
    print(f"Found {len(transactions)} pending transactions")
    
    # Test processing stats
    print("\n2. Getting processing stats...")
    stats = smart_llm_processor.get_processing_stats()
    print(f"Stats: {stats}")
    
    # Test processing a single transaction
    if transactions:
        print(f"\n3. Processing first transaction: {transactions[0]['merchant']}")
        result = smart_llm_processor.process_transaction(transactions[0])
        print(f"Result: {result}")
    
    # Test batch processing
    print("\n4. Testing batch processing...")
    batch_result = smart_llm_processor.process_batch()
    print(f"Batch result: {batch_result}")
    
    # Test market hours
    print(f"\n5. Market open: {smart_llm_processor.is_market_open()}")

if __name__ == "__main__":
    test_smart_llm()


