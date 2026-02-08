#!/usr/bin/env python3
"""
Diagnostic script to identify admin authentication issues
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

BASE_URL = "http://localhost:5111"
ADMIN_TOKEN = "admin_token_3"

def test_auth():
    """Test admin authentication endpoint"""
    print("=" * 80)
    print("Testing Admin Authentication")
    print("=" * 80)
    print()
    
    url = f"{BASE_URL}/api/admin/auth/me"
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }
    
    print(f"URL: {url}")
    print(f"Token: {ADMIN_TOKEN}")
    print(f"Headers: {json.dumps(headers, indent=2)}")
    print()
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print()
        
        try:
            response_json = response.json()
            print("Response Body:")
            print(json.dumps(response_json, indent=2))
        except:
            print("Response Body (text):")
            print(response.text[:1000])
        
        print()
        print("=" * 80)
        
        if response.status_code == 200:
            print("[SUCCESS] Authentication working!")
            return True
        else:
            print(f"[FAILED] Authentication failed with status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("[ERROR] Cannot connect to server. Is Flask running on port 5111?")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_health():
    """Test health endpoint (no auth required)"""
    print("=" * 80)
    print("Testing Health Endpoint (No Auth)")
    print("=" * 80)
    print()
    
    url = f"{BASE_URL}/api/health"
    
    try:
        response = requests.get(url, timeout=5)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("[SUCCESS] Server is running")
            return True
        else:
            print(f"[WARNING] Server returned {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("[ERROR] Cannot connect to server")
        return False
    except Exception as e:
        print(f"[ERROR] {e}")
        return False

if __name__ == "__main__":
    print("\nAdmin Authentication Diagnostic Tool\n")
    
    # Test health first
    if not test_health():
        print("\n[CRITICAL] Server is not accessible. Please start Flask server first.")
        sys.exit(1)
    
    print()
    
    # Test authentication
    success = test_auth()
    
    print()
    if success:
        print("[RESULT] Authentication is working correctly!")
        sys.exit(0)
    else:
        print("[RESULT] Authentication is failing. Check server logs for details.")
        print("\nNext steps:")
        print("1. Check Flask server console for error messages")
        print("2. Look for [AUTH] or [ERROR] log entries")
        print("3. Verify admin token format: admin_token_<id>")
        print("4. Check database connection and admin table")
        sys.exit(1)

