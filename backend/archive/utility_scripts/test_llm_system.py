#!/usr/bin/env python3
"""
Test the Smart LLM System
"""

import requests
import json
import time

def test_llm_system():
    base_url = "http://localhost:5000"
    
    print("Testing Smart LLM System...")
    
    # Test 1: Get processing stats
    print("\n1. Getting processing stats...")
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/processing-stats", 
                               headers={'Authorization': 'Bearer token_1'})
        if response.status_code == 200:
            stats = response.json()
            print(f"Stats: {stats['data']}")
        else:
            print(f"Error getting stats: {response.status_code}")
    except Exception as e:
        print(f"Connection error: {e}")
        return
    
    # Test 2: Start processing
    print("\n2. Starting Smart LLM processing...")
    try:
        response = requests.post(f"{base_url}/api/admin/llm-center/start-processing",
                               headers={'Authorization': 'Bearer token_1'})
        if response.status_code == 200:
            result = response.json()
            print(f"Processing started: {result['message']}")
        else:
            print(f"Error starting processing: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Process a batch manually
    print("\n3. Processing a batch manually...")
    try:
        response = requests.post(f"{base_url}/api/admin/llm-center/process-batch",
                               headers={'Authorization': 'Bearer token_1'})
        if response.status_code == 200:
            result = response.json()
            print(f"Batch processed: {result['message']}")
            print(f"   Data: {result['data']}")
        else:
            print(f"Error processing batch: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 4: Check stats again
    print("\n4. Checking stats after processing...")
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/processing-stats", 
                               headers={'Authorization': 'Bearer token_1'})
        if response.status_code == 200:
            stats = response.json()
            print(f"Updated stats: {stats['data']}")
        else:
            print(f"Error getting updated stats: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 5: Stop processing
    print("\n5. Stopping processing...")
    try:
        response = requests.post(f"{base_url}/api/admin/llm-center/stop-processing",
                               headers={'Authorization': 'Bearer token_1'})
        if response.status_code == 200:
            result = response.json()
            print(f"Processing stopped: {result['message']}")
        else:
            print(f"Error stopping processing: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_llm_system()
