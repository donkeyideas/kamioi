import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useDemo } from '../context/DemoContext'
import { motion, AnimatePresence } from 'framer-motion'

// Import all admin components
import AdminOverview from '../components/admin/AdminOverview'
import FinancialAnalytics from '../components/admin/FinancialAnalytics'
import AdminTransactions from '../components/admin/AdminTransactions'
import LLMCenter from '../components/admin/LLMCenter'
import LLMDataManagement from '../components/admin/LLMDataManagement'
import MLDashboard from '../components/admin/MLDashboard'
import EnhancedUserManagement from '../components/admin/EnhancedUserManagement'
import NotificationsCenter from '../components/admin/NotificationsCenter'
import BadgesGamification from '../components/admin/BadgesGamification'
import AdvertisementModule from '../components/admin/AdvertisementModule'
import ContentManagement from '../components/admin/ContentManagement'
import SystemSettings from '../components/admin/SystemSettings'
import Subscriptions from '../components/admin/Subscriptions'
import FamilyManagement from '../components/admin/FamilyManagement'
import BusinessManagement from '../components/admin/BusinessManagement'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminHeader from '../components/admin/AdminHeader'
import EmployeeManagement from '../components/admin/EmployeeManagement'
import ConsolidatedUserManagement from '../components/admin/ConsolidatedUserManagement'
import InvestmentSummary from '../components/admin/InvestmentSummary'
import InvestmentProcessingDashboard from '../components/admin/InvestmentProcessingDashboard'
import StandardOperatingProcedures from '../components/admin/StandardOperatingProcedures'
import LoadingReport from '../components/admin/LoadingReport'
import APITrackingDashboard from '../components/admin/APITrackingDashboard'
import AdminDatabaseManagement from './AdminDatabaseManagement'
import ErrorTracking from '../components/admin/ErrorTracking'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { isDarkMode, isLightMode, isCloudMode } = useTheme()
  const { isDemoMode, getDemoUser } = useDemo()
  const [activeTab, setActiveTab] = useState('overview')
  const [allTransactions, setAllTransactions] = useState([])
  const pageLoadStartTimeRef = useRef(null)
  const activeTabRef = useRef(activeTab) // Track current activeTab for event handler

  // Use demo user when in demo mode, otherwise use auth user
  const effectiveUser = isDemoMode ? getDemoUser() : user
  
  // Debug logging for transaction updates
  const handleTransactionsUpdate = (transactions) => {
    console.log('🔍 AdminDashboard - Received transactions update:', transactions.length)
    console.log('🔍 AdminDashboard - Sample transaction:', transactions[0])
    setAllTransactions(transactions)
  }

  // Handle admin logout
  const handleLogout = async () => {
    if (isDemoMode) {
      // In demo mode, just navigate to login
      navigate('/login')
    } else {
      await logout()
      navigate('/admin-login')
    }
  }

  // Handle setActiveTab events from other components
  useEffect(() => {
    const handleSetActiveTab = (event) => {
      setActiveTab(event.detail)
    }

    window.addEventListener('setActiveTab', handleSetActiveTab)
    return () => {
      window.removeEventListener('setActiveTab', handleSetActiveTab)
    }
  }, [])

  // Refresh transactions data (called after trade execution)
  const refreshTransactions = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')

      const response = await fetch(`${apiBaseUrl}/api/admin/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.transactions) {
          console.log('🔄 AdminDashboard - Refreshed transactions:', data.transactions.length)
          setAllTransactions(data.transactions)
        }
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error)
    }
  }

  // Load transactions on mount so they're available for all child pages
  useEffect(() => {
    console.log('🔄 AdminDashboard - Initial load, fetching transactions...')
    refreshTransactions()
  }, [])

  // Listen for refresh-admin-data event
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 AdminDashboard - Received refresh event')
      refreshTransactions()
    }

    window.addEventListener('refresh-admin-data', handleRefresh)
    return () => {
      window.removeEventListener('refresh-admin-data', handleRefresh)
    }
  }, [])

  // Update activeTab ref when it changes
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  // Set up permanent listener for page load completion events (outside of activeTab dependency)
  useEffect(() => {
    const handlePageLoadComplete = (event) => {
      const eventPageId = event.detail.pageId
      const currentActiveTab = activeTabRef.current // Get current activeTab from ref
      
      // Get start time for this page from global storage
      const pageStartTimes = window._adminPageStartTimes || {}
      const startTime = pageStartTimes[eventPageId] || pageLoadStartTimeRef.current
      
      console.log('📊 AdminDashboard - Received admin-page-load-complete:', { 
        eventPageId, 
        currentActiveTab, 
        hasStartTime: !!startTime,
        pageStartTimes: Object.keys(pageStartTimes)
      })
      
      let loadTime = 0
      
      if (startTime) {
        // Calculate load time from start
        loadTime = performance.now() - startTime
        // Clean up stored start time
        if (pageStartTimes[eventPageId]) {
          delete pageStartTimes[eventPageId]
          window._adminPageStartTimes = pageStartTimes
        }
        // Clear current ref if it matches
        if (eventPageId === currentActiveTab) {
          pageLoadStartTimeRef.current = null
        }
      } else {
        // No start time - use fallback or provided time
        loadTime = event.detail.loadTime || 100
        console.log('📊 AdminDashboard - Using fallback time:', { pageId: eventPageId, loadTime })
      }
      
      // ALWAYS dispatch the event with the pageId from the event (not currentActiveTab)
      console.log('📊 AdminDashboard - Dispatching admin-page-loaded:', { pageId: eventPageId, loadTime })
      const reportEvent = new CustomEvent('admin-page-loaded', {
        detail: {
          pageId: eventPageId, // Use eventPageId, not currentActiveTab
          loadTime: loadTime
        }
      })
      window.dispatchEvent(reportEvent)
    }

    window.addEventListener('admin-page-load-complete', handlePageLoadComplete)

    return () => {
      window.removeEventListener('admin-page-load-complete', handlePageLoadComplete)
    }
  }, []) // Empty dependency - permanent listener

  // Track page load times - reset start time when tab changes
  useEffect(() => {
    // Record start time when tab changes
    const startTime = performance.now()
    pageLoadStartTimeRef.current = startTime
    
    // Also store start time per pageId (in case user navigates away before page loads)
    // This will be cleaned up in handlePageLoadComplete
    const pageStartTimes = window._adminPageStartTimes || {}
    pageStartTimes[activeTab] = startTime
    window._adminPageStartTimes = pageStartTimes
    
    console.log('📊 AdminDashboard - Tab changed to:', activeTab, '- Start time recorded')

    // Fallback: if no completion event after 5 seconds, record anyway
    const fallbackTimeout = setTimeout(() => {
      if (pageLoadStartTimeRef.current) {
        const loadTime = performance.now() - pageLoadStartTimeRef.current
        
        console.log('📊 AdminDashboard - Fallback timeout triggered:', { pageId: activeTab, loadTime })
        
        const reportEvent = new CustomEvent('admin-page-loaded', {
          detail: {
            pageId: activeTab,
            loadTime: loadTime
          }
        })
        window.dispatchEvent(reportEvent)
        
        pageLoadStartTimeRef.current = null
      }
    }, 5000)

    return () => {
      clearTimeout(fallbackTimeout)
    }
  }, [activeTab])

  const getBackgroundClass = () => {
    if (isDarkMode) return 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black'
    if (isLightMode) return 'min-h-screen bg-[#fffdeb]'
    if (isCloudMode) return 'min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'
    return 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black'
  }

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
        damping: 15
      }
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />
      case 'financial':
        return <FinancialAnalytics />
      case 'transactions':
        return <AdminTransactions onTransactionsUpdate={handleTransactionsUpdate} />
      case 'investments':
        console.log('🔍 AdminDashboard - Passing transactions to InvestmentSummary:', allTransactions.length)
        return <InvestmentSummary user={effectiveUser} transactions={allTransactions} />
      case 'investment-processing':
        return <InvestmentProcessingDashboard user={effectiveUser} transactions={allTransactions} onRefresh={refreshTransactions} />
      case 'llm':
        return <LLMCenter />
      case 'llm-data':
        return <LLMDataManagement />
      case 'ml-dashboard':
        return <MLDashboard user={effectiveUser} />
      case 'users2':
        return <EnhancedUserManagement user={effectiveUser} />
      case 'employees':
        return <EmployeeManagement />
      case 'consolidated-users':
        return <ConsolidatedUserManagement />
      case 'families':
        return <FamilyManagement />
      case 'businesses':
        return <BusinessManagement />
      case 'notifications':
        return <NotificationsCenter />
      case 'badges':
        return <BadgesGamification />
      case 'advertisement':
        return <AdvertisementModule />
      case 'content':
        return <ContentManagement user={effectiveUser} />
      case 'subscriptions':
        return <Subscriptions />
      case 'settings':
        return <SystemSettings />
      case 'sop':
        return <StandardOperatingProcedures />
      case 'loading-report':
        return <LoadingReport />
      case 'api-tracking':
        return <APITrackingDashboard />
      case 'database':
        return <AdminDatabaseManagement />
      case 'error-tracking':
        return <ErrorTracking />
      default:
        return <AdminOverview />
    }
  }

  return (
    <motion.div 
      className={`flex h-screen ${getBackgroundClass()} border-0 outline-none admin-dashboard overflow-hidden`}
      variants={containerVariants}
      initial="initial"
      animate="in"
    >
      {/* Sidebar - Fixed height, no scroll */}
      <motion.div variants={itemVariants} className="flex-shrink-0">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={effectiveUser}
          onLogout={handleLogout}
        />
      </motion.div>

      {/* Main Content - Scrollable */}
      <motion.div 
        className="flex-1 flex flex-col overflow-hidden border-0 outline-none admin-main h-full"
        variants={itemVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex-shrink-0">
          <AdminHeader activeTab={activeTab} />
        </motion.div>

        {/* Content Area - Only this scrolls */}
        <motion.main 
          className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-transparent border-0 outline-none admin-content"
          variants={containerVariants}
          initial="initial"
          animate="in"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </motion.div>
    </motion.div>
  )
}

export default AdminDashboard
