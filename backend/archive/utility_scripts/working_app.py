from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from datetime import datetime
import pytz
import os
import sqlite3
import json
import time

from database_manager import db_manager

app = Flask(__name__)

# Configure CORS
CORS(app, origins=['http://localhost:3764', 'http://127.0.0.1:3764', 'http://localhost:3765', 'http://127.0.0.1:3765', 'http://localhost:3000', 'http://127.0.0.1:3000'], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=True)

@app.route('/')
def root():
    return jsonify({'status': 'ok', 'message': 'Kamioi Backend Server Running'})

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Server is healthy'})

@app.route('/api/admin/auth/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    print(f"DEBUG: Admin login attempt - Email: '{email}', Password: '{password}'")
    
    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required'}), 400
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, password, name, account_type FROM users WHERE email = ? AND account_type = 'admin'", (email,))
        row = cur.fetchone()
        conn.close()
        
        print(f"DEBUG: Database query result - Row: {row}")
        if row:
            print(f"DEBUG: Stored password: '{row[2]}', Length: {len(row[2])}")
            print(f"DEBUG: Password match: {row[2] == password}")
        
        if row and row[2] == password:  # Check password
            admin = {
                'id': row[0],
                'email': row[1], 
                'name': row[3],
                'role': row[4],
                'dashboard': 'admin',
                'permissions': '{}'
            }
            return jsonify({'success': True, 'token': f'admin_token_{row[0]}', 'user': admin})
        else:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
    except Exception as e:
        print(f"DEBUG: Exception in admin_login: {e}")
        return jsonify({'success': False, 'error': 'Admin login failed'}), 500

# Admin Users endpoint
@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, account_type, created_at FROM users")
        users = cur.fetchall()
        conn.close()
        
        user_list = []
        for user in users:
            user_list.append({
                'id': user[0],
                'email': user[1],
                'name': user[2],
                'account_type': user[3],
                'created_at': user[4]
            })
        
        return jsonify({'users': user_list, 'total': len(user_list)})
    except Exception as e:
        print(f"Error getting users: {e}")
        return jsonify({'error': 'Failed to get users'}), 500

# Admin Transactions endpoint
@app.route('/api/admin/transactions', methods=['GET'])
def admin_get_transactions():
    try:
        limit = request.args.get('limit', 1000)
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?", (int(limit),))
        transactions = cur.fetchall()
        conn.close()
        
        transaction_list = []
        for trans in transactions:
            transaction_list.append({
                'id': trans[0],
                'user_id': trans[1],
                'amount': trans[2],
                'description': trans[3],
                'category': trans[4],
                'created_at': trans[5]
            })
        
        return jsonify({'transactions': transaction_list, 'total': len(transaction_list)})
    except Exception as e:
        print(f"Error getting transactions: {e}")
        return jsonify({'error': 'Failed to get transactions'}), 500

# Admin Journal Entries endpoint
@app.route('/api/admin/journal-entries', methods=['GET'])
def admin_get_journal_entries():
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM journal_entries ORDER BY created_at DESC")
        entries = cur.fetchall()
        conn.close()
        
        entry_list = []
        for entry in entries:
            entry_list.append({
                'id': entry[0],
                'user_id': entry[1],
                'title': entry[2],
                'content': entry[3],
                'created_at': entry[4]
            })
        
        return jsonify({'journal_entries': entry_list, 'total': len(entry_list)})
    except Exception as e:
        print(f"Error getting journal entries: {e}")
        return jsonify({'error': 'Failed to get journal entries'}), 500

# Admin LLM Center Mappings endpoint
@app.route('/api/admin/llm-center/mappings', methods=['GET'])
def admin_get_llm_mappings():
    try:
        limit = request.args.get('limit', 1000)
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM llm_mappings ORDER BY created_at DESC LIMIT ?", (int(limit),))
        mappings = cur.fetchall()
        conn.close()
        
        mapping_list = []
        for mapping in mappings:
            mapping_list.append({
                'id': mapping[0],
                'user_id': mapping[1],
                'input_text': mapping[2],
                'output_text': mapping[3],
                'created_at': mapping[4]
            })
        
        return jsonify({'mappings': mapping_list, 'total': len(mapping_list)})
    except Exception as e:
        print(f"Error getting LLM mappings: {e}")
        return jsonify({'error': 'Failed to get LLM mappings'}), 500

if __name__ == '__main__':
    print("Starting Kamioi Backend Server...")
    print("Health: http://localhost:5001/api/health")
    print("Admin Login: http://localhost:5001/api/admin/auth/login")
    app.run(host='0.0.0.0', port=5001, debug=True)