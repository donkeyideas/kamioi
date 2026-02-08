#!/usr/bin/env python3
"""
Get full error details from the server
"""

import requests
import sys

if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

url = "http://localhost:5111/api/test"

print("=" * 80)
print("Fetching error details from server")
print("=" * 80)
print(f"URL: {url}")
print()

try:
    response = requests.get(url, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    print()
    print("Response Body:")
    print("-" * 80)
    print(response.text)
    print("-" * 80)
except requests.exceptions.ConnectionError:
    print("[ERROR] Cannot connect to server. Is Flask running?")
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()

