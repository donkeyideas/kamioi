#!/usr/bin/env python3
"""
Test script to check route access
"""

from flask import Flask
from routes.admin import admin_bp

app = Flask(__name__)
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Test the route registration
with app.app_context():
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        if 'admin' in rule.rule:
            print(f"  {rule.rule} -> {rule.endpoint}")

# Test a specific route
print("\nTesting /api/admin/health route:")
try:
    with app.test_client() as client:
        response = client.get('/api/admin/health')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.get_json()}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
