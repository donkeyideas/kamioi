"""
Business Dashboard Blueprint for Kamioi Backend

Handles business account endpoints:
- Transactions
- Portfolio
- Goals
- Notifications
- Team members
"""

from flask import Blueprint

business_bp = Blueprint('business', __name__, url_prefix='/api/business')

from . import routes  # Import routes after blueprint creation
