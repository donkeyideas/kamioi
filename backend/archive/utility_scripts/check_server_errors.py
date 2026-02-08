#!/usr/bin/env python3
"""
Quick script to check what error the server is actually returning
"""

import sys
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

import requests
import json

def check_endpoint(url, description):
    """Check an endpoint and show detailed error information"""
    print(f"\n{'='*80}")
    print(f"Testing: {description}")
    print(f"URL: {url}")
    print('='*80)
    
    try:
        response = requests.get(url, timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
        print()
        print("Response Body:")
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2))
        except:
            print(response.text[:1000])
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("[ERROR] Cannot connect to server")
        return False
    except Exception as e:
        print(f"[ERROR] {e}")
        return False

if __name__ == "__main__":
    print("\nServer Error Diagnostic Tool\n")
    
    # Test health endpoint
    check_endpoint("http://localhost:5111/api/health", "Health Endpoint")
    
    # Test a simple admin endpoint
    headers = {
        "Authorization": "Bearer admin_token_3",
        "Content-Type": "application/json"
    }
    
    print(f"\n{'='*80}")
    print("Testing: Admin Auth Endpoint")
    print(f"URL: http://localhost:5111/api/admin/auth/me")
    print('='*80)
    
    try:
        response = requests.get(
            "http://localhost:5111/api/admin/auth/me",
            headers=headers,
            timeout=5
        )
        print(f"Status Code: {response.status_code}")
        print()
        print("Response Body:")
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2))
        except:
            print(response.text[:1000])
    except Exception as e:
        print(f"[ERROR] {e}")
    
    print("\n" + "="*80)
    print("IMPORTANT: Check your Flask server console for error messages!")
    print("Look for lines starting with:")
    print("  - [ERROR]")
    print("  - [AUTH]")
    print("  - Unhandled exception")
    print("="*80)

