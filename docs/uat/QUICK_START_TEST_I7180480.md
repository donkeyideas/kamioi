# Quick Start Test: User I7180480 Auto Sync → LLM Mapping

## What You'll See

When you enable auto sync and submit transactions for user **I7180480**, here's the complete flow:

### 1. **Transaction Submission** (User Dashboard)
- Click "Auto Sync" button → Opens bank connection widget
- OR use browser console to add sample transactions
- Transactions appear in User Transactions table

### 2. **LLM Center Auto-Processing** (Admin Dashboard)
- LLM Center automatically detects new transactions
- Flow Tab banner turns from Yellow (Idle) to Green (Active)
- Real-time metrics start updating:
  - Queue shows pending transaction count
  - Throughput shows processing rate
  - Processing metrics activate

### 3. **Mapping Creation** (LLM Center)
- Each transaction gets mapped to a stock symbol
- Mappings appear in "Pending Mappings" tab
- High-confidence mappings (>90%) auto-approve
- Lower confidence goes to "Pending" for review

### 4. **Learning System** (LLM Center Flow Tab)
- Learning Events increase
- Merchant Database updates with new merchants
- Accuracy metrics update based on results
- System learns from approvals/rejections

---

## Quick Test (Copy & Paste in Browser Console)

**On User Dashboard** (`/user/I7180480/dashboard`):

```javascript
// 1. Add Sample Transactions
const addTransactions = async () => {
  const transactions = [
    { user_id: 'I7180480', merchant_name: 'WALMART', amount: -45.67, description: 'WALMART SUPERCENTER', category: 'groceries', date: new Date().toISOString(), status: 'pending_mapping' },
    { user_id: 'I7180480', merchant_name: 'STARBUCKS', amount: -12.45, description: 'STARBUCKS STORE', category: 'food', date: new Date().toISOString(), status: 'pending_mapping' },
    { user_id: 'I7180480', merchant_name: 'AMAZON', amount: -234.56, description: 'AMAZON.COM', category: 'shopping', date: new Date().toISOString(), status: 'pending_mapping' }
  ];
  
  const response = await fetch('http://127.0.0.1:5111/api/user/transactions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('kamioi_user_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: 'I7180480', transactions })
  });
  
  const data = await response.json();
  console.log('✅ Transactions added:', data);
  return data;
};

// 2. Trigger LLM Processing
const triggerProcessing = async () => {
  const response = await fetch('http://127.0.0.1:5111/api/admin/ai/process-queue', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log('✅ LLM Processing started:', data);
  return data;
};

// Run complete test
(async () => {
  console.log('🚀 Starting test for user I7180480...');
  await addTransactions();
  await new Promise(r => setTimeout(r, 2000));
  await triggerProcessing();
  console.log('✅ Test complete! Open LLM Center Flow tab to see results.');
})();
```

---

## Expected Results

### In LLM Center Flow Tab:

**Status Banner:**
- Changes from: "System Idle - No Pending Transactions"
- To: "Real-Time Processing Active"
- Shows: "Processing X transactions/sec | Queue: 3 | Active Processes: 1"

**Real-Time Processing Card:**
- Active Connections: 1
- Processed Today: 3 (or number of transactions)
- Avg Time: ~250ms

**Batch Processing Card:**
- Queue Length: 3 (pending transactions)
- Processing Rate: Shows /min rate

**Merchant Database Card:**
- Unique Merchants: 3 (WALMART, STARBUCKS, AMAZON)
- Cache Hit Rate: Based on auto-approval rate
- Instant Recognitions: Estimated count

**Continuous Learning Card:**
- Learning Events: Increases as mappings are reviewed
- Accuracy Improvement: Updates based on results

---

## Sample Transaction Data

Use these transactions for testing:

```json
[
  {
    "user_id": "I7180480",
    "merchant_name": "WALMART",
    "amount": -45.67,
    "description": "WALMART SUPERCENTER #1234",
    "category": "groceries",
    "date": "2024-01-15T10:30:00Z",
    "status": "pending_mapping"
  },
  {
    "user_id": "I7180480",
    "merchant_name": "STARBUCKS",
    "amount": -12.45,
    "description": "STARBUCKS STORE #1234",
    "category": "food",
    "date": "2024-01-15T12:00:00Z",
    "status": "pending_mapping"
  },
  {
    "user_id": "I7180480",
    "merchant_name": "AMAZON",
    "amount": -234.56,
    "description": "AMAZON.COM",
    "category": "shopping",
    "date": "2024-01-15T15:00:00Z",
    "status": "pending_mapping"
  },
  {
    "user_id": "I7180480",
    "merchant_name": "APPLE STORE",
    "amount": -1299.99,
    "description": "APPLE STORE ONLINE",
    "category": "electronics",
    "date": "2024-01-15T16:00:00Z",
    "status": "pending_mapping"
  },
  {
    "user_id": "I7180480",
    "merchant_name": "NETFLIX",
    "amount": -15.99,
    "description": "NETFLIX.COM",
    "category": "subscription",
    "date": "2024-01-15T17:00:00Z",
    "status": "pending_mapping"
  }
]
```

---

## What Happens Behind the Scenes

1. **Transaction Added** → Status: `pending_mapping`
2. **LLM Center Detects** → Picks up transactions with `pending_mapping` status
3. **AI Processing** → Multi-model voting determines stock symbol
4. **Confidence Check** → If >90%, auto-approve; else pending review
5. **Learning Update** → Each approval/rejection feeds learning system
6. **Merchant Database** → New merchants added to cache
7. **Metrics Update** → All Flow Tab metrics recalculate from real data

---

## Success Indicators

✅ **Transaction appears in User Transactions page**
✅ **LLM Center Flow Tab banner turns GREEN**
✅ **Queue shows pending transaction count**
✅ **Pending Mappings tab shows new entries**
✅ **Each mapping has suggested stock symbol**
✅ **Metrics update in real-time**
✅ **High-confidence mappings auto-approve**

---

## Files Created

1. **SAMPLE_TRANSACTION_DATA_FOR_I7180480.md** - Detailed sample data
2. **TEST_AUTO_SYNC_I7180480.js** - Browser console test script
3. **COMPLETE_TEST_GUIDE_I7180480.md** - Full testing guide
4. **QUICK_START_TEST_I7180480.md** - This quick reference

---

Ready to test! 🚀




