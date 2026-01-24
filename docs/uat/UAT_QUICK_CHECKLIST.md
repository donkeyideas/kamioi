# UAT Quick Reference Checklist
## Kamioi Platform - Testing Quick Guide

This is a condensed checklist for quick reference during testing. See `UAT_TEST_PLAN.md` for detailed test cases.

---

## 🚀 Quick Start Testing Order

### 1. Website & Public (15-20 min)
- [ ] Homepage loads and displays
- [ ] Blog listing works
- [ ] Blog post displays
- [ ] Terms/Privacy pages load
- [ ] Demo entry works

### 2. Authentication (20-30 min)
- [ ] User registration completes
- [ ] User login works
- [ ] Password reset flow
- [ ] MFA setup (if applicable)
- [ ] Logout works

### 3. User Dashboard (45-60 min)
- [ ] Dashboard overview loads
- [ ] Transactions page - all filters/search
- [ ] Portfolio/Analytics displays
- [ ] Investment summary accurate
- [ ] Settings save correctly
- [ ] Notifications work

### 4. Family Dashboard (30-40 min)
- [ ] Family dashboard loads
- [ ] Member management works
- [ ] Family transactions display
- [ ] Combined portfolio shows
- [ ] Family settings work

### 5. Business Dashboard (40-50 min)
- [ ] Business dashboard loads
- [ ] Business transactions display
- [ ] Analytics work
- [ ] Employee management (if applicable)
- [ ] Business settings work

### 6. Admin Dashboard (2-3 hours)
- [ ] Admin dashboard loads
- [ ] **Platform Overview** - all stats
- [ ] **Transactions** - filters, export, cleanup
- [ ] **User Management** - CRUD operations
- [ ] **Family Management** - CRUD operations
- [ ] **Business Management** - CRUD operations
- [ ] **Financial Analytics** - all charts
- [ ] **Investment Summary** - all data
- [ ] **Investment Processing** - queue works
- [ ] **LLM Center** - recognition, learning
- [ ] **LLM Data Management** - mappings
- [ ] **ML Dashboard** - all tabs, especially Overview
- [ ] **Notifications** - send/receive
- [ ] **Content Management** - blog posts
- [ ] **System Settings** - all sections
- [ ] **Loading Report** - performance data

---

## 🔍 Critical Path Testing

### Must Test Before Launch
1. **Registration → Login → Dashboard Flow**
2. **Transaction Creation → Round-up → Investment**
3. **Admin: View All Transactions**
4. **Admin: ML Dashboard Overview**
5. **Admin: User Management**
6. **Cross-dashboard data sync**
7. **Error handling (network failures)**
8. **Security (unauthorized access attempts)**

---

## ⚠️ Common Issues to Watch For

### Data Issues
- [ ] Transaction amounts don't match
- [ ] Round-up calculations incorrect
- [ ] Investment totals wrong
- [ ] Status not updating
- [ ] Duplicate entries

### UI Issues
- [ ] Buttons not working
- [ ] Forms not submitting
- [ ] Filters not applying
- [ ] Pagination broken
- [ ] Mobile layout broken

### Performance Issues
- [ ] Pages load slowly
- [ ] API calls timeout
- [ ] Large lists lag
- [ ] Charts don't render

### Security Issues
- [ ] Can access other user's data
- [ ] Admin features accessible to users
- [ ] Passwords not encrypted
- [ ] Session not expiring

---

## 📊 Test Coverage Summary

| Phase | Test Cases | Estimated Time |
|-------|-----------|----------------|
| Phase 1: Website | ~30 | 1 hour |
| Phase 2: Auth | ~40 | 1.5 hours |
| Phase 3: User Dashboard | ~80 | 2 hours |
| Phase 4: Family Dashboard | ~50 | 1.5 hours |
| Phase 5: Business Dashboard | ~60 | 2 hours |
| Phase 6: Admin Dashboard | ~200+ | 6-8 hours |
| Phase 7: Cross-Dashboard | ~20 | 1 hour |
| Phase 8: API Testing | ~50 | 2 hours |
| Phase 9: Performance | ~30 | 2 hours |
| Phase 10: Security | ~40 | 2 hours |
| Phase 11: Accessibility | ~30 | 1.5 hours |
| Phase 12: Browser/Device | ~20 | 2 hours |
| Phase 13: Data Integrity | ~40 | 2 hours |
| Phase 14: Error Handling | ~50 | 2 hours |
| **TOTAL** | **~750+** | **~30-35 hours** |

---

## 🎯 Priority Testing (If Time Limited)

### P0 - Critical (Must Test)
1. User registration and login
2. Transaction viewing and creation
3. Investment processing
4. Admin: All transactions view
5. Admin: User management
6. Admin: ML Dashboard Overview
7. Security: Unauthorized access
8. Data accuracy: Calculations

### P1 - High (Should Test)
1. All dashboard overviews
2. Settings pages
3. Analytics/Portfolio pages
4. Admin: Financial analytics
5. Admin: Investment processing
6. Cross-dashboard features
7. Error handling

### P2 - Medium (Nice to Have)
1. Blog/content pages
2. Notifications
3. Goals/Planning
4. Admin: Content management
5. Admin: System settings
6. Performance testing

### P3 - Low (If Time Permits)
1. Accessibility details
2. Browser edge cases
3. Stress testing
4. Advanced admin features

---

## 📝 Testing Tips

1. **Start Fresh:** Clear cache/cookies between test sessions
2. **Take Screenshots:** Document everything
3. **Test Data:** Use consistent test data
4. **Network:** Test with slow 3G simulation
5. **Devices:** Test on real devices, not just emulators
6. **Edge Cases:** Try invalid inputs, empty states
7. **Concurrent:** Test multiple users simultaneously
8. **Document:** Log all findings immediately

---

## 🐛 Bug Severity Guide

### Critical (Fix Immediately)
- System crashes
- Data loss
- Security vulnerabilities
- Cannot complete core workflows
- Payment processing broken

### High (Fix Soon)
- Major feature broken
- Data incorrect
- Performance issues
- UI completely broken on a page

### Medium (Fix When Possible)
- Minor feature issues
- UI inconsistencies
- Non-critical errors
- Workarounds available

### Low (Fix If Time)
- Cosmetic issues
- Minor text errors
- Nice-to-have improvements

---

## ✅ Pre-Launch Checklist

- [ ] All P0 bugs fixed
- [ ] All P1 bugs fixed or documented
- [ ] Core workflows tested end-to-end
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Mobile responsive verified
- [ ] Browser compatibility verified
- [ ] Error handling tested
- [ ] Data accuracy verified
- [ ] Admin dashboard fully functional
- [ ] Documentation updated
- [ ] Stakeholder sign-off received

---

**Quick Reference - See UAT_TEST_PLAN.md for detailed test cases**

