from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/')
def root():
    return jsonify({'status': 'ok'})

@app.route('/api/admin/auth/login', methods=['POST'])
def admin_login():
    return jsonify({'success': True, 'message': 'Login endpoint working'})

if __name__ == '__main__':
    print("Starting minimal test...")
    app.run(host='0.0.0.0', port=5002, debug=True)