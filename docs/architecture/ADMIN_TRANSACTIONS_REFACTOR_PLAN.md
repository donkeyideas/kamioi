# AdminTransactions.jsx Refactoring Plan
## Critical Performance Issues to Fix

**Current Problems:**
1. Loading ALL transactions at once (could be 10,000+)
2. Frontend filtering: `allTransactions.filter(...)` (lines 883-971)
3. Frontend pagination: `filteredTransactions.slice(...)` (lines 973-977)
4. Frontend calculations: Stats calculated in frontend (lines 335-348)
5. Multiple API calls: Transactions + mappings

**Solution:**
1. Use React Query with backend pagination
2. Remove ALL frontend filtering - use query params
3. Remove ALL frontend sorting - use query params
4. Remove ALL frontend calculations - backend provides stats
5. Single API call with all filters in query params

**Backend Endpoint Required:**
```
GET /api/admin/transactions?page=1&limit=50&search=starbucks&status=completed&dashboard=all&dateFilter=month&sort=date&order=desc
```

**Response Format:**
```json
{
  "success": true,
  "data": [...], // Only 50 transactions
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  },
  "stats": {
    "totalTransactions": 1000,
    "totalRoundUps": 5000,
    "userTransactions": 300,
    "familyTransactions": 200,
    "businessTransactions": 500,
    "availableToInvest": 2000,
    "totalInvested": 3000
  }
}
```

**Implementation Steps:**
1. Replace `fetchAllTransactions` with React Query
2. Remove `allTransactions` state - use query data
3. Remove `filteredTransactions` - backend filters
4. Remove frontend pagination - use backend pagination
5. Remove frontend stats calculations - use backend stats
6. Update filter handlers to update query params

