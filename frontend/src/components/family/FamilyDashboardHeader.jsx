import React, { useState, useEffect, useRef } from 'react'
import { Sun, Moon, Link, Search, DollarSign, Cloud, Bell, Upload, Shield, User, ChevronDown, Users, Building2, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useData } from '../../context/DataContext'
import { useDemo } from '../../context/DemoContext'
import { useNotifications } from '../../hooks/useNotifications'
import { useModal } from '../../context/ModalContext'
import ProfileAvatar from '../common/ProfileAvatar'
import MXConnectWidget from '../common/MXConnectWidget'
import notificationService from '../../services/notificationService'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

const FamilyDashboardHeader = ({ user, activeTab }) => {
  const { logoutUser } = useAuth()
  const { isBlackMode, isLightMode, toggleTheme } = useTheme()
  const { isDemoMode, demoAccountType, setDemoAccountType, disableDemoMode } = useDemo()
  const { unreadCount, addNotification } = useNotifications()
  const navigate = useNavigate()
  const [roundUpAmount, setRoundUpAmount] = useState(1)
  const [roundUpEnabled, setRoundUpEnabled] = useState(true)
  const [showInput, setShowInput] = useState(false)
  const [currentInputValue, setCurrentInputValue] = useState('')
  const [showMXConnect, setShowMXConnect] = useState(false)
  const [showDemoDropdown, setShowDemoDropdown] = useState(false)
  const demoDropdownRef = useRef(null)

  // Close demo dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (demoDropdownRef.current && !demoDropdownRef.current.contains(event.target)) {
        setShowDemoDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDemoSwitch = (type) => {
    setDemoAccountType(type)
    setShowDemoDropdown(false)
    if (type === 'individual') navigate('/demo/user')
    else if (type === 'family') navigate('/demo/family')
    else if (type === 'business') navigate('/demo/business')
  }

  const handleExitDemo = () => {
    disableDemoMode()
    setShowDemoDropdown(false)
    navigate('/login')
  }

  const getHeaderClass = () => {
    if (isBlackMode) return 'bg-black/20 backdrop-blur-lg rounded-2xl p-4 mb-6 mx-6 mt-4 border border-gray-800 relative z-50'
    if (isLightMode) return 'bg-white/80 backdrop-blur-lg rounded-2xl p-4 mb-6 mx-6 mt-4 border border-gray-200 relative z-50'
    return 'bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 mx-6 mt-4 border border-white/20 relative z-50'
  }

  const getTextClass = () => {
    if (isLightMode) return 'text-gray-800'
    return 'text-white'
  }

  const getSearchInputClass = () => {
    if (isLightMode) return 'bg-gray-100 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-400'
    return 'bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/60 focus:outline-none focus:border-purple-400'
  }

  const getSearchIconClass = () => {
    if (isLightMode) return 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4'
    return 'absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4'
  }

  const getIconClass = () => {
    if (isLightMode) return 'p-2 text-gray-600 hover:text-gray-800 transition-colors'
    return 'p-2 text-white/80 hover:text-white transition-colors'
  }

  const getUserNameClass = () => {
    if (isLightMode) return 'text-gray-800 font-medium'
    return 'text-white font-medium'
  }

  const getCurrentTheme = () => {
    if (isBlackMode) return 'Dark'
    if (isLightMode) return 'Light'
    return 'Cloud'
  }

  // Load round-up settings on mount and listen for updates
  useEffect(() => {
    const loadRoundUpSettings = () => {
      const saved = localStorage.getItem('kamioi_family_round_up_amount')
      const savedEnabled = localStorage.getItem('kamioi_family_round_up_enabled')
      if (saved) setRoundUpAmount(parseInt(saved))
      if (savedEnabled !== null) setRoundUpEnabled(savedEnabled === 'true')
      
      // Also try to fetch from API
      const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
      if (token) {
              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        fetch(`${apiBaseUrl}/api/family/settings/roundup`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.success) {
            setRoundUpAmount(data.round_up_amount || 1)
            setRoundUpEnabled(data.round_up_enabled !== false)
            localStorage.setItem('kamioi_family_round_up_amount', (data.round_up_amount || 1).toString())
            localStorage.setItem('kamioi_family_round_up_enabled', (data.round_up_enabled !== false).toString())
          }
        })
        .catch(() => {}) // Silently fail, use localStorage
      }
    }
    
    loadRoundUpSettings()
    
    // Listen for settings updates
    const handleSettingsUpdate = (event) => {
      if (event.detail?.dashboardType === 'family' || !event.detail?.dashboardType) {
        if (event.detail?.amount !== undefined) setRoundUpAmount(event.detail.amount)
        if (event.detail?.enabled !== undefined) setRoundUpEnabled(event.detail.enabled)
      }
    }
    
    window.addEventListener('roundUpSettingsUpdated', handleSettingsUpdate)
    
    return () => {
      window.removeEventListener('roundUpSettingsUpdated', handleSettingsUpdate)
    }
  }, [])
  
  // When input is shown, initialize currentInputValue
  useEffect(() => {
    if (showInput) {
      setCurrentInputValue(roundUpAmount.toString())
    }
  }, [showInput, roundUpAmount])

  const handleLogout = () => {
    logoutUser()
  }

  const handleMXConnect = () => {
    setShowMXConnect(true)
  }

  const { showSuccessModal, showErrorModal } = useModal()

  const handleFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        console.log('Family file upload:', file.name)
        // TODO: Implement family file upload processing
        showSuccessModal(
          'File Upload Started',
          'Family bank file upload processing has been initiated. This feature will be available soon.'
        )
      }
    }
    input.click()
  }

  const handleAutoSync = async () => {
    try {
      const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
      if (!token) {
        addNotification({
          type: 'error',
          title: 'Sync Failed',
          message: 'Please log in to sync transactions.',
          timestamp: new Date()
        })
        return
      }

      // Trigger sync by fetching transactions with sync=true
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/transactions?sync=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (response.ok) {
        const data = await response.json()
        const transactionCount = data.data?.transactions?.length || 0
        
        addNotification({
          type: 'success',
          title: 'Auto Sync Complete',
          message: `Successfully synced ${transactionCount} family transactions.`,
          timestamp: new Date()
        })
        
        // Trigger data refresh
        window.dispatchEvent(new CustomEvent('refreshFamilyData'))
      } else {
        throw new Error('Sync failed')
      }
    } catch (error) {
      console.error('Auto sync error:', error)
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Unable to sync bank transactions. Please try again later.',
        timestamp: new Date()
      })
    }
  }

  const handleMXConnectSuccess = (data) => {
    console.log('MX Connect Success:', data)
    setShowMXConnect(false)
    
    // Automatically trigger sync after bank connection
    handleAutoSync()
    
    showSuccessModal(
      'Family Bank Connected!',
      'Your family bank account has been successfully connected. All family members can now benefit from automatic transaction syncing.'
    )
    addNotification({
      type: 'success',
      title: 'Family Bank Account Connected',
      message: 'Your family bank account is now linked and syncing transactions for all members.',
      timestamp: new Date()
    })
  }

  const handleMXConnectError = (error) => {
    console.error('MX Connect Error:', error)
    setShowMXConnect(false)
    showErrorModal(
      'Connection Failed',
      'Unable to connect your family bank account. Please try again or contact support.'
    )
  }

  const handleInputChange = (value) => {
    // Only allow whole numbers (no decimal points)
    const numericValue = value.replace(/[^0-9]/g, '')
    setCurrentInputValue(numericValue)
  }

  const handleInputBlur = () => {
    const finalValue = parseInt(currentInputValue) || 1 // Default to 1 if input is empty
    setRoundUpAmount(finalValue)
    localStorage.setItem('kamioi_family_round_up_amount', finalValue.toString())
    
    // Save to backend
    const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
    if (token) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      fetch(`${apiBaseUrl}/api/family/settings/roundup`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          round_up_amount: finalValue,
          round_up_enabled: roundUpEnabled
        })
      }).catch(() => {}) // Silently fail
    }
    
    // Dispatch event for settings sync
    window.dispatchEvent(new CustomEvent('roundUpSettingsUpdated', {
      detail: { amount: finalValue, enabled: roundUpEnabled, dashboardType: 'family' }
    }))
    
    setShowInput(false) // Hide input after blur
  }

  const handleNotifications = () => {
    // Navigate to notifications in the family dashboard
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'notifications' }))
    }, 100)
  }

  return (
    <header className={getHeaderClass()}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className={getSearchIconClass()} />
            <input
              type="text"
              placeholder="Search family investments..."
              className={getSearchInputClass()}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Round Up Amount Card */}
          <div className={`px-4 py-2 rounded-full border flex items-center space-x-2 transition-colors ${
            isLightMode
              ? 'bg-white border-gray-300 text-gray-800'
              : 'bg-white/10 border-white/20 text-white'
          } ${!roundUpEnabled ? 'opacity-50' : ''}`}>
            <DollarSign className="w-4 h-4" />
            {showInput ? (
              <input
                type="text"
                value={currentInputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                placeholder="Enter amount"
                className={`bg-transparent border-none outline-none w-24 ${
                  isLightMode ? 'text-gray-800' : 'text-white'
                }`}
                autoFocus
              />
            ) : (
              <span
                onClick={() => setShowInput(true)}
                className="cursor-pointer"
                title={roundUpEnabled ? 'Click to edit round-up amount' : 'Round-ups are disabled'}
              >
                {roundUpAmount}.00 Round Up
              </span>
            )}
          </div>

          {/* Demo Mode Dropdown - Only visible in demo mode */}
          {isDemoMode && (
            <div className="relative" ref={demoDropdownRef}>
              <button
                onClick={() => setShowDemoDropdown(!showDemoDropdown)}
                className={`px-4 py-2 rounded-full border flex items-center space-x-2 transition-colors ${
                  isLightMode
                    ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                }`}
              >
                {demoAccountType === 'individual' && <User className="w-4 h-4" />}
                {demoAccountType === 'family' && <Users className="w-4 h-4" />}
                {demoAccountType === 'business' && <Building2 className="w-4 h-4" />}
                <span className="capitalize">{demoAccountType} Demo</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDemoDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDemoDropdown && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${
                  isLightMode
                    ? 'bg-white border-gray-200'
                    : 'bg-gray-900 border-white/20'
                }`}>
                  <div className="py-1">
                    <button
                      onClick={() => handleDemoSwitch('individual')}
                      className={`w-full px-4 py-2 text-left flex items-center space-x-2 ${
                        demoAccountType === 'individual'
                          ? isLightMode ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400'
                          : isLightMode ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>Individual</span>
                    </button>
                    <button
                      onClick={() => handleDemoSwitch('family')}
                      className={`w-full px-4 py-2 text-left flex items-center space-x-2 ${
                        demoAccountType === 'family'
                          ? isLightMode ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400'
                          : isLightMode ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Family</span>
                    </button>
                    <button
                      onClick={() => handleDemoSwitch('business')}
                      className={`w-full px-4 py-2 text-left flex items-center space-x-2 ${
                        demoAccountType === 'business'
                          ? isLightMode ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400'
                          : isLightMode ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Business</span>
                    </button>
                    <div className={`border-t my-1 ${isLightMode ? 'border-gray-200' : 'border-white/20'}`} />
                    <button
                      onClick={handleExitDemo}
                      className={`w-full px-4 py-2 text-left flex items-center space-x-2 ${
                        isLightMode ? 'hover:bg-red-100 text-red-600' : 'hover:bg-red-500/20 text-red-400'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Exit Demo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Bank File removed for family dashboard */}
          
          {/* Bank Sync - Auto Sync Button */}
          <button
            onClick={handleAutoSync}
            className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-full flex items-center space-x-2 transition-colors"
            title="Sync transactions from connected bank account"
          >
            <Link className="w-4 h-4" />
            <span>Auto Sync</span>
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className={getIconClass()}
            title={`Current: ${getCurrentTheme()} - Click to cycle through themes`}
          >
            {isBlackMode ? <Moon className="w-5 h-5" /> : 
             isLightMode ? <Sun className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <button 
            onClick={handleNotifications}
            className={`${getIconClass()} relative`}
            title={`View Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Back to Admin Button - Only show for admin users */}
          {user && (user.role === 'admin' || user.dashboard === 'admin') && (
            <RouterLink 
              to={`/admin/${user.id}/`}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              title="Return to Admin Dashboard"
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </RouterLink>
          )}
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <ProfileAvatar 
              user={user} 
              size="md" 
              showUploadOnHover={true}
              dashboardType="family"
              onImageUpdate={(imageUrl) => {
                console.log('Profile image updated:', imageUrl)
                // Could trigger a notification here
                if (imageUrl) {
                  notificationService.createSystemNotification('investment_complete', {
                    title: 'Profile Updated',
                    message: 'Your profile picture has been updated successfully.',
                    type: 'success',
                    icon: '📸',
                    priority: 'normal',
                    dashboardType: 'family'
                  })
                }
              }}
            />
            <span className={getUserNameClass()}>{user?.name || 'Family'}</span>
          </div>
        </div>
      </div>

      {/* MX Connect Widget */}
      <MXConnectWidget
        isOpen={showMXConnect}
        onClose={() => setShowMXConnect(false)}
        onSuccess={handleMXConnectSuccess}
        onError={handleMXConnectError}
        userType="family"
      />
    </header>
  )
}

export default FamilyDashboardHeader


