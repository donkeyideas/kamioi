#!/usr/bin/env python3
"""Test the API endpoint directly by simulating a request"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Simulate Flask app context
from app import app
from database_manager import db_manager

def test_api():
    """Test the business transactions endpoint"""
    with app.test_client() as client:
        # Create a test token for user 108
        # First, let's check what token format is expected
        print("=" * 60)
        print("TESTING API ENDPOINT DIRECTLY")
        print("=" * 60)
        
        # Test get_user_transactions directly first
        print("\n[TEST 1] Testing get_user_transactions(108) directly...")
        transactions = db_manager.get_user_transactions(108, limit=1000, offset=0)
        print(f"   Result: {len(transactions)} transactions")
        
        if transactions:
            print(f"   First transaction: ID={transactions[0].get('id')}, User ID={transactions[0].get('user_id')}")
        
        # Now test the API endpoint
        print("\n[TEST 2] Testing /api/business/transactions endpoint...")
        
        # We need a valid token - let's check what the auth expects
        # For now, let's just check what the endpoint would return
        # by looking at the code flow
        
        # Check if there's any demo data being returned
        print("\n[TEST 3] Checking for demo/mock data in app.py...")
        with open('app.py', 'r', encoding='utf-8') as f:
            content = f.read()
            if 'demo' in content.lower() or 'mock' in content.lower():
                print("   Found 'demo' or 'mock' in app.py - checking context...")
                # Search for demo data around business_transactions
                import re
                # Find business_transactions function
                match = re.search(r'def business_transactions.*?(?=def |@app\.route|$)', content, re.DOTALL)
                if match:
                    func_content = match.group(0)
                    if 'demo' in func_content.lower() or 'mock' in func_content.lower():
                        print("   WARNING: Demo/mock data found in business_transactions function!")
                        # Find the line
                        lines = func_content.split('\n')
                        for i, line in enumerate(lines):
                            if 'demo' in line.lower() or 'mock' in line.lower():
                                print(f"   Line {i}: {line.strip()}")
                    else:
                        print("   No demo/mock data in business_transactions function")
        
        print("\n[TEST 4] Checking database directly for ANY transactions with those IDs...")
        conn = db_manager.get_connection()
        try:
            if db_manager._use_postgresql:
                from sqlalchemy import text
                # Check if transactions 519, 518, etc. exist for ANY user
                result = conn.execute(text('''
                    SELECT id, user_id, merchant, status
                    FROM transactions
                    WHERE id IN (519, 518, 521, 520, 523, 522, 494, 493)
                    ORDER BY id
                '''))
                found = result.fetchall()
                if found:
                    print(f"   Found {len(found)} transactions with those IDs:")
                    for tx in found:
                        print(f"      ID: {tx[0]}, User ID: {tx[1]}, Merchant: {tx[2]}, Status: {tx[3]}")
                else:
                    print("   No transactions found with those IDs in database")
                
                # Check if query is wrong - maybe it's returning all transactions?
                result = conn.execute(text('SELECT COUNT(*) FROM transactions'))
                total = result.scalar() or 0
                print(f"\n   Total transactions in database: {total}")
                
                db_manager.release_connection(conn)
            else:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, user_id, merchant, status
                    FROM transactions
                    WHERE id IN (519, 518, 521, 520, 523, 522, 494, 493)
                    ORDER BY id
                ''')
                found = cursor.fetchall()
                if found:
                    print(f"   Found {len(found)} transactions")
                    for tx in found:
                        print(f"      ID: {tx[0]}, User ID: {tx[1]}, Merchant: {tx[2]}")
                else:
                    print("   No transactions found")
                conn.close()
        except Exception as e:
            print(f"   Error: {e}")

if __name__ == "__main__":
    test_api()

