#!/usr/bin/env python3
"""
Test Debug Routes
"""

import requests
import time

def test_debug_routes():
    """Test the debug routes endpoint"""
    print("=== TESTING DEBUG ROUTES ===")
    
    time.sleep(3)  # Wait for server to reload
    
    try:
        resp = requests.get('http://127.0.0.1:5000/api/debug/routes')
        data = resp.json()
        
        print(f"Total routes: {data.get('total')}")
        
        admin_routes = [r for r in data.get('routes', []) if 'admin' in r.get('path', '')]
        print(f"Admin routes: {len(admin_routes)}")
        
        print("\nFirst 10 admin routes:")
        for r in admin_routes[:10]:
            print(f"  {r.get('path')} -> {r.get('endpoint')}")
            
        # Check for specific routes
        emp_routes = [r for r in data.get('routes', []) if 'employees' in r.get('path', '')]
        print(f"\nEmployee routes: {len(emp_routes)}")
        for r in emp_routes:
            print(f"  {r.get('path')} -> {r.get('endpoint')} {r.get('methods')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_debug_routes()
