import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Create Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, 
     origins=['http://localhost:3000', 'http://localhost:3119', 'http://localhost:3764', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:3119', 'http://127.0.0.1:3764', 'http://127.0.0.1:5000'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=True)

# Health endpoint
@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': '2025-10-09T22:50:00'})

# Import and register blueprints
try:
    from routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    print("Admin blueprint registered successfully")
except Exception as e:
    print(f"Failed to register admin blueprint: {e}")

try:
    from routes.user import user_bp
    app.register_blueprint(user_bp, url_prefix='/api/user')
    print("User blueprint registered successfully")
except Exception as e:
    print(f"Failed to register user blueprint: {e}")

try:
    from routes.family_simple import family_bp
    app.register_blueprint(family_bp, url_prefix='/api/family')
    print("Family blueprint registered successfully")
except Exception as e:
    print(f"Failed to register family blueprint: {e}")

try:
    from routes.business_simple import business_bp
    app.register_blueprint(business_bp, url_prefix='/api/business')
    print("Business blueprint registered successfully")
except Exception as e:
    print(f"Failed to register business blueprint: {e}")

# Print all registered routes
print("\nRegistered routes:")
for rule in app.url_map.iter_rules():
    print(f"  {rule.rule} -> {rule.endpoint}")

if __name__ == '__main__':
    print("Starting Kamioi Backend Server...")
    print("Health: http://localhost:5000/api/health")
    print("Admin: http://localhost:5000/api/admin/transactions")
    print("User: http://localhost:5000/api/user/transactions")
    print("LLM: http://localhost:5000/api/admin/llm-center/mappings")
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
