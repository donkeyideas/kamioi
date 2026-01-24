# Kamioi Project - Complete Export for Developer Handoff

## Project Overview
**Kamioi** - AI-powered investment platform with round-up transactions, LLM merchant mapping, and automated stock purchases.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend**: Flask + SQLite + RESTful API
- **Authentication**: Token-based (separate admin/user systems)
- **Database**: SQLite with 20+ tables
- **AI/ML**: LLM merchant mapping system

---

## 1. PROJECT STRUCTURE

```
v10072025/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React contexts
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utility functions
│   │   └── App.jsx          # Main app
│   ├── package.json
│   └── vite.config.js
├── backend/                 # Flask backend
│   ├── app_clean.py         # Main Flask app
│   ├── kamioi.db           # SQLite database (1.3GB)
│   ├── requirements.txt
│   └── training_exports/    # CSV data files
└── PROJECT_EXPORT.md        # This file
```

---

## 2. BACKEND SETUP

### Main Entry Point
**File**: `backend/app_clean.py` (120KB Flask application)

### Key Backend Features
- **Authentication**: Separate admin/user token systems
- **Database**: SQLite with 20+ tables
- **API Endpoints**: 50+ RESTful endpoints
- **LLM Integration**: Merchant mapping system
- **Alpaca API**: Stock purchase integration

### Database Schema (Key Tables)
```sql
-- Users & Authentication
users (id, email, password, role, created_at)
admins (id, email, password, role, permissions)
password_reset_tokens (email, token, expires_at)

-- Financial Data
transactions (id, user_id, amount, merchant, status, created_at)
llm_mappings (id, merchant_name, ticker, confidence, status)
roundup_ledger (id, user_id, amount, stock_ticker, status)
user_stock_ownership (id, user_id, ticker, shares, value)

-- System Tables
notifications (id, user_id, title, message, type, read)
user_settings (id, user_id, settings_json)
market_queue (id, user_id, amount, ticker, status)
```

### Key API Endpoints
```
Authentication:
POST /api/user/auth/login
POST /api/admin/auth/login
GET /api/user/auth/me
GET /api/admin/auth/me

User Data:
GET /api/user/transactions
GET /api/user/portfolio
GET /api/user/notifications

Admin Data:
GET /api/admin/users
GET /api/admin/transactions
GET /api/admin/llm-center/queue
GET /api/admin/llm-center/mappings

Database Management:
GET /api/admin/database/connectivity-matrix
GET /api/admin/database/data-quality
GET /api/admin/performance/storage
```

### CORS Configuration
```python
from flask_cors import CORS
CORS(app, origins=["http://localhost:3764", "http://127.0.0.1:3764"])
```

---

## 3. FRONTEND SETUP

### Main Entry Point
**File**: `frontend/src/App.jsx` (458 lines)

### Key Frontend Features
- **Authentication**: Token-based with localStorage
- **Context API**: AuthContext, DataContext, ThemeContext
- **Routing**: React Router with protected routes
- **UI**: Glassmorphism design with Tailwind CSS
- **Animations**: Framer Motion

### API Service
**File**: `frontend/src/services/apiService.js`
```javascript
// Base URL configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// Authentication headers
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Key Frontend Components
```
src/
├── components/
│   ├── admin/               # Admin dashboard components
│   │   ├── AdminDashboard.jsx
│   │   ├── LLMCenter.jsx
│   │   ├── SystemSettings.jsx
│   │   └── NotificationsCenter.jsx
│   ├── user/               # User dashboard components
│   ├── common/             # Shared components
│   └── auth/               # Authentication components
├── context/
│   ├── AuthContext.jsx     # Authentication state
│   ├── DataContext.jsx     # Data management
│   └── ThemeContext.jsx    # Theme management
└── pages/
    ├── Login.jsx           # Login page
    ├── UserDashboard.jsx   # User dashboard
    └── AdminDashboard.jsx  # Admin dashboard
```

---

## 4. CURRENT ISSUES & ERRORS

### Critical Issues
1. **Authentication Conflicts**: Admin and user tokens interfering
2. **Database Connection**: Frontend not reading database correctly
3. **CORS Errors**: Some endpoints blocked by CORS policy
4. **Missing Endpoints**: 15+ endpoints returning 404
5. **Frontend State**: React state not updating with API data

### Specific Error Messages
```
Frontend Console:
- "Cannot read properties of undefined (reading 'toLocaleString')"
- "Cannot read properties of undefined (reading 'maintenanceMode')"
- "net::ERR_FAILED" for various endpoints
- "401 UNAUTHORIZED" for database endpoints

Backend Logs:
- "404 NOT FOUND" for missing endpoints
- "CORS policy" errors
- Database connection timeouts
```

### Authentication Issues
- **Admin Login**: `info@kamioi.com` authentication conflicts
- **User Login**: `user5@user5.com` login failures
- **Token Management**: Frontend not sending proper auth headers

---

## 5. BUILD & RUN PROCESS

### Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app_clean.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```bash
# Backend (.env)
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///kamioi.db

# Frontend (vite.config.js)
VITE_API_BASE_URL=http://127.0.0.1:5000
VITE_FRONTEND_URL=http://localhost:3764
```

### Proxy Configuration
```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000'
    }
  }
})
```

---

## 6. DATABASE STATUS

### Current Database State
- **Size**: 1.3GB SQLite database
- **Tables**: 20+ tables with complex relationships
- **Data**: Currently empty (users, transactions, mappings cleared)
- **Backup**: Training data available in `training_exports/`

### Key Data Files
```
training_exports/
├── training_data_20251015_105739.csv (46MB)
├── training_data_20251015_185558.csv (39MB)
└── training_data_20251015_185428.csv (39MB)
```

---

## 7. DEVELOPMENT COMMANDS

### Start Backend
```bash
cd backend
python app_clean.py
# Runs on http://127.0.0.1:5000
```

### Start Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3764
```

### Database Operations
```bash
# Check database
python -c "import sqlite3; conn=sqlite3.connect('kamioi.db'); print(conn.execute('SELECT COUNT(*) FROM users').fetchone()[0])"

# Clear database
python -c "import sqlite3; conn=sqlite3.connect('kamioi.db'); conn.execute('DELETE FROM users'); conn.commit()"
```

---

## 8. CRITICAL FILES TO FOCUS ON

### Backend Priority
1. `app_clean.py` - Main Flask application
2. `database_manager.py` - Database operations
3. `smart_llm_processor.py` - LLM integration

### Frontend Priority
1. `src/App.jsx` - Main application
2. `src/context/AuthContext.jsx` - Authentication
3. `src/services/apiService.js` - API calls
4. `src/components/admin/LLMCenter.jsx` - LLM interface

### Configuration Files
1. `frontend/vite.config.js` - Frontend build config
2. `backend/requirements.txt` - Python dependencies
3. `frontend/package.json` - Node dependencies

---

## 9. NEXT STEPS FOR DEVELOPER

### Immediate Fixes Needed
1. **Fix Authentication**: Resolve admin/user token conflicts
2. **Connect Frontend/Backend**: Fix API communication
3. **Database Integration**: Ensure proper data flow
4. **Error Handling**: Fix JavaScript errors
5. **CORS Configuration**: Resolve cross-origin issues

### Testing Checklist
- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] Login system works for both admin and users
- [ ] Database queries return correct data
- [ ] LLM Center displays mappings
- [ ] All API endpoints return 200 status

---

## 10. CONTACT & SUPPORT

**Project Location**: `C:\Users\beltr\100402025Kamioiv1\v10072025\`
**Database**: `backend/kamioi.db` (1.3GB)
**Main App**: `backend/app_clean.py`
**Frontend**: `frontend/src/App.jsx`

**Key Credentials**:
- Admin: `info@kamioi.com` / `admin123`
- User: `user5@user5.com` / `user123`

---

*This export contains all necessary information for another developer to understand, debug, and complete the Kamioi project.*
