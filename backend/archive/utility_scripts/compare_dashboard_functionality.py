import requests
import json

def compare_dashboard_functionality():
    print("Comparing Individual, Family, and Business Dashboard Functionality...")
    print("=" * 80)
    
    # Get admin token
    try:
        login_response = requests.post(
            'http://127.0.0.1:5000/api/admin/auth/login',
            json={"email": "info@kamioi.com", "password": "admin123"},
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if login_response.status_code != 200:
            print("❌ Could not get admin token")
            return False
            
        token = login_response.json()['token']
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        print(f"[OK] Got admin token: {token}")
        
    except Exception as e:
        print(f"[FAIL] Error getting admin token: {e}")
        return False
    
    # 1. Test Individual Dashboard endpoints
    print("\n1. INDIVIDUAL DASHBOARD FUNCTIONALITY:")
    print("-" * 50)
    
    individual_endpoints = {
        '/api/user/transactions': 'Transactions',
        '/api/user/portfolio': 'Portfolio',
        '/api/user/notifications': 'Notifications',
        '/api/user/goals': 'Goals',
        '/api/user/roundups': 'Roundups',
        '/api/user/fees': 'Fees',
        '/api/user/ai-insights': 'AI Insights',
        '/api/user/ai/recommendations': 'AI Recommendations',
        '/api/user/ai/insights': 'AI Insights (alt)',
        '/api/user/export/transactions': 'Export Transactions',
        '/api/user/export/portfolio': 'Export Portfolio'
    }
    
    individual_results = {}
    for endpoint, name in individual_endpoints.items():
        try:
            response = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers, timeout=5)
            individual_results[endpoint] = response.status_code
            status = "[OK]" if response.status_code == 200 else "[FAIL]"
            print(f"   {status} {name}: {response.status_code}")
        except Exception as e:
            individual_results[endpoint] = f"Error: {e}"
            print(f"   [FAIL] {name}: Error - {e}")
    
    # 2. Test Family Dashboard endpoints
    print("\n2. FAMILY DASHBOARD FUNCTIONALITY:")
    print("-" * 50)
    
    family_endpoints = {
        '/api/family/transactions': 'Transactions',
        '/api/family/portfolio': 'Portfolio',
        '/api/family/notifications': 'Notifications',
        '/api/family/goals': 'Goals',
        '/api/family/roundups': 'Roundups',
        '/api/family/fees': 'Fees',
        '/api/family/ai-insights': 'AI Insights',
        '/api/family/members': 'Members',
        '/api/family/budget': 'Budget',
        '/api/family/expenses': 'Expenses',
        '/api/family/savings': 'Savings',
        '/api/family/export/transactions': 'Export Transactions',
        '/api/family/export/portfolio': 'Export Portfolio'
    }
    
    family_results = {}
    for endpoint, name in family_endpoints.items():
        try:
            response = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers, timeout=5)
            family_results[endpoint] = response.status_code
            status = "[OK]" if response.status_code == 200 else "[FAIL]"
            print(f"   {status} {name}: {response.status_code}")
        except Exception as e:
            family_results[endpoint] = f"Error: {e}"
            print(f"   [FAIL] {name}: Error - {e}")
    
    # 3. Test Business Dashboard endpoints
    print("\n3. BUSINESS DASHBOARD FUNCTIONALITY:")
    print("-" * 50)
    
    business_endpoints = {
        '/api/admin/business-users': 'Business Users',
        '/api/admin/employees': 'Employees',
        '/api/admin/transactions': 'Transactions',
        '/api/admin/llm-center/mappings': 'LLM Mappings',
        '/api/admin/llm-center/pending-mappings': 'Pending Mappings',
        '/api/admin/llm-center/approved-mappings': 'Approved Mappings',
        '/api/admin/llm-center/rejected-mappings': 'Rejected Mappings',
        '/api/admin/llm-center/analytics': 'LLM Analytics',
        '/api/admin/ml/analytics': 'ML Analytics',
        '/api/admin/ml/predictions': 'ML Predictions',
        '/api/admin/ai/analytics': 'AI Analytics',
        '/api/admin/system-health': 'System Health'
    }
    
    business_results = {}
    for endpoint, name in business_endpoints.items():
        try:
            response = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers, timeout=5)
            business_results[endpoint] = response.status_code
            status = "[OK]" if response.status_code == 200 else "[FAIL]"
            print(f"   {status} {name}: {response.status_code}")
        except Exception as e:
            business_results[endpoint] = f"Error: {e}"
            print(f"   [FAIL] {name}: Error - {e}")
    
    # 4. Compare functionality
    print("\n4. FUNCTIONALITY COMPARISON:")
    print("-" * 50)
    
    # Check for missing functionality
    print("Missing in Family Dashboard:")
    family_missing = []
    for endpoint in individual_endpoints:
        if endpoint.replace('/api/user/', '/api/family/') not in family_endpoints:
            family_missing.append(endpoint.replace('/api/user/', '/api/family/'))
    
    if family_missing:
        for missing in family_missing:
            print(f"   [MISSING] {missing}")
    else:
        print("   [OK] All Individual features available in Family")
    
    print("\nMissing in Business Dashboard:")
    business_missing = []
    business_equivalent = {
        '/api/user/transactions': '/api/admin/transactions',
        '/api/user/portfolio': '/api/admin/transactions',  # Business uses transactions for portfolio
        '/api/user/notifications': '/api/admin/notifications',
        '/api/user/goals': '/api/admin/business-users',  # Business goals might be different
        '/api/user/ai-insights': '/api/admin/ai/analytics',
        '/api/user/export/transactions': '/api/admin/transactions'
    }
    
    for individual_endpoint, business_equivalent_endpoint in business_equivalent.items():
        if business_equivalent_endpoint not in business_endpoints:
            business_missing.append(business_equivalent_endpoint)
    
    if business_missing:
        for missing in business_missing:
            print(f"   [MISSING] {missing}")
    else:
        print("   [OK] All Individual features have Business equivalents")
    
    # 5. Check AI Insights specifically
    print("\n5. AI INSIGHTS COMPARISON:")
    print("-" * 50)
    
    ai_endpoints = {
        'Individual': ['/api/user/ai-insights', '/api/user/ai/recommendations', '/api/user/ai/insights'],
        'Family': ['/api/family/ai-insights'],
        'Business': ['/api/admin/ai/analytics', '/api/admin/ml/analytics', '/api/admin/ml/predictions']
    }
    
    for dashboard_type, endpoints in ai_endpoints.items():
        print(f"\n{dashboard_type} AI Insights:")
        for endpoint in endpoints:
            if endpoint in individual_results:
                status = individual_results[endpoint]
            elif endpoint in family_results:
                status = family_results[endpoint]
            elif endpoint in business_results:
                status = business_results[endpoint]
            else:
                status = "Not tested"
            
            status_icon = "[OK]" if status == 200 else "[FAIL]"
            print(f"   {status_icon} {endpoint}: {status}")
    
    # 6. Summary and recommendations
    print("\n" + "=" * 80)
    print("SUMMARY AND RECOMMENDATIONS:")
    print("=" * 80)
    
    # Count working endpoints
    individual_working = sum(1 for status in individual_results.values() if status == 200)
    family_working = sum(1 for status in family_results.values() if status == 200)
    business_working = sum(1 for status in business_results.values() if status == 200)
    
    print(f"Individual Dashboard: {individual_working}/{len(individual_endpoints)} endpoints working")
    print(f"Family Dashboard: {family_working}/{len(family_endpoints)} endpoints working")
    print(f"Business Dashboard: {business_working}/{len(business_endpoints)} endpoints working")
    
    print("\nRECOMMENDATIONS:")
    if family_working < individual_working:
        print("1. [FIX] Family Dashboard needs updates to match Individual functionality")
    if business_working < individual_working:
        print("2. [FIX] Business Dashboard needs updates to match Individual functionality")
    if len(family_missing) > 0:
        print("3. [FIX] Add missing Family Dashboard endpoints")
    if len(business_missing) > 0:
        print("4. [FIX] Add missing Business Dashboard endpoints")
    
    return True

if __name__ == "__main__":
    compare_dashboard_functionality()
