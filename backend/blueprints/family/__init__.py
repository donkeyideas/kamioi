"""
Family Dashboard Blueprint for Kamioi Backend

Handles family account endpoints:
- Transactions
- Portfolio
- Goals
- Notifications
- Members
- Settings
"""

from flask import Blueprint

family_bp = Blueprint('family', __name__, url_prefix='/api/family')

from . import routes  # Import routes after blueprint creation
