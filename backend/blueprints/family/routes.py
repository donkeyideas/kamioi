"""
Family Dashboard Routes

Handles family account endpoints:
- GET  /api/family/transactions
- GET  /api/family/portfolio
- GET  /api/family/goals
- GET  /api/family/notifications
- GET  /api/family/members
- GET  /api/family/roundups/total
- GET  /api/family/fees/total
"""

from datetime import datetime
from flask import request

from . import family_bp
from blueprints.auth.helpers import get_auth_user
from database_manager import db_manager
from utils.response import success_response, error_response, unauthorized_response


# =============================================================================
# TRANSACTIONS
# =============================================================================

@family_bp.route('/transactions', methods=['GET'])
def get_transactions():
    """Get family transactions."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        user_id = user.get('id')
        if not user_id:
            return error_response('User ID not found', 400)

        # Fix transactions with tickers but pending status
        _fix_pending_transactions(user_id)

        # Fetch transactions
        transactions = db_manager.get_user_transactions(user_id, limit=100, offset=0)
        formatted = _format_transactions(transactions)

        return success_response(data={
            'transactions': formatted,
            'total': len(formatted),
            'user_id': user_id
        })

    except Exception as e:
        return error_response(str(e), 500)


# =============================================================================
# PORTFOLIO
# =============================================================================

@family_bp.route('/portfolio', methods=['GET'])
def get_portfolio():
    """Get family investment portfolio."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    try:
        user_id = user.get('id')
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
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

@family_bp.route('/goals', methods=['GET'])
def get_goals():
    """Get family financial goals."""
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


# =============================================================================
# NOTIFICATIONS
# =============================================================================

@family_bp.route('/notifications', methods=['GET'])
def get_notifications():
    """Get family notifications."""
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
# MEMBERS
# =============================================================================

@family_bp.route('/members', methods=['GET'])
def get_members():
    """Get family members."""
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
                    SELECT id, name, email, role, created_at
                    FROM family_members
                    WHERE family_id = :user_id OR user_id = :user_id
                    ORDER BY created_at DESC
                """),
                {'user_id': user['id']}
            )
            rows = result.fetchall()
            cols = result.keys()
            members = [dict(zip(cols, r)) for r in rows]
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            # Check if table exists
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='family_members'")
            if not cur.fetchone():
                conn.close()
                return success_response(data=[])

            cur.execute("""
                SELECT id, name, email, role, created_at
                FROM family_members
                WHERE family_id = ? OR user_id = ?
                ORDER BY created_at DESC
            """, (user['id'], user['id']))
            cols = [d[0] for d in cur.description]
            members = [dict(zip(cols, r)) for r in cur.fetchall()]
            conn.close()

        return success_response(data=members)

    except Exception:
        return success_response(data=[])


# =============================================================================
# ROUND-UPS & FEES
# =============================================================================

@family_bp.route('/roundups/total', methods=['GET'])
def get_roundups_total():
    """Get family total round-ups."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()

    stats = db_manager.get_user_roundups_total(user['id'])
    return success_response(data=stats)


@family_bp.route('/fees/total', methods=['GET'])
def get_fees_total():
    """Get family total fees."""
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
        pass


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
