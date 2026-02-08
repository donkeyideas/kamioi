#!/usr/bin/env python3
"""
This script will help capture what Flask is actually outputting
"""

import subprocess
import sys
import time

print("=" * 80)
print("Flask Output Capture Tool")
print("=" * 80)
print()
print("This script will help you see what Flask outputs when requests are made.")
print()
print("INSTRUCTIONS:")
print("1. Start Flask server in a separate terminal: python app.py")
print("2. Run this script")
print("3. This script will make a request and you should see output in Flask console")
print()
input("Press Enter when Flask server is running...")

import requests

print("\nMaking request to http://localhost:5111/api/test...")
print("WATCH THE FLASK CONSOLE NOW!")
print()

try:
    response = requests.get("http://localhost:5111/api/test", timeout=5)
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Body Length: {len(response.text)}")
    if response.text:
        print(f"Response Body: {response.text[:500]}")
    else:
        print("Response Body: (EMPTY)")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 80)
print("Did you see any output in the Flask console?")
print("If YES: Copy and share it")
print("If NO: There's a deeper issue preventing Flask from processing requests")
print("=" * 80)

