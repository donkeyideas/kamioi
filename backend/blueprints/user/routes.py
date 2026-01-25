"""
User Dashboard Routes

Handles user dashboard endpoints:
- GET  /api/user/transactions
- GET  /api/user/portfolio
- GET  /api/user/goals
- POST /api/user/goals
- GET  /api/user/notifications
- GET  /api/user/roundups/total
- GET  /api/user/fees/total
- GET  /api/user/profile
- PUT  /api/user/profile
"""

from datetime import datetime
from flask import request

from . import user_bp
from blueprints.auth.helpers import get_auth_user, require_auth
from database_manager import db_manager
from utils.response import success_response, error_response, unauthorized_response, paginated_response


# =============================================================================
# TRANSACTIONS
# =============================================================================

@user_bp.route('/transactions', methods=['GET'])
def get_transactions():
    """Get user's transactions with pagination."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        user_id = user.get('id')
        if not user_id:
            return error_response('User ID not found', 400)

        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)  # Max 100 per page
        offset = (page - 1) * per_page

        # Fix transactions: update status to 'mapped' if they have a ticker but status is still 'pending'
        _fix_pending_transactions(user_id)

        # Get total count for pagination
        total = _get_transaction_count(user_id)

        # Fetch transactions from database
        transactions = db_manager.get_user_transactions(user_id, limit=per_page, offset=offset)

        # Format transactions for frontend
        formatted = _format_transactions(transactions)

        return paginated_response(
            items={'transactions': formatted, 'user_id': user_id},
            total=total,
            page=page,
            per_page=per_page
        )

    except Exception as e:
        return error_response(str(e), 500)


def _get_transaction_count(user_id):
    """Get total transaction count for a user."""
    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("SELECT COUNT(*) FROM transactions WHERE user_id = :user_id"),
                {'user_id': user_id}
            )
            count = result.scalar() or 0
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,))
            count = cursor.fetchone()[0] or 0
            conn.close()

        return count
    except Exception:
        return 0


@user_bp.route('/transactions', methods=['POST'])
def add_transaction():
    """Add a new transaction."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        data = request.get_json() or {}
        user_id = user.get('id')

        required_fields = ['merchant', 'amount']
        for field in required_fields:
            if not data.get(field):
                return error_response(f'{field} is required', 400)

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("""
                    INSERT INTO transactions (user_id, merchant, amount, date, category, description, status, created_at)
                    VALUES (:user_id, :merchant, :amount, :date, :category, :description, 'pending', NOW())
                    RETURNING id
                """),
                {
                    'user_id': user_id,
                    'merchant': data.get('merchant'),
                    'amount': data.get('amount'),
                    'date': data.get('date', datetime.now().isoformat()),
                    'category': data.get('category', 'Uncategorized'),
                    'description': data.get('description', '')
                }
            )
            transaction_id = result.fetchone()[0]
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO transactions (user_id, merchant, amount, date, category, description, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
            """, (
                user_id,
                data.get('merchant'),
                data.get('amount'),
                data.get('date', datetime.now().isoformat()),
                data.get('category', 'Uncategorized'),
                data.get('description', '')
            ))
            transaction_id = cur.lastrowid
            conn.commit()
            conn.close()

        return success_response(
            data={'id': transaction_id},
            message='Transaction added successfully',
            status_code=201
        )

    except Exception as e:
        return error_response(str(e), 500)


# =============================================================================
# PORTFOLIO
# =============================================================================

@user_bp.route('/portfolio', methods=['GET'])
def get_portfolio():
    """Get user's investment portfolio."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        user_id = user.get('id')
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            # Check if table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'portfolios'
                )
            """))
            table_exists = result.fetchone()[0]

            if not table_exists:
                db_manager.release_connection(conn)
                return success_response(data=_empty_portfolio())

            result = conn.execute(
                text("""
                    SELECT ticker, shares, average_price, current_price, total_value, created_at
                    FROM portfolios
                    WHERE user_id = :user_id
                    ORDER BY created_at DESC
                """),
                {'user_id': user_id}
            )
            rows = result.fetchall()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            # Check if portfolios table exists
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='portfolios'")
            if not cur.fetchone():
                conn.close()
                return success_response(data=_empty_portfolio())

            cur.execute("""
                SELECT ticker, shares, average_price, current_price, total_value, created_at
                FROM portfolios
                WHERE user_id = ?
                ORDER BY created_at DESC
            """, (user_id,))
            rows = cur.fetchall()
            conn.close()

        portfolio = _format_portfolio(rows)
        return success_response(data=portfolio)

    except Exception as e:
        return error_response(str(e), 500)


# =============================================================================
# GOALS
# =============================================================================

@user_bp.route('/goals', methods=['GET'])
def get_goals():
    """Get user's financial goals."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("""
                    SELECT id, title, target_amount, current_amount, progress, goal_type, created_at
                    FROM goals
                    WHERE user_id = :user_id
                    ORDER BY created_at DESC
                """),
                {'user_id': user['id']}
            )
            rows = result.fetchall()
            cols = result.keys()
            goals = [dict(zip(cols, r)) for r in rows]
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, title, target_amount, current_amount, progress, goal_type, created_at
                FROM goals
                WHERE user_id = ?
                ORDER BY created_at DESC
            """, (user['id'],))
            cols = [d[0] for d in cur.description]
            goals = [dict(zip(cols, r)) for r in cur.fetchall()]
            conn.close()

        return success_response(data=goals)

    except Exception:
        return success_response(data=[])


@user_bp.route('/goals', methods=['POST'])
def create_goal():
    """Create a new financial goal."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        data = request.get_json() or {}

        if not data.get('title') or not data.get('target_amount'):
            return error_response('Title and target amount are required', 400)

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("""
                    INSERT INTO goals (user_id, title, target_amount, current_amount, progress, goal_type, created_at)
                    VALUES (:user_id, :title, :target_amount, 0, 0, :goal_type, NOW())
                    RETURNING id
                """),
                {
                    'user_id': user['id'],
                    'title': data.get('title'),
                    'target_amount': data.get('target_amount'),
                    'goal_type': data.get('goal_type', 'savings')
                }
            )
            goal_id = result.fetchone()[0]
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO goals (user_id, title, target_amount, current_amount, progress, goal_type, created_at)
                VALUES (?, ?, ?, 0, 0, ?, datetime('now'))
            """, (user['id'], data.get('title'), data.get('target_amount'), data.get('goal_type', 'savings')))
            goal_id = cur.lastrowid
            conn.commit()
            conn.close()

        return success_response(
            data={'id': goal_id},
            message='Goal created successfully',
            status_code=201
        )

    except Exception as e:
        return error_response(str(e), 500)


# =============================================================================
# NOTIFICATIONS
# =============================================================================

@user_bp.route('/notifications', methods=['GET'])
def get_notifications():
    """Get user's notifications."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("""
                    SELECT id, title, message, type, read, created_at
                    FROM notifications
                    WHERE user_id = :user_id
                    ORDER BY created_at DESC
                """),
                {'user_id': user['id']}
            )
            rows = result.fetchall()
            cols = result.keys()
            notifications = [dict(zip(cols, r)) for r in rows]
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, title, message, type, read, created_at
                FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
            """, (user['id'],))
            cols = [d[0] for d in cur.description]
            notifications = [dict(zip(cols, r)) for r in cur.fetchall()]
            conn.close()

        return success_response(data=notifications)

    except Exception:
        return success_response(data=[])


# =============================================================================
# ROUND-UPS & FEES
# =============================================================================

@user_bp.route('/roundups/total', methods=['GET'])
def get_roundups_total():
    """Get user's total round-ups."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    stats = db_manager.get_user_roundups_total(user['id'])
    return success_response(data=stats)


@user_bp.route('/fees/total', methods=['GET'])
def get_fees_total():
    """Get user's total fees."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("SELECT COALESCE(SUM(fee), 0) as total_fees FROM transactions WHERE user_id = :user_id"),
                {'user_id': user['id']}
            )
            total_fees = result.fetchone()[0]
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("SELECT COALESCE(SUM(fee), 0) as total_fees FROM transactions WHERE user_id = ?", (user['id'],))
            total_fees = cur.fetchone()[0]
            conn.close()

        return success_response(data={'total_fees': float(total_fees or 0)})

    except Exception:
        return success_response(data={'total_fees': 0})


# =============================================================================
# PROFILE
# =============================================================================

@user_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get user's profile."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("""
                    SELECT id, name, email, account_type, phone, city, state, zip_code,
                           address, account_number, created_at, first_name, last_name,
                           dob, ssn_last4, country, timezone, employer, occupation,
                           annual_income, employment_status, risk_tolerance
                    FROM users
                    WHERE id = :user_id
                """),
                {'user_id': user['id']}
            )
            row = result.fetchone()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, name, email, account_type, phone, city, state, zip_code,
                       address, account_number, created_at, first_name, last_name,
                       dob, ssn_last4, country, timezone, employer, occupation,
                       annual_income, employment_status, risk_tolerance
                FROM users
                WHERE id = ?
            """, (user['id'],))
            row = cur.fetchone()
            conn.close()

        if not row:
            return error_response('User not found', 404)

        # Format DOB as string if it's a date object
        dob_value = row[13] if len(row) > 13 else None
        if dob_value and hasattr(dob_value, 'isoformat'):
            dob_value = dob_value.isoformat()

        profile = {
            'id': row[0],
            'name': row[1],
            'email': row[2],
            'account_type': row[3],
            'phone': row[4],
            'city': row[5],
            'state': row[6],
            'zip_code': row[7],
            'zip': row[7],  # Alias for frontend
            'address': row[8],
            'street': row[8],  # Alias for frontend
            'account_number': row[9],
            'created_at': row[10],
            'firstName': row[11] if len(row) > 11 else None,
            'lastName': row[12] if len(row) > 12 else None,
            'dob': dob_value,
            'dateOfBirth': dob_value,  # Alias for frontend
            'ssn': row[14] if len(row) > 14 else None,
            'ssnLast4': row[14] if len(row) > 14 else None,
            'ssn_last4': row[14] if len(row) > 14 else None,
            'country': row[15] if len(row) > 15 else None,
            'timezone': row[16] if len(row) > 16 else None,
            'employer': row[17] if len(row) > 17 else None,
            'occupation': row[18] if len(row) > 18 else None,
            'annualIncome': row[19] if len(row) > 19 else None,
            'employmentStatus': row[20] if len(row) > 20 else None,
            'riskTolerance': row[21] if len(row) > 21 else None
        }

        # Return profile at top level for frontend compatibility
        # Frontend expects: { success: true, profile: {...} }
        from flask import jsonify
        return jsonify({
            'success': True,
            'profile': profile,
            'data': profile  # Also include at data level for any code expecting that format
        })

    except Exception as e:
        return error_response(str(e), 500)


@user_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user's profile."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        data = request.get_json() or {}

        # Expanded allowed fields including DOB, SSN, and all profile fields
        allowed_fields = [
            'name', 'phone', 'city', 'state', 'zip_code', 'address',
            'first_name', 'last_name', 'dob', 'ssn_last4',
            'country', 'timezone', 'employer', 'occupation',
            'annual_income', 'employment_status', 'risk_tolerance'
        ]

        # Map frontend field names to database field names
        field_mapping = {
            'firstName': 'first_name',
            'lastName': 'last_name',
            'dateOfBirth': 'dob',
            'ssnLast4': 'ssn_last4',
            'ssn': 'ssn_last4',
            'zipCode': 'zip_code',
            'zip': 'zip_code',
            'street': 'address',
            'annualIncome': 'annual_income',
            'employmentStatus': 'employment_status',
            'riskTolerance': 'risk_tolerance'
        }

        # Build update query dynamically
        updates = []
        values = {}

        for key, value in data.items():
            # Map frontend field names to database field names
            db_field = field_mapping.get(key, key)

            if db_field in allowed_fields:
                updates.append(f"{db_field} = :{db_field}")
                values[db_field] = value

        if not updates:
            return error_response('No valid fields to update', 400)

        values['user_id'] = user['id']

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = :user_id"
            conn.execute(text(query), values)
            conn.commit()
            db_manager.release_connection(conn)
        else:
            # Convert to SQLite format
            sqlite_updates = []
            sqlite_values = []
            for key, value in data.items():
                db_field = field_mapping.get(key, key)
                if db_field in allowed_fields:
                    sqlite_updates.append(f"{db_field} = ?")
                    sqlite_values.append(value)
            sqlite_values.append(user['id'])

            cur = conn.cursor()
            query = f"UPDATE users SET {', '.join(sqlite_updates)} WHERE id = ?"
            cur.execute(query, sqlite_values)
            conn.commit()
            conn.close()

        return success_response(message='Profile updated successfully')

    except Exception as e:
        return error_response(str(e), 500)


# =============================================================================
# BANK CONNECTIONS
# =============================================================================

@user_bp.route('/bank-connections', methods=['GET'])
def get_bank_connections():
    """Get user's bank connections from mx_data column."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        import json
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("SELECT mx_data, user_guid FROM users WHERE id = :user_id"),
                {'user_id': user['id']}
            )
            row = result.fetchone()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("SELECT mx_data, user_guid FROM users WHERE id = ?", (user['id'],))
            row = cur.fetchone()
            conn.close()

        if row and row[0]:
            try:
                mx_data = json.loads(row[0]) if isinstance(row[0], str) else row[0]
                # Format connection data for frontend
                connection = {
                    'id': mx_data.get('member_guid', f"conn_{user['id']}"),
                    'member_guid': mx_data.get('member_guid', ''),
                    'user_guid': mx_data.get('user_guid', row[1] if row[1] else ''),
                    'bank_name': mx_data.get('institution_name', mx_data.get('bank_name', 'Connected Bank')),
                    'institution_name': mx_data.get('institution_name', mx_data.get('bank_name', 'Connected Bank')),
                    'account_name': mx_data.get('account_name', 'Primary Account'),
                    'account_type': mx_data.get('account_type', 'checking'),
                    'status': 'active',
                    'connected_at': mx_data.get('connected_at', '')
                }
                return success_response(data={
                    'connections': [connection],
                    'has_connections': True
                })
            except Exception:
                pass

        return success_response(data={
            'connections': [],
            'has_connections': False
        })

    except Exception as e:
        return error_response(str(e), 500)


@user_bp.route('/bank-connections', methods=['POST'])
def save_bank_connection():
    """Save bank connection to mx_data column."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        import json
        from datetime import datetime

        data = request.get_json() or {}
        member_guid = data.get('member_guid', '')
        user_guid = data.get('user_guid', '')
        institution_name = data.get('institution_name', 'Connected Bank')
        accounts = data.get('accounts', [])

        # Store as JSON in mx_data column
        mx_data = json.dumps({
            'member_guid': member_guid,
            'user_guid': user_guid,
            'institution_name': institution_name,
            'accounts': accounts,
            'connected_at': datetime.now().isoformat()
        })

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            conn.execute(
                text("UPDATE users SET mx_data = :mx_data, user_guid = :user_guid WHERE id = :user_id"),
                {'mx_data': mx_data, 'user_guid': user_guid, 'user_id': user['id']}
            )
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("UPDATE users SET mx_data = ?, user_guid = ? WHERE id = ?",
                       (mx_data, user_guid, user['id']))
            conn.commit()
            conn.close()

        return success_response(message='Bank connection saved successfully')

    except Exception as e:
        return error_response(str(e), 500)


@user_bp.route('/bank-connections', methods=['DELETE'])
def delete_bank_connection():
    """Delete bank connection by clearing mx_data column."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            conn.execute(
                text("UPDATE users SET mx_data = NULL WHERE id = :user_id"),
                {'user_id': user['id']}
            )
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("UPDATE users SET mx_data = NULL WHERE id = ?", (user['id'],))
            conn.commit()
            conn.close()

        return success_response(message='Bank connection removed successfully')

    except Exception as e:
        return error_response(str(e), 500)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _fix_pending_transactions(user_id):
    """Update status to 'mapped' for transactions with tickers but 'pending' status."""
    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            conn.execute(
                text("""
                    UPDATE transactions
                    SET status = 'mapped'
                    WHERE user_id = :user_id AND ticker IS NOT NULL AND status = 'pending'
                """),
                {'user_id': user_id}
            )
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute("""
                UPDATE transactions
                SET status = 'mapped'
                WHERE user_id = ? AND ticker IS NOT NULL AND status = 'pending'
            """, (user_id,))
            conn.commit()
            conn.close()
    except Exception:
        pass  # Non-critical operation


def _format_transactions(transactions):
    """Format transactions for frontend."""
    formatted = []
    for txn in transactions:
        raw_amount = float(txn.get('amount', 0))
        raw_total_debit = float(txn.get('total_debit', txn.get('amount', 0)))

        formatted.append({
            'id': txn.get('id'),
            'merchant': txn.get('merchant') or txn.get('merchant_name'),
            'amount': abs(raw_amount),
            'date': txn.get('date'),
            'category': txn.get('category', 'Uncategorized'),
            'description': txn.get('description'),
            'roundup': float(txn.get('round_up', 0)),
            'round_up': float(txn.get('round_up', 0)),
            'investable': float(txn.get('investable', 0)),
            'total_debit': abs(raw_total_debit),
            'fee': float(txn.get('fee', 0)),
            'status': txn.get('status', 'pending'),
            'ticker': txn.get('ticker'),
            'shares': txn.get('shares'),
            'price_per_share': txn.get('price_per_share'),
            'stock_price': txn.get('stock_price'),
            'type': 'purchase'
        })

    return formatted


def _empty_portfolio():
    """Return an empty portfolio structure."""
    return {
        'total_value': 0,
        'total_invested': 0,
        'total_gain_loss': 0,
        'total_gain_loss_percent': 0,
        'holdings': [],
        'cash_balance': 0,
        'last_updated': datetime.now().isoformat()
    }


def _format_portfolio(rows):
    """Format portfolio data from database rows."""
    holdings = []
    total_value = 0
    total_invested = 0

    for row in rows:
        ticker, shares, average_price, current_price, total_value_row, created_at = row

        purchase_price = average_price
        if current_price is None:
            current_price = average_price

        gain_loss = (current_price - purchase_price) * shares if shares else 0
        gain_loss_percent = ((current_price - purchase_price) / purchase_price * 100) if purchase_price > 0 else 0

        holding_value = total_value_row or (shares * current_price) if shares else 0

        holdings.append({
            'symbol': ticker,
            'name': ticker,
            'shares': shares,
            'current_price': current_price,
            'purchase_price': purchase_price,
            'total_value': holding_value,
            'gain_loss': round(gain_loss, 2),
            'gain_loss_percent': round(gain_loss_percent, 2)
        })

        total_value += holding_value
        total_invested += (purchase_price * shares) if shares else 0

    total_gain_loss = total_value - total_invested
    total_gain_loss_percent = (total_gain_loss / total_invested * 100) if total_invested > 0 else 0

    return {
        'total_value': round(total_value, 2),
        'total_invested': round(total_invested, 2),
        'total_gain_loss': round(total_gain_loss, 2),
        'total_gain_loss_percent': round(total_gain_loss_percent, 2),
        'holdings': holdings,
        'cash_balance': 500.00,
        'last_updated': datetime.now().isoformat()
    }
