#!/usr/bin/env python3
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Configure CORS
CORS(app, origins=['http://localhost:3765'], supports_credentials=True)

@app.route('/')
def root():
    return jsonify({"message": "Server is running", "status": "ok"})

@app.route('/api/test')
def test():
    return jsonify({"message": "Test endpoint working", "status": "ok"})

@app.route('/api/admin/auth/me')
def admin_me():
    return jsonify({"message": "Admin auth endpoint", "status": "ok"})

if __name__ == '__main__':
    print("Starting test server...")
    app.run(host='127.0.0.1', port=5001, debug=True)