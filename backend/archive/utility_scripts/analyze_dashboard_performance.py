import sqlite3
import os
import requests
import json

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def analyze_dashboard_performance():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Analyzing dashboard performance for Individual, Family, and Business...")
    print("=" * 70)
    
    # 1. Check user distribution by role
    print("1. USER DISTRIBUTION BY ROLE:")
    print("-" * 40)
    
    cursor.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
    user_roles = cursor.fetchall()
    
    for role, count in user_roles:
        print(f"   {role.capitalize()}: {count} users")
    
    # 2. Check dashboard-specific data
    print("\n2. DASHBOARD-SPECIFIC DATA ANALYSIS:")
    print("-" * 40)
    
    # Individual dashboard data
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id IN (SELECT id FROM users WHERE role = 'individual')")
    individual_transactions = cursor.fetchone()[0]
    print(f"   Individual transactions: {individual_transactions}")
    
    # Family dashboard data
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id IN (SELECT id FROM users WHERE role = 'family')")
    family_transactions = cursor.fetchone()[0]
    print(f"   Family transactions: {family_transactions}")
    
    # Business dashboard data
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id IN (SELECT id FROM users WHERE role = 'business')")
    business_transactions = cursor.fetchone()[0]
    print(f"   Business transactions: {business_transactions}")
    
    # 3. Check dashboard-specific endpoints
    print("\n3. DASHBOARD ENDPOINT ANALYSIS:")
    print("-" * 40)
    
    # Test dashboard endpoints
    try:
        # Get admin token
        login_response = requests.post(
            'http://127.0.0.1:5000/api/admin/auth/login',
            json={"email": "info@kamioi.com", "password": "admin123"},
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if login_response.status_code == 200:
            token = login_response.json()['token']
            headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
            
            # Test individual dashboard endpoints
            print("   Testing Individual Dashboard endpoints...")
            individual_endpoints = [
                '/api/user/transactions',
                '/api/user/portfolio', 
                '/api/user/notifications',
                '/api/user/goals'
            ]
            
            for endpoint in individual_endpoints:
                try:
                    response = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers, timeout=5)
                    print(f"     {endpoint}: {response.status_code}")
                except Exception as e:
                    print(f"     {endpoint}: Error - {e}")
            
            # Test family dashboard endpoints
            print("\n   Testing Family Dashboard endpoints...")
            family_endpoints = [
                '/api/family/transactions',
                '/api/family/portfolio',
                '/api/family/members',
                '/api/family/budget'
            ]
            
            for endpoint in family_endpoints:
                try:
                    response = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers, timeout=5)
                    print(f"     {endpoint}: {response.status_code}")
                except Exception as e:
                    print(f"     {endpoint}: Error - {e}")
            
            # Test business dashboard endpoints
            print("\n   Testing Business Dashboard endpoints...")
            business_endpoints = [
                '/api/admin/business-users',
                '/api/admin/employees',
                '/api/admin/transactions'
            ]
            
            for endpoint in business_endpoints:
                try:
                    response = requests.get(f'http://127.0.0.1:5000{endpoint}', headers=headers, timeout=5)
                    print(f"     {endpoint}: {response.status_code}")
                except Exception as e:
                    print(f"     {endpoint}: Error - {e}")
        
    except Exception as e:
        print(f"   Error testing endpoints: {e}")
    
    # 4. Check dashboard-specific performance issues
    print("\n4. DASHBOARD PERFORMANCE ANALYSIS:")
    print("-" * 40)
    
    # Check for dashboard-specific tables
    dashboard_tables = [
        'family_members',
        'business_employees', 
        'family_budgets',
        'business_analytics',
        'dashboard_settings'
    ]
    
    for table in dashboard_tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   {table}: {count} records")
        except:
            print(f"   {table}: Table not found")
    
    # 5. Check dashboard-specific indexes
    print("\n5. DASHBOARD-SPECIFIC INDEXES:")
    print("-" * 40)
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
    indexes = cursor.fetchall()
    dashboard_indexes = [idx[0] for idx in indexes if any(term in idx[0].lower() for term in ['family', 'business', 'dashboard', 'member', 'employee'])]
    
    if dashboard_indexes:
        print("   Dashboard-specific indexes found:")
        for idx in dashboard_indexes:
            print(f"     - {idx}")
    else:
        print("   No dashboard-specific indexes found")
    
    # 6. Performance recommendations
    print("\n6. DASHBOARD PERFORMANCE RECOMMENDATIONS:")
    print("-" * 40)
    
    recommendations = []
    
    if individual_transactions > 1000:
        recommendations.append("Individual dashboard: Consider pagination for large transaction lists")
    
    if family_transactions > 1000:
        recommendations.append("Family dashboard: Implement family-specific caching")
    
    if business_transactions > 1000:
        recommendations.append("Business dashboard: Add business analytics optimization")
    
    if not dashboard_indexes:
        recommendations.append("Add dashboard-specific indexes for better performance")
    
    if recommendations:
        for i, rec in enumerate(recommendations, 1):
            print(f"   {i}. {rec}")
    else:
        print("   No specific performance issues identified")
    
    # 7. Dashboard optimization opportunities
    print("\n7. DASHBOARD OPTIMIZATION OPPORTUNITIES:")
    print("-" * 40)
    
    print("   Individual Dashboard:")
    print("     - Personal transaction history")
    print("     - Individual goals and notifications")
    print("     - Personal portfolio tracking")
    
    print("\n   Family Dashboard:")
    print("     - Family member management")
    print("     - Shared family budgets")
    print("     - Family transaction aggregation")
    print("     - Family goal tracking")
    
    print("\n   Business Dashboard:")
    print("     - Employee management")
    print("     - Business analytics")
    print("     - Business transaction tracking")
    print("     - Business performance metrics")
    
    conn.close()
    return True

if __name__ == "__main__":
    analyze_dashboard_performance()
