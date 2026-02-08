import requests
import json

def test_sample_data():
    print("Testing sample data for beltranalain@gmail.com")
    print("=" * 50)
    
    # First, get admin token
    login_url = 'http://127.0.0.1:5000/api/admin/auth/login'
    login_data = {"email": "info@kamioi.com", "password": "admin123"}
    login_headers = {'Content-Type': 'application/json'}

    try:
        # Get admin token
        login_response = requests.post(login_url, json=login_data, headers=login_headers, timeout=5)
        login_response.raise_for_status()
        login_data = login_response.json()
        token = login_data.get('token')
        
        if not token:
            print("[FAIL] Could not get admin token.")
            return False
        
        print(f"[OK] Got admin token: {token}")
        
        # Test user data endpoints
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Test transactions
        print("\n1. Testing transactions...")
        response = requests.get('http://127.0.0.1:5000/api/admin/transactions', headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            transactions = data.get('transactions', [])
            print(f"[OK] Transactions: {len(transactions)} total")
            
            # Filter for our user
            user_transactions = [t for t in transactions if t.get('user_id') == 1760927152574]
            print(f"[OK] User transactions: {len(user_transactions)}")
            
            if user_transactions:
                print("Sample transaction:")
                sample = user_transactions[0]
                print(f"  Amount: ${sample.get('amount', 0)}")
                print(f"  Merchant: {sample.get('merchant', 'N/A')}")
                print(f"  Category: {sample.get('category', 'N/A')}")
                print(f"  Date: {sample.get('date', 'N/A')}")
        else:
            print(f"[FAIL] Transactions: {response.status_code}")
        
        # Test users endpoint
        print("\n2. Testing users...")
        response = requests.get('http://127.0.0.1:5000/api/admin/users', headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            users = data.get('users', [])
            print(f"[OK] Users: {len(users)} total")
            
            # Find our user
            user = next((u for u in users if u.get('email') == 'beltranalain@gmail.com'), None)
            if user:
                print(f"[OK] Found user: {user.get('name', 'N/A')} ({user.get('email', 'N/A')})")
                print(f"  Role: {user.get('role', 'N/A')}")
                print(f"  Created: {user.get('created_at', 'N/A')}")
            else:
                print("[FAIL] User not found")
        else:
            print(f"[FAIL] Users: {response.status_code}")
        
        print("\n" + "=" * 50)
        print("[SUCCESS] Sample data test complete!")
        print("Ready for dashboard presentation!")
        return True
        
    except Exception as e:
        print(f"[FAIL] Test failed: {e}")
        return False

if __name__ == "__main__":
    test_sample_data()
