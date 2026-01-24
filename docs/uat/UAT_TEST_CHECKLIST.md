# UAT Test Execution Checklist
## Quick Reference Guide for Testers

**Date:** 2024  
**Purpose:** Quick checklist for manual test execution

---

## Phase 1: Website & Public Pages ✅

### Homepage
- [ ] Loads in < 3 seconds
- [ ] All sections visible
- [ ] Navigation works
- [ ] CTA buttons work
- [ ] Blog preview shows
- [ ] Responsive design works
- [ ] Images load
- [ ] SEO meta tags present

### Blog Listing
- [ ] Blog posts display
- [ ] Pagination works (9 per page)
- [ ] Search works
- [ ] Category filter works
- [ ] Clicking post navigates
- [ ] Page resets on filter

### Blog Post
- [ ] Content displays
- [ ] Images load
- [ ] Related posts show (max 3)
- [ ] Share buttons work (toast)
- [ ] Navigation back works

### Terms & Privacy
- [ ] Pages load
- [ ] Content displays
- [ ] Icons render

### Demo
- [ ] Demo entry works
- [ ] Demo code validation works
- [ ] Demo dashboard accessible
- [ ] Dashboard switching works

---

## Phase 2: Authentication & Registration ✅

### Registration
- [ ] Individual registration works
- [ ] Family registration works
- [ ] Business registration works
- [ ] Password strength enforced
- [ ] Form validation works
- [ ] Multi-step navigation works
- [ ] Subscription selection works

### Login
- [ ] Valid login works
- [ ] Invalid login shows error
- [ ] Demo code from login works
- [ ] Redirect to dashboard works

### Password Reset
- [ ] Forgot password works
- [ ] Email sent
- [ ] Reset link works
- [ ] Password strength enforced
- [ ] Reset succeeds
- [ ] New password works

### MFA
- [ ] Method selection works
- [ ] Code sent
- [ ] Code verification works
- [ ] Invalid code rejected
- [ ] Resend works
- [ ] Timeout works (5 min)

### MX Connect
- [ ] Widget opens
- [ ] Connection flow works
- [ ] Success handled
- [ ] Error handled

### Session
- [ ] 30-min timeout works
- [ ] 15-min inactivity works
- [ ] Activity detection works
- [ ] Logout clears session

---

## Phase 3: User Dashboard ✅

### Overview
- [ ] Loads < 2 seconds
- [ ] User info displays
- [ ] Summary cards show
- [ ] Recent transactions show
- [ ] Quick actions work
- [ ] Navigation works
- [ ] Theme toggle works

### Transactions
- [ ] List loads
- [ ] All transactions show
- [ ] Details show
- [ ] Status badges show
- [ ] Filtering works
- [ ] Search works
- [ ] Sort works
- [ ] Export works
- [ ] Company logos load

### Portfolio
- [ ] Overview displays
- [ ] Total invested correct
- [ ] Holdings show
- [ ] Charts render
- [ ] Filters work
- [ ] Export works

### Goals
- [ ] List displays
- [ ] Create works
- [ ] Edit works
- [ ] Delete works
- [ ] Progress tracks

### Settings
- [ ] Page loads
- [ ] Profile editable
- [ ] Password change works
- [ ] Preferences save
- [ ] Bank connections work
- [ ] Subscription management works

### Notifications
- [ ] List displays
- [ ] Unread count shows
- [ ] Mark as read works
- [ ] Delete works
- [ ] Click navigates

### AI Insights
- [ ] Page loads
- [ ] Insights display
- [ ] Recommendations show

---

## Phase 4: Family Dashboard ✅

- [ ] Dashboard loads
- [ ] Family info displays
- [ ] Members management works
- [ ] Transactions show
- [ ] Portfolio displays
- [ ] Goals work
- [ ] Settings work

---

## Phase 5: Business Dashboard ✅

- [ ] Dashboard loads
- [ ] Business info displays
- [ ] Transactions show
- [ ] Analytics work
- [ ] Employee management works
- [ ] Goals work
- [ ] Settings work
- [ ] AI insights work

---

## Phase 6: Admin Dashboard ✅

### Overview & Platform
- [ ] Dashboard loads
- [ ] Overview cards show
- [ ] Platform stats accurate

### Management
- [ ] Transactions management works
- [ ] User management works
- [ ] Family management works
- [ ] Business management works
- [ ] Employee management works

### Analytics & Processing
- [ ] Financial analytics work
- [ ] Investment summary works
- [ ] Investment processing works

### ML/LLM
- [ ] LLM Center works
- [ ] LLM Data Management works
- [ ] ML Dashboard works
- [ ] Overview page displays

### Content & Settings
- [ ] Content management works
- [ ] Notifications & messaging work
- [ ] Subscriptions management works
- [ ] System settings work

---

## Phase 7: Cross-Dashboard ✅

- [ ] Dashboard switching works
- [ ] Data syncs across dashboards
- [ ] Notifications sync
- [ ] Theme syncs
- [ ] Session syncs

---

## Phase 8: Integration & API ✅

- [ ] Authentication APIs work
- [ ] Transaction APIs work
- [ ] Investment APIs work
- [ ] Third-party integrations work

---

## Phase 9: Performance ✅

- [ ] Page loads < 3 seconds
- [ ] API responses < 500ms
- [ ] Handles 100+ concurrent users
- [ ] No memory leaks

---

## Phase 10: Security ✅

- [ ] Password requirements enforced
- [ ] Session tokens secure
- [ ] CSRF protection works
- [ ] XSS protection works
- [ ] User data isolated
- [ ] Admin access protected

---

## Phase 11: Accessibility ✅

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets standards
- [ ] Alt text present
- [ ] Form labels present
- [ ] ARIA labels present

---

## Phase 12: Browser Compatibility ✅

- [ ] Chrome works
- [ ] Firefox works
- [ ] Safari works
- [ ] Edge works
- [ ] Mobile browsers work

---

## Phase 13: Data Integrity ✅

- [ ] Transaction amounts accurate
- [ ] Round-up calculations correct
- [ ] Investment amounts accurate
- [ ] Share calculations correct
- [ ] Data consistent across dashboards

---

## Phase 14: Error Handling ✅

- [ ] Offline handling works
- [ ] Timeout handling works
- [ ] API errors handled (400, 401, 403, 404, 500)
- [ ] Empty states handled
- [ ] Null/undefined handled
- [ ] Invalid input handled

---

## Quick Test Commands

### Start Servers
```bash
# Backend (in backend directory)
npm run dev

# Frontend (in frontend directory)
npm run dev
```

### Test URLs
- Homepage: `http://localhost:4000/`
- Blog: `http://localhost:4000/blog`
- Login: `http://localhost:4000/login`
- User Dashboard: `http://localhost:4000/dashboard/1/`
- Admin Dashboard: `http://localhost:4000/admin/1/`

### Test Accounts
- Individual: `test-individual@example.com` / `TestPassword123!`
- Family: `test-family@example.com` / `TestPassword123!`
- Business: `test-business@example.com` / `TestPassword123!`
- Admin: `admin@example.com` / `AdminPassword123!`

---

**Last Updated:** 2024  
**Status:** 🟡 Ready for Execution

