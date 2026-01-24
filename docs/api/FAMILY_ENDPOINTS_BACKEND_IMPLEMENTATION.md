# Family Dashboard Endpoints - Backend Implementation Required

## 🚨 Urgent: Missing Backend Endpoints

The following endpoints are returning **404 (NOT FOUND)** errors and need to be implemented on the backend:

### Critical Missing Endpoints

#### 1. GET `/api/family/members`
- **Status:** ❌ 404 Error
- **Used By:** 
  - `FamilyOverview.jsx` (line 33)
  - `FamilyMembers.jsx` (line 34)
- **Request:** 
  ```
  GET http://127.0.0.1:5111/api/family/members
  Headers: Authorization: Bearer {token}
  ```
- **Expected Response:**
```json
{
  "success": true,
  "members": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "status": "string",
      "portfolio": 0,
      "lastActive": "string",
      "joinDate": "string",
      "permissions": "string"
    }
  ]
}
```

#### 2. GET `/api/family/portfolio`
- **Status:** ❌ 404 Error
- **Used By:**
  - `FamilyOverview.jsx` (line 47)
  - `FamilyPortfolio.jsx` (line 37)
- **Request:**
  ```
  GET http://127.0.0.1:5111/api/family/portfolio
  Headers: Authorization: Bearer {token}
  ```
- **Expected Response:**
```json
{
  "success": true,
  "portfolio": {
    "total_value": 0,
    "total_invested": 0,
    "total_gains": 0,
    "gain_percentage": 0,
    "holdings": [
      {
        "ticker": "string",
        "shares": 0,
        "value": 0,
        "gain": 0,
        "gain_percentage": 0
      }
    ],
    "today_gain": 0,
    "today_gain_percentage": 0,
    "roi": 0,
    "cash_available": 0,
    "ytd_return": 0,
    "ytd_return_percentage": 0
  }
}
```

#### 3. GET `/api/family/goals`
- **Status:** ❌ 404 Error
- **Used By:**
  - `FamilyOverview.jsx` (line 61)
  - `FamilyGoals.jsx`
- **Request:**
  ```
  GET http://127.0.0.1:5111/api/family/goals
  Headers: Authorization: Bearer {token}
  ```
- **Expected Response:**
```json
{
  "success": true,
  "goals": [
    {
      "id": "string",
      "title": "string",
      "type": "string",
      "target": 0,
      "current": 0,
      "timeframe": 0,
      "description": "string",
      "status": "string",
      "createdAt": "string",
      "progress": 0,
      "endDate": "string",
      "familyId": "string"
    }
  ]
}
```

---

## Quick Implementation Guide

### Python/Flask Example

```python
from flask import Blueprint, request, jsonify
from functools import wraps

family_bp = Blueprint('family', __name__, url_prefix='/api/family')

def require_family_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not verify_jwt_token(token):
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        
        user = get_user_from_token(token)
        if not user:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        
        # Get family_id from user or request
        family_id = user.family_id or request.args.get('family_id')
        if not family_id:
            return jsonify({"success": False, "error": "Family ID required"}), 400
        
        request.family_id = family_id
        request.current_user = user
        return f(*args, **kwargs)
    return decorated_function

@family_bp.route('/members', methods=['GET'])
@require_family_auth
def get_family_members():
    try:
        family_id = request.family_id
        
        # Query family_members table
        members = db.session.query(FamilyMember).filter(
            FamilyMember.family_id == family_id
        ).all()
        
        members_data = [{
            'id': str(m.id),
            'name': m.name,
            'email': m.email,
            'role': m.role,
            'status': m.status,
            'portfolio': float(m.portfolio_value) if m.portfolio_value else 0,
            'lastActive': m.last_active.isoformat() if m.last_active else None,
            'joinDate': m.joined_at.isoformat() if m.joined_at else None,
            'permissions': m.permissions
        } for m in members]
        
        return jsonify({
            'success': True,
            'members': members_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@family_bp.route('/portfolio', methods=['GET'])
@require_family_auth
def get_family_portfolio():
    try:
        family_id = request.family_id
        
        # Query family_portfolio table
        portfolio = db.session.query(FamilyPortfolio).filter(
            FamilyPortfolio.family_id == family_id
        ).first()
        
        if not portfolio:
            return jsonify({
                'success': True,
                'portfolio': {
                    'total_value': 0,
                    'total_invested': 0,
                    'total_gains': 0,
                    'gain_percentage': 0,
                    'holdings': [],
                    'today_gain': 0,
                    'today_gain_percentage': 0,
                    'roi': 0,
                    'cash_available': 0,
                    'ytd_return': 0,
                    'ytd_return_percentage': 0
                }
            })
        
        # Query holdings
        holdings = db.session.query(FamilyPortfolioHolding).filter(
            FamilyPortfolioHolding.family_id == family_id
        ).all()
        
        holdings_data = [{
            'ticker': h.ticker,
            'shares': float(h.shares),
            'value': float(h.value),
            'gain': float(h.gain),
            'gain_percentage': float(h.gain_percentage)
        } for h in holdings]
        
        return jsonify({
            'success': True,
            'portfolio': {
                'total_value': float(portfolio.total_value),
                'total_invested': float(portfolio.total_invested),
                'total_gains': float(portfolio.total_gains),
                'gain_percentage': float(portfolio.gain_percentage),
                'holdings': holdings_data,
                'today_gain': float(portfolio.today_gain),
                'today_gain_percentage': float(portfolio.today_gain_percentage),
                'roi': float(portfolio.roi),
                'cash_available': float(portfolio.cash_available),
                'ytd_return': float(portfolio.ytd_return),
                'ytd_return_percentage': float(portfolio.ytd_return_percentage)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@family_bp.route('/goals', methods=['GET'])
@require_family_auth
def get_family_goals():
    try:
        family_id = request.family_id
        
        # Query family_goals table
        goals = db.session.query(FamilyGoal).filter(
            FamilyGoal.family_id == family_id
        ).order_by(FamilyGoal.created_at.desc()).all()
        
        goals_data = [{
            'id': str(g.id),
            'title': g.title,
            'type': g.type,
            'target': float(g.target),
            'current': float(g.current),
            'timeframe': g.timeframe,
            'description': g.description,
            'status': g.status,
            'createdAt': g.created_at.isoformat(),
            'progress': float(g.progress),
            'endDate': g.end_date.isoformat() if g.end_date else None,
            'familyId': str(g.family_id)
        } for g in goals]
        
        return jsonify({
            'success': True,
            'goals': goals_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

---

## Database Schema Verification

Ensure these tables exist:

### 1. `families` table
```sql
SELECT * FROM families WHERE id = ?;
```

### 2. `family_members` table
```sql
SELECT * FROM family_members WHERE family_id = ?;
```

### 3. `family_portfolio` table
```sql
SELECT * FROM family_portfolio WHERE family_id = ?;
```

### 4. `family_portfolio_holdings` table
```sql
SELECT * FROM family_portfolio_holdings WHERE family_id = ?;
```

### 5. `family_goals` table
```sql
SELECT * FROM family_goals WHERE family_id = ?;
```

---

## Testing Commands

```bash
# Test GET /api/family/members
curl -X GET "http://127.0.0.1:5111/api/family/members" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Test GET /api/family/portfolio
curl -X GET "http://127.0.0.1:5111/api/family/portfolio" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Test GET /api/family/goals
curl -X GET "http://127.0.0.1:5111/api/family/goals" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Priority

**🔴 HIGH PRIORITY** - These endpoints are critical for the Family Dashboard to function:
1. `GET /api/family/members` - Required for Family Overview and Members pages
2. `GET /api/family/portfolio` - Required for Family Overview and Portfolio pages
3. `GET /api/family/goals` - Required for Family Overview and Goals pages

Without these endpoints, the Family Dashboard will show empty data and may cause UI errors.

---

## Error Handling

All endpoints should:
- Return 401 if authentication fails
- Return 404 if family not found
- Return 500 if database error
- Return proper JSON error format:
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

---

**Status:** ⚠️ **URGENT - BACKEND IMPLEMENTATION REQUIRED**




