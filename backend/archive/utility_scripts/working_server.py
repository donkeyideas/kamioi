#!/usr/bin/env python3
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS

app = Flask(__name__)

# Configure CORS
CORS(app, origins=['http://localhost:3765'], supports_credentials=True)

# Global OPTIONS handler for CORS preflight
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3765")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        return response

# Basic routes
@app.route('/')
def root():
    return jsonify({"message": "Server is running", "status": "ok"})

@app.route('/api/admin/auth/login', methods=['GET', 'POST', 'OPTIONS'])
def admin_login():
    if request.method == 'OPTIONS':
        return make_response()
    return jsonify({"message": "Admin login endpoint", "status": "ok"})

@app.route('/api/admin/auth/me', methods=['GET', 'OPTIONS'])
def admin_me():
    if request.method == 'OPTIONS':
        return make_response()
    return jsonify({"message": "Admin auth me endpoint", "status": "ok"})

@app.route('/api/financial/analytics', methods=['GET', 'OPTIONS'])
def financial_analytics():
    if request.method == 'OPTIONS':
        return make_response()
    return jsonify({"message": "Financial analytics endpoint", "status": "ok"})

@app.route('/api/admin/transactions', methods=['GET', 'OPTIONS'])
def admin_transactions():
    if request.method == 'OPTIONS':
        return make_response()
    return jsonify({"message": "Admin transactions endpoint", "status": "ok"})

@app.route('/api/admin/llm-center/queue', methods=['GET', 'OPTIONS'])
def llm_queue():
    if request.method == 'OPTIONS':
        return make_response()
    return jsonify({"message": "LLM queue endpoint", "status": "ok"})

@app.route('/api/admin/feature-flags', methods=['GET', 'OPTIONS'])
def feature_flags():
    if request.method == 'OPTIONS':
        return make_response()
    return jsonify({"message": "Feature flags endpoint", "status": "ok"})

if __name__ == '__main__':
    print("Starting working server with CORS preflight support...")
    app.run(host='127.0.0.1', port=5000, debug=True)
