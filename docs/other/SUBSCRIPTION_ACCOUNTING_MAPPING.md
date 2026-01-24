# Subscription Accounting Journal Entry Mapping

## Account Structure

### Revenue Accounts (Existing)
- **40100**: Revenue – Individual Accounts
- **40200**: Revenue – Family Accounts  
- **40300**: Revenue – Business Accounts

### Deferred Revenue Accounts (New - Need to Create)
- **23010**: Deferred Revenue – Individual Accounts (Liability)
- **23020**: Deferred Revenue – Family Accounts (Liability)
- **23030**: Deferred Revenue – Business Accounts (Liability)

### Cash Accounts (Assumed Existing)
- **10100**: Cash – Bank of America (or appropriate cash account)

### Failed Payment Deferred Revenue (New - Optional)
- **23040**: Deferred Revenue – Failed Payments (Liability) - OR use reversal entries

---

## Journal Entry Scenarios

### 1. Initial Subscription Payment (Any Plan Length)

**When:** User pays for a new subscription (monthly, 12-month, etc.)

**Logic:**
- Apply any discounts/promos BEFORE recording
- Determine account_type (individual, family, business)
- Select appropriate deferred revenue account (23010, 23020, or 23030)

**Entry:**
```
DEBIT:  Cash Account (10100)                           $XX.XX
CREDIT: Deferred Revenue – [Account Type] (23010/23020/23030)   $XX.XX
```

**Example:** User pays $120 for 12-month Individual plan with $10 discount
```
DEBIT:  Cash (10100)                                   $110.00  (after discount)
CREDIT: Deferred Revenue – Individual (23010)          $110.00
```

**Reference Format:** `SUB-INIT-{subscription_id}-{date}`
**Description:** "Subscription payment - {plan_name} - {account_type}"

---

### 2. Daily Revenue Recognition

**When:** Daily (at end of day, or batch process)

**Logic:**
- For each active subscription, calculate daily recognition amount
- Recognition = (Total Deferred Amount / Total Days in Subscription Period)
- Track days remaining per subscription
- Prorate for partial days

**Entry (per subscription, daily):**
```
DEBIT:  Deferred Revenue – [Account Type] (23010/23020/23030)   $Daily_Amount
CREDIT: Revenue – [Account Type] (40100/40200/40300)            $Daily_Amount
```

**Example:** 12-month Individual plan, $120 total, starts mid-month
- Month 1: 15 days remaining = 15/365 * $120 = $4.93 (first partial period)
- Days 16-365: $120/365 = $0.329 per day (normal daily rate)
- Last period: Prorate remaining days

**Reference Format:** `SUB-REV-{subscription_id}-{YYYYMMDD}`
**Description:** "Daily revenue recognition - {plan_name} - Day {X} of {total_days}"

---

### 3. Auto-Renewal Payment

**When:** Subscription auto-renews at end of period

**Logic:**
- Same as initial payment
- Check if previous period had any failed payments (handle separately)
- Apply any renewal discounts/promos

**Entry:**
```
DEBIT:  Cash Account (10100)                           $XX.XX
CREDIT: Deferred Revenue – [Account Type] (23010/23020/23030)   $XX.XX
```

**Reference Format:** `SUB-RENEW-{subscription_id}-{date}`
**Description:** "Subscription renewal - {plan_name} - {account_type}"

---

### 4. Failed Payment / Past Due Handling

**Option A: Separate Account Method (Recommended)**
- Create entry to move amount from active deferred to failed deferred

**When payment fails:**
```
DEBIT:  Deferred Revenue – [Account Type] (23010/23020/23030)   $XX.XX
CREDIT: Deferred Revenue – Failed Payments (23040)              $XX.XX
```

**When payment later succeeds (retry):**
```
DEBIT:  Cash Account (10100)                           $XX.XX
CREDIT: Deferred Revenue – Failed Payments (23040)              $XX.XX
```
(Then continue recognition from Failed Payments account to Revenue)

**Option B: Reversal Method**
- Reverse original deferred revenue entry
- Create new entry in failed payments account

---

### 5. Proration Logic for Partial Periods

**Scenario:** Subscription starts mid-month or ends mid-month

**Calculation:**
```
Days in period = Days from start_date to end_of_subscription_period
Daily rate = Total subscription amount / Total subscription days
Prorated amount = Days in period * Daily rate
```

**Example:**
- 12-month plan starting Jan 15, 2025 → ends Jan 15, 2026
- Total days = 365
- Amount = $120
- Daily rate = $120 / 365 = $0.329

**First period (Jan 15-31):**
- Days = 17
- Recognition = 17 * $0.329 = $5.59

**Monthly recognition (Feb 1-28):**
- Days = 28
- Recognition = 28 * $0.329 = $9.21

**Last period (Jan 1-15, 2026):**
- Days = 15
- Recognition = 15 * $0.329 = $4.94

**Total:** $5.59 + ($9.21 × 11 months) + $4.94 = $120.00 ✓

---

### 6. Discount & Promo Code Handling

**When:** Apply BEFORE creating journal entry

**Logic:**
- Original price = Plan base amount
- Discount amount = Promo discount value
- Net amount = Original price - Discount amount
- **Record journal entry using NET amount only**

**Example:** $12/month plan with 20% promo code
- Original = $12.00
- Discount = $2.40 (20%)
- Net = $9.60

**Entry uses $9.60:**
```
DEBIT:  Cash (10100)                                   $9.60
CREDIT: Deferred Revenue – Individual (23010)          $9.60
```

**Note:** Discount is implicit in the net amount. If you need to track discount amounts separately for reporting, consider:
- Store discount in transaction metadata
- OR create separate discount expense account entries (optional)

---

## Daily Recognition Process Flow

### For Each Active Subscription:

1. **Calculate Daily Recognition Amount:**
   ```
   remaining_deferred = Get balance from Deferred Revenue account for this subscription
   days_remaining = Calculate days from today to subscription end date
   daily_amount = remaining_deferred / days_remaining
   ```

2. **Create Journal Entry:**
   ```
   DEBIT:  Deferred Revenue [Account Type] (23010/23020/23030)   $daily_amount
   CREDIT: Revenue [Account Type] (40100/40200/40300)            $daily_amount
   ```

3. **Update Subscription Tracking:**
   - Decrement remaining days
   - Update last recognition date
   - Track cumulative recognized amount

4. **Handle Edge Cases:**
   - **Last day:** Recognize remaining balance (not calculated amount)
   - **Suspended subscription:** Skip recognition for that day
   - **Cancelled subscription:** Recognize remaining deferred balance immediately

---

## Data Structure Requirements

### Subscription Record Fields Needed:
- `subscription_id`: Unique identifier
- `user_id`: User identifier
- `plan_id`: Plan identifier
- `account_type`: 'individual', 'family', 'business'
- `amount`: Total subscription amount (after discounts)
- `original_amount`: Amount before discounts
- `discount_amount`: Discount applied
- `start_date`: Subscription start date
- `end_date`: Subscription end date
- `renewal_date`: Next renewal date (if applicable)
- `total_days`: Total days in subscription period
- `days_recognized`: Days already recognized
- `deferred_balance`: Remaining deferred revenue balance
- `recognized_balance`: Total revenue recognized so far
- `last_recognition_date`: Last date revenue was recognized
- `status`: 'active', 'cancelled', 'past_due', 'suspended'
- `payment_status`: 'paid', 'failed', 'pending'

### Journal Entry Record Fields:
- `entry_id`: Unique identifier
- `transaction_date`: Date of transaction
- `reference`: Reference code (e.g., SUB-INIT-12345-20250115)
- `description`: Human-readable description
- `entry_type`: 'subscription_payment', 'daily_recognition', 'renewal', 'failed_payment', 'reversal'
- `subscription_id`: Link to subscription
- `debit_account`: Account number debited
- `credit_account`: Account number credited
- `amount`: Transaction amount
- `status`: 'posted', 'pending', 'reversed'

---

## Implementation Checklist

### Phase 1: Account Setup
- [ ] Create account 23010: Deferred Revenue – Individual Accounts
- [ ] Create account 23020: Deferred Revenue – Family Accounts
- [ ] Create account 23030: Deferred Revenue – Business Accounts
- [ ] Create account 23040: Deferred Revenue – Failed Payments (optional)
- [ ] Verify accounts 40100, 40200, 40300 exist
- [ ] Verify cash account exists (10100 or similar)

### Phase 2: Initial Payment Entry
- [ ] Create function to generate journal entry on subscription payment
- [ ] Apply discount logic before entry creation
- [ ] Select correct deferred revenue account based on account_type
- [ ] Link entry to subscription record
- [ ] Store original amount and discount amount in metadata

### Phase 3: Daily Recognition Process
- [ ] Create scheduled job/cron to run daily
- [ ] Query all active subscriptions
- [ ] Calculate daily recognition amount per subscription
- [ ] Create journal entries for each subscription
- [ ] Update subscription tracking fields
- [ ] Handle edge cases (last day, cancelled, suspended)

### Phase 4: Auto-Renewal Entry
- [ ] Detect subscription renewal events
- [ ] Create payment journal entry
- [ ] Update subscription record with new period
- [ ] Reset deferred balance tracking

### Phase 5: Failed Payment Handling
- [ ] Detect payment failures
- [ ] Move deferred revenue to failed payments account (or reverse)
- [ ] Create retry payment entry when successful
- [ ] Handle past due subscriptions

### Phase 6: Testing & Validation
- [ ] Test monthly plan (1 month)
- [ ] Test 12-month plan with full period
- [ ] Test 12-month plan starting mid-month
- [ ] Test discount application
- [ ] Test failed payment recovery
- [ ] Test cancellation mid-period
- [ ] Verify total deferred = total recognized at end of period
- [ ] Verify daily recognition totals match subscription amounts

---

## Example: Complete 12-Month Subscription Journey

### Day 1 (Jan 15, 2025): User subscribes to 12-month Individual plan
**Payment Entry:**
```
DEBIT:  Cash (10100)                                   $120.00
CREDIT: Deferred Revenue – Individual (23010)          $120.00
Reference: SUB-INIT-12345-20250115
```

### Day 2-31 (Daily Recognition - Jan 16-31, 2025)
**15 entries (17 days remaining in January):**
```
DEBIT:  Deferred Revenue – Individual (23010)         $0.329
CREDIT: Revenue – Individual Accounts (40100)         $0.329
Reference: SUB-REV-12345-20250116
...
Reference: SUB-REV-12345-20250131
```
**Total recognized Jan 16-31:** 17 × $0.329 = $5.59

### Days 32-396 (Daily Recognition - Feb 1, 2025 - Jan 14, 2026)
**348 daily entries:**
```
DEBIT:  Deferred Revenue – Individual (23010)         $0.329
CREDIT: Revenue – Individual Accounts (40100)         $0.329
```
**Total recognized:** 348 × $0.329 = $114.41

### Day 397 (Jan 15, 2026): Last day
**Final Recognition:**
```
DEBIT:  Deferred Revenue – Individual (23010)         $0.00 (balance check: $120 - $5.59 - $114.41)
CREDIT: Revenue – Individual Accounts (40100)         $0.00
```
**Note:** Actual last entry uses remaining balance (may be slightly different due to rounding)

**Verification:**
- Total Deferred: $120.00
- Total Recognized: $120.00 ✓
- Balance Remaining: $0.00 ✓

---

## Important Notes

1. **Rounding:** Handle rounding errors - on last day, recognize remaining balance exactly
2. **Timezone:** All dates should use consistent timezone (e.g., UTC)
3. **Idempotency:** Daily recognition should be idempotent (re-running same day shouldn't double-count)
4. **Audit Trail:** Maintain complete audit trail of all entries
5. **Reconciliation:** Periodic reconciliation between subscription records and GL balances
6. **Performance:** For many subscriptions, batch processing may be needed
7. **Error Handling:** Failed journal entries should not block other subscriptions

---

## Questions to Resolve

1. **Cash Account:** Confirm the exact cash account number (10100? Or different?)
2. **Failed Payment Retry Logic:** How many retry attempts before moving to failed account?
3. **Cancellation Mid-Period:** Should remaining deferred revenue be recognized immediately or reversed?
4. **Subscription Upgrades/Downgrades:** How to handle mid-period plan changes?
5. **Refunds:** How to handle refund requests (reverse entries)?

---

## Next Steps

1. Review and approve this mapping
2. Confirm account numbers
3. Implement account creation if needed
4. Build journal entry creation functions
5. Implement daily recognition process
6. Add monitoring and validation
7. Test with real subscription data


