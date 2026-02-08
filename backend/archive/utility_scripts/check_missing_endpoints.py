#!/usr/bin/env python3

import re

def check_missing_endpoints():
    print("CHECKING MISSING ENDPOINTS IN BACKEND")
    print("=" * 60)
    
    try:
        with open('app_clean.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for missing endpoints
        missing_endpoints = [
            '/api/admin/llm-center/processing-stats',
            '/api/admin/auth/me',
            '/api/admin/llm-center/approve',
            '/api/admin/llm-center/reject',
            '/api/admin/manual-submit',
            '/api/admin/database/clear-table'
        ]
        
        print("1. CHECKING BACKEND ENDPOINTS...")
        found_endpoints = []
        missing_backend = []
        
        for endpoint in missing_endpoints:
            if f"@app.route('{endpoint}'" in content:
                print(f"   FOUND: {endpoint}")
                found_endpoints.append(endpoint)
            else:
                print(f"   MISSING: {endpoint}")
                missing_backend.append(endpoint)
        
        print(f"\n2. SUMMARY")
        print("=" * 60)
        print(f"Found endpoints: {len(found_endpoints)}/{len(missing_endpoints)}")
        
        if missing_backend:
            print(f"\nMISSING ENDPOINTS TO ADD:")
            for endpoint in missing_backend:
                print(f"   - {endpoint}")
        else:
            print(f"\nALL ENDPOINTS FOUND IN BACKEND!")
        
        # Check if endpoints are properly implemented
        print(f"\n3. CHECKING ENDPOINT IMPLEMENTATIONS...")
        
        # Check for function definitions
        route_pattern = r"@app\.route\('([^']+)'[^}]*def\s+(\w+)"
        routes = re.findall(route_pattern, content)
        
        print(f"   Found {len(routes)} route definitions:")
        for route, func in routes:
            if 'admin' in route or 'llm' in route:
                print(f"   - {route} -> {func}")
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check_missing_endpoints()
