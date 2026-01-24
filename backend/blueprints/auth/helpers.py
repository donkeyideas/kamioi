"""
Authentication Helper Functions

These functions are used across multiple blueprints for authentication
and authorization purposes.
"""

import re
from flask import request, jsonify
from database_manager import db_manager


def parse_bearer_token_user_id():
    """
    Parse Authorization: Bearer token and return user_id if valid.

    Supports multiple token formats:
    - token_<user_id>
    - family_token_<user_id>
    - user_token_<user_id>
    - business_token_<user_id>

    Returns:
        int or None: The user ID from the token, or None if invalid
    """
    try:
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return None

        token = auth.split(' ', 1)[1].strip()

        # Handle null/undefined tokens from localStorage
        if not token or token in ('null', 'undefined', '', 'none', 'None'):
            return None

        # Token format patterns
        prefixes = ['token_', 'family_token_', 'user_token_', 'business_token_']

        for prefix in prefixes:
            if token.startswith(prefix):
                uid_str = token.split(prefix, 1)[1]
                try:
                    return int(uid_str)
                except ValueError:
                    return None

        return None
    except Exception:
        return None


def get_user_id_from_token(token):
    """
    Get user ID from a token string (without request context).

    Args:
        token: Token string to parse

    Returns:
        int or None: The user ID, or None if invalid
    """
    if not token:
        return None

    prefixes = ['token_', 'family_token_', 'user_token_', 'business_token_']

    for prefix in prefixes:
        if token.startswith(prefix):
            uid_str = token.split(prefix, 1)[1]
            try:
                return int(uid_str)
            except ValueError:
                return None

    return None


def get_auth_user():
    """
    Get authenticated user dict from Authorization header token.

    Returns:
        dict or None: User data dict with id, email, name, role, dashboard,
                      or None if not authenticated
    """
    try:
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return None

        token = auth.split(' ', 1)[1].strip()

        # Handle null/undefined tokens
        if not token or token in ('null', 'undefined', '', 'none', 'None'):
            return None

        # Handle admin tokens
        if token.startswith('admin_token_'):
            return _get_admin_from_token(token)

        # Handle regular user tokens
        user_id = parse_bearer_token_user_id()
        if not user_id:
            # Try to extract any number from token as fallback
            numbers = re.findall(r'\d+', token)
            if numbers:
                user_id = int(numbers[0])
            else:
                return None

        return _get_user_from_db(user_id)

    except Exception:
        return None


def _get_admin_from_token(token):
    """Get admin user data from admin token."""
    try:
        admin_id = int(token.split('admin_token_', 1)[1])
    except (ValueError, IndexError):
        return None

    try:
        conn = db_manager.get_connection()
        if conn is None:
            return None

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
            cur.execute(
                "SELECT id, email, name, role, permissions FROM admins WHERE id = ? AND is_active = 1",
                (admin_id,)
            )
            row = cur.fetchone()
            conn.close()

        if row:
            return {
                'id': row[0],
                'email': row[1],
                'name': row[2],
                'role': row[3],
                'dashboard': 'admin',
                'permissions': row[4] if row[4] else '{}'
            }
        return None

    except Exception:
        return None


def _get_user_from_db(user_id):
    """Get user data from database by user ID."""
    try:
        conn = db_manager.get_connection()
        if conn is None:
            return None

        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("SELECT id, email, name, account_type, account_number FROM users WHERE id = :user_id"),
                {'user_id': user_id}
            )
            row = result.fetchone()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute(
                "SELECT id, email, name, account_type, account_number FROM users WHERE id = ?",
                (user_id,)
            )
            row = cur.fetchone()
            conn.close()

        if row:
            return {
                'id': row[0],
                'email': row[1],
                'name': row[2],
                'role': row[3],
                'dashboard': row[3],
                'account_number': row[4]
            }

        # Return basic user object if not in database (for local testing)
        return {
            'id': user_id,
            'email': f'user{user_id}@kamioi.com',
            'name': f'User {user_id}',
            'role': 'user',
            'dashboard': 'user'
        }

    except Exception:
        # Return basic user on error
        return {
            'id': user_id,
            'email': f'user{user_id}@kamioi.com',
            'name': f'User {user_id}',
            'role': 'user',
            'dashboard': 'user'
        }


def require_role(required_role):
    """
    Check if authenticated user has the required role.

    Admins and superadmins can access all roles.

    Args:
        required_role: The role required to access the resource

    Returns:
        tuple: (success: bool, user_or_error_response)
               If success=True, second element is user dict
               If success=False, second element is (response, status_code)
    """
    try:
        user = get_auth_user()
        if not user:
            return False, (jsonify({'success': False, 'error': 'Unauthorized'}), 401)

        user_role = user.get('role')

        # Admins and superadmins can access all roles
        if user_role in ['admin', 'superadmin']:
            return True, user

        # Allow 'individual' and 'business' users to access 'user' endpoints
        if required_role == 'user' and user_role in ['individual', 'business', 'family']:
            return True, user
        elif user_role != required_role:
            return False, (jsonify({'success': False, 'error': 'Forbidden'}), 403)

        return True, user

    except Exception as e:
        return False, (jsonify({'success': False, 'error': f'Authentication error: {str(e)}'}), 500)


def require_auth(func):
    """
    Decorator to require authentication on a route.

    Usage:
        @bp.route('/protected')
        @require_auth
        def protected_route():
            user = get_auth_user()
            ...
    """
    from functools import wraps

    @wraps(func)
    def decorated(*args, **kwargs):
        user = get_auth_user()
        if not user:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        return func(*args, **kwargs)

    return decorated
