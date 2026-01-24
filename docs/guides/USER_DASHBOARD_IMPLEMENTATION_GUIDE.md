# User Dashboard Implementation & Testing Guide

## Overview
This guide provides step-by-step instructions for implementing, testing, and verifying all User Dashboard endpoints are properly connected to the database and admin dashboard.

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
9. [DataContext Integration](#datacontext-integration)

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
- [ ] User-related tables created (see schema section)
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
All user endpoints should follow this structure:
```
/api/user/{resource}/{action?}
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
@user_bp.before_request
def verify_token():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not verify_jwt_token(token):
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    request.current_user = get_user_from_token(token)
```

---

## Database Schema Requirements

### Required Tables

#### 1. users (if not exists)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    country VARCHAR(100),
    timezone VARCHAR(50),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    dob DATE,
    ssn VARCHAR(20),
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    annual_income DECIMAL(15,2),
    employment_status VARCHAR(50),
    employer VARCHAR(255),
    occupation VARCHAR(255),
    round_up_preference DECIMAL(3,2) DEFAULT 1.0,
    round_up_amount DECIMAL(10,2) DEFAULT 1.00,
    investment_goal TEXT,
    risk_preference VARCHAR(50),
    risk_tolerance VARCHAR(50),
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    politically_exposed BOOLEAN DEFAULT FALSE,
    gamification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### 2. user_portfolio
```sql
CREATE TABLE user_portfolio (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    total_value DECIMAL(15,2) DEFAULT 0,
    today_gain DECIMAL(15,2) DEFAULT 0,
    today_gain_percentage DECIMAL(5,2) DEFAULT 0,
    cash_available DECIMAL(15,2) DEFAULT 0,
    ytd_return DECIMAL(15,2) DEFAULT 0,
    ytd_return_percentage DECIMAL(5,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_user_portfolio_user_id ON user_portfolio(user_id);
```

#### 3. user_portfolio_holdings
```sql
CREATE TABLE user_portfolio_holdings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    shares DECIMAL(15,4) NOT NULL,
    value DECIMAL(15,2) DEFAULT 0,
    allocation DECIMAL(5,2) DEFAULT 0,
    gain DECIMAL(15,2) DEFAULT 0,
    gain_percentage DECIMAL(5,2) DEFAULT 0,
    purchase_price DECIMAL(10,2),
    current_price DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_holdings_user_id ON user_portfolio_holdings(user_id);
CREATE INDEX idx_user_holdings_symbol ON user_portfolio_holdings(symbol);
```

#### 4. user_goals
```sql
CREATE TABLE user_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'amount',
    target DECIMAL(15,2) NOT NULL,
    current DECIMAL(15,2) DEFAULT 0,
    timeframe INTEGER DEFAULT 12,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    progress DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_status ON user_goals(status);
```

#### 5. user_transactions
```sql
CREATE TABLE user_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_transactions_user_id ON user_transactions(user_id);
CREATE INDEX idx_user_transactions_status ON user_transactions(status);
CREATE INDEX idx_user_transactions_date ON user_transactions(date);
```

#### 6. user_ai_mappings
```sql
CREATE TABLE user_ai_mappings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    transaction_id INTEGER,
    mapping_id VARCHAR(50) UNIQUE,
    merchant VARCHAR(255),
    merchant_name VARCHAR(255),
    company_name VARCHAR(255),
    ticker VARCHAR(10),
    category VARCHAR(100),
    confidence VARCHAR(50),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    admin_approved INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES user_transactions(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_mappings_user_id ON user_ai_mappings(user_id);
CREATE INDEX idx_user_mappings_transaction_id ON user_ai_mappings(transaction_id);
CREATE INDEX idx_user_mappings_status ON user_ai_mappings(status);
CREATE INDEX idx_user_mappings_mapping_id ON user_ai_mappings(mapping_id);
```

#### 7. user_notifications
```sql
CREATE TABLE user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_notif_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notif_read ON user_notifications(read);
CREATE INDEX idx_user_notif_created ON user_notifications(created_at);
```

#### 8. user_statements
```sql
CREATE TABLE user_statements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    period VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'generating',
    format VARCHAR(10) DEFAULT 'PDF',
    size VARCHAR(20),
    download_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_statements_user_id ON user_statements(user_id);
CREATE INDEX idx_user_statements_period ON user_statements(period);
CREATE INDEX idx_user_statements_status ON user_statements(status);
```

#### 9. user_rewards
```sql
CREATE TABLE user_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'locked',
    unlocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_status ON user_rewards(status);
```

#### 10. user_subscriptions
```sql
CREATE TABLE user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_id VARCHAR(100) NOT NULL,
    account_type VARCHAR(50),
    tier VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    auto_renewal BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
```

#### 11. user_ads
```sql
CREATE TABLE user_ads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    image_url TEXT,
    link_url TEXT,
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_ads_user_id ON user_ads(user_id);
CREATE INDEX idx_user_ads_status ON user_ads(status);
CREATE INDEX idx_user_ads_dates ON user_ads(start_date, end_date);
```

#### 12. messages
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'user',
    read_by JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_channel ON messages(channel);
CREATE INDEX idx_messages_created ON messages(created_at);
```

#### 13. message_channels
```sql
CREATE TABLE message_channels (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_channels_id ON message_channels(channel_id);
CREATE INDEX idx_message_channels_type ON message_channels(type);
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

def require_user_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user = get_user_from_token(token)
        
        if not user:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        
        request.current_user = user
        return f(*args, **kwargs)
    return decorated_function
```

**Note:** Token storage should be standardized - use `kamioi_user_token` consistently.

---

## DataContext Integration

### Fetching Data on Login
Ensure `DataContext` fetches data from API endpoints when user logs in:

```python
# In DataContext or on login
async def loadUserData(userId):
    const [transactions, portfolio, goals, notifications] = await Promise.all([
        fetch('/api/user/transactions'),
        fetch('/api/user/portfolio'),
        fetch('/api/user/goals'),
        fetch('/api/user/notifications')
    ])
    
    // Store in context
    setTransactions(transactions.data)
    setPortfolio(portfolio.data)
    setGoals(goals.data)
    setNotifications(notifications.data)
```

---

## Testing Procedures

### Manual Testing Checklist

#### User Transactions Page Testing
```bash
# Test GET /api/user/ai/insights
curl -X GET "http://127.0.0.1:5111/api/user/ai/insights" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test POST /api/transactions/process
curl -X POST "http://127.0.0.1:5111/api/transactions/process" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "123", "description": "Test transaction", "amount": 100, "merchantName": "Test Merchant"}'

# Test POST /api/user/submit-mapping
curl -X POST "http://127.0.0.1:5111/api/user/submit-mapping" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": "123", "merchant": "Test", "company_name": "Test Inc", "ticker": "TEST", "category": "Tech", "confidence": "High"}'

# Test GET /api/individual/export/transactions
curl -X GET "http://127.0.0.1:5111/api/individual/export/transactions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### User Goals Page Testing
```bash
# Test GET /api/user/goals
curl -X GET "http://127.0.0.1:5111/api/user/goals" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test POST /api/user/goals
curl -X POST "http://127.0.0.1:5111/api/user/goals" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Goal", "type": "amount", "target": 10000, "timeframe": 12}'
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

Admin should be able to access all user endpoints with an additional parameter or header:

```python
@app.route('/api/admin/users/<user_id>/portfolio')
@require_admin_auth
def admin_user_portfolio(user_id):
    # Admin can view any user's portfolio
    return get_user_portfolio(user_id)

@app.route('/api/admin/users/<user_id>/transactions')
@require_admin_auth
def admin_user_transactions(user_id):
    # Admin can view any user's transactions
    return get_user_transactions(user_id)
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
@user_bp.route('/portfolio')
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

class UserGoalSchema(Schema):
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
- [ ] DataContext integration verified

---

## Conclusion

Follow this guide systematically to ensure all User Dashboard endpoints are properly implemented, tested, and integrated with the database and admin dashboard.




