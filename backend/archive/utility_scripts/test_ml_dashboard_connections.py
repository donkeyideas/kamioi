#!/usr/bin/env python3

import re
import os

def test_ml_dashboard_connections():
    print("ML DASHBOARD FRONTEND-BACKEND CONNECTION ANALYSIS")
    print("=" * 60)
    
    # Check if ML Dashboard component exists
    ml_dashboard_path = "../frontend/src/components/admin/MLDashboard.jsx"
    
    if not os.path.exists(ml_dashboard_path):
        print("ERROR: MLDashboard.jsx file not found!")
        print("Checking for alternative ML Dashboard files...")
        
        # Look for ML Dashboard in different locations
        possible_paths = [
            "../frontend/src/components/admin/MLDashboard.js",
            "../frontend/src/components/MLDashboard.jsx",
            "../frontend/src/pages/MLDashboard.jsx",
            "../frontend/src/components/admin/MachineLearningDashboard.jsx"
        ]
        
        found = False
        for path in possible_paths:
            if os.path.exists(path):
                print(f"FOUND: {path}")
                ml_dashboard_path = path
                found = True
                break
        
        if not found:
            print("No ML Dashboard component found!")
            return
    
    try:
        with open(ml_dashboard_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print("1. ANALYZING ML DASHBOARD API CALLS...")
        
        # Find all API calls
        api_calls = re.findall(r"fetch\('([^']+)'", content)
        print(f"   Found {len(api_calls)} API calls:")
        
        for i, api_call in enumerate(api_calls, 1):
            print(f"   {i}. {api_call}")
        
        # Check for specific ML Dashboard endpoints
        ml_endpoints = [
            '/api/admin/ml/',
            '/api/admin/ai/',
            '/api/admin/analytics/',
            '/api/admin/predictions/',
            '/api/admin/models/',
            '/api/admin/training/',
            '/api/admin/performance/',
            '/api/admin/metrics/'
        ]
        
        print(f"\n2. CHECKING ML DASHBOARD ENDPOINTS...")
        found_endpoints = []
        missing_endpoints = []
        
        for endpoint in ml_endpoints:
            if endpoint in content:
                print(f"   FOUND: {endpoint}")
                found_endpoints.append(endpoint)
            else:
                print(f"   MISSING: {endpoint}")
                missing_endpoints.append(endpoint)
        
        # Check authentication
        print(f"\n3. CHECKING AUTHENTICATION...")
        if 'kamioi_admin_token' in content:
            print("   FOUND: kamioi_admin_token usage")
        else:
            print("   MISSING: kamioi_admin_token usage")
        
        if 'Authorization' in content:
            print("   FOUND: Authorization header usage")
        else:
            print("   MISSING: Authorization header usage")
        
        # Check error handling
        print(f"\n4. CHECKING ERROR HANDLING...")
        if 'catch' in content:
            print("   FOUND: Error handling with try/catch")
        else:
            print("   MISSING: Error handling")
        
        if 'response.ok' in content:
            print("   FOUND: Response status checking")
        else:
            print("   MISSING: Response status checking")
        
        # Check data processing
        print(f"\n5. CHECKING DATA PROCESSING...")
        if 'json()' in content:
            print("   FOUND: JSON response parsing")
        else:
            print("   MISSING: JSON response parsing")
        
        if 'useState' in content or 'useEffect' in content:
            print("   FOUND: React hooks usage")
        else:
            print("   MISSING: React hooks usage")
        
        # Summary
        print(f"\n6. SUMMARY")
        print("=" * 60)
        
        if not missing_endpoints:
            print("ALL ML DASHBOARD ENDPOINTS CONNECTED!")
        else:
            print(f"MISSING ENDPOINTS: {len(missing_endpoints)}")
            for endpoint in missing_endpoints:
                print(f"   - {endpoint}")
        
        print(f"\nML Dashboard Frontend-Backend Connection Status:")
        print(f"   API Calls: {len(api_calls)}")
        print(f"   Authentication: {'Working' if 'kamioi_admin_token' in content else 'Missing'}")
        print(f"   Error Handling: {'Working' if 'catch' in content else 'Missing'}")
        print(f"   Data Processing: {'Working' if 'json()' in content else 'Missing'}")
        
        return {
            'api_calls': api_calls,
            'found_endpoints': found_endpoints,
            'missing_endpoints': missing_endpoints,
            'authentication': 'kamioi_admin_token' in content,
            'error_handling': 'catch' in content,
            'data_processing': 'json()' in content
        }
        
    except FileNotFoundError:
        print(f"ERROR: {ml_dashboard_path} file not found")
        return None
    except Exception as e:
        print(f"ERROR: {e}")
        return None

if __name__ == "__main__":
    test_ml_dashboard_connections()
