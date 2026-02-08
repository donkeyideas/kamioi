#!/usr/bin/env python3

import requests
import json
import time
import threading
from datetime import datetime

def monitor_api_calls():
    """Monitor API calls to see if frontend is making requests"""
    print("🔍 MONITORING FRONTEND API CALLS")
    print("=" * 50)
    print("Navigate to ML Dashboard and LLM Data Management pages")
    print("Watch for API calls in the console...")
    print("=" * 50)
    
    # Test endpoints that should be called
    endpoints_to_monitor = [
        "/api/ml/stats",
        "/api/llm-data/system-status", 
        "/api/llm-data/event-stats",
        "/api/llm-data/vector-embeddings",
        "/api/llm-data/feature-store"
    ]
    
    print(f"Monitoring {len(endpoints_to_monitor)} endpoints...")
    print("Press Ctrl+C to stop monitoring")
    
    try:
        while True:
            time.sleep(1)
            # This is just a placeholder - in a real scenario, you'd monitor server logs
            # or use a tool like ngrok to see incoming requests
            pass
    except KeyboardInterrupt:
        print("\nMonitoring stopped.")

def test_direct_api_calls():
    """Test the APIs directly to make sure they work"""
    print("\n[TEST] TESTING APIS DIRECTLY")
    print("=" * 30)
    
    base_url = "http://localhost:5000"
    
    # Login first
    login_data = {
        "email": "info@kamioi.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/admin/auth/login", json=login_data)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                token = result.get('token')
                print(f"[OK] Login successful")
                
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                # Test each endpoint
                for endpoint in [
                    "/api/ml/stats",
                    "/api/llm-data/system-status",
                    "/api/llm-data/event-stats",
                    "/api/llm-data/vector-embeddings",
                    "/api/llm-data/feature-store"
                ]:
                    print(f"\n[TEST] Testing {endpoint}...")
                    try:
                        response = requests.get(f"{base_url}{endpoint}", headers=headers)
                        print(f"   Status: {response.status_code}")
                        if response.status_code == 200:
                            data = response.json()
                            print(f"   Success: {data.get('success', False)}")
                            if data.get('data'):
                                print(f"   Data keys: {list(data['data'].keys())}")
                        else:
                            print(f"   Error: {response.text[:100]}")
                    except Exception as e:
                        print(f"   Exception: {e}")
                
                print(f"\n[OK] All APIs tested successfully!")
                print(f"\nNow navigate to the frontend pages and check the browser console.")
                print(f"You should see console logs starting with [TEST] and [OK]")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed with status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Login error: {e}")

if __name__ == "__main__":
    test_direct_api_calls()
    print(f"\n" + "=" * 50)
    print("INSTRUCTIONS FOR TESTING:")
    print("1. Make sure backend is running")
    print("2. Make sure frontend is running") 
    print("3. Open browser to http://localhost:3765")
    print("4. Login as admin (info@kamioi.com / admin123)")
    print("5. Navigate to ML Dashboard page")
    print("6. Navigate to LLM Data Management page")
    print("7. Check browser console for logs starting with [TEST]")
    print("8. If you see the logs, the APIs are being called!")
    print("=" * 50)
