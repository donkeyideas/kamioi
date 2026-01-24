# Admin Transactions Endpoints Implementation Guide

## Overview
This document provides implementation specifications for admin endpoints to access transactions from User, Business, and Family dashboards.

---

## Required Admin Endpoints

### 1. GET `/api/admin/transactions`

**Purpose:** Fetch all transactions across all dashboard types with filtering capabilities.

**Method:** GET

**Headers:**
```
Authorization: Bearer {kamioi_admin_token}
Content-Type: application/json
```

**Query Parameters:**
- `dashboard_type` (optional): Filter by dashboard type - `user`, `business`, `family`, or `all` (default: `all`)
- `user_id` (optional): Filter by specific user ID
- `business_id` (optional): Filter by specific business ID
- `family_id` (optional): Filter by specific family ID
- `status` (optional): Filter by transaction status
- `limit` (optional): Limit number of results (default: 1000)
- `offset` (optional): Pagination offset (default: 0)
- `start_date` (optional): Filter transactions from this date (YYYY-MM-DD)
- `end_date` (optional): Filter transactions to this date (YYYY-MM-DD)

**Example Requests:**
```bash
# Get all transactions
GET /api/admin/transactions

# Get only user transactions
GET /api/admin/transactions?dashboard_type=user

# Get only business transactions
GET /api/admin/transactions?dashboard_type=business

# Get only family transactions
GET /api/admin/transactions?dashboard_type=family

# Get transactions for specific user
GET /api/admin/transactions?user_id=123

# Get transactions for specific business
GET /api/admin/transactions?business_id=456

# Get transactions for specific family
GET /api/admin/transactions?family_id=789

# Get pending transactions only
GET /api/admin/transactions?status=pending

# Get transactions with pagination
GET /api/admin/transactions?limit=100&offset=0

# Get transactions for date range
GET /api/admin/transactions?start_date=2024-01-01&end_date=2024-12-31
```

**Expected Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "string",
      "dashboard_type": "user|business|family",
      "user_id": "string",
      "business_id": "string|null",
      "family_id": "string|null",
      "description": "string",
      "merchant": "string",
      "amount": 0,
      "round_up": 0,
      "category": "string",
      "ticker": "string",
      "status": "string",
      "ai_confidence": 0,
      "suggested_stock": "string",
      "date": "YYYY-MM-DD",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "total": 0,
  "dashboard_types": {
    "user": 0,
    "business": 0,
    "family": 0
  },
  "analytics": {
    "total_transactions": 0,
    "total_amount": 0,
    "total_round_ups": 0,
    "status_breakdown": {
      "pending": 0,
      "completed": 0,
      "mapped": 0,
      "needs-recognition": 0
    }
  }
}
```

**Implementation Notes:**
- Merge transactions from `user_transactions`, `business_transactions`, and `family_transactions` tables
- Add `dashboard_type` field to each transaction in response
- Support filtering by any combination of parameters
- Return transaction counts per dashboard type
- Include analytics summary

---

### 2. GET `/api/admin/users/{user_id}/transactions`

**Purpose:** Fetch transactions for a specific user.

**Method:** GET

**Headers:**
```
Authorization: Bearer {kamioi_admin_token}
Content-Type: application/json
```

**Path Parameters:**
- `user_id` (required): User ID

**Query Parameters:**
- `limit` (optional): Limit number of results
- `offset` (optional): Pagination offset
- `status` (optional): Filter by status

**Example Request:**
```bash
GET /api/admin/users/123/transactions?limit=100&status=pending
```

**Expected Response:**
```json
{
  "success": true,
  "user_id": "123",
  "transactions": [
    {
      "id": "string",
      "description": "string",
      "merchant": "string",
      "amount": 0,
      "round_up": 0,
      "category": "string",
      "ticker": "string",
      "status": "string",
      "date": "YYYY-MM-DD",
      "created_at": "timestamp"
    }
  ],
  "total": 0
}
```

**Implementation Notes:**
- Query `user_transactions` table filtered by `user_id`
- Verify user exists before querying
- Return 404 if user not found

---

### 3. GET `/api/admin/businesses/{business_id}/transactions`

**Purpose:** Fetch transactions for a specific business.

**Method:** GET

**Headers:**
```
Authorization: Bearer {kamioi_admin_token}
Content-Type: application/json
```

**Path Parameters:**
- `business_id` (required): Business ID

**Query Parameters:**
- `limit` (optional): Limit number of results
- `offset` (optional): Pagination offset
- `status` (optional): Filter by status

**Example Request:**
```bash
GET /api/admin/businesses/456/transactions?limit=100
```

**Expected Response:**
```json
{
  "success": true,
  "business_id": "456",
  "transactions": [
    {
      "id": "string",
      "description": "string",
      "merchant": "string",
      "amount": 0,
      "round_up": 0,
      "category": "string",
      "ticker": "string",
      "status": "string",
      "date": "YYYY-MM-DD",
      "created_at": "timestamp"
    }
  ],
  "total": 0
}
```

**Implementation Notes:**
- Query `business_transactions` table filtered by `business_id`
- Verify business exists before querying
- Return 404 if business not found

---

### 4. GET `/api/admin/families/{family_id}/transactions`

**Purpose:** Fetch transactions for a specific family.

**Method:** GET

**Headers:**
```
Authorization: Bearer {kamioi_admin_token}
Content-Type: application/json
```

**Path Parameters:**
- `family_id` (required): Family ID

**Query Parameters:**
- `limit` (optional): Limit number of results
- `offset` (optional): Pagination offset
- `status` (optional): Filter by status

**Example Request:**
```bash
GET /api/admin/families/789/transactions?limit=100
```

**Expected Response:**
```json
{
  "success": true,
  "family_id": "789",
  "transactions": [
    {
      "id": "string",
      "description": "string",
      "merchant": "string",
      "amount": 0,
      "round_up": 0,
      "category": "string",
      "ticker": "string",
      "status": "string",
      "date": "YYYY-MM-DD",
      "created_at": "timestamp"
    }
  ],
  "total": 0
}
```

**Implementation Notes:**
- Query `family_transactions` table filtered by `family_id`
- Verify family exists before querying
- Return 404 if family not found

---

## Database Query Examples

### Get All Transactions (Python/Flask Example)

```python
@app.route('/api/admin/transactions', methods=['GET'])
@require_admin_auth
def admin_get_all_transactions():
    dashboard_type = request.args.get('dashboard_type', 'all')
    user_id = request.args.get('user_id')
    business_id = request.args.get('business_id')
    family_id = request.args.get('family_id')
    status = request.args.get('status')
    limit = int(request.args.get('limit', 1000))
    offset = int(request.args.get('offset', 0))
    
    all_transactions = []
    
    # Query user transactions
    if dashboard_type in ['all', 'user']:
        user_query = db.session.query(UserTransaction)
        if user_id:
            user_query = user_query.filter(UserTransaction.user_id == user_id)
        if status:
            user_query = user_query.filter(UserTransaction.status == status)
        user_transactions = user_query.limit(limit).offset(offset).all()
        
        for tx in user_transactions:
            all_transactions.append({
                **tx.to_dict(),
                'dashboard_type': 'user'
            })
    
    # Query business transactions
    if dashboard_type in ['all', 'business']:
        business_query = db.session.query(BusinessTransaction)
        if business_id:
            business_query = business_query.filter(BusinessTransaction.business_id == business_id)
        if status:
            business_query = business_query.filter(BusinessTransaction.status == status)
        business_transactions = business_query.limit(limit).offset(offset).all()
        
        for tx in business_transactions:
            all_transactions.append({
                **tx.to_dict(),
                'dashboard_type': 'business'
            })
    
    # Query family transactions
    if dashboard_type in ['all', 'family']:
        family_query = db.session.query(FamilyTransaction)
        if family_id:
            family_query = family_query.filter(FamilyTransaction.family_id == family_id)
        if status:
            family_query = family_query.filter(FamilyTransaction.status == status)
        family_transactions = family_query.limit(limit).offset(offset).all()
        
        for tx in family_transactions:
            all_transactions.append({
                **tx.to_dict(),
                'dashboard_type': 'family'
            })
    
    # Calculate analytics
    dashboard_counts = {
        'user': len([t for t in all_transactions if t['dashboard_type'] == 'user']),
        'business': len([t for t in all_transactions if t['dashboard_type'] == 'business']),
        'family': len([t for t in all_transactions if t['dashboard_type'] == 'family'])
    }
    
    return jsonify({
        'success': True,
        'transactions': all_transactions,
        'total': len(all_transactions),
        'dashboard_types': dashboard_counts,
        'analytics': {
            'total_transactions': len(all_transactions),
            'total_amount': sum(t.get('amount', 0) for t in all_transactions),
            'total_round_ups': sum(t.get('round_up', 0) for t in all_transactions),
            'status_breakdown': {
                status: len([t for t in all_transactions if t.get('status') == status])
                for status in ['pending', 'completed', 'mapped', 'needs-recognition']
            }
        }
    })
```

---

## SQL Query Examples

### Get All Transactions with Dashboard Type

```sql
-- User transactions
SELECT 
    id,
    user_id,
    description,
    merchant,
    amount,
    round_up,
    category,
    ticker,
    status,
    date,
    created_at,
    'user' as dashboard_type
FROM user_transactions
WHERE (? IS NULL OR user_id = ?)
  AND (? IS NULL OR status = ?)
  AND (? IS NULL OR date >= ?)
  AND (? IS NULL OR date <= ?)

UNION ALL

-- Business transactions
SELECT 
    id,
    user_id,
    description,
    merchant,
    amount,
    round_up,
    category,
    ticker,
    status,
    date,
    created_at,
    'business' as dashboard_type
FROM business_transactions
WHERE (? IS NULL OR business_id = ?)
  AND (? IS NULL OR status = ?)
  AND (? IS NULL OR date >= ?)
  AND (? IS NULL OR date <= ?)

UNION ALL

-- Family transactions
SELECT 
    id,
    user_id,
    description,
    merchant,
    amount,
    round_up,
    category,
    ticker,
    status,
    date,
    created_at,
    'family' as dashboard_type
FROM family_transactions
WHERE (? IS NULL OR family_id = ?)
  AND (? IS NULL OR status = ?)
  AND (? IS NULL OR date >= ?)
  AND (? IS NULL OR date <= ?)

ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

---

## Error Handling

### Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Admin authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "User/Business/Family not found"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid parameters"
}
```

---

## Testing

### Manual Testing

```bash
# Test getting all transactions
curl -X GET "http://127.0.0.1:5111/api/admin/transactions" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test filtering by dashboard type
curl -X GET "http://127.0.0.1:5111/api/admin/transactions?dashboard_type=user" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test getting user transactions
curl -X GET "http://127.0.0.1:5111/api/admin/users/123/transactions" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test getting business transactions
curl -X GET "http://127.0.0.1:5111/api/admin/businesses/456/transactions" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test getting family transactions
curl -X GET "http://127.0.0.1:5111/api/admin/families/789/transactions" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Performance Considerations

1. **Indexing:** Ensure indexes on:
   - `user_id` in `user_transactions`
   - `business_id` in `business_transactions`
   - `family_id` in `family_transactions`
   - `status` in all transaction tables
   - `date` in all transaction tables

2. **Pagination:** Always use LIMIT and OFFSET for large datasets

3. **Caching:** Consider caching transaction counts and analytics

4. **Query Optimization:** Use UNION ALL instead of UNION for better performance

---

## Implementation Priority

1. **High Priority:**
   - `GET /api/admin/transactions` with basic filtering
   - `GET /api/admin/users/{user_id}/transactions`
   - `GET /api/admin/businesses/{business_id}/transactions`
   - `GET /api/admin/families/{family_id}/transactions`

2. **Medium Priority:**
   - Advanced filtering (status, date range)
   - Analytics aggregation
   - Pagination improvements

3. **Low Priority:**
   - Caching implementation
   - Real-time updates
   - Export functionality

---

**Implementation Status:** [ ] Not Started  [ ] In Progress  [ ] Complete




