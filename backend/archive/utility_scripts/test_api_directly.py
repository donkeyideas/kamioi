#!/usr/bin/env python3
"""
Test the /api/business/transactions endpoint directly
"""
import requests
import json

# Test the API endpoint
url = "http://localhost:5111/api/business/transactions"
headers = {
    "Authorization": "Bearer token_108",
    "Content-Type": "application/json"
}

print("=" * 60)
print("Testing API endpoint: /api/business/transactions")
print("=" * 60)

try:
    response = requests.get(url, headers=headers, timeout=10)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response Success: {data.get('success')}")
        
        if 'data' in data:
            transactions = data['data']
            if isinstance(transactions, list):
                print(f"Number of transactions returned: {len(transactions)}")
                if len(transactions) > 0:
                    print(f"Sample transaction IDs: {[tx.get('id') for tx in transactions[:5]]}")
                    print(f"Sample user_ids: {[tx.get('user_id') for tx in transactions[:5]]}")
            else:
                print(f"Data is not a list: {type(transactions)}")
                print(f"Data content: {json.dumps(transactions, indent=2)[:500]}")
        else:
            print(f"Response data: {json.dumps(data, indent=2)[:500]}")
    else:
        print(f"Error Response: {response.text}")
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()

print("=" * 60)

