"""
Diagnostic script to test _calculate_user_metrics() function
and compare with business_transactions endpoint results
"""
import requests
import json

def test_business_transactions(user_id=108):
    """Test the business transactions endpoint"""
    print(f"\n{'='*60}")
    print(f"TEST 1: Business Transactions Endpoint (User {user_id})")
    print(f"{'='*60}")
    
    # First, we need to get a business token for user 108
    # For testing, we'll use a direct database query approach
    # But let's try the endpoint first
    try:
        response = requests.get(
            'http://localhost:5111/api/business/transactions',
            headers={'Authorization': 'Bearer business_token_108'},  # Assuming token format
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        data = response.json()
        
        if data.get('success'):
            transactions = data.get('data', [])
            print(f"✓ Found {len(transactions)} transactions")
            if transactions:
                print(f"  First transaction: {transactions[0].get('merchant', 'N/A')} - ${transactions[0].get('amount', 0)}")
                print(f"  Total round-ups: ${sum(tx.get('round_up', 0) or 0 for tx in transactions):.2f}")
                print(f"  Total fees: ${sum(tx.get('fee', 0) or 0 for tx in transactions):.2f}")
        else:
            print(f"✗ Error: {data.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"✗ Exception: {e}")

def test_admin_users_endpoint():
    """Test the admin users endpoint to see metrics for user 108"""
    print(f"\n{'='*60}")
    print(f"TEST 2: Admin Users Endpoint (Looking for User 108)")
    print(f"{'='*60}")
    
    try:
        response = requests.get(
            'http://localhost:5111/api/admin/users',
            headers={'Authorization': 'Bearer admin_token_3'},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        data = response.json()
        
        if data.get('success'):
            users = data.get('users', [])
            print(f"✓ Found {len(users)} total users")
            
            # Find user 108
            user_108 = [u for u in users if u.get('id') == 108]
            if user_108:
                u = user_108[0]
                print(f"\n✓ User 108 Found:")
                print(f"  Name: {u.get('name', 'N/A')}")
                print(f"  Email: {u.get('email', 'N/A')}")
                print(f"  Round-ups: ${u.get('round_ups', 0)}")
                print(f"  Fees: ${u.get('fees', 0)}")
                print(f"  Total Balance: ${u.get('total_balance', 0)}")
                print(f"  AI Health: {u.get('ai_health', 0)}")
                print(f"  Activity Count: {u.get('activity_count', 0)}")
                print(f"  Transaction Count: {u.get('transaction_count', 0)}")
            else:
                print(f"\n✗ User 108 not found in response")
        else:
            print(f"✗ Error: {data.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"✗ Exception: {e}")

def test_direct_database_query():
    """Test direct database query to verify transactions exist"""
    print(f"\n{'='*60}")
    print(f"TEST 3: Direct Database Query (User 108)")
    print(f"{'='*60}")
    print("NOTE: This requires Flask app to be running and database access")
    print("Run this from within the Flask app context or use a database client")

if __name__ == '__main__':
    print("\n" + "="*60)
    print("USER METRICS DIAGNOSIS TEST")
    print("="*60)
    print("\nMake sure Flask server is running on http://localhost:5111")
    print("Press Enter to continue...")
    input()
    
    # Test 1: Business transactions endpoint
    test_business_transactions(108)
    
    # Test 2: Admin users endpoint
    test_admin_users_endpoint()
    
    # Test 3: Direct database (manual)
    test_direct_database_query()
    
    print(f"\n{'='*60}")
    print("DIAGNOSIS COMPLETE")
    print(f"{'='*60}")
    print("\nCheck Flask console output for:")
    print("  - [_calculate_user_metrics] User 108: Found X transactions")
    print("  - Any error messages")
    print("  - Data integrity warnings")


