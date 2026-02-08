"""
Server-Side Rendering (SSR) Server for Admin Dashboard
Renders React components on the server with data pre-loaded
"""

from flask import Flask, render_template_string, jsonify, request
import subprocess
import json
import os
from pathlib import Path

# Import database manager to fetch data
from database_manager import DatabaseManager

app = Flask(__name__)
db_manager = DatabaseManager()

# HTML template for SSR
SSR_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kamioi Admin Dashboard</title>
    <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        #root { min-height: 100vh; }
        .loading { display: none; }
    </style>
</head>
<body>
    <div id="root">
        {{ rendered_html | safe }}
    </div>
    <script>
        // Hydrate with React
        window.__INITIAL_DATA__ = {{ initial_data | safe }};
    </script>
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>
"""

def render_react_component(component_name, props=None):
    """
    Render a React component on the server
    This is a placeholder - full implementation would use react-dom/server
    """
    # For now, return JSON data that frontend can use
    # Full SSR would require Node.js or Python React renderer
    return json.dumps({
        'component': component_name,
        'props': props or {},
        'rendered': False  # Flag to indicate client-side rendering needed
    })

@app.route('/ssr/admin/<page_id>')
def ssr_admin_page(page_id):
    """
    Server-Side Render admin pages with data pre-loaded
    """
    try:
        # Get authentication token
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Fetch data based on page_id
        page_data = {}
        
        if page_id == 'transactions':
            # Fetch transactions data
            transactions = db_manager.get_all_transactions_for_admin(limit=100, offset=0)
            total_count = db_manager.get_transaction_count(exclude_user_id=2)
            page_data = {
                'transactions': transactions,
                'total': total_count,
                'page': 1,
                'per_page': 100
            }
        elif page_id == 'overview':
            # Fetch overview data
            users = db_manager.get_all_users()
            page_data = {
                'totalUsers': len(users),
                'activeUsers': len([u for u in users if u.get('is_active', False)])
            }
        # Add more page handlers as needed
        
        # Render component with data
        component_data = render_react_component(page_id, page_data)
        
        # For now, return JSON with data
        # Full SSR would render HTML here
        return jsonify({
            'success': True,
            'pageId': page_id,
            'data': page_data,
            'ssr': True
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ssr/health')
def ssr_health():
    """Health check for SSR server"""
    return jsonify({'status': 'ok', 'ssr': True})

if __name__ == '__main__':
    print("🚀 SSR Server starting...")
    print("Note: Full SSR requires Node.js or Python React renderer")
    print("This is a placeholder implementation")
    app.run(port=5112, debug=True)

