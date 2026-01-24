# Kamioi Project - Setup Instructions

## Quick Start Guide

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python app_clean.py
```

### 2. Frontend Setup
```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Access Points
- **Frontend**: http://localhost:3764
- **Backend API**: http://127.0.0.1:5000
- **Admin Login**: info@kamioi.com / admin123
- **User Login**: user5@user5.com / user123

---

## Current Issues to Fix

### Critical Problems
1. **Authentication System Broken**
   - Admin and user tokens conflicting
   - Frontend not sending proper auth headers
   - Login failures for both admin and users

2. **Database Connection Issues**
   - Frontend not reading database correctly
   - API endpoints returning 404 errors
   - CORS policy blocking requests

3. **Frontend JavaScript Errors**
   - `Cannot read properties of undefined` errors
   - SystemSettings component crashes
   - NotificationsCenter component errors

4. **Missing API Endpoints**
   - 15+ endpoints returning 404
   - Database management endpoints missing
   - Authentication endpoints failing

---

## File Structure Overview

```
v10072025/
├── backend/
│   ├── app_clean.py          # Main Flask app (120KB)
│   ├── kamioi.db            # SQLite database (1.3GB)
│   ├── requirements.txt     # Python dependencies
│   ├── training_exports/    # CSV data files
│   └── [20+ Python files]   # Supporting modules
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React app
│   │   ├── components/      # React components
│   │   ├── context/         # React contexts
│   │   └── services/        # API services
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
└── PROJECT_EXPORT.md       # Complete documentation
```

---

## Key Configuration Files

### Backend (Flask)
- **Main App**: `app_clean.py`
- **Database**: SQLite (`kamioi.db`)
- **CORS**: Configured for `http://localhost:3764`
- **Port**: 5000

### Frontend (React + Vite)
- **Main App**: `src/App.jsx`
- **API Base**: `http://127.0.0.1:5000`
- **Port**: 3764
- **Build Tool**: Vite

---

## Database Schema

### Key Tables
- `users` - User accounts
- `admins` - Admin accounts  
- `transactions` - Financial transactions
- `llm_mappings` - AI merchant mappings
- `notifications` - System notifications
- `user_stock_ownership` - Stock holdings

### Current State
- **Database**: 1.3GB SQLite file
- **Tables**: 20+ tables with relationships
- **Data**: Currently empty (cleared for fresh start)
- **Backup Data**: Available in `training_exports/`

---

## API Endpoints

### Authentication
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
```

### Admin Endpoints
```
GET /api/admin/users
GET /api/admin/transactions
GET /api/admin/llm-center/queue
GET /api/admin/llm-center/mappings
```

### Database Management
```
GET /api/admin/database/connectivity-matrix
GET /api/admin/database/data-quality
GET /api/admin/performance/storage
```

---

## Troubleshooting

### Common Issues
1. **Backend won't start**: Check Python version and dependencies
2. **Frontend won't connect**: Verify CORS configuration
3. **Database errors**: Check SQLite file permissions
4. **Authentication fails**: Verify token handling in frontend

### Debug Commands
```bash
# Check backend health
curl http://127.0.0.1:5000/api/health

# Check database
python -c "import sqlite3; conn=sqlite3.connect('kamioi.db'); print('DB OK')"

# Check frontend build
npm run build
```

---

## Development Notes

### Authentication System
- **Separate Systems**: Admin and user authentication are separate
- **Token Storage**: Frontend uses localStorage for tokens
- **Headers**: API requests need `Authorization: Bearer <token>`

### Database Operations
- **ORM**: Direct SQLite queries (no ORM)
- **Migrations**: Manual schema updates
- **Backups**: CSV files in `training_exports/`

### Frontend State Management
- **Context API**: AuthContext, DataContext, ThemeContext
- **State Updates**: Manual refresh triggers
- **Error Handling**: Try-catch blocks needed

---

## Next Steps

1. **Fix Authentication**: Resolve token conflicts
2. **Connect APIs**: Ensure frontend-backend communication
3. **Fix Database**: Restore proper data flow
4. **Error Handling**: Fix JavaScript errors
5. **Testing**: Verify all endpoints work

---

*This project is 90% complete but needs authentication and database connection fixes.*
