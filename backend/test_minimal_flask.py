#!/usr/bin/env python3
"""
Minimal Flask test to verify Flask itself works
"""

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/test')
def test():
    return jsonify({'status': 'ok', 'message': 'Flask is working'}), 200

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    print("Starting minimal Flask server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)

