#!/usr/bin/env python3
"""
Test script to manually trigger auto-mapping of pending transactions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from auto_mapping_pipeline import auto_mapping_pipeline

def test_auto_mapping():
    print("Testing Auto-Mapping Pipeline...")
    
    # Test the auto-mapping pipeline
    result = auto_mapping_pipeline.process_pending_transactions()
    
    print(f"Results: {result}")
    
    if 'error' in result:
        print(f"Error: {result['error']}")
    else:
        print(f"Successfully processed {result.get('processed', 0)} transactions")
        print(f"   - Auto-approved: {result.get('auto_approved', 0)}")
        print(f"   - Sent to review: {result.get('sent_to_review', 0)}")

if __name__ == "__main__":
    test_auto_mapping()
