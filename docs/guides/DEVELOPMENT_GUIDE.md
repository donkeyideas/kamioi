# 🚀 Kamioi Platform Development Guide

## Quick Start

### Option 1: Automated Scripts (Recommended)
```bash
# Windows
scripts/start-dev.bat

# Linux/Mac
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

### Option 2: Manual Setup
```bash
# Terminal 1 - Backend
cd backend
python start_server.py

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:3764
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **Admin APIs**: http://localhost:5000/api/admin/*
- **User APIs**: http://localhost:5000/api/user/*
- **Family APIs**: http://localhost:5000/api/family/*
- **Business APIs**: http://localhost:5000/api/business/*

## 🎯 Performance Optimizations Implemented

### 1. Code Splitting
- ✅ Lazy loading for all dashboard components
- ✅ Separate chunks for AdminDashboard (724KB → optimized)
- ✅ Lazy-loaded RechartsChart (358KB → on-demand)
- ✅ Vendor chunk separation (React, Charts, UI libraries)

### 2. Bundle Optimization
- ✅ Manual chunk configuration in Vite
- ✅ Terser minification with console removal
- ✅ Tree shaking for unused code
- ✅ Optimized dependency pre-bundling

### 3. Development Workflow
- ✅ Automated startup scripts
- ✅ Performance monitoring component
- ✅ Bundle analysis tools
- ✅ Hot reload for both frontend and backend

## 📊 Build Commands

```bash
# Development
npm run dev                    # Start frontend dev server
python start_server.py         # Start backend server

# Production Build
npm run build                  # Build frontend
npm run build:prod            # Production build with optimizations
npm run build:analyze         # Build with bundle analysis

# Optimization
npm run optimize              # Build + analyze bundle
npm run analyze-bundle        # Analyze current bundle
```

## 🔧 Configuration Files

### Frontend (Vite)
- `frontend/vite.config.js` - Build optimization, chunk splitting
- `frontend/package.json` - Scripts and dependencies

### Backend (Flask)
- `backend/app.py` - Main application
- `backend/start_server.py` - Enhanced startup script
- `backend/requirements.txt` - Python dependencies

## 📈 Performance Metrics

### Before Optimization
- AdminDashboard: 724KB
- RechartsChart: 358KB
- Total bundle: ~2MB+

### After Optimization
- AdminDashboard: Lazy-loaded (loads only when needed)
- RechartsChart: On-demand loading
- Vendor chunks: Separated and cached
- Initial bundle: Significantly reduced

## 🛠️ Development Tips

### Frontend
1. Use lazy loading for new components
2. Monitor bundle size with `npm run analyze-bundle`
3. Check performance with PerformanceMonitor component
4. Use React DevTools for component analysis

### Backend
1. Use `python start_server.py` for enhanced startup
2. Check logs in `backend/kamioi.log`
3. Test endpoints with health check
4. Monitor database with admin endpoints

## 🐛 Troubleshooting

### Backend Won't Start
```bash
cd backend
python start_server.py  # Enhanced startup with checks
```

### Frontend Build Issues
```bash
cd frontend
npm install             # Reinstall dependencies
npm run build          # Test build
```

### Port Conflicts
- Frontend: Change port in `vite.config.js` (default: 3764)
- Backend: Change port in `start_server.py` (default: 5000)

## 📝 Testing

### Health Checks
```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend (open in browser)
http://localhost:3764
```

### API Testing
```bash
# Admin login
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kamioi.com","password":"password123"}'
```

## 🚀 Deployment

### Production Build
```bash
# Frontend
npm run build:prod

# Backend
# Use production WSGI server (gunicorn, uwsgi)
```

### Environment Variables
```bash
# Backend
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///kamioi.db

# Frontend
VITE_API_URL=http://localhost:5000/api
```

---

**Happy Coding! 🎉**

For issues or questions, check the logs and use the health check endpoints.

