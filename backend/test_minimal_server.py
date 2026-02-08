from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def root():
    return jsonify({'status': 'ok', 'message': 'Test server is running'})

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Health check passed'})

@app.route('/api/test')
def test():
    return jsonify({'status': 'ok', 'message': 'Test endpoint working'})

if __name__ == '__main__':
    print("Starting minimal test server...")
    app.run(host='0.0.0.0', port=5001, debug=True)


