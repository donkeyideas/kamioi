# Transactions to LLM Center Connection Flow - Comprehensive Report

## Executive Summary

This report documents how transactions from **User**, **Business**, and **Family** dashboards are connected to the **LLM Center** in the Admin Dashboard, and how the LLM Center attempts to map every user transaction.

---

## 🔄 Transaction Flow Architecture

### Phase 1: Transaction Processing & Initial Mapping

#### 1.1 Transaction Upload/Import

**User Dashboard:**
- Transactions uploaded via CSV or synced from bank connections
- File: `UserTransactions.jsx`
- Endpoint: `/api/transactions/process` (line 532)
- Called when user uploads CSV or when transactions are synced

**Business Dashboard:**
- Transactions uploaded via CSV or synced from business bank connections
- File: `BusinessTransactions.jsx`
- Endpoint: `/api/transactions/process` (line 502)
- Same endpoint as user, but dashboard_type identifies it as business

**Family Dashboard:**
- Transactions uploaded via CSV or synced from family bank connections
- File: `FamilyTransactions.jsx`
- Endpoint: `/api/transactions/process` (line 371)
- Same endpoint as user, but dashboard_type identifies it as family

**Process Flow:**
```javascript
// All dashboards use the same endpoint
POST http://127.0.0.1:5111/api/transactions/process
Body: {
  userId: userId,
  description: transaction.description,
  amount: transaction.amount,
  merchantName: transaction.merchant || ''
}
```

**Backend Processing:**
1. Transaction is received and stored in appropriate table:
   - User transactions → `user_transactions` table
   - Business transactions → `business_transactions` table
   - Family transactions → `family_transactions` table

2. **Initial LLM Mapping Attempt:**
   - Backend automatically attempts to map merchant to stock ticker using LLM
   - Creates a mapping record with status: `pending-mapping`, `mapped`, or `needs-recognition`
   - Mapping is stored in `llm_mappings` table (or similar)

3. **Transaction Status Set:**
   - `pending-mapping` - If LLM needs admin review
   - `mapped` - If LLM successfully mapped automatically
   - `needs-recognition` - If LLM cannot determine mapping
   - `pending` - Initial state before LLM processing

---

### Phase 2: User-Submitted Mappings

When users manually create/edit mappings for transactions:

#### 2.1 User Dashboard Mapping Submission

**File:** `UserTransactions.jsx` (lines 1299-1350)

**Endpoint:**
```
POST http://127.0.0.1:5111/api/user/submit-mapping
```

**Payload:**
```json
{
  "transaction_id": "string",
  "mapping_id": "string",
  "merchant_name": "string",
  "company_name": "string",
  "ticker_symbol": "string",
  "category": "string",
  "confidence": number,
  "notes": "string",
  "dashboard_type": "user"
}
```

**Action:**
- Updates transaction status to `pending-approval`
- Creates/updates mapping record in LLM mappings table
- Mapping appears in Admin LLM Center for review

#### 2.2 Business Dashboard Mapping Submission

**File:** `BusinessTransactions.jsx` (lines 1266-1305)

**Endpoint:**
```
POST http://127.0.0.1:5111/api/business/submit-mapping
```

**Payload:** (Same structure as user, but `dashboard_type: "business"`)

**Action:**
- Same as user dashboard - creates mapping request for admin approval

#### 2.3 Family Dashboard Mapping Submission

**File:** `FamilyTransactions.jsx` (lines 1135-1175)

**Endpoint:**
```
POST http://127.0.0.1:5111/api/family/submit-mapping
```

**Payload:** (Same structure as user, but `dashboard_type: "family"`)

**Action:**
- Same as user dashboard - creates mapping request for admin approval

---

### Phase 3: LLM Center Admin Dashboard

#### 3.1 LLM Center Data Fetching

**File:** `LLMCenter.jsx` (lines 243-440)

**Primary Endpoint:**
```
GET /api/admin/llm-center/dashboard
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalMappings": number,
      "dailyProcessed": number,
      "accuracyRate": number,
      "autoApprovalRate": number,
      "systemStatus": "online",
      "databaseStatus": "connected",
      "aiModelStatus": "active"
    },
    "mappings": {
      "pending": [...],
      "approved": [...],
      "rejected": [...]
    },
    "llm_data_assets": {...}
  }
}
```

**Key Features:**
1. **Single API Call:** Optimized to fetch all data in one request
2. **Auto-Refresh:** Refreshes every 15 minutes when data is stale
3. **Caching:** 5-minute cache duration for performance
4. **Tab-Specific Loading:** Loads data for pending/approved/rejected tabs separately

#### 3.2 Automatic AI Processing

**File:** `LLMCenter.jsx` (lines 372-416)

**Endpoint:**
```
POST /api/admin/ai/process-queue
```

**What It Does:**
- Automatically runs when LLM Center page loads
- Processes pending mappings through AI/LLM system
- Attempts to auto-approve high-confidence mappings
- Flags low-confidence mappings for admin review

**Processing Results:**
- `processed_count` - Number of mappings processed
- `auto_approved` - Mappings automatically approved by AI
- `review_required` - Mappings needing admin review
- `rejected` - Mappings rejected by AI

**After Processing:**
- Automatically refreshes dashboard data to show updated statuses
- Updates mapping counts in analytics

#### 3.3 Manual Mapping Review (Admin Actions)

**Approve Mapping:**
- **Endpoint:** `POST /api/admin/mapping/{mappingId}/approve`
- **File:** `LLMCenter.jsx` (lines 454-488)
- **Action:** Sets mapping status to `approved`
- **Result:** Transaction status updated to `mapped` or `completed`

**Reject Mapping:**
- **Endpoint:** `POST /api/admin/mapping/{mappingId}/reject`
- **File:** `LLMCenter.jsx` (lines 490-524)
- **Action:** Sets mapping status to `rejected`
- **Result:** Transaction status updated to `needs-recognition`

#### 3.4 Search & Filter

**File:** `LLMCenter.jsx` (lines 580-620)

**Endpoint:**
```
GET /api/admin/llm-center/mappings?search={query}&limit=10&page={page}
```

**Features:**
- Search mappings by merchant name, ticker, category
- Pagination support (10 items per page)
- Real-time search with 500ms debounce

---

## 🎯 How LLM Center Maps Every Transaction

### Automatic Mapping Process

#### Step 1: Transaction Creation
1. Transaction arrives at backend via `/api/transactions/process`
2. Backend extracts merchant name from transaction description
3. Backend attempts automatic LLM mapping:
   - Queries LLM with merchant name
   - LLM suggests stock ticker, category, confidence level
   - Creates mapping record

#### Step 2: Mapping Status Assignment
**High Confidence (>90%):**
- Status: `mapped`
- Auto-approved
- Transaction status: `mapped`
- Ready for investment

**Medium Confidence (70-90%):**
- Status: `pending-mapping`
- Requires admin review
- Transaction status: `pending-mapping`

**Low Confidence (<70%):**
- Status: `needs-recognition`
- Requires admin review
- Transaction status: `needs-recognition`

#### Step 3: Auto-Processing Queue
**Trigger:** LLM Center page load (automatic)

**Process:**
1. Fetches all pending mappings
2. Runs each through AI processing again
3. Re-evaluates confidence scores
4. Auto-approves high-confidence mappings
5. Flags others for manual review

**Code Reference:** `LLMCenter.jsx` lines 372-416

```javascript
// Auto AI Processing runs automatically
POST /api/admin/ai/process-queue
```

#### Step 4: Admin Review
- Admin views pending mappings in LLM Center
- Can approve or reject mappings
- Approved mappings update transaction status
- Rejected mappings are flagged for re-processing

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER/BUSINESS/FAMILY DASHBOARDS               │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Upload CSV │  │ Bank Sync  │  │ Manual Add  │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                    │
│         └────────────────┼────────────────┘                    │
│                          │                                     │
│              POST /api/transactions/process                   │
│                          │                                     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND PROCESSING                       │
│                                                                 │
│  1. Store transaction in appropriate table                      │
│     (user_transactions / business_transactions /                │
│      family_transactions)                                       │
│                                                                 │
│  2. Attempt LLM Mapping                                        │
│     ┌─────────────────────────────────────┐                   │
│     │ Query LLM with merchant name        │                   │
│     │ Get: ticker, category, confidence   │                   │
│     └─────────────────────────────────────┘                   │
│                                                                 │
│  3. Create Mapping Record                                      │
│     Status: pending-mapping / mapped / needs-recognition      │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LLM MAPPINGS TABLE                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ transaction_id | merchant | ticker | status | conf   │    │
│  ├───────────────────────────────────────────────────────┤    │
│  │ user_123       | Amazon   | AMZN   | pending | 85%  │    │
│  │ business_456   | Starbucks| SBUX   | mapped  | 95%  │    │
│  │ family_789     | Walmart  | WMT    | needs   | 60%  │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN LLM CENTER                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ GET /api/admin/llm-center/dashboard                     │  │
│  │                                                          │  │
│  │ Fetches:                                                 │  │
│  │ • Pending mappings                                       │  │
│  │ • Approved mappings                                      │  │
│  │ • Rejected mappings                                      │  │
│  │ • Analytics                                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ POST /api/admin/ai/process-queue                        │  │
│  │                                                          │  │
│  │ Auto-processes pending mappings:                        │  │
│  │ • Re-runs LLM analysis                                  │  │
│  │ • Auto-approves high confidence                         │  │
│  │ • Flags low confidence for review                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ POST /api/admin/mapping/{id}/approve                   │  │
│  │ POST /api/admin/mapping/{id}/reject                    │  │
│  │                                                          │  │
│  │ Admin manual review actions                             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Key API Endpoints Summary

### Transaction Processing (All Dashboards)
| Endpoint | Method | Dashboard | Purpose |
|----------|--------|-----------|---------|
| `/api/transactions/process` | POST | User/Business/Family | Process new transaction, attempt LLM mapping |
| `/api/user/submit-mapping` | POST | User | Submit manual mapping for admin approval |
| `/api/business/submit-mapping` | POST | Business | Submit manual mapping for admin approval |
| `/api/family/submit-mapping` | POST | Family | Submit manual mapping for admin approval |

### LLM Center (Admin Dashboard)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/llm-center/dashboard` | GET | Fetch all mappings, analytics, data |
| `/api/admin/llm-center/mappings` | GET | Search/filter mappings with pagination |
| `/api/admin/ai/process-queue` | POST | Auto-process pending mappings via AI |
| `/api/admin/mapping/{id}/approve` | POST | Approve a mapping |
| `/api/admin/mapping/{id}/reject` | POST | Reject a mapping |

### Transaction Status Mapping
| Status | Meaning | Action Required |
|--------|---------|-----------------|
| `pending` | Transaction created, awaiting LLM processing | Auto-process |
| `pending-mapping` | LLM attempted mapping, needs review | Admin review |
| `pending-approval` | User submitted mapping, awaiting admin | Admin review |
| `mapped` | Successfully mapped and approved | None - ready for investment |
| `needs-recognition` | LLM cannot determine mapping | Admin must map manually |
| `completed` | Mapping approved, investment processed | None - completed |
| `rejected` | Mapping rejected by admin | User can resubmit |

---

## 🔄 Retry AI Mapping Flow

All dashboards have a "Retry AI Mapping" feature:

**Files:**
- `UserTransactions.jsx` (line 520-588)
- `BusinessTransactions.jsx` (line 490-558)
- `FamilyTransactions.jsx` (line 360-427)

**Process:**
1. User clicks "Retry AI Mapping" on a transaction
2. Frontend calls `/api/transactions/process` with transaction details
3. Backend re-runs LLM analysis
4. Updates transaction with new AI analysis
5. Updates mapping status accordingly

---

## 📈 Mapping Status Lifecycle

```
Transaction Created
       │
       ▼
[Initial LLM Processing]
       │
       ├─── High Confidence (>90%) ───► [mapped] ───► Investment Ready
       │
       ├─── Medium Confidence (70-90%) ───► [pending-mapping] ───► Admin Review
       │
       └─── Low Confidence (<70%) ───► [needs-recognition] ───► Admin Review
       
[User Submits Manual Mapping]
       │
       ▼
[pending-approval] ───► Admin Review
       │
       ├─── Admin Approves ───► [mapped] ───► Investment Ready
       │
       └─── Admin Rejects ───► [needs-recognition] ───► User Can Retry
       
[Auto AI Processing Queue]
       │
       ▼
Re-evaluates [pending-mapping] status
       │
       ├─── Improved Confidence ───► [mapped] (Auto-approved)
       │
       └─── Still Low ───► Remains [pending-mapping]
```

---

## 🎯 Key Findings

### How Transactions Are Mapped

1. **Automatic on Upload:**
   - Every transaction processed through `/api/transactions/process` triggers LLM mapping attempt
   - Backend automatically creates mapping record

2. **Automatic Re-Processing:**
   - LLM Center auto-processes queue on page load
   - Re-evaluates pending mappings
   - Auto-approves high-confidence mappings

3. **User-Submitted Mappings:**
   - Users can manually create/edit mappings
   - Mappings submitted to admin for approval
   - Creates `pending-approval` status

4. **Admin Review:**
   - All `pending-mapping` and `pending-approval` mappings visible in LLM Center
   - Admin can approve or reject
   - Approved mappings become `mapped` status

### Connection Points

1. **Transaction Creation → LLM Mapping:**
   - Automatic via `/api/transactions/process`
   - Creates mapping record with LLM analysis

2. **User Mapping Submission → LLM Center:**
   - Via `/api/{dashboard_type}/submit-mapping`
   - Creates mapping record with `pending-approval` status
   - Visible in LLM Center

3. **LLM Center → Transaction Status Update:**
   - Admin approval/rejection updates transaction status
   - Changes reflected in user/business/family dashboards

---

## 📝 Files Involved

### Frontend Files
1. `UserTransactions.jsx` - User dashboard transactions
2. `BusinessTransactions.jsx` - Business dashboard transactions
3. `FamilyTransactions.jsx` - Family dashboard transactions
4. `LLMCenter.jsx` - Admin LLM Center (main component)
5. `AdminTransactions.jsx` - Admin transactions view

### Key Backend Endpoints (Expected)
1. `/api/transactions/process` - Process transactions, create mappings
2. `/api/{dashboard_type}/submit-mapping` - Submit user mappings
3. `/api/admin/llm-center/dashboard` - Fetch all LLM data
4. `/api/admin/llm-center/mappings` - Search/filter mappings
5. `/api/admin/ai/process-queue` - Auto-process mappings
6. `/api/admin/mapping/{id}/approve` - Approve mapping
7. `/api/admin/mapping/{id}/reject` - Reject mapping

---

## ✅ Summary

**Transaction to LLM Center Flow:**

1. **Transaction Created** → Backend attempts automatic LLM mapping
2. **Mapping Created** → Stored with status (pending-mapping/mapped/needs-recognition)
3. **LLM Center Fetches** → All mappings from all dashboards via single API call
4. **Auto-Processing** → Runs automatically on LLM Center load to re-evaluate mappings
5. **Admin Review** → Manual approve/reject actions update transaction status
6. **Status Sync** → Changes reflected back in user/business/family dashboards

**LLM Mapping Strategy:**

- **Automatic:** Every transaction processed automatically attempts LLM mapping
- **Continuous:** Auto-processing queue re-evaluates pending mappings
- **User Input:** Users can manually submit mappings for admin review
- **Admin Oversight:** All mappings reviewed and approved/rejected by admin
- **Status-Driven:** Transaction status reflects mapping state throughout lifecycle

---

**Report Generated:** 2025-01-31  
**Status:** Complete Analysis




