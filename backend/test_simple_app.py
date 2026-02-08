#!/usr/bin/env python3
"""
Test Simple Flask App
"""

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/admin/auth/login', methods=['POST'])
def admin_login():
    return jsonify({'success': True, 'token': 'test_token'})

@app.route('/api/debug/routes')
def debug_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'path': rule.rule
        })
    return jsonify({'routes': routes, 'total': len(routes)})

if __name__ == '__main__':
    print("Starting Simple Test Server...")
    print("Health: http://localhost:5000/api/health")
    print("Admin Login: http://localhost:5000/api/admin/auth/login")
    print("Debug Routes: http://localhost:5000/api/debug/routes")
    
    # Print registered routes
    print("\nRegistered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.rule} -> {rule.endpoint}")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
