# Start End-to-End Flow Test
## Quick Start Guide

**Date:** 2024  
**Status:** 🟡 Ready to Execute

---

## Step 1: Start Servers

### Backend Server
```powershell
cd C:\Users\beltr\Kamioi\backend
npm run dev
```
**Expected:** Server running on port 5111

### Frontend Server
```powershell
cd C:\Users\beltr\Kamioi\frontend
npm run dev
```
**Expected:** Server running on port 4000

---

## Step 2: Open Browser

Navigate to: **http://localhost:4000**

---

## Step 3: Begin Testing

### Follow the Flow Document
Open: **`UAT_END_TO_END_USER_FLOW.md`**

### Log Results
Update: **`UAT_FLOW_TEST_EXECUTION.md`** as you test

### Quick Reference
Use: **`UAT_FLOW_QUICK_REFERENCE.md`** for quick checklist

---

## Step 4: Test Flow Order

1. **FLOW-001:** Registration (15 min)
2. **FLOW-002:** Email Verification (2 min)
3. **FLOW-003:** Login (2 min)
4. **FLOW-004:** Bank Connection (10 min)
5. **FLOW-005:** Bank Data Sync (5 min)
6. **FLOW-006:** Subscription Selection (5 min)
7. **FLOW-007:** Subscription Payment (5 min)
8. **FLOW-008:** View Transactions (5 min)
9. **FLOW-009:** Round-Up Calculation (5 min)
10. **FLOW-010:** Round-Up Processing (5 min)
11. **FLOW-011:** LLM Processing (10 min)
12. **FLOW-012:** Merchant Mapping (5 min)
13. **FLOW-013:** Admin LLM View (5 min)
14. **FLOW-014:** Admin User Data (5 min)
15. **FLOW-015:** Admin Transaction Data (5 min)
16. **FLOW-016:** Analytics Updates (5 min)
17. **FLOW-017:** User Charts (5 min)
18. **FLOW-018:** Admin Charts (5 min)
19. **FLOW-019:** Investment Setup (5 min)
20. **FLOW-020:** Round-Up Accumulation (10 min)
21. **FLOW-021:** Investment Trigger (5 min)
22. **FLOW-022:** Stock Purchase (10 min)
23. **FLOW-023:** Investment Confirmation (5 min)
24. **FLOW-024:** Admin Investment View (5 min)
25. **FLOW-025:** Data Flow Verification (10 min)
26. **FLOW-026:** Real-Time Sync (5 min)

**Total Time:** ~2-3 hours

---

## Test Accounts

### User Account (Create during test)
- **Email:** `testuser-flow@example.com`
- **Password:** `TestPassword123!`

### Admin Account
- **Email:** `admin@example.com`
- **Password:** `AdminPassword123!`

### Stripe Test Card
- **Number:** `4242 4242 4242 4242`
- **Expiry:** `12/25`
- **CVC:** `123`
- **ZIP:** `12345`

---

## Critical Checkpoints

After each phase, verify:
- [ ] Data saved to database
- [ ] API calls successful (check backend logs)
- [ ] UI updates correctly
- [ ] No errors in browser console
- [ ] No errors in backend logs

---

## Documentation Files

1. **`UAT_END_TO_END_USER_FLOW.md`** - Complete detailed test plan
2. **`UAT_FLOW_TEST_EXECUTION.md`** - Execution log (update as you test)
3. **`UAT_FLOW_QUICK_REFERENCE.md`** - Quick checklist
4. **`START_FLOW_TEST.md`** - This file

---

## Troubleshooting

### Backend Not Starting
- Check if port 5111 is available
- Check database connection
- Check environment variables

### Frontend Not Starting
- Check if port 4000 is available
- Check node_modules installed
- Check environment variables

### Bank Connection Fails
- Verify MX Connect sandbox configured
- Check backend API endpoint
- Check network connectivity

### LLM Not Processing
- Verify LLM service running
- Check backend logs for LLM calls
- Verify API endpoint correct

---

## Next Steps

1. ✅ Start backend server
2. ✅ Start frontend server
3. ✅ Open browser to http://localhost:4000
4. ✅ Begin FLOW-001: Registration
5. ✅ Log results in `UAT_FLOW_TEST_EXECUTION.md`
6. ✅ Continue through all 26 test cases

---

**Ready to Start!** 🚀

**Last Updated:** 2024

