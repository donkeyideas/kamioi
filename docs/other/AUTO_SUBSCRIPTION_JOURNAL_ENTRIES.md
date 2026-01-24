# Automatic Subscription Journal Entries

## Overview
Journal entries are automatically created when users sign up for subscription plans. All entries appear in **Financial Analytics → Transaction Management** tab.

## Implementation Requirements

### Backend Integration
When a subscription is created, the backend should automatically call the journal entry creation service.

**Location:** `backend/services/subscription_accounting_service.py`

**Function to call:** `create_initial_payment_entry()`

### Integration Point
Add this to your subscription creation endpoint (wherever subscriptions are created):

```python
from services.subscription_accounting_service import SubscriptionAccountingService

# After subscription is successfully created
accounting_service = SubscriptionAccountingService(db_connection)

# Create journal entry automatically
journal_entry = accounting_service.create_initial_payment_entry(
    subscription_id=subscription.id,
    user_id=subscription.user_id,
    user_name=user.name,
    plan_name=subscription.plan_name,
    account_type=subscription.account_type,  # 'individual', 'family', 'business'
    amount=subscription.amount,  # Net amount after discounts
    original_amount=subscription.original_amount,
    discount_amount=subscription.discount_amount,
    payment_date=subscription.created_at
)

# Save journal entry to database
if journal_entry:
    db.create_journal_entry(journal_entry)
```

### Account Setup
The deferred revenue accounts (23010, 23020, 23030, 23040) are automatically added to the General Ledger when accounts are fetched. They will appear in:
- **Financial Analytics → General Ledger → Liabilities** category

### What Happens Automatically

1. **User Signs Up for Plan:**
   - Journal entry is created: `DR Cash (10100) / CR Deferred Revenue [Account Type]`
   - Entry appears in Transaction Management with reference: `SUB-INIT-{subscription_id}-{date}`

2. **Daily Revenue Recognition:**
   - Should be scheduled to run daily at 11:59 PM
   - Creates entries: `DR Deferred Revenue / CR Revenue`
   - Reference: `SUB-REV-{subscription_id}-{date}`

3. **Auto-Renewal:**
   - When subscription renews, creates payment entry
   - Reference: `SUB-RENEW-{subscription_id}-{date}`

### Viewing Entries
All journal entries appear in:
**Financial Analytics → Transaction Management**

Entries can be filtered by:
- Reference (search "SUB-INIT", "SUB-REV", "SUB-RENEW")
- Description (search "Subscription")
- Account numbers (23010, 23020, 23030 for deferred revenue)

### Account Numbers Reference

| Account | Number | Type | Category |
|---------|--------|------|----------|
| Cash | 10100 | Asset | Assets |
| Revenue – Individual | 40100 | Revenue | Revenue |
| Revenue – Family | 40200 | Revenue | Revenue |
| Revenue – Business | 40300 | Revenue | Revenue |
| Deferred Revenue – Individual | 23010 | Liability | Liabilities |
| Deferred Revenue – Family | 23020 | Liability | Liabilities |
| Deferred Revenue – Business | 23030 | Liability | Liabilities |
| Deferred Revenue – Failed Payments | 23040 | Liability | Liabilities |

### Notes
- All entries are automatically created - no manual intervention needed
- Entries appear in real-time in Transaction Management
- Deferred revenue accounts are automatically shown in General Ledger
- You can add new accounts using the "Add Account" button in General Ledger


