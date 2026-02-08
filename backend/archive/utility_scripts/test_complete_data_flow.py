#!/usr/bin/env python3
"""
Test Complete Data Flow - Verify data flows from database to frontend
"""

import requests
import json
import time

def test_complete_data_flow():
    """Test the complete data flow from database to frontend"""
    print("=== COMPLETE DATA FLOW TEST ===")
    print()
    
    # Step 1: Login as user5@user5.com
    print("1. Testing user login...")
    login_resp = requests.post('http://127.0.0.1:5000/api/user/auth/login', 
                             json={'email': 'user5@user5.com', 'password': 'user5'})
    
    if login_resp.status_code != 200:
        print(f"[ERROR] Login failed: {login_resp.status_code}")
        return
    
    token = login_resp.json()['token']
    print(f"[OK] Login successful, token: {token[:20]}...")
    
    # Step 2: Test all user endpoints
    print("\n2. Testing all user endpoints...")
    headers = {'Authorization': f'Bearer {token}'}
    
    endpoints = [
        ('/api/user/transactions', 'Transactions'),
        ('/api/user/portfolio', 'Portfolio'),
        ('/api/user/goals', 'Goals'),
        ('/api/user/ai/insights', 'AI Insights'),
        ('/api/user/notifications', 'Notifications'),
        ('/api/user/roundups/total', 'Round-ups Total'),
        ('/api/user/fees/total', 'Fees Total')
    ]
    
    results = {}
    for endpoint, name in endpoints:
        try:
            resp = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                results[name] = {
                    'status': 'success',
                    'data_count': len(data.get('data', [])) if isinstance(data.get('data'), list) else 0,
                    'response_keys': list(data.keys()),
                    'sample_data': data.get('data', [])[:2] if isinstance(data.get('data'), list) else data.get('data')
                }
                print(f"   [OK] {name}: {resp.status_code} - {results[name]['data_count']} items")
            else:
                results[name] = {'status': 'error', 'code': resp.status_code}
                print(f"   [ERROR] {name}: {resp.status_code}")
        except Exception as e:
            results[name] = {'status': 'exception', 'error': str(e)}
            print(f"   [ERROR] {name}: Exception - {e}")
    
    # Step 3: Analyze results
    print("\n3. Analyzing results...")
    successful_endpoints = [name for name, result in results.items() if result.get('status') == 'success']
    failed_endpoints = [name for name, result in results.items() if result.get('status') != 'success']
    
    print(f"   Successful endpoints: {len(successful_endpoints)}")
    print(f"   Failed endpoints: {len(failed_endpoints)}")
    
    if failed_endpoints:
        print(f"   Failed: {', '.join(failed_endpoints)}")
    
    # Step 4: Check data consistency
    print("\n4. Checking data consistency...")
    if 'Transactions' in results and results['Transactions']['status'] == 'success':
        txn_count = results['Transactions']['data_count']
        print(f"   Transactions count: {txn_count}")
        
        if txn_count > 0:
            print("   [OK] User has transactions in database")
            print(f"   Sample transaction: {results['Transactions']['sample_data'][0] if results['Transactions']['sample_data'] else 'None'}")
        else:
            print("   [WARNING] No transactions found for user")
    
    if 'Portfolio' in results and results['Portfolio']['status'] == 'success':
        portfolio_data = results['Portfolio']['sample_data']
        if portfolio_data and 'overview' in portfolio_data:
            overview = portfolio_data['overview']
            print(f"   Portfolio overview: {overview}")
        else:
            print("   [WARNING] No portfolio overview found")
    
    # Step 5: Summary
    print("\n5. Summary:")
    print(f"   Total endpoints tested: {len(endpoints)}")
    print(f"   Successful: {len(successful_endpoints)}")
    print(f"   Failed: {len(failed_endpoints)}")
    
    if len(successful_endpoints) == len(endpoints):
        print("   [SUCCESS] All endpoints working correctly")
    else:
        print("   [WARNING] Some endpoints failed - check backend implementation")
    
    print("\n=== DATA FLOW TEST COMPLETE ===")
    return results

if __name__ == "__main__":
    test_complete_data_flow()

