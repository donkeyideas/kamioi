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


@admin_bp.route('/auth/google', methods=['POST', 'OPTIONS'])
@cross_origin()
def admin_google_auth():
    """Admin Google OAuth endpoint - verifies Google token and checks admin authorization"""
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200

    data = request.get_json() or {}
    id_token = data.get('idToken', '')
    email = data.get('email', '').strip().lower()
    display_name = data.get('displayName', '')

    if not email:
        return jsonify({'success': False, 'error': 'Email is required'}), 400

    try:
        # Check if user exists in admins table with this email
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('''
                SELECT id, email, name, role, permissions
                FROM admins
                WHERE LOWER(email) = LOWER(:email) AND is_active = true
            '''), {'email': email})
            row = result.fetchone()
            db_manager.release_connection(conn)

            if row:
                row = (row[0], row[1], row[2], row[3], row[4])
        else:
            cur = conn.cursor()
            cur.execute("SELECT id, email, name, role, permissions FROM admins WHERE email = ? AND is_active = 1", (email,))
            row = cur.fetchone()
            conn.close()

        if row:
            # Admin found - return token
            admin = {
                'id': row[0],
                'email': row[1],
                'name': row[2] or display_name,
                'role': row[3],
                'dashboard': 'admin',
                'permissions': row[4] if row[4] else '{}'
            }
            return jsonify({
                'success': True,
                'token': f'admin_token_{row[0]}',
                'user': admin,
                'admin_id': row[0]
            })
        else:
            # Email not found in admins table
            return jsonify({
                'success': False,
                'error': f'Email {email} is not authorized as an admin. Contact support to request admin access.'
            }), 403

    except Exception as e:
        import traceback
        print(f"Exception in admin_google_auth: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': 'Google authentication failed'}), 500


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
    from datetime import datetime, timedelta
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

            # Get total user count
            user_count_result = conn.execute(text('SELECT COUNT(*) FROM users'))
            total_users = user_count_result.scalar() or 0

            # User growth by month (last 6 months)
            user_growth_result = conn.execute(text('''
                SELECT
                    TO_CHAR(created_at, 'Mon') as month,
                    COUNT(*) as count
                FROM users
                WHERE created_at >= NOW() - INTERVAL '6 months'
                GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at)
            '''))
            user_growth_rows = user_growth_result.fetchall()

            # Recent activity (users + transactions)
            recent_result = conn.execute(text('''
                (SELECT
                    'user' as type,
                    u.id,
                    CONCAT('New user registered: ', u.email) as description,
                    TO_CHAR(u.created_at, 'Mon DD, YYYY HH24:MI') as timestamp,
                    u.created_at as sort_date
                FROM users u
                ORDER BY u.created_at DESC
                LIMIT 3)
                UNION ALL
                (SELECT
                    'transaction' as type,
                    t.id,
                    CONCAT('Transaction: $', ROUND(CAST(t.amount AS numeric), 2), ' at ', t.merchant) as description,
                    TO_CHAR(t.date, 'Mon DD, YYYY HH24:MI') as timestamp,
                    t.date as sort_date
                FROM transactions t
                WHERE t.user_id != 2
                ORDER BY t.date DESC NULLS LAST
                LIMIT 3)
                ORDER BY sort_date DESC NULLS LAST
                LIMIT 5
            '''))
            recent_activity = [{'id': row[1], 'type': row[0], 'description': row[2], 'timestamp': row[3]} for row in recent_result]

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

            # Get total user count
            cursor.execute('SELECT COUNT(*) FROM users')
            total_users = cursor.fetchone()[0] or 0

            # User growth (simplified for SQLite)
            cursor.execute('''
                SELECT strftime('%m', created_at) as month, COUNT(*) as count
                FROM users
                WHERE created_at >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', created_at)
                ORDER BY created_at
            ''')
            user_growth_rows = cursor.fetchall()

            # Recent activity
            cursor.execute('''
                SELECT 'user' as type, id, 'New user registered: ' || email as description,
                       datetime(created_at) as timestamp
                FROM users
                ORDER BY created_at DESC
                LIMIT 5
            ''')
            recent_activity = [{'id': row[1], 'type': row[0], 'description': row[2], 'timestamp': row[3]} for row in cursor.fetchall()]
            conn.close()

        # Format user growth data for frontend chart
        # If no data, generate empty months
        if user_growth_rows and len(user_growth_rows) > 0:
            user_growth = [{'name': row[0], 'value': row[1]} for row in user_growth_rows]
        else:
            # Generate last 6 months with total users spread
            now = datetime.now()
            user_growth = []
            for i in range(5, -1, -1):
                month_date = now - timedelta(days=30*i)
                month_name = month_date.strftime('%b')
                # Distribute users across months (simple approximation)
                user_growth.append({'name': month_name, 'value': total_users if i == 0 else 0})

        query_time = time_module.time() - start_time

        return jsonify({
            'success': True,
            'data': {
                'stats': {
                    'totalTransactions': stats_row[0] if stats_row else 0,
                    'totalRevenue': round(float(stats_row[1] or 0) * 0.25, 2) if stats_row else 0,  # 25% fee
                    'totalRoundUps': round(float(stats_row[1] or 0), 2) if stats_row else 0,
                    'portfolioValue': round(float(stats_row[2] or 0), 2) if stats_row else 0
                },
                'userGrowth': user_growth,
                'recentActivity': recent_activity,
                'systemStatus': {
                    'active_users': total_users,
                    'server_load': 'low',
                    'status': 'operational',
                    'uptime': '100%',
                    'mapped_transactions': stats_row[4] if stats_row else 0
                },
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
    """Get all users for admin management with pagination"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        offset = (page - 1) * per_page
        search = request.args.get('search', '').strip()

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text

            # Get total count
            if search:
                count_result = conn.execute(
                    text("SELECT COUNT(*) FROM users WHERE email ILIKE :search OR name ILIKE :search"),
                    {'search': f'%{search}%'}
                )
            else:
                count_result = conn.execute(text("SELECT COUNT(*) FROM users"))
            total = count_result.scalar() or 0

            # Get paginated users - use COALESCE for account_type to handle NULL values
            if search:
                result = conn.execute(text('''
                    SELECT id, email, name, COALESCE(account_type, 'individual') as account_type, created_at
                    FROM users
                    WHERE email ILIKE :search OR name ILIKE :search
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :offset
                '''), {'search': f'%{search}%', 'limit': per_page, 'offset': offset})
            else:
                result = conn.execute(text('''
                    SELECT id, email, name, COALESCE(account_type, 'individual') as account_type, created_at
                    FROM users
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :offset
                '''), {'limit': per_page, 'offset': offset})
            users = [dict(row._mapping) for row in result]
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()

            # Get total count
            if search:
                cursor.execute(
                    "SELECT COUNT(*) FROM users WHERE email LIKE ? OR name LIKE ?",
                    (f'%{search}%', f'%{search}%')
                )
            else:
                cursor.execute("SELECT COUNT(*) FROM users")
            total = cursor.fetchone()[0] or 0

            # Get paginated users
            if search:
                cursor.execute('''
                    SELECT id, email, name, account_type, created_at
                    FROM users
                    WHERE email LIKE ? OR name LIKE ?
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                ''', (f'%{search}%', f'%{search}%', per_page, offset))
            else:
                cursor.execute('''
                    SELECT id, email, name, account_type, created_at
                    FROM users
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                ''', (per_page, offset))
            columns = ['id', 'email', 'name', 'account_type', 'created_at']
            users = [dict(zip(columns, row)) for row in cursor.fetchall()]
            conn.close()

        total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
        return jsonify({
            'success': True,
            'users': users,
            'meta': {
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Transactions Routes
# =============================================================================

@admin_bp.route('/transactions')
@cross_origin()
def admin_transactions():
    """Get all transactions for admin view with pagination"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        offset = (page - 1) * per_page
        status_filter = request.args.get('status', '')
        search = request.args.get('search', '').strip()

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text

            # Build WHERE clause
            where_clauses = []
            params = {'limit': per_page, 'offset': offset}

            if status_filter:
                where_clauses.append("t.status = :status")
                params['status'] = status_filter

            if search:
                where_clauses.append("(t.merchant ILIKE :search OR u.email ILIKE :search)")
                params['search'] = f'%{search}%'

            where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

            # Get total count
            count_result = conn.execute(
                text(f"SELECT COUNT(*) FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE {where_sql}"),
                params
            )
            total = count_result.scalar() or 0

            # Get paginated transactions
            result = conn.execute(text(f'''
                SELECT t.id, t.user_id, t.merchant, t.amount, t.date, t.status, t.ticker, u.email
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE {where_sql}
                ORDER BY t.date DESC NULLS LAST, t.id DESC
                LIMIT :limit OFFSET :offset
            '''), params)
            transactions = [dict(row._mapping) for row in result]
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()

            # Build WHERE clause for SQLite
            where_clauses = []
            params = []

            if status_filter:
                where_clauses.append("t.status = ?")
                params.append(status_filter)

            if search:
                where_clauses.append("(t.merchant LIKE ? OR u.email LIKE ?)")
                params.extend([f'%{search}%', f'%{search}%'])

            where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

            # Get total count
            cursor.execute(
                f"SELECT COUNT(*) FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE {where_sql}",
                params
            )
            total = cursor.fetchone()[0] or 0

            # Get paginated transactions
            cursor.execute(f'''
                SELECT t.id, t.user_id, t.merchant, t.amount, t.date, t.status, t.ticker, u.email
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE {where_sql}
                ORDER BY t.date DESC, t.id DESC
                LIMIT ? OFFSET ?
            ''', params + [per_page, offset])
            columns = ['id', 'user_id', 'merchant', 'amount', 'date', 'status', 'ticker', 'email']
            transactions = [dict(zip(columns, row)) for row in cursor.fetchall()]
            conn.close()

        total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
        return jsonify({
            'success': True,
            'transactions': transactions,
            'meta': {
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        })

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


# =============================================================================
# Error Tracking Routes
# =============================================================================

@admin_bp.route('/errors', methods=['GET'])
@cross_origin()
def admin_get_errors():
    """Get paginated list of system errors"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    try:
        from services.error_tracking_service import get_errors

        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        error_type = request.args.get('error_type')
        severity = request.args.get('severity')
        is_resolved = request.args.get('is_resolved')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Convert is_resolved to boolean if provided
        if is_resolved is not None:
            is_resolved = is_resolved.lower() in ('true', '1', 'yes')

        result = get_errors(
            page=page,
            per_page=per_page,
            error_type=error_type,
            severity=severity,
            is_resolved=is_resolved,
            start_date=start_date,
            end_date=end_date
        )

        return jsonify({
            'success': True,
            'data': result['errors'],
            'meta': {
                'total': result['total'],
                'page': result['page'],
                'per_page': result['per_page'],
                'total_pages': result['total_pages'],
                'has_next': result['page'] < result['total_pages'],
                'has_prev': result['page'] > 1
            }
        })
    except Exception as e:
        import traceback
        print(f"Error getting system errors: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/errors/stats', methods=['GET'])
@cross_origin()
def admin_get_error_stats():
    """Get error statistics for dashboard"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    try:
        from services.error_tracking_service import get_error_stats
        stats = get_error_stats()
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/errors/<int:error_id>/resolve', methods=['POST'])
@cross_origin()
def admin_resolve_error(error_id):
    """Mark an error as resolved"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    try:
        from services.error_tracking_service import resolve_error

        data = request.get_json() or {}
        resolution_notes = data.get('resolution_notes', '')

        # Get admin ID from token
        auth = request.headers.get('Authorization', '')
        admin_id = 1
        if auth.startswith('Bearer admin_token_'):
            try:
                admin_id = int(auth.split('admin_token_')[1])
            except:
                pass

        success = resolve_error(error_id, admin_id, resolution_notes)

        if success:
            return jsonify({'success': True, 'message': 'Error marked as resolved'})
        else:
            return jsonify({'success': False, 'error': 'Failed to resolve error'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Demo User Management Routes
# =============================================================================

@admin_bp.route('/demo-users/create', methods=['POST'])
@cross_origin()
def admin_create_demo_users():
    """Create demo users for testing and demonstrations"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    try:
        from datetime import datetime

        DEMO_PASSWORD = "Demo123!"
        DEMO_ACCOUNTS = [
            {
                "email": "demo_user@kamioi.com",
                "name": "Demo User",
                "account_type": "individual",
            },
            {
                "email": "demo_family@kamioi.com",
                "name": "Demo Family Admin",
                "account_type": "family",
            },
            {
                "email": "demo_business@kamioi.com",
                "name": "Demo Business",
                "account_type": "business",
            }
        ]

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)
        created_users = []

        if use_postgresql:
            from sqlalchemy import text

            for account in DEMO_ACCOUNTS:
                # Check if user already exists
                result = conn.execute(text(
                    'SELECT id FROM users WHERE LOWER(email) = LOWER(:email)'
                ), {'email': account['email']})
                existing = result.fetchone()

                if existing:
                    created_users.append({
                        'email': account['email'],
                        'status': 'already_exists',
                        'id': existing[0]
                    })
                    continue

                # Create the user
                password_hash = generate_password_hash(DEMO_PASSWORD)
                result = conn.execute(text('''
                    INSERT INTO users (email, password, name, account_type, created_at)
                    VALUES (:email, :password, :name, :account_type, :created_at)
                    RETURNING id
                '''), {
                    'email': account['email'],
                    'password': password_hash,
                    'name': account['name'],
                    'account_type': account['account_type'],
                    'created_at': datetime.utcnow()
                })
                new_id = result.fetchone()[0]
                conn.commit()

                created_users.append({
                    'email': account['email'],
                    'status': 'created',
                    'id': new_id,
                    'account_type': account['account_type']
                })

            db_manager.release_connection(conn)
        else:
            # SQLite fallback
            cur = conn.cursor()

            for account in DEMO_ACCOUNTS:
                cur.execute('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', (account['email'],))
                existing = cur.fetchone()

                if existing:
                    created_users.append({
                        'email': account['email'],
                        'status': 'already_exists',
                        'id': existing[0]
                    })
                    continue

                password_hash = generate_password_hash(DEMO_PASSWORD)
                cur.execute('''
                    INSERT INTO users (email, password, name, account_type, created_at)
                    VALUES (?, ?, ?, ?, ?)
                ''', (account['email'], password_hash, account['name'], account['account_type'], datetime.utcnow().isoformat()))
                conn.commit()

                created_users.append({
                    'email': account['email'],
                    'status': 'created',
                    'id': cur.lastrowid,
                    'account_type': account['account_type']
                })

            conn.close()

        return jsonify({
            'success': True,
            'message': 'Demo users processed',
            'users': created_users,
            'password': DEMO_PASSWORD
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/demo-users', methods=['GET'])
@cross_origin()
def admin_get_demo_users():
    """Get list of demo users"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        demo_emails = ['demo_user@kamioi.com', 'demo_family@kamioi.com', 'demo_business@kamioi.com']

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(text('''
                SELECT id, email, name, account_type, created_at
                FROM users
                WHERE LOWER(email) = ANY(:emails)
            '''), {'emails': [e.lower() for e in demo_emails]})
            rows = result.fetchall()
            db_manager.release_connection(conn)

            users = [{
                'id': row[0],
                'email': row[1],
                'name': row[2],
                'account_type': row[3],
                'created_at': str(row[4]) if row[4] else None
            } for row in rows]
        else:
            cur = conn.cursor()
            placeholders = ','.join(['?' for _ in demo_emails])
            cur.execute(f'''
                SELECT id, email, name, account_type, created_at
                FROM users
                WHERE LOWER(email) IN ({placeholders})
            ''', [e.lower() for e in demo_emails])
            rows = cur.fetchall()
            conn.close()

            users = [{
                'id': row[0],
                'email': row[1],
                'name': row[2],
                'account_type': row[3],
                'created_at': row[4]
            } for row in rows]

        return jsonify({
            'success': True,
            'users': users,
            'password': 'Demo123!'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/errors/test', methods=['POST'])
@cross_origin()
def admin_test_error():
    """Create a test error to verify error tracking is working"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    try:
        from services.error_tracking_service import log_error

        data = request.get_json() or {}
        severity = data.get('severity', 'info')
        message = data.get('message', 'Test error from admin panel')

        error_id = log_error(
            error_type='TestError',
            error_message=message,
            endpoint='/api/admin/errors/test',
            http_method='POST',
            severity=severity
        )

        if error_id:
            return jsonify({
                'success': True,
                'message': 'Test error logged successfully',
                'error_id': error_id
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to log test error - check if system_errors table exists'
            }), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/db-status', methods=['GET'])
@cross_origin()
def admin_db_status():
    """Check database status and table existence"""
    ok, res = require_role('admin')
    if ok is False:
        return res

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)
        status = {
            'database_type': 'postgresql' if use_postgresql else 'sqlite',
            'tables': {},
            'users_count': 0,
            'users_columns': []
        }

        if use_postgresql:
            from sqlalchemy import text

            # Check if users table exists
            result = conn.execute(text('''
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'users'
            '''))
            users_table = result.fetchone()
            status['tables']['users'] = users_table is not None

            if users_table:
                # Get column names
                result = conn.execute(text('''
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name = 'users' ORDER BY ordinal_position
                '''))
                status['users_columns'] = [row[0] for row in result.fetchall()]

                # Get user count
                result = conn.execute(text('SELECT COUNT(*) FROM users'))
                status['users_count'] = result.scalar()

            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
            users_table = cur.fetchone()
            status['tables']['users'] = users_table is not None

            if users_table:
                cur.execute("PRAGMA table_info(users)")
                status['users_columns'] = [row[1] for row in cur.fetchall()]
                cur.execute('SELECT COUNT(*) FROM users')
                status['users_count'] = cur.fetchone()[0]

            conn.close()

        return jsonify({'success': True, 'status': status})

    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500
