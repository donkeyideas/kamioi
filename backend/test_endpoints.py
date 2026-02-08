#!/usr/bin/env python3
"""
Test all the endpoints that were failing in the frontend
"""
import requests
import time

def test_endpoints():
    # Wait a moment for the server to fully start
    time.sleep(2)
    
    # Test the endpoints that were failing
    endpoints = [
        '/',
        '/api/admin/users',
        '/api/financial/cash-flow',
        '/api/financial/balance-sheet',
        '/api/financial/user-analytics',
        '/api/admin/llm-center/mappings',
        '/api/ml/stats',
        '/api/llm-data/system-status',
        '/api/llm-data/event-stats',
        '/api/admin/database/schema',
        '/api/admin/database/stats',
        '/api/admin/user-metrics',
        '/api/admin/employees',
        '/api/admin/messaging/campaigns',
        '/api/messages/admin/all',
        '/api/admin/badges',
        '/api/admin/advertisements/campaigns',
        '/api/admin/crm/contacts',
        '/api/admin/content/pages',
        '/api/admin/modules',
        '/api/admin/business-stress-test/status',
        '/api/admin/settings/fees',
        '/api/admin/settings/system',
        '/api/admin/settings/notifications',
        '/api/admin/settings/security',
        '/api/admin/settings/analytics'
    ]
    
    print('Testing all endpoints that were failing:')
    success_count = 0
    total_count = len(endpoints)
    
    for endpoint in endpoints:
        url = f'http://127.0.0.1:5000{endpoint}'
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f'[OK] {endpoint}: {response.status_code}')
                success_count += 1
            else:
                print(f'[FAIL] {endpoint}: {response.status_code}')
        except Exception as e:
            print(f'[ERROR] {endpoint}: Error - {e}')
    
    print(f'\nResults: {success_count}/{total_count} endpoints working ({success_count/total_count*100:.1f}%)')
    
    if success_count == total_count:
        print('ALL ENDPOINTS ARE WORKING!')
    elif success_count > total_count * 0.8:
        print('Most endpoints are working!')
    else:
        print('Some endpoints still need fixing')

if __name__ == '__main__':
    test_endpoints()
