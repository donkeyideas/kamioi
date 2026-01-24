# Bank Statement Upload Process - Complete Flow Documentation

## Overview
This document details the complete process flow when a user uploads a bank statement file (CSV or Excel) through the Business Dashboard.

---

## 1. FRONTEND UPLOAD PROCESS

### 1.1 User Initiates Upload
**Location:** `frontend/src/components/business/BusinessDashboardHeader.jsx`

**Steps:**
1. User clicks "Upload Bank File" button
2. File input dialog opens
3. User selects CSV or Excel file
4. `handleBankFileUpload()` function is triggered

### 1.2 File Validation & Preparation
**Code Location:** `BusinessDashboardHeader.jsx` (lines 145-219)

**Process:**
- Validates file exists and has content
- Checks file extension (`.csv`, `.xlsx`, `.xls`)
- Retrieves authentication token from localStorage:
  - Priority: `kamioi_business_token` → `kamioi_user_token` → `kamioi_token` → `authToken`
  - **Critical:** Rejects admin tokens (`admin_token_*`) - only business/user tokens allowed
- Creates `FormData` object with file
- Sets up loading state with progress messages:
  - "Preparing file..."
  - "Uploading file to server..."
  - "Processing transactions..."

### 1.3 HTTP Request to Backend
**Code Location:** `BusinessDashboardHeader.jsx` (lines 235-266)

**Details:**
- **Endpoint:** `POST /api/business/upload-bank-file`
- **Headers:** `Authorization: Bearer {token}`
- **Body:** `FormData` containing the file
- **Timeout:** 5 minutes (300,000ms)
- **Progress Tracking:** Heartbeat logs every 2 seconds while waiting

### 1.4 Response Handling
**Code Location:** `BusinessDashboardHeader.jsx` (lines 268-310)

**On Success:**
- Displays success modal with:
  - Number of transactions processed
  - Total rows in file
  - Error count (if any)
- Dispatches refresh events:
  - `refreshTransactions` event (after 1.5 seconds)
  - `dataRefresh` event (after 1.5 seconds)
- Closes loading modal

**On Error:**
- Displays error modal with specific error message
- Closes loading modal
- Logs error details to console

---

## 2. BACKEND FILE PROCESSING

### 2.1 Request Reception
**Location:** `backend/app.py` - `business_upload_bank_file()` function (line 16818)

**Initial Steps:**
1. Receives POST request at `/api/business/upload-bank-file`
2. Handles CORS preflight (OPTIONS request)
3. Authenticates user via `get_auth_user()`
4. **Validates user:**
   - Rejects admin users (403 error)
   - Verifies user exists in database (404 if not found)
   - Confirms user has `business` role

### 2.2 File Reading & Parsing
**Code Location:** `app.py` (lines 16908-16967)

**CSV Files:**
- Tries multiple encodings: `utf-8`, `latin-1`, `cp1252`, `iso-8859-1`, `windows-1252`
- Uses `csv.DictReader` to parse rows
- Falls back to `utf-8` with error replacement if all encodings fail

**Excel Files:**
- Uses `pandas.read_excel()` to read file
- Converts DataFrame to dictionary records
- Requires `pandas` and `openpyxl` libraries

### 2.3 Column Mapping
**Code Location:** `app.py` (lines 16969-17036)

**Flexible Column Detection:**
- **Date columns:** `date`, `Date`, `DATE`, `transaction_date`, `Transaction Date`, `Posting Date`, etc.
- **Amount columns:** `amount`, `Amount`, `AMOUNT`, `transaction_amount`, `Debit`, `Credit`, etc.
- **Description columns:** `description`, `Description`, `DESCRIPTION`, `Memo`, `Details`, etc.
- **Merchant columns:** `merchant`, `Merchant`, `MERCHANT`, `merchant_name`, `Vendor`, `Payee`, etc.
- **Category columns:** `category`, `Category`, `CATEGORY`, `type`, `Business Type`, etc.

**Validation:**
- Requires: Date and Amount columns
- Requires: Description OR Merchant column
- Returns 400 error if required columns missing

### 2.4 Transaction Processing Loop
**Code Location:** `app.py` (lines 17078-17420)

**For Each Row:**

#### Step 1: Data Extraction
- Extracts date, amount, merchant, description, category
- Combines merchant and description if both exist
- Uses merchant as description if description empty

#### Step 2: Data Parsing
- **Date Parsing:** Tries multiple formats:
  - `%Y-%m-%d`, `%Y-%m-%d %H:%M:%S`
  - `%m/%d/%Y`, `%d/%m/%Y`
  - `%m-%d-%Y`, `%d-%m-%Y`
  - ISO format with timezone
- **Amount Parsing:**
  - Removes currency symbols (`$`, `,`)
  - Handles accounting format (parentheses = negative)
  - Converts positive amounts to negative if expense keywords detected
  - Defaults to negative for business transactions (expenses)

#### Step 3: Transaction Creation
- Calculates:
  - `round_up`: $1.00 (default for business)
  - `fee`: 10% of amount (for expenses/debits)
  - `total_debit`: `abs(amount) + round_up + fee`
- **Inserts into `transactions` table:**
  - `user_id`, `amount`, `merchant`, `category`, `date`, `description`
  - `round_up`, `fee`, `total_debit`
  - `status`: `'pending'` (initial status)
  - `created_at`: current timestamp

#### Step 4: Automatic LLM Mapping (CRITICAL)
**Code Location:** `app.py` (lines 17181-17415)

**Process:**

**A. Query Existing LLM Mappings:**
1. **Exact Match:**
   - Query: `SELECT ticker FROM llm_mappings WHERE LOWER(merchant_name) = LOWER(:merchant) AND status = 'approved' AND admin_approved = 1`
   - Uses exact merchant name

2. **Normalized Match:**
   - Normalizes merchant name:
     - Removes `#1234` patterns
     - Removes state codes (`WA`, `CA`, etc.)
     - Removes zip codes
     - Converts to uppercase, trims whitespace
   - Query: Same as exact match but with normalized name

3. **Partial Match (Optimized):**
   - Only uses first word of merchant name
   - Query: `SELECT ticker FROM llm_mappings WHERE LOWER(merchant_name) LIKE LOWER(:pattern) AND status = 'approved' AND admin_approved = 1`
   - Pattern: `{first_word}%` (prefix match - faster than `%pattern%`)
   - **Note:** This was optimized to prevent hanging on large tables

**B. Auto-Mapping Pipeline (Fallback):**
- If no LLM mapping found, tries `auto_mapping_pipeline.map_merchant()`
- Uses AI service to generate mapping
- Creates new mapping if successful

**C. Update Transaction:**
- If mapping found:
  - Updates transaction: `SET ticker = :ticker, category = :category, status = 'mapped'`
  - Creates LLM mapping record in `llm_mappings` table (if doesn't exist)
  - Sets `status = 'mapped'` on transaction
- If no mapping found:
  - Transaction remains with `status = 'pending'`
  - Logs: `"No mapping found for '{merchant_name}' - transaction remains pending"`

#### Step 5: Progress Logging
- Logs every 5 transactions: `"Processed X/Y transactions..."`
- Logs every 10 rows: `"Processing row X/Y..."`

### 2.5 Database Commit
**Code Location:** `app.py` (lines 17436-17452)

**Process:**
1. Commits all transactions to database
2. **Verification Step:**
   - Queries database to confirm transactions saved
   - Counts transactions for user
   - Logs verification result
3. Returns response with:
   - `processed`: Number of successful transactions
   - `total_rows`: Total rows in file
   - `errors`: Array of error messages (limited to 10)
   - `error_count`: Total number of errors
   - `processing_time`: Time taken in seconds

---

## 3. TRANSACTION STATUS FLOW

### 3.1 Initial Status: `pending`
- All transactions start as `pending` when inserted
- No ticker assigned
- No category assigned (or uses CSV category)

### 3.2 Automatic Mapping: `mapped`
- If LLM mapping found during upload:
  - Status changes to `mapped`
  - Ticker assigned
  - Category updated (from mapping or CSV)
  - Transaction ready for investment

### 3.3 Manual Admin Processing: `mapped` or `completed`
- Admin reviews pending transactions in LLM Center
- Can approve/reject mappings
- Can manually assign tickers
- Status changes based on admin action

---

## 4. FRONTEND REFRESH & DISPLAY

### 4.1 Event-Driven Refresh
**Code Location:** `BusinessTransactions.jsx` (lines 265-290)

**Events Listened:**
- `refreshTransactions` - Triggers data refresh
- `dataRefresh` - Triggers data refresh with source detail

**Process:**
1. Event listener in `BusinessTransactions.jsx` receives event
2. Calls `refreshData()` from `DataContext`
3. Fetches updated transactions from `/api/business/transactions`
4. Updates transaction list display

### 4.2 Transaction Display
**Location:** `BusinessTransactions.jsx`

**Shows:**
- Date, Type, Merchant, Category, Amount
- **Status Badge:**
  - `Mapped` (green) - Has ticker, ready for investment
  - `Pending` (yellow) - No ticker, needs mapping
  - `Completed` (blue) - Investment executed
- Company logo (if ticker exists)
- Action buttons (Edit, View Details, etc.)

### 4.3 Connected Pages
**All pages that use transactions:**

1. **Business Transactions Page** (`/business/{account_number}/transactions`)
   - Full transaction list
   - Filtering and search
   - Status display

2. **Business Overview/Dashboard** (`/business/{account_number}/overview`)
   - Summary cards:
     - Available to Invest (mapped transactions)
     - What Was Invested (completed transactions)
     - Pending Recognition (pending transactions)
   - Transaction statistics

3. **Business AI Insights** (`/business/{account_number}/ai-insights`)
   - AI recommendations based on transactions
   - Only shows recommendations if transactions exist
   - Uses mapped transactions for investment suggestions

4. **Business Portfolio** (`/business/{account_number}/portfolio`)
   - Shows investments made from transactions
   - Groups by ticker/company

5. **Business Goals** (`/business/{account_number}/goals`)
   - Investment goals based on transaction patterns

---

## 5. ADMIN PROCESSING (LLM Center)

### 5.1 LLM Center Location
**Admin Dashboard:** `/admin/llm-center`

### 5.2 Pending Transactions View
**What Admins See:**
- All transactions with `status = 'pending'`
- Merchant names that couldn't be mapped
- Transaction details (date, amount, description)

### 5.3 Admin Actions

**A. Manual Mapping:**
- Admin can search for ticker
- Assign ticker to merchant
- Approve mapping
- Creates/updates `llm_mappings` record

**B. Bulk Processing:**
- Process multiple transactions at once
- Use AI to suggest mappings
- Approve/reject suggestions

**C. Mapping Management:**
- View all `llm_mappings` records
- Edit existing mappings
- Delete incorrect mappings
- Set confidence scores

### 5.4 Mapping Approval Flow
1. Admin assigns ticker to merchant
2. Sets `admin_approved = 1` in `llm_mappings`
3. Sets `status = 'approved'` in `llm_mappings`
4. Updates transaction: `status = 'mapped'`, `ticker = {ticker}`
5. Transaction now appears as "Mapped" in user dashboard

### 5.5 LLM Mapping Table Structure
**Table:** `llm_mappings`

**Columns:**
- `id` - Primary key
- `merchant_name` - Merchant name (normalized)
- `ticker` - Stock ticker symbol
- `category` - Transaction category
- `user_id` - User who created transaction
- `transaction_id` - Original transaction ID
- `status` - `'approved'`, `'pending'`, `'rejected'`
- `admin_approved` - `1` (approved) or `0` (not approved)
- `confidence` - AI confidence score (0-100)
- `ai_processed` - Whether AI was used
- `created_at` - Timestamp

---

## 6. DATA FLOW DIAGRAM

```
[User Uploads File]
        ↓
[Frontend: BusinessDashboardHeader.jsx]
        ↓
[HTTP POST /api/business/upload-bank-file]
        ↓
[Backend: business_upload_bank_file()]
        ↓
[File Parsing (CSV/Excel)]
        ↓
[Column Mapping & Validation]
        ↓
[For Each Row:]
    ├─→ [Extract Data]
    ├─→ [Parse Date & Amount]
    ├─→ [Insert into transactions table (status='pending')]
    ├─→ [Query llm_mappings table]
    │   ├─→ Exact match?
    │   ├─→ Normalized match?
    │   └─→ Partial match?
    ├─→ [If mapping found:]
    │   ├─→ Update transaction (status='mapped', ticker=...)
    │   └─→ Create llm_mappings record
    └─→ [If no mapping:]
        └─→ Transaction remains 'pending'
        ↓
[Commit to Database]
        ↓
[Return Response to Frontend]
        ↓
[Frontend: Dispatch refresh events]
        ↓
[BusinessTransactions.jsx: Refresh data]
        ↓
[Display Updated Transactions]
```

---

## 7. KEY DATABASE TABLES

### 7.1 `transactions` Table
**Purpose:** Stores all user transactions

**Key Columns:**
- `id` - Primary key
- `user_id` - Foreign key to users
- `amount` - Transaction amount (negative for expenses)
- `merchant` - Merchant name
- `category` - Transaction category
- `date` - Transaction date
- `description` - Full description
- `ticker` - Stock ticker (NULL if not mapped)
- `status` - `'pending'`, `'mapped'`, `'completed'`
- `round_up` - Round-up amount
- `fee` - Transaction fee
- `total_debit` - Total debit amount
- `created_at` - Timestamp

### 7.2 `llm_mappings` Table
**Purpose:** Stores merchant-to-ticker mappings

**Key Columns:**
- `merchant_name` - Normalized merchant name
- `ticker` - Stock ticker symbol
- `status` - `'approved'`, `'pending'`, `'rejected'`
- `admin_approved` - Boolean (1 = approved by admin)
- `confidence` - AI confidence score
- `user_id` - User who created original transaction
- `transaction_id` - Original transaction ID

---

## 8. PERFORMANCE OPTIMIZATIONS

### 8.1 LLM Mapping Query Optimization
**Problem:** LIKE queries with leading wildcards (`%pattern%`) are very slow on large tables

**Solution:**
- Only uses prefix matching (`pattern%`) instead of full wildcard
- Limits to first word only (not 3, 2, 1 word combinations)
- Removed reverse match queries
- Added indexes on `merchant_name` and `status` columns

### 8.2 Progress Logging
- Logs every 5 transactions processed
- Logs every 10 rows parsed
- Uses `flush=True` to ensure logs appear immediately

### 8.3 Database Connection Management
- Uses connection pooling
- Properly releases connections after use
- Commits in batches (all transactions in one commit)

---

## 9. ERROR HANDLING

### 9.1 Frontend Errors
- **Authentication Error:** Token missing or invalid
- **Network Error:** Backend server not reachable
- **Timeout Error:** Request takes longer than 5 minutes
- **Upload Error:** Backend returns error response

### 9.2 Backend Errors
- **401 Unauthorized:** User not authenticated
- **403 Forbidden:** Admin user trying to upload
- **404 Not Found:** User doesn't exist in database
- **400 Bad Request:** Missing required columns, invalid file format
- **500 Internal Server Error:** Database error, parsing error

### 9.3 Transaction-Level Errors
- Individual row errors are caught and logged
- Error details include row number and data context
- Failed rows don't stop entire upload
- Error count returned in response

---

## 10. ADMIN WORKFLOW SUMMARY

### 10.1 Viewing Pending Transactions
1. Navigate to Admin Dashboard → LLM Center
2. View "Pending" tab
3. See all transactions with `status = 'pending'`
4. Filter by user, date, merchant, etc.

### 10.2 Processing Pending Transactions
1. Select transaction(s)
2. Search for appropriate ticker
3. Assign ticker and category
4. Approve mapping
5. Transaction status changes to `'mapped'`
6. User sees updated transaction in their dashboard

### 10.3 Managing Mappings
1. View all mappings in "Mappings" tab
2. Edit existing mappings
3. Delete incorrect mappings
4. Set confidence scores
5. Bulk approve/reject

---

## 11. INTEGRATION POINTS

### 11.1 Transaction Data Used By:
- **Business Dashboard Overview** - Summary statistics
- **Business Transactions Page** - Full transaction list
- **Business AI Insights** - Investment recommendations
- **Business Portfolio** - Investment tracking
- **Business Goals** - Goal setting and tracking
- **Round-up Calculations** - Automatic round-up amounts
- **Fee Calculations** - Transaction fees

### 11.2 LLM Mapping Data Used By:
- **Bank Upload Process** - Automatic mapping during upload
- **Admin LLM Center** - Mapping management
- **Transaction Display** - Showing company logos and names
- **AI Recommendations** - Investment suggestions

---

## 12. FUTURE IMPROVEMENTS

### 12.1 Performance
- Batch LLM mapping queries (process multiple merchants at once)
- Cache frequently used mappings
- Add database indexes on `merchant_name` and `status`

### 12.2 Features
- Real-time progress updates (WebSocket)
- Background processing for large files
- Email notifications when processing complete
- Duplicate transaction detection

### 12.3 Admin Tools
- Bulk mapping import/export
- Mapping analytics and reports
- AI confidence threshold settings
- Automated mapping suggestions

---

## END OF DOCUMENT

