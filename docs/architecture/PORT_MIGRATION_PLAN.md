# Port Migration Plan - Environment Variables

## Why Hardcoded Ports Exist

**Answer: They're NOT for demo accounts - they're legacy code!**

The hardcoded ports (5111) are from when the backend ran on port 5111. Over time:
- Backend was moved to port 4000
- Main `apiService.js` was updated to use 4000
- But 98 components still have hardcoded `fetch()` calls bypassing the main service
- These are just **legacy code** that wasn't updated

## Solution: Environment Variables (Option B)

### Step 1: Create `.env` file ✅
- Created `frontend/.env` with `VITE_API_BASE_URL=http://localhost:4000`

### Step 2: Create API Config Utility ✅
- Created `frontend/src/utils/apiConfig.js` for centralized config

### Step 3: Update Components (In Progress)
- Replace all hardcoded `http://127.0.0.1:5111` with `import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'`
- Replace all hardcoded `http://localhost:5111` with environment variable

### Files to Update (98 files total)

**High Priority (Admin Components):**
- ✅ `AdminTransactions.jsx` - Updated
- ✅ `LLMCenter.jsx` - Updated  
- ⏳ `Subscriptions.jsx` - 8 references
- ⏳ `FinancialAnalytics.jsx` - 8 references
- ⏳ `LLMDataManagement.jsx` - 9 references
- ⏳ `SystemSettings.jsx` - 4 references
- ⏳ `GoogleAnalytics.jsx` - 1 reference
- ⏳ `BlogEditor.jsx` - 5 references
- ⏳ `ContentManagement.jsx` - 3 references
- ⏳ `EmployeeManagement.jsx` - 4 references
- ⏳ `BadgesGamification.jsx` - 5 references
- ⏳ `NotificationsCenter.jsx` - 3 references
- ⏳ `TransactionsReconciliation.jsx` - 2 references
- ⏳ `MLDashboard.jsx` - 6 references
- ⏳ `FamilyManagement.jsx` - 5 references

**Medium Priority (User/Business/Family Components):**
- ⏳ Various user, business, and family dashboard components

**Low Priority (Utility/Service Files):**
- ⏳ Service files and utilities

## Pattern to Replace

**Before:**
```javascript
fetch('http://127.0.0.1:5111/api/endpoint')
fetch('http://localhost:5111/api/endpoint')
```

**After:**
```javascript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
fetch(`${apiBaseUrl}/api/endpoint`)
```

**Or use the utility:**
```javascript
import { getApiUrl } from '../utils/apiConfig'
fetch(getApiUrl('/api/endpoint'))
```

## Benefits

1. **Single Source of Truth**: Change port in one place (`.env` file)
2. **Environment-Specific**: Different ports for dev/staging/prod
3. **No Code Changes**: Just update `.env` file
4. **Better Maintainability**: No more scattered hardcoded URLs

## Next Steps

1. Continue updating remaining 96 files
2. Test all API calls work correctly
3. Document the `.env` file in README
4. Add `.env.example` template file

