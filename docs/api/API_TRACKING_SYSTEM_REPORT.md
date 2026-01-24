# API Tracking System - Architecture Report

## Executive Summary
This report documents the complete architecture and data flow of the API Usage & Cost Tracking system in the Kamioi platform. The system tracks all DeepSeek API calls, calculates costs, stores detailed request/response data, and displays metrics in an admin dashboard.

---

## System Architecture Overview

### Components
1. **Backend Service Layer**: `APIUsageTracker` (Python)
2. **Backend API Routes**: `api_usage.py` (Flask Blueprint)
3. **Frontend Dashboard**: `APITrackingDashboard.jsx` (React)
4. **Database**: SQLite (`kamioi.db`) with `api_usage` and `api_balance` tables
5. **Integration Points**: `AIRecommendationService` and `AIProcessor` services

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ACTION (Frontend)                        │
│  Business Dashboard → AI Insights → AI Recommendations Tab     │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Frontend: POST /api/ai/recommendations              │
│  Request Body: { dashboard_type, user_id, user_data }            │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         Backend Route: routes/ai_recommendations.py              │
│  - Fetches user settings (round_up_amount, location, etc.)       │
│  - Calls AIRecommendationService.get_investment_recommendations │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│      Service: services/ai_recommendation_service.py             │
│  1. Builds user context from transactions, portfolio, goals      │
│  2. Builds AI prompt                                            │
│  3. Calls DeepSeek API via _call_deepseek_api()                 │
│  4. Parses response                                             │
│  5. ⭐ Records API call via APIUsageTracker.record_api_call()   │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         Service: services/api_usage_tracker.py                   │
│  record_api_call() method:                                       │
│  - Calculates cost (input + output tokens × pricing)            │
│  - Inserts record into api_usage table                          │
│  - Stores: endpoint, model, tokens, cost, success,              │
│    request_data (JSON), response_data (JSON),                   │
│    user_id, page_tab, created_at                                │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database: kamioi.db                          │
│  Table: api_usage                                               │
│  - id, endpoint, model, prompt_tokens, completion_tokens         │
│  - total_tokens, processing_time_ms, cost, success               │
│  - error_message, request_data (TEXT), response_data (TEXT)     │
│  - user_id, page_tab, created_at                                │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         Admin Dashboard: APITrackingDashboard.jsx                │
│  React Query fetches data from:                                 │
│  - GET /api/admin/api-usage/stats (aggregate statistics)        │
│  - GET /api/admin/api-usage/balance (balance info)               │
│  - GET /api/admin/api-usage/records (detailed history)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Backend Service: `APIUsageTracker`

**File**: `backend/services/api_usage_tracker.py`

**Key Methods**:
- `record_api_call()` - Records each API call with full details
- `get_usage_stats()` - Aggregates statistics (total calls, success rate, costs)
- `get_detailed_records()` - Retrieves paginated history with message extraction
- `get_balance_info()` - Returns current balance and spending
- `update_balance()` - Updates API balance
- `get_current_month_cost()` - Calculates monthly spending
- `get_daily_cost_limit_status()` - Monitors daily spending limits

**Database Tables Created**:
```sql
-- api_usage table
CREATE TABLE IF NOT EXISTS api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    processing_time_ms INTEGER NOT NULL,
    cost REAL NOT NULL DEFAULT 0.0000,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    request_data TEXT,        -- Full JSON request payload
    response_data TEXT,        -- Full JSON response payload
    user_id INTEGER,
    page_tab TEXT,            -- e.g., "Business Dashboard - AI Recommendations"
    created_at TEXT NOT NULL
)

-- api_balance table
CREATE TABLE IF NOT EXISTS api_balance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    balance REAL NOT NULL DEFAULT 20.00,
    updated_at TEXT NOT NULL
)
```

**Pricing Calculation**:
- Input tokens (cache miss): $0.28 per 1M tokens
- Input tokens (cache hit): $0.028 per 1M tokens
- Output tokens: $0.42 per 1M tokens
- Failed calls: $0.00 (no charge)

**Data Storage**:
- `request_data`: Full JSON payload sent to DeepSeek API (stored as TEXT)
- `response_data`: Full JSON response from DeepSeek API (stored as TEXT)
- Message extraction: Parses `request_data` JSON to extract user message/prompt for display

---

### 2. Backend API Routes: `api_usage.py`

**File**: `backend/routes/api_usage.py`

**Endpoints**:

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/api/admin/api-usage/stats` | GET | Aggregate statistics | Total calls, success rate, costs, avg time |
| `/api/admin/api-usage/daily-limit` | GET | Daily spending status | Today's cost, limit status, percentage used |
| `/api/admin/api-usage/current-month` | GET | Monthly cost | Current month total spending |
| `/api/admin/api-usage/balance` | GET | Balance information | Current balance, total spent, remaining |
| `/api/admin/api-usage/balance` | POST | Update balance | Updated balance info |
| `/api/admin/api-usage/records` | GET | Detailed history | Paginated records with message extraction |

**Query Parameters**:
- `days` (default: 30) - Time period for filtering
- `page` (default: 1) - Page number for pagination
- `limit` (default: 50) - Records per page

**Response Format**:
```json
{
  "success": true,
  "data": {
    "records": [...],
    "total": 36,
    "page": 1,
    "limit": 50,
    "total_pages": 1
  }
}
```

---

### 3. Frontend Dashboard: `APITrackingDashboard.jsx`

**File**: `frontend/src/components/admin/APITrackingDashboard.jsx`

**Features**:
1. **Balance Section**: Shows current balance, monthly spending, remaining balance
2. **Key Metrics Cards**: Total calls, total cost, success rate, avg response time
3. **API Call History Table**: Detailed records with pagination
4. **Real-time Updates**: React Query with auto-refresh intervals

**React Query Hooks**:
- `useQuery(['api-usage', selectedPeriod])` - Stats (1 min stale time)
- `useQuery(['api-usage-limit'])` - Daily limit (30s stale, 60s refresh)
- `useQuery(['api-balance'])` - Balance (30s stale, 60s refresh)
- `useQuery(['api-usage-records', page, period])` - Records (30s stale)

**Table Columns**:
- Date, Endpoint, Message, Tokens, Time, Cost, Stored, Tab, User ID, Status

**Message Extraction**:
- Frontend displays truncated message (100 chars) from `request_data`
- Backend extracts message from JSON: `request_data.messages[-1].content`

---

### 4. Integration Points

#### A. AI Recommendation Service Integration

**File**: `backend/services/ai_recommendation_service.py`

**Integration Flow**:
1. `get_investment_recommendations()` method called
2. After API call completes (success or failure):
   ```python
   self.usage_tracker.record_api_call(
       endpoint='/api/ai/recommendations',
       model=self.model,
       prompt_tokens=prompt_tokens,
       completion_tokens=completion_tokens,
       total_tokens=total_tokens,
       processing_time_ms=processing_time,
       success=True/False,
       user_id=user_id,
       page_tab='Business Dashboard - AI Recommendations',
       request_data=request_data_str,  # Full JSON payload
       response_data=response_data_str  # Full JSON response
   )
   ```

**Page Tab Mapping**:
- `dashboard_type='user'` → `'User Dashboard - AI Recommendations'`
- `dashboard_type='family'` → `'Family Dashboard - AI Recommendations'`
- `dashboard_type='business'` → `'Business Dashboard - AI Recommendations'`

#### B. AI Processor Integration

**File**: `backend/services/ai_processor.py`

**Similar Integration**: Also calls `APIUsageTracker.record_api_call()` for LLM processing operations.

---

## Database Schema Details

### `api_usage` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key, auto-increment |
| `endpoint` | TEXT | API endpoint path (e.g., '/api/ai/recommendations') |
| `model` | TEXT | Model name (e.g., 'deepseek-chat') |
| `prompt_tokens` | INTEGER | Input tokens used |
| `completion_tokens` | INTEGER | Output tokens used |
| `total_tokens` | INTEGER | Total tokens (prompt + completion) |
| `processing_time_ms` | INTEGER | API call duration in milliseconds |
| `cost` | REAL | Calculated cost in USD |
| `success` | INTEGER | 1 = success, 0 = failed |
| `error_message` | TEXT | Error message if failed (truncated to 500 chars) |
| `request_data` | TEXT | Full JSON request payload (can be large) |
| `response_data` | TEXT | Full JSON response payload (can be large) |
| `user_id` | INTEGER | User ID who triggered the call (nullable) |
| `page_tab` | TEXT | UI location (e.g., 'Business Dashboard - AI Recommendations') |
| `created_at` | TEXT | ISO format timestamp |

### `api_balance` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key, auto-increment |
| `balance` | REAL | Current API balance in USD |
| `updated_at` | TEXT | ISO format timestamp of last update |

---

## Data Flow Examples

### Example 1: Successful API Call

1. **User Action**: Opens Business Dashboard → AI Insights → AI Recommendations
2. **Frontend**: POST to `/api/ai/recommendations` with user data
3. **Backend Route**: Fetches user settings, calls `AIRecommendationService`
4. **Service**: 
   - Builds context (transactions, portfolio, goals)
   - Builds prompt
   - Calls DeepSeek API
   - Receives response with tokens: `{prompt_tokens: 1500, completion_tokens: 800}`
5. **Tracking**: 
   ```python
   record_api_call(
       endpoint='/api/ai/recommendations',
       model='deepseek-chat',
       prompt_tokens=1500,
       completion_tokens=800,
       total_tokens=2300,
       processing_time_ms=15234,
       cost=0.000714,  # (1500 * 0.28/1M) + (800 * 0.42/1M)
       success=True,
       user_id=108,
       page_tab='Business Dashboard - AI Recommendations',
       request_data='{"model":"deepseek-chat","messages":[...]}',
       response_data='{"choices":[{"message":{"content":"..."}}]}'
   )
   ```
6. **Database**: Record inserted into `api_usage` table
7. **Admin Dashboard**: Displays in table with extracted message

### Example 2: Failed API Call

1. **Same flow until API call**
2. **API Call Fails**: Timeout or HTTP error
3. **Tracking**:
   ```python
   record_api_call(
       endpoint='/api/ai/recommendations',
       model='deepseek-chat',
       prompt_tokens=0,
       completion_tokens=0,
       total_tokens=0,
       processing_time_ms=60000,
       cost=0.0,  # No charge for failed calls
       success=False,
       error_message='API call timed out after 60 seconds',
       user_id=108,
       page_tab='Business Dashboard - AI Recommendations',
       request_data='{"model":"deepseek-chat","messages":[...]}',
       response_data='{"error":"timeout"}'
   )
   ```
4. **Database**: Record inserted with `success=0`
5. **Admin Dashboard**: Shows "Failed" status with red badge

---

## Current Issues Identified

### From Admin Dashboard Image Analysis:

1. **High Failure Rate**: 11 failed calls out of 36 total (69.4% success rate)
   - All recent entries show "Failed" status
   - Tokens: 0 (0+0) - indicating API calls are failing before completion
   - Processing time: 0ms or very low - suggests early failure

2. **Zero Costs**: All failed calls show $0.0000 cost (expected for failures)

3. **Message Extraction**: Some entries show "Generate recommendations" (generic), others show "N/A"
   - Suggests `request_data` may be empty or malformed for failed calls

4. **User ID**: All entries show user_id=108 (consistent)

5. **Page Tab**: All entries show "Business Dashboard - AI Recommendations" (correct)

---

## Data Extraction Logic

### Message Extraction in `get_detailed_records()`

**Location**: `backend/services/api_usage_tracker.py` (lines 352-385)

**Process**:
1. Reads `request_data` from database (TEXT field)
2. Attempts JSON parse: `json.loads(request_data_raw)`
3. Extracts message from common structures:
   - `request_json['messages'][-1]['content']` (most common)
   - `request_json['prompt']` (fallback)
   - `request_json['content']` (fallback)
4. Truncates to 100 characters for display
5. Falls back to "N/A" if extraction fails

**Why Some Show "N/A"**:
- `request_data` is None or empty
- JSON parsing fails
- Structure doesn't match expected format
- For failed calls, `request_data` may not be populated correctly

---

## Cost Calculation Logic

**Location**: `backend/services/api_usage_tracker.py` (lines 96-103)

```python
if not success:
    cost = 0.0  # No charge for failed calls
else:
    input_cost_per_token = INPUT_COST_CACHE_HIT if cache_hit else INPUT_COST_CACHE_MISS
    input_cost = prompt_tokens * input_cost_per_token
    output_cost = completion_tokens * OUTPUT_COST
    cost = input_cost + output_cost
```

**Pricing Constants**:
- `INPUT_COST_CACHE_MISS = 0.28 / 1_000_000` ($0.28 per 1M tokens)
- `INPUT_COST_CACHE_HIT = 0.028 / 1_000_000` ($0.028 per 1M tokens)
- `OUTPUT_COST = 0.42 / 1_000_000` ($0.42 per 1M tokens)

**Example Calculation**:
- 1500 prompt tokens (cache miss) + 800 completion tokens
- Cost = (1500 × 0.28/1M) + (800 × 0.42/1M)
- Cost = 0.00042 + 0.000336 = $0.000756

---

## Statistics Aggregation

**Location**: `backend/services/api_usage_tracker.py` (lines 156-243)

**Aggregations**:
1. **Total Calls**: Count of all records in period
2. **Successful Calls**: Count where `success = 1`
3. **Failed Calls**: Total - Successful
4. **Success Rate**: (Successful / Total) × 100
5. **Total Cost**: Sum of all `cost` values
6. **Average Processing Time**: Mean of `processing_time_ms`
7. **Calls by Day**: Grouped by date
8. **Cost by Day**: Grouped by date
9. **Calls by Model**: Grouped by model name

**Time Filtering**:
- Uses `created_at >= cutoff_date` where `cutoff_date = now - timedelta(days=days)`
- Default period: 30 days

---

## Frontend-Backend Communication

### API Base URL
- Environment variable: `VITE_API_BASE_URL`
- Default: `http://localhost:5111`

### Authentication
- Token stored in: `localStorage.getItem('kamioi_admin_token')` or `localStorage.getItem('authToken')`
- Fallback: `'admin_token_3'`
- Header: `Authorization: Bearer ${token}`

### Error Handling
- React Query handles errors automatically
- Displays error message with retry button
- Failed API calls show in table with red "Failed" badge

---

## Debug Logging

### Backend Logs

**In `ai_recommendation_service.py`**:
- `🔧 [AI Recommendations] Building context...`
- `🔧 [AI Recommendations] Context built successfully...`
- `🔧 [AI Recommendations] Prompt built successfully...`
- `📡 [AI Recommendations] Calling DeepSeek API...`
- `❌ [AI Recommendations] API call failed: ...`

**In `api_usage_tracker.py`**:
- `📊 record_api_call - user_id: X, page_tab: Y`
- `📊 record_api_call - request_data type: ..., length: ...`
- `📊 Verified record X: user_id=..., page_tab=..., has_request=..., has_response=...`
- `📊 get_detailed_records: Retrieved X rows from database`

**In `api_usage.py` routes**:
- `📊 API Usage Records endpoint called`
- `📊 Fetching records: page=X, limit=Y, days=Z`
- `📊 Found X total records, returning Y records`

---

## Potential Issues & Recommendations

### Issue 1: Failed API Calls
**Symptom**: All recent entries show "Failed" status with 0 tokens
**Possible Causes**:
- API key invalid/expired
- Network timeout (60s limit)
- API rate limiting
- Request payload too large
- DeepSeek API service issues

**Recommendation**: Check Flask console logs for specific error messages

### Issue 2: Message Extraction
**Symptom**: Some entries show "N/A" for message
**Possible Causes**:
- `request_data` not populated for failed calls
- JSON structure doesn't match expected format
- `request_data` is None or empty string

**Recommendation**: Ensure `request_data` is always populated, even for failed calls

### Issue 3: High Average Response Time
**Symptom**: 16926ms average (16.9 seconds)
**Possible Causes**:
- Large prompts (many transactions/context)
- Network latency
- DeepSeek API processing time
- Timeout failures inflating average

**Recommendation**: Monitor individual call times, consider prompt optimization

### Issue 4: Data Storage Size
**Symptom**: `request_data` and `response_data` stored as TEXT (unlimited size)
**Possible Causes**:
- Large JSON payloads can bloat database
- No size limits on stored data

**Recommendation**: Consider truncating very large payloads or archiving old data

---

## System Dependencies

### Backend Dependencies
- `flask` - Web framework
- `sqlite3` - Database (or PostgreSQL via SQLAlchemy)
- `database_manager` - Database connection pooling
- `json` - JSON parsing
- `datetime` - Timestamp handling

### Frontend Dependencies
- `react` - UI framework
- `@tanstack/react-query` - Data fetching/caching
- `lucide-react` - Icons

### Database
- SQLite: `kamioi.db` (default)
- PostgreSQL: Optional (via `config.py`)

---

## Summary

The API Tracking System is a comprehensive monitoring solution that:
1. ✅ Tracks all DeepSeek API calls automatically
2. ✅ Calculates costs based on token usage
3. ✅ Stores full request/response payloads for debugging
4. ✅ Associates calls with users and UI locations
5. ✅ Provides real-time dashboard with statistics
6. ✅ Supports balance management and spending limits
7. ✅ Handles both successful and failed calls

**Current Status**: System is fully wired and functional. Recent failures suggest an issue with the DeepSeek API calls themselves (timeout, authentication, or service issues), not with the tracking system.

**Next Steps**: Investigate why API calls are failing by checking Flask console logs and DeepSeek API status.

