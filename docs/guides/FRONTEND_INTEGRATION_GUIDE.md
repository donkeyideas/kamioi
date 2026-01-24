# Frontend Integration Guide - Kamioi Platform

## 🎯 **BACKEND APIs READY FOR FRONTEND INTEGRATION**

All backend APIs are fully operational and ready for frontend integration. Here's the complete integration guide:

---

## **📡 API ENDPOINTS STATUS**

### **✅ USER DASHBOARD APIs**
```javascript
// All endpoints tested and working (200 OK)
GET  /api/user/transactions          // Investment transactions
GET  /api/user/dashboard/overview    // Portfolio overview
GET  /api/user/ai/insights          // AI recommendations
GET  /api/user/roundups/total       // Round-up statistics
GET  /api/user/fees/total          // Fee statistics
GET  /api/user/goals               // User goals
GET  /api/user/notifications       // Notifications
```

### **✅ FAMILY DASHBOARD APIs**
```javascript
// All endpoints tested and working (200 OK)
GET  /api/family/dashboard/overview  // Family overview
GET  /api/family/transactions       // Family transactions
GET  /api/family/ai/insights       // Family AI insights
GET  /api/family/members           // Family members
GET  /api/family/portfolio         // Shared portfolio
GET  /api/family/goals             // Family goals
```

### **✅ BUSINESS DASHBOARD APIs**
```javascript
// All endpoints tested and working (200 OK)
GET  /api/business/dashboard/overview  // Business overview
GET  /api/business/transactions       // Business transactions
GET  /api/business/ai/insights       // Business AI insights
GET  /api/business/team              // Team management
GET  /api/business/portfolio         // Business portfolio
GET  /api/business/goals             // Business goals
```

### **✅ ADMIN DASHBOARD APIs**
```javascript
// All endpoints tested and working (200 OK)
GET  /api/admin/transactions         // Aggregated transactions
GET  /api/admin/llm-center/queue     // Mapping queue
GET  /api/admin/events/stats         // Event bus statistics
GET  /api/admin/roundup/stats        // Round-up engine stats
GET  /api/admin/auto-mapping/stats   // Auto-mapping stats
GET  /api/admin/health               // System health
```

---

## **🔧 FRONTEND INTEGRATION STEPS**

### **Step 1: Start Frontend Server**
```bash
cd frontend
npm start
# or
yarn start
```

### **Step 2: Verify Backend Connection**
```javascript
// Test backend connectivity
const testBackend = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('Backend connected:', data);
  } catch (error) {
    console.error('Backend connection failed:', error);
  }
};
```

### **Step 3: Update API Base URL**
```javascript
// In your API service file
const API_BASE_URL = 'http://localhost:5000/api';

// Example API calls
const fetchUserTransactions = async () => {
  const response = await fetch(`${API_BASE_URL}/user/transactions`);
  return response.json();
};

const fetchFamilyOverview = async () => {
  const response = await fetch(`${API_BASE_URL}/family/dashboard/overview`);
  return response.json();
};

const fetchBusinessInsights = async () => {
  const response = await fetch(`${API_BASE_URL}/business/ai/insights`);
  return response.json();
};

const fetchAdminTransactions = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/transactions`);
  return response.json();
};
```

---

## **📊 DATA STRUCTURE EXAMPLES**

### **User Transactions Response**
```json
{
  "data": [
    {
      "id": 101,
      "date": "2025-10-08T09:00:00Z",
      "merchant": "Apple Store",
      "amount": 250.0,
      "category": "technology",
      "description": "Apple stock purchase",
      "investable": 0.5,
      "round_up": 1.0,
      "total_debit": 251.25,
      "ticker": "AAPL",
      "shares": 0.5,
      "price_per_share": 500.0,
      "status": "completed"
    }
  ],
  "success": true
}
```

### **Family Overview Response**
```json
{
  "data": {
    "family_goals": [
      {
        "id": 1,
        "title": "Family Vacation",
        "target_amount": 10000.0,
        "current_amount": 3000.0,
        "progress": 30
      }
    ],
    "shared_portfolio": {
      "total_value": 25000.0,
      "total_gains": 5000.0,
      "gain_percentage": 25.0
    }
  },
  "success": true
}
```

### **Business Insights Response**
```json
{
  "data": {
    "insights": [
      {
        "type": "revenue",
        "title": "Revenue Growth",
        "description": "Monthly revenue increased 25% this quarter",
        "trend": "up"
      }
    ]
  },
  "success": true
}
```

### **Admin Transactions Response**
```json
{
  "data": [
    {
      "id": 1,
      "dashboard": "Family",
      "user_type": "family",
      "amount": 2000.0,
      "date": "2025-10-08T20:00:00Z",
      "description": "Family Contribution",
      "is_mapping": false
    }
  ],
  "summary": {
    "total_transactions": 3,
    "user_count": 1,
    "family_count": 1,
    "business_count": 1
  },
  "success": true
}
```

---

## **🔄 REAL-TIME UPDATES**

### **Polling Implementation**
```javascript
// Real-time updates using polling
const useRealTimeUpdates = (endpoint, interval = 30000) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/${endpoint}`);
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error('Real-time update failed:', error);
      }
    };
    
    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, interval);
    
    return () => clearInterval(intervalId);
  }, [endpoint, interval]);
  
  return data;
};

// Usage in components
const UserTransactions = () => {
  const transactions = useRealTimeUpdates('user/transactions', 30000);
  // Component renders with real-time data
};
```

---

## **🎨 COMPONENT INTEGRATION EXAMPLES**

### **User Dashboard Component**
```javascript
import React, { useState, useEffect } from 'react';

const UserDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [transactionsRes, overviewRes, insightsRes] = await Promise.all([
          fetch('http://localhost:5000/api/user/transactions'),
          fetch('http://localhost:5000/api/user/dashboard/overview'),
          fetch('http://localhost:5000/api/user/ai/insights')
        ]);
        
        const [transactionsData, overviewData, insightsData] = await Promise.all([
          transactionsRes.json(),
          overviewRes.json(),
          insightsRes.json()
        ]);
        
        setTransactions(transactionsData.data);
        setOverview(overviewData.data);
        setInsights(insightsData.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  return (
    <div className="user-dashboard">
      <h1>User Dashboard</h1>
      {overview && (
        <div className="overview">
          <p>Portfolio Value: ${overview.portfolio_value}</p>
          <p>Total Gains: ${overview.total_gains}</p>
          <p>Gain Percentage: {overview.gain_percentage}%</p>
        </div>
      )}
      <div className="transactions">
        {transactions.map(transaction => (
          <div key={transaction.id} className="transaction">
            <p>{transaction.merchant}: ${transaction.amount}</p>
            <p>Round-up: ${transaction.round_up}</p>
            <p>Status: {transaction.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### **Admin Dashboard Component**
```javascript
import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [transactionsRes, queueRes, healthRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/transactions'),
          fetch('http://localhost:5000/api/admin/llm-center/queue'),
          fetch('http://localhost:5000/api/admin/health')
        ]);
        
        const [transactionsData, queueData, healthData] = await Promise.all([
          transactionsRes.json(),
          queueRes.json(),
          healthRes.json()
        ]);
        
        setTransactions(transactionsData.data);
        setQueueStatus(queueData.data);
        setSystemHealth(healthData);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      }
    };
    
    fetchAdminData();
  }, []);
  
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {systemHealth && (
        <div className="system-health">
          <p>Status: {systemHealth.status}</p>
          <p>Service: {systemHealth.service}</p>
        </div>
      )}
      <div className="transactions">
        {transactions.map(transaction => (
          <div key={transaction.id} className="transaction">
            <p>Dashboard: {transaction.dashboard}</p>
            <p>Amount: ${transaction.amount}</p>
            <p>Date: {transaction.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## **🚨 ERROR HANDLING**

### **API Error Handling**
```javascript
const handleApiError = (error, endpoint) => {
  console.error(`API Error for ${endpoint}:`, error);
  
  if (error.status === 404) {
    console.error('Endpoint not found - check backend server');
  } else if (error.status === 500) {
    console.error('Server error - check backend logs');
  } else if (error.name === 'TypeError') {
    console.error('Network error - check backend connectivity');
  }
};

// Usage in API calls
const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`http://localhost:5000/api/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    handleApiError(error, endpoint);
    throw error;
  }
};
```

---

## **✅ INTEGRATION CHECKLIST**

- [ ] **Backend Server Running**: `http://localhost:5000`
- [ ] **Frontend Server Running**: `http://localhost:3764` (or your port)
- [ ] **CORS Configured**: Backend allows frontend origins
- [ ] **API Endpoints Tested**: All endpoints return 200 OK
- [ ] **Data Structure Verified**: Responses match expected format
- [ ] **Error Handling Implemented**: Proper error handling in place
- [ ] **Real-time Updates**: Polling or WebSocket implementation
- [ ] **Component Integration**: All dashboard components connected

---

## **🎯 READY FOR INTEGRATION**

**All backend APIs are fully operational and ready for frontend integration. The system provides:**

- ✅ **Complete API Coverage**: All dashboard endpoints working
- ✅ **Consistent Data Structure**: Standardized response format
- ✅ **Real-time Capabilities**: Polling-based updates ready
- ✅ **Error Handling**: Robust error management
- ✅ **CORS Configuration**: Frontend-backend communication enabled
- ✅ **Mock Data**: Realistic data for development and testing

**The frontend can now be fully integrated with the backend system!**
