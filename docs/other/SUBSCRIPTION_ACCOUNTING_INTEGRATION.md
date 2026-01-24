# Subscription Accounting Integration Guide

## Overview
This system automatically creates journal entries for subscription payments and daily revenue recognition. All entries appear in the Financial Analytics - Transaction Management tab.

## Files Created

1. **`backend/services/subscription_accounting_service.py`**
   - Core service for creating journal entries
   - Handles all subscription accounting logic

2. **`backend/api/subscription_accounting_endpoints.py`**
   - API endpoints for triggering journal entries
   - Endpoints for payment, renewal, failed payments, etc.

3. **`backend/scheduled_jobs/daily_revenue_recognition.py`**
   - Scheduled job for daily revenue recognition
   - Should run daily at 11:59 PM

## Integration Steps

### Step 1: Create Deferred Revenue Accounts

First, ensure the deferred revenue accounts exist in your chart of accounts:

- **23010**: Deferred Revenue – Individual Accounts (Liability)
- **23020**: Deferred Revenue – Family Accounts (Liability)
- **23030**: Deferred Revenue – Business Accounts (Liability)
- **23040**: Deferred Revenue – Failed Payments (Liability)

**Call this endpoint once:**
```bash
POST /api/admin/subscriptions/setup-accounts
```

Or manually create these accounts in your GL chart of accounts.

### Step 2: Integrate with Subscription Payment Flow

When a user pays for a subscription (new or renewal), call the payment entry endpoint:

**For Initial Payment:**
```javascript
// In your subscription payment handler
const response = await fetch('/api/admin/subscriptions/create-payment-entry', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subscription_id: subscription.id,
    user_id: subscription.user_id,
    user_name: subscription.user_name,
    plan_name: subscription.plan_name,
    account_type: subscription.account_type, // 'individual', 'family', 'business'
    amount: subscription.amount, // Net amount after discounts
    original_amount: subscription.original_amount, // Optional
    discount_amount: subscription.discount_amount, // Optional
    payment_date: subscription.payment_date // Optional, defaults to now
  })
})
```

**For Auto-Renewal:**
```javascript
// In your subscription renewal handler
const response = await fetch('/api/admin/subscriptions/create-renewal-entry', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subscription_id: subscription.id,
    user_id: subscription.user_id,
    user_name: subscription.user_name,
    plan_name: subscription.plan_name,
    account_type: subscription.account_type,
    amount: subscription.amount,
    renewal_date: new Date().toISOString()
  })
})
```

### Step 3: Set Up Daily Recognition Scheduler

**Option A: Using APScheduler (Recommended)**

```python
# In your main application file (e.g., app.py)
from scheduled_jobs.daily_revenue_recognition import setup_scheduler_with_apscheduler

# Start scheduler
scheduler = setup_scheduler_with_apscheduler()
```

**Option B: Using Cron Job**

```bash
# Add to crontab
59 23 * * * cd /path/to/app && python -m scheduled_jobs.daily_revenue_recognition
```

**Option C: Manual API Call (for testing)**

```bash
POST /api/admin/subscriptions/process-daily-recognition
Body: {
  "recognition_date": "2025-01-15"  // Optional, defaults to today
}
```

### Step 4: Handle Failed Payments

When a payment fails:

```javascript
const response = await fetch('/api/admin/subscriptions/handle-failed-payment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subscription_id: subscription.id,
    account_type: subscription.account_type,
    amount: subscription.amount
  })
})
```

### Step 5: Database Schema Requirements

Ensure your journal_entries table supports these fields:

```sql
CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  transaction_date TIMESTAMP NOT NULL,
  reference VARCHAR(100) UNIQUE,
  description TEXT,
  entry_type VARCHAR(50), -- 'subscription_payment', 'daily_recognition', 'subscription_renewal', etc.
  subscription_id INTEGER,
  user_id INTEGER,
  debit_account VARCHAR(20),
  credit_account VARCHAR(20),
  amount DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'posted',
  merchant VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_journal_entries_subscription ON journal_entries(subscription_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(transaction_date);
CREATE INDEX idx_journal_entries_type ON journal_entries(entry_type);
CREATE INDEX idx_journal_entries_reference ON journal_entries(reference);
```

### Step 6: Update Subscription Model

Add tracking fields to your subscriptions table:

```sql
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS total_days INTEGER;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS days_recognized INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS deferred_balance DECIMAL(10, 2);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS recognized_balance DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_recognition_date DATE;
```

## Journal Entry Reference Formats

- **Initial Payment**: `SUB-INIT-{subscription_id}-{YYYYMMDD}`
- **Renewal Payment**: `SUB-RENEW-{subscription_id}-{YYYYMMDD}`
- **Daily Recognition**: `SUB-REV-{subscription_id}-{YYYYMMDD}`
- **Failed Payment**: `SUB-FAIL-{subscription_id}-{YYYYMMDD}`
- **Payment Recovery**: `SUB-RECOV-{subscription_id}-{YYYYMMDD}`
- **Cancellation**: `SUB-CANCEL-{subscription_id}-{YYYYMMDD}`

## Testing

### Test Initial Payment Entry

```bash
curl -X POST http://localhost:5111/api/admin/subscriptions/create-payment-entry \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_id": 1,
    "user_id": 1,
    "user_name": "Test User",
    "plan_name": "Essentials",
    "account_type": "individual",
    "amount": 120.00,
    "original_amount": 120.00
  }'
```

### Test Daily Recognition

```bash
curl -X POST http://localhost:5111/api/admin/subscriptions/process-daily-recognition \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recognition_date": "2025-01-15"
  }'
```

## Viewing Entries in Transaction Management

All journal entries created by this system will automatically appear in:
**Financial Analytics → Transaction Management**

The entries will have:
- **Type**: Based on entry_type (revenue, payment, etc.)
- **Reference**: Unique reference code
- **Description**: Human-readable description
- **From/To Accounts**: Debit and credit accounts
- **Amount**: Transaction amount
- **Date**: Transaction date

You can filter/search by:
- Reference (e.g., "SUB-INIT" for initial payments)
- Description (e.g., "Subscription payment")
- Account numbers (e.g., "23010" for Individual deferred revenue)

## Account Numbers Summary

| Account | Number | Type |
|---------|--------|------|
| Cash | 10100 | Asset |
| Revenue – Individual | 40100 | Revenue |
| Revenue – Family | 40200 | Revenue |
| Revenue – Business | 40300 | Revenue |
| Deferred Revenue – Individual | 23010 | Liability |
| Deferred Revenue – Family | 23020 | Liability |
| Deferred Revenue – Business | 23030 | Liability |
| Deferred Revenue – Failed Payments | 23040 | Liability |

## Troubleshooting

### Entries Not Appearing
1. Check journal_entries table for new records
2. Verify API endpoints are registered
3. Check transaction_date is within your date range filter
4. Ensure status is 'posted'

### Daily Recognition Not Running
1. Check scheduler is running
2. Verify active subscriptions exist
3. Check logs for errors
4. Manually trigger via API endpoint for testing

### Wrong Account Numbers
1. Verify deferred revenue accounts exist (23010, 23020, 23030, 23040)
2. Check account_type mapping in service
3. Ensure revenue accounts exist (40100, 40200, 40300)

## Next Steps

1. **Integrate with existing subscription payment flow**
2. **Set up daily scheduler**
3. **Create deferred revenue accounts**
4. **Test with sample subscriptions**
5. **Monitor entries in Transaction Management tab**
6. **Verify calculations match expected amounts**


