# End-to-End User Flow - Quick Reference
## Quick Checklist for Testers

**Date:** 2024  
**Purpose:** Quick reference for executing the complete user flow

---

## Flow Summary

```
1. Register → 2. Login → 3. Connect Bank → 4. Subscribe → 
5. View Transactions → 6. LLM Processes → 7. Admin Sees Data → 
8. Charts Update → 9. Invest Round-Ups → 10. Stock Purchased
```

---

## Quick Test Steps

### 1. Registration (15 min)
- [ ] Navigate to `/login`
- [ ] Click "Sign Up" → Select "Individual"
- [ ] Complete 6-step registration form
- [ ] Verify: User created, email sent

### 2. Login (2 min)
- [ ] Login with new account
- [ ] Verify: Dashboard loads, user data shows

### 3. Bank Connection (10 min)
- [ ] Settings → Connect Bank
- [ ] Complete MX Connect flow
- [ ] Verify: Bank connected, transactions import

### 4. Subscription (10 min)
- [ ] Settings → Subscription
- [ ] Select plan → Stripe checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Verify: Subscription active, payment recorded

### 5. Transactions (10 min)
- [ ] View Transactions page
- [ ] Verify: Bank transactions display
- [ ] Check round-up calculations
- [ ] Verify: Round-ups accumulate

### 6. LLM Processing (10 min)
- [ ] Wait for LLM to process transactions
- [ ] Verify: Merchant names improved
- [ ] Admin → LLM Center: Verify mappings

### 7. Admin Dashboard (10 min)
- [ ] Login as admin
- [ ] User Management: Verify user appears
- [ ] Transactions: Verify transactions appear
- [ ] Analytics: Verify metrics updated

### 8. Charts (10 min)
- [ ] User Dashboard: Check charts update
- [ ] Admin Dashboard: Check charts update
- [ ] Verify: Data accurate, charts render

### 9. Investment (20 min)
- [ ] Settings → Investment: Enable auto-invest
- [ ] Wait for round-ups to reach $10
- [ ] Trigger investment
- [ ] Select stock (e.g., AAPL)
- [ ] Complete purchase

### 10. Verification (10 min)
- [ ] Portfolio: Verify stock appears
- [ ] Admin: Verify investment appears
- [ ] Charts: Verify updated
- [ ] Data flow: Verify all data consistent

---

## Test Accounts

### User Account
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

### MX Connect Test Bank
- **Bank:** Test Bank (sandbox)
- **Username:** `testuser`
- **Password:** `testpass`

---

## Critical Checkpoints

### After Registration
- [ ] User in database
- [ ] User in admin dashboard
- [ ] Email verification (if applicable)

### After Bank Connection
- [ ] Bank connection stored
- [ ] Transactions imported
- [ ] Transactions visible in both dashboards

### After Subscription
- [ ] Subscription active
- [ ] Payment recorded
- [ ] Revenue in admin analytics

### After LLM Processing
- [ ] Merchant mappings created
- [ ] Mappings visible in admin LLM Center
- [ ] Transaction merchant names improved

### After Investment
- [ ] Investment in portfolio
- [ ] Investment in admin dashboard
- [ ] Portfolio value updated
- [ ] Charts updated

---

## Data Verification Points

### User Dashboard
- [ ] User info correct
- [ ] Transactions display
- [ ] Round-ups calculate
- [ ] Portfolio shows investment
- [ ] Charts update

### Admin Dashboard
- [ ] User appears in management
- [ ] Transactions visible
- [ ] Subscription shows active
- [ ] Investment appears
- [ ] Analytics updated
- [ ] LLM mappings visible

### Database
- [ ] User record exists
- [ ] Bank connection stored
- [ ] Transactions imported
- [ ] Subscription active
- [ ] Investment recorded
- [ ] LLM mappings stored

---

## Common Issues & Solutions

### Bank Connection Fails
- **Check:** MX Connect sandbox configured
- **Check:** Backend API endpoint correct
- **Check:** Network connectivity

### Transactions Don't Import
- **Check:** Bank connection successful
- **Check:** Sync job running
- **Check:** Backend logs for errors

### LLM Not Processing
- **Check:** LLM service running
- **Check:** API endpoint correct
- **Check:** Backend logs for LLM calls

### Charts Not Updating
- **Check:** Data in database
- **Check:** API calls successful
- **Check:** Chart component rendering
- **Check:** Browser console for errors

### Investment Fails
- **Check:** Round-up balance sufficient
- **Check:** Investment API endpoint
- **Check:** Stock selection works
- **Check:** Payment processing

---

## Success Indicators

### ✅ Flow Complete When:
- [ ] User registered and logged in
- [ ] Bank connected and transactions imported
- [ ] Subscription active and paid
- [ ] Round-ups calculated and accumulated
- [ ] LLM processed transactions
- [ ] Admin sees all user data
- [ ] Charts display updated data
- [ ] Stock purchased successfully
- [ ] Portfolio updated with investment
- [ ] All data consistent across system

---

## Quick Commands

### Start Servers
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Test URLs
- Homepage: `http://localhost:4000/`
- Login: `http://localhost:4000/login`
- User Dashboard: `http://localhost:4000/dashboard/{userId}/`
- Admin Dashboard: `http://localhost:4000/admin/{adminId}/`

---

## Test Execution Time

**Total Time:** ~2-3 hours

**Breakdown:**
- Setup: 10 minutes
- Registration & Login: 20 minutes
- Bank & Subscription: 20 minutes
- Transactions & LLM: 20 minutes
- Admin Verification: 20 minutes
- Investment Flow: 30 minutes
- Final Verification: 20 minutes

---

**Last Updated:** 2024  
**Status:** 🟡 Ready for Execution

