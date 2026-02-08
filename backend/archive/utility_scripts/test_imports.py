#!/usr/bin/env python3
"""
Test script to check blueprint imports
"""

print("Testing blueprint imports...")

# Test admin blueprint
try:
    from routes.admin import admin_bp
    print(f"SUCCESS: Admin blueprint imported - {admin_bp is not None}")
    if admin_bp:
        print(f"  Admin blueprint name: {admin_bp.name}")
        print(f"  Admin blueprint routes: {len(list(admin_bp.deferred_functions))}")
except Exception as e:
    print(f"ERROR: Admin blueprint import failed: {e}")
    import traceback
    traceback.print_exc()

# Test user blueprint
try:
    from routes.user import user_bp
    print(f"SUCCESS: User blueprint imported - {user_bp is not None}")
    if user_bp:
        print(f"  User blueprint name: {user_bp.name}")
        print(f"  User blueprint routes: {len(list(user_bp.deferred_functions))}")
except Exception as e:
    print(f"ERROR: User blueprint import failed: {e}")
    import traceback
    traceback.print_exc()

# Test family blueprint
try:
    from routes import family_bp
    print(f"SUCCESS: Family blueprint imported - {family_bp is not None}")
    if family_bp:
        print(f"  Family blueprint name: {family_bp.name}")
        print(f"  Family blueprint routes: {len(list(family_bp.deferred_functions))}")
except Exception as e:
    print(f"ERROR: Family blueprint import failed: {e}")
    import traceback
    traceback.print_exc()

# Test business blueprint
try:
    from routes import business_bp
    print(f"SUCCESS: Business blueprint imported - {business_bp is not None}")
    if business_bp:
        print(f"  Business blueprint name: {business_bp.name}")
        print(f"  Business blueprint routes: {len(list(business_bp.deferred_functions))}")
except Exception as e:
    print(f"ERROR: Business blueprint import failed: {e}")
    import traceback
    traceback.print_exc()

print("\nImport test completed.")
