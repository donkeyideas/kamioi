#!/usr/bin/env python3
"""
Test the Flask app directly without running the server
"""

import sys
import os
sys.path.append('.')

# Import the app
import app

# Test the app directly
print("Testing Flask app directly...")
print(f"App routes registered: {len(list(app.app.url_map.iter_rules()))}")

# Test with test client
with app.app.test_client() as client:
    print("\nTesting endpoints with test client:")
    
    # Test health endpoint
    response = client.get('/api/health')
    print(f"/api/health: {response.status_code}")
    
    # Test user AI insights
    response = client.get('/api/user/ai/insights', 
                         headers={'Authorization': 'Bearer token_2'})
    print(f"/api/user/ai/insights: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        print(f"  Data keys: {list(data.keys())}")
        if 'data' in data:
            print(f"  Data count: {len(data['data'])}")
    
    # Test admin transactions
    response = client.get('/api/admin/transactions', 
                         headers={'Authorization': 'Bearer token_1'})
    print(f"/api/admin/transactions: {response.status_code}")
    
    # Test LLM Center queue
    response = client.get('/api/admin/llm-center/queue', 
                         headers={'Authorization': 'Bearer token_1'})
    print(f"/api/admin/llm-center/queue: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        if 'data' in data and 'queue_status' in data['data']:
            queue_status = data['data']['queue_status']
            print(f"  Queue status: Total={queue_status['total_entries']}, Auto={queue_status['auto_applied']}, Approved={queue_status['approved']}")
    
    # Test LLM Center mappings
    response = client.get('/api/admin/llm-center/mappings', 
                         headers={'Authorization': 'Bearer token_1'})
    print(f"/api/admin/llm-center/mappings: {response.status_code}")

print("\n✅ Direct testing completed!")
