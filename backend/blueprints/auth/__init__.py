"""
Authentication Blueprint for Kamioi Backend

Handles:
- User login/logout
- Admin login/logout
- Token parsing and validation
- Password reset flow
- Authentication helper functions
"""

from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/api')

from . import routes  # Import routes after blueprint creation
from .helpers import get_auth_user, require_role, parse_bearer_token_user_id
