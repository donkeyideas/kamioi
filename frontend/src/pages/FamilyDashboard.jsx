import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useDemo } from '../context/DemoContext'
import FamilySidebar from '../components/family/FamilySidebar'
import FamilyDashboardHeader from '../components/family/FamilyDashboardHeader'
import FamilyOverview from '../components/family/FamilyOverview'
import FamilyMembers from '../components/family/FamilyMembers'
import FamilyTransactions from '../components/family/FamilyTransactions'
import FamilyPortfolio from '../components/family/FamilyPortfolio'
import FamilyGoals from '../components/family/FamilyGoals'
import FamilyAIInsights from '../components/family/FamilyAIInsights'
import FamilyNotifications from '../components/family/FamilyNotifications'
import FamilySettings from '../components/family/FamilySettings'
import CommunicationHub from '../components/common/CommunicationHub'

const FamilyDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDarkMode, isLightMode, isCloudMode } = useTheme()
  const { isDemoMode, getDemoUser, disableDemoMode } = useDemo()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showCommunication, setShowCommunication] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

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
      console.log('FamilyDashboard - Real user detected, clearing demo mode')
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
        damping: 15
      }
    }
  }

  // Listen for custom events to set active tab (from notification bell)
  React.useEffect(() => {
    const handleSetActiveTab = (event) => {
      setActiveTab(event.detail)
    }

    window.addEventListener('setActiveTab', handleSetActiveTab)
    return () => window.removeEventListener('setActiveTab', handleSetActiveTab)
  }, [])

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          {(() => {
            switch (activeTab) {
              case 'dashboard':
                return <FamilyOverview user={effectiveUser} />
              case 'members':
                return <FamilyMembers user={effectiveUser} />
              case 'transactions':
                return <FamilyTransactions user={effectiveUser} />
              case 'portfolio':
                return <FamilyPortfolio user={effectiveUser} />
              case 'goals':
                return <FamilyGoals user={effectiveUser} />
              case 'ai':
                return <FamilyAIInsights user={effectiveUser} />
              case 'notifications':
                return <FamilyNotifications user={effectiveUser} />
              case 'settings':
                return <FamilySettings user={effectiveUser} />
              default:
                return <FamilyOverview user={effectiveUser} />
            }
          })()}
        </motion.div>
      </AnimatePresence>
    )
  }

  const getBackgroundClass = () => {
    if (isDarkMode) return 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
    if (isLightMode) return 'bg-gradient-to-br from-gray-100 via-blue-100 to-purple-100'
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
      <FamilySidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={effectiveUser}
        onLogout={effectiveLogout}
        onOpenCommunication={() => setShowCommunication(true)}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      <motion.div
        className="flex-1 flex flex-col overflow-hidden h-full"
        variants={itemVariants}
      >
        <motion.div variants={itemVariants} className="flex-shrink-0">
          <FamilyDashboardHeader user={effectiveUser} activeTab={activeTab} onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        </motion.div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6">
          <motion.div 
            className="max-w-7xl mx-auto"
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
          </motion.div>
        </main>
      </motion.div>

      {/* Cross-Dashboard Communication Hub */}
      <CommunicationHub 
        isOpen={showCommunication}
        onClose={() => setShowCommunication(false)}
      />

    </motion.div>
  )
}

export default FamilyDashboard
