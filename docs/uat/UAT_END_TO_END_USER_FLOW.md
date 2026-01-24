# End-to-End User Flow UAT
## Complete Journey: Registration → Stock Purchase

**Date:** 2024  
**Status:** 🟡 Ready for Execution  
**Purpose:** Test the complete user journey from registration to stock purchase, ensuring all systems integrate correctly

---

## Flow Overview

```
Registration → Email Verification → Login → Bank Sync → 
Subscription Payment → Transaction Processing → LLM Processing → 
Admin Dashboard Updates → Charts/Graphs Update → Stock Purchase
```

---

## Pre-Test Setup

### Environment Requirements
- [ ] Backend server running on port 5111
- [ ] Frontend server running on port 4000
- [ ] Database configured and accessible
- [ ] MX Connect sandbox configured
- [ ] Stripe test mode configured
- [ ] LLM service running and accessible
- [ ] Admin dashboard accessible

### Test Data Requirements
- [ ] Test email account (for email verification)
- [ ] Test bank account credentials (MX Connect sandbox)
- [ ] Test credit card (Stripe test card: 4242 4242 4242 4242)
- [ ] Admin account credentials
- [ ] Test merchant/transaction data

---

## Phase 1: User Registration Flow

### 1.1 Individual User Registration
**Test ID:** FLOW-001  
**Objective:** Register a new individual user account

**Steps:**
1. Navigate to `http://localhost:4000/login`
2. Click "Sign Up" or "Create Account"
3. Select "Individual" account type
4. **Step 1 - Personal Information:**
   - Enter first name: `Test`
   - Enter last name: `User`
   - Enter email: `testuser-flow@example.com`
   - Enter phone: `555-123-4567`
   - Enter date of birth: `01/01/1990`
   - Click "Next"
5. **Step 2 - Address:**
   - Enter street: `123 Test St`
   - Enter city: `Test City`
   - Enter state: `CA`
   - Enter ZIP: `12345`
   - Enter country: `United States`
   - Click "Next"
6. **Step 3 - Financial Information:**
   - Enter annual income: `75000`
   - Select employment status: `Employed`
   - Enter employer: `Test Company`
   - Enter occupation: `Software Engineer`
   - Click "Next"
7. **Step 4 - Investment Preferences:**
   - Select risk tolerance: `Moderate`
   - Select investment goal: `Long-term Growth`
   - Enter investment amount: `1000`
   - Click "Next"
8. **Step 5 - Account Setup:**
   - Enter password: `TestPassword123!`
   - Confirm password: `TestPassword123!`
   - Verify password strength indicator shows all requirements met
   - Click "Next"
9. **Step 6 - Terms & Privacy:**
   - Check "I agree to Terms of Service"
   - Check "I agree to Privacy Policy"
   - Click "Complete Registration"

**Expected Results:**
- ✅ Registration form validates all fields
- ✅ Password strength validation works
- ✅ Registration succeeds
- ✅ User redirected to email verification page or login
- ✅ Success message displayed
- ✅ User account created in database

**Verification:**
- [ ] Check database: User record exists with email `testuser-flow@example.com`
- [ ] Check backend logs: Registration API call successful
- [ ] Check email service: Verification email sent (if applicable)

---

### 1.2 Email Verification (if applicable)
**Test ID:** FLOW-002  
**Objective:** Verify user email address

**Steps:**
1. Check email inbox for verification email
2. Click verification link or enter verification code
3. Complete email verification

**Expected Results:**
- ✅ Email received
- ✅ Verification link works
- ✅ Account verified successfully
- ✅ User redirected to login or dashboard

**Verification:**
- [ ] Check database: `email_verified` field set to `true`
- [ ] Check backend logs: Verification API call successful

---

## Phase 2: User Login & Authentication

### 2.1 User Login
**Test ID:** FLOW-003  
**Objective:** Login with registered account

**Steps:**
1. Navigate to `http://localhost:4000/login`
2. Enter email: `testuser-flow@example.com`
3. Enter password: `TestPassword123!`
4. Click "Login"

**Expected Results:**
- ✅ Login succeeds
- ✅ User redirected to dashboard: `/dashboard/{userId}/`
- ✅ User data loads correctly
- ✅ Session token stored in localStorage
- ✅ User context populated

**Verification:**
- [ ] Check localStorage: `kamioi_user_token` exists
- [ ] Check localStorage: `kamioi_user` contains user data
- [ ] Check dashboard: User information displays correctly
- [ ] Check backend logs: Login API call successful

---

## Phase 3: Bank Account Connection (MX Connect)

### 3.1 Initiate Bank Connection
**Test ID:** FLOW-004  
**Objective:** Connect bank account via MX Connect

**Steps:**
1. From user dashboard, navigate to Settings
2. Click "Connect Bank Account" or "Link Bank"
3. MX Connect widget opens
4. Select bank: `Test Bank` (sandbox)
5. Enter credentials:
   - Username: `testuser`
   - Password: `testpass`
6. Complete MX Connect flow
7. Select accounts to connect (checking, savings)
8. Complete connection

**Expected Results:**
- ✅ MX Connect widget opens
- ✅ Bank selection works
- ✅ Credentials accepted
- ✅ Accounts listed for selection
- ✅ Connection succeeds
- ✅ Success toast notification appears
- ✅ Connected accounts display in settings
- ✅ Bank connection data stored

**Verification:**
- [ ] Check database: Bank connection record created
- [ ] Check database: Connected accounts stored
- [ ] Check backend logs: MX Connect API calls successful
- [ ] Check settings page: Bank accounts listed
- [ ] Check toast notification: Success message displayed

---

### 3.2 Verify Bank Data Sync
**Test ID:** FLOW-005  
**Objective:** Verify bank account data syncs correctly

**Steps:**
1. Wait 30-60 seconds for initial sync
2. Navigate to Transactions page
3. Check for transactions from connected bank
4. Navigate to Dashboard Overview
5. Check account balance displays

**Expected Results:**
- ✅ Transactions appear from connected bank
- ✅ Account balance displays correctly
- ✅ Transaction data accurate (amounts, dates, merchants)
- ✅ Loading states work during sync
- ✅ Error handling works if sync fails

**Verification:**
- [ ] Check database: Transactions imported from bank
- [ ] Check transactions page: Bank transactions display
- [ ] Check dashboard: Account balance correct
- [ ] Check backend logs: Bank sync API calls successful

---

## Phase 4: Subscription Payment Setup

### 4.1 Select Subscription Plan
**Test ID:** FLOW-006  
**Objective:** Select and set up subscription plan

**Steps:**
1. Navigate to Settings → Subscription
2. View available subscription plans
3. Select a plan (e.g., "Premium" - $9.99/month)
4. Click "Subscribe" or "Select Plan"
5. Stripe checkout opens

**Expected Results:**
- ✅ Subscription plans display correctly
- ✅ Plan details show (price, features)
- ✅ Stripe checkout modal opens
- ✅ Plan selection works

**Verification:**
- [ ] Check UI: Plans display correctly
- [ ] Check Stripe: Checkout modal opens

---

### 4.2 Complete Subscription Payment
**Test ID:** FLOW-007  
**Objective:** Complete subscription payment via Stripe

**Steps:**
1. In Stripe checkout modal:
   - Enter card number: `4242 4242 4242 4242`
   - Enter expiry: `12/25`
   - Enter CVC: `123`
   - Enter ZIP: `12345`
2. Click "Subscribe" or "Pay"
3. Wait for payment processing

**Expected Results:**
- ✅ Stripe checkout form accepts test card
- ✅ Payment processes successfully
- ✅ Success message displays
- ✅ Subscription activated
- ✅ Subscription status updates in settings
- ✅ Payment record created

**Verification:**
- [ ] Check database: Subscription record created
- [ ] Check database: Payment transaction recorded
- [ ] Check Stripe dashboard: Payment appears (test mode)
- [ ] Check settings: Subscription status shows "Active"
- [ ] Check backend logs: Stripe webhook received (if applicable)
- [ ] Check toast notification: Success message displayed

---

## Phase 5: Transaction Processing & Round-Up

### 5.1 View Transactions
**Test ID:** FLOW-008  
**Objective:** View transactions from connected bank

**Steps:**
1. Navigate to Transactions page
2. View transaction list
3. Verify transaction details:
   - Date
   - Merchant name
   - Amount
   - Category (if available)
   - Status

**Expected Results:**
- ✅ Transactions list loads
- ✅ All transactions from bank display
- ✅ Transaction details accurate
- ✅ Status badges display correctly
- ✅ Filters work (status, date range)
- ✅ Search works

**Verification:**
- [ ] Check transactions page: All transactions display
- [ ] Check database: Transaction records exist
- [ ] Check UI: Transaction details accurate

---

### 5.2 Round-Up Calculation
**Test ID:** FLOW-009  
**Objective:** Verify round-up amounts calculated correctly

**Steps:**
1. Navigate to Settings → Round-Up Settings
2. View current round-up amount (e.g., $0.50)
3. Navigate to Transactions page
4. Check round-up column for each transaction
5. Verify round-up calculations:
   - Transaction: $10.37 → Round-up: $0.63 (to $11.00)
   - Transaction: $25.12 → Round-up: $0.88 (to $26.00)
   - Transaction: $50.00 → Round-up: $0.00 (exact amount)

**Expected Results:**
- ✅ Round-up settings display correctly
- ✅ Round-up amounts calculated correctly
- ✅ Round-up column shows in transactions
- ✅ Total round-ups calculated correctly

**Verification:**
- [ ] Check transactions: Round-up amounts correct
- [ ] Check dashboard: Total round-ups accurate
- [ ] Check calculations: Math is correct

---

### 5.3 Round-Up Processing
**Test ID:** FLOW-010  
**Objective:** Verify round-ups are processed and accumulated

**Steps:**
1. Wait for round-up processing (may be automatic or manual)
2. Navigate to Dashboard Overview
3. Check "Total Round-Ups" or "Round-Up Balance"
4. Verify round-ups accumulate correctly
5. Check transaction status updates to "Round-up Processed"

**Expected Results:**
- ✅ Round-ups process automatically or on trigger
- ✅ Round-up balance increases correctly
- ✅ Transaction status updates
- ✅ Round-up transactions created

**Verification:**
- [ ] Check database: Round-up transactions created
- [ ] Check dashboard: Round-up balance accurate
- [ ] Check transactions: Status updated correctly
- [ ] Check backend logs: Round-up processing API calls successful

---

## Phase 6: LLM Processing & Merchant Mapping

### 6.1 Transaction Sent to LLM
**Test ID:** FLOW-011  
**Objective:** Verify transactions are sent to LLM for processing

**Steps:**
1. Navigate to Transactions page
2. Identify a transaction with unclear merchant name (e.g., "POS 123456")
3. Wait for LLM processing (may be automatic)
4. Check transaction details for merchant mapping

**Expected Results:**
- ✅ Transactions sent to LLM service
- ✅ LLM processes merchant names
- ✅ Merchant mappings created/updated
- ✅ Transaction merchant names improved

**Verification:**
- [ ] Check backend logs: LLM API calls made
- [ ] Check database: Merchant mappings created
- [ ] Check transactions: Merchant names improved
- [ ] Check LLM service: Processing successful

---

### 6.2 Merchant Mapping Display
**Test ID:** FLOW-012  
**Objective:** Verify merchant mappings display correctly

**Steps:**
1. Navigate to Transactions page
2. View transactions with mapped merchants
3. Check merchant names display correctly
4. Check merchant logos display (if applicable)
5. Check merchant categories display

**Expected Results:**
- ✅ Mapped merchant names display
- ✅ Merchant logos load (if available)
- ✅ Merchant categories show
- ✅ Original merchant name preserved (for reference)

**Verification:**
- [ ] Check transactions: Merchant names display
- [ ] Check UI: Logos load correctly
- [ ] Check database: Merchant mappings stored

---

### 6.3 LLM Training Data (Admin View)
**Test ID:** FLOW-013  
**Objective:** Verify LLM mappings appear in admin dashboard

**Steps:**
1. Logout from user account
2. Login as admin: `admin@example.com` / `AdminPassword123!`
3. Navigate to Admin Dashboard → LLM Center
4. View merchant mappings
5. Check for new mappings from user transactions
6. View mapping details:
   - Original merchant name
   - Mapped merchant name
   - Confidence score
   - Status (approved/pending)

**Expected Results:**
- ✅ Admin can access LLM Center
- ✅ Merchant mappings display
- ✅ New mappings from user transactions appear
- ✅ Mapping details show correctly
- ✅ Admin can approve/reject mappings

**Verification:**
- [ ] Check admin dashboard: LLM Center accessible
- [ ] Check LLM Center: Mappings display
- [ ] Check database: Mappings linked to transactions
- [ ] Check UI: Mapping details accurate

---

## Phase 7: Admin Dashboard Data Reception

### 7.1 User Data in Admin Dashboard
**Test ID:** FLOW-014  
**Objective:** Verify user data appears in admin dashboard

**Steps:**
1. In Admin Dashboard, navigate to User Management
2. Search for user: `testuser-flow@example.com`
3. View user details:
   - Registration date
   - Account status
   - Subscription status
   - Bank connections
   - Transaction count

**Expected Results:**
- ✅ User appears in user management
- ✅ User details accurate
- ✅ Registration date correct
- ✅ Subscription status shows "Active"
- ✅ Bank connections listed
- ✅ Transaction count accurate

**Verification:**
- [ ] Check admin dashboard: User listed
- [ ] Check user details: All data accurate
- [ ] Check database: Data matches

---

### 7.2 Transaction Data in Admin Dashboard
**Test ID:** FLOW-015  
**Objective:** Verify transactions appear in admin transaction management

**Steps:**
1. In Admin Dashboard, navigate to Transactions Management
2. Filter by user: `testuser-flow@example.com`
3. View transactions:
   - Transaction list
   - Transaction details
   - Round-up amounts
   - Status
   - Merchant mappings

**Expected Results:**
- ✅ User transactions appear in admin view
- ✅ Transaction details accurate
- ✅ Round-up amounts show
- ✅ Status correct
- ✅ Merchant mappings visible

**Verification:**
- [ ] Check admin transactions: User transactions display
- [ ] Check transaction details: Data accurate
- [ ] Check filters: Work correctly

---

### 7.3 Analytics Data Updates
**Test ID:** FLOW-016  
**Objective:** Verify analytics update with user data

**Steps:**
1. In Admin Dashboard, navigate to Financial Analytics
2. View analytics:
   - Total users
   - Total transactions
   - Total round-ups
   - Total investments
   - Revenue metrics
3. Verify new user data reflected in analytics

**Expected Results:**
- ✅ Analytics page loads
- ✅ User count includes new user
- ✅ Transaction count includes new transactions
- ✅ Round-up totals include new round-ups
- ✅ Charts/graphs update
- ✅ Metrics accurate

**Verification:**
- [ ] Check analytics: User count updated
- [ ] Check analytics: Transaction count updated
- [ ] Check analytics: Round-up totals updated
- [ ] Check charts: Display updated data
- [ ] Check database: Analytics data accurate

---

## Phase 8: Charts & Graphs Updates

### 8.1 User Dashboard Charts
**Test ID:** FLOW-017  
**Objective:** Verify charts update with transaction data

**Steps:**
1. Logout from admin
2. Login as user: `testuser-flow@example.com`
3. Navigate to Dashboard Overview
4. View charts:
   - Transaction history chart
   - Spending by category chart
   - Round-up accumulation chart
   - Portfolio value chart (if applicable)
5. Navigate to Analytics/Portfolio page
6. View detailed charts:
   - Time series charts
   - Category breakdowns
   - Investment performance

**Expected Results:**
- ✅ Charts load correctly
- ✅ Charts display transaction data
- ✅ Charts update with new transactions
- ✅ Chart data accurate
- ✅ Interactive features work (hover, zoom)
- ✅ Responsive design works

**Verification:**
- [ ] Check dashboard: Charts display
- [ ] Check charts: Data accurate
- [ ] Check charts: Update with new data
- [ ] Check UI: Interactive features work

---

### 8.2 Admin Dashboard Charts
**Test ID:** FLOW-018  
**Objective:** Verify admin charts update with platform data

**Steps:**
1. Login as admin
2. Navigate to Admin Dashboard Overview
3. View platform charts:
   - User growth chart
   - Transaction volume chart
   - Revenue chart
   - Round-up totals chart
4. Navigate to Financial Analytics
5. View detailed analytics charts

**Expected Results:**
- ✅ Admin charts load
- ✅ Charts include new user data
- ✅ Charts update in real-time or on refresh
- ✅ Chart data accurate
- ✅ Export functionality works

**Verification:**
- [ ] Check admin charts: Display correctly
- [ ] Check charts: Include new data
- [ ] Check charts: Data accurate
- [ ] Check export: Works correctly

---

## Phase 9: Investment & Stock Purchase Flow

### 9.1 Round-Up Investment Setup
**Test ID:** FLOW-019  
**Objective:** Set up automatic round-up investments

**Steps:**
1. Login as user
2. Navigate to Settings → Investment Settings
3. Enable "Automatic Round-Up Investments"
4. Set investment preferences:
   - Risk tolerance: `Moderate`
   - Investment strategy: `Diversified`
   - Minimum investment amount: `$10.00`
5. Save settings

**Expected Results:**
- ✅ Investment settings page loads
- ✅ Automatic investment toggle works
- ✅ Investment preferences save
- ✅ Settings persist after refresh

**Verification:**
- [ ] Check database: Investment settings saved
- [ ] Check settings: Persist after refresh
- [ ] Check backend logs: Settings API call successful

---

### 9.2 Accumulate Round-Ups for Investment
**Test ID:** FLOW-020  
**Objective:** Verify round-ups accumulate for investment

**Steps:**
1. Navigate to Dashboard Overview
2. Check "Round-Up Balance" or "Available to Invest"
3. Verify round-ups accumulate:
   - Multiple transactions processed
   - Round-ups add up correctly
   - Balance increases
4. Wait until round-up balance reaches minimum investment amount ($10.00)

**Expected Results:**
- ✅ Round-up balance displays
- ✅ Round-ups accumulate correctly
- ✅ Balance updates with new transactions
- ✅ Minimum investment threshold tracked

**Verification:**
- [ ] Check dashboard: Round-up balance accurate
- [ ] Check calculations: Math correct
- [ ] Check database: Round-up balance stored

---

### 9.3 Investment Processing Trigger
**Test ID:** FLOW-021  
**Objective:** Trigger investment processing when threshold reached

**Steps:**
1. Wait for round-up balance to reach $10.00 (or trigger manually)
2. Check for investment processing:
   - Automatic processing (if enabled)
   - Or manual "Invest Now" button
3. If manual, click "Invest Now" button
4. Confirm investment amount

**Expected Results:**
- ✅ Investment processing triggers at threshold
- ✅ Investment amount confirmed
- ✅ Processing starts
- ✅ Status updates to "Processing"

**Verification:**
- [ ] Check UI: Investment processing starts
- [ ] Check database: Investment record created
- [ ] Check backend logs: Investment API call made
- [ ] Check status: Updates correctly

---

### 9.4 Stock Selection & Purchase
**Test ID:** FLOW-022  
**Objective:** Complete stock purchase with round-up funds

**Steps:**
1. Investment processing page or modal opens
2. View investment options:
   - Recommended stocks (based on LLM analysis)
   - Popular stocks
   - Stock categories
3. Select a stock (e.g., "AAPL - Apple Inc.")
4. Review investment details:
   - Investment amount: $10.00
   - Number of shares: Calculated
   - Estimated fees: $0.00 (or minimal)
5. Confirm purchase
6. Complete investment

**Expected Results:**
- ✅ Investment options display
- ✅ Stock selection works
- ✅ Investment details accurate
- ✅ Share calculation correct
- ✅ Purchase confirmation works
- ✅ Investment completes successfully

**Verification:**
- [ ] Check UI: Stock selection works
- [ ] Check calculations: Share count accurate
- [ ] Check database: Investment record updated
- [ ] Check backend logs: Purchase API call successful

---

### 9.5 Investment Confirmation & Portfolio Update
**Test ID:** FLOW-023  
**Objective:** Verify investment completes and portfolio updates

**Steps:**
1. Wait for investment processing to complete
2. Check for success message/notification
3. Navigate to Portfolio page
4. Verify new investment appears:
   - Stock symbol: AAPL
   - Number of shares: Correct
   - Purchase price: Correct
   - Current value: Calculated
5. Navigate to Investment Summary
6. Verify investment listed:
   - Status: "Completed"
   - Purchase date: Today
   - Investment amount: $10.00
   - Stock details: Correct

**Expected Results:**
- ✅ Success notification appears
- ✅ Investment status: "Completed"
- ✅ Portfolio updates with new holding
- ✅ Investment summary shows new investment
- ✅ Portfolio value updates
- ✅ Charts update with new investment

**Verification:**
- [ ] Check database: Investment status = "Completed"
- [ ] Check portfolio: New holding appears
- [ ] Check portfolio: Values accurate
- [ ] Check charts: Update with new data
- [ ] Check notifications: Success message displayed

---

### 9.6 Admin Dashboard Investment View
**Test ID:** FLOW-024  
**Objective:** Verify investment appears in admin dashboard

**Steps:**
1. Logout from user account
2. Login as admin
3. Navigate to Admin Dashboard → Investment Summary
4. Filter by user: `testuser-flow@example.com`
5. View user investments:
   - Investment list
   - Investment details
   - Stock purchased
   - Purchase amount
   - Status
6. Navigate to Investment Processing Dashboard
7. Verify investment processed correctly

**Expected Results:**
- ✅ User investment appears in admin view
- ✅ Investment details accurate
- ✅ Stock purchase recorded
- ✅ Status correct
- ✅ Processing dashboard shows completed investment

**Verification:**
- [ ] Check admin dashboard: Investment listed
- [ ] Check investment details: Accurate
- [ ] Check processing dashboard: Investment processed
- [ ] Check database: All data correct

---

## Phase 10: End-to-End Data Flow Verification

### 10.1 Complete Data Flow Check
**Test ID:** FLOW-025  
**Objective:** Verify all data flows correctly through entire system

**Steps:**
1. **User Registration Data:**
   - Verify user record in database
   - Verify user appears in admin dashboard
   - Verify user count in analytics updated

2. **Bank Connection Data:**
   - Verify bank connection stored
   - Verify transactions imported
   - Verify transactions appear in user dashboard
   - Verify transactions appear in admin dashboard

3. **Subscription Data:**
   - Verify subscription active
   - Verify payment recorded
   - Verify subscription appears in admin dashboard
   - Verify revenue in analytics updated

4. **Transaction Data:**
   - Verify transactions in user dashboard
   - Verify transactions in admin dashboard
   - Verify round-ups calculated
   - Verify LLM processing occurred

5. **Investment Data:**
   - Verify investment in user portfolio
   - Verify investment in admin dashboard
   - Verify portfolio value updated
   - Verify charts updated

**Expected Results:**
- ✅ All data flows correctly
- ✅ Data consistent across dashboards
- ✅ Analytics updated
- ✅ Charts reflect all data
- ✅ No data loss or corruption

**Verification:**
- [ ] Check database: All records exist
- [ ] Check user dashboard: All data displays
- [ ] Check admin dashboard: All data displays
- [ ] Check analytics: All metrics updated
- [ ] Check charts: All data reflected

---

## Phase 11: Real-Time Updates & Synchronization

### 11.1 Real-Time Data Sync
**Test ID:** FLOW-026  
**Objective:** Verify real-time data synchronization

**Steps:**
1. Open user dashboard in one browser tab
2. Open admin dashboard in another browser tab
3. In user dashboard, make a change (e.g., update profile)
4. Check admin dashboard for update
5. In admin dashboard, update transaction status
6. Check user dashboard for status update

**Expected Results:**
- ✅ Changes sync across dashboards
- ✅ Real-time updates work (if WebSocket enabled)
- ✅ Or updates appear on refresh
- ✅ No data conflicts

**Verification:**
- [ ] Check sync: Changes appear in both dashboards
- [ ] Check timing: Updates timely
- [ ] Check conflicts: No data conflicts

---

## Test Execution Checklist

### Pre-Flow Checklist
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Database accessible
- [ ] MX Connect sandbox configured
- [ ] Stripe test mode configured
- [ ] LLM service running
- [ ] Test accounts created

### During Flow Checklist
- [ ] Each step executed
- [ ] Expected results verified
- [ ] Screenshots taken (for documentation)
- [ ] Bugs logged immediately
- [ ] Data verified at each step

### Post-Flow Checklist
- [ ] All steps completed
- [ ] All verifications passed
- [ ] Bugs documented
- [ ] Test results logged
- [ ] Data integrity verified

---

## Bug Reporting Template

```
Bug ID: FLOW-BUG-XXX
Flow Step: FLOW-XXX
Title: [Brief description]
Severity: Critical/High/Medium/Low
Status: Open/Fixed/Verified

Description:
[Detailed description of the issue]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
[What should happen]

Actual Result:
[What actually happens]

Data Affected:
- User: [User email]
- Transaction: [Transaction ID if applicable]
- Investment: [Investment ID if applicable]

Screenshots:
[Attach screenshots]

Environment:
- Browser: [Browser and version]
- OS: [Operating system]
- Backend: [Backend version]
- Frontend: [Frontend version]

Additional Notes:
[Any additional information]
```

---

## Success Criteria

### Must Pass:
- [ ] User can register successfully
- [ ] User can login successfully
- [ ] Bank connection works
- [ ] Transactions import correctly
- [ ] Subscription payment processes
- [ ] Round-ups calculate correctly
- [ ] LLM processes transactions
- [ ] Admin receives all data
- [ ] Charts update correctly
- [ ] Stock purchase completes
- [ ] Portfolio updates
- [ ] All data flows correctly

### Should Pass:
- [ ] Real-time updates work
- [ ] Performance acceptable (< 3s page loads)
- [ ] Error handling graceful
- [ ] User experience smooth

---

## Test Execution Log

| Test ID | Test Case | Status | Tester | Date | Notes | Bugs |
|---------|-----------|--------|--------|------|-------|------|
| FLOW-001 | Individual Registration | ⬜ | | | | |
| FLOW-002 | Email Verification | ⬜ | | | | |
| FLOW-003 | User Login | ⬜ | | | | |
| FLOW-004 | Bank Connection | ⬜ | | | | |
| FLOW-005 | Bank Data Sync | ⬜ | | | | |
| FLOW-006 | Subscription Selection | ⬜ | | | | |
| FLOW-007 | Subscription Payment | ⬜ | | | | |
| FLOW-008 | View Transactions | ⬜ | | | | |
| FLOW-009 | Round-Up Calculation | ⬜ | | | | |
| FLOW-010 | Round-Up Processing | ⬜ | | | | |
| FLOW-011 | LLM Processing | ⬜ | | | | |
| FLOW-012 | Merchant Mapping Display | ⬜ | | | | |
| FLOW-013 | LLM Training Data (Admin) | ⬜ | | | | |
| FLOW-014 | User Data in Admin | ⬜ | | | | |
| FLOW-015 | Transaction Data in Admin | ⬜ | | | | |
| FLOW-016 | Analytics Updates | ⬜ | | | | |
| FLOW-017 | User Dashboard Charts | ⬜ | | | | |
| FLOW-018 | Admin Dashboard Charts | ⬜ | | | | |
| FLOW-019 | Investment Setup | ⬜ | | | | |
| FLOW-020 | Round-Up Accumulation | ⬜ | | | | |
| FLOW-021 | Investment Processing | ⬜ | | | | |
| FLOW-022 | Stock Purchase | ⬜ | | | | |
| FLOW-023 | Investment Confirmation | ⬜ | | | | |
| FLOW-024 | Admin Investment View | ⬜ | | | | |
| FLOW-025 | Complete Data Flow | ⬜ | | | | |
| FLOW-026 | Real-Time Sync | ⬜ | | | | |

---

## Estimated Execution Time

- **Phase 1-2 (Registration & Login):** 15-20 minutes
- **Phase 3 (Bank Connection):** 10-15 minutes
- **Phase 4 (Subscription):** 10-15 minutes
- **Phase 5 (Transactions):** 15-20 minutes
- **Phase 6 (LLM Processing):** 10-15 minutes
- **Phase 7 (Admin Data):** 15-20 minutes
- **Phase 8 (Charts):** 10-15 minutes
- **Phase 9 (Investment):** 20-30 minutes
- **Phase 10-11 (Verification):** 15-20 minutes

**Total:** ~2-3 hours for complete flow

---

**Last Updated:** 2024  
**Status:** 🟡 Ready for Execution

