#!/usr/bin/env python3
"""
Test script to check admin blueprint import
"""

try:
    from routes.admin import admin_bp
    print("SUCCESS: Admin blueprint imported successfully")
    print(f"Blueprint name: {admin_bp.name}")
    print(f"Blueprint URL prefix: {admin_bp.url_prefix}")
    print(f"Number of routes: {len(list(admin_bp.deferred_functions))}")
    
    # List all routes
    for rule in admin_bp.deferred_functions:
        print(f"Route: {rule}")
        
except Exception as e:
    print(f"ERROR: Error importing admin blueprint: {e}")
    import traceback
    traceback.print_exc()
