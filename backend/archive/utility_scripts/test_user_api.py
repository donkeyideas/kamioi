#!/usr/bin/env python3

import requests
import json

def test_user_api():
    """Test the user API with different token formats"""
    
    base_url = "http://localhost:5000"
    user_id = "1760927152574"
    
    # Test different token formats
    token_formats = [
        f"user_token_{user_id}",
        f"kamioi_user_token_{user_id}",
        f"token_{user_id}",
        user_id
    ]
    
    for token in token_formats:
        print(f"\nTesting token: {token}")
        try:
            response = requests.get(
                f"{base_url}/api/user/transactions",
                headers={'Authorization': f'Bearer {token}'}
            )
            print(f"  Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"  Success: {data.get('success')}")
                print(f"  Transactions: {len(data.get('transactions', []))}")
                if data.get('transactions'):
                    first_txn = data['transactions'][0]
                    print(f"  First transaction status: {first_txn.get('status')}")
            else:
                print(f"  Error: {response.text[:100]}")
        except Exception as e:
            print(f"  Exception: {e}")

if __name__ == "__main__":
    test_user_api()
