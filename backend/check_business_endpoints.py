import re

def check_business_endpoints():
    """Check what business endpoints exist in app_clean.py"""
    
    print("Checking existing business endpoints...")
    print("=" * 50)
    
    # Read the current app_clean.py
    with open('app_clean.py', 'r') as f:
        content = f.read()
    
    # Look for business notifications endpoint
    if "/api/admin/notifications" in content:
        print("[EXISTS] /api/admin/notifications")
    else:
        print("[MISSING] /api/admin/notifications")
    
    # Check for other business endpoints
    business_endpoints = [
        '/api/admin/users',
        '/api/admin/transactions',
        '/api/admin/llm-center/mappings',
        '/api/admin/llm-center/pending-mappings',
        '/api/admin/llm-center/approved-mappings',
        '/api/admin/llm-center/rejected-mappings',
        '/api/admin/llm-center/analytics',
        '/api/admin/ml/analytics',
        '/api/admin/ml/predictions',
        '/api/admin/ai/analytics',
        '/api/admin/system-health'
    ]
    
    existing_count = 0
    for endpoint in business_endpoints:
        if f"@app.route('{endpoint}'" in content:
            existing_count += 1
    
    print(f"\nBusiness endpoints status:")
    print(f"Total business endpoints: {len(business_endpoints)}")
    print(f"Existing endpoints: {existing_count}")
    
    return "/api/admin/notifications" in content

if __name__ == "__main__":
    check_business_endpoints()
