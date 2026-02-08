#!/usr/bin/env python3
"""
Working Flask server with authentication fix
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
import sqlite3

# Import database manager
from database_manager import db_manager

app = Flask(__name__)

# Configure CORS
CORS(app, 
     origins=['http://localhost:3000', 'http://localhost:3119', 'http://localhost:3764', 'http://localhost:3765', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:3119', 'http://127.0.0.1:3764', 'http://127.0.0.1:3765', 'http://127.0.0.1:5000', 'https://app.kamioi.com', 'http://app.kamioi.com'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
     supports_credentials=True,
     automatic_options=True)

# Global OPTIONS handler
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type, Authorization, X-Requested-With, Accept, Origin")
        response.headers.add('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, OPTIONS")
        response.headers.add('Access-Control-Max-Age', "3600")
        return response
    return None

# Helper functions
def get_user_by_email(email: str):
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, account_type FROM users WHERE email = ?", (email,))
        row = cur.fetchone()
        conn.close()
        if row:
            return {
                'id': row[0],
                'email': row[1],
                'name': row[2],
                'role': row[3],
                'dashboard': row[3]
            }
        return None
    except Exception:
        return None

def get_auth_user():
    """Get authenticated user from token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    
    # Simple token-based auth for testing
    if token == 'token_1':
        return {
            'id': 1,
            'email': 'admin@kamioi.com',
            'name': 'Admin User',
            'role': 'admin',
            'dashboard': 'admin'
        }
    elif token == 'token_2':
        return {
            'id': 2,
            'email': 'test1@test1.com',
            'name': 'Test User',
            'role': 'user',
            'dashboard': 'user'
        }
    elif token == 'token_3':
        return {
            'id': 3,
            'email': 'family@test.com',
            'name': 'Family User',
            'role': 'family',
            'dashboard': 'family'
        }
    
    return None

def require_role(required_role: str):
    """Role check - Admins can access all roles"""
    user = get_auth_user()
    if not user:
        return False, (jsonify({'success': False, 'error': 'Unauthorized'}), 401)
    
    user_role = user.get('role')
    
    # Admins can access all roles
    if user_role == 'admin':
        return True, user
    
    # Check if user role matches required role
    if user_role != required_role:
        return False, (jsonify({'success': False, 'error': 'Forbidden'}), 403)
    
    return True, user

# Routes
@app.route('/')
def root():
    return jsonify({'status': 'ok', 'message': 'Kamioi API is running'})

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

# User endpoints
@app.route('/api/user/auth/login', methods=['POST'])
def user_login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    user = get_user_by_email(email)
    if user:
        return jsonify({'success': True, 'token': f'token_{user["id"]}', 'user': user})
    return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@app.route('/api/user/auth/me')
def user_auth_me():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    return jsonify({'success': True, 'user': user})

@app.route('/api/user/ai/insights')
def user_ai_insights():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, user_id, transaction_id, merchant_name, ticker, category, 
                   status, confidence, created_at 
            FROM llm_mappings 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        """, (user['id'],))
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': rows})
    except Exception as e:
        return jsonify({'success': False, 'data': [], 'error': str(e)}), 500

@app.route('/api/user/notifications')
def user_notifications():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    return jsonify({'success': True, 'data': []})

@app.route('/api/user/transactions')
def user_transactions():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, user_id, date, merchant, amount, category, description, 
                   total_debit, status, created_at 
            FROM transactions 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        """, (user['id'],))
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': rows})
    except Exception as e:
        return jsonify({'success': False, 'data': [], 'error': str(e)}), 500

# Admin endpoints
@app.route('/api/admin/auth/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    user = get_user_by_email(email)
    if user and user.get('role') == 'admin':
        return jsonify({'success': True, 'token': f'token_{user["id"]}', 'user': user})
    return jsonify({'success': False, 'error': 'Invalid admin credentials'}), 401

@app.route('/api/admin/auth/me')
def admin_auth_me():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    return jsonify({'success': True, 'user': user})

@app.route('/api/admin/transactions')
def admin_transactions():
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, user_id, date, merchant, amount, category, description, 
                   total_debit, status, created_at 
            FROM transactions 
            ORDER BY created_at DESC
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': rows})
    except Exception as e:
        return jsonify({'success': False, 'data': [], 'error': str(e)}), 500

@app.route('/api/admin/llm-center/queue')
def admin_llm_queue():
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, user_id, transaction_id, merchant_name, ticker, category, 
                   status, confidence, created_at 
            FROM llm_mappings 
            ORDER BY created_at DESC
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        
        # Calculate stats
        total = len(rows)
        pending = len([r for r in rows if r.get('status') == 'pending'])
        approved = len([r for r in rows if r.get('status') == 'approved'])
        rejected = len([r for r in rows if r.get('status') == 'rejected'])
        
        return jsonify({
            'success': True,
            'data': {
                'queue_status': {
                    'total_entries': total,
                    'pending': pending,
                    'approved': approved,
                    'rejected': rejected
                },
                'pending_reviews': [r for r in rows if r.get('status') == 'pending'],
                'all_entries': rows
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'data': [], 'error': str(e)}), 500

@app.route('/api/admin/llm-center/mappings')
def admin_llm_mappings():
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, user_id, transaction_id, merchant_name, ticker, category, 
                   status, confidence, created_at 
            FROM llm_mappings 
            ORDER BY created_at DESC
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': {'mappings': rows}})
    except Exception as e:
        return jsonify({'success': False, 'data': [], 'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting working Flask server...")
    print("Routes registered:", len(list(app.url_map.iter_rules())))
    for rule in app.url_map.iter_rules():
        print(f"  {rule.rule}")
    app.run(host='127.0.0.1', port=5000, debug=True)


