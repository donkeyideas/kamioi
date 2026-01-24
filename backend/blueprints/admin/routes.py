"""
Admin Dashboard Routes for Kamioi Backend

Handles admin functionality:
- Authentication (login, logout, me)
- Dashboard overview
- User management stubs
- LLM Center stubs
"""

import sys
from flask import request, jsonify, make_response
from flask_cors import cross_origin
from werkzeug.security import check_password_hash, generate_password_hash

from . import admin_bp
from database_manager import db_manager
from blueprints.auth.helpers import get_auth_user, require_role


# =============================================================================
# Authentication Routes
# =============================================================================

@admin_bp.route('/auth/login', methods=['POST', 'OPTIONS'])
def admin_login():
    """Admin login endpoint"""
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Credentials'] = 'false'
        return response

    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required'}), 400

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('''
                SELECT id, email, password, name, role
                FROM admins
                WHERE LOWER(email) = LOWER(:email) AND is_active = true
            '''), {'email': email})
            row = result.fetchone()
            db_manager.release_connection(conn)

            if row:
                row = (row[0], row[1], row[2], row[3], row[4])
        else:
            cur = conn.cursor()
            cur.execute("SELECT id, email, password, name, role FROM admins WHERE email = ? AND is_active = 1", (email,))
            row = cur.fetchone()
            conn.close()

        if row:
            stored_password = row[2]
            password_valid = False
            needs_hash_upgrade = False

            # Check if stored password is hashed
            if stored_password and (stored_password.startswith('pbkdf2:') or stored_password.startswith('scrypt:')):
                password_valid = check_password_hash(stored_password, password)
            else:
                # Legacy plaintext password
                password_valid = (stored_password == password)
                if password_valid:
                    needs_hash_upgrade = True

            if password_valid:
                # Upgrade plaintext password to hashed version
                if needs_hash_upgrade:
                    try:
                        hashed = generate_password_hash(password)
                        conn2 = db_manager.get_connection()
                        if getattr(db_manager, '_use_postgresql', False):
                            from sqlalchemy import text
                            conn2.execute(text("UPDATE admins SET password = :pwd WHERE id = :id"), {'pwd': hashed, 'id': row[0]})
                            conn2.commit()
                            db_manager.release_connection(conn2)
                        else:
                            cur2 = conn2.cursor()
                            cur2.execute("UPDATE admins SET password = ? WHERE id = ?", (hashed, row[0]))
                            conn2.commit()
                            conn2.close()
                    except Exception as hash_err:
                        print(f"Warning: Could not upgrade admin password hash: {hash_err}")

                admin = {
                    'id': row[0],
                    'email': row[1],
                    'name': row[3],
                    'role': row[4],
                    'dashboard': 'admin',
                    'permissions': '{}'
                }
                return jsonify({'success': True, 'token': f'admin_token_{row[0]}', 'user': admin})

        return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

    except Exception as e:
        import traceback
        print(f"Exception in admin_login: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': 'Admin login failed'}), 500


@admin_bp.route('/auth/logout', methods=['POST'])
def admin_logout():
    """Admin logout endpoint"""
    return jsonify({'success': True, 'message': 'Admin logged out successfully'})


@admin_bp.route('/auth/me')
def admin_auth_me():
    """Check admin authentication"""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    token = auth.split(' ', 1)[1].strip()
    if not token.startswith('admin_token_'):
        return jsonify({'success': False, 'error': 'Invalid admin token'}), 401

    try:
        admin_id = int(token.split('admin_token_', 1)[1])
    except (ValueError, IndexError):
        return jsonify({'success': False, 'error': 'Invalid admin token format'}), 401

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("SELECT id, email, name, role, permissions FROM admins WHERE id = :admin_id AND is_active = true"),
                {'admin_id': admin_id}
            )
            row = result.fetchone()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("SELECT id, email, name, role, permissions FROM admins WHERE id = ? AND is_active = 1", (admin_id,))
            row = cur.fetchone()
            conn.close()

        if not row:
            return jsonify({'success': False, 'error': 'Admin not found'}), 401

        admin = {
            'id': row[0],
            'email': row[1],
            'name': row[2],
            'role': row[3],
            'dashboard': 'admin',
            'permissions': row[4] if row[4] else '{}'
        }
        return jsonify({'success': True, 'user': admin})

    except Exception as e:
        return jsonify({'success': False, 'error': 'Failed to load admin'}), 500


# =============================================================================
# Dashboard Routes
# =============================================================================

@admin_bp.route('/dashboard/overview')
@cross_origin()
def admin_dashboard_overview():
    """Get aggregated overview dashboard data"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    import time as time_module
    start_time = time_module.time()

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text

            # Aggregated stats query
            stats_result = conn.execute(text('''
                SELECT
                    COUNT(DISTINCT t.id) as totalTransactions,
                    COALESCE(SUM(t.round_up), 0) as totalRoundUps,
                    COALESCE(SUM(CASE WHEN t.ticker IS NOT NULL THEN t.shares * COALESCE(t.stock_price, t.price_per_share, 0) ELSE 0 END), 0) as portfolioValue,
                    COUNT(DISTINCT u.id) as activeUsers,
                    COUNT(DISTINCT CASE WHEN t.ticker IS NOT NULL THEN t.id END) as mappedTransactions
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE t.user_id != 2
            '''))
            stats_row = stats_result.fetchone()

            # Recent transactions
            recent_result = conn.execute(text('''
                SELECT t.id, t.user_id, t.merchant, t.amount, t.date, t.description, t.status
                FROM transactions t
                JOIN users u ON t.user_id = u.id
                WHERE t.user_id != 2
                ORDER BY t.date DESC NULLS LAST, t.id DESC
                LIMIT 5
            '''))
            recent_transactions = [dict(row._mapping) for row in recent_result]

            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT
                    COUNT(DISTINCT t.id) as totalTransactions,
                    COALESCE(SUM(t.round_up), 0) as totalRoundUps,
                    COALESCE(SUM(CASE WHEN t.ticker IS NOT NULL THEN t.shares * COALESCE(t.stock_price, t.price_per_share, 0) ELSE 0 END), 0) as portfolioValue,
                    COUNT(DISTINCT u.id) as activeUsers,
                    COUNT(DISTINCT CASE WHEN t.ticker IS NOT NULL THEN t.id END) as mappedTransactions
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE t.user_id != 2
            ''')
            stats_row = cursor.fetchone()

            cursor.execute('''
                SELECT t.id, t.user_id, t.merchant, t.amount, t.date, t.description, t.status
                FROM transactions t
                JOIN users u ON t.user_id = u.id
                WHERE t.user_id != 2
                ORDER BY t.date DESC, t.id DESC
                LIMIT 5
            ''')
            recent_cols = [d[0] for d in cursor.description]
            recent_transactions = [dict(zip(recent_cols, row)) for row in cursor.fetchall()]
            conn.close()

        query_time = time_module.time() - start_time

        return jsonify({
            'success': True,
            'data': {
                'overview': {
                    'totalTransactions': stats_row[0] if stats_row else 0,
                    'totalRoundUps': round(float(stats_row[1] or 0), 2) if stats_row else 0,
                    'portfolioValue': round(float(stats_row[2] or 0), 2) if stats_row else 0,
                    'activeUsers': stats_row[3] if stats_row else 0,
                    'mappedTransactions': stats_row[4] if stats_row else 0
                },
                'recentActivity': recent_transactions,
                'queryTime': round(query_time * 1000, 2)
            }
        })

    except Exception as e:
        import traceback
        print(f"Error in admin_dashboard_overview: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/dashboard')
@cross_origin()
def admin_dashboard():
    """Get admin dashboard data (legacy endpoint)"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    return jsonify({
        'success': True,
        'data': {
            'message': 'Admin dashboard loaded'
        }
    })


# =============================================================================
# User Management Routes
# =============================================================================

@admin_bp.route('/users', methods=['GET'])
@cross_origin()
def admin_users():
    """Get all users for admin management"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('''
                SELECT id, email, name, account_type, created_at
                FROM users
                ORDER BY created_at DESC
                LIMIT 100
            '''))
            users = [dict(row._mapping) for row in result]
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, email, name, account_type, created_at
                FROM users
                ORDER BY created_at DESC
                LIMIT 100
            ''')
            columns = ['id', 'email', 'name', 'account_type', 'created_at']
            users = [dict(zip(columns, row)) for row in cursor.fetchall()]
            conn.close()

        return jsonify({'success': True, 'users': users})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Transactions Routes
# =============================================================================

@admin_bp.route('/transactions')
@cross_origin()
def admin_transactions():
    """Get all transactions for admin view"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('''
                SELECT t.id, t.user_id, t.merchant, t.amount, t.date, t.status, t.ticker, u.email
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                ORDER BY t.date DESC NULLS LAST, t.id DESC
                LIMIT 500
            '''))
            transactions = [dict(row._mapping) for row in result]
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT t.id, t.user_id, t.merchant, t.amount, t.date, t.status, t.ticker, u.email
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                ORDER BY t.date DESC, t.id DESC
                LIMIT 500
            ''')
            columns = ['id', 'user_id', 'merchant', 'amount', 'date', 'status', 'ticker', 'email']
            transactions = [dict(zip(columns, row)) for row in cursor.fetchall()]
            conn.close()

        return jsonify({'success': True, 'transactions': transactions})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Stub Routes (for frontend compatibility)
# =============================================================================

@admin_bp.route('/financial-analytics')
@cross_origin()
def admin_financial_analytics():
    """Get financial analytics data"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    return jsonify({'success': True, 'data': {}})


@admin_bp.route('/investment-summary')
@cross_origin()
def admin_investment_summary():
    """Get investment summary"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    return jsonify({'success': True, 'data': {}})


@admin_bp.route('/user-management')
@cross_origin()
def admin_user_management():
    """User management endpoint"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    return jsonify({'success': True, 'data': {}})


@admin_bp.route('/notifications')
@cross_origin()
def admin_notifications():
    """Get admin notifications"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    return jsonify({'success': True, 'notifications': []})


@admin_bp.route('/system-settings')
@cross_origin()
def admin_system_settings():
    """Get system settings"""
    ok, res = require_role('admin')
    if ok is False:
        return res
    return jsonify({'success': True, 'settings': {}})
