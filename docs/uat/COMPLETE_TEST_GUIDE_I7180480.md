# Complete Test Guide: Auto Sync → LLM Mapping Flow
## User ID: I7180480

---

## Overview

This guide will help you test the complete workflow:
1. **Enable Auto Sync** on User Dashboard
2. **Submit sample transactions** for user I7180480
3. **Watch LLM Center** process them in real-time
4. **Verify mappings** are created correctly

---

## Quick Start - Browser Console Method

### Step 1: Open Browser Console

1. Go to User Dashboard: `/user/I7180480/dashboard`
2. Press `F12` to open Developer Tools
3. Go to "Console" tab
4. Copy and paste the test script from `TEST_AUTO_SYNC_I7180480.js`

### Step 2: Run Complete Test

```javascript
// Run the complete test
await window.testAutoSync.runComplete()
```

This will:
- ✅ Add 5 sample transactions
- ✅ Trigger LLM processing
- ✅ Check for mappings
- ✅ Monitor LLM Center metrics

---

## Manual Step-by-Step Testing

### Method 1: Via User Dashboard Auto Sync Button

1. **Navigate to User Dashboard**
   - URL: `http://localhost:4000/user/I7180480/dashboard`
   - Login as user with ID: `I7180480`

2. **Click "Auto Sync" Button**
   - Located in the Dashboard Header (green button)
   - This opens MX Connect Widget for bank linking
   - OR triggers manual sync if already connected

3. **Submit Sample Transactions** (Use browser console)
   ```javascript
   // Add sample transactions
   const transactions = [
     {
       user_id: 'I7180480',
       merchant_name: 'WALMART',
       amount: -45.67,
       description: 'WALMART SUPERCENTER #1234',
       category: 'groceries',
       date: new Date().toISOString(),
       status: 'pending_mapping'
     },
     {
       user_id: 'I7180480',
       merchant_name: 'STARBUCKS',
       amount: -12.45,
       description: 'STARBUCKS STORE #1234',
       category: 'food',
       date: new Date().toISOString(),
       status: 'pending_mapping'
     },
     {
       user_id: 'I7180480',
       merchant_name: 'AMAZON',
       amount: -234.56,
       description: 'AMAZON.COM',
       category: 'shopping',
       date: new Date().toISOString(),
       status: 'pending_mapping'
     }
   ];
   
   // Add via API
   fetch('http://127.0.0.1:5111/api/user/transactions', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('kamioi_user_token')}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       user_id: 'I7180480',
       transactions: transactions
     })
   })
   .then(r => r.json())
   .then(data => {
     console.log('✅ Transactions added:', data);
     alert(`Added ${transactions.length} transactions! Check LLM Center now.`);
   });
   ```

4. **Open LLM Center** (in another tab)
   - URL: `http://localhost:4000/admin/1/llm-center`
   - Go to "Flow" tab immediately

5. **Watch Real-Time Processing**
   - Banner should turn green: "Real-Time Processing Active"
   - Queue should show pending transaction count
   - Metrics should update automatically

---

## Method 2: Direct API Testing

### Step 1: Add Transactions via API

```bash
curl -X POST http://127.0.0.1:5111/api/user/transactions \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "I7180480",
    "transactions": [
      {
        "merchant_name": "WALMART",
        "amount": -45.67,
        "description": "WALMART SUPERCENTER #1234",
        "category": "groceries",
        "date": "2024-01-15T10:30:00Z",
        "status": "pending_mapping"
      },
      {
        "merchant_name": "STARBUCKS",
        "amount": -12.45,
        "description": "STARBUCKS STORE #1234",
        "category": "food",
        "date": "2024-01-15T12:00:00Z",
        "status": "pending_mapping"
      }
    ]
  }'
```

### Step 2: Trigger LLM Processing

```bash
curl -X POST http://127.0.0.1:5111/api/admin/ai/process-queue \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 3: Check Results

```bash
# Get pending mappings
curl http://127.0.0.1:5111/api/admin/llm-center/mappings?status=pending&user_id=I7180480 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get LLM Center dashboard
curl http://127.0.0.1:5111/api/admin/llm-center/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Expected LLM Mappings

When transactions are processed, they should map to:

| Merchant | Expected Ticker | Stock Name |
|----------|----------------|------------|
| WALMART | WMT | Walmart Inc. |
| STARBUCKS | SBUX | Starbucks Corporation |
| AMAZON | AMZN | Amazon.com Inc. |
| APPLE STORE | AAPL | Apple Inc. |
| NETFLIX | NFLX | Netflix Inc. |
| MCDONALDS | MCD | McDonald's Corporation |
| TARGET | TGT | Target Corporation |

---

## What to Watch in LLM Center Flow Tab

### Before Transactions:
- **Status Banner:** Yellow - "System Idle - No Pending Transactions"
- **Real-Time Processing:** All zeros
- **Queue:** 0 transactions
- **Throughput:** 0/sec

### After Transactions Added:
1. **Status Banner:** Should turn GREEN - "Real-Time Processing Active"
2. **Queue:** Should show number of pending transactions (e.g., "3 transactions")
3. **Throughput:** Should show processing rate (e.g., "2/sec")
4. **Active Processes:** Should show "1"

### During Processing:
1. **Real-Time Processing Card:**
   - Active Connections: 1
   - Processed Today: Increases
   - Avg Time: Shows processing time

2. **Batch Processing Card:**
   - Queue Length: Shows pending count
   - Processing Rate: Shows /min rate

3. **Continuous Learning Card:**
   - Learning Events: Increases
   - Accuracy Improvement: Updates

4. **Merchant Database Card:**
   - Unique Merchants: Increases (new merchants added)
   - Instant Recognitions: Increases

### After Processing:
1. **Pending Mappings Tab:**
   - Should show new mappings
   - Each mapping shows:
     - Transaction details
     - Suggested stock symbol
     - Confidence score
     - Status: "pending"

2. **Approved Mappings Tab:**
   - High-confidence mappings (>90%) should auto-approve
   - Should appear here automatically

---

## Troubleshooting

### If transactions don't appear:
1. ✅ Check user_id matches: `I7180480`
2. ✅ Verify API endpoint: `/api/user/transactions`
3. ✅ Check authentication token
4. ✅ Verify transactions have `status: "pending_mapping"`

### If LLM Center doesn't activate:
1. ✅ Check that transactions exist with `status: "pending_mapping"`
2. ✅ Verify `/api/admin/ai/process-queue` endpoint exists
3. ✅ Check LLM Center auto-processing is enabled
4. ✅ Verify `calculateAutomationMetricsFromRealData()` is called

### If mappings don't appear:
1. ✅ Check Pending Mappings tab
2. ✅ Verify user_id is being passed to mapping creation
3. ✅ Check backend logs for processing errors
4. ✅ Verify LLM model is running

### If metrics don't update:
1. ✅ Check browser console for errors
2. ✅ Verify `pendingMappings` state has items
3. ✅ Check that `useEffect` is triggering recalculation
4. ✅ Look for console logs: "📊 Calculating automation metrics"

---

## Success Checklist

✅ **Transactions Added:**
- [ ] User Transactions page shows new transactions
- [ ] Transactions have `status: "pending_mapping"`
- [ ] Transactions visible for user I7180480

✅ **LLM Center Activated:**
- [ ] Flow tab banner turns green
- [ ] Queue shows pending count
- [ ] Processing rate > 0
- [ ] Active processes = 1

✅ **Mappings Created:**
- [ ] Pending Mappings tab shows entries
- [ ] Each mapping has suggested stock symbol
- [ ] Confidence scores displayed
- [ ] Mappings linked to user I7180480

✅ **Metrics Updated:**
- [ ] Real-Time Processing shows activity
- [ ] Learning Events increased
- [ ] Unique Merchants increased
- [ ] Processing metrics show activity

✅ **Auto-Approval Working:**
- [ ] High-confidence mappings (>90%) auto-approved
- [ ] Approved Mappings tab shows entries
- [ ] Flow tab metrics reflect approvals

---

## Sample Data Quick Reference

**5 Test Transactions:**
1. WALMART → WMT (Walmart)
2. STARBUCKS → SBUX (Starbucks)
3. AMAZON → AMZN (Amazon)
4. APPLE STORE → AAPL (Apple)
5. NETFLIX → NFLX (Netflix)

**User ID:** `I7180480`

**API Base:** `http://127.0.0.1:5111`

**Endpoints:**
- Add Transactions: `POST /api/user/transactions`
- Process LLM: `POST /api/admin/ai/process-queue`
- Get Mappings: `GET /api/admin/llm-center/mappings?status=pending`
- Get Dashboard: `GET /api/admin/llm-center/dashboard`

---

## Next Steps After Testing

1. **Verify Mappings are Correct:**
   - Check that WALMART → WMT
   - Check that STARBUCKS → SBUX
   - Verify confidence scores are reasonable

2. **Test Auto-Approval:**
   - High-confidence mappings should auto-approve
   - Check Approved Mappings tab

3. **Test Manual Review:**
   - Low-confidence mappings should require review
   - Test approve/reject actions

4. **Verify Learning:**
   - After approvals/rejections, check Learning Events increase
   - Verify accuracy metrics update

5. **Check Round-Up Investment:**
   - After mappings are approved, check if round-ups are processed
   - Verify portfolio updates

---

This test will show you the complete flow from transaction sync → LLM mapping → metrics display!




