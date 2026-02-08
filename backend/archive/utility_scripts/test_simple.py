from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/')
def root():
    return jsonify({'status': 'ok', 'message': 'Simple test server running'})

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
    print("Starting simple test server...")
    app.run(host='0.0.0.0', port=5001, debug=True)

