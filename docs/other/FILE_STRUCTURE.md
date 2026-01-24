# Kamioi Project - Complete File Structure

## Project Root
```
v10072025/
├── PROJECT_EXPORT.md          # Complete project documentation
├── SETUP_INSTRUCTIONS.md      # Setup and run instructions
├── ERROR_LOG.md              # Error log and debugging info
├── FILE_STRUCTURE.md         # This file
├── frontend/                 # React frontend application
└── backend/                  # Flask backend application
```

---

## Frontend Structure
```
frontend/
├── package.json              # Node.js dependencies
├── vite.config.js            # Vite configuration
├── index.html               # HTML entry point
├── src/
│   ├── App.jsx              # Main React application (458 lines)
│   ├── main.jsx             # React entry point
│   ├── components/          # React components
│   │   ├── admin/           # Admin dashboard components
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── LLMCenter.jsx
│   │   │   ├── SystemSettings.jsx
│   │   │   ├── NotificationsCenter.jsx
│   │   │   ├── ConsolidatedUserManagement.jsx
│   │   │   ├── EmployeeManagement.jsx
│   │   │   ├── FeatureFlags.jsx
│   │   │   ├── AdvertisementModule.jsx
│   │   │   ├── ContentManagement.jsx
│   │   │   ├── GoogleAnalytics.jsx
│   │   │   ├── FinancialAnalytics.jsx
│   │   │   └── [20+ other admin components]
│   │   ├── user/            # User dashboard components
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── UserTransactions.jsx
│   │   │   ├── UserPortfolio.jsx
│   │   │   └── [10+ other user components]
│   │   ├── common/          # Shared components
│   │   │   ├── CompanyLogo.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── [5+ other common components]
│   │   └── auth/            # Authentication components
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       └── [3+ other auth components]
│   ├── context/             # React contexts
│   │   ├── AuthContext.jsx  # Authentication state
│   │   ├── DataContext.jsx  # Data management
│   │   ├── ThemeContext.jsx # Theme management
│   │   ├── ModalContext.jsx # Modal management
│   │   └── TutorialContext.jsx # Tutorial system
│   ├── pages/              # Page components
│   │   ├── Login.jsx        # Login page
│   │   ├── Register.jsx     # Registration page
│   │   ├── UserDashboard.jsx # User dashboard
│   │   ├── AdminDashboard.jsx # Admin dashboard
│   │   └── [5+ other pages]
│   ├── services/            # API services
│   │   ├── apiService.js    # Main API service
│   │   ├── notificationService.js # Notification service
│   │   └── [3+ other services]
│   ├── utils/               # Utility functions
│   │   ├── formatters.js    # Data formatting
│   │   ├── validators.js    # Input validation
│   │   └── [5+ other utilities]
│   └── styles/              # CSS styles
│       ├── globals.css      # Global styles
│       └── components.css   # Component styles
├── public/                  # Static assets
│   ├── favicon.ico
│   └── [5+ other static files]
└── node_modules/            # Node.js dependencies
```

---

## Backend Structure
```
backend/
├── app_clean.py             # Main Flask application (120KB, 3381 lines)
├── kamioi.db               # SQLite database (1.3GB)
├── requirements.txt        # Python dependencies
├── training_exports/      # CSV data files
│   ├── training_data_20251015_105739.csv (46MB)
│   ├── training_data_20251015_185558.csv (39MB)
│   ├── training_data_20251015_185428.csv (39MB)
│   └── [3+ other CSV files]
├── services/              # Backend services
│   ├── database_manager.py # Database operations
│   ├── smart_llm_processor.py # LLM integration
│   ├── alpaca_service.py   # Stock API integration
│   └── [10+ other services]
├── routes/                # API route modules
│   ├── auth_routes.py     # Authentication routes
│   ├── user_routes.py     # User routes
│   ├── admin_routes.py    # Admin routes
│   └── [5+ other route modules]
├── models/                # Database models
│   ├── user_model.py      # User model
│   ├── transaction_model.py # Transaction model
│   └── [8+ other models]
├── utils/                 # Utility functions
│   ├── auth_utils.py      # Authentication utilities
│   ├── data_utils.py      # Data processing
│   └── [5+ other utilities]
├── tests/                 # Test files
│   ├── test_auth.py       # Authentication tests
│   ├── test_api.py        # API tests
│   └── [10+ other test files]
├── config/                # Configuration files
│   ├── database_config.py # Database configuration
│   ├── api_config.py      # API configuration
│   └── [3+ other config files]
├── instance/              # Instance-specific files
│   └── config.py          # Instance configuration
├── .venv/                 # Python virtual environment
├── __pycache__/           # Python cache files
└── [50+ other Python files] # Supporting modules
```

---

## Key Files by Size

### Largest Files
1. `backend/kamioi.db` - 1.3GB (SQLite database)
2. `backend/app_clean.py` - 120KB (Main Flask app)
3. `backend/training_exports/training_data_20251015_105739.csv` - 46MB
4. `frontend/src/App.jsx` - 458 lines (Main React app)
5. `frontend/src/context/AuthContext.jsx` - 429 lines

### Critical Files
1. `backend/app_clean.py` - Main backend application
2. `frontend/src/App.jsx` - Main frontend application
3. `frontend/src/services/apiService.js` - API communication
4. `frontend/src/context/AuthContext.jsx` - Authentication
5. `backend/kamioi.db` - Database

---

## Configuration Files

### Frontend Configuration
- `package.json` - Node.js dependencies and scripts
- `vite.config.js` - Vite build configuration
- `index.html` - HTML entry point

### Backend Configuration
- `requirements.txt` - Python dependencies
- `app_clean.py` - Flask application configuration
- `kamioi.db` - SQLite database

### Environment Files
- No `.env` files currently (using hardcoded values)
- CORS configured in `app_clean.py`
- API URLs hardcoded in frontend

---

## Database Tables

### Core Tables
- `users` - User accounts
- `admins` - Admin accounts
- `transactions` - Financial transactions
- `llm_mappings` - AI merchant mappings
- `notifications` - System notifications

### Financial Tables
- `roundup_ledger` - Round-up transactions
- `user_stock_ownership` - Stock holdings
- `user_wallets` - User wallet data
- `wallet_transactions` - Wallet transactions

### System Tables
- `user_settings` - User preferences
- `admin_settings` - Admin settings
- `market_queue` - Market transactions
- `password_reset_tokens` - Password reset

### Additional Tables
- `goals` - User financial goals
- `portfolios` - Portfolio data
- `statements` - Bank statements
- `user_bank_connections` - Bank connections
- `real_time_transactions` - Real-time data
- `user_debt_tracking` - Debt tracking
- `advertisements` - Ad data
- `system_events` - System events
- `test` - Test data

---

## API Endpoints Structure

### Authentication Endpoints
```
POST /api/user/auth/login
POST /api/admin/auth/login
GET /api/user/auth/me
GET /api/admin/auth/me
```

### User Endpoints
```
GET /api/user/transactions
GET /api/user/portfolio
GET /api/user/notifications
GET /api/user/profile
GET /api/user/goals
GET /api/user/roundups
GET /api/user/fees
GET /api/user/ai-insights
```

### Admin Endpoints
```
GET /api/admin/users
GET /api/admin/transactions
GET /api/admin/llm-center/queue
GET /api/admin/llm-center/mappings
GET /api/admin/employees
GET /api/admin/settings/analytics
```

### Database Management Endpoints
```
GET /api/admin/database/connectivity-matrix
GET /api/admin/database/data-quality
GET /api/admin/database/performance
GET /api/admin/ledger/consistency
GET /api/admin/performance/storage
```

---

## Build and Run Commands

### Backend Commands
```bash
# Start backend
cd backend
python app_clean.py

# Install dependencies
pip install -r requirements.txt

# Check database
python -c "import sqlite3; conn=sqlite3.connect('kamioi.db')"
```

### Frontend Commands
```bash
# Start frontend
cd frontend
npm run dev

# Install dependencies
npm install

# Build for production
npm run build
```

---

## Current Issues by File

### Backend Issues
- `app_clean.py` - Missing API endpoints, authentication issues
- `kamioi.db` - Database connection problems
- `requirements.txt` - Missing dependencies

### Frontend Issues
- `src/App.jsx` - Authentication state management
- `src/services/apiService.js` - API call authentication
- `src/context/AuthContext.jsx` - Token handling
- `src/components/admin/SystemSettings.jsx` - JavaScript errors
- `src/components/admin/NotificationsCenter.jsx` - Runtime errors

---

## Development Notes

### Authentication System
- Separate admin and user authentication
- Token-based authentication
- Frontend uses localStorage for token storage
- Backend validates tokens on each request

### Database Operations
- Direct SQLite queries (no ORM)
- Complex relationships between tables
- Manual schema management
- CSV import/export functionality

### Frontend State Management
- React Context API for state
- Manual refresh triggers
- Error handling needed
- Component lifecycle management

---

*This file structure provides a complete overview of the Kamioi project for another developer to understand and work with.*
