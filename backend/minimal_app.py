from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/admin/transactions')
def admin_transactions():
    return jsonify({'success': True, 'data': []})

@app.route('/api/user/transactions')
def user_transactions():
    return jsonify({'success': True, 'data': []})

@app.route('/api/admin/llm-center/mappings')
def llm_mappings():
    return jsonify({'success': True, 'data': {'mappings': []}})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
