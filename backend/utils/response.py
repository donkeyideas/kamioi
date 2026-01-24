"""
Standardized API Response Utilities for Kamioi Backend

All API endpoints should use these functions to ensure consistent response formats.

Standard response format:
{
    "success": true/false,
    "data": {...} or [...],      # The actual response data
    "message": "...",            # Optional human-readable message
    "error": "...",              # Error message (only on failure)
    "meta": {                    # Optional metadata (pagination, etc.)
        "total": 100,
        "page": 1,
        "per_page": 20,
        "total_pages": 5
    }
}
"""

from flask import jsonify


def success_response(data=None, message=None, meta=None, status_code=200):
    """
    Return a successful API response.

    Args:
        data: The response data (dict, list, or None)
        message: Optional success message
        meta: Optional metadata dict (pagination, etc.)
        status_code: HTTP status code (default 200)

    Returns:
        Flask response with JSON body

    Example:
        return success_response(
            data={'user': user_dict},
            message='User created successfully'
        )
    """
    response = {'success': True}

    if data is not None:
        response['data'] = data

    if message:
        response['message'] = message

    if meta:
        response['meta'] = meta

    return jsonify(response), status_code


def error_response(error, status_code=400, details=None):
    """
    Return an error API response.

    Args:
        error: Error message string
        status_code: HTTP status code (default 400)
        details: Optional additional error details

    Returns:
        Flask response with JSON body and error status code

    Example:
        return error_response('Invalid email format', 400)
        return error_response('User not found', 404)
        return error_response('Server error', 500, details={'trace': str(e)})
    """
    response = {
        'success': False,
        'error': error
    }

    if details:
        response['details'] = details

    return jsonify(response), status_code


def paginated_response(items, total, page, per_page, message=None):
    """
    Return a paginated API response.

    Args:
        items: List of items for the current page
        total: Total number of items across all pages
        page: Current page number (1-indexed)
        per_page: Number of items per page
        message: Optional message

    Returns:
        Flask response with JSON body including pagination metadata

    Example:
        transactions = get_transactions(page=2, per_page=20)
        return paginated_response(
            items=[t.to_dict() for t in transactions],
            total=150,
            page=2,
            per_page=20
        )
    """
    total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0

    return success_response(
        data=items,
        message=message,
        meta={
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        }
    )


def validation_error(errors):
    """
    Return a validation error response with field-specific errors.

    Args:
        errors: Dict of field names to error messages

    Returns:
        Flask response with 400 status code

    Example:
        return validation_error({
            'email': 'Invalid email format',
            'password': 'Password must be at least 8 characters'
        })
    """
    return jsonify({
        'success': False,
        'error': 'Validation failed',
        'validation_errors': errors
    }), 400


def unauthorized_response(message='Unauthorized'):
    """
    Return an unauthorized (401) response.

    Args:
        message: Error message (default 'Unauthorized')

    Returns:
        Flask response with 401 status code
    """
    return error_response(message, 401)


def forbidden_response(message='Forbidden'):
    """
    Return a forbidden (403) response.

    Args:
        message: Error message (default 'Forbidden')

    Returns:
        Flask response with 403 status code
    """
    return error_response(message, 403)


def not_found_response(message='Not found'):
    """
    Return a not found (404) response.

    Args:
        message: Error message (default 'Not found')

    Returns:
        Flask response with 404 status code
    """
    return error_response(message, 404)
