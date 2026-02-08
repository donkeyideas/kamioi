import re

def check_existing_endpoints():
    """Check what family endpoints already exist in app_clean.py"""
    
    print("Checking existing family endpoints...")
    print("=" * 50)
    
    # Read the current app_clean.py
    with open('app_clean.py', 'r') as f:
        content = f.read()
    
    # Look for existing family endpoints
    family_endpoints = [
        '/api/family/auth/login',
        '/api/family/auth/me',
        '/api/family/transactions',
        '/api/family/portfolio',
        '/api/family/notifications',
        '/api/family/goals',
        '/api/family/roundups',
        '/api/family/fees',
        '/api/family/ai-insights',
        '/api/family/ai/recommendations',
        '/api/family/ai/insights',
        '/api/family/members',
        '/api/family/budget',
        '/api/family/expenses',
        '/api/family/savings',
        '/api/family/export/transactions',
        '/api/family/export/portfolio'
    ]
    
    existing_endpoints = []
    missing_endpoints = []
    
    for endpoint in family_endpoints:
        if f"@app.route('{endpoint}'" in content:
            existing_endpoints.append(endpoint)
            print(f"[EXISTS] {endpoint}")
        else:
            missing_endpoints.append(endpoint)
            print(f"[MISSING] {endpoint}")
    
    print(f"\nSummary:")
    print(f"Existing endpoints: {len(existing_endpoints)}")
    print(f"Missing endpoints: {len(missing_endpoints)}")
    
    if missing_endpoints:
        print(f"\nMissing endpoints that need to be added:")
        for endpoint in missing_endpoints:
            print(f"  - {endpoint}")
    
    return missing_endpoints

if __name__ == "__main__":
    check_existing_endpoints()
