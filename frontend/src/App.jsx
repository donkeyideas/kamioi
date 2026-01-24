import TransactionsTest from './pages/TransactionsTest';
import { User } from 'lucide-react'
import React, { Suspense, lazy } from 'react'
import './styles/tutorial.css'

// API Interceptor to redirect localhost API calls to domain-based URLs
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  const urlString = url.toString();
  // Check for both old port 4000 and new port 5111
  if ((urlString.includes('localhost:4000') || urlString.includes('localhost:5111')) && window.location.hostname !== 'localhost') {
    let newUrl;
    if (window.location.hostname === 'admin.kamioi.com') {
      newUrl = urlString.replace('http://localhost:4000', 'http://admin.kamioi.com').replace('http://localhost:5111', 'http://admin.kamioi.com');
    } else if (window.location.hostname === 'app.kamioi.com') {
      newUrl = urlString.replace('http://localhost:4000', 'http://app.kamioi.com').replace('http://localhost:5111', 'http://app.kamioi.com');
    } else {
      newUrl = urlString;
    }
    return originalFetch(newUrl, options);
  }
  return originalFetch(url, options);
};

import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { DataProvider } from './context/DataContext'
import { ModalProvider } from './context/ModalContext'
import { TutorialProvider } from './context/TutorialContext'
import { DemoProvider } from './context/DemoContext'
import DemoModeToggle from './components/common/DemoModeToggle'
import GoogleAnalyticsTracker from './components/common/GoogleAnalyticsTracker'
import NotificationManager from './components/common/NotificationManager'
import AdminRoute from './components/AdminRoute'

// 🚀 PERFORMANCE FIX: React Query client for caching and request deduplication
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000, // 5 minutes - data is fresh for 5 minutes
      cacheTime: 600000, // 10 minutes - keep in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
      retry: 1, // Retry failed requests once
    },
  },
})

// Lazy load components for better performance
// const HomePage = lazy(() => import('./pages/HomePage')) // File doesn't exist
// const HomePageNew = lazy(() => import('./pages/HomePageNew')) // File doesn't exist
const HomePageV5 = lazy(() => import('./pages/HomePageV5'))
const BusinessRegistration = lazy(() => import('./components/business/BusinessRegistration'))
const BusinessDashboardPage = lazy(() => import('./pages/BusinessDashboard'))
const UserDashboard = lazy(() => import('./pages/UserDashboard'))
const FamilyDashboard = lazy(() => import('./pages/FamilyDashboard'))
const AdminDashboard = lazy(() => import('./components/admin/LazyAdminDashboard'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const BlogListing = lazy(() => import('./pages/BlogListing'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Features = lazy(() => import('./pages/Features'))
const HowItWorks = lazy(() => import('./pages/HowItWorks'))
const Learn = lazy(() => import('./pages/Learn'))
const Pricing = lazy(() => import('./pages/Pricing'))
const SubscriptionSuccess = lazy(() => import('./pages/SubscriptionSuccess'))
const SubscriptionCancel = lazy(() => import('./pages/SubscriptionCancel'))

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen gradient-bg flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <div className="text-white text-xl">Loading Kamioi...</div>
    </div>
  </div>
)

// Protected Route Component - Simplified and more robust
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isInitialized, user, loading } = useAuth()
  
  console.log('?? ProtectedRoute - User:', user?.id, 'Initialized:', isInitialized, 'Loading:', loading, 'RequiredRole:', requiredRole)
  
  // Wait for auth initialization
  if (!isInitialized || loading) {
    console.log('?? ProtectedRoute - Waiting for auth initialization')
    return <LoadingSpinner />
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    console.log('?? ProtectedRoute - No user, redirecting to login')
    return <Navigate to="/login" replace />
  }
  
  // Handle role-based access
  if (requiredRole) {
    const userRole = user?.role || user?.dashboard
    console.log('?? ProtectedRoute - Role check:', { requiredRole, userRole, user: user?.id })
    if (requiredRole === 'business' && userRole !== 'business') {
      console.log('?? ProtectedRoute - Business role mismatch, redirecting to:', getUserDashboardPath(user))
      return <Navigate to={getUserDashboardPath(user)} replace />
    }
    if (requiredRole === 'admin' && userRole !== 'admin') {
      console.log('?? ProtectedRoute - Admin role mismatch, redirecting to:', getUserDashboardPath(user))
      return <Navigate to={getUserDashboardPath(user)} replace />
    }
    if (requiredRole === 'family' && userRole !== 'family') {
      console.log('?? ProtectedRoute - Family role mismatch, redirecting to:', getUserDashboardPath(user))
      return <Navigate to={getUserDashboardPath(user)} replace />
    }
  }
  
  return children
}

// User ID Validation Component - Allow admins to access any user's dashboard
const UserIdValidator = ({ children, allowAdmin = false }) => {
  const { userId } = useParams()
  const { user } = useAuth()
  
  console.log('?? UserIdValidator - User ID:', user?.id, 'Type:', typeof user?.id)
  console.log('?? UserIdValidator - URL UserId:', userId, 'Type:', typeof userId)
  console.log('?? UserIdValidator - AllowAdmin:', allowAdmin)
  console.log('?? UserIdValidator - User Role:', user?.role, 'Dashboard:', user?.dashboard)
  
  // Admins can access any user's dashboard if allowAdmin is true
  if (allowAdmin && user && (user.role === 'admin' || user.dashboard === 'admin')) {
    console.log('?? UserIdValidator - Admin access granted')
    return children
  }
  
  // If user ID in URL doesn't match current user's id or account_number, redirect to their own dashboard
  const routeIdMatches = user && userId && (
    user.id?.toString() === userId || (user.account_number && user.account_number.toString() === userId)
  )
  if (user && userId && !routeIdMatches) {
    console.log('?? UserIdValidator - User ID mismatch!')
    console.log('?? UserIdValidator - User ID:', user.id, 'Type:', typeof user.id)
    console.log('?? UserIdValidator - URL ID:', userId, 'Type:', typeof userId)
    console.log('?? UserIdValidator - Comparison:', user.id.toString(), '!==', userId)
    console.log('?? UserIdValidator - Redirecting to:', getUserDashboardPath(user))
    return <Navigate to={getUserDashboardPath(user)} replace />
  }
  
  console.log('?? UserIdValidator - Access granted')
  return children
}

// Helper function to get the correct dashboard path based on user role/dashboard
const getUserDashboardPath = (user) => {
  console.log('?? getUserDashboardPath - User:', user)
  console.log('?? getUserDashboardPath - User ID:', user?.id, 'Type:', typeof user?.id)
  console.log('?? getUserDashboardPath - User Role:', user?.role)
  console.log('?? getUserDashboardPath - User Dashboard:', user?.dashboard)
  
  if (!user || !user.id) {
    console.log('?? getUserDashboardPath - No valid user or user ID, redirecting to login')
    return '/login'
  }
  
  // Use dashboard field if available, otherwise fall back to role
  const dashboard = user.dashboard || user.role
  const userId = user.account_number || user.id
  
  console.log('?? getUserDashboardPath - Dashboard:', dashboard, 'UserID:', userId)
  
  switch (dashboard) {
    case 'admin':
    case 'superadmin': {
      const adminPath = `/admin/${userId}/`
      console.log('?? getUserDashboardPath - Admin path:', adminPath)
      return adminPath
    }
    case 'business': {
      const businessPath = `/business/${userId}/`
      console.log('?? getUserDashboardPath - Business path:', businessPath)
      return businessPath
    }
    case 'family': {
      const familyPath = `/family/${userId}/`
      console.log('?? getUserDashboardPath - Family path:', familyPath)
      return familyPath
    }
    case 'individual':
    case 'user': {
      const userPath = `/dashboard/${userId}/`
      console.log('?? getUserDashboardPath - User path:', userPath)
      return userPath
    }
    default:
      console.log('?? getUserDashboardPath - Unknown dashboard type:', dashboard, 'redirecting to login')
      return '/login'
  }
}

// Helper to check if user can access a specific dashboard
const canAccessDashboard = (user, dashboardType) => {
  if (!user) return false
  
  // Admins can access all dashboards
  if (user.role === 'admin' || user.dashboard === 'admin') {
    return true
  }
  
  // Regular users can only access their own dashboard type
  const userDashboard = user.dashboard || user.role
  return userDashboard === dashboardType
}

// App Routes Component - Simplified routing logic
const AppRoutes = () => {
  const auth = useAuth()
  const { isBlackMode, isLightMode, isCloudMode } = useTheme()
  
  // Safety check: if auth context is not available, show loading
  if (!auth) {
    return <LoadingSpinner />
  }
  
  const { isInitialized } = auth
  
  // Wait for auth initialization before rendering routes
  if (!isInitialized) {
    return <LoadingSpinner />
  }
  
  return (
    <div className={`min-h-screen gradient-bg ${isBlackMode ? 'black-mode' : isLightMode ? 'light-mode' : ''}`}>
      <GoogleAnalyticsTracker />
      <NotificationManager />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePageV5 />} />
        {/* Legacy routes - redirecting to HomePageV5 since old files don't exist */}
        <Route path="/home-old" element={<HomePageV5 />} />
        <Route path="/home-new" element={<HomePageV5 />} />
        <Route path="/v5" element={<HomePageV5 />} />
        <Route path="/home-v5" element={<HomePageV5 />} />
        <Route path="/business-registration" element={<BusinessRegistration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/blog" element={<BlogListing />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/features" element={<Features />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/subscription/success" element={<SubscriptionSuccess />} />
        <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
        
        {/* Protected dashboard routes - Admins can access all dashboards */}
        <Route 
          path="/dashboard/:userId/*" 
          element={
            <ProtectedRoute>
              <UserIdValidator allowAdmin={true}>
                <UserDashboard />
              </UserIdValidator>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/:userId/" 
          element={
            <ProtectedRoute>
              <UserIdValidator allowAdmin={true}>
                <UserDashboard />
              </UserIdValidator>
            </ProtectedRoute>
          } 
        />
        
        {/* Legacy route redirects for backward compatibility */}
        <Route path="/dashboard/" element={<Navigate to="/login" replace />} />
        <Route path="/family/" element={<Navigate to="/login" replace />} />
        <Route path="/business/" element={<Navigate to="/login" replace />} />
        <Route path="/admin/" element={<Navigate to="/login" replace />} />
        <Route 
          path="/family/:userId/*" 
          element={
            <ProtectedRoute>
              <UserIdValidator allowAdmin={true}>
                <FamilyDashboard />
              </UserIdValidator>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/family/:userId/" 
          element={
            <ProtectedRoute>
              <UserIdValidator allowAdmin={true}>
                <FamilyDashboard />
              </UserIdValidator>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/business/:userId/*" 
          element={
            <ProtectedRoute requiredRole="business">
              <UserIdValidator allowAdmin={true}>
                <BusinessDashboardPage />
              </UserIdValidator>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/business/:userId/" 
          element={
            <ProtectedRoute requiredRole="business">
              <UserIdValidator allowAdmin={true}>
                <BusinessDashboardPage />
              </UserIdValidator>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/:userId/*" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/:userId/" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        
        {/* Catch-all route to prevent unknown dashboard access */}
        <Route path="/dashboard/unknown/*" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard/unknown" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/tx-test" element={<TransactionsTest />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <DemoProvider>
              <DataProvider>
                <ModalProvider>
                  <TutorialProvider>
                    <Router
                      future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true
                      }}
                    >
                      <Suspense fallback={<LoadingSpinner />}>
                        <DemoModeToggle />
                        <AppRoutes />
                      </Suspense>
                    </Router>
                  </TutorialProvider>
                </ModalProvider>
              </DataProvider>
            </DemoProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

export default App
