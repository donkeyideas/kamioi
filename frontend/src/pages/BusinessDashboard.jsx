import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useDemo } from '../context/DemoContext'
import BusinessDashboardHeader from '../components/business/BusinessDashboardHeader'
import BusinessSidebar from '../components/business/BusinessSidebar'
import BusinessOverview from '../components/business/BusinessOverview'
import BusinessTeam from '../components/business/BusinessTeam'
import BusinessGoals from '../components/business/BusinessGoals'
import BusinessTransactions from '../components/business/BusinessTransactions'
import BusinessAnalytics from '../components/business/BusinessAnalytics'
import BusinessReports from '../components/business/BusinessReports'
import BusinessSettings from '../components/business/BusinessSettings'
import BusinessNotifications from '../components/business/BusinessNotifications'
import BusinessAIInsights from '../components/business/BusinessAIInsights'
import CommunicationHub from '../components/common/CommunicationHub'

const BusinessDashboard = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { isBlackMode, isLightMode, isCloudMode } = useTheme()
  const { isDemoMode, getDemoUser, disableDemoMode } = useDemo()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showCommunication, setShowCommunication] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const aiInsightsRefreshRef = useRef(null)

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.classList.add('mobile-sidebar-open')
    } else {
      document.body.classList.remove('mobile-sidebar-open')
    }
    return () => document.body.classList.remove('mobile-sidebar-open')
  }, [isMobileSidebarOpen])

  // CRITICAL FIX: Clear demo mode when real authenticated user accesses this dashboard
  // This prevents demo data from bleeding into real user accounts
  React.useEffect(() => {
    if (user && user.id && isDemoMode) {
      console.log('BusinessDashboard - Real user detected, clearing demo mode')
      localStorage.setItem('kamioi_demo_mode', 'false')
      localStorage.removeItem('kamioi_demo_account_type')
      disableDemoMode()
    }
  }, [user, isDemoMode, disableDemoMode])

  // Use demo user when in demo mode, otherwise use auth user
  const effectiveUser = isDemoMode ? getDemoUser() : user
  const effectiveLogout = isDemoMode ? () => navigate('/login') : logout

  // macOS-style animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    in: { opacity: 1, y: 0, scale: 1 },
    out: { opacity: 0, y: -20, scale: 0.95 }
  }

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3
  }

  const containerVariants = {
    initial: { opacity: 0 },
    in: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    in: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <BusinessOverview user={effectiveUser} onNavigate={setActiveTab} />
      case 'transactions':
        return <BusinessTransactions user={effectiveUser} />
      case 'team':
        return <BusinessTeam user={effectiveUser} />
      case 'goals':
        return <BusinessGoals user={effectiveUser} />
      case 'ai':
        return <BusinessAIInsights user={effectiveUser} onRefresh={(refreshFn) => { aiInsightsRefreshRef.current = refreshFn }} />
      case 'analytics':
        return <BusinessAnalytics user={effectiveUser} />
      case 'reports':
        return <BusinessReports user={effectiveUser} />
      case 'settings':
        return <BusinessSettings user={effectiveUser} />
      case 'notifications':
        return <BusinessNotifications user={effectiveUser} />
      default:
        return <BusinessOverview user={effectiveUser} />
    }
  }

  const getBackgroundClass = () => {
    if (isBlackMode) return 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
    if (isLightMode) return 'bg-gray-50'
    if (isCloudMode) return 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'
    return 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' // fallback
  }

  return (
    <motion.div 
      className={`flex h-screen ${getBackgroundClass()} overflow-hidden`}
      variants={containerVariants}
      initial="initial"
      animate="in"
    >
      <BusinessSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={effectiveUser}
        onLogout={effectiveLogout}
        onOpenCommunication={() => setShowCommunication(true)}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      <motion.main
        className="flex-1 flex flex-col overflow-hidden admin-main border-0 outline-none h-full"
        variants={itemVariants}
        initial="initial"
        animate="in"
      >
        <BusinessDashboardHeader
          user={effectiveUser}
          activeTab={activeTab}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onReceiptProcessed={() => {
            // Refresh AI Insights receipt mappings when a new receipt is processed
            if (aiInsightsRefreshRef.current) {
              console.log('🔄 [BusinessDashboard] Triggering AI Insights refresh after receipt processing')
              aiInsightsRefreshRef.current()
            }
          }}
        />
        
        <motion.div 
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6 admin-content border-0 outline-none"
          variants={itemVariants}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
              className="border-0 outline-none"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.main>

      {/* Cross-Dashboard Communication Hub */}
      <CommunicationHub 
        isOpen={showCommunication}
        onClose={() => setShowCommunication(false)}
      />

    </motion.div>
  )
}

export default BusinessDashboard
