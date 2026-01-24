# Port Configuration Audit Report

## Summary
**CRITICAL INCONSISTENCY DETECTED**

## Current State

### Backend Configuration
- **Backend default port**: `4000` (configured in `app.py` line 14819)
- **Backend code**: `port = int(os.getenv('PORT', '4000'))`
- Can be overridden by `PORT` environment variable

### Frontend Configuration
- **Main API Service** (`apiService.js`): Defaults to `4000`
  - `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";`
- **Individual Components**: **334 hardcoded references to port 5111** across 98 files
- **Newer Components**: 18 references to port 4000 across 9 files

## Port Usage Statistics

| Port | Files | Matches | Status |
|------|-------|---------|--------|
| **5111** | **98 files** | **334 matches** | ⚠️ **MAJORITY** |
| **4000** | **9 files** | **18 matches** | ✅ **MINORITY** |

## Files Using Port 5111 (Sample)
- `AdminTransactions.jsx`
- `LLMCenter.jsx`
- `Subscriptions.jsx`
- `FinancialAnalytics.jsx`
- `LLMDataManagement.jsx`
- `SystemSettings.jsx`
- `GoogleAnalytics.jsx`
- `BlogEditor.jsx`
- `ContentManagement.jsx`
- `EmployeeManagement.jsx`
- `BadgesGamification.jsx`
- `NotificationsCenter.jsx`
- `TransactionsReconciliation.jsx`
- `MLDashboard.jsx`
- `FamilyManagement.jsx`
- And 83+ more files...

## Files Using Port 4000 (Recent Changes)
- `apiService.js` (main service)
- `AdminOverview.jsx` (recently changed)
- `ConsolidatedUserManagement.jsx` (recently changed)
- `DemoCodeManagement.jsx` (recently changed)
- `Login.jsx`
- `AdminLogin.jsx`
- `DemoUsers.jsx`
- `DemoEntry.jsx`
- `DemoDashboard.jsx`

## Recommendation

**The project has a MAJOR inconsistency:**

1. **Backend is configured for port 4000** (default)
2. **Main frontend service uses port 4000**
3. **But 98 files (334 references) are hardcoded to port 5111**

### Options:

**Option A: Standardize on Port 4000** (Recommended)
- Backend already defaults to 4000
- Main apiService uses 4000
- Need to update 98 files from 5111 → 4000
- OR use environment variable `VITE_API_BASE_URL` consistently

**Option B: Standardize on Port 5111**
- Update backend default to 5111
- Update apiService.js to use 5111
- Update 9 files from 4000 → 5111

**Option C: Use Environment Variables** (Best Practice)
- All components should use `import.meta.env.VITE_API_BASE_URL || "http://localhost:PORT"`
- Set `VITE_API_BASE_URL` in `.env` file
- Single source of truth

## Action Required

**DECISION NEEDED**: Which port should be the standard?
- Port 4000 (current backend default)
- Port 5111 (what majority of code expects)

Once decided, I will:
1. Update backend configuration if needed
2. Update all frontend files to use the chosen port
3. OR implement environment variable solution for better maintainability

