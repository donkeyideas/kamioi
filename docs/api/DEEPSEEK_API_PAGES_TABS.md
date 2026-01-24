# DeepSeek API - Connected Pages & Tabs

## Summary
This document lists all pages, tabs, and locations in the Kamioi platform where the DeepSeek API is called and tracked.

---

## 🎯 API Connection Points

### 1. **User Dashboard - AI Recommendations Tab**

**Frontend Component**: `frontend/src/components/user/AIInsights.jsx`
- **Page**: User Dashboard
- **Tab**: "AI Recommendations" (tab ID: `ai-recommendations`)
- **Route**: `/api/ai/recommendations`
- **Dashboard Type**: `'user'`
- **Page Tab Label**: `"User Dashboard - AI Recommendations"`

**How to Access**:
1. Navigate to User Dashboard
2. Click on "AI Insights & Rewards" section
3. Select "AI Recommendations" tab

**API Call Trigger**:
- When user opens the AI Recommendations tab
- When user clicks "Refresh Recommendations" button
- When new transactions are detected (auto-refresh)

**Request Payload**:
```json
{
  "dashboard_type": "user",
  "user_id": <user_id>,
  "user_data": {
    "transactions": [...],
    "portfolio": {...},
    "goals": [...],
    "risk_tolerance": "moderate",
    "investment_history": [...]
  }
}
```

---

### 2. **Family Dashboard - AI Recommendations Tab**

**Frontend Component**: `frontend/src/components/family/FamilyAIInsights.jsx`
- **Page**: Family Dashboard
- **Tab**: "AI Recommendations" (tab ID: `ai-recommendations`)
- **Route**: `/api/ai/recommendations`
- **Dashboard Type**: `'family'`
- **Page Tab Label**: `"Family Dashboard - AI Recommendations"`

**How to Access**:
1. Navigate to Family Dashboard
2. Click on "Family AI Insights & Rewards" section
3. Select "AI Recommendations" tab

**API Call Trigger**:
- When user opens the AI Recommendations tab
- When user clicks "Refresh Recommendations" button
- When new transactions are detected (auto-refresh)

**Request Payload**:
```json
{
  "dashboard_type": "family",
  "user_id": <user_id>,
  "user_data": {
    "transactions": [...],
    "portfolio": {...},
    "goals": [...],
    "risk_tolerance": "moderate",
    "investment_history": [...]
  }
}
```

---

### 3. **Business Dashboard - AI Recommendations Tab**

**Frontend Component**: `frontend/src/components/business/BusinessAIInsights.jsx`
- **Page**: Business Dashboard
- **Tab**: "AI Recommendations" (tab ID: `ai-recommendations`)
- **Route**: `/api/ai/recommendations`
- **Dashboard Type**: `'business'`
- **Page Tab Label**: `"Business Dashboard - AI Recommendations"`

**How to Access**:
1. Navigate to Business Dashboard
2. Click on "AI Insights" section
3. Select "AI Recommendations" tab

**API Call Trigger**:
- When user opens the AI Recommendations tab
- When user clicks "Refresh Recommendations" button
- When new transactions are detected (auto-refresh)

**Request Payload**:
```json
{
  "dashboard_type": "business",
  "user_id": <user_id>,
  "user_data": {
    "transactions": [...],
    "portfolio": {...},
    "goals": [...],
    "risk_tolerance": "moderate",
    "investment_history": [...]
  }
}
```

---

### 4. **Admin Dashboard - LLM Center - Receipt Mappings**

**Frontend Component**: `frontend/src/components/admin/LLMCenter.jsx`
- **Page**: Admin Dashboard → LLM Center
- **Section**: Receipt Mappings (main table/list view)
- **Route**: `/api/admin/llm-center/process-mapping/<mapping_id>`
- **Page Tab Label**: `"LLM Center - Receipt Mappings"`

**How to Access**:
1. Navigate to Admin Dashboard
2. Click on "LLM Center" in sidebar
3. View receipt mappings table
4. Click "Process" button on any pending mapping

**API Call Trigger**:
- When admin clicks "Process" button on a receipt mapping
- When batch processing is triggered
- When automated processing runs

**Backend Service**: `backend/services/ai_processor.py`
- Method: `process_mapping_with_ai()`
- Purpose: Analyze receipt mappings to suggest ticker symbols

**Request Payload**:
```json
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "system",
      "content": "You are a financial analyst expert. Always respond in valid JSON format only."
    },
    {
      "role": "user",
      "content": "<merchant analysis prompt>"
    }
  ],
  "temperature": 0.3,
  "max_tokens": 500,
  "response_format": {"type": "json_object"}
}
```

---

## 📊 Page Tab Labels Reference

The following `page_tab` values are stored in the `api_usage` table:

| Page Tab Label | Dashboard Type | Component | Endpoint |
|----------------|----------------|-----------|----------|
| `"User Dashboard - AI Recommendations"` | `user` | `AIInsights.jsx` | `/api/ai/recommendations` |
| `"Family Dashboard - AI Recommendations"` | `family` | `FamilyAIInsights.jsx` | `/api/ai/recommendations` |
| `"Business Dashboard - AI Recommendations"` | `business` | `BusinessAIInsights.jsx` | `/api/ai/recommendations` |
| `"LLM Center - Receipt Mappings"` | `admin` | `LLMCenter.jsx` | `/api/admin/llm-center/process-mapping` |

---

## 🔍 How Page Tab Labels Are Set

### For AI Recommendations (User/Family/Business)

**Location**: `backend/services/ai_recommendation_service.py` (lines 51-57)

```python
# Determine page_tab based on dashboard_type
page_tab_map = {
    'user': 'User Dashboard - AI Recommendations',
    'family': 'Family Dashboard - AI Recommendations',
    'business': 'Business Dashboard - AI Recommendations'
}
page_tab = page_tab_map.get(dashboard_type, 'AI Recommendations')
```

**Flow**:
1. Frontend sends `dashboard_type` in request body
2. Backend route (`routes/ai_recommendations.py`) receives it
3. Service (`ai_recommendation_service.py`) maps it to `page_tab`
4. `page_tab` is passed to `APIUsageTracker.record_api_call()`

### For LLM Center (Admin)

**Location**: `backend/services/ai_processor.py` (lines 86-98)

```python
page_tab='LLM Center - Receipt Mappings'
```

**Flow**:
1. Admin clicks "Process" in LLM Center
2. Frontend calls `/api/admin/llm-center/process-mapping/<id>`
3. Backend route calls `AIProcessor.process_mapping_with_ai()`
4. Service hardcodes `page_tab='LLM Center - Receipt Mappings'`
5. `page_tab` is passed to `APIUsageTracker.record_api_call()`

---

## 📍 Frontend File Locations

### User Dashboard
- **File**: `frontend/src/components/user/AIInsights.jsx`
- **Line 284**: `dashboard_type: 'user'`
- **Tab ID**: `'ai-recommendations'`
- **Tab Label**: "AI Recommendations"

### Family Dashboard
- **File**: `frontend/src/components/family/FamilyAIInsights.jsx`
- **Line 277**: `dashboard_type: 'family'`
- **Tab ID**: `'ai-recommendations'`
- **Tab Label**: "AI Recommendations"

### Business Dashboard
- **File**: `frontend/src/components/business/BusinessAIInsights.jsx`
- **Line 598**: `dashboard_type: 'business'`
- **Tab ID**: `'ai-recommendations'`
- **Tab Label**: "AI Recommendations"

### Admin Dashboard - LLM Center
- **File**: `frontend/src/components/admin/LLMCenter.jsx`
- **Process Button**: Line ~4077 (in mapping detail modal)
- **Batch Process**: Line ~4301 (in batch processing)

---

## 🔗 Backend Service Connections

### AI Recommendation Service
- **File**: `backend/services/ai_recommendation_service.py`
- **Class**: `AIRecommendationService`
- **Method**: `get_investment_recommendations()`
- **Used By**: User, Family, Business dashboards
- **API Endpoint**: `/api/ai/recommendations`

### AI Processor Service
- **File**: `backend/services/ai_processor.py`
- **Class**: `AIProcessor`
- **Method**: `process_mapping_with_ai()`
- **Used By**: Admin LLM Center
- **API Endpoint**: `/api/admin/llm-center/process-mapping`

---

## 📈 API Tracking in Admin Dashboard

All DeepSeek API calls are tracked and displayed in:
- **Admin Dashboard** → **API Tracking** page
- **Component**: `frontend/src/components/admin/APITrackingDashboard.jsx`
- **Table Column**: "Tab" shows the `page_tab` value

**Example Records**:
- `"Business Dashboard - AI Recommendations"` (from Business Dashboard)
- `"User Dashboard - AI Recommendations"` (from User Dashboard)
- `"Family Dashboard - AI Recommendations"` (from Family Dashboard)
- `"LLM Center - Receipt Mappings"` (from Admin LLM Center)

---

## 🎨 UI Navigation Paths

### User Dashboard Path
```
User Dashboard
  └─ AI Insights & Rewards (section)
      └─ AI Recommendations (tab) ← DeepSeek API called here
```

### Family Dashboard Path
```
Family Dashboard
  └─ Family AI Insights & Rewards (section)
      └─ AI Recommendations (tab) ← DeepSeek API called here
```

### Business Dashboard Path
```
Business Dashboard
  └─ AI Insights (section)
      └─ AI Recommendations (tab) ← DeepSeek API called here
```

### Admin Dashboard Path
```
Admin Dashboard
  └─ LLM Center (sidebar menu)
      └─ Receipt Mappings (table)
          └─ Process Button (on mapping row) ← DeepSeek API called here
```

---

## 🔄 API Call Flow

### For AI Recommendations (User/Family/Business)

```
1. User opens "AI Recommendations" tab
   ↓
2. Frontend: AIInsights.jsx calls fetchAIRecommendations()
   ↓
3. Frontend: POST /api/ai/recommendations
   Body: { dashboard_type: 'user'|'family'|'business', user_id, user_data }
   ↓
4. Backend: routes/ai_recommendations.py → get_recommendations()
   ↓
5. Backend: services/ai_recommendation_service.py → get_investment_recommendations()
   ↓
6. Service: Maps dashboard_type to page_tab
   - 'user' → 'User Dashboard - AI Recommendations'
   - 'family' → 'Family Dashboard - AI Recommendations'
   - 'business' → 'Business Dashboard - AI Recommendations'
   ↓
7. Service: Calls DeepSeek API
   ↓
8. Service: Records API call with page_tab
   APIUsageTracker.record_api_call(..., page_tab=page_tab, ...)
   ↓
9. Database: Record stored in api_usage table
   ↓
10. Admin Dashboard: Shows in API Tracking table
```

### For LLM Center (Admin)

```
1. Admin clicks "Process" on receipt mapping
   ↓
2. Frontend: LLMCenter.jsx calls process mapping API
   ↓
3. Frontend: POST /api/admin/llm-center/process-mapping/<id>
   ↓
4. Backend: routes/llm_processing.py → process_mapping()
   ↓
5. Backend: services/ai_processor.py → process_mapping_with_ai()
   ↓
6. Service: Hardcodes page_tab = 'LLM Center - Receipt Mappings'
   ↓
7. Service: Calls DeepSeek API
   ↓
8. Service: Records API call with page_tab
   APIUsageTracker.record_api_call(..., page_tab='LLM Center - Receipt Mappings', ...)
   ↓
9. Database: Record stored in api_usage table
   ↓
10. Admin Dashboard: Shows in API Tracking table
```

---

## 📝 Summary Table

| # | Page | Tab/Section | Component | Dashboard Type | Page Tab Label | Endpoint |
|---|------|-------------|-----------|----------------|----------------|----------|
| 1 | User Dashboard | AI Recommendations | AIInsights.jsx | `user` | `User Dashboard - AI Recommendations` | `/api/ai/recommendations` |
| 2 | Family Dashboard | AI Recommendations | FamilyAIInsights.jsx | `family` | `Family Dashboard - AI Recommendations` | `/api/ai/recommendations` |
| 3 | Business Dashboard | AI Recommendations | BusinessAIInsights.jsx | `business` | `Business Dashboard - AI Recommendations` | `/api/ai/recommendations` |
| 4 | Admin Dashboard | LLM Center → Receipt Mappings | LLMCenter.jsx | `admin` | `LLM Center - Receipt Mappings` | `/api/admin/llm-center/process-mapping` |

---

## 🎯 Quick Reference

**Total DeepSeek API Connection Points**: **4**

1. ✅ User Dashboard → AI Insights → AI Recommendations tab
2. ✅ Family Dashboard → AI Insights → AI Recommendations tab
3. ✅ Business Dashboard → AI Insights → AI Recommendations tab
4. ✅ Admin Dashboard → LLM Center → Receipt Mappings (Process button)

All API calls are tracked with their respective `page_tab` labels in the `api_usage` table and displayed in the Admin Dashboard → API Tracking page.

