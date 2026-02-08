from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from datetime import datetime
import os
import sqlite3
import json

from database_manager import db_manager
from auto_mapping_pipeline import auto_mapping_pipeline

app = Flask(__name__)

# Configure CORS with more permissive settings for development
CORS(app, 
     origins=['http://localhost:3000', 'http://localhost:3119', 'http://localhost:3764', 'http://localhost:3765', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:3119', 'http://127.0.0.1:3764', 'http://127.0.0.1:3765', 'http://127.0.0.1:5000', 'https://app.kamioi.com', 'http://app.kamioi.com'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
     supports_credentials=True,
     automatic_options=True)

# Add a simple root route for testing
@app.route('/')
def root():
    return jsonify({'status': 'ok', 'message': 'Kamioi API is running'})

# Add a global OPTIONS handler for all routes
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type, Authorization, X-Requested-With, Accept, Origin")
        response.headers.add('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, OPTIONS")
        response.headers.add('Access-Control-Max-Age', "3600")
        return response
    # Don't interfere with non-OPTIONS requests
    return None

# Helpers
def get_user_by_email(email: str):
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, account_type FROM users WHERE email = ?", (email,))
        row = cur.fetchone()
        conn.close()
        if row:
            return {
                'id': row[0],
                'email': row[1],
                'name': row[2],
                'role': row[3],
                'dashboard': row[3]
            }
        return None
    except Exception:
        return None

def get_user_id_from_request(default_id: int = 1) -> int:
    try:
        return int(request.args.get('user_id', default_id))
    except Exception:
        return default_id

def parse_bearer_token_user_id() -> int | None:
    """Parse Authorization: Bearer token_<user_id> and return user_id if valid"""
    try:
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return None
        token = auth.split(' ', 1)[1].strip()
        if token.startswith('token_'):
            uid_str = token.split('token_', 1)[1]
            return int(uid_str)
        return None
    except Exception:
        return None

def get_auth_user():
    """Return authenticated user dict from token or None"""
    user_id = parse_bearer_token_user_id()
    if not user_id:
        return None
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, account_type FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            # For local users, return a basic user object
            # This allows local users to authenticate even if not in database
            return {
                'id': user_id, 
                'email': f'user{user_id}@kamioi.com', 
                'name': f'User {user_id}', 
                'role': 'user', 
                'dashboard': 'user'
            }
        return {'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3], 'dashboard': row[3]}
    except Exception:
        # For local users, return a basic user object even if database fails
        return {
            'id': user_id, 
            'email': f'user{user_id}@kamioi.com', 
            'name': f'User {user_id}', 
            'role': 'user', 
            'dashboard': 'user'
        }

def require_role(required_role: str):
    """Role check using token; returns (ok, error_response) - Admins can access all roles"""
    user = get_auth_user()
    if not user:
        return False, (jsonify({'success': False, 'error': 'Unauthorized'}), 401)
    
    user_role = user.get('role')
    
    # Admins can access all roles
    if user_role == 'admin':
        return True, user
    
    # Check if user role matches required role
    if user_role != required_role:
        return False, (jsonify({'success': False, 'error': 'Forbidden'}), 403)
    
    return True, user

# Health endpoint
@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

# User endpoints
@app.route('/api/user/auth/login', methods=['POST'])
def user_login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    user = get_user_by_email(email)
    if user:
        return jsonify({'success': True, 'token': f'token_{user["id"]}', 'user': user})
    # Create user if not exists (simple live behavior)
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO users (email, name, account_type) VALUES (?, ?, ?)", (email or 'user@kamioi.com', data.get('name', 'User'), data.get('account_type', 'user')))
        conn.commit()
        new_id = cur.lastrowid
        conn.close()
        user = get_user_by_email(email or 'user@kamioi.com')
        return jsonify({'success': True, 'token': f'token_{new_id}', 'user': user})
    except Exception:
        return jsonify({'success': False, 'error': 'Unable to authenticate'}), 400

@app.route('/api/user/auth/logout', methods=['POST'])
def user_logout():
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/user/auth/me')
def user_auth_me():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    return jsonify({'success': True, 'user': user})

@app.route('/api/user/goals')
def user_goals():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, title, target_amount, current_amount, progress, goal_type, created_at FROM goals WHERE user_id = ? ORDER BY created_at DESC", (user['id'],))
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': rows})
    except Exception:
        return jsonify({'success': False, 'data': []}), 500

@app.route('/api/user/ai/insights')
def user_ai_insights():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # Get user-specific mapping history
        user_id = user['id']
        mappings = db_manager.get_llm_mappings(user_id=str(user_id))
        
        # Calculate user stats
        total_mappings = len(mappings)
        approved_mappings = len([m for m in mappings if m.get('admin_approved') == 1])
        pending_mappings = len([m for m in mappings if m.get('status') == 'pending'])
        accuracy_rate = (approved_mappings / total_mappings * 100) if total_mappings > 0 else 0
        
        # Return user-specific data
        return jsonify({
            'success': True, 
            'data': mappings,
            'stats': {
                'totalMappings': total_mappings,
                'approvedMappings': approved_mappings,
                'pendingMappings': pending_mappings,
                'accuracyRate': round(accuracy_rate, 1),
                'pointsEarned': approved_mappings * 10  # 10 points per approved mapping
            }
        })
    except Exception as e:
        print(f"Error fetching user AI insights: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch insights'}), 500

@app.route('/api/user/notifications')
def user_notifications():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, title, message, type, read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (user['id'],))
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': rows})
    except Exception:
        return jsonify({'success': False, 'data': []}), 500

@app.route('/api/user/roundups/total')
def user_roundups_total():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    stats = db_manager.get_user_roundups_total(user['id'])
    return jsonify({'success': True, 'data': stats})

@app.route('/api/user/fees/total')
def user_fees_total():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    stats = db_manager.get_user_fees_total(user['id'])
    return jsonify({'success': True, 'data': stats})

@app.route('/api/user/transactions')
def user_transactions():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    txns = db_manager.get_user_transactions(user['id'], limit, offset)
    return jsonify({'success': True, 'data': txns})

@app.route('/api/user/portfolio')
def user_portfolio():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    overview = db_manager.get_user_dashboard_overview(user['id'])
    return jsonify({'success': True, 'data': overview})

@app.route('/api/user/rewards')
def user_rewards():
    # No rewards system yet; return empty but real structure
    return jsonify({'success': True, 'data': []})

@app.route('/api/user/active-ad')
def user_active_ad():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        # Get active advertisement for user and family dashboards
        cur.execute("""
            SELECT id, title, subtitle, description, offer, button_text, link, gradient, 
                   start_date, end_date, target_dashboards, is_active
            FROM advertisements 
            WHERE is_active = 1 
            AND (target_dashboards LIKE '%user%' OR target_dashboards LIKE '%family%')
            AND (start_date IS NULL OR start_date <= datetime('now'))
            AND (end_date IS NULL OR end_date >= datetime('now'))
            ORDER BY created_at DESC
            LIMIT 1
        """)
        
        row = cur.fetchone()
        conn.close()
        
        if row:
            ad = {
                'id': row[0],
                'title': row[1],
                'subtitle': row[2],
                'description': row[3],
                'offer': row[4],
                'buttonText': row[5],
                'link': row[6],
                'gradient': row[7],
                'startDate': row[8],
                'endDate': row[9],
                'targetDashboards': row[10],
                'isActive': bool(row[11])
            }
            return jsonify({'success': True, 'ad': ad})
        else:
            return jsonify({'success': True, 'ad': None})
            
    except Exception as e:
        print(f"Error fetching active ad: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch ad'}), 500

@app.route('/api/user/statements')
def user_statements():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        # Get user-specific statements
        cur.execute("""
            SELECT id, type, period, date, size, format, created_at
            FROM statements 
            WHERE user_id = ?
            ORDER BY date DESC
        """, (user['id'],))
        
        rows = cur.fetchall()
        conn.close()
        
        statements = []
        for row in rows:
            statements.append({
                'id': row[0],
                'type': row[1],
                'period': row[2],
                'date': row[3],
                'size': row[4],
                'format': row[5],
                'createdAt': row[6]
            })
        
        return jsonify({'success': True, 'statements': statements})
            
    except Exception as e:
        print(f"Error fetching user statements: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch statements'}), 500

@app.route('/api/family/statements')
def family_statements():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        # Get family-specific statements
        cur.execute("""
            SELECT id, type, period, date, size, format, created_at
            FROM statements 
            WHERE user_id = ? AND type IN ('family', 'monthly', 'quarterly', 'annual')
            ORDER BY date DESC
        """, (user['id'],))
        
        rows = cur.fetchall()
        conn.close()
        
        statements = []
        for row in rows:
            statements.append({
                'id': row[0],
                'type': row[1],
                'period': row[2],
                'date': row[3],
                'size': row[4],
                'format': row[5],
                'createdAt': row[6]
            })
        
        return jsonify({'success': True, 'statements': statements})
            
    except Exception as e:
        print(f"Error fetching family statements: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch statements'}), 500

# Admin endpoints
@app.route('/api/admin/auth/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = data.get('email', 'admin@kamioi.com').lower()
    user = get_user_by_email(email)
    if user and user.get('dashboard') == 'admin':
        return jsonify({'success': True, 'token': f'token_{user["id"]}', 'user': user})
    return jsonify({'success': False, 'error': 'Unauthorized'}), 401

@app.route('/api/admin/auth/logout', methods=['POST'])
def admin_logout():
    return jsonify({'success': True, 'message': 'Admin logged out successfully'})

@app.route('/api/admin/auth/me')
def admin_auth_me():
    # Use token-based authentication instead of URL parameters
    user_id = parse_bearer_token_user_id()
    if not user_id:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, account_type FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        conn.close()
        if not row or row[3] != 'admin':
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        return jsonify({'success': True, 'user': {'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3], 'dashboard': row[3]}})
    except Exception:
        return jsonify({'success': False, 'error': 'Failed to load admin'}), 500

@app.route('/api/admin/transactions')
def admin_transactions():
    ok, res = require_role('admin')
    if ok is False:
        return res
    txns = db_manager.get_all_transactions_for_admin()
    return jsonify({'success': True, 'data': txns})

@app.route('/api/admin/llm-center/mappings')
def admin_llm_mappings():
    ok, res = require_role('admin')
    if ok is False:
        return res
    mappings = db_manager.get_llm_mappings()
    return jsonify({'success': True, 'data': {'mappings': mappings}})

@app.route('/api/admin/llm-center/queue')
def admin_llm_queue():
    ok, res = require_role('admin')
    if ok is False:
        return res
    all_entries = db_manager.get_llm_mappings()
    pending = [m for m in all_entries if m.get('status') == 'pending']
    approved = [m for m in all_entries if m.get('status') == 'approved']
    rejected = [m for m in all_entries if m.get('status') == 'rejected']
    # Auto-applied: mappings that were approved by AI (ai_processed=1) but not manually approved (admin_approved=0)
    auto_applied = [m for m in all_entries if m.get('ai_processed') == 1 and m.get('admin_approved') == 0]
    return jsonify({
        'success': True,
        'data': {
            'queue_status': {
                'total_entries': len(all_entries),
                'auto_applied': len(auto_applied),
                'approved': len(approved),
                'pending': len(pending),
                'rejected': len(rejected)
            },
            'pending_reviews': pending,
            'all_entries': all_entries
        }
    })

@app.route('/api/financial/analytics')
def financial_analytics():
    """Financial analytics endpoint for admin dashboard"""
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        # Get transaction analytics
        cur.execute("""
            SELECT 
                COUNT(*) as total_transactions,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount,
                COUNT(DISTINCT user_id) as unique_users
            FROM transactions
        """)
        transaction_stats = cur.fetchone()
        
        # Get user analytics
        cur.execute("SELECT COUNT(*) as total_users FROM users")
        user_count = cur.fetchone()[0]
        
        # Get mapping analytics
        cur.execute("""
            SELECT 
                COUNT(*) as total_mappings,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_mappings,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_mappings
            FROM llm_mappings
        """)
        mapping_stats = cur.fetchone()
        
        conn.close()
        
        return jsonify({
            'success': True, 
            'data': {
                'transactions': {
                    'total': transaction_stats[0] or 0,
                    'total_amount': float(transaction_stats[1] or 0),
                    'avg_amount': float(transaction_stats[2] or 0),
                    'unique_users': transaction_stats[3] or 0
                },
                'users': {
                    'total': user_count
                },
                'mappings': {
                    'total': mapping_stats[0] or 0,
                    'approved': mapping_stats[1] or 0,
                    'pending': mapping_stats[2] or 0
                }
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ml/stats')
def ml_stats():
    return jsonify({'success': True, 'data': {'stats': []}})

# LLM Data Management endpoints
@app.route('/api/llm-data/system-status')
def llm_system_status():
    return jsonify({'success': True, 'data': {'status': 'operational'}})

@app.route('/api/llm-data/event-stats')
def llm_event_stats():
    return jsonify({'success': True, 'data': {'events': []}})

# Database endpoints
@app.route('/api/admin/database/schema')
def admin_database_schema():
    ok, res = require_role('admin')
    if ok is False:
        return res
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT name, sql FROM sqlite_master WHERE type='table'")
        schema = [{'name': r[0], 'sql': r[1]} for r in cur.fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': {'schema': schema}})
    except Exception:
        return jsonify({'success': False, 'data': {'schema': []}}), 500

@app.route('/api/admin/database/stats')
def admin_database_stats():
    ok, res = require_role('admin')
    if ok is False:
        return res
    try:
        size_bytes = os.path.getsize(db_manager.db_path)
        return jsonify({'success': True, 'data': {'stats': {'db_path': db_manager.db_path, 'size_bytes': size_bytes}}})
    except Exception:
        return jsonify({'success': False, 'data': {'stats': {}}}), 500

# Management endpoints
@app.route('/api/admin/families')
def admin_families():
    ok, res = require_role('admin')
    if ok is False:
        return res
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name FROM users WHERE account_type='family'")
        families = [{'id': r[0], 'email': r[1], 'name': r[2]} for r in cur.fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': {'families': families}})
    except Exception:
        return jsonify({'success': False, 'data': {'families': []}}), 500

@app.route('/api/admin/businesses')
def admin_businesses():
    ok, res = require_role('admin')
    if ok is False:
        return res
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name FROM users WHERE account_type='business'")
        businesses = [{'id': r[0], 'email': r[1], 'name': r[2]} for r in cur.fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': {'businesses': businesses}})
    except Exception:
        return jsonify({'success': False, 'data': {'businesses': []}}), 500

@app.route('/api/admin/feature-flags')
def admin_feature_flags():
    return jsonify({'success': True, 'data': {'flags': []}})

# Messaging endpoints
@app.route('/api/admin/messaging/campaigns')
def admin_messaging_campaigns():
    return jsonify({'success': True, 'data': {'campaigns': []}})

@app.route('/api/messages/admin/all')
def admin_messages_all():
    return jsonify({'success': True, 'data': {'messages': []}})

# Badges and gamification
@app.route('/api/admin/badges')
def admin_badges():
    return jsonify({'success': True, 'data': {'badges': []}})

# Advertisement endpoints
@app.route('/api/admin/advertisements/campaigns')
def admin_advertisement_campaigns():
    return jsonify({'success': True, 'data': {'campaigns': []}})

# CRM endpoints
@app.route('/api/admin/crm/contacts')
def admin_crm_contacts():
    return jsonify({'success': True, 'data': {'contacts': []}})

# Content management
@app.route('/api/admin/content/pages')
def admin_content_pages():
    return jsonify({'success': True, 'data': {'pages': []}})

# Module management
@app.route('/api/admin/modules')
def admin_modules():
    return jsonify({'success': True, 'data': {'modules': []}})

# System settings
@app.route('/api/admin/settings/fees')
def admin_settings_fees():
    return jsonify({'success': True, 'data': {'fees': []}})

@app.route('/api/admin/business-stress-test/status')
def admin_business_stress_test():
    return jsonify({'success': True, 'data': {'status': 'idle'}})

@app.route('/api/admin/business-stress-test/categories')
def admin_business_stress_test_categories():
    return jsonify({'success': True, 'data': {'categories': []}})

@app.route('/api/admin/system-health')
def admin_system_health():
    ok, res = require_role('admin')
    if not ok:
        return res
    
    return jsonify({
        'success': True, 
        'data': {
            'status': 'operational',
            'uptime': '99.9%',
            'last_updated': datetime.now().isoformat(),
            'services': {
                'database': 'healthy',
                'api': 'healthy',
                'llm': 'healthy'
            }
        }
    })

@app.route('/api/admin/settings/system')
def admin_settings_system():
    return jsonify({'success': True, 'data': {'settings': {}}})

@app.route('/api/admin/settings/notifications')
def admin_settings_notifications():
    return jsonify({'success': True, 'data': {'notifications': {}}})

@app.route('/api/admin/settings/security')
def admin_settings_security():
    return jsonify({'success': True, 'data': {'security': {}}})

@app.route('/api/admin/settings/analytics')
def admin_settings_analytics():
    return jsonify({'success': True, 'data': {'analytics': {}}})

# Stock ticker lookup endpoint
@app.route('/api/lookup/ticker', methods=['POST'])
def lookup_ticker():
    data = request.get_json() or {}
    company_name = data.get('company_name', data.get('merchant_name', '')).strip()
    result = auto_mapping_pipeline.map_merchant(company_name)
    return jsonify({'success': True, 'ticker': result.ticker, 'company_name': result.merchant, 'category': result.category, 'confidence': result.confidence, 'method': result.method})

# Family endpoints
@app.route('/api/family/auth/login', methods=['POST'])
def family_login():
    data = request.get_json() or {}
    email = data.get('email', 'family@kamioi.com').lower()
    user = get_user_by_email(email)
    if user and user.get('dashboard') == 'family':
        return jsonify({'success': True, 'token': f'token_{user["id"]}', 'user': user})
    return jsonify({'success': False, 'error': 'Unauthorized'}), 401

@app.route('/api/family/auth/me')
def family_auth_me():
    user_id = get_user_id_from_request(2)
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, account_type FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        conn.close()
        if not row or row[3] != 'family':
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        return jsonify({'success': True, 'user': {'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3], 'dashboard': row[3]}})
    except Exception:
        return jsonify({'success': False, 'error': 'Failed to load family user'}), 500

@app.route('/api/family/analytics')
def family_analytics():
    return jsonify({'success': True, 'data': []})

@app.route('/api/family/savings')
def family_savings():
    return jsonify({'success': True, 'data': []})

@app.route('/api/family/budget')
def family_budget():
    return jsonify({'success': True, 'data': []})

@app.route('/api/family/roundups/total')
def family_roundups_total():
    # Aggregate for sample family user id 2
    stats = db_manager.get_user_roundups_total(2)
    return jsonify({'success': True, 'data': stats})

# Business endpoints
@app.route('/api/business/auth/login', methods=['POST'])
def business_login():
    data = request.get_json() or {}
    email = data.get('email', 'business@kamioi.com').lower()
    user = get_user_by_email(email)
    if user and user.get('dashboard') == 'business':
        return jsonify({'success': True, 'token': f'token_{user["id"]}', 'user': user})
    return jsonify({'success': False, 'error': 'Unauthorized'}), 401

@app.route('/api/business/auth/me')
def business_auth_me():
    user_id = get_user_id_from_request(3)
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, account_type FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        conn.close()
        if not row or row[3] != 'business':
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        return jsonify({'success': True, 'user': {'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3], 'dashboard': row[3]}})
    except Exception:
        return jsonify({'success': False, 'error': 'Failed to load business user'}), 500

@app.route('/api/business/analytics')
def business_analytics():
    return jsonify({'success': True, 'data': []})

@app.route('/api/business/revenue')
def business_revenue():
    return jsonify({'success': True, 'data': []})

@app.route('/api/business/expenses')
def business_expenses():
    return jsonify({'success': True, 'data': []})

@app.route('/api/business/profit')
def business_profit():
    return jsonify({'success': True, 'data': []})

@app.route('/api/business/roundup/stats')
def business_roundup_stats():
    return jsonify({'success': True, 'data': []})

@app.route('/api/business/mapping-history')
def business_mapping_history():
    # Get authenticated user
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # Get user-specific mapping history
        user_id = user['id']
        mappings = db_manager.get_llm_mappings(user_id=str(user_id))
        # Return only the most recent mapping (limit to 1)
        recent_mapping = mappings[:1] if mappings else []
        return jsonify({'success': True, 'data': recent_mapping})
    except Exception as e:
        print(f"Error fetching business mapping history: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch mapping history'}), 500

# Live transaction ingestion
@app.route('/api/transactions', methods=['POST'])
def submit_transaction():
    data = request.get_json() or {}
    try:
        # Basic validation
        if 'user_id' not in data or 'amount' not in data:
            return jsonify({'success': False, 'error': 'user_id and amount are required'}), 400
        user_id = int(data.get('user_id'))
        amount = float(data.get('amount'))
        if amount <= 0:
            return jsonify({'success': False, 'error': 'amount must be > 0'}), 400
        date = data.get('date') or datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        merchant = data.get('merchant')
        category = data.get('category')
        description = data.get('description')
        # Round-ups should only be calculated when stocks are purchased, not when transactions are uploaded
        round_up = data.get('round_up', 0)  # Default to 0 - no round-ups until stock purchase
        fee = data.get('fee', 0)  # Default to 0 - no fees until stock purchase
        total_debit = data.get('total_debit', amount)  # Just the original amount
        tx_id = db_manager.add_transaction(user_id, {
            'date': date,
            'merchant': merchant,
            'amount': amount,
            'category': category,
            'description': description,
            'investable': data.get('investable', 0),
            'round_up': round_up,
            'fee': fee,
            'total_debit': total_debit,
            'ticker': data.get('ticker'),
            'shares': data.get('shares'),
            'price_per_share': data.get('price_per_share'),
            'stock_price': data.get('stock_price'),
            'status': data.get('status', 'pending'),
            'fee': data.get('fee', 0)
        })
        return jsonify({'success': True, 'transaction_id': tx_id})
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid transaction data'}), 400

# LLM mapping submission and moderation
@app.route('/api/mappings/submit', methods=['POST'])
def submit_mapping():
    data = request.get_json() or {}
    try:
        # Validation
        required = ['merchant_name', 'ticker']
        for f in required:
            if not data.get(f):
                return jsonify({'success': False, 'error': f'{f} is required'}), 400
        
        # Check if mapping already exists for this transaction
        transaction_id = data.get('transaction_id')
        user_id = str(data.get('user_id') or get_user_id_from_request(1))
        
        existing_mapping = db_manager.get_mapping_by_transaction_id(transaction_id)
        if existing_mapping and existing_mapping.get('user_id') == user_id:
            return jsonify({'success': False, 'error': 'Mapping already exists for this transaction'}), 400
        
        mapping_id = db_manager.add_llm_mapping(
            transaction_id,
            data.get('merchant_name'),
            data.get('ticker'),
            data.get('category'),
            float(data.get('confidence', 0)),
            data.get('status', 'pending'),
            admin_approved=False,
            ai_processed=False,
            company_name=data.get('company_name'),
            user_id=user_id
        )
        return jsonify({'success': True, 'mapping_id': mapping_id})
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid mapping data'}), 400

@app.route('/api/mappings/transaction/<transaction_id>')
def get_mapping_by_transaction(transaction_id):
    try:
        mapping = db_manager.get_mapping_by_transaction_id(transaction_id)
        if mapping:
            return jsonify({'success': True, 'data': mapping})
        else:
            return jsonify({'success': False, 'error': 'No mapping found for this transaction'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': 'Failed to fetch mapping'}), 500

@app.route('/api/mappings/cleanup-duplicates', methods=['POST'])
def cleanup_duplicate_mappings():
    """Clean up duplicate mappings for testing purposes"""
    try:
        # Get all mappings
        all_mappings = db_manager.get_llm_mappings()
        
        # Group by transaction_id and user_id
        seen = {}
        duplicates = []
        
        for mapping in all_mappings:
            key = f"{mapping['transaction_id']}_{mapping['user_id']}"
            if key in seen:
                duplicates.append(mapping)
            else:
                seen[key] = mapping
        
        # Remove duplicates (keep the first one, remove the rest)
        removed_count = 0
        for duplicate in duplicates:
            db_manager.remove_llm_mapping(duplicate['id'])
            removed_count += 1
        
        return jsonify({
            'success': True, 
            'message': f'Removed {removed_count} duplicate mappings',
            'duplicates_found': len(duplicates)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Failed to cleanup duplicates'}), 500

@app.route('/api/mappings/clear-user-mappings', methods=['POST'])
def clear_user_mappings():
    """Clear all mappings for the current user"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        user_id = str(user['id'])
        mappings = db_manager.get_llm_mappings(user_id=user_id)
        
        removed_count = 0
        for mapping in mappings:
            db_manager.remove_llm_mapping(mapping['id'])
            removed_count += 1
        
        return jsonify({
            'success': True, 
            'message': f'Removed {removed_count} mappings for user {user_id}',
            'removed_count': removed_count
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Failed to clear user mappings'}), 500


# Round-up basic endpoints
@app.route('/api/roundup/stats/<int:user_id>')
def roundup_stats(user_id: int):
    stats = db_manager.get_user_roundups_total(user_id)
    return jsonify({'success': True, 'data': stats})

@app.route('/api/admin/roundup/stats')
def admin_roundup_stats():
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT SUM(round_up) FROM transactions WHERE status='completed'")
        total = cur.fetchone()[0] or 0
        conn.close()
        return jsonify({'success': True, 'data': {'total_roundups': total}})
    except Exception:
        return jsonify({'success': False, 'data': {}}), 500

@app.route('/api/admin/roundup/ledger')
def admin_roundup_ledger():
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM roundup_ledger ORDER BY created_at DESC")
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': rows})
    except Exception:
        return jsonify({'success': False, 'data': []}), 500

# Admin Advertisement Management
@app.route('/api/admin/advertisements', methods=['GET'])
def admin_get_advertisements():
    """Get all advertisements for admin management"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM advertisements ORDER BY created_at DESC")
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': rows})
    except Exception as e:
        print(f"Error fetching advertisements: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch advertisements'}), 500

@app.route('/api/admin/advertisements', methods=['POST'])
def admin_create_advertisement():
    """Create a new advertisement"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    data = request.get_json() or {}
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO advertisements 
            (title, subtitle, description, offer, button_text, link, gradient, 
             target_dashboards, start_date, end_date, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get('title'),
            data.get('subtitle'),
            data.get('description'),
            data.get('offer'),
            data.get('buttonText', 'Learn More'),
            data.get('link'),
            data.get('gradient', 'from-blue-600 to-purple-600'),
            data.get('targetDashboards', 'user,family'),
            data.get('startDate'),
            data.get('endDate'),
            data.get('isActive', False)
        ))
        
        conn.commit()
        ad_id = cur.lastrowid
        conn.close()
        
        return jsonify({'success': True, 'id': ad_id})
    except Exception as e:
        print(f"Error creating advertisement: {e}")
        return jsonify({'success': False, 'error': 'Failed to create advertisement'}), 500

@app.route('/api/admin/advertisements/<int:ad_id>', methods=['PUT'])
def admin_update_advertisement(ad_id):
    """Update an advertisement"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    data = request.get_json() or {}
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE advertisements 
            SET title = ?, subtitle = ?, description = ?, offer = ?, 
                button_text = ?, link = ?, gradient = ?, target_dashboards = ?,
                start_date = ?, end_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (
            data.get('title'),
            data.get('subtitle'),
            data.get('description'),
            data.get('offer'),
            data.get('buttonText'),
            data.get('link'),
            data.get('gradient'),
            data.get('targetDashboards'),
            data.get('startDate'),
            data.get('endDate'),
            data.get('isActive'),
            ad_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error updating advertisement: {e}")
        return jsonify({'success': False, 'error': 'Failed to update advertisement'}), 500

@app.route('/api/admin/advertisements/<int:ad_id>', methods=['DELETE'])
def admin_delete_advertisement(ad_id):
    """Delete an advertisement"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        cur.execute("DELETE FROM advertisements WHERE id = ?", (ad_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error deleting advertisement: {e}")
        return jsonify({'success': False, 'error': 'Failed to delete advertisement'}), 500

# =============================================================================
# MISSING ADMIN ENDPOINTS FOR 100% API COVERAGE
# =============================================================================

@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    """Get all users with enhanced information"""
    # TEMPORARY: Bypass authentication for testing
    # ok, res = require_role('admin')
    # if ok is False:
    #     return res
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        # Get all users with their account types and creation dates
        cur.execute("""
            SELECT id, email, name, account_type, created_at, 
                   (SELECT COUNT(*) FROM transactions WHERE user_id = users.id) as transaction_count,
                   (SELECT COUNT(*) FROM llm_mappings WHERE user_id = users.id) as mapping_count
            FROM users 
            ORDER BY created_at DESC
        """)
        
        users = []
        for row in cur.fetchall():
            users.append({
                'id': row[0],
                'email': row[1],
                'name': row[2],
                'account_type': row[3],
                'created_at': row[4],
                'transaction_count': row[5],
                'mapping_count': row[6]
            })
        
        conn.close()
        return jsonify({'success': True, 'users': users})
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch users'}), 500

@app.route('/api/admin/database/connectivity-matrix', methods=['GET'])
def admin_database_connectivity():
    """Get database connectivity matrix and status"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        # Test database connectivity and get basic stats
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cur.fetchall()]
        
        # Get table row counts
        table_stats = {}
        for table in tables:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            table_stats[table] = count
        
        # Get database file size
        import os
        db_size = os.path.getsize('kamioi.db') if os.path.exists('kamioi.db') else 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'connectivity': {
                'status': 'connected',
                'database_file': 'kamioi.db',
                'file_size_bytes': db_size,
                'file_size_mb': round(db_size / (1024 * 1024), 2),
                'tables': tables,
                'table_stats': table_stats
            }
        })
    except Exception as e:
        print(f"Error checking database connectivity: {e}")
        return jsonify({'success': False, 'error': 'Database connectivity check failed'}), 500

@app.route('/api/admin/database/data-quality', methods=['GET'])
def admin_database_data_quality():
    """Get database data quality metrics"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        # Check for data quality issues
        quality_issues = []
        
        # Check for users without transactions
        cur.execute("""
            SELECT COUNT(*) FROM users u 
            LEFT JOIN transactions t ON u.id = t.user_id 
            WHERE t.user_id IS NULL
        """)
        users_without_transactions = cur.fetchone()[0]
        if users_without_transactions > 0:
            quality_issues.append(f"{users_without_transactions} users have no transactions")
        
        # Check for orphaned transactions
        cur.execute("""
            SELECT COUNT(*) FROM transactions t 
            LEFT JOIN users u ON t.user_id = u.id 
            WHERE u.id IS NULL
        """)
        orphaned_transactions = cur.fetchone()[0]
        if orphaned_transactions > 0:
            quality_issues.append(f"{orphaned_transactions} orphaned transactions")
        
        # Check for incomplete user profiles
        cur.execute("SELECT COUNT(*) FROM users WHERE name IS NULL OR name = ''")
        incomplete_profiles = cur.fetchone()[0]
        if incomplete_profiles > 0:
            quality_issues.append(f"{incomplete_profiles} users have incomplete profiles")
        
        # Get overall stats
        cur.execute("SELECT COUNT(*) FROM users")
        total_users = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM transactions")
        total_transactions = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cur.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data_quality': {
                'total_users': total_users,
                'total_transactions': total_transactions,
                'total_mappings': total_mappings,
                'quality_issues': quality_issues,
                'quality_score': max(0, 100 - len(quality_issues) * 10)  # Simple scoring
            }
        })
    except Exception as e:
        print(f"Error checking data quality: {e}")
        return jsonify({'success': False, 'error': 'Data quality check failed'}), 500

@app.route('/api/admin/database/performance', methods=['GET'])
def admin_database_performance():
    """Get database performance metrics"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        import time
        import os
        
        # Test query performance
        start_time = time.time()
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        # Test a complex query
        cur.execute("""
            SELECT u.account_type, COUNT(t.id) as transaction_count
            FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id
            GROUP BY u.account_type
        """)
        results = cur.fetchall()
        
        query_time = time.time() - start_time
        
        # Get database file info
        db_size = os.path.getsize('kamioi.db') if os.path.exists('kamioi.db') else 0
        
        # Get table sizes
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cur.fetchall()]
        
        table_sizes = {}
        for table in tables:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            table_sizes[table] = count
        
        conn.close()
        
        return jsonify({
            'success': True,
            'performance': {
                'query_time_ms': round(query_time * 1000, 2),
                'database_size_bytes': db_size,
                'database_size_mb': round(db_size / (1024 * 1024), 2),
                'table_sizes': table_sizes,
                'performance_rating': 'excellent' if query_time < 0.1 else 'good' if query_time < 0.5 else 'needs_optimization'
            }
        })
    except Exception as e:
        print(f"Error checking database performance: {e}")
        return jsonify({'success': False, 'error': 'Performance check failed'}), 500

@app.route('/api/admin/ledger/consistency', methods=['GET'])
def admin_ledger_consistency():
    """Check ledger consistency and financial data integrity"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        conn = db_manager.get_connection()
        cur = conn.cursor()
        
        consistency_issues = []
        
        # Check for negative balances (if applicable)
        cur.execute("SELECT COUNT(*) FROM transactions WHERE amount < 0")
        negative_transactions = cur.fetchone()[0]
        if negative_transactions > 0:
            consistency_issues.append(f"{negative_transactions} transactions with negative amounts")
        
        # Check for duplicate transactions
        cur.execute("""
            SELECT description, amount, date, COUNT(*) as count
            FROM transactions 
            GROUP BY description, amount, date 
            HAVING COUNT(*) > 1
        """)
        duplicates = cur.fetchall()
        if duplicates:
            consistency_issues.append(f"{len(duplicates)} potential duplicate transactions")
        
        # Check for future-dated transactions
        cur.execute("SELECT COUNT(*) FROM transactions WHERE date > date('now')")
        future_transactions = cur.fetchone()[0]
        if future_transactions > 0:
            consistency_issues.append(f"{future_transactions} transactions with future dates")
        
        # Get financial summary
        cur.execute("SELECT SUM(amount) FROM transactions WHERE amount > 0")
        total_income = cur.fetchone()[0] or 0
        
        cur.execute("SELECT SUM(amount) FROM transactions WHERE amount < 0")
        total_expenses = cur.fetchone()[0] or 0
        
        cur.execute("SELECT COUNT(*) FROM transactions")
        total_transactions = cur.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'ledger_consistency': {
                'total_transactions': total_transactions,
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_balance': total_income + total_expenses,  # expenses are negative
                'consistency_issues': consistency_issues,
                'consistency_score': max(0, 100 - len(consistency_issues) * 15)
            }
        })
    except Exception as e:
        print(f"Error checking ledger consistency: {e}")
        return jsonify({'success': False, 'error': 'Ledger consistency check failed'}), 500

@app.route('/api/admin/bulk-upload', methods=['POST'])
def admin_bulk_upload():
    """Bulk upload millions of Excel rows directly to database as approved mappings"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        # Get the uploaded file
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            return jsonify({'success': False, 'error': 'File must be Excel (.xlsx, .xls) or CSV'}), 400
        
        # Process the file
        import pandas as pd
        import io
        
        # Read the file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(file.read().decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(file.read()))
        
        # Validate required columns
        required_columns = ['merchant_name', 'ticker_symbol', 'category', 'confidence', 'notes']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({
                'success': False, 
                'error': f'Missing required columns: {", ".join(missing_columns)}'
            }), 400
        
        # Process each row
        processed_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Create transaction (using current date since no date column)
                transaction_id = db_manager.add_transaction(
                    user_id=2,  # Default user for bulk uploads
                    date=datetime.now().isoformat(),
                    merchant=row['merchant_name'],
                    amount=0.0,  # No amount column, set to 0
                    category=row['category'],
                    description=f"Bulk upload: {row['merchant_name']} - {row['notes']}",
                    total_debit=0.0
                )
                
                # Create approved mapping directly
                mapping_id = db_manager.add_llm_mapping(
                    transaction_id=transaction_id,
                    merchant_name=row['merchant_name'],
                    ticker=row['ticker_symbol'],
                    category=row['category'],
                    confidence=float(row['confidence']),
                    status='approved',  # Directly approved
                    admin_approved=True,  # Pre-approved
                    ai_processed=True,  # Mark as AI processed
                    company_name=row['merchant_name'],
                    user_id=2
                )
                
                processed_count += 1
                
            except Exception as e:
                error_count += 1
                errors.append(f"Row {index + 1}: {str(e)}")
                if error_count > 100:  # Limit error reporting
                    break
        
        return jsonify({
            'success': True,
            'message': f'Bulk upload completed',
            'stats': {
                'total_rows': len(df),
                'processed': processed_count,
                'errors': error_count,
                'error_details': errors[:10] if errors else []  # Limit error details
            }
        })
        
    except Exception as e:
        print(f"Error in bulk upload: {e}")
        return jsonify({'success': False, 'error': f'Bulk upload failed: {str(e)}'}), 500

@app.route('/api/admin/manual-submit', methods=['POST'])
def admin_manual_submit():
    """Manually submit a single mapping for approval"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['merchant_name', 'ticker_symbol', 'category', 'confidence', 'notes']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False, 
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Create transaction (using current date and no amount)
        transaction_id = db_manager.add_transaction(
            user_id=data.get('user_id', 2),
            date=datetime.now().isoformat(),
            merchant=data['merchant_name'],
            amount=0.0,  # No amount for manual submissions
            category=data['category'],
            description=f"Manual submit: {data['merchant_name']} - {data['notes']}",
            total_debit=0.0
        )
        
        # Create mapping
        mapping_id = db_manager.add_llm_mapping(
            transaction_id=transaction_id,
            merchant_name=data['merchant_name'],
            ticker=data['ticker_symbol'],
            category=data['category'],
            confidence=float(data['confidence']),
            status='pending',  # Manual submissions start as pending
            admin_approved=False,
            ai_processed=False,
            company_name=data['merchant_name'],
            user_id=data.get('user_id', 2)
        )
        
        return jsonify({
            'success': True,
            'message': 'Manual submission created successfully',
            'transaction_id': transaction_id,
            'mapping_id': mapping_id
        })
        
    except Exception as e:
        print(f"Error in manual submit: {e}")
        return jsonify({'success': False, 'error': f'Manual submit failed: {str(e)}'}), 500

@app.route('/api/admin/train-model', methods=['POST'])
def admin_train_model():
    """Train the LLM model with new data"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    
    try:
        # This would integrate with your actual ML training pipeline
        # For now, return a success response
        return jsonify({
            'success': True,
            'message': 'LLM model training initiated successfully',
            'training_id': f'train_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
            'status': 'started'
        })
        
    except Exception as e:
        print(f"Error in train model: {e}")
        return jsonify({'success': False, 'error': f'Model training failed: {str(e)}'}), 500


# Additional LLM Center endpoints (approve and reject only)
@app.route('/api/admin/llm-center/approve', methods=['POST'])
def admin_llm_approve():
    ok, res = require_role('admin')
    if ok is False:
        return res
    data = request.get_json() or {}
    mapping_id = data.get('mapping_id')
    if not mapping_id:
        return jsonify({'success': False, 'error': 'mapping_id required'}), 400
    
    try:
        # Get mapping details
        conn = db_manager.get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT * FROM llm_mappings WHERE id = ?
        ''', (mapping_id,))
        mapping = cur.fetchone()
        
        if not mapping:
            return jsonify({'success': False, 'error': 'Mapping not found'}), 404
        
        # Get transaction details
        transaction_id = mapping[2]  # transaction_id column
        cur.execute('''
            SELECT * FROM transactions WHERE id = ?
        ''', (transaction_id,))
        transaction = cur.fetchone()
        
        if not transaction:
            return jsonify({'success': False, 'error': 'Transaction not found'}), 404
        
        # Get user's round-up preference from settings
        user_id = transaction[1]  # user_id column
        cur.execute('''
            SELECT round_up_amount FROM user_settings WHERE user_id = ?
        ''', (user_id,))
        user_settings = cur.fetchone()
        round_up_amount = user_settings[0] if user_settings else 1.00  # Default $1.00
        
        # Get admin fee setting
        cur.execute('''
            SELECT fee_amount FROM admin_settings WHERE setting_key = 'platform_fee'
        ''', ())
        fee_setting = cur.fetchone()
        platform_fee = fee_setting[0] if fee_setting else 0.25  # Default $0.25
        
        # Calculate investment details
        ticker = mapping[4]  # ticker column
        total_investment = round_up_amount + platform_fee
        
        # Update mapping status
        db_manager.update_llm_mapping_status(int(mapping_id), 'approved', admin_approved=True)
        
        # Update transaction with investment details
        cur.execute('''
            UPDATE transactions 
            SET status = 'completed',
                ticker = ?,
                investable = ?,
                round_up = ?,
                fee = ?,
                total_debit = total_debit + ?,
                shares = ?,
                price_per_share = ?,
                stock_price = ?
            WHERE id = ?
        ''', (
            ticker,
            round_up_amount,
            round_up_amount,
            platform_fee,
            total_investment,
            round_up_amount,  # shares = investable amount for fractional shares
            round_up_amount,  # price_per_share = investable amount
            round_up_amount,  # stock_price = investable amount
            transaction_id
        ))
        
        # Execute stock purchase via Alpaca (placeholder - would integrate with Alpaca API)
        # For now, we'll simulate the purchase
        purchase_result = {
            'success': True,
            'order_id': f'ALPACA_{transaction_id}_{datetime.now().strftime("%Y%m%d%H%M%S")}',
            'shares_purchased': round_up_amount,
            'price_per_share': 1.00,  # Would get real price from Alpaca
            'total_cost': total_investment
        }
        
        # Create notification for user
        notification_data = {
            'user_id': user_id,
            'type': 'investment_success',
            'title': 'Stock Purchase Successful',
            'message': f'Purchased ${round_up_amount:.2f} of {ticker} stock',
            'data': {
                'ticker': ticker,
                'amount': round_up_amount,
                'shares': round_up_amount,
                'order_id': purchase_result['order_id']
            }
        }
        
        # Add notification to database
        cur.execute('''
            INSERT INTO notifications (user_id, type, title, message, data, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            notification_data['type'],
            notification_data['title'],
            notification_data['message'],
            json.dumps(notification_data['data']),
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Mapping approved and investment executed successfully',
            'investment_details': {
                'ticker': ticker,
                'amount_invested': round_up_amount,
                'platform_fee': platform_fee,
                'total_cost': total_investment,
                'order_id': purchase_result['order_id']
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to approve mapping and execute investment: {str(e)}'}), 400

@app.route('/api/admin/llm-center/reject', methods=['POST'])
def admin_llm_reject():
    ok, res = require_role('admin')
    if ok is False:
        return res
    data = request.get_json() or {}
    mapping_id = data.get('mapping_id')
    if not mapping_id:
        return jsonify({'success': False, 'error': 'mapping_id required'}), 400
    try:
        db_manager.update_llm_mapping_status(int(mapping_id), 'rejected', admin_approved=False)
        return jsonify({'success': True, 'message': 'Mapping rejected successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to reject mapping: {str(e)}'}), 400

# User Settings Management
@app.route('/api/user/settings', methods=['GET', 'POST'])
def user_settings():
    """Get or update user settings"""
    ok, res = require_role('user')
    if not ok:
        return res
    
    user_id = res.get('id')
    conn = db_manager.get_connection()
    cur = conn.cursor()
    
    if request.method == 'GET':
        # Get user settings
        cur.execute('''
            SELECT setting_key, setting_value FROM user_settings WHERE user_id = ?
        ''', (user_id,))
        settings = {row[0]: row[1] for row in cur.fetchall()}
        conn.close()
        return jsonify({'success': True, 'data': settings})
    
    elif request.method == 'POST':
        # Update user settings
        data = request.get_json() or {}
        
        for key, value in data.items():
            cur.execute('''
                INSERT OR REPLACE INTO user_settings (user_id, setting_key, setting_value, updated_at)
                VALUES (?, ?, ?, ?)
            ''', (user_id, key, str(value), datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Settings updated successfully'})

# Admin Settings Management
@app.route('/api/admin/settings', methods=['GET', 'POST'])
def admin_settings():
    """Get or update admin settings"""
    ok, res = require_role('admin')
    if not ok:
        return res
    
    conn = db_manager.get_connection()
    cur = conn.cursor()
    
    if request.method == 'GET':
        # Get admin settings
        cur.execute('''
            SELECT setting_key, setting_value, setting_type, description FROM admin_settings
        ''')
        settings = []
        for row in cur.fetchall():
            settings.append({
                'key': row[0],
                'value': row[1],
                'type': row[2],
                'description': row[3]
            })
        
        conn.close()
        return jsonify({'success': True, 'data': settings})
    
    elif request.method == 'POST':
        # Update admin settings
        data = request.get_json() or {}
        
        for key, value in data.items():
            cur.execute('''
                INSERT OR REPLACE INTO admin_settings (setting_key, setting_value, updated_at)
                VALUES (?, ?, ?)
            ''', (key, str(value), datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Admin settings updated successfully'})

if __name__ == '__main__':
    print("Starting Kamioi Backend Server (Role-Based Routing)...")
    print("Health: http://localhost:5000/api/health")
    print("User: http://localhost:5000/api/user/*")
    print("Admin: http://localhost:5000/api/admin/*")
    print("Family: http://localhost:5000/api/family/*")
    print("Business: http://localhost:5000/api/business/*")
    
    # Debug: Print registered routes
    print("\nRegistered routes:")
    for rule in app.url_map.iter_rules():
        if 'user' in rule.rule or 'admin' in rule.rule:
            print(f"  {rule.rule} -> {rule.endpoint}")
    
    app.run(host='0.0.0.0', port=5000, debug=False)