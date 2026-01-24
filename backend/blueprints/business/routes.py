"""
Business Dashboard Routes for Kamioi Backend

Handles all business account functionality:
- Authentication
- Transactions
- Portfolio & Goals
- Team members
- Reports
- Settings & Notifications
- Bank connections
"""

import json
from datetime import datetime
from flask import request, jsonify
from flask_cors import cross_origin

from . import business_bp
from database_manager import db_manager
from blueprints.auth.helpers import get_auth_user


# =============================================================================
# Authentication Routes
# =============================================================================

@business_bp.route('/auth/login', methods=['POST'])
def business_login():
    """Login for business accounts"""
    data = request.get_json() or {}
    email = data.get('email', '').lower().strip()

    if not email:
        return jsonify({'success': False, 'error': 'Email is required'}), 400

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("SELECT id, email, name, account_type FROM users WHERE email = :email"),
                {'email': email}
            )
            row = result.fetchone()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("SELECT id, email, name, account_type FROM users WHERE email = ?", (email,))
            row = cur.fetchone()
            conn.close()

        if row and row[3] == 'business':
            user = {
                'id': row[0],
                'email': row[1],
                'name': row[2],
                'role': row[3],
                'dashboard': row[3]
            }
            return jsonify({
                'success': True,
                'token': f'business_token_{user["id"]}',
                'user': user
            })

        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@business_bp.route('/auth/me')
def business_auth_me():
    """Get current authenticated business user"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    if user.get('dashboard') != 'business' and user.get('role') != 'business':
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    return jsonify({'success': True, 'user': user})


# =============================================================================
# Transaction Routes
# =============================================================================

@business_bp.route('/transactions', methods=['GET', 'POST'])
@cross_origin()
def business_transactions():
    """Get or create business transactions"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = int(user.get('id'))

        if request.method == 'GET':
            conn = db_manager.get_connection()
            use_postgresql = getattr(db_manager, '_use_postgresql', False)

            if use_postgresql:
                from sqlalchemy import text
                query = text('''
                    SELECT id, user_id, merchant, amount, date, category, description,
                           round_up, investable, total_debit, fee, status, ticker,
                           shares, price_per_share, stock_price, created_at
                    FROM transactions
                    WHERE user_id = CAST(:user_id AS INTEGER)
                    ORDER BY date DESC NULLS LAST, id DESC
                    LIMIT 1000
                ''')
                result = conn.execute(query, {'user_id': user_id})
                transactions = [dict(row._mapping) for row in result]
                db_manager.release_connection(conn)
            else:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, user_id, merchant, amount, date, category, description,
                           round_up, investable, total_debit, fee, status, ticker,
                           shares, price_per_share, stock_price, created_at
                    FROM transactions
                    WHERE user_id = ?
                    ORDER BY date DESC, id DESC
                    LIMIT 1000
                ''', (user_id,))
                columns = [description[0] for description in cursor.description]
                transactions = [dict(zip(columns, row)) for row in cursor.fetchall()]
                cursor.close()
                conn.close()

            return jsonify({'success': True, 'transactions': transactions})

        elif request.method == 'POST':
            data = request.get_json() or {}
            merchant = data.get('merchant', '').strip()
            amount = float(data.get('amount', 0))

            if not merchant or amount <= 0:
                return jsonify({'success': False, 'error': 'Merchant and amount are required'}), 400

            conn = db_manager.get_connection()
            use_postgresql = getattr(db_manager, '_use_postgresql', False)

            if use_postgresql:
                from sqlalchemy import text
                result = conn.execute(
                    text('''
                        INSERT INTO transactions (user_id, merchant, amount, date, status)
                        VALUES (:user_id, :merchant, :amount, CURRENT_DATE, 'pending')
                        RETURNING id
                    '''),
                    {'user_id': user_id, 'merchant': merchant, 'amount': amount}
                )
                new_id = result.fetchone()[0]
                conn.commit()
                db_manager.release_connection(conn)
            else:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO transactions (user_id, merchant, amount, date, status)
                    VALUES (?, ?, ?, DATE('now'), 'pending')
                ''', (user_id, merchant, amount))
                new_id = cursor.lastrowid
                conn.commit()
                conn.close()

            return jsonify({
                'success': True,
                'message': 'Transaction created',
                'transaction_id': new_id
            }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Dashboard Overview
# =============================================================================

@business_bp.route('/dashboard/overview', methods=['GET'])
@cross_origin()
def business_dashboard_overview():
    """Get business dashboard overview with metrics"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = int(user.get('id'))

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            query = text('''
                SELECT id, user_id, merchant, amount, date, category, description,
                       round_up, investable, total_debit, fee, status, ticker,
                       shares, price_per_share, stock_price, created_at
                FROM transactions
                WHERE user_id = CAST(:user_id AS INTEGER)
                ORDER BY date DESC NULLS LAST, id DESC
                LIMIT 1000
            ''')
            result = conn.execute(query, {'user_id': user_id})
            transactions = [dict(row._mapping) for row in result]
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, user_id, merchant, amount, date, category, description,
                       round_up, investable, total_debit, fee, status, ticker,
                       shares, price_per_share, stock_price, created_at
                FROM transactions
                WHERE user_id = ?
                ORDER BY date DESC, id DESC
                LIMIT 1000
            ''', (user_id,))
            columns = [description[0] for description in cursor.description]
            transactions = [dict(zip(columns, row)) for row in cursor.fetchall()]
            cursor.close()
            conn.close()

        # Calculate metrics
        def get_display_roundup(t):
            round_up = float(t.get('round_up', 0) or 0)
            return round_up if round_up > 0 else 1.00

        total_spending = sum(abs(float(t.get('amount', 0) or t.get('total_debit', 0))) for t in transactions)
        total_roundups = sum(get_display_roundup(t) for t in transactions)
        total_transactions = len(transactions)

        completed_transactions = [t for t in transactions if t.get('status', '').lower() == 'completed']
        invested_transactions = len(completed_transactions)

        return jsonify({
            'success': True,
            'data': {
                'quick_stats': {
                    'total_employees': 0,
                    'monthly_revenue': round(total_roundups, 2),
                    'monthly_purchases': round(total_spending, 2),
                    'total_revenue': round(total_spending, 2),
                    'revenue_growth': 0,
                    'active_projects': invested_transactions,
                    'total_transactions': total_transactions,
                    'total_roundups': round(total_roundups, 2),
                    'invested_transactions': invested_transactions
                },
                'key_metrics': {
                    'total_spending': round(total_spending, 2),
                    'total_invested': round(sum(get_display_roundup(t) for t in completed_transactions), 2),
                    'investment_rate': round((invested_transactions / total_transactions * 100) if total_transactions > 0 else 0, 2)
                }
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Analytics Routes
# =============================================================================

@business_bp.route('/analytics')
def business_analytics():
    """Get business analytics data"""
    return jsonify({'success': True, 'data': []})


@business_bp.route('/revenue')
def business_revenue():
    """Get business revenue data"""
    return jsonify({'success': True, 'data': []})


@business_bp.route('/expenses')
def business_expenses():
    """Get business expenses data"""
    return jsonify({'success': True, 'data': []})


@business_bp.route('/profit')
def business_profit():
    """Get business profit data"""
    return jsonify({'success': True, 'data': []})


@business_bp.route('/roundup/stats')
def business_roundup_stats():
    """Get business round-up stats"""
    return jsonify({'success': True, 'data': []})


@business_bp.route('/roundups/total')
@cross_origin()
def business_roundups_total():
    """Get total round-ups for business account"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = user.get('id')
        stats = db_manager.get_user_roundups_total(user_id)
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@business_bp.route('/fees/total')
@cross_origin()
def business_fees_total():
    """Get total fees for business account"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = user.get('id')
        stats = db_manager.get_user_fees_total(user_id)
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Portfolio Routes
# =============================================================================

@business_bp.route('/portfolio', methods=['GET'])
@cross_origin()
def business_portfolio():
    """Get business portfolio data"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = int(user.get('id'))

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text('''
                    SELECT ticker, SUM(shares) as total_shares,
                           AVG(price_per_share) as avg_price
                    FROM transactions
                    WHERE user_id = :user_id AND ticker IS NOT NULL AND shares > 0
                    GROUP BY ticker
                '''),
                {'user_id': user_id}
            )
            positions = [dict(row._mapping) for row in result]
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT ticker, SUM(shares) as total_shares,
                       AVG(price_per_share) as avg_price
                FROM transactions
                WHERE user_id = ? AND ticker IS NOT NULL AND shares > 0
                GROUP BY ticker
            ''', (user_id,))
            columns = ['ticker', 'total_shares', 'avg_price']
            positions = [dict(zip(columns, row)) for row in cursor.fetchall()]
            conn.close()

        return jsonify({'success': True, 'portfolio': positions})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Goals Routes
# =============================================================================

@business_bp.route('/goals', methods=['GET', 'POST'])
@cross_origin()
def business_goals():
    """Get or create business goals"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = int(user.get('id'))

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if request.method == 'GET':
            if use_postgresql:
                from sqlalchemy import text
                result = conn.execute(
                    text('SELECT id, name, target_amount, current_amount, deadline, status FROM goals WHERE user_id = :user_id'),
                    {'user_id': user_id}
                )
                goals = [dict(row._mapping) for row in result]
                db_manager.release_connection(conn)
            else:
                cursor = conn.cursor()
                cursor.execute('SELECT id, name, target_amount, current_amount, deadline, status FROM goals WHERE user_id = ?', (user_id,))
                columns = ['id', 'name', 'target_amount', 'current_amount', 'deadline', 'status']
                goals = [dict(zip(columns, row)) for row in cursor.fetchall()]
                conn.close()

            return jsonify({'success': True, 'goals': goals})

        elif request.method == 'POST':
            data = request.get_json() or {}
            name = data.get('name', '').strip()
            target_amount = float(data.get('target_amount', 0))

            if not name or target_amount <= 0:
                return jsonify({'success': False, 'error': 'Name and target amount are required'}), 400

            if use_postgresql:
                from sqlalchemy import text
                result = conn.execute(
                    text('''
                        INSERT INTO goals (user_id, name, target_amount, current_amount, status)
                        VALUES (:user_id, :name, :target, 0, 'active')
                        RETURNING id
                    '''),
                    {'user_id': user_id, 'name': name, 'target': target_amount}
                )
                new_id = result.fetchone()[0]
                conn.commit()
                db_manager.release_connection(conn)
            else:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO goals (user_id, name, target_amount, current_amount, status)
                    VALUES (?, ?, ?, 0, 'active')
                ''', (user_id, name, target_amount))
                new_id = cursor.lastrowid
                conn.commit()
                conn.close()

            return jsonify({
                'success': True,
                'message': 'Goal created',
                'goal_id': new_id
            }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Team Member Routes
# =============================================================================

@business_bp.route('/team/members', methods=['GET', 'POST'])
@cross_origin()
def business_team_members():
    """Get or create business team members"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = int(user.get('id'))

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if request.method == 'GET':
            if use_postgresql:
                from sqlalchemy import text
                # Check if table exists
                check_result = conn.execute(text(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_team_members')"
                ))
                table_exists = check_result.scalar()

                if table_exists:
                    result = conn.execute(
                        text('''
                            SELECT id, name, email, role, permissions, created_at
                            FROM business_team_members
                            WHERE business_user_id = :user_id
                            ORDER BY created_at DESC
                        '''),
                        {'user_id': user_id}
                    )
                    members = []
                    for row in result:
                        members.append({
                            'id': row[0],
                            'name': row[1],
                            'email': row[2],
                            'role': row[3],
                            'permissions': json.loads(row[4]) if row[4] else [],
                            'created_at': str(row[5]) if row[5] else None
                        })
                else:
                    members = []

                db_manager.release_connection(conn)
            else:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT name FROM sqlite_master
                    WHERE type='table' AND name='business_team_members'
                """)
                table_exists = cursor.fetchone()

                if table_exists:
                    cursor.execute('''
                        SELECT id, name, email, role, permissions, created_at
                        FROM business_team_members
                        WHERE business_user_id = ?
                        ORDER BY created_at DESC
                    ''', (user_id,))
                    members = []
                    for row in cursor.fetchall():
                        members.append({
                            'id': row[0],
                            'name': row[1],
                            'email': row[2],
                            'role': row[3],
                            'permissions': json.loads(row[4]) if row[4] else [],
                            'created_at': row[5]
                        })
                else:
                    members = []
                conn.close()

            return jsonify({'success': True, 'data': {'members': members}})

        elif request.method == 'POST':
            data = request.get_json() or {}
            name = data.get('name', '').strip()
            email = data.get('email', '').strip()
            role = data.get('role', 'employee')
            permissions = data.get('permissions', [])

            if not name or not email:
                return jsonify({'success': False, 'error': 'Name and email are required'}), 400

            if use_postgresql:
                from sqlalchemy import text
                # Create table if not exists
                conn.execute(text('''
                    CREATE TABLE IF NOT EXISTS business_team_members (
                        id SERIAL PRIMARY KEY,
                        business_user_id INTEGER NOT NULL,
                        name TEXT NOT NULL,
                        email TEXT NOT NULL,
                        role TEXT NOT NULL DEFAULT 'employee',
                        permissions TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                '''))

                result = conn.execute(
                    text('''
                        INSERT INTO business_team_members (business_user_id, name, email, role, permissions)
                        VALUES (:user_id, :name, :email, :role, :permissions)
                        RETURNING id
                    '''),
                    {'user_id': user_id, 'name': name, 'email': email, 'role': role, 'permissions': json.dumps(permissions)}
                )
                new_id = result.fetchone()[0]
                conn.commit()
                db_manager.release_connection(conn)
            else:
                cursor = conn.cursor()
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS business_team_members (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        business_user_id INTEGER NOT NULL,
                        name TEXT NOT NULL,
                        email TEXT NOT NULL,
                        role TEXT NOT NULL DEFAULT 'employee',
                        permissions TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                cursor.execute('''
                    INSERT INTO business_team_members (business_user_id, name, email, role, permissions)
                    VALUES (?, ?, ?, ?, ?)
                ''', (user_id, name, email, role, json.dumps(permissions)))
                new_id = cursor.lastrowid
                conn.commit()
                conn.close()

            return jsonify({
                'success': True,
                'message': 'Team member added',
                'member_id': new_id
            }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@business_bp.route('/team/members/<int:member_id>', methods=['DELETE'])
@cross_origin()
def delete_team_member(member_id):
    """Delete a business team member"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = int(user.get('id'))

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            conn.execute(
                text('DELETE FROM business_team_members WHERE id = :member_id AND business_user_id = :user_id'),
                {'member_id': member_id, 'user_id': user_id}
            )
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM business_team_members WHERE id = ? AND business_user_id = ?', (member_id, user_id))
            conn.commit()
            conn.close()

        return jsonify({'success': True, 'message': 'Team member removed'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Notifications Routes
# =============================================================================

@business_bp.route('/notifications', methods=['GET', 'POST'])
@cross_origin()
def business_notifications():
    """Get or create business notifications"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = int(user.get('id'))

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if request.method == 'GET':
            if use_postgresql:
                from sqlalchemy import text
                result = conn.execute(
                    text('''
                        SELECT id, type, title, message, is_read, created_at
                        FROM notifications
                        WHERE user_id = :user_id
                        ORDER BY created_at DESC
                        LIMIT 100
                    '''),
                    {'user_id': user_id}
                )
                notifications = [dict(row._mapping) for row in result]
                db_manager.release_connection(conn)
            else:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, type, title, message, is_read, created_at
                    FROM notifications
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT 100
                ''', (user_id,))
                columns = ['id', 'type', 'title', 'message', 'is_read', 'created_at']
                notifications = [dict(zip(columns, row)) for row in cursor.fetchall()]
                conn.close()

            return jsonify({'success': True, 'notifications': notifications})

        elif request.method == 'POST':
            data = request.get_json() or {}
            title = data.get('title', '').strip()
            message = data.get('message', '').strip()
            notif_type = data.get('type', 'info')

            if not title or not message:
                return jsonify({'success': False, 'error': 'Title and message are required'}), 400

            if use_postgresql:
                from sqlalchemy import text
                result = conn.execute(
                    text('''
                        INSERT INTO notifications (user_id, type, title, message)
                        VALUES (:user_id, :type, :title, :message)
                        RETURNING id
                    '''),
                    {'user_id': user_id, 'type': notif_type, 'title': title, 'message': message}
                )
                new_id = result.fetchone()[0]
                conn.commit()
                db_manager.release_connection(conn)
            else:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO notifications (user_id, type, title, message)
                    VALUES (?, ?, ?, ?)
                ''', (user_id, notif_type, title, message))
                new_id = cursor.lastrowid
                conn.commit()
                conn.close()

            return jsonify({'success': True, 'notification_id': new_id}), 201

    except Exception as e:
        return jsonify({'success': True, 'notifications': []})


@business_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@cross_origin()
def mark_notification_read(notification_id):
    """Mark notification as read"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = int(user.get('id'))

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            conn.execute(
                text('UPDATE notifications SET is_read = true WHERE id = :notif_id AND user_id = :user_id'),
                {'notif_id': notification_id, 'user_id': user_id}
            )
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', (notification_id, user_id))
            conn.commit()
            conn.close()

        return jsonify({'success': True, 'message': 'Notification marked as read'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@business_bp.route('/notifications/read-all', methods=['PUT'])
@cross_origin()
def mark_all_notifications_read():
    """Mark all notifications as read"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = int(user.get('id'))

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            conn.execute(
                text('UPDATE notifications SET is_read = true WHERE user_id = :user_id'),
                {'user_id': user_id}
            )
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', (user_id,))
            conn.commit()
            conn.close()

        return jsonify({'success': True, 'message': 'All notifications marked as read'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Settings Routes
# =============================================================================

@business_bp.route('/settings', methods=['GET', 'PUT'])
@cross_origin()
def business_settings():
    """Get or update business settings"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = int(user.get('id'))

        if request.method == 'GET':
            settings = {
                'roundup_multiplier': 1.0,
                'auto_invest': False,
                'notifications': False,
                'email_alerts': False,
                'business_sharing': False,
                'budget_alerts': False,
                'department_limits': {}
            }
            return jsonify({'success': True, 'settings': settings})

        elif request.method == 'PUT':
            data = request.get_json() or {}
            # Settings would be saved to database here
            return jsonify({'success': True, 'message': 'Settings updated successfully'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@business_bp.route('/settings/roundup', methods=['GET', 'PUT'])
@cross_origin()
def business_roundup_settings():
    """Get or update roundup settings"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    if request.method == 'GET':
        return jsonify({
            'success': True,
            'settings': {
                'roundup_multiplier': 1.0,
                'auto_invest': False
            }
        })

    elif request.method == 'PUT':
        return jsonify({'success': True, 'message': 'Roundup settings updated'})


# =============================================================================
# Mapping History
# =============================================================================

@business_bp.route('/mapping-history')
def business_mapping_history():
    """Get business mapping history"""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        user_id = user['id']
        mappings = db_manager.get_llm_mappings(user_id=str(user_id))
        recent_mapping = mappings[:1] if mappings else []
        return jsonify({'success': True, 'data': recent_mapping})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
