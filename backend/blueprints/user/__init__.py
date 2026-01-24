"""
User Dashboard Blueprint for Kamioi Backend

Handles user dashboard endpoints:
- Transactions
- Portfolio
- Goals
- Notifications
- AI Insights & Recommendations
- Profile
- Round-ups
"""

from flask import Blueprint

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

from . import routes  # Import routes after blueprint creation
