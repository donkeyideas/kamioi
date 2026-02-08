"""
Authentication Routes

Handles user and admin authentication endpoints:
- POST /api/user/auth/login
- POST /api/user/auth/logout
- GET  /api/user/auth/me
- POST /api/user/auth/forgot-password
- POST /api/user/auth/verify-reset-token
- POST /api/user/auth/reset-password
- POST /api/admin/auth/login
- POST /api/admin/auth/logout
- GET  /api/admin/auth/me
"""

import secrets
from datetime import datetime
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from . import auth_bp
from .helpers import get_auth_user
from database_manager import db_manager
from utils.response import success_response, error_response, unauthorized_response


# =============================================================================
# USER AUTHENTICATION ROUTES
# =============================================================================

@auth_bp.route('/user/auth/login', methods=['POST'])
def user_login():
    """Authenticate a user and return a token."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return error_response('Email and password are required', 400)

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("SELECT id, email, name, account_type, password, account_number FROM users WHERE LOWER(email) = LOWER(:email)"),
                {'email': email}
            )
            row = result.fetchone()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute(
                "SELECT id, email, name, account_type, password, account_number FROM users WHERE email = ?",
                (email,)
            )
            row = cur.fetchone()
            conn.close()

        if not row:
            return error_response('Invalid email or password', 401)

        stored_password = row[4]
        password_valid = False
        needs_hash_upgrade = False

        # Check if password is hashed (werkzeug), SHA256, or plaintext
        if stored_password and (stored_password.startswith('pbkdf2:') or stored_password.startswith('scrypt:')):
            password_valid = check_password_hash(stored_password, password)
        elif stored_password and len(stored_password) == 64:
            # SHA256 hash (used by app_clean.py)
            import hashlib
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            password_valid = (stored_password == password_hash)
        else:
            # Legacy plaintext password
            password_valid = (stored_password == password)
            if password_valid:
                needs_hash_upgrade = True

        if not password_valid:
            return error_response('Invalid email or password', 401)

        # Upgrade plaintext password to hash
        if needs_hash_upgrade:
            _upgrade_password_hash(row[0], password, 'users')

        user = {
            'id': row[0],
            'email': row[1],
            'name': row[2],
            'role': row[3],
            'dashboard': row[3],
            'account_number': row[5]
        }

        return success_response(
            data={'token': f'token_{row[0]}', 'user': user},
            message='Login successful'
        )

    except Exception as e:
        return error_response('Login failed', 500)


@auth_bp.route('/user/auth/logout', methods=['POST'])
def user_logout():
    """Log out the current user."""
    return success_response(message='Logged out successfully')


@auth_bp.route('/user/auth/me', methods=['GET'])
def user_auth_me():
    """Get the currently authenticated user."""
    user = get_auth_user()
    if not user:
        return unauthorized_response()
    return success_response(data={'user': user})


# =============================================================================
# PASSWORD RESET ROUTES
# =============================================================================

@auth_bp.route('/user/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Request a password reset token."""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()

        if not email:
            return error_response('Email is required', 400)

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("SELECT id, name, email FROM users WHERE LOWER(email) = LOWER(:email)"),
                {'email': email}
            )
            user = result.fetchone()
        else:
            cur = conn.cursor()
            cur.execute("SELECT id, name, email FROM users WHERE email = ?", (email,))
            user = cur.fetchone()

        if not user:
            if use_postgresql:
                db_manager.release_connection(conn)
            else:
                conn.close()
            return error_response('No account found with this email address', 404)

        # Generate secure reset token
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.now().timestamp() + 3600  # 1 hour

        # Store reset token
        if use_postgresql:
            conn.execute(
                text("""
                    INSERT INTO password_reset_tokens (email, token, expires_at, created_at)
                    VALUES (:email, :token, :expires_at, :created_at)
                    ON CONFLICT (email) DO UPDATE SET token = :token, expires_at = :expires_at, created_at = :created_at
                """),
                {'email': email, 'token': reset_token, 'expires_at': expires_at, 'created_at': datetime.now().isoformat()}
            )
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cur.execute("""
                INSERT OR REPLACE INTO password_reset_tokens (email, token, expires_at, created_at)
                VALUES (?, ?, ?, ?)
            """, (email, reset_token, expires_at, datetime.now().isoformat()))
            conn.commit()
            conn.close()

        # In production, send email instead of returning token
        return success_response(
            message='Password reset instructions sent to your email',
            data={'reset_link': f'/reset-password?token={reset_token}', 'token': reset_token}  # Remove in production
        )

    except Exception as e:
        return error_response(str(e), 500)


@auth_bp.route('/user/auth/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """Verify a password reset token is valid."""
    try:
        data = request.get_json()
        token = data.get('token', '').strip()

        if not token:
            return error_response('Reset token is required', 400)

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("SELECT email, expires_at FROM password_reset_tokens WHERE token = :token AND expires_at > :now"),
                {'token': token, 'now': datetime.now().timestamp()}
            )
            row = result.fetchone()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute(
                "SELECT email, expires_at FROM password_reset_tokens WHERE token = ? AND expires_at > ?",
                (token, datetime.now().timestamp())
            )
            row = cur.fetchone()
            conn.close()

        if not row:
            return error_response('Invalid or expired reset token', 400)

        return success_response(
            message='Reset token is valid',
            data={'email': row[0]}
        )

    except Exception as e:
        return error_response(str(e), 500)


@auth_bp.route('/user/auth/reset-password', methods=['POST'])
def reset_password():
    """Reset password using a valid reset token."""
    try:
        data = request.get_json()
        token = data.get('token', '').strip()
        new_password = data.get('password', '').strip()

        if not token or not new_password:
            return error_response('Token and new password are required', 400)

        if len(new_password) < 6:
            return error_response('Password must be at least 6 characters long', 400)

        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        # Verify token
        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("SELECT email FROM password_reset_tokens WHERE token = :token AND expires_at > :now"),
                {'token': token, 'now': datetime.now().timestamp()}
            )
            row = result.fetchone()
        else:
            cur = conn.cursor()
            cur.execute(
                "SELECT email FROM password_reset_tokens WHERE token = ? AND expires_at > ?",
                (token, datetime.now().timestamp())
            )
            row = cur.fetchone()

        if not row:
            if use_postgresql:
                db_manager.release_connection(conn)
            else:
                conn.close()
            return error_response('Invalid or expired reset token', 400)

        email = row[0]
        hashed_password = generate_password_hash(new_password)

        # Update password and delete token
        if use_postgresql:
            conn.execute(
                text("UPDATE users SET password = :password WHERE LOWER(email) = LOWER(:email)"),
                {'password': hashed_password, 'email': email}
            )
            conn.execute(text("DELETE FROM password_reset_tokens WHERE token = :token"), {'token': token})
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cur.execute("UPDATE users SET password = ? WHERE email = ?", (hashed_password, email))
            cur.execute("DELETE FROM password_reset_tokens WHERE token = ?", (token,))
            conn.commit()
            conn.close()

        return success_response(message='Password has been reset successfully')

    except Exception as e:
        return error_response(str(e), 500)


# =============================================================================
# ADMIN AUTHENTICATION ROUTES
# =============================================================================

@auth_bp.route('/admin/auth/login', methods=['POST'])
def admin_login():
    """Authenticate an admin user."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return error_response('Email and password are required', 400)

    try:
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            result = conn.execute(
                text("SELECT id, email, password, name, role FROM admins WHERE LOWER(email) = LOWER(:email) AND is_active = true"),
                {'email': email}
            )
            row = result.fetchone()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute(
                "SELECT id, email, password, name, role FROM admins WHERE email = ? AND is_active = 1",
                (email,)
            )
            row = cur.fetchone()
            conn.close()

        if not row:
            return error_response('Invalid email or password', 401)

        stored_password = row[2]
        password_valid = False
        needs_hash_upgrade = False

        # Check if password is hashed (werkzeug), SHA256, or plaintext
        if stored_password and (stored_password.startswith('pbkdf2:') or stored_password.startswith('scrypt:')):
            password_valid = check_password_hash(stored_password, password)
        elif stored_password and len(stored_password) == 64:
            # SHA256 hash (used by app_clean.py)
            import hashlib
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            password_valid = (stored_password == password_hash)
        else:
            password_valid = (stored_password == password)
            if password_valid:
                needs_hash_upgrade = True

        if not password_valid:
            return error_response('Invalid email or password', 401)

        # Upgrade plaintext password to hash
        if needs_hash_upgrade:
            _upgrade_password_hash(row[0], password, 'admins')

        admin = {
            'id': row[0],
            'email': row[1],
            'name': row[3],
            'role': row[4],
            'dashboard': 'admin',
            'permissions': '{}'
        }

        return success_response(
            data={'token': f'admin_token_{row[0]}', 'user': admin},
            message='Admin login successful'
        )

    except Exception as e:
        return error_response('Admin login failed', 500)


@auth_bp.route('/admin/auth/logout', methods=['POST'])
def admin_logout():
    """Log out the current admin."""
    return success_response(message='Admin logged out successfully')


@auth_bp.route('/admin/auth/me', methods=['GET'])
def admin_auth_me():
    """Get the currently authenticated admin."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return unauthorized_response()

    token = auth.split(' ', 1)[1].strip()
    if not token.startswith('admin_token_'):
        return error_response('Invalid admin token', 401)

    try:
        admin_id = int(token.split('admin_token_', 1)[1])
    except (ValueError, IndexError):
        return error_response('Invalid admin token format', 401)

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
            cur.execute(
                "SELECT id, email, name, role, permissions FROM admins WHERE id = ? AND is_active = 1",
                (admin_id,)
            )
            row = cur.fetchone()
            conn.close()

        if not row:
            return unauthorized_response('Admin not found')

        admin = {
            'id': row[0],
            'email': row[1],
            'name': row[2],
            'role': row[3],
            'dashboard': 'admin',
            'permissions': row[4] if row[4] else '{}'
        }

        return success_response(data={'user': admin})

    except Exception as e:
        return error_response('Failed to get admin info', 500)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _upgrade_password_hash(user_id, password, table='users'):
    """Upgrade a plaintext password to a hashed version."""
    try:
        hashed = generate_password_hash(password)
        conn = db_manager.get_connection()
        use_postgresql = getattr(db_manager, '_use_postgresql', False)

        if use_postgresql:
            from sqlalchemy import text
            conn.execute(
                text(f"UPDATE {table} SET password = :password WHERE id = :id"),
                {'password': hashed, 'id': user_id}
            )
            conn.commit()
            db_manager.release_connection(conn)
        else:
            cur = conn.cursor()
            cur.execute(f"UPDATE {table} SET password = ? WHERE id = ?", (hashed, user_id))
            conn.commit()
            conn.close()
    except Exception:
        pass  # Silently fail - password upgrade is not critical
