# LLM Center Flow Tab - Transaction Processing Report

## Answer: YES, transactions ARE being processed through the Flow tab

The Flow tab in the Admin Dashboard → LLM Center is an **automatic background processing system** that processes pending transactions.

---

## 1. HOW THE FLOW TAB WORKS

### 1.1 Frontend Polling
**Location:** `frontend/src/components/admin/LLMCenter.jsx`

**Process:**
- When the Flow tab is active, it polls the backend every **30 seconds**
- Calls endpoint: `GET /api/admin/llm-center/automation/realtime`
- Updates the UI with real-time processing statistics

**Code:**
```javascript
// Real-time status polling (every 30 seconds when on Flow tab)
const realTimeInterval = setInterval(() => {
  if (activeTab === 'flow') {
    fetchAutomationData()  // Calls /api/admin/llm-center/automation/realtime
  }
}, 30000) // 30 seconds
```

### 1.2 What the Flow Tab Displays
- **Processing Queue:** Number of pending transactions waiting to be processed
- **Mapped Pending:** Transactions that have tickers but status is still 'pending'
- **Investment Ready:** Total transactions with tickers (ready for investment)
- **Total Processed:** Cumulative count of all transactions with `status='mapped'`
- **Active Processes:** Whether processing is currently active
- **Throughput:** Estimated transactions processed per second

---

## 2. BACKEND PROCESSING LOGIC

### 2.1 Endpoint: `/api/admin/llm-center/automation/realtime`
**Location:** `backend/app.py` (line 6185)

**What It Does:**

#### Step 1: Fix Existing Transactions
- Finds transactions that have a `ticker` but `status` is still `'pending'`
- Updates them to `status = 'mapped'`
- This fixes any inconsistencies

#### Step 2: Count Pending Transactions
- Queries: `SELECT COUNT(*) FROM transactions WHERE status = 'pending'`
- This is the "Processing Queue" shown in the Flow tab

#### Step 3: Auto-Process Pending Transactions
**CRITICAL:** This is where transactions get processed!

**Process:**
1. **Fetches unmapped pending transactions:**
   ```sql
   SELECT id, merchant FROM transactions 
   WHERE status = 'pending' 
   AND ticker IS NULL 
   AND merchant IS NOT NULL
   LIMIT 25
   ```

2. **For each transaction:**
   - Calls `auto_mapping_pipeline.map_merchant(merchant)`
   - This uses AI to generate a ticker mapping
   - If successful:
     - Updates transaction: `SET ticker = :ticker, category = :category, status = 'mapped'`
     - Creates LLM mapping record in `llm_mappings` table
     - Increments processed counter

3. **Commits changes** after processing batch

#### Step 4: Return Statistics
- Returns updated counts after processing
- Frontend displays these in the Flow tab

---

## 3. TWO PROCESSING PATHS

### 3.1 Path 1: During Bank Upload (Primary)
**Location:** `business_upload_bank_file()` in `app.py`

**When:** Happens immediately when user uploads bank file

**Process:**
1. Transaction inserted with `status = 'pending'`
2. **Queries `llm_mappings` table** for existing mappings:
   - Exact match
   - Normalized match
   - Partial match (first word only)
3. If mapping found → Updates to `status = 'mapped'` immediately
4. If no mapping found → Transaction remains `status = 'pending'`

**Advantage:** Fast, uses existing approved mappings
**Limitation:** Only works if mapping already exists in `llm_mappings` table

### 3.2 Path 2: Flow Tab Auto-Processing (Secondary)
**Location:** `/api/admin/llm-center/automation/realtime` endpoint

**When:** Happens when Flow tab is open (polls every 30 seconds)

**Process:**
1. Finds transactions with `status = 'pending'` and `ticker IS NULL`
2. **Calls `auto_mapping_pipeline.map_merchant()`** - Uses AI to generate new mappings
3. If successful → Updates to `status = 'mapped'` and creates mapping record
4. If fails → Transaction remains `status = 'pending'`

**Advantage:** Can create NEW mappings using AI
**Limitation:** 
- Only runs when Flow tab is open
- Requires `auto_mapping_pipeline` to be available
- Processes max 25 transactions per poll (every 30 seconds)

---

## 4. WHY TRANSACTIONS MIGHT NOT BE PROCESSED

### 4.1 During Bank Upload
**Reasons transactions remain pending:**
- No matching record in `llm_mappings` table
- Merchant name doesn't match any existing mappings (even with normalization)
- LLM mapping queries are slow/hanging (the issue we're fixing)

### 4.2 In Flow Tab
**Reasons transactions might not be processed:**
- **Flow tab not open** - Processing only happens when tab is active
- **`auto_mapping_pipeline` not available** - AI service not configured
- **Polling interval too long** - Only checks every 30 seconds
- **Batch limit** - Only processes 25 transactions per poll
- **Merchant name is NULL or empty** - Transactions without merchant names are skipped

---

## 5. TRANSACTION STATUS FLOW

```
[Bank Upload]
    ↓
[Transaction Created: status='pending', ticker=NULL]
    ↓
[Try LLM Mapping During Upload]
    ├─→ [Mapping Found] → status='mapped', ticker=XXX ✅
    └─→ [No Mapping] → status='pending', ticker=NULL ⏳
            ↓
    [Flow Tab Processing (if open)]
            ↓
    [auto_mapping_pipeline.map_merchant()]
            ├─→ [AI Mapping Success] → status='mapped', ticker=XXX ✅
            └─→ [AI Mapping Failed] → status='pending', ticker=NULL ⏳
                    ↓
            [Admin Manual Processing]
                    ↓
            [Admin assigns ticker] → status='mapped', ticker=XXX ✅
```

---

## 6. KEY DIFFERENCES

| Aspect | Bank Upload Processing | Flow Tab Processing |
|--------|----------------------|-------------------|
| **When** | Immediately during upload | Every 30 seconds (when tab open) |
| **Method** | Queries `llm_mappings` table | Uses `auto_mapping_pipeline` AI |
| **Speed** | Fast (if mapping exists) | Slower (AI processing) |
| **Creates New Mappings** | No (only uses existing) | Yes (generates new mappings) |
| **Requires** | `llm_mappings` table | `auto_mapping_pipeline` service |
| **Batch Size** | All transactions in file | 25 transactions per poll |
| **Status Update** | Immediate | After AI processing |

---

## 7. CURRENT ISSUE ANALYSIS

### 7.1 Why You're Not Seeing Transactions in Flow Tab

**Possible Reasons:**

1. **Flow tab not open** - Processing only happens when tab is active
2. **Transactions already mapped during upload** - If they got mapped, they won't appear in "pending" queue
3. **`auto_mapping_pipeline` not available** - Check backend logs for "auto_mapping_pipeline not available"
4. **Transactions have NULL merchant** - Flow tab skips transactions without merchant names
5. **Polling interval** - 30 seconds between checks means delay in seeing updates

### 7.2 How to Verify Processing

**Check Backend Logs:**
- Look for: `"✅ Auto-processed X transactions"`
- Look for: `"Warning: auto_mapping_pipeline not available"`
- Look for: `"Error auto-mapping transaction X"`

**Check Flow Tab:**
- **Processing Queue:** Should show pending transactions
- **Total Processed:** Should increment when transactions are mapped
- **Last Processed:** Should show recent timestamp

**Check Database:**
```sql
-- Pending transactions waiting for processing
SELECT COUNT(*) FROM transactions WHERE status = 'pending' AND ticker IS NULL;

-- Transactions processed by Flow tab
SELECT COUNT(*) FROM transactions WHERE status = 'mapped' AND ticker IS NOT NULL;
```

---

## 8. RECOMMENDATIONS

### 8.1 For Better Processing

1. **Ensure Flow Tab is Open:**
   - Keep the Flow tab open when expecting transactions
   - Processing only happens when tab is active

2. **Check `auto_mapping_pipeline` Availability:**
   - Verify the AI service is configured
   - Check backend logs for availability warnings

3. **Reduce Polling Interval (if needed):**
   - Currently 30 seconds
   - Can be reduced to 10-15 seconds for faster processing
   - Trade-off: More server load

4. **Increase Batch Size:**
   - Currently processes 25 transactions per poll
   - Can be increased to 50-100 for faster processing

5. **Fix Bank Upload LLM Mapping:**
   - The slow queries during upload are preventing immediate mapping
   - Once fixed, most transactions will be mapped during upload
   - Flow tab will only process the remaining unmapped ones

---

## 9. SUMMARY

**YES, transactions ARE being processed through the Flow tab**, but:

1. **It's a secondary processing path** - Primary mapping happens during bank upload
2. **Only processes when tab is open** - Requires admin to have Flow tab active
3. **Uses AI service** - Requires `auto_mapping_pipeline` to be available
4. **Processes in batches** - 25 transactions every 30 seconds
5. **Handles unmapped transactions** - Processes transactions that couldn't be mapped during upload

**The Flow tab is essentially a "catch-up" mechanism** that processes transactions that:
- Were uploaded but couldn't be mapped during upload (no existing mapping)
- Need AI processing to generate new mappings
- Are waiting in the queue for processing

---

## END OF REPORT

