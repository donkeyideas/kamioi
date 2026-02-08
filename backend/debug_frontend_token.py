#!/usr/bin/env python3

import requests
import json

def debug_frontend_token():
    """Debug what token the frontend is actually using"""
    
    base_url = "http://localhost:5000"
    
    # Test the exact same call the frontend would make
    print("Testing frontend API call...")
    
    # Try different token formats that might be stored in localStorage
    test_tokens = [
        "user_token_1760927152574",  # Correct format
        "kamioi_user_token_1760927152574",  # Frontend format
        "1760927152574",  # Just user ID
    ]
    
    for token in test_tokens:
        print(f"\nTesting with token: {token}")
        try:
            response = requests.get(
                f"{base_url}/api/user/transactions",
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
            )
            print(f"  Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"  Success: {data.get('success')}")
                print(f"  Transactions: {len(data.get('transactions', []))}")
                if data.get('transactions'):
                    first_txn = data['transactions'][0]
                    print(f"  First transaction: {first_txn.get('merchant')} - {first_txn.get('status')}")
            else:
                print(f"  Error: {response.text[:200]}")
        except Exception as e:
            print(f"  Exception: {e}")

if __name__ == "__main__":
    debug_frontend_token()

