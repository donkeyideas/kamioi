import re

with open('app.py', 'r') as f:
    content = f.read()
    
# Find all @app.route patterns
routes = re.findall(r'@app\.route\([\'\"]([^\'\"]+)[\'\"]', content)
print('Current routes in app.py:')
for route in sorted(set(routes)):
    print(f'  {route}')

print(f'\nTotal routes found: {len(set(routes))}')