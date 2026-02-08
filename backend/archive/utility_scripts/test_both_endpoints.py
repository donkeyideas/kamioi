#!/usr/bin/env python3
"""
Test both business endpoints to verify they return correct data
"""
import requests
import json
import sys

def test_endpoints():
    base_url = "http://localhost:5111"
    token = "token_108"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("=" * 60)
    print("TESTING BUSINESS ENDPOINTS")
    print("=" * 60)
    print()
    
    # Test 1: Transactions Endpoint
    print("1. Testing /api/business/transactions")
    print("-" * 60)
    try:
        response = requests.get(f"{base_url}/api/business/transactions", headers=headers, timeout=5)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            success = data.get('success', False)
            transactions = data.get('data', [])
            count = len(transactions)
            
            print(f"   Success: {success}")
            print(f"   Transaction Count: {count}")
            
            if count > 0:
                print(f"   First 3 Transaction IDs: {[t.get('id') for t in transactions[:3]]}")
                print(f"   First 3 User IDs: {[t.get('user_id') for t in transactions[:3]]}")
            else:
                print("   No transactions returned (CORRECT - database has 0)")
        else:
            print(f"   ERROR: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   ERROR: {e}")
    
    print()
    
    # Test 2: Overview Endpoint
    print("2. Testing /api/business/dashboard/overview")
    print("-" * 60)
    try:
        response = requests.get(f"{base_url}/api/business/dashboard/overview", headers=headers, timeout=5)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            success = data.get('success', False)
            
            print(f"   Success: {success}")
            
            if data.get('data') and 'quick_stats' in data['data']:
                stats = data['data']['quick_stats']
                total_tx = stats.get('total_transactions', 0)
                monthly_rev = stats.get('monthly_revenue', 0)
                mapped_tx = stats.get('mapped_transactions', 0)
                
                print(f"   Total Transactions: {total_tx}")
                print(f"   Monthly Revenue: ${monthly_rev}")
                print(f"   Mapped Transactions: {mapped_tx}")
                
                if total_tx > 0:
                    print(f"   WARNING: Overview shows {total_tx} transactions but database has 0!")
                else:
                    print("   CORRECT: Overview shows 0 transactions")
            else:
                print(f"   ERROR: Invalid response structure")
                print(f"   Response keys: {list(data.keys())}")
        else:
            print(f"   ERROR: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   ERROR: {e}")
    
    print()
    
    # Test 3: Direct Database Query
    print("3. Direct Database Query")
    print("-" * 60)
    try:
        from database_manager import db_manager
        from sqlalchemy import text
        
        conn = db_manager.get_connection()
        result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = 108'))
        db_count = result.scalar() or 0
        db_manager.release_connection(conn)
        
        print(f"   Database Count for user 108: {db_count}")
        
        if db_count == 0:
            print("   CORRECT: Database has 0 transactions")
        else:
            print(f"   WARNING: Database has {db_count} transactions")
    except Exception as e:
        print(f"   ERROR: {e}")
    
    print()
    print("=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == '__main__':
    test_endpoints()

