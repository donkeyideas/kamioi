# Stripe Integration - Step-by-Step Completion Guide

## ✅ Completed Steps

1. ✅ Database migration script created and run
2. ✅ Backend Stripe service and endpoints created
3. ✅ Frontend Stripe components created (StripeCheckout, StripeSubscriptionManager)
4. ✅ Success/Cancel pages created
5. ✅ Routes added to App.jsx
6. ✅ UserSettings enhanced with StripeSubscriptionManager

## 🔧 Remaining Steps

### Step 1: Set Up Webhooks (REQUIRED)

#### Option A: Local Development (Recommended)

1. **Install Stripe CLI:**
   - Windows: Download from https://stripe.com/docs/stripe-cli
   - Mac: `brew install stripe/stripe-cli/stripe`
   - Linux: See https://stripe.com/docs/stripe-cli

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Start Webhook Listener:**
   - Windows: Run `backend\scripts\setup_stripe_webhook_local.ps1`
   - Linux/Mac: Run `backend/scripts/setup_stripe_webhook_local.sh`
   - Or manually: `stripe listen --forward-to localhost:5111/api/stripe/webhook`

4. **Copy Webhook Secret:**
   - The CLI will output: `> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx`
   - Copy this secret

5. **Add to .env:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. **Restart Backend:**
   - Restart your Flask server to load the webhook secret

#### Option B: Production

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copy the signing secret
5. Add to production `.env`

### Step 2: Integrate StripeCheckout into Registration (Login.jsx)

The registration flow in `Login.jsx` currently creates accounts and then subscribes. To integrate Stripe:

**Location:** `frontend/src/pages/Login.jsx`

**Where to add:** After account creation (around line 800-900 in `handleMXSuccess`), before redirecting to dashboard.

**Option 1: Redirect to Stripe Checkout After Account Creation**

Modify the `handleMXSuccess` function to check if `selectedPlanId` is set, and if so, redirect to Stripe checkout instead of directly subscribing:

```jsx
// In handleMXSuccess, after account creation succeeds
if (result.success) {
  // ... existing code ...
  
  // Check if user selected a plan
  const selectedPlanId = individualData.selectedPlanId || 
                        familyData.selectedPlanId || 
                        businessData.selectedPlanId
  
  if (selectedPlanId) {
    // Redirect to Stripe checkout
    const token = localStorage.getItem('kamioi_user_token') || result.token
    const checkoutResponse = await fetch('http://127.0.0.1:5111/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        plan_id: selectedPlanId,
        billing_cycle: 'monthly' // or get from form data
      })
    })
    
    const checkoutData = await checkoutResponse.json()
    if (checkoutData.success && checkoutData.url) {
      window.location.href = checkoutData.url
      return
    }
  }
  
  // Otherwise, redirect to dashboard as before
  // ... existing redirect code ...
}
```

**Option 2: Add StripeCheckout Component to Registration Form**

Add the StripeCheckout component in the subscription selection step (step 5 for individual, step 6 for family, step 7 for business):

```jsx
// Import at top of Login.jsx
import StripeCheckout from '../components/common/StripeCheckout'

// In the subscription step rendering (around line 2040-2093)
{registrationStep === 5 && registrationType === 'individual' && (
  <div className="space-y-4">
    {/* Existing plan selection UI */}
    
    {/* Add Stripe Checkout after plan selection */}
    {individualData.selectedPlanId && (
      <StripeCheckout
        planId={individualData.selectedPlanId}
        billingCycle="monthly"
        buttonText="Continue to Payment"
        onSuccess={() => {
          // After successful checkout, complete registration
          handleSubmit()
        }}
      />
    )}
  </div>
)}
```

**Recommended Approach:** Option 1 is cleaner as it keeps the payment flow separate from registration.

### Step 3: Test the Integration

1. **Start Backend:**
   ```bash
   cd backend
   python app.py
   ```

2. **Start Webhook Listener** (in separate terminal):
   ```bash
   stripe listen --forward-to localhost:5111/api/stripe/webhook
   ```

3. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test Registration:**
   - Go to `/login`
   - Click "Sign Up"
   - Complete registration
   - Select a subscription plan
   - Complete Stripe checkout with test card: `4242 4242 4242 4242`
   - Verify redirect to success page
   - Check backend logs for webhook processing
   - Check database for subscription record

5. **Test Subscription Management:**
   - Go to `/dashboard/{userId}/settings`
   - Click on "Subscription" section
   - Verify StripeSubscriptionManager shows current subscription
   - Test "Manage Subscription" button
   - Verify Customer Portal opens

## 📝 Notes

- **Test Mode:** Currently using Stripe test mode. Switch to live mode in production by updating `STRIPE_MODE=live` in `.env`
- **API Keys:** If your keys were exposed, rotate them in Stripe Dashboard
- **Webhooks:** Required for payments to work. Without webhooks, subscriptions won't be created in your database
- **HTTPS:** Production webhooks require HTTPS

## 🐛 Troubleshooting

### Webhooks Not Receiving Events
- Check webhook secret is set in `.env`
- Verify endpoint URL is correct
- Check server logs for errors
- Ensure server is running and accessible

### Checkout Not Working
- Check API endpoint is accessible
- Verify user is authenticated
- Check backend logs for errors
- Verify Stripe keys in `.env`

### Subscription Not Showing
- Check webhook is set up correctly
- Verify database has subscription record
- Check API endpoint returns subscription data
- Look for webhook processing errors in backend logs

## 📚 Additional Resources

- Stripe Documentation: https://stripe.com/docs
- Stripe Dashboard: https://dashboard.stripe.com
- Webhook Testing: Use Stripe CLI or ngrok
- Frontend Integration Examples: See `frontend/INTEGRATION_EXAMPLES.md`


