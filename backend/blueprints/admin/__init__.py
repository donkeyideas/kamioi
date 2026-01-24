"""
Admin Dashboard Blueprint for Kamioi Backend

Handles admin functionality:
- Admin authentication
- Dashboard overview
- User management
- LLM Center
- Financial analytics
- System settings
"""

from flask import Blueprint

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

from . import routes  # Import routes after blueprint creation
