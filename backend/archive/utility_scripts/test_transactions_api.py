#!/usr/bin/env python3
"""
Test script to verify what the business transactions API returns
"""
import requests
import json

# Test the API endpoint
url = "http://localhost:5111/api/business/transactions"
headers = {
    "Authorization": "Bearer token_108"
}

print("Testing business transactions API...")
print(f"URL: {url}")
print(f"Headers: {headers}")
print()

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print()
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response JSON: {json.dumps(data, indent=2)}")
        print()
        
        if 'data' in data:
            transactions = data['data']
            print(f"Number of transactions returned: {len(transactions)}")
            
            if len(transactions) > 0:
                print(f"\nFirst transaction sample:")
                print(json.dumps(transactions[0], indent=2))
                print(f"\nTransaction IDs: {[tx.get('id') for tx in transactions[:10]]}")
                print(f"User IDs: {[tx.get('user_id') for tx in transactions[:10]]}")
            else:
                print("No transactions in response (this is correct!)")
        else:
            print("No 'data' field in response")
    else:
        print(f"Error response: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

