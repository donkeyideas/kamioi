"""
Rate Limiting Service for Kamioi
Configurable rate limits for different endpoint types.
"""

import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


# Rate limit configuration
RATE_LIMIT_STORAGE = os.getenv('RATE_LIMIT_STORAGE_URL', 'memory://')
RATE_LIMIT_DEFAULT = os.getenv('RATE_LIMIT_DEFAULT', '200 per hour')
RATE_LIMIT_AUTH = '5 per minute'
RATE_LIMIT_ADMIN_AUTH = '3 per minute'
RATE_LIMIT_PASSWORD_RESET = '3 per hour'
RATE_LIMIT_API = '60 per minute'
RATE_LIMIT_ADMIN_API = '120 per minute'


def init_limiter(app):
    """Initialize Flask-Limiter on the Flask app."""
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        storage_uri=RATE_LIMIT_STORAGE,
        default_limits=[RATE_LIMIT_DEFAULT],
        strategy='fixed-window',
    )
    # Store on app for blueprint access
    app.extensions['limiter'] = limiter
    return limiter


def get_limiter(app):
    """Get the limiter instance from the app."""
    return app.extensions.get('limiter')
