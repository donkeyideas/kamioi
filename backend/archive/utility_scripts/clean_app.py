from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

# Configure CORS
CORS(app, origins=['http://localhost:3764', 'http://127.0.0.1:3764', 'http://localhost:3765', 'http://127.0.0.1:3765'], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=True)

@app.route('/')
def root():
    return jsonify({'status': 'ok', 'message': 'Clean server running'})

@app.route('/api/admin/auth/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = data.get('email', '')
    password = data.get('password', '')
    
    print(f"DEBUG: Login attempt - Email: '{email}', Password: '{password}'")
    
    if email == 'info@kamioi.com' and password == 'admin123':
        return jsonify({'success': True, 'token': 'admin_token_123', 'user': {'id': 123, 'email': email}})
    else:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

if __name__ == '__main__':
    print("Starting clean Flask server...")
    app.run(host='0.0.0.0', port=5003, debug=True)

