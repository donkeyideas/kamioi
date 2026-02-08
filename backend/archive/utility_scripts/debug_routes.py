#!/usr/bin/env python3
"""
Debug route registration
"""

import sys
sys.path.append('.')

try:
    from app import app
    print("=== REGISTERED ROUTES ===")
    for rule in app.url_map.iter_rules():
        if 'admin' in rule.rule or 'user' in rule.rule:
            print(f"  {rule.rule} -> {rule.endpoint}")
    
    print(f"\nTotal routes: {len(list(app.url_map.iter_rules()))}")
    
    # Test if we can import the admin_login function
    from app import admin_login
    print(f"admin_login function: {admin_login}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()