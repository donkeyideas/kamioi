#!/usr/bin/env python3
import re

# Check app.py for routes
with open('app.py', 'r') as f:
    content = f.read()

# Find routes
routes = re.findall(r'@(?:app|bp)\.route\([\'\"]([^\'\"]+)[\'\"]', content)

print('Routes in app.py:')
for route in sorted(set(routes))[:20]:  # Show first 20
    print(f'  {route}')
print(f'Total routes found: {len(set(routes))}')

# Check for specific missing endpoints
missing_endpoints = [
    '/api/financial/analytics',
    '/api/admin/transactions', 
    '/api/admin/llm-center/queue',
    '/api/admin/feature-flags'
]

print('\nMissing endpoints that frontend is trying to call:')
for endpoint in missing_endpoints:
    if endpoint not in routes:
        print(f'  MISSING: {endpoint}')
    else:
        print(f'  EXISTS: {endpoint}')
