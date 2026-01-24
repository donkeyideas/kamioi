# Business Dashboard Implementation & Testing Guide

## Overview
This guide provides step-by-step instructions for implementing, testing, and verifying all Business Dashboard endpoints are properly connected to the database and admin dashboard.

---

## Table of Contents
1. [Pre-Implementation Checklist](#pre-implementation-checklist)
2. [Endpoint Implementation Guide](#endpoint-implementation-guide)
3. [Database Schema Requirements](#database-schema-requirements)
4. [Authentication Setup](#authentication-setup)
5. [Testing Procedures](#testing-procedures)
6. [Admin Dashboard Integration](#admin-dashboard-integration)
7. [Error Handling Requirements](#error-handling-requirements)
8. [Performance Considerations](#performance-considerations)

---

## Pre-Implementation Checklist

### Backend Requirements
- [ ] Flask/FastAPI backend server running on port 5111
- [ ] Database connection pool configured
- [ ] Authentication middleware in place
- [ ] CORS configured for frontend origin
- [ ] Logging system configured
- [ ] Error handling middleware

### Database Requirements
- [ ] Database server running and accessible
- [ ] Business-related tables created (see schema section)
- [ ] Foreign key relationships established
- [ ] Indexes created for performance
- [ ] Migration system in place

### Security Requirements
- [ ] JWT token validation
- [ ] Role-based access control (RBAC)
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] Rate limiting configured

---

## Endpoint Implementation Guide

### Base Route Structure
All business endpoints should follow this structure:
```
/api/business/{resource}/{action?}
```

### Common Response Format
```python
{
    "success": True/False,
    "message": "Optional message",
    "data": {},  # or array
    "error": "Error message if success is False"
}
```

### Authentication Middleware
All endpoints must verify JWT token:
```python
@business_bp.before_request
def verify_token():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_jwt_token(token):
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    request.current_user = get_user_from_token(token)
```

---

## Database Schema Requirements

### Required Tables

#### 1. business_overview_metrics
```sql
CREATE TABLE business_overview_metrics (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    monthly_revenue DECIMAL(15,2) DEFAULT 0,
    revenue_growth DECIMAL(5,2) DEFAULT 0,
    total_employees INTEGER DEFAULT 0,
    active_projects INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    client_satisfaction INTEGER DEFAULT 0,
    team_productivity INTEGER DEFAULT 0,
    monthly_expenses DECIMAL(15,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    cash_flow DECIMAL(15,2) DEFAULT 0,
    roi DECIMAL(5,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX idx_business_overview_business_id ON business_overview_metrics(business_id);
```

#### 2. business_transactions
```sql
CREATE TABLE business_transactions (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    description TEXT,
    merchant VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    round_up DECIMAL(10,2) DEFAULT 0,
    category VARCHAR(100),
    ticker VARCHAR(10),
    status VARCHAR(50) DEFAULT 'pending',
    ai_confidence INTEGER,
    suggested_stock VARCHAR(10),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX idx_business_transactions_business_id ON business_transactions(business_id);
CREATE INDEX idx_business_transactions_status ON business_transactions(status);
CREATE INDEX idx_business_transactions_date ON business_transactions(date);
```

#### 3. business_team_members
```sql
CREATE TABLE business_team_members (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'employee',
    status VARCHAR(50) DEFAULT 'active',
    portfolio_value DECIMAL(15,2) DEFAULT 0,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX idx_business_team_business_id ON business_team_members(business_id);
CREATE INDEX idx_business_team_email ON business_team_members(email);
CREATE INDEX idx_business_team_status ON business_team_members(status);
```

#### 4. business_goals
```sql
CREATE TABLE business_goals (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target DECIMAL(15,2) NOT NULL,
    current DECIMAL(15,2) DEFAULT 0,
    department VARCHAR(100),
    deadline DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX idx_business_goals_business_id ON business_goals(business_id);
CREATE INDEX idx_business_goals_status ON business_goals(status);
CREATE INDEX idx_business_goals_deadline ON business_goals(deadline);
```

#### 5. business_settings
```sql
CREATE TABLE business_settings (
    id SERIAL PRIMARY KEY,
    business_id INTEGER UNIQUE NOT NULL,
    roundup_multiplier DECIMAL(3,2) DEFAULT 1.0,
    theme VARCHAR(20) DEFAULT 'dark',
    auto_invest BOOLEAN DEFAULT FALSE,
    notifications BOOLEAN DEFAULT FALSE,
    email_alerts BOOLEAN DEFAULT FALSE,
    business_sharing BOOLEAN DEFAULT FALSE,
    budget_alerts BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_business_settings_business_id ON business_settings(business_id);
```

#### 6. business_account_settings
```sql
CREATE TABLE business_account_settings (
    id SERIAL PRIMARY KEY,
    business_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    company_name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_business_account_business_id ON business_account_settings(business_id);
```

#### 7. business_security_settings
```sql
CREATE TABLE business_security_settings (
    id SERIAL PRIMARY KEY,
    business_id INTEGER UNIQUE NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    password_expiry_days INTEGER DEFAULT 90,
    session_timeout_minutes INTEGER DEFAULT 30,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_business_security_business_id ON business_security_settings(business_id);
```

#### 8. business_notification_settings
```sql
CREATE TABLE business_notification_settings (
    id SERIAL PRIMARY KEY,
    business_id INTEGER UNIQUE NOT NULL,
    email_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT FALSE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    transaction_alerts BOOLEAN DEFAULT FALSE,
    budget_alerts BOOLEAN DEFAULT FALSE,
    investment_alerts BOOLEAN DEFAULT FALSE,
    team_updates BOOLEAN DEFAULT FALSE,
    weekly_reports BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_business_notif_settings_business_id ON business_notification_settings(business_id);
```

#### 9. business_data_settings
```sql
CREATE TABLE business_data_settings (
    id SERIAL PRIMARY KEY,
    business_id INTEGER UNIQUE NOT NULL,
    auto_backup BOOLEAN DEFAULT FALSE,
    backup_frequency VARCHAR(50) DEFAULT 'daily',
    data_retention_days INTEGER DEFAULT 365,
    export_format VARCHAR(10) DEFAULT 'csv',
    data_sharing BOOLEAN DEFAULT FALSE,
    analytics_tracking BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_business_data_business_id ON business_data_settings(business_id);
```

#### 10. business_bank_connections
```sql
CREATE TABLE business_bank_connections (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    account_id VARCHAR(255),
    bank_name VARCHAR(255),
    institution_name VARCHAR(255),
    account_type VARCHAR(50),
    account_number VARCHAR(50),
    masked_account_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX idx_business_bank_business_id ON business_bank_connections(business_id);
CREATE INDEX idx_business_bank_status ON business_bank_connections(status);
```

#### 11. business_notifications
```sql
CREATE TABLE business_notifications (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX idx_business_notif_business_id ON business_notifications(business_id);
CREATE INDEX idx_business_notif_read ON business_notifications(read);
CREATE INDEX idx_business_notif_created ON business_notifications(created_at);
```

#### 12. business_reports
```sql
CREATE TABLE business_reports (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    period VARCHAR(50),
    period_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'generating',
    format VARCHAR(10) DEFAULT 'PDF',
    size VARCHAR(20),
    download_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX idx_business_reports_business_id ON business_reports(business_id);
CREATE INDEX idx_business_reports_status ON business_reports(status);
CREATE INDEX idx_business_reports_type ON business_reports(type);
```

#### 13. business_analytics_cache
```sql
CREATE TABLE business_analytics_cache (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    performance_data JSONB,
    revenue_data JSONB,
    trends_data JSONB,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX idx_business_analytics_business_id ON business_analytics_cache(business_id);
CREATE INDEX idx_business_analytics_expires ON business_analytics_cache(expires_at);
```

---

## Authentication Setup

### JWT Token Validation
```python
import jwt
from functools import wraps

def verify_jwt_token(token):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return decoded
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_from_token(token):
    decoded = verify_jwt_token(token)
    if decoded:
        user_id = decoded.get('user_id')
        # Fetch user from database
        return get_user_by_id(user_id)
    return None

def require_business_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user = get_user_from_token(token)
        
        if not user:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        
        # Verify user has business access
        business_id = kwargs.get('business_id') or request.json.get('business_id')
        if not has_business_access(user.id, business_id):
            return jsonify({"success": False, "error": "Forbidden"}), 403
        
        request.current_user = user
        request.business_id = business_id
        return f(*args, **kwargs)
    return decorated_function
```

---

## Testing Procedures

### Manual Testing Checklist

#### Overview Page Testing
```bash
# Test GET /api/business/dashboard/overview
curl -X GET "http://127.0.0.1:5111/api/business/dashboard/overview" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected: 200 OK with dashboard data
# Verify:
- [ ] Returns all required metrics
- [ ] Data is current (updated_at is recent)
- [ ] All numeric fields are properly formatted
- [ ] Recent activities array is included
```

#### Transactions Page Testing
```bash
# Test GET /api/business/ai/insights
curl -X GET "http://127.0.0.1:5111/api/business/ai/insights" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test POST /api/transactions/process
curl -X POST "http://127.0.0.1:5111/api/transactions/process" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "123", "description": "Test transaction", "amount": 100, "merchantName": "Test Merchant"}'

# Test GET /api/lookup/ticker
curl -X GET "http://127.0.0.1:5111/api/lookup/ticker?company=Apple" \
  -H "Content-Type: application/json"

# Test POST /api/business/submit-mapping
curl -X POST "http://127.0.0.1:5111/api/business/submit-mapping" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": "123", "merchant": "Test", "company_name": "Test Inc", "ticker": "TEST", "category": "Tech", "confidence": "High"}'

# Test GET /api/business/export/transactions
curl -X GET "http://127.0.0.1:5111/api/business/export/transactions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Team Page Testing
```bash
# Test GET /api/business/team/members
curl -X GET "http://127.0.0.1:5111/api/business/team/members" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test POST /api/business/team/members
curl -X POST "http://127.0.0.1:5111/api/business/team/members" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "role": "employee", "permissions": []}'

# Test PUT /api/business/team/members/{id}
curl -X PUT "http://127.0.0.1:5111/api/business/team/members/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe Updated", "role": "manager"}'

# Test DELETE /api/business/team/members/{id}
curl -X DELETE "http://127.0.0.1:5111/api/business/team/members/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Automated Testing Script

Create `test_business_endpoints.py`:
```python
import requests
import json

BASE_URL = "http://127.0.0.1:5111"
TOKEN = "YOUR_TEST_TOKEN"

def test_endpoint(method, endpoint, data=None, expected_status=200):
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.request(method, url, headers=headers, json=data)
    
    print(f"\n{method} {endpoint}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}"
    assert response.json().get('success') == True, "Response should have success=true"
    
    return response.json()

# Test all endpoints
if __name__ == "__main__":
    # Overview
    test_endpoint("GET", "/api/business/dashboard/overview")
    
    # Team
    test_endpoint("GET", "/api/business/team/members")
    member = test_endpoint("POST", "/api/business/team/members", {
        "name": "Test User",
        "email": "test@example.com",
        "role": "employee"
    })
    test_endpoint("PUT", f"/api/business/team/members/{member['data']['id']}", {
        "name": "Test User Updated"
    })
    test_endpoint("DELETE", f"/api/business/team/members/{member['data']['id']}")
    
    # Goals
    test_endpoint("GET", "/api/business/goals")
    goal = test_endpoint("POST", "/api/business/goals", {
        "name": "Test Goal",
        "target": 10000,
        "current": 0
    })
    test_endpoint("PUT", f"/api/business/goals/{goal['data']['id']}", {
        "current": 5000
    })
    test_endpoint("DELETE", f"/api/business/goals/{goal['data']['id']}")
    
    # Settings
    test_endpoint("GET", "/api/business/settings")
    test_endpoint("PUT", "/api/business/settings", {
        "theme": "dark",
        "auto_invest": True
    })
    
    print("\n✅ All tests passed!")
```

---

## Error Handling Requirements

### Standard Error Response Format
```json
{
    "success": false,
    "error": "Error message",
    "message": "Detailed error description",
    "code": "ERROR_CODE"
}
```

### Error Handling Implementation
```python
from flask import jsonify
import traceback

def handle_error(error, status_code=500, message=None):
    error_response = {
        "success": False,
        "error": str(error),
        "message": message or "An error occurred"
    }
    
    # Log error for debugging
    app.logger.error(f"Error: {error}")
    app.logger.error(traceback.format_exc())
    
    return jsonify(error_response), status_code

@app.errorhandler(404)
def not_found(error):
    return handle_error(error, 404, "Resource not found")

@app.errorhandler(401)
def unauthorized(error):
    return handle_error(error, 401, "Unauthorized")

@app.errorhandler(403)
def forbidden(error):
    return handle_error(error, 403, "Forbidden")

@app.errorhandler(500)
def internal_error(error):
    return handle_error(error, 500, "Internal server error")
```

### Database Error Handling
```python
from sqlalchemy.exc import SQLAlchemyError

try:
    result = db.session.query(Business).filter_by(id=business_id).first()
    if not result:
        return jsonify({"success": False, "error": "Business not found"}), 404
    
    db.session.commit()
except SQLAlchemyError as e:
    db.session.rollback()
    app.logger.error(f"Database error: {e}")
    return jsonify({"success": False, "error": "Database error occurred"}), 500
```

---

## Admin Dashboard Integration

### Admin Access Endpoints

Admin should be able to access all business endpoints with an additional parameter or header:

```python
@app.route('/api/admin/businesses/<business_id>/dashboard/overview')
@require_admin_auth
def admin_business_overview(business_id):
    # Admin can view any business's overview
    return get_business_overview(business_id)

@app.route('/api/admin/businesses/<business_id>/team/members')
@require_admin_auth
def admin_business_team(business_id):
    # Admin can view any business's team
    return get_business_team(business_id)
```

### Admin Verification Function
```python
def is_admin(user_id):
    user = get_user_by_id(user_id)
    return user and user.role == 'admin'

def require_admin_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user = get_user_from_token(token)
        
        if not user or not is_admin(user.id):
            return jsonify({"success": False, "error": "Admin access required"}), 403
        
        request.current_admin = user
        return f(*args, **kwargs)
    return decorated_function
```

---

## Performance Considerations

### Caching Strategy
```python
from functools import wraps
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_result(expiration=300):  # 5 minutes default
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            cache_key = f"{f.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Execute function
            result = f(*args, **kwargs)
            
            # Cache result
            redis_client.setex(cache_key, expiration, json.dumps(result))
            
            return result
        return decorated_function
    return decorator

# Usage
@business_bp.route('/dashboard/overview')
@cache_result(expiration=600)  # Cache for 10 minutes
def get_overview():
    # ... fetch data
    return jsonify(result)
```

### Database Query Optimization
- Use indexes on foreign keys and frequently queried columns
- Implement pagination for list endpoints
- Use SELECT only required columns
- Implement connection pooling

### Pagination Example
```python
def paginate_query(query, page=1, per_page=20):
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": [item.to_dict() for item in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": page,
        "per_page": per_page
    }
```

---

## Validation Requirements

### Input Validation
```python
from marshmallow import Schema, fields, validate, ValidationError

class BusinessGoalSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    target = fields.Decimal(required=True, validate=validate.Range(min=0))
    current = fields.Decimal(validate=validate.Range(min=0))
    department = fields.Str(validate=validate.Length(max=100))
    deadline = fields.Date()
    status = fields.Str(validate=validate.OneOf(['pending', 'in_progress', 'completed']))

def validate_request(schema):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                data = schema.load(request.json)
                request.validated_data = data
                return f(*args, **kwargs)
            except ValidationError as err:
                return jsonify({
                    "success": False,
                    "error": "Validation error",
                    "messages": err.messages
                }), 400
        return decorated_function
    return decorator

# Usage
@business_bp.route('/goals', methods=['POST'])
@validate_request(BusinessGoalSchema())
def create_goal():
    data = request.validated_data
    # ... create goal
```

---

## Deployment Checklist

- [ ] All endpoints implemented and tested
- [ ] Database schema created and migrated
- [ ] Authentication middleware working
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Caching strategy implemented (if applicable)
- [ ] Rate limiting configured
- [ ] CORS configured
- [ ] Environment variables set
- [ ] Database backups configured
- [ ] Monitoring and alerts set up
- [ ] Documentation updated

---

## Support & Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check token validity and expiration
2. **404 Not Found**: Verify endpoint URL and route registration
3. **500 Internal Server Error**: Check server logs and database connectivity
4. **CORS Errors**: Verify CORS configuration allows frontend origin
5. **Database Connection Errors**: Check database credentials and connection pool

### Debug Endpoints

Add these for development/debugging:
```python
@business_bp.route('/debug/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "database": check_database_connection(),
        "timestamp": datetime.utcnow().isoformat()
    })
```

---

## Conclusion

Follow this guide systematically to ensure all Business Dashboard endpoints are properly implemented, tested, and integrated with the database and admin dashboard. Regular testing and monitoring will help maintain system reliability and performance.




