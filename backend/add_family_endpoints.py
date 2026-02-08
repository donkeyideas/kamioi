import sqlite3
import os
import json
from datetime import datetime

def add_family_endpoints_to_backend():
    """Add missing family endpoints to app_clean.py"""
    
    print("Adding Family Dashboard Endpoints to Backend...")
    print("=" * 60)
    
    # Read the current app_clean.py
    with open('app_clean.py', 'r') as f:
        content = f.read()
    
    # Family endpoints to add
    family_endpoints = '''
# =============================================================================
# FAMILY DASHBOARD ENDPOINTS
# =============================================================================

# Family authentication
@app.route('/api/family/auth/login', methods=['POST'])
def family_login():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check users table for family role
        cursor.execute("SELECT id, email, name, role, password FROM users WHERE email = ? AND role = 'family'", (email,))
        user = cursor.fetchone()
        
        if user:
            # Family user found
            if user['password'] == password:  # Simple password check for now
                token = f"family_token_{user['id']}"
                conn.close()
                
                return jsonify({
                    'success': True,
                    'token': token,
                    'user': {
                        'id': user['id'],
                        'email': user['email'],
                        'name': user['name'],
                        'role': user['role']
                    }
                })
        
        conn.close()
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/auth/me')
def family_auth_me():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if not token.startswith('family_token_'):
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        user_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, name, role FROM users WHERE id = ? AND role = 'family'", (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name'],
                    'role': user['role']
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Family user not found'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Family dashboard endpoints
@app.route('/api/family/transactions', methods=['GET'])
def family_transactions():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        # Handle both family_token_ and user_token_ prefixes
        if token.startswith('family_token_'):
            family_id = token.replace('family_token_', '')
        elif token.startswith('user_token_'):
            family_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, amount, status, created_at, description, merchant, category, date, round_up, fee, total_debit
            FROM transactions 
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (family_id,))
        transactions = cursor.fetchall()
        conn.close()
        
        transaction_list = []
        for txn in transactions:
            transaction_list.append({
                'id': txn['id'],
                'amount': txn['amount'],
                'status': txn['status'],
                'created_at': txn['created_at'],
                'description': txn['description'],
                'merchant': txn['merchant'],
                'category': txn['category'],
                'date': txn['date'],
                'round_up': txn['round_up'],
                'fee': txn['fee'],
                'total_debit': txn['total_debit']
            })
        
        return jsonify({
            'success': True,
            'data': transaction_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/portfolio', methods=['GET'])
def family_portfolio():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get family portfolio summary
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ? AND status = 'mapped'", (family_id,))
        total_investments = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(round_up) FROM transactions WHERE user_id = ? AND status = 'mapped'", (family_id,))
        total_roundups = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT SUM(fee) FROM transactions WHERE user_id = ?", (family_id,))
        total_fees = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'portfolio': {
                'total_investments': total_investments,
                'total_roundups': round(total_roundups, 2),
                'total_fees': round(total_fees, 2),
                'current_value': round(total_roundups - total_fees, 2),
                'family_size': 4,  # Sample family size
                'members': 4,     # Sample member count
                'children': 2     # Sample children count
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/notifications', methods=['GET'])
def family_notifications():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        # Handle both family_token_ and user_token_ prefixes
        if token.startswith('family_token_'):
            family_id = token.replace('family_token_', '')
        elif token.startswith('user_token_'):
            family_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, message, type, created_at, read
            FROM notifications 
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (family_id,))
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

@app.route('/api/family/goals', methods=['GET'])
def family_goals():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, description, target_amount, current_amount, target_date, status, created_at
            FROM goals 
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (family_id,))
        goals = cursor.fetchall()
        conn.close()
        
        goal_list = []
        for goal in goals:
            goal_list.append({
                'id': goal['id'],
                'title': goal['title'],
                'description': goal['description'],
                'target_amount': goal['target_amount'],
                'current_amount': goal['current_amount'],
                'target_date': goal['target_date'],
                'status': goal['status'],
                'created_at': goal['created_at']
            })
        
        return jsonify({
            'success': True,
            'data': goal_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/roundups', methods=['GET'])
def family_roundups():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, amount, description, date, status, created_at
            FROM roundups 
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (family_id,))
        roundups = cursor.fetchall()
        conn.close()
        
        roundup_list = []
        for roundup in roundups:
            roundup_list.append({
                'id': roundup['id'],
                'amount': roundup['amount'],
                'description': roundup['description'],
                'date': roundup['date'],
                'status': roundup['status'],
                'created_at': roundup['created_at']
            })
        
        return jsonify({
            'success': True,
            'data': roundup_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/fees', methods=['GET'])
def family_fees():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, amount, description, date, status, created_at
            FROM fees 
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (family_id,))
        fees = cursor.fetchall()
        conn.close()
        
        fee_list = []
        for fee in fees:
            fee_list.append({
                'id': fee['id'],
                'amount': fee['amount'],
                'description': fee['description'],
                'date': fee['date'],
                'status': fee['status'],
                'created_at': fee['created_at']
            })
        
        return jsonify({
            'success': True,
            'data': fee_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Family AI Insights endpoints
@app.route('/api/family/ai-insights', methods=['GET'])
def family_ai_insights():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        # Get family AI insights
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get family spending patterns
        cursor.execute("""
            SELECT category, SUM(amount) as total_spent, COUNT(*) as transaction_count
            FROM transactions 
            WHERE user_id = ? AND status = 'mapped'
            GROUP BY category
            ORDER BY total_spent DESC
        """, (family_id,))
        spending_patterns = cursor.fetchall()
        
        # Get family investment performance
        cursor.execute("""
            SELECT SUM(round_up) as total_invested, COUNT(*) as investment_count
            FROM transactions 
            WHERE user_id = ? AND status = 'mapped'
        """, (family_id,))
        investment_data = cursor.fetchone()
        
        conn.close()
        
        # Format spending patterns
        patterns = []
        for pattern in spending_patterns:
            patterns.append({
                'category': pattern[0],
                'total_spent': pattern[1],
                'transaction_count': pattern[2]
            })
        
        return jsonify({
            'success': True,
            'insights': {
                'spending_patterns': patterns,
                'total_invested': investment_data[0] or 0,
                'investment_count': investment_data[1] or 0,
                'family_size': 4,
                'recommendations': [
                    'Consider setting up automatic roundups for family expenses',
                    'Review spending patterns monthly with family members',
                    'Set up family financial goals together'
                ],
                'generated_at': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/ai/recommendations', methods=['GET'])
def family_ai_recommendations():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        # Get family AI recommendations
        recommendations = [
            {
                'id': 1,
                'title': 'Family Budget Optimization',
                'description': 'Based on your spending patterns, consider allocating more budget to education and less to entertainment.',
                'priority': 'high',
                'category': 'budget',
                'action_required': True
            },
            {
                'id': 2,
                'title': 'Investment Diversification',
                'description': 'Your family portfolio could benefit from more diversified investments across different sectors.',
                'priority': 'medium',
                'category': 'investment',
                'action_required': False
            },
            {
                'id': 3,
                'title': 'Family Financial Goals',
                'description': 'Set up a family emergency fund with 3-6 months of expenses.',
                'priority': 'high',
                'category': 'goals',
                'action_required': True
            }
        ]
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/ai/insights', methods=['GET'])
def family_ai_insights_alt():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        # Get family AI insights (alternative endpoint)
        insights = {
            'family_financial_health': 'good',
            'spending_trends': 'stable',
            'investment_growth': 'positive',
            'budget_adherence': 'excellent',
            'family_goals_progress': 'on_track',
            'recommendations_count': 3,
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'insights': insights
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Family members management
@app.route('/api/family/members', methods=['GET'])
def family_members():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, role, permissions, status, created_at
            FROM family_members 
            WHERE family_id = ?
            ORDER BY created_at DESC
        """, (family_id,))
        members = cursor.fetchall()
        conn.close()
        
        member_list = []
        for member in members:
            member_list.append({
                'id': member['id'],
                'user_id': member['user_id'],
                'role': member['role'],
                'permissions': member['permissions'],
                'status': member['status'],
                'created_at': member['created_at']
            })
        
        return jsonify({
            'success': True,
            'data': member_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Family budget management
@app.route('/api/family/budget', methods=['GET'])
def family_budget():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, category, budget_amount, spent_amount, month_year, created_at
            FROM family_budgets 
            WHERE family_id = ?
            ORDER BY created_at DESC
        """, (family_id,))
        budgets = cursor.fetchall()
        conn.close()
        
        budget_list = []
        for budget in budgets:
            budget_list.append({
                'id': budget['id'],
                'category': budget['category'],
                'budget_amount': budget['budget_amount'],
                'spent_amount': budget['spent_amount'],
                'month_year': budget['month_year'],
                'created_at': budget['created_at']
            })
        
        return jsonify({
            'success': True,
            'data': budget_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Family expenses tracking
@app.route('/api/family/expenses', methods=['GET'])
def family_expenses():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, amount, description, category, date, created_at
            FROM transactions 
            WHERE user_id = ? AND amount < 0
            ORDER BY created_at DESC
        """, (family_id,))
        expenses = cursor.fetchall()
        conn.close()
        
        expense_list = []
        for expense in expenses:
            expense_list.append({
                'id': expense['id'],
                'amount': abs(expense['amount']),  # Make positive for expenses
                'description': expense['description'],
                'category': expense['category'],
                'date': expense['date'],
                'created_at': expense['created_at']
            })
        
        return jsonify({
            'success': True,
            'data': expense_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Family savings tracking
@app.route('/api/family/savings', methods=['GET'])
def family_savings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT SUM(round_up) as total_savings, COUNT(*) as savings_count
            FROM transactions 
            WHERE user_id = ? AND status = 'mapped'
        """, (family_id,))
        savings_data = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'savings': {
                'total_savings': savings_data[0] or 0,
                'savings_count': savings_data[1] or 0,
                'monthly_goal': 500.00,
                'progress_percentage': min(100, (savings_data[0] or 0) / 500.00 * 100)
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Family export endpoints
@app.route('/api/family/export/transactions', methods=['GET'])
def family_export_transactions():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample export data
        return jsonify({
            'success': True,
            'export_data': {
                'format': 'csv',
                'download_url': '/api/family/export/transactions/download',
                'expires_at': '2025-10-17T00:00:00Z'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/export/portfolio', methods=['GET'])
def family_export_portfolio():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample export data
        return jsonify({
            'success': True,
            'export_data': {
                'format': 'csv',
                'download_url': '/api/family/export/portfolio/download',
                'expires_at': '2025-10-17T00:00:00Z'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

'''
    
    # Find the insertion point (before the main block)
    insertion_point = content.find('if __name__ == "__main__":')
    
    if insertion_point == -1:
        print("Error: Could not find insertion point in app_clean.py")
        return False
    
    # Insert the family endpoints
    new_content = content[:insertion_point] + family_endpoints + '\n' + content[insertion_point:]
    
    # Write the updated content
    with open('app_clean.py', 'w') as f:
        f.write(new_content)
    
    print("[OK] Family endpoints added successfully!")
    print("Added endpoints:")
    print("  - /api/family/auth/login")
    print("  - /api/family/auth/me")
    print("  - /api/family/transactions")
    print("  - /api/family/portfolio")
    print("  - /api/family/notifications")
    print("  - /api/family/goals")
    print("  - /api/family/roundups")
    print("  - /api/family/fees")
    print("  - /api/family/ai-insights")
    print("  - /api/family/ai/recommendations")
    print("  - /api/family/ai/insights")
    print("  - /api/family/members")
    print("  - /api/family/budget")
    print("  - /api/family/expenses")
    print("  - /api/family/savings")
    print("  - /api/family/export/transactions")
    print("  - /api/family/export/portfolio")
    
    return True

if __name__ == "__main__":
    add_family_endpoints_to_backend()
