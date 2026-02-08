#!/usr/bin/env python3
import re

# Read the app.py file
with open('app.py', 'r') as f:
    content = f.read()

# Add a global OPTIONS handler after the CORS configuration
cors_section = """# Configure CORS to allow all origins and methods
CORS(app, origins=['http://localhost:3764', 'http://127.0.0.1:3764', 'http://localhost:3765', 'http://127.0.0.1:3765', 'http://localhost:3000', 'http://127.0.0.1:3000'], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=True)"""

# Add global OPTIONS handler
options_handler = """

# Global OPTIONS handler for CORS preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        return response

from flask import make_response, request
"""

# Find the CORS section and add the OPTIONS handler after it
if cors_section in content:
    new_content = content.replace(cors_section, cors_section + options_handler)
    
    # Write the updated content
    with open('app.py', 'w') as f:
        f.write(new_content)
    
    print('SUCCESS: Added global OPTIONS handler for CORS preflight requests')
else:
    print('ERROR: Could not find CORS section to modify')
