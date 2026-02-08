#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app import app
    print("[OK] App imported successfully")
    
    # Check if admin routes are registered
    print("\n[CHECK] Checking registered routes:")
    admin_routes = []
    for rule in app.url_map.iter_rules():
        if 'admin' in rule.rule:
            admin_routes.append(rule.rule)
            print(f"  [OK] {rule.rule} -> {rule.endpoint}")
    
    if not admin_routes:
        print("[FAIL] NO ADMIN ROUTES FOUND!")
    else:
        print(f"\n[STATS] Found {len(admin_routes)} admin routes")
        
    # Test specific admin login route
    print("\n[CHECK] Testing admin login route specifically:")
    for rule in app.url_map.iter_rules():
        if rule.rule == '/api/admin/auth/login':
            print(f"  [OK] Found admin login route: {rule.rule}")
            print(f"     Methods: {rule.methods}")
            print(f"     Endpoint: {rule.endpoint}")
            break
    else:
        print("  [FAIL] Admin login route NOT FOUND!")
        
except Exception as e:
    print(f"[ERROR] Error importing app: {e}")
    import traceback
    traceback.print_exc()