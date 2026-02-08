#!/usr/bin/env python3

from flask import Flask, jsonify, request
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Create minimal Flask app
app = Flask(__name__)

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/admin/auth/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required'}), 400
    
    # Simple test - accept any email/password for testing
    if email and password:
        return jsonify({
            'success': True,
            'token': 'test_token_123',
            'user': {
                'id': 1,
                'email': email,
                'name': 'Test Admin',
                'role': 'superadmin'
            }
        })
    else:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

if __name__ == '__main__':
    print("Starting minimal test server...")
    print("Testing admin login endpoint...")
    app.run(host='0.0.0.0', port=5001, debug=True)