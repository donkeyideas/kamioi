#!/usr/bin/env python3
"""
Minimal Kamioi Server - Testing New Routes
This is a minimal server to test if the new routes work at all.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS

# Create Flask app
app = Flask(__name__)
CORS(app, origins=['http://localhost:3764', 'http://127.0.0.1:3764'])

# Basic health check
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok', 
        'message': 'Minimal server is running',
        'version': 'minimal-1.0'
    })

# Test the new routes - NO authentication for now
@app.route('/api/admin/settings', methods=['GET', 'POST'])
def admin_settings():
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'message': 'Admin settings endpoint working',
            'data': {
                'platform_fee': '0.25',
                'confidence_threshold': '0.90',
                'auto_approval_enabled': 'true'
            }
        })
    elif request.method == 'POST':
        return jsonify({
            'success': True,
            'message': 'Admin settings updated successfully'
        })

@app.route('/api/user/settings', methods=['GET', 'POST'])
def user_settings():
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'message': 'User settings endpoint working',
            'data': {
                'round_up_amount': '1.00',
                'notifications_enabled': 'true'
            }
        })
    elif request.method == 'POST':
        return jsonify({
            'success': True,
            'message': 'User settings updated successfully'
        })

@app.route('/api/admin/llm-center/approve', methods=['POST'])
def admin_llm_approve():
    data = request.get_json() or {}
    mapping_id = data.get('mapping_id')
    
    return jsonify({
        'success': True,
        'message': 'LLM approval endpoint working',
        'mapping_id': mapping_id,
        'investment_details': {
            'ticker': 'SBUX',
            'amount_invested': 1.00,
            'platform_fee': 0.25,
            'total_cost': 1.25,
            'order_id': 'ALPACA_TEST_123'
        }
    })

@app.route('/api/admin/llm-center/reject', methods=['POST'])
def admin_llm_reject():
    data = request.get_json() or {}
    mapping_id = data.get('mapping_id')
    
    return jsonify({
        'success': True,
        'message': 'LLM rejection endpoint working',
        'mapping_id': mapping_id
    })

@app.route('/api/admin/llm-center/queue')
def admin_llm_queue():
    return jsonify({
        'success': True,
        'message': 'LLM queue endpoint working',
        'data': {
            'pending_mappings': [],
            'approved_mappings': [],
            'kpis': {
                'total_mappings': 0,
                'daily_processed': 0,
                'accuracy_rate': 0,
                'auto_approval_rate': 0
            }
        }
    })

@app.route('/api/admin/llm-center/mappings')
def admin_llm_mappings():
    return jsonify({
        'success': True,
        'message': 'LLM mappings endpoint working',
        'data': []
    })

if __name__ == '__main__':
    print("🚀 Starting MINIMAL Kamioi Server...")
    print("📊 Health: http://localhost:5000/api/health")
    print("🔧 Admin Settings: http://localhost:5000/api/admin/settings")
    print("👤 User Settings: http://localhost:5000/api/user/settings")
    print("⚡ LLM Approve: http://localhost:5000/api/admin/llm-center/approve")
    print("🔄 LLM Queue: http://localhost:5000/api/admin/llm-center/queue")
    print("📋 LLM Mappings: http://localhost:5000/api/admin/llm-center/mappings")
    
    app.run(host='0.0.0.0', port=5002, debug=False)
