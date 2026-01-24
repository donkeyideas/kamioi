# Family Dashboard API Endpoints Report

## Overview
This document provides a comprehensive list of all API endpoints used by the Family Dashboard, organized by page/component. Each endpoint includes the HTTP method, URL, purpose, and expected request/response format.

---

## 1. Family Transactions Page (`FamilyTransactions.jsx`)

### GET Family AI Insights
- **Endpoint:** `GET /api/family/ai/insights`
- **Full URL:** `http://127.0.0.1:5111/api/family/ai/insights`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch AI insights and mappings for family transactions
- **Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "transaction_id": "string",
      "company_name": "string",
      "ticker": "string",
      "category": "string",
      "confidence": "number",
      "notes": "string"
    }
  ]
}
```

### POST Submit Mapping
- **Endpoint:** `POST /api/family/submit-mapping`
- **Full URL:** `http://127.0.0.1:5111/api/family/submit-mapping`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Submit transaction mapping for family transactions
- **Request Body:**
```json
{
  "transaction_id": "string",
  "merchant": "string",
  "company_name": "string",
  "ticker": "string",
  "category": "string",
  "confidence": "string",
  "notes": "string",
  "mapping_id": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Mapping submitted successfully"
}
```

### GET Export Transactions
- **Endpoint:** `GET /api/family/export/transactions`
- **Full URL:** `http://127.0.0.1:5111/api/family/export/transactions`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Export family transactions as CSV
- **Expected Response:**
```json
{
  "success": true,
  "download_url": "string"
}
```

### POST Process Transaction (Shared)
- **Endpoint:** `POST /api/transactions/process`
- **Full URL:** `http://127.0.0.1:5111/api/transactions/process`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Process and analyze a transaction with AI
- **Request Body:**
```json
{
  "userId": "string",
  "description": "string",
  "amount": 0,
  "merchantName": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "data": {
    "aiAnalysis": {
      "category": "string",
      "confidence": "number"
    },
    "investment": {
      "suggestedTicker": "string"
    }
  }
}
```

### GET Lookup Ticker (Shared)
- **Endpoint:** `GET /api/lookup/ticker?company={companyName}`
- **Full URL:** `http://127.0.0.1:5111/api/lookup/ticker?company={companyName}`
- **Method:** GET
- **Headers:** 
  - `Content-Type: application/json`
- **Purpose:** Lookup stock ticker symbol by company name
- **Query Parameters:**
  - `company` (required): Company name to lookup
- **Expected Response:**
```json
{
  "success": true,
  "ticker": "string"
}
```

### POST Track Recommendation Click (Shared)
- **Endpoint:** `POST /api/analytics/recommendation-click`
- **Full URL:** `http://127.0.0.1:5111/api/analytics/recommendation-click`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Track when user clicks on AI recommendation
- **Request Body:**
```json
{
  "userId": "string",
  "productId": "string",
  "recommendationType": "string",
  "timestamp": "string",
  "userAgent": "string",
  "source": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Recommendation click tracked"
}
```

---

## 2. Family Dashboard/Overview Page (`FamilyOverview.jsx`)

### GET Family Members
- **Endpoint:** `GET /api/family/members`
- **Full URL:** `http://127.0.0.1:5111/api/family/members`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all family members
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

### GET Family Portfolio
- **Endpoint:** `GET /api/family/portfolio`
- **Full URL:** `http://127.0.0.1:5111/api/family/portfolio`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch family portfolio data
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

### GET Family Goals
- **Endpoint:** `GET /api/family/goals`
- **Full URL:** `http://127.0.0.1:5111/api/family/goals`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all family goals
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

## 3. Family Members Page (`FamilyMembers.jsx`)

### GET Family Members
- **Endpoint:** `GET /api/family/members`
- **Full URL:** `http://127.0.0.1:5111/api/family/members`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all family members
- **Expected Response:** (Same as above)

### POST Add Family Member
- **Endpoint:** `POST /api/family/members`
- **Full URL:** `http://127.0.0.1:5111/api/family/members`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Add a new family member
- **Request Body:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "string",
  "permissions": "string",
  "status": "string",
  "invitedAt": "string",
  "joinedAt": "string|null"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Family member added successfully",
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "status": "string"
  }
}
```

### DELETE Family Member
- **Endpoint:** `DELETE /api/family/members/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/family/members/{id}`
- **Method:** DELETE
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Remove a family member
- **Expected Response:**
```json
{
  "success": true,
  "message": "Family member removed successfully"
}
```

### POST Send Invite
- **Endpoint:** `POST /api/family/members/{id}/invite`
- **Full URL:** `http://127.0.0.1:5111/api/family/members/{id}/invite`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Send invitation to family member
- **Request Body:**
```json
{
  "email": "string",
  "name": "string",
  "familyName": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully"
}
```

---

## 4. Shared Portfolio Page (`FamilyPortfolio.jsx`)

### GET Family Portfolio
- **Endpoint:** `GET /api/family/portfolio`
- **Full URL:** `http://127.0.0.1:5111/api/family/portfolio`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch detailed family portfolio data including holdings
- **Expected Response:** (Same as Family Dashboard portfolio response)

---

## 5. Family Goals Page (`FamilyGoals.jsx`)

### GET Family Goals
- **Endpoint:** `GET /api/family/goals`
- **Full URL:** `http://127.0.0.1:5111/api/family/goals`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all family goals
- **Expected Response:** (Same as Family Dashboard goals response)

### POST Create Family Goal
- **Endpoint:** `POST /api/family/goals`
- **Full URL:** `http://127.0.0.1:5111/api/family/goals`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Create a new family goal
- **Request Body:**
```json
{
  "title": "string",
  "type": "string",
  "target": 0,
  "current": 0,
  "timeframe": 0,
  "description": "string",
  "status": "string",
  "familyId": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Family goal created successfully",
  "goal": {
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
}
```

### PUT Update Family Goal
- **Endpoint:** `PUT /api/family/goals/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/family/goals/{id}`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Update an existing family goal
- **Request Body:**
```json
{
  "title": "string",
  "target": 0,
  "current": 0,
  "description": "string",
  "status": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Family goal updated successfully",
  "goal": {
    "id": "string",
    "title": "string",
    "target": 0,
    "current": 0,
    "status": "string"
  }
}
```

### DELETE Family Goal
- **Endpoint:** `DELETE /api/family/goals/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/family/goals/{id}`
- **Method:** DELETE
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Delete a family goal
- **Expected Response:**
```json
{
  "success": true,
  "message": "Family goal deleted successfully"
}
```

---

## 6. AI Insights Page (`FamilyAIInsights.jsx`)

### GET Family AI Insights
- **Endpoint:** `GET /api/family/ai-insights`
- **Full URL:** `http://127.0.0.1:5111/api/family/ai-insights`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch AI performance insights for family
- **Expected Response:**
```json
{
  "success": true,
  "insights": {
    "accuracy": 0,
    "total_recommendations": 0,
    "accepted_recommendations": 0,
    "rejected_recommendations": 0,
    "performance_metrics": {}
  }
}
```

### GET Mapping History
- **Endpoint:** `GET /api/family/mapping-history`
- **Full URL:** `http://127.0.0.1:5111/api/family/mapping-history`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch family's transaction mapping history
- **Expected Response:**
```json
{
  "success": true,
  "data": {
    "mappings": [
      {
        "id": "string",
        "transaction_id": "string",
        "company_name": "string",
        "ticker": "string",
        "category": "string",
        "confidence": "number",
        "status": "string",
        "created_at": "string"
      }
    ],
    "stats": {
      "total_mappings": 0,
      "approved_mappings": 0,
      "pending_mappings": 0,
      "accuracy_rate": 0,
      "points_earned": 0
    }
  }
}
```

### GET Rewards
- **Endpoint:** `GET /api/family/rewards`
- **Full URL:** `http://127.0.0.1:5111/api/family/rewards`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch family rewards and points
- **Expected Response:**
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "points_required": 0,
        "status": "string",
        "unlocked_at": "string"
      }
    ],
    "points": {
      "total": 0,
      "available": 0,
      "spent": 0
    }
  }
}
```

### GET Leaderboard
- **Endpoint:** `GET /api/family/leaderboard`
- **Full URL:** `http://127.0.0.1:5111/api/family/leaderboard`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch family leaderboard data
- **Expected Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "user_id": "string",
        "name": "string",
        "points": 0,
        "rank": 0,
        "tier": "string",
        "avatar": "string"
      }
    ]
  }
}
```

---

## 7. Notifications Page (`FamilyNotifications.jsx`)

### GET Family Notifications
- **Endpoint:** `GET /api/family/notifications`
- **Full URL:** `http://127.0.0.1:5111/api/family/notifications`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all family notifications
- **Expected Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "string",
      "title": "string",
      "message": "string",
      "type": "string",
      "read": false,
      "created_at": "string",
      "timestamp": "string",
      "date": "string",
      "icon": "string"
    }
  ]
}
```

### PUT Mark Notification as Read
- **Endpoint:** `PUT /api/family/notifications/{id}/read`
- **Full URL:** `http://127.0.0.1:5111/api/family/notifications/{id}/read`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Mark a single notification as read
- **Expected Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### PUT Mark All Notifications as Read
- **Endpoint:** `PUT /api/family/notifications/read-all`
- **Full URL:** `http://127.0.0.1:5111/api/family/notifications/read-all`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Mark all notifications as read
- **Expected Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### DELETE Notification
- **Endpoint:** `DELETE /api/family/notifications/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/family/notifications/{id}`
- **Method:** DELETE
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Delete a notification
- **Expected Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## 8. Family Settings Page (`FamilySettings.jsx`)

### GET Family Settings
- **Endpoint:** `GET /api/family/settings`
- **Full URL:** `http://127.0.0.1:5111/api/family/settings`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch family settings
- **Expected Response:**
```json
{
  "success": true,
  "settings": {
    "family_name": "string",
    "guardian_email": "string",
    "phone": "string",
    "family_code": "string",
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zip": "string",
      "country": "string"
    },
    "family_size": 0,
    "round_up_preference": 0,
    "investment_goal": "string",
    "risk_preference": "string",
    "notification_preferences": {
      "email": true,
      "sms": false,
      "push": true
    }
  }
}
```

### PUT Family Settings
- **Endpoint:** `PUT /api/family/settings`
- **Full URL:** `http://127.0.0.1:5111/api/family/settings`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Update family settings
- **Request Body:**
```json
{
  "family_name": "string",
  "guardian_email": "string",
  "phone": "string",
  "family_code": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zip": "string",
    "country": "string"
  },
  "family_size": 0,
  "round_up_preference": 0,
  "investment_goal": "string",
  "risk_preference": "string",
  "notification_preferences": {
    "email": true,
    "sms": false,
    "push": true
  }
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Family settings updated successfully"
}
```

### GET Family Statements
- **Endpoint:** `GET /api/family/statements`
- **Full URL:** `http://127.0.0.1:5111/api/family/statements`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all generated family statements
- **Expected Response:**
```json
{
  "success": true,
  "statements": [
    {
      "id": "string",
      "type": "string",
      "period": "string",
      "date": "string",
      "amount": 0,
      "status": "string",
      "format": "string",
      "size": "string",
      "transactions": 0,
      "roundUps": 0,
      "investments": 0,
      "download_url": "string"
    }
  ]
}
```

### POST Generate Statement
- **Endpoint:** `POST /api/family/statements/generate`
- **Full URL:** `http://127.0.0.1:5111/api/family/statements/generate`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Generate a new family statement
- **Request Body:**
```json
{
  "type": "string",
  "period": "string",
  "start_date": "string",
  "end_date": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Statement generated successfully",
  "statement": {
    "id": "string",
    "type": "string",
    "period": "string",
    "date": "string",
    "amount": 0,
    "status": "string",
    "format": "string",
    "size": "string",
    "transactions": 0,
    "total_round_ups": 0,
    "total_invested": 0,
    "download_url": "string"
  }
}
```

---

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer {kamioi_user_token}
```

The token is retrieved from localStorage: `localStorage.getItem('kamioi_user_token')`

**Note:** Some endpoints may use `kamioi_token` instead of `kamioi_user_token` - standardization recommended.

---

## Base URL

All endpoints use the base URL:
```
http://127.0.0.1:5111
```

---

## Error Responses

All endpoints should return error responses in the following format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error code or additional details"
}
```

Common HTTP status codes:
- `200 OK` - Success
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Testing Checklist

### Family Transactions Page
- [ ] GET `/api/family/ai/insights` returns AI insights
- [ ] POST `/api/transactions/process` processes transaction with AI
- [ ] GET `/api/lookup/ticker?company={name}` returns ticker symbol
- [ ] POST `/api/family/submit-mapping` submits mapping successfully
- [ ] GET `/api/family/export/transactions` exports CSV
- [ ] POST `/api/analytics/recommendation-click` tracks recommendation clicks

### Family Dashboard/Overview Page
- [ ] GET `/api/family/members` returns family members
- [ ] GET `/api/family/portfolio` returns portfolio data
- [ ] GET `/api/family/goals` returns family goals

### Family Members Page
- [ ] GET `/api/family/members` returns family members
- [ ] POST `/api/family/members` creates new member
- [ ] DELETE `/api/family/members/{id}` deletes member
- [ ] POST `/api/family/members/{id}/invite` sends invitation

### Shared Portfolio Page
- [ ] GET `/api/family/portfolio` returns detailed portfolio data

### Family Goals Page
- [ ] GET `/api/family/goals` returns goals
- [ ] POST `/api/family/goals` creates new goal
- [ ] PUT `/api/family/goals/{id}` updates goal
- [ ] DELETE `/api/family/goals/{id}` deletes goal

### AI Insights Page
- [ ] GET `/api/family/ai-insights` returns AI insights
- [ ] GET `/api/family/mapping-history` returns mapping history
- [ ] GET `/api/family/rewards` returns rewards
- [ ] GET `/api/family/leaderboard` returns leaderboard

### Notifications Page
- [ ] GET `/api/family/notifications` returns notifications
- [ ] PUT `/api/family/notifications/{id}/read` marks as read
- [ ] PUT `/api/family/notifications/read-all` marks all as read
- [ ] DELETE `/api/family/notifications/{id}` deletes notification

### Family Settings Page
- [ ] GET `/api/family/settings` returns settings
- [ ] PUT `/api/family/settings` updates settings
- [ ] GET `/api/family/statements` returns statements
- [ ] POST `/api/family/statements/generate` generates statement

---

## Database Connection Requirements

All endpoints should:
1. Connect to the database to fetch/update data
2. Use proper database queries (SQL or ORM)
3. Handle database errors gracefully
4. Return appropriate error messages
5. Implement proper data validation
6. Use transactions for multi-step operations
7. Implement proper indexing for performance

---

## Admin Dashboard Integration

Ensure all family dashboard endpoints are accessible from the admin dashboard for:
1. Viewing family data
2. Managing family accounts
3. Viewing analytics across families
4. Generating admin reports
5. Troubleshooting issues

---

## Notes

1. Some endpoints may accept multiple response formats (e.g., `data.members` vs `members` at root level). Frontend handles both formats.

2. Date/timestamp fields can be in various formats - frontend handles `created_at`, `timestamp`, and `date` fields.

3. CSV export endpoints should handle both URL-based downloads and direct file data returns.

4. All endpoints should implement proper CORS headers if frontend is on a different origin.

5. Consider implementing rate limiting for API endpoints to prevent abuse.

6. All endpoints should log requests for debugging and audit purposes.

7. Token storage inconsistency: Some endpoints use `kamioi_token`, others use `kamioi_user_token` - should be standardized.

---

## Total Endpoints Summary

- **Family Transactions:** 6 endpoints (including 2 shared)
- **Family Dashboard:** 3 endpoints
- **Family Members:** 4 endpoints
- **Shared Portfolio:** 1 endpoint
- **Family Goals:** 4 endpoints
- **AI Insights:** 4 endpoints
- **Notifications:** 4 endpoints
- **Family Settings:** 4 endpoints

**Total: 30 API endpoints** (includes 2 shared endpoints: `/api/transactions/process` and `/api/lookup/ticker`)

**Note:** Shared endpoints like `/api/transactions/process` and `/api/lookup/ticker` are used across dashboards (family/business) and do not have `/family/` prefix.




