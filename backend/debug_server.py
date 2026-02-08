#!/usr/bin/env python3
"""
Debug Server Issues
"""

import requests
import json

def debug_server():
    """Debug server issues"""
    print("=== DEBUGGING SERVER ISSUES ===")
    
    # Test health endpoint
    print("1. Testing health endpoint...")
    try:
        health = requests.get('http://127.0.0.1:5000/api/health', timeout=5)
        print(f"   Health status: {health.status_code}")
        print(f"   Health response: {health.text[:100]}")
    except Exception as e:
        print(f"   Health failed: {e}")
        return
    
    # Test admin login with detailed output
    print("\n2. Testing admin login...")
    try:
        resp = requests.post('http://127.0.0.1:5000/api/admin/auth/login', 
                           json={'email': 'info@kamioi.com', 'password': 'admin123'},
                           timeout=5)
        print(f"   Status: {resp.status_code}")
        print(f"   Headers: {dict(resp.headers)}")
        print(f"   Content-Type: {resp.headers.get('content-type', 'unknown')}")
        print(f"   Response length: {len(resp.text)}")
        print(f"   First 200 chars: {resp.text[:200]}")
        
        if resp.status_code == 200:
            try:
                data = resp.json()
                print(f"   JSON Success: {data.get('success')}")
                print(f"   Token: {data.get('token')}")
            except:
                print("   Response is not valid JSON")
        else:
            print("   Admin login failed")
            
    except Exception as e:
        print(f"   Request failed: {e}")

if __name__ == "__main__":
    debug_server()
