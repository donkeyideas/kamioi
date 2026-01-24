# Business Dashboard API Endpoints Report

## Overview
This document provides a comprehensive list of all API endpoints used by the Business Dashboard, organized by page/component. Each endpoint includes the HTTP method, URL, purpose, and expected request/response format.

---

## 1. Overview Page (`BusinessOverview.jsx`)

### GET Dashboard Overview
- **Endpoint:** `GET /api/business/dashboard/overview`
- **Full URL:** `http://127.0.0.1:5111/api/business/dashboard/overview`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch business dashboard overview data including revenue, employees, projects, and key metrics
- **Expected Response:**
```json
{
  "success": true,
  "data": {
    "total_revenue": 0,
    "monthly_revenue": 0,
    "revenue_growth": 0,
    "total_employees": 0,
    "active_projects": 0,
    "completed_projects": 0,
    "client_satisfaction": 0,
    "team_productivity": 0,
    "monthly_expenses": 0,
    "profit_margin": 0,
    "cash_flow": 0,
    "roi": 0,
    "recent_activities": [],
    "key_metrics": {}
  }
}
```

---

## 2. Transactions Page (`BusinessTransactions.jsx`)

### GET Business AI Insights
- **Endpoint:** `GET /api/business/ai/insights`
- **Full URL:** `http://127.0.0.1:5111/api/business/ai/insights`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch AI insights and mappings for business transactions
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
- **Endpoint:** `POST /api/business/submit-mapping`
- **Full URL:** `http://127.0.0.1:5111/api/business/submit-mapping`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Submit transaction mapping for business transactions
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

### POST Process Transaction
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

### GET Lookup Ticker
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

### GET Export Transactions
- **Endpoint:** `GET /api/business/export/transactions`
- **Full URL:** `http://127.0.0.1:5111/api/business/export/transactions`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Export business transactions as CSV
- **Expected Response:**
```json
{
  "success": true,
  "download_url": "string"
}
```

---

## 3. Team Page (`BusinessTeam.jsx`)

### GET Team Members
- **Endpoint:** `GET /api/business/team/members`
- **Full URL:** `http://127.0.0.1:5111/api/business/team/members`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all team members for the business
- **Expected Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "string",
        "name": "string",
        "email": "string",
        "role": "string",
        "status": "string",
        "permissions": [],
        "portfolioValue": 0
      }
    ]
  }
}
```
**OR**
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
      "permissions": [],
      "portfolioValue": 0
    }
  ]
}
```

### POST Add Team Member
- **Endpoint:** `POST /api/business/team/members`
- **Full URL:** `http://127.0.0.1:5111/api/business/team/members`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Add a new team member
- **Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "role": "string",
  "permissions": []
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Team member added successfully",
  "member": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "status": "string"
  }
}
```

### PUT Update Team Member
- **Endpoint:** `PUT /api/business/team/members/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/business/team/members/{id}`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Update an existing team member
- **Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "role": "string",
  "permissions": []
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Team member updated successfully",
  "member": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "status": "string"
  }
}
```

### DELETE Team Member
- **Endpoint:** `DELETE /api/business/team/members/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/business/team/members/{id}`
- **Method:** DELETE
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Remove a team member
- **Expected Response:**
```json
{
  "success": true,
  "message": "Team member removed successfully"
}
```

---

## 4. Business Goals Page (`BusinessGoals.jsx`)

### GET Business Goals
- **Endpoint:** `GET /api/business/goals`
- **Full URL:** `http://127.0.0.1:5111/api/business/goals`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all business goals
- **Expected Response:**
```json
{
  "success": true,
  "goals": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "target": 0,
      "current": 0,
      "department": "string",
      "deadline": "string",
      "status": "string"
    }
  ]
}
```
**OR**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "target": 0,
        "current": 0,
        "department": "string",
        "deadline": "string",
        "status": "string"
      }
    ]
  }
}
```

### POST Create Goal
- **Endpoint:** `POST /api/business/goals`
- **Full URL:** `http://127.0.0.1:5111/api/business/goals`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Create a new business goal
- **Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "target": 0,
  "current": 0,
  "department": "string",
  "deadline": "string",
  "status": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Business goal created successfully",
  "goal": {
    "id": "string",
    "name": "string",
    "description": "string",
    "target": 0,
    "current": 0,
    "department": "string",
    "deadline": "string",
    "status": "string"
  }
}
```

### PUT Update Goal
- **Endpoint:** `PUT /api/business/goals/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/business/goals/{id}`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Update an existing business goal or update goal progress
- **Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "target": 0,
  "current": 0,
  "department": "string",
  "deadline": "string",
  "status": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Business goal updated successfully",
  "goal": {
    "id": "string",
    "name": "string",
    "description": "string",
    "target": 0,
    "current": 0,
    "department": "string",
    "deadline": "string",
    "status": "string"
  }
}
```

### DELETE Goal
- **Endpoint:** `DELETE /api/business/goals/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/business/goals/{id}`
- **Method:** DELETE
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Delete a business goal
- **Expected Response:**
```json
{
  "success": true,
  "message": "Business goal deleted successfully"
}
```

---

## 5. Analytics Page (`BusinessAnalytics.jsx`)

### GET Business Analytics
- **Endpoint:** `GET /api/business/analytics`
- **Full URL:** `http://127.0.0.1:5111/api/business/analytics`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch business analytics data including performance, revenue, and trends
- **Expected Response:**
```json
{
  "success": true,
  "analytics": {
    "performance": {
      // Performance metrics
    },
    "revenue": {
      // Revenue data
    },
    "trends": {
      // Trend data
    }
  }
}
```
**OR**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "performance": {},
      "revenue": {},
      "trends": {}
    }
  }
}
```
**OR**
```json
{
  "success": true,
  "data": {
    "performance": {},
    "revenue": {},
    "trends": {}
  }
}
```

---

## 6. Reports Page (`BusinessReports.jsx`)

### GET Business Reports
- **Endpoint:** `GET /api/business/reports`
- **Full URL:** `http://127.0.0.1:5111/api/business/reports`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all generated business reports
- **Expected Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "period": "string",
      "status": "string",
      "created_at": "string",
      "size": "string",
      "format": "string"
    }
  ]
}
```

### POST Generate Report
- **Endpoint:** `POST /api/business/reports/generate`
- **Full URL:** `http://127.0.0.1:5111/api/business/reports/generate`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Generate a new business report
- **Request Body:**
```json
{
  "name": "string",
  "type": "string",
  "period": "string",
  "format": "string",
  "start_date": "string",
  "end_date": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "report": {
    "id": "string",
    "name": "string",
    "type": "string",
    "period": "string",
    "status": "string",
    "created_at": "string",
    "size": "string",
    "format": "string",
    "download_url": "string"
  }
}
```

### GET Download Report
- **Endpoint:** `GET /api/business/reports/{id}/download`
- **Full URL:** `http://127.0.0.1:5111/api/business/reports/{id}/download`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Download a generated report
- **Expected Response:**
```json
{
  "success": true,
  "download_url": "string"
}
```
**OR** Direct file download (binary)

---

## 7. Settings Page (`BusinessSettings.jsx`)

### GET General Settings
- **Endpoint:** `GET /api/business/settings`
- **Full URL:** `http://127.0.0.1:5111/api/business/settings`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch general business settings
- **Expected Response:**
```json
{
  "success": true,
  "settings": {
    "roundup_multiplier": 1.0,
    "theme": "string",
    "auto_invest": false,
    "notifications": false,
    "email_alerts": false,
    "business_sharing": false,
    "budget_alerts": false
  }
}
```

### PUT General Settings
- **Endpoint:** `PUT /api/business/settings`
- **Full URL:** `http://127.0.0.1:5111/api/business/settings`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Update general business settings
- **Request Body:**
```json
{
  "roundup_multiplier": 1.0,
  "theme": "string",
  "auto_invest": false,
  "notifications": false,
  "email_alerts": false,
  "business_sharing": false,
  "budget_alerts": false
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Settings saved successfully"
}
```

### GET Account Settings
- **Endpoint:** `GET /api/business/settings/account`
- **Full URL:** `http://127.0.0.1:5111/api/business/settings/account`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch account/profile settings
- **Expected Response:**
```json
{
  "success": true,
  "account": {
    "name": "string",
    "email": "string",
    "company_name": "string",
    "phone": "string",
    "address": "string"
  }
}
```

### PUT Account Settings
- **Endpoint:** `PUT /api/business/settings/account`
- **Full URL:** `http://127.0.0.1:5111/api/business/settings/account`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Update account/profile settings
- **Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "company_name": "string",
  "phone": "string",
  "address": "string"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Account settings saved successfully"
}
```

### GET Security Settings
- **Endpoint:** `GET /api/business/settings/security`
- **Full URL:** `http://127.0.0.1:5111/api/business/settings/security`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch security settings
- **Expected Response:**
```json
{
  "success": true,
  "security": {
    "two_factor_enabled": false,
    "password_expiry_days": 0,
    "session_timeout_minutes": 0
  }
}
```

### PUT Security Settings
- **Endpoint:** `PUT /api/business/settings/security`
- **Full URL:** `http://127.0.0.1:5111/api/business/settings/security`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Update security settings
- **Request Body:**
```json
{
  "two_factor_enabled": false,
  "password_expiry_days": 0,
  "session_timeout_minutes": 0
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Security settings saved successfully"
}
```

### GET Notification Settings
- **Endpoint:** `GET /api/business/settings/notifications`
- **Full URL:** `http://127.0.0.1:5111/api/business/settings/notifications`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch notification preferences
- **Expected Response:**
```json
{
  "success": true,
  "notifications": {
    "email_notifications": false,
    "push_notifications": false,
    "sms_notifications": false,
    "transaction_alerts": false,
    "budget_alerts": false,
    "investment_alerts": false,
    "team_updates": false,
    "weekly_reports": false
  }
}
```

### PUT Notification Settings
- **Endpoint:** `PUT /api/business/settings/notifications`
- **Full URL:** `http://127.0.0.1:5111/api/business/settings/notifications`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Update notification preferences
- **Request Body:**
```json
{
  "email_notifications": false,
  "push_notifications": false,
  "sms_notifications": false,
  "transaction_alerts": false,
  "budget_alerts": false,
  "investment_alerts": false,
  "team_updates": false,
  "weekly_reports": false
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Notification settings saved successfully"
}
```

### GET Data Settings
- **Endpoint:** `GET /api/business/settings/data`
- **Full URL:** `http://127.0.0.1:5111/api/business/settings/data`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch data management settings
- **Expected Response:**
```json
{
  "success": true,
  "data_management": {
    "auto_backup": false,
    "backup_frequency": "string",
    "data_retention_days": 0,
    "export_format": "string",
    "data_sharing": false,
    "analytics_tracking": false
  }
}
```

### PUT Data Settings
- **Endpoint:** `PUT /api/business/settings/data`
- **Full URL:** `http://127.0.0.1:5111/api/business/settings/data`
- **Method:** PUT
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Update data management settings
- **Request Body:**
```json
{
  "auto_backup": false,
  "backup_frequency": "string",
  "data_retention_days": 0,
  "export_format": "string",
  "data_sharing": false,
  "analytics_tracking": false
}
```
- **Expected Response:**
```json
{
  "success": true,
  "message": "Data settings saved successfully"
}
```

### GET Bank Connections
- **Endpoint:** `GET /api/business/bank-connections`
- **Full URL:** `http://127.0.0.1:5111/api/business/bank-connections`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch connected bank accounts
- **Expected Response:**
```json
{
  "success": true,
  "connections": [
    {
      "id": "string",
      "account_id": "string",
      "bank_name": "string",
      "institution_name": "string",
      "account_type": "string",
      "account_number": "string",
      "masked_account_number": "string",
      "status": "string"
    }
  ]
}
```

### DELETE Bank Connection
- **Endpoint:** `DELETE /api/business/bank-connections/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/business/bank-connections/{id}`
- **Method:** DELETE
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Disconnect a bank account
- **Expected Response:**
```json
{
  "success": true,
  "message": "Bank account disconnected successfully"
}
```

---

## 8. Notifications Page (`BusinessNotifications.jsx`)

### GET Business Notifications
- **Endpoint:** `GET /api/business/notifications`
- **Full URL:** `http://127.0.0.1:5111/api/business/notifications`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Fetch all business notifications
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
- **Endpoint:** `PUT /api/business/notifications/{id}/read`
- **Full URL:** `http://127.0.0.1:5111/api/business/notifications/{id}/read`
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
- **Endpoint:** `PUT /api/business/notifications/read-all`
- **Full URL:** `http://127.0.0.1:5111/api/business/notifications/read-all`
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
- **Endpoint:** `DELETE /api/business/notifications/{id}`
- **Full URL:** `http://127.0.0.1:5111/api/business/notifications/{id}`
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

### GET Export Notifications
- **Endpoint:** `GET /api/business/notifications/export`
- **Full URL:** `http://127.0.0.1:5111/api/business/notifications/export`
- **Method:** GET
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Purpose:** Export notifications as CSV
- **Expected Response (Option 1):**
```json
{
  "success": true,
  "download_url": "string"
}
```
- **Expected Response (Option 2):**
```json
{
  "success": true,
  "file_data": "string (CSV content)"
}
```

---

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer {kamioi_user_token}
```

The token is retrieved from localStorage: `localStorage.getItem('kamioi_user_token')`

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

### Overview Page
- [ ] GET `/api/business/dashboard/overview` returns dashboard data

### Transactions Page
- [ ] GET `/api/business/ai/insights` returns AI insights
- [ ] POST `/api/transactions/process` processes transaction with AI
- [ ] GET `/api/lookup/ticker?company={name}` returns ticker symbol
- [ ] POST `/api/business/submit-mapping` submits mapping successfully
- [ ] GET `/api/business/export/transactions` exports CSV

### Team Page
- [ ] GET `/api/business/team/members` returns team members
- [ ] POST `/api/business/team/members` creates new member
- [ ] PUT `/api/business/team/members/{id}` updates member
- [ ] DELETE `/api/business/team/members/{id}` deletes member

### Business Goals Page
- [ ] GET `/api/business/goals` returns goals
- [ ] POST `/api/business/goals` creates new goal
- [ ] PUT `/api/business/goals/{id}` updates goal
- [ ] DELETE `/api/business/goals/{id}` deletes goal

### Analytics Page
- [ ] GET `/api/business/analytics` returns analytics data

### Reports Page
- [ ] GET `/api/business/reports` returns reports
- [ ] POST `/api/business/reports/generate` generates report
- [ ] GET `/api/business/reports/{id}/download` downloads report

### Settings Page
- [ ] GET `/api/business/settings` returns general settings
- [ ] PUT `/api/business/settings` updates general settings
- [ ] GET `/api/business/settings/account` returns account settings
- [ ] PUT `/api/business/settings/account` updates account settings
- [ ] GET `/api/business/settings/security` returns security settings
- [ ] PUT `/api/business/settings/security` updates security settings
- [ ] GET `/api/business/settings/notifications` returns notification settings
- [ ] PUT `/api/business/settings/notifications` updates notification settings
- [ ] GET `/api/business/settings/data` returns data settings
- [ ] PUT `/api/business/settings/data` updates data settings
- [ ] GET `/api/business/bank-connections` returns bank connections
- [ ] DELETE `/api/business/bank-connections/{id}` disconnects bank

### Notifications Page
- [ ] GET `/api/business/notifications` returns notifications
- [ ] PUT `/api/business/notifications/{id}/read` marks as read
- [ ] PUT `/api/business/notifications/read-all` marks all as read
- [ ] DELETE `/api/business/notifications/{id}` deletes notification
- [ ] GET `/api/business/notifications/export` exports CSV

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

Ensure all business dashboard endpoints are accessible from the admin dashboard for:
1. Viewing business data
2. Managing business accounts
3. Viewing analytics across businesses
4. Generating admin reports
5. Troubleshooting issues

---

## Notes

1. Some endpoints may accept multiple response formats (e.g., `data.goals` vs `goals` at root level). Frontend handles both formats.

2. Date/timestamp fields can be in various formats - frontend handles `created_at`, `timestamp`, and `date` fields.

3. CSV export endpoints should handle both URL-based downloads and direct file data returns.

4. All endpoints should implement proper CORS headers if frontend is on a different origin.

5. Consider implementing rate limiting for API endpoints to prevent abuse.

6. All endpoints should log requests for debugging and audit purposes.

---

## Total Endpoints Summary

- **Overview:** 1 endpoint
- **Transactions:** 5 endpoints (including shared endpoints)
- **Team:** 4 endpoints
- **Business Goals:** 4 endpoints
- **Analytics:** 1 endpoint
- **Reports:** 3 endpoints
- **Settings:** 13 endpoints
- **Notifications:** 5 endpoints

**Total: 36 API endpoints** (includes 2 shared endpoints: `/api/transactions/process` and `/api/lookup/ticker`)

**Note:** Some endpoints like `/api/transactions/process` and `/api/lookup/ticker` are shared across dashboards (family/business) and may not have `/business/` prefix.

