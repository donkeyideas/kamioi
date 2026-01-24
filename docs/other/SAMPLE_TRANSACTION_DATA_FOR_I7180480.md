# Sample Transaction Data for User I7180480 - Auto Sync Test

## Overview
This document provides sample transaction data to test the auto-sync → LLM mapping → LLM Center workflow for user ID: **I7180480**

---

## Test Scenario

**Goal:** Enable auto sync → Sync transactions → Watch them get mapped → See results in LLM Center

**User ID:** `I7180480`
**Expected Flow:**
1. User clicks "Auto Sync" button on User Dashboard
2. System syncs transactions from bank
3. Transactions appear in User Transactions page
4. LLM Center automatically processes them
5. Mappings are created and visible in LLM Center
6. Flow Tab shows real-time processing

---

## Sample Transaction Data

### Transaction Set 1: Grocery Store Purchases
```json
{
  "user_id": "I7180480",
  "transactions": [
    {
      "id": "TXN_001",
      "merchant_name": "WALMART",
      "amount": -45.67,
      "description": "WALMART SUPERCENTER #1234",
      "category": "groceries",
      "date": "2024-01-15T10:30:00Z",
      "account_id": "ACC_001",
      "transaction_type": "purchase"
    },
    {
      "id": "TXN_002",
      "merchant_name": "TARGET",
      "amount": -89.32,
      "description": "TARGET STORE #567",
      "category": "retail",
      "date": "2024-01-15T14:22:00Z",
      "account_id": "ACC_001",
      "transaction_type": "purchase"
    },
    {
      "id": "TXN_003",
      "merchant_name": "WHOLE FOODS MARKET",
      "amount": -156.89,
      "description": "WHOLE FOODS #890",
      "category": "groceries",
      "date": "2024-01-15T18:45:00Z",
      "account_id": "ACC_001",
      "transaction_type": "purchase"
    }
  ]
}
```

### Transaction Set 2: Restaurant & Food
```json
{
  "user_id": "I7180480",
  "transactions": [
    {
      "id": "TXN_004",
      "merchant_name": "STARBUCKS",
      "amount": -12.45,
      "description": "STARBUCKS STORE #1234",
      "category": "food",
      "date": "2024-01-16T08:15:00Z",
      "account_id": "ACC_001",
      "transaction_type": "purchase"
    },
    {
      "id": "TXN_005",
      "merchant_name": "MCDONALDS",
      "amount": -24.89,
      "description": "MCDONALDS #456",
      "category": "food",
      "date": "2024-01-16T12:30:00Z",
      "account_id": "ACC_001",
      "transaction_type": "purchase"
    },
    {
      "id": "TXN_006",
      "merchant_name": "AMAZON",
      "amount": -234.56,
      "description": "AMAZON.COM",
      "category": "shopping",
      "date": "2024-01-16T15:22:00Z",
      "account_id": "ACC_001",
      "transaction_type": "purchase"
    }
  ]
}
```

### Transaction Set 3: Tech & Services
```json
{
  "user_id": "I7180480",
  "transactions": [
    {
      "id": "TXN_007",
      "merchant_name": "APPLE STORE",
      "amount": -1299.99,
      "description": "APPLE STORE ONLINE",
      "category": "electronics",
      "date": "2024-01-17T09:00:00Z",
      "account_id": "ACC_001",
      "transaction_type": "purchase"
    },
    {
      "id": "TXN_008",
      "merchant_name": "NETFLIX",
      "amount": -15.99,
      "description": "NETFLIX.COM",
      "category": "subscription",
      "date": "2024-01-17T10:00:00Z",
      "account_id": "ACC_001",
      "transaction_type": "subscription"
    },
    {
      "id": "TXN_009",
      "merchant_name": "SHELL",
      "amount": -45.67,
      "description": "SHELL GAS STATION",
      "category": "gas",
      "date": "2024-01-17T16:45:00Z",
      "account_id": "ACC_001",
      "transaction_type": "purchase"
    }
  ]
}
```

---

## Expected LLM Mapping Results

When these transactions are processed, the LLM should map them to stocks:

1. **WALMART** → `WMT` (Walmart Inc.)
2. **TARGET** → `TGT` (Target Corporation)
3. **WHOLE FOODS MARKET** → `AMZN` (Amazon - owns Whole Foods)
4. **STARBUCKS** → `SBUX` (Starbucks Corporation)
5. **MCDONALDS** → `MCD` (McDonald's Corporation)
6. **AMAZON** → `AMZN` (Amazon.com Inc.)
7. **APPLE STORE** → `AAPL` (Apple Inc.)
8. **NETFLIX** → `NFLX` (Netflix Inc.)
9. **SHELL** → `SHEL` (Shell plc)

---

## API Endpoints for Testing

### 1. Sync Transactions (User Dashboard)
```
POST /api/user/transactions/sync
Headers: {
  "Authorization": "Bearer {user_token}",
  "Content-Type": "application/json"
}
Body: {
  "user_id": "I7180480",
  "sync_type": "auto",
  "force_refresh": true
}
```

### 2. Add Transactions (Manual - for testing)
```
POST /api/user/transactions
Headers: {
  "Authorization": "Bearer {user_token}",
  "Content-Type": "application/json"
}
Body: {
  "user_id": "I7180480",
  "transactions": [/* transaction array from above */}
}
```

### 3. Process Transactions (LLM Center)
```
POST /api/admin/ai/process-queue
Headers: {
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

### 4. Get User Transactions
```
GET /api/user/transactions?user_id=I7180480
Headers: {
  "Authorization": "Bearer {user_token}"
}
```

### 5. Get Pending Mappings (LLM Center)
```
GET /api/admin/llm-center/mappings?status=pending&user_id=I7180480
Headers: {
  "Authorization": "Bearer {admin_token}"
}
```

---

## Step-by-Step Testing Process

### Step 1: Enable Auto Sync on User Dashboard
1. Navigate to User Dashboard (`/user/{I7180480}/dashboard`)
2. Find "Auto Sync" button in DashboardHeader
3. Click to enable
4. System should start polling for new transactions

### Step 2: Submit Sample Transactions
**Option A: Via Auto Sync (if backend supports)**
- Auto sync should fetch transactions from bank
- For testing, you may need to simulate this

**Option B: Via Manual API Call**
```bash
curl -X POST http://127.0.0.1:5111/api/user/transactions \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "I7180480",
    "transactions": [
      {
        "merchant_name": "WALMART",
        "amount": -45.67,
        "description": "WALMART SUPERCENTER #1234",
        "category": "groceries",
        "date": "2024-01-15T10:30:00Z"
      }
    ]
  }'
```

### Step 3: Watch Transactions Appear
1. Check User Transactions page
2. Should see new transactions listed
3. Transactions should have status: "pending_mapping"

### Step 4: LLM Center Auto-Processing
1. Navigate to Admin LLM Center (`/admin/1/llm-center`)
2. Go to "Flow" tab
3. Watch Real-Time Status Banner change from "Idle" to "Active"
4. Metrics should update:
   - Queue: Should show pending transaction count
   - Processing Rate: Should increase
   - Active Processes: Should show 1

### Step 5: View Mappings
1. Go to "Pending Mappings" tab in LLM Center
2. Should see new mappings created for each transaction
3. Each mapping should show:
   - Transaction details
   - Suggested stock symbol (e.g., WMT for Walmart)
   - Confidence score
   - Status: "pending"

### Step 6: Verify Flow Tab Updates
1. Stay on "Flow" tab
2. Watch metrics update in real-time:
   - **Real-Time Processing Card:**
     - Active Connections: 1
     - Processed Today: Number of transactions processed
     - Avg Time: Actual processing time
   
   - **Batch Processing Card:**
     - Queue Length: Number of pending transactions
     - Processing Rate: Transactions per minute
   
   - **Continuous Learning Card:**
     - Learning Events: Should increase
     - Accuracy Improvement: Should update
   
   - **Merchant Database Card:**
     - Unique Merchants: Should increase (new merchants added)
     - Cache Hit Rate: May increase if merchants already exist
     - Instant Recognitions: Should increase

---

## Expected Behavior

### When Transactions First Sync:
- **Real-Time Processing:** Active (green banner)
- **Queue:** Shows number of new transactions
- **Throughput:** Shows transactions/sec being processed

### During Processing:
- Transactions move from "pending" to "processing" to "completed"
- Mappings are created automatically
- High-confidence mappings (>90%) are auto-approved
- Lower confidence mappings go to "pending" for review

### After Processing:
- **Learning Events:** Increases by number of reviewed mappings
- **Merchant Database:** New unique merchants added
- **Cache Hit Rate:** May improve if merchants already existed

---

## Troubleshooting

### If transactions don't sync:
1. Check user authentication token
2. Verify user_id matches: `I7180480`
3. Check backend API logs
4. Verify `/api/user/transactions/sync` endpoint exists

### If mappings don't appear in LLM Center:
1. Check that transactions have `status: "pending_mapping"`
2. Verify `/api/admin/ai/process-queue` is being called
3. Check LLM Center auto-processing is enabled
4. Verify user_id is being passed to mapping creation

### If Flow Tab shows zero metrics:
1. Ensure transactions are actually being processed
2. Check that `calculateAutomationMetricsFromRealData()` is being called
3. Verify pendingMappings array has items
4. Check console logs for calculation errors

---

## Quick Test Script

```javascript
// Run this in browser console on User Dashboard (user I7180480 logged in)

const testTransactions = [
  {
    merchant_name: "WALMART",
    amount: -45.67,
    description: "WALMART SUPERCENTER #1234",
    category: "groceries",
    date: new Date().toISOString()
  },
  {
    merchant_name: "STARBUCKS",
    amount: -12.45,
    description: "STARBUCKS STORE #1234",
    category: "food",
    date: new Date().toISOString()
  }
];

// Add transactions
fetch('http://127.0.0.1:5111/api/user/transactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('kamioi_user_token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 'I7180480',
    transactions: testTransactions
  })
})
.then(r => r.json())
.then(data => {
  console.log('Transactions added:', data);
  // Then trigger LLM processing
  return fetch('http://127.0.0.1:5111/api/admin/ai/process-queue', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token')}`,
      'Content-Type': 'application/json'
    }
  });
})
.then(r => r.json())
.then(data => console.log('LLM Processing started:', data));
```

---

## Success Indicators

✅ **Transactions synced:**
- User Transactions page shows new transactions
- Transactions have `status: "pending_mapping"`

✅ **LLM Center activated:**
- Flow tab banner turns green ("Real-Time Processing Active")
- Queue shows pending transaction count
- Processing rate > 0

✅ **Mappings created:**
- Pending Mappings tab shows new entries
- Each mapping has suggested stock symbol
- Confidence scores displayed

✅ **Metrics updated:**
- Learning Events increased
- Unique Merchants increased
- Processing metrics show activity

✅ **Auto-approval working:**
- High-confidence mappings (>90%) automatically approved
- Approved Mappings tab shows auto-approved items

---

## Next Steps

1. Enable auto sync for user I7180480
2. Submit sample transactions (via API or auto sync)
3. Watch LLM Center Flow tab in real-time
4. Verify mappings are created and processed
5. Check metrics update correctly
6. Confirm learning system updates

This will demonstrate the complete workflow from transaction sync → LLM mapping → metrics display!




