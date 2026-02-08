#!/usr/bin/env python3

import requests
import json

def fix_user_token():
    """Test and fix the user token issue"""
    
    base_url = "http://localhost:5000"
    user_id = "1760927152574"
    
    print("Testing different token formats...")
    
    # Test the correct token format
    correct_token = f"user_token_{user_id}"
    print(f"\nTesting correct token: {correct_token}")
    
    try:
        response = requests.get(
            f"{base_url}/api/user/transactions",
            headers={'Authorization': f'Bearer {correct_token}'}
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
    
    print(f"\nThe frontend should be using token: {correct_token}")
    print("Check your browser's localStorage for 'kamioi_user_token' key")
    print("The value should be converted to the format above")

if __name__ == "__main__":
    fix_user_token()
