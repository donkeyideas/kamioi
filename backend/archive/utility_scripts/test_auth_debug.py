#!/usr/bin/env python3
"""
Test script to debug authentication issues
"""

import requests
import json

BASE_URL = 'http://127.0.0.1:5000'
ADMIN_TOKEN = 'admin_token_3'  # This is what the frontend is actually using

def test_auth_debug():
    """Test authentication with debug info"""
    print("Testing Authentication Debug...")
    
    headers = {
        'Authorization': f'Bearer {ADMIN_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    print(f"Token: {ADMIN_TOKEN}")
    print(f"Full Authorization header: {headers['Authorization']}")
    
    try:
        # Test data-assets endpoint
        print("\nTesting LLM Data Assets endpoint...")
        response = requests.get(f'{BASE_URL}/api/admin/llm-center/data-assets', headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Test AI process-queue endpoint
        print("\nTesting AI Process Queue endpoint...")
        response = requests.post(f'{BASE_URL}/api/admin/ai/process-queue', headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_auth_debug()
