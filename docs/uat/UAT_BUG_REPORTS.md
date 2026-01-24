# UAT Bug Reports
## Kamioi Platform - Detailed Bug Tracking

---

## Bug Report: BUG-001

**Title:** HomePage.jsx - State declarations used before declaration  
**Severity:** Medium  
**Priority:** P2  
**Phase:** Phase 1 - Website & Public Pages  
**Test Case:** TC-001  
**Status:** ✅ Fixed

**Description:**
In `HomePage.jsx`, the state variables `blogs` and `blogsLoading` were being used in a `useEffect` hook (lines 44-67) before they were declared (lines 137-138). This would cause a runtime error.

**Steps to Reproduce:**
1. Navigate to homepage (`/`)
2. Component tries to use `setBlogs` and `setBlogsLoading` in useEffect
3. Error: "Cannot access 'setBlogs' before initialization"

**Expected Result:**
State variables should be declared before use.

**Actual Result:**
State variables were declared after use, causing potential runtime errors.

**Fix Applied:**
Moved state declarations (`const [blogs, setBlogs] = useState([])` and `const [blogsLoading, setBlogsLoading] = useState(true)`) to line 39-40, before the useEffect hook.

**Files Modified:**
- `frontend/src/pages/HomePage.jsx`

**Date Fixed:** 2024

---

## Bug Report: BUG-002

**Title:** AdminLogin.jsx - Hardcoded API URL  
**Severity:** Medium  
**Priority:** P2  
**Phase:** Phase 2 - Authentication & Registration  
**Test Case:** TC-XXX  
**Status:** ✅ Fixed

**Description:**
In `AdminLogin.jsx`, the API endpoint was hardcoded as `http://127.0.0.1:5111/api/admin/auth/login` instead of using the environment variable. This prevents the application from working in different environments (staging, production).

**Steps to Reproduce:**
1. Open AdminLogin.jsx
2. Check line 32
3. See hardcoded URL

**Expected Result:**
Should use `import.meta.env.VITE_API_BASE_URL` with fallback.

**Actual Result:**
Hardcoded URL prevents environment flexibility.

**Fix Applied:**
Changed to use `const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'` and updated fetch URL to use template literal.

**Files Modified:**
- `frontend/src/pages/AdminLogin.jsx`

**Date Fixed:** 2024

---

## Bug Report: BUG-003

**Title:** BlogListing.jsx - Wrong API port (4000 instead of 5111)  
**Severity:** Medium  
**Priority:** P2  
**Phase:** Phase 1 - Website & Public Pages  
**Test Case:** TC-XXX  
**Status:** ✅ Fixed

**Description:**
BlogListing.jsx uses port 4000 as fallback instead of 5111, which is inconsistent with other components.

**Fix Applied:**
Changed fallback from `http://localhost:4000` to `http://localhost:5111`

**Files Modified:**
- `frontend/src/pages/BlogListing.jsx`

**Date Fixed:** 2024

---

## Bug Report: BUG-004

**Title:** BlogPost.jsx - Wrong API port (4000 instead of 5111)  
**Severity:** Medium  
**Priority:** P2  
**Phase:** Phase 1 - Website & Public Pages  
**Test Case:** TC-XXX  
**Status:** ✅ Fixed

**Description:**
BlogPost.jsx uses port 4000 as fallback instead of 5111.

**Fix Applied:**
Changed fallback from `http://localhost:4000` to `http://localhost:5111` and improved code consistency.

**Files Modified:**
- `frontend/src/pages/BlogPost.jsx`

**Date Fixed:** 2024

---

## Bug Report: BUG-005

**Title:** TermsOfService.jsx - Missing icon imports  
**Severity:** High  
**Priority:** P1  
**Phase:** Phase 1 - Website & Public Pages  
**Test Case:** TC-XXX  
**Status:** ✅ Fixed

**Description:**
TermsOfService.jsx uses Shield and FileText icons but they are not imported, causing runtime errors.

**Fix Applied:**
Added Shield and FileText to imports from lucide-react.

**Files Modified:**
- `frontend/src/pages/TermsOfService.jsx`

**Date Fixed:** 2024

---

## Bug Report: BUG-006

**Title:** PrivacyPolicy.jsx - Missing icon imports  
**Severity:** High  
**Priority:** P1  
**Phase:** Phase 1 - Website & Public Pages  
**Test Case:** TC-XXX  
**Status:** ✅ Fixed

**Description:**
PrivacyPolicy.jsx uses Shield and Lock icons but they are not imported, causing runtime errors.

**Fix Applied:**
Added Shield and Lock to imports from lucide-react.

**Files Modified:**
- `frontend/src/pages/PrivacyPolicy.jsx`

**Date Fixed:** 2024

---

## Bug Report: BUG-008

**Title:** ForgotPassword.jsx - Wrong API port (4000 instead of 5111)  
**Severity:** Medium  
**Priority:** P2  
**Phase:** Phase 2 - Authentication & Registration  
**Test Case:** TC-XXX  
**Status:** ✅ Fixed

**Description:**
ForgotPassword.jsx uses port 4000 as fallback instead of 5111.

**Fix Applied:**
Changed fallback from `http://localhost:4000` to `http://localhost:5111`

**Files Modified:**
- `frontend/src/components/auth/ForgotPassword.jsx`

**Date Fixed:** 2024

---

## Bug Report: BUG-009

**Title:** ResetPassword.jsx - Wrong API port (4000 instead of 5111)  
**Severity:** Medium  
**Priority:** P2  
**Phase:** Phase 2 - Authentication & Registration  
**Test Case:** TC-XXX  
**Status:** ✅ Fixed

**Description:**
ResetPassword.jsx uses port 4000 as fallback in two places instead of 5111.

**Fix Applied:**
Changed both fallbacks from `http://localhost:4000` to `http://localhost:5111`

**Files Modified:**
- `frontend/src/components/auth/ResetPassword.jsx`

**Date Fixed:** 2024

---

## Bug Report: BUG-010

**Title:** Settings.jsx - Wrong API port (4000 instead of 5111)  
**Severity:** Medium  
**Priority:** P2  
**Phase:** Phase 3 - User Dashboard  
**Test Case:** TC-XXX  
**Status:** ✅ Fixed

**Description:**
Settings.jsx uses port 4000 as fallback in two places instead of 5111.

**Fix Applied:**
Changed both fallbacks from `http://localhost:4000` to `http://localhost:5111`

**Files Modified:**
- `frontend/src/components/user/Settings.jsx`

**Date Fixed:** 2024

---

## Bug Report: BUG-011

**Title:** [To be filled]  
**Severity:**  
**Priority:**  
**Phase:**  
**Test Case:**  
**Status:** ⬜ Open

---

