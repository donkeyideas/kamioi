#!/usr/bin/env python3
"""
Test script to make a request and show the full response
"""
import requests
import sys

print("=" * 80)
print("Testing Flask Server")
print("=" * 80)
print()

url = "http://localhost:5111/api/test"  # Changed to match server port
print(f"Making request to: {url}")
print("WATCH THE FLASK CONSOLE FOR OUTPUT!")
print()

try:
    response = requests.get(url, timeout=10)
    print(f"\nResponse Status Code: {response.status_code}")
    print(f"Response Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    print(f"\nResponse Body ({len(response.text)} bytes):")
    print("-" * 80)
    print(response.text)
    print("-" * 80)
    
    if response.status_code == 500:
        print("\n" + "=" * 80)
        print("ERROR: Got 500 Internal Server Error")
        print("Check the Flask console for error details!")
        print("=" * 80)
        
except requests.exceptions.ConnectionError as e:
    print(f"\nERROR: Could not connect to server")
    print(f"Make sure Flask server is running on port 5111")
    print(f"Error: {e}")
except Exception as e:
    print(f"\nERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("Test complete")
print("=" * 80)

