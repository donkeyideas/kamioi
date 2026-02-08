import requests
import json

def test_financial_endpoints():
    try:
        print("Testing Financial Analytics endpoints...")
        
        # Get admin token
        login_data = {
            "email": "info@kamioi.com",
            "password": "admin123"
        }
        
        login_response = requests.post(
            'http://127.0.0.1:5000/api/admin/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data['token']
            print(f"Got token: {token}")
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            # Test the endpoints that FinancialAnalytics actually uses
            print("\nTesting FinancialAnalytics endpoints:")
            
            # Test transactions endpoint
            try:
                response = requests.get('http://127.0.0.1:5000/api/admin/transactions?limit=1000', headers=headers, timeout=5)
                print(f"Transactions: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"  Transactions count: {len(data.get('transactions', []))}")
                else:
                    print(f"  Error: {response.text}")
            except Exception as e:
                print(f"Transactions error: {e}")
            
            # Test users endpoint
            try:
                response = requests.get('http://127.0.0.1:5000/api/admin/users', headers=headers, timeout=5)
                print(f"Users: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"  Users count: {len(data.get('users', []))}")
                else:
                    print(f"  Error: {response.text}")
            except Exception as e:
                print(f"Users error: {e}")
            
            # Test mappings endpoint
            try:
                response = requests.get('http://127.0.0.1:5000/api/admin/llm-center/mappings?limit=1000', headers=headers, timeout=5)
                print(f"Mappings: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"  Mappings count: {len(data.get('mappings', []))}")
                else:
                    print(f"  Error: {response.text}")
            except Exception as e:
                print(f"Mappings error: {e}")
                
        else:
            print(f"Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_financial_endpoints()
