# Family Dashboard Implementation & Testing Guide

## Overview
This guide provides step-by-step instructions for implementing, testing, and verifying all Family Dashboard endpoints are properly connected to the database and admin dashboard.

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
- [ ] Family-related tables created (see schema section)
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
All family endpoints should follow this structure:
```
/api/family/{resource}/{action?}
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
@family_bp.before_request
def verify_token():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_jwt_token(token):
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    request.current_user = get_user_from_token(token)
```

---

## Database Schema Requirements

### Required Tables

#### 1. families
```sql
CREATE TABLE families (
    id SERIAL PRIMARY KEY,
    family_name VARCHAR(255) NOT NULL,
    guardian_email VARCHAR(255) NOT NULL,
    family_code VARCHAR(50) UNIQUE,
    phone VARCHAR(50),
    address JSONB,
    family_size INTEGER DEFAULT 1,
    round_up_preference DECIMAL(3,2) DEFAULT 1.0,
    investment_goal TEXT,
    risk_preference VARCHAR(50),
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_families_guardian_email ON families(guardian_email);
CREATE INDEX idx_families_family_code ON families(family_code);
```

#### 2. family_members
```sql
CREATE TABLE family_members (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    user_id INTEGER,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'child',
    status VARCHAR(50) DEFAULT 'pending',
    permissions VARCHAR(50) DEFAULT 'view',
    portfolio_value DECIMAL(15,2) DEFAULT 0,
    last_active TIMESTAMP,
    joined_at TIMESTAMP,
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_email ON family_members(email);
CREATE INDEX idx_family_members_status ON family_members(status);
```

#### 3. family_portfolio
```sql
CREATE TABLE family_portfolio (
    id SERIAL PRIMARY KEY,
    family_id INTEGER UNIQUE NOT NULL,
    total_value DECIMAL(15,2) DEFAULT 0,
    total_invested DECIMAL(15,2) DEFAULT 0,
    total_gains DECIMAL(15,2) DEFAULT 0,
    gain_percentage DECIMAL(5,2) DEFAULT 0,
    today_gain DECIMAL(15,2) DEFAULT 0,
    today_gain_percentage DECIMAL(5,2) DEFAULT 0,
    roi DECIMAL(5,2) DEFAULT 0,
    cash_available DECIMAL(15,2) DEFAULT 0,
    ytd_return DECIMAL(15,2) DEFAULT 0,
    ytd_return_percentage DECIMAL(5,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_family_portfolio_family_id ON family_portfolio(family_id);
```

#### 4. family_portfolio_holdings
```sql
CREATE TABLE family_portfolio_holdings (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    shares DECIMAL(15,4) NOT NULL,
    value DECIMAL(15,2) DEFAULT 0,
    gain DECIMAL(15,2) DEFAULT 0,
    gain_percentage DECIMAL(5,2) DEFAULT 0,
    purchase_price DECIMAL(10,2),
    current_price DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE INDEX idx_family_holdings_family_id ON family_portfolio_holdings(family_id);
CREATE INDEX idx_family_holdings_ticker ON family_portfolio_holdings(ticker);
```

#### 5. family_goals
```sql
CREATE TABLE family_goals (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'amount',
    target DECIMAL(15,2) NOT NULL,
    current DECIMAL(15,2) DEFAULT 0,
    timeframe INTEGER DEFAULT 12,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    progress DECIMAL(5,2) DEFAULT 0,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE INDEX idx_family_goals_family_id ON family_goals(family_id);
CREATE INDEX idx_family_goals_status ON family_goals(status);
CREATE INDEX idx_family_goals_end_date ON family_goals(end_date);
```

#### 6. family_transactions
```sql
CREATE TABLE family_transactions (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    user_id INTEGER,
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
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_family_transactions_family_id ON family_transactions(family_id);
CREATE INDEX idx_family_transactions_status ON family_transactions(status);
CREATE INDEX idx_family_transactions_date ON family_transactions(date);
```

#### 7. family_ai_mappings
```sql
CREATE TABLE family_ai_mappings (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    transaction_id INTEGER,
    mapping_id VARCHAR(50) UNIQUE,
    merchant VARCHAR(255),
    company_name VARCHAR(255),
    ticker VARCHAR(10),
    category VARCHAR(100),
    confidence VARCHAR(50),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES family_transactions(id) ON DELETE CASCADE
);

CREATE INDEX idx_family_mappings_family_id ON family_ai_mappings(family_id);
CREATE INDEX idx_family_mappings_transaction_id ON family_ai_mappings(transaction_id);
CREATE INDEX idx_family_mappings_status ON family_ai_mappings(status);
```

#### 8. family_notifications
```sql
CREATE TABLE family_notifications (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_family_notif_family_id ON family_notifications(family_id);
CREATE INDEX idx_family_notif_read ON family_notifications(read);
CREATE INDEX idx_family_notif_created ON family_notifications(created_at);
```

#### 9. family_statements
```sql
CREATE TABLE family_statements (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    period VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'generating',
    format VARCHAR(10) DEFAULT 'PDF',
    size VARCHAR(20),
    transactions INTEGER DEFAULT 0,
    round_ups DECIMAL(15,2) DEFAULT 0,
    investments DECIMAL(15,2) DEFAULT 0,
    download_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE INDEX idx_family_statements_family_id ON family_statements(family_id);
CREATE INDEX idx_family_statements_period ON family_statements(period);
CREATE INDEX idx_family_statements_status ON family_statements(status);
```

#### 10. family_ai_insights
```sql
CREATE TABLE family_ai_insights (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    accuracy DECIMAL(5,2) DEFAULT 0,
    total_recommendations INTEGER DEFAULT 0,
    accepted_recommendations INTEGER DEFAULT 0,
    rejected_recommendations INTEGER DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE INDEX idx_family_ai_insights_family_id ON family_ai_insights(family_id);
```

#### 11. family_rewards
```sql
CREATE TABLE family_rewards (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'locked',
    unlocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_family_rewards_family_id ON family_rewards(family_id);
CREATE INDEX idx_family_rewards_status ON family_rewards(status);
```

#### 12. family_points
```sql
CREATE TABLE family_points (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL,
    user_id INTEGER,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    spent_points INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_family_points_family_id ON family_points(family_id);
CREATE INDEX idx_family_points_user_id ON family_points(user_id);
```

#### 13. family_leaderboard
```sql
CREATE TABLE family_leaderboard (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    points INTEGER DEFAULT 0,
    rank INTEGER,
    tier VARCHAR(50),
    avatar TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_family_leaderboard_user_id ON family_leaderboard(user_id);
CREATE INDEX idx_family_leaderboard_points ON family_leaderboard(points DESC);
CREATE INDEX idx_family_leaderboard_rank ON family_leaderboard(rank);
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

def require_family_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user = get_user_from_token(token)
        
        if not user:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        
        # Verify user has family access
        family_id = kwargs.get('family_id') or request.json.get('family_id') or user.family_id
        if not has_family_access(user.id, family_id):
            return jsonify({"success": False, "error": "Forbidden"}), 403
        
        request.current_user = user
        request.family_id = family_id
        return f(*args, **kwargs)
    return decorated_function
```

**Note:** Token storage should be standardized - use `kamioi_user_token` consistently.

---

## Testing Procedures

### Manual Testing Checklist

#### Family Transactions Page Testing
```bash
# Test GET /api/family/ai/insights
curl -X GET "http://127.0.0.1:5111/api/family/ai/insights" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test POST /api/transactions/process
curl -X POST "http://127.0.0.1:5111/api/transactions/process" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "123", "description": "Test transaction", "amount": 100, "merchantName": "Test Merchant"}'

# Test GET /api/lookup/ticker
curl -X GET "http://127.0.0.1:5111/api/lookup/ticker?company=Apple" \
  -H "Content-Type: application/json"

# Test POST /api/family/submit-mapping
curl -X POST "http://127.0.0.1:5111/api/family/submit-mapping" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": "123", "merchant": "Test", "company_name": "Test Inc", "ticker": "TEST", "category": "Tech", "confidence": "High"}'

# Test GET /api/family/export/transactions
curl -X GET "http://127.0.0.1:5111/api/family/export/transactions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Family Dashboard Testing
```bash
# Test GET /api/family/members
curl -X GET "http://127.0.0.1:5111/api/family/members" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test GET /api/family/portfolio
curl -X GET "http://127.0.0.1:5111/api/family/portfolio" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test GET /api/family/goals
curl -X GET "http://127.0.0.1:5111/api/family/goals" \
  -H "Authorization: Bearer YOUR_TOKEN"
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

---

## Admin Dashboard Integration

### Admin Access Endpoints

Admin should be able to access all family endpoints with an additional parameter or header:

```python
@app.route('/api/admin/families/<family_id>/members')
@require_admin_auth
def admin_family_members(family_id):
    # Admin can view any family's members
    return get_family_members(family_id)

@app.route('/api/admin/families/<family_id>/portfolio')
@require_admin_auth
def admin_family_portfolio(family_id):
    # Admin can view any family's portfolio
    return get_family_portfolio(family_id)
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
@family_bp.route('/portfolio')
@cache_result(expiration=600)  # Cache for 10 minutes
def get_portfolio():
    # ... fetch data
    return jsonify(result)
```

---

## Validation Requirements

### Input Validation
```python
from marshmallow import Schema, fields, validate, ValidationError

class FamilyGoalSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    type = fields.Str(validate=validate.OneOf(['amount', 'company', 'count']))
    target = fields.Decimal(required=True, validate=validate.Range(min=0))
    current = fields.Decimal(validate=validate.Range(min=0))
    timeframe = fields.Int(validate=validate.Range(min=1, max=120))
    description = fields.Str(validate=validate.Length(max=1000))
    status = fields.Str(validate=validate.OneOf(['active', 'completed', 'paused', 'cancelled']))

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
- [ ] Token storage standardized (`kamioi_user_token`)

---

## Conclusion

Follow this guide systematically to ensure all Family Dashboard endpoints are properly implemented, tested, and integrated with the database and admin dashboard.




