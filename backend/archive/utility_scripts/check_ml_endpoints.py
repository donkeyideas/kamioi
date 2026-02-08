#!/usr/bin/env python3

import re

def check_ml_endpoints():
    print("CHECKING ML DASHBOARD ENDPOINTS IN BACKEND")
    print("=" * 60)
    
    try:
        with open('app_clean.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for ML-related endpoints
        ml_endpoints = [
            '/api/ml/stats',
            '/api/ml/recognize', 
            '/api/ml/learn',
            '/api/ml/feedback',
            '/api/ml/retrain',
            '/api/ml/export',
            '/api/admin/ml/',
            '/api/admin/ai/',
            '/api/admin/analytics/',
            '/api/admin/predictions/',
            '/api/admin/models/',
            '/api/admin/training/',
            '/api/admin/performance/',
            '/api/admin/metrics/'
        ]
        
        print("1. CHECKING BACKEND ML ENDPOINTS...")
        found_endpoints = []
        missing_endpoints = []
        
        for endpoint in ml_endpoints:
            if f"@app.route('{endpoint}'" in content:
                print(f"   FOUND: {endpoint}")
                found_endpoints.append(endpoint)
            else:
                print(f"   MISSING: {endpoint}")
                missing_endpoints.append(endpoint)
        
        # Check for any ML-related routes
        print(f"\n2. SEARCHING FOR ML-RELATED ROUTES...")
        route_pattern = r"@app\.route\('([^']+)'[^}]*def\s+(\w+)"
        routes = re.findall(route_pattern, content)
        
        ml_routes = []
        for route, func in routes:
            if any(keyword in route.lower() for keyword in ['ml', 'ai', 'model', 'train', 'predict', 'analytics']):
                ml_routes.append((route, func))
                print(f"   ML ROUTE: {route} -> {func}")
        
        print(f"\n3. SUMMARY")
        print("=" * 60)
        print(f"Found ML endpoints: {len(found_endpoints)}/{len(ml_endpoints)}")
        print(f"Found ML routes: {len(ml_routes)}")
        
        if missing_endpoints:
            print(f"\nMISSING ENDPOINTS TO ADD:")
            for endpoint in missing_endpoints:
                print(f"   - {endpoint}")
        else:
            print(f"\nALL ML ENDPOINTS FOUND IN BACKEND!")
        
        return {
            'found_endpoints': found_endpoints,
            'missing_endpoints': missing_endpoints,
            'ml_routes': ml_routes
        }
        
    except Exception as e:
        print(f"ERROR: {e}")
        return None

if __name__ == "__main__":
    check_ml_endpoints()
