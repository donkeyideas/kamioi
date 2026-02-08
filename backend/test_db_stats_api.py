#!/usr/bin/env python3
"""
Test the database stats API endpoint directly
"""

import sys
import os
import requests

# Test the endpoint
base_url = 'http://localhost:5111'
token = 'admin_token_3'  # Default admin token

try:
    response = requests.get(
        f'{base_url}/api/admin/database/stats',
        headers={'Authorization': f'Bearer {token}'},
        params={'t': int(os.times()[4] * 1000)}  # Cache bust
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            stats = data.get('data', {})
            print("API Response:")
            print(f"  Total Transactions: {stats.get('total', {}).get('transactions', 0)}")
            print(f"  Total Round-up Allocations: {stats.get('total', {}).get('round_up_allocations', 0)}")
            print(f"\nBreakdown:")
            for account_type in ['individual', 'family', 'business', 'admin']:
                breakdown = stats.get(account_type, {})
                print(f"  {account_type.capitalize()}:")
                print(f"    Transactions: {breakdown.get('transactions', 0)}")
                print(f"    Round-up Allocations: {breakdown.get('round_up_allocations', 0)}")
        else:
            print(f"Error: {data.get('error')}")
    else:
        print(f"HTTP {response.status_code}: {response.text}")
except Exception as e:
    print(f"Error: {e}")


