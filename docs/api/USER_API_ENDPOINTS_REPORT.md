# User Dashboard API Endpoints Report

## Overview
This document provides a comprehensive list of all API endpoints used by the User Dashboard, organized by page/component. Each endpoint includes the HTTP method, URL, purpose, and expected request/response format.

---

## 1. Dashboard/Overview Page (`DashboardOverview.jsx`)

**Note:** This page primarily uses data from `DataContext` and doesn't make direct API calls. However, the data should be fetched from the backend when the user logs in.

---

## 2. Transactions Page (`UserTransactions.jsx`)

### GET User AI Insights
- **Endpoint:** `GET /api/user/ai/insights`
- **Full URL:** `http://127.0.0.1:5111/api/user/ai/insights`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch AI insights and mappings for user transactions
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
      "notes": "string",
      "user_id": "string",
      "mapping_id": "string"
    }
  ]
}
```

### POST Submit Mapping
- **Endpoint:** `POST /api/user/submit-mapping`
- **Full URL:** `http://127.0.0.1:5111/api/user/submit-mapping`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Submit transaction mapping for user transactions
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
- **Endpoint:** `GET /api/individual/export/transactions`
- **Full URL:** `http://127.0.0.1:5111/api/individual/export/transactions`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Export user transactions as CSV
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

---

## 3. Portfolio Page (`PortfolioOverview.jsx`)

**Note:** This page primarily uses data from `DataContext`. Portfolio data should be fetched via a dedicated endpoint if available.

### GET User Portfolio
- **Endpoint:** `GET /api/user/portfolio`
- **Full URL:** `http://127.0.0.1:5111/api/user/portfolio`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch user portfolio data including holdings
- **Expected Response:**
```json
{
  "success": true,
  "portfolio": {
    "value": 0,
    "holdings": [
      {
        "symbol": "string",
        "shares": 0,
        "value": 0,
        "allocation": 0,
        "gain": 0,
        "gain_percentage": 0
      }
    ],
    "today_gain": 0,
    "today_gain_percentage": 0,
    "cash_available": 0,
    "ytd_return": 0
  }
}
```

---

## 4. Goals Page (`UserGoals.jsx`)

**Note:** This page primarily uses data from `DataContext`. However, API endpoints should be implemented.

### GET User Goals
- **Endpoint:** `GET /api/user/goals`
- **Full URL:** `http://127.0.0.1:5111/api/user/goals`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all user goals
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
      "progress": 0
    }
  ]
}
```

### POST Create Goal
- **Endpoint:** `POST /api/user/goals`
- **Full URL:** `http://127.0.0.1:5111/api/user/goals`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Create a new user goal
- **Request Body:**
```json
{
  "title": "string",
  "type": "string",
  "target": 0,
  "current": 0,
  "timeframe": 0,
  "description": "string",
  "status": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Goal created successfully",
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
    "progress": 0
  }
}
```

### PUT Update Goal
- **Endpoint:** `PUT /api/user/goals/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/user/goals/{id}`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Update an existing user goal
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
  "message": "Goal updated successfully",
  "goal": {
    "id": "string",
    "title": "string",
    "target": 0,
    "current": 0,
    "status": "string"
  }
}
```

### DELETE Goal
- **Endpoint:** `DELETE /api/user/goals/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/user/goals/{id}`
- **Method:** DELETE
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Delete a user goal
- **Expected Response:**
```json
{
  "success": true,
  "message": "Goal deleted successfully"
}
```

---

## 5. AI Insights Page (`AIInsights.jsx`)

### GET User AI Insights
- **Endpoint:** `GET /api/user/ai/insights`
- **Full URL:** `http://127.0.0.1:5111/api/user/ai/insights`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch AI insights and mapping history for user
- **Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "transaction_id": "string",
      "merchant_name": "string",
      "company_name": "string",
      "ticker": "string",
      "category": "string",
      "confidence": "number",
      "user_id": "string",
      "mapping_id": "string",
      "admin_approved": 0,
      "status": "string",
      "created_at": "string"
    }
  ],
  "stats": {
    "totalMappings": 0,
    "approvedMappings": 0,
    "pendingMappings": 0,
    "accuracyRate": 0,
    "pointsEarned": 0
  }
}
```

### GET User AI Insights (with timeframe)
- **Endpoint:** `GET /api/user/ai-insights?timeframe={timeframe}`
- **Full URL:** `http://127.0.0.1:5111/api/user/ai-insights?timeframe={timeframe}`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch AI insights filtered by timeframe
- **Query Parameters:**
  - `timeframe` (optional): Time range filter (e.g., "7d", "30d", "3m")
- **Expected Response:** (Same as above)

### GET User Rewards
- **Endpoint:** `GET /api/user/rewards`
- **Full URL:** `http://127.0.0.1:5111/api/user/rewards`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch user rewards and points
- **Expected Response:**
```json
{
  "success": true,
  "rewards": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "points_required": 0,
      "status": "string",
      "unlocked_at": "string"
    }
  ]
}
```

---

## 6. Analytics Page (`UserAnalytics.jsx`)

**Note:** This page primarily uses data from `DataContext` (transactions, holdings, portfolioValue). Analytics calculations are done client-side. However, a dedicated analytics endpoint could provide aggregated data.

### GET User Analytics (Recommended)
- **Endpoint:** `GET /api/user/analytics`
- **Full URL:** `http://127.0.0.1:5111/api/user/analytics`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch aggregated user analytics data
- **Expected Response:**
```json
{
  "success": true,
  "analytics": {
    "spending": {
      "total": 0,
      "categories": {},
      "monthly": {}
    },
    "investments": {
      "total": 0,
      "holdings": 0,
      "roundUps": 0
    },
    "trends": {
      "spending": "string",
      "investments": "string"
    }
  }
}
```

---

## 7. Notifications Page (`UserNotifications.jsx`)

**Note:** This page primarily uses the `useNotifications` hook from `DataContext`. However, API endpoints should be implemented for persistence.

### GET User Notifications
- **Endpoint:** `GET /api/user/notifications`
- **Full URL:** `http://127.0.0.1:5111/api/user/notifications`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all user notifications
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
- **Endpoint:** `PUT /api/user/notifications/{id}/read`
- **Full URL:** `http://127.0.0.1:5111/api/user/notifications/{id}/read`
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
- **Endpoint:** `PUT /api/user/notifications/read-all`
- **Full URL:** `http://127.0.0.1:5111/api/user/notifications/read-all`
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
- **Endpoint:** `DELETE /api/user/notifications/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/user/notifications/{id}`
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

## 8. Settings Page (`UserSettings.jsx`)

### GET User Profile
- **Endpoint:** `GET /api/user/profile`
- **Full URL:** `http://127.0.0.1:5111/api/user/profile`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch user profile data
- **Expected Response:**
```json
{
  "success": true,
  "profile": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "country": "string",
    "timezone": "string",
    "firstName": "string",
    "lastName": "string",
    "dob": "string",
    "ssn": "string",
    "streetAddress": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "roundUpPreference": 0,
    "investmentGoal": "string",
    "riskPreference": "string",
    "employmentStatus": "string",
    "employer": "string",
    "occupation": "string",
    "annualIncome": 0,
    "emailNotifications": true,
    "smsNotifications": false,
    "pushNotifications": true,
    "politicallyExposed": false,
    "gamificationEnabled": true
  }
}
```

### PUT User Profile
- **Endpoint:** `PUT /api/user/profile`
- **Full URL:** `http://127.0.0.1:5111/api/user/profile`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Update user profile
- **Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "country": "string",
  "timezone": "string",
  "firstName": "string",
  "lastName": "string",
  "dob": "string",
  "ssn": "string",
  "street": "string",
  "city": "string",
  "state": "string",
  "zip": "string",
  "annualIncome": 0,
  "employmentStatus": "string",
  "employer": "string",
  "occupation": "string",
  "roundUpAmount": "string",
  "riskTolerance": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### POST Change Password
- **Endpoint:** `POST /api/user/security/change-password`
- **Full URL:** `http://127.0.0.1:5111/api/user/security/change-password`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Change user password
- **Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### GET User Statements
- **Endpoint:** `GET /api/user/statements`
- **Full URL:** `http://127.0.0.1:5111/api/user/statements`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all generated user statements
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
      "download_url": "string"
    }
  ]
}
```

### POST Subscribe to Plan
- **Endpoint:** `POST /api/user/subscriptions/subscribe`
- **Full URL:** `http://127.0.0.1:5111/api/user/subscriptions/subscribe`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Subscribe user to a plan
- **Request Body:**
```json
{
  "user_id": "string",
  "plan_id": "string",
  "account_type": "string",
  "tier": "string",
  "auto_renewal": true
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Subscription successful",
  "subscription": {
    "id": "string",
    "plan_id": "string",
    "status": "string",
    "start_date": "string",
    "end_date": "string"
  }
}
```

### GET Active Ad
- **Endpoint:** `GET /api/user/active-ad`
- **Full URL:** `http://127.0.0.1:5111/api/user/active-ad`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch active advertisement for user
- **Expected Response:**
```json
{
  "success": true,
  "ad": {
    "id": "string",
    "title": "string",
    "content": "string",
    "image_url": "string",
    "link_url": "string",
    "type": "string",
    "start_date": "string",
    "end_date": "string"
  }
}
```

---

## 9. Cross-Dashboard Chat (`CommunicationHub.jsx`)

### POST Send Message
- **Endpoint:** `POST /api/messages/send`
- **Full URL:** `http://127.0.0.1:5111/api/messages/send`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Send a cross-dashboard message
- **Request Body:**
```json
{
  "sender": "string",
  "senderId": "string",
  "message": "string",
  "channel": "string",
  "type": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": {
    "id": "string",
    "sender": "string",
    "senderId": "string",
    "message": "string",
    "channel": "string",
    "type": "string",
    "timestamp": "string"
  }
}
```

### GET Message History
- **Endpoint:** `GET /api/messages/history?channel={channel}`
- **Full URL:** `http://127.0.0.1:5111/api/messages/history?channel={channel}`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch message history for a channel
- **Query Parameters:**
  - `channel` (required): Channel identifier
- **Expected Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "string",
      "sender": "string",
      "senderId": "string",
      "message": "string",
      "channel": "string",
      "type": "string",
      "timestamp": "string"
    }
  ]
}
```

### GET Available Channels
- **Endpoint:** `GET /api/messages/channels`
- **Full URL:** `http://127.0.0.1:5111/api/messages/channels`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch available messaging channels
- **Expected Response:**
```json
{
  "success": true,
  "channels": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "unread": 0
    }
  ]
}
```

---

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer {kamioi_user_token}
```

The token is retrieved from localStorage: `localStorage.getItem('kamioi_user_token')`

**Note:** Some endpoints may use `kamioi_token` or `authToken` instead of `kamioi_user_token` - standardization recommended.

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

### Dashboard Page
- [ ] Dashboard loads with data from context
- [ ] Verify data is fetched from backend on login
- [ ] Portfolio value displays correctly
- [ ] Recent activity shows transactions

### Transactions Page
- [ ] GET `/api/user/ai/insights` returns AI insights
- [ ] POST `/api/transactions/process` processes transaction with AI
- [ ] GET `/api/lookup/ticker?company={name}` returns ticker symbol
- [ ] POST `/api/user/submit-mapping` submits mapping successfully
- [ ] GET `/api/individual/export/transactions` exports CSV

### Portfolio Page
- [ ] GET `/api/user/portfolio` returns portfolio data
- [ ] Holdings are displayed correctly
- [ ] Performance metrics are accurate

### Goals Page
- [ ] GET `/api/user/goals` returns goals
- [ ] POST `/api/user/goals` creates new goal
- [ ] PUT `/api/user/goals/{id}` updates goal
- [ ] DELETE `/api/user/goals/{id}` deletes goal

### AI Insights Page
- [ ] GET `/api/user/ai/insights` returns insights
- [ ] GET `/api/user/ai-insights?timeframe={timeframe}` returns filtered insights
- [ ] GET `/api/user/rewards` returns rewards

### Analytics Page
- [ ] GET `/api/user/analytics` returns analytics data (if implemented)
- [ ] Analytics calculations are accurate
- [ ] Charts display correctly

### Notifications Page
- [ ] GET `/api/user/notifications` returns notifications
- [ ] PUT `/api/user/notifications/{id}/read` marks as read
- [ ] PUT `/api/user/notifications/read-all` marks all as read
- [ ] DELETE `/api/user/notifications/{id}` deletes notification

### Settings Page
- [ ] GET `/api/user/profile` returns profile
- [ ] PUT `/api/user/profile` updates profile
- [ ] POST `/api/user/security/change-password` changes password
- [ ] GET `/api/user/statements` returns statements
- [ ] POST `/api/user/subscriptions/subscribe` subscribes to plan
- [ ] GET `/api/user/active-ad` returns active ad

### Cross-Dashboard Chat
- [ ] POST `/api/messages/send` sends message
- [ ] GET `/api/messages/history?channel={channel}` returns message history
- [ ] GET `/api/messages/channels` returns available channels

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

Ensure all user dashboard endpoints are accessible from the admin dashboard for:
1. Viewing user data
2. Managing user accounts
3. Viewing analytics across users
4. Generating admin reports
5. Troubleshooting issues

---

## Notes

1. Many components use `DataContext` for state management. Ensure the context is properly populated with data from API endpoints.

2. Some endpoints may accept multiple response formats. Frontend handles both formats where necessary.

3. Date/timestamp fields can be in various formats - frontend handles `created_at`, `timestamp`, and `date` fields.

4. CSV export endpoints should handle both URL-based downloads and direct file data returns.

5. All endpoints should implement proper CORS headers if frontend is on a different origin.

6. Consider implementing rate limiting for API endpoints to prevent abuse.

7. All endpoints should log requests for debugging and audit purposes.

8. Token storage inconsistency: Some endpoints use `kamioi_user_token`, others use `kamioi_token` or `authToken` - should be standardized to `kamioi_user_token`.

9. **Cross-Dashboard Chat:** The messaging service currently uses localStorage as a fallback. The API endpoints should be implemented for proper backend integration.

10. **Dashboard Overview:** Currently relies on DataContext. Consider implementing a dedicated dashboard endpoint that returns all overview data in one call.

---

## Total Endpoints Summary

- **Dashboard:** Data from context (no direct API calls, but data should come from backend)
- **Transactions:** 5 endpoints (including 2 shared)
- **Portfolio:** 1 endpoint
- **Goals:** 4 endpoints
- **AI Insights:** 3 endpoints
- **Analytics:** 1 endpoint (recommended)
- **Notifications:** 4 endpoints
- **Settings:** 6 endpoints
- **Cross-Dashboard Chat:** 3 endpoints

**Total: 27 API endpoints** (includes 2 shared endpoints: `/api/transactions/process` and `/api/lookup/ticker`)

**Note:** Shared endpoints like `/api/transactions/process` and `/api/lookup/ticker` are used across dashboards (user/family/business) and do not have `/user/` prefix.

---

## DataContext Integration

Many user dashboard components rely on `DataContext` for data. Ensure the following data is fetched and stored in context:
- Transactions
- Holdings
- Portfolio value
- Total round-ups
- Goals
- Notifications

The context should fetch this data from the appropriate API endpoints when the user logs in or when components mount.




