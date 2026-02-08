#!/usr/bin/env python3
"""
Test endpoint and check if server is actually processing requests
"""

import requests
import time
import sys

if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

print("=" * 80)
print("Testing server with detailed error capture")
print("=" * 80)
print()
print("IMPORTANT: Make sure Flask server is running in another terminal!")
print("Press Enter after you've started the Flask server...")
input()

url = "http://localhost:5111/api/test"

print(f"\nMaking request to: {url}")
print("Watch the Flask console for output!")
print()

try:
    response = requests.get(url, timeout=10)
    
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
    print(f"Content-Length: {response.headers.get('Content-Length', 'N/A')}")
    print()
    print("Response Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    print()
    print("Response Body:")
    print("-" * 80)
    body = response.text
    if body:
        print(body)
    else:
        print("(EMPTY - No response body)")
    print("-" * 80)
    print()
    
    if response.status_code == 500 and not body:
        print("=" * 80)
        print("DIAGNOSIS: Empty 500 response")
        print("=" * 80)
        print()
        print("This means:")
        print("1. Request reached Flask (we got a 500)")
        print("2. An exception occurred")
        print("3. But the error response is empty")
        print()
        print("CHECK YOUR FLASK CONSOLE NOW!")
        print("You should see error messages there.")
        print()
        print("If you see NOTHING in Flask console, the error is happening")
        print("before Flask can log it, possibly in:")
        print("- WSGI middleware")
        print("- Flask-CORS")
        print("- Request context setup")
        print()
        
except requests.exceptions.ConnectionError:
    print("[ERROR] Cannot connect to server")
    print("Make sure Flask is running on port 5111")
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 80)
print("Next: Check your Flask server console for any error messages")
print("=" * 80)

