#!/usr/bin/env python3
"""
Test app.py directly to see what error occurs
"""

import sys
import traceback

print("=" * 80)
print("Testing app.py import and initialization")
print("=" * 80)
print()

try:
    print("Step 1: Importing app...")
    from app import app
    print("✓ App imported successfully")
    print()
except Exception as e:
    print(f"✗ Failed to import app: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    print("Step 2: Testing app configuration...")
    print(f"  - App name: {app.name}")
    print(f"  - Debug mode: {app.debug}")
    print(f"  - Secret key set: {bool(app.config.get('SECRET_KEY'))}")
    print("✓ App configuration OK")
    print()
except Exception as e:
    print(f"✗ App configuration error: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    print("Step 3: Testing route registration...")
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append(rule.rule)
    print(f"  - Total routes: {len(routes)}")
    print(f"  - /api/test route exists: {'/api/test' in routes}")
    print(f"  - /api/health route exists: {'/api/health' in routes}")
    print("✓ Routes registered")
    print()
except Exception as e:
    print(f"✗ Route registration error: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    print("Step 4: Testing test endpoint with test client...")
    with app.test_client() as client:
        response = client.get('/api/test')
        print(f"  - Status code: {response.status_code}")
        print(f"  - Response: {response.get_data(as_text=True)[:200]}")
        if response.status_code == 200:
            print("✓ Test endpoint works!")
        else:
            print(f"✗ Test endpoint returned {response.status_code}")
    print()
except Exception as e:
    print(f"✗ Test client error: {e}")
    traceback.print_exc()
    sys.exit(1)

print("=" * 80)
print("All tests passed! App should be working.")
print("=" * 80)

