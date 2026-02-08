import sqlite3
import os
import json
from datetime import datetime

def add_business_notifications_endpoint():
    """Add missing business notifications endpoint to app_clean.py"""
    
    print("Adding Business Notifications Endpoint...")
    print("=" * 50)
    
    # Read the current app_clean.py
    with open('app_clean.py', 'r') as f:
        content = f.read()
    
    # Business notifications endpoint to add
    business_notifications_endpoint = '''
# =============================================================================
# BUSINESS NOTIFICATIONS ENDPOINT
# =============================================================================

@app.route('/api/admin/notifications', methods=['GET'])
def admin_notifications():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Invalid admin token'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get admin notifications
        cursor.execute("""
            SELECT id, title, message, type, created_at, read
            FROM notifications 
            WHERE user_id IS NULL OR user_id = 0
            ORDER BY created_at DESC
        """)
        notifications = cursor.fetchall()
        conn.close()
        
        notification_list = []
        for notif in notifications:
            notification_list.append({
                'id': notif['id'],
                'title': notif['title'],
                'message': notif['message'],
                'type': notif['type'],
                'created_at': notif['created_at'],
                'read': notif['read']
            })
        
        return jsonify({
            'success': True,
            'data': notification_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

'''
    
    # Find the insertion point (before the main block)
    insertion_point = content.find('if __name__ == "__main__":')
    
    if insertion_point == -1:
        print("Error: Could not find insertion point in app_clean.py")
        return False
    
    # Insert the business notifications endpoint
    new_content = content[:insertion_point] + business_notifications_endpoint + '\n' + content[insertion_point:]
    
    # Write the updated content
    with open('app_clean.py', 'w') as f:
        f.write(new_content)
    
    print("[OK] Business notifications endpoint added successfully!")
    print("Added endpoint:")
    print("  - /api/admin/notifications")
    
    return True

if __name__ == "__main__":
    add_business_notifications_endpoint()
