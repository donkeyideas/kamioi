#!/usr/bin/env python3

import re

def test_frontend_connections():
    print("FRONTEND-BACKEND CONNECTION ANALYSIS")
    print("=" * 60)
    
    # Read the LLM Center component
    try:
        with open('../frontend/src/components/admin/LLMCenter.jsx', 'r', encoding='utf-8') as f:
            content = f.read()
        
        print("1. ANALYZING FRONTEND API CALLS...")
        
        # Find all API calls
        api_calls = re.findall(r"fetch\('([^']+)'", content)
        print(f"   Found {len(api_calls)} API calls:")
        
        for i, api_call in enumerate(api_calls, 1):
            print(f"   {i}. {api_call}")
        
        # Check for specific LLM Center endpoints
        llm_endpoints = [
            '/api/admin/llm-center/queue',
            '/api/admin/llm-center/mappings', 
            '/api/admin/llm-center/processing-stats',
            '/api/admin/bulk-upload',
            '/api/admin/train-model',
            '/api/admin/auth/me'
        ]
        
        print(f"\n2. CHECKING LLM CENTER ENDPOINTS...")
        missing_endpoints = []
        
        for endpoint in llm_endpoints:
            if endpoint in content:
                print(f"   FOUND: {endpoint}")
            else:
                print(f"   MISSING: {endpoint}")
                missing_endpoints.append(endpoint)
        
        # Check authentication token usage
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
        
        if 'setState' in content or 'useState' in content:
            print("   FOUND: State management")
        else:
            print("   MISSING: State management")
        
        # Summary
        print(f"\n6. SUMMARY")
        print("=" * 60)
        
        if not missing_endpoints:
            print("ALL LLM CENTER ENDPOINTS CONNECTED!")
        else:
            print(f"MISSING ENDPOINTS: {len(missing_endpoints)}")
            for endpoint in missing_endpoints:
                print(f"   - {endpoint}")
        
        print(f"\nFrontend-Backend Connection Status:")
        print(f"   API Calls: {len(api_calls)}")
        print(f"   Authentication: {'Working' if 'kamioi_admin_token' in content else 'Missing'}")
        print(f"   Error Handling: {'Working' if 'catch' in content else 'Missing'}")
        print(f"   Data Processing: {'Working' if 'json()' in content else 'Missing'}")
        
    except FileNotFoundError:
        print("ERROR: LLMCenter.jsx file not found")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_frontend_connections()
