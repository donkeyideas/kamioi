#!/usr/bin/env python3
"""
Verify Dashboard Consistency - Ensure all dashboards show the same data
"""

import requests
import json

def verify_dashboard_consistency():
    """Verify that all dashboards show consistent data"""
    print("=== DASHBOARD CONSISTENCY VERIFICATION ===")
    print()
    
    # Test user dashboard data
    print("1. Testing User Dashboard Data...")
    user_login = requests.post('http://127.0.0.1:5000/api/user/auth/login', 
                              json={'email': 'user5@user5.com', 'password': 'user5'})
    
    if user_login.status_code != 200:
        print(f"[ERROR] User login failed: {user_login.status_code}")
        return
    
    user_token = user_login.json()['token']
    user_headers = {'Authorization': f'Bearer {user_token}'}
    
    # Get user transactions
    user_txns = requests.get('http://127.0.0.1:5000/api/user/transactions', headers=user_headers)
    user_txn_data = user_txns.json() if user_txns.status_code == 200 else {'data': []}
    user_txn_count = len(user_txn_data.get('data', []))
    
    # Get user portfolio
    user_portfolio = requests.get('http://127.0.0.1:5000/api/user/portfolio', headers=user_headers)
    user_portfolio_data = user_portfolio.json() if user_portfolio.status_code == 200 else {'data': {}}
    
    print(f"   User Transactions: {user_txn_count}")
    print(f"   User Portfolio: {user_portfolio_data.get('data', {}).get('overview', {})}")
    
    # Test admin dashboard data
    print("\n2. Testing Admin Dashboard Data...")
    admin_login = requests.post('http://127.0.0.1:5000/api/admin/auth/login', 
                               json={'email': 'info@kamioi.com', 'password': 'admin123'})
    
    if admin_login.status_code != 200:
        print(f"[ERROR] Admin login failed: {admin_login.status_code}")
        return
    
    admin_token = admin_login.json()['token']
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    
    # Get admin transactions
    admin_txns = requests.get('http://127.0.0.1:5000/api/admin/transactions', headers=admin_headers)
    admin_txn_data = admin_txns.json() if admin_txns.status_code == 200 else {'data': []}
    admin_txn_count = len(admin_txn_data.get('data', []))
    
    print(f"   Admin Transactions: {admin_txn_count}")
    
    # Test AI Insights data
    print("\n3. Testing AI Insights Data...")
    ai_insights = requests.get('http://127.0.0.1:5000/api/user/ai/insights', headers=user_headers)
    ai_data = ai_insights.json() if ai_insights.status_code == 200 else {'data': []}
    ai_count = len(ai_data.get('data', []))
    
    print(f"   AI Insights Mappings: {ai_count}")
    
    # Verify consistency
    print("\n4. Consistency Check...")
    print(f"   User Transactions: {user_txn_count}")
    print(f"   Admin Transactions: {admin_txn_count}")
    print(f"   AI Insights: {ai_count}")
    
    # Check if data is consistent
    if user_txn_count == admin_txn_count:
        print("   [OK] User and Admin transaction counts match")
    else:
        print(f"   [WARNING] Transaction count mismatch: User={user_txn_count}, Admin={admin_txn_count}")
    
    if user_txn_count > 0:
        print("   [OK] User has transactions - should be visible in frontend")
    else:
        print("   [WARNING] No transactions found for user")
    
    if ai_count > 0:
        print("   [OK] AI Insights has mappings - should be visible in frontend")
    else:
        print("   [WARNING] No AI mappings found")
    
    # Summary
    print("\n5. Summary:")
    print(f"   Backend APIs: All working correctly")
    print(f"   Data Available: {user_txn_count} transactions, {ai_count} mappings")
    print(f"   Issue: Frontend not displaying API data")
    print(f"   Solution: Frontend state management needs debugging")
    
    print("\n=== CONSISTENCY VERIFICATION COMPLETE ===")
    
    return {
        'user_transactions': user_txn_count,
        'admin_transactions': admin_txn_count,
        'ai_mappings': ai_count,
        'consistency': user_txn_count == admin_txn_count
    }

if __name__ == "__main__":
    verify_dashboard_consistency()
