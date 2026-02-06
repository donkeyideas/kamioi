import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Sun, Moon, Link, Search, DollarSign, Cloud, Upload, Bell, FileText, Camera, X, Shield, User, Loader2, ChevronDown, Users, Building2, LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useData } from '../../context/DataContext'
import { useDemo } from '../../context/DemoContext'
import { useNotifications } from '../../hooks/useNotifications'
import { useModal } from '../../context/ModalContext'
import ProfileAvatar from '../common/ProfileAvatar'
import MXConnectWidget from '../common/MXConnectWidget'
import ReceiptUpload from '../user/ReceiptUpload'
import notificationService from '../../services/notificationService'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

const BusinessDashboardHeader = ({ user, activeTab, onReceiptProcessed, onToggleMobileSidebar }) => {
  const { logoutUser } = useAuth()
  const { isBlackMode, toggleTheme, isLightMode, theme } = useTheme()
  const { isDemoMode, demoAccountType, setDemoAccountType, disableDemoMode } = useDemo()
  const { unreadCount, addNotification } = useNotifications()
  const navigate = useNavigate()
  const [roundUpAmount, setRoundUpAmount] = useState(1)
  const [roundUpEnabled, setRoundUpEnabled] = useState(true)
  const [showInput, setShowInput] = useState(false)
  const [currentInputValue, setCurrentInputValue] = useState('')
  const [showMXConnect, setShowMXConnect] = useState(false)
  const [showUploadChoice, setShowUploadChoice] = useState(false)
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
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

  const getSubtextClass = () => {
    if (isLightMode) return 'text-gray-600'
    return 'text-white/60'
  }

  const getUserNameClass = () => {
    if (isLightMode) return 'text-gray-800 font-medium'
    return 'text-white font-medium'
  }

  // Load round-up settings on mount and listen for updates
  useEffect(() => {
    const loadRoundUpSettings = () => {
      const saved = localStorage.getItem('kamioi_business_round_up_amount')
      const savedEnabled = localStorage.getItem('kamioi_business_round_up_enabled')
      if (saved) setRoundUpAmount(parseInt(saved))
      if (savedEnabled !== null) setRoundUpEnabled(savedEnabled === 'true')
      
      // Also try to fetch from API
      const token = localStorage.getItem('kamioi_business_token') || 
                   localStorage.getItem('kamioi_user_token') || 
                   localStorage.getItem('kamioi_token') ||
                   localStorage.getItem('authToken')
      if (token) {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        fetch(`${apiBaseUrl}/api/business/settings/roundup`, {
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
            localStorage.setItem('kamioi_business_round_up_amount', (data.round_up_amount || 1).toString())
            localStorage.setItem('kamioi_business_round_up_enabled', (data.round_up_enabled !== false).toString())
          }
        })
        .catch(() => {}) // Silently fail, use localStorage
      }
    }
    
    loadRoundUpSettings()
    
    // Listen for settings updates
    const handleSettingsUpdate = (event) => {
      if (event.detail?.dashboardType === 'business' || !event.detail?.dashboardType) {
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

  const { showSuccessModal, showErrorModal } = useModal()

  const handleLogout = () => {
    logoutUser()
  }

  const handleMXConnect = () => {
    setShowMXConnect(true)
  }

  const handleFileUpload = () => {
    // Show choice modal instead of directly opening file picker
    setShowUploadChoice(true)
  }

  const handleBankFileUpload = async () => {
    setShowUploadChoice(false)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        console.log('Business bank file upload:', file.name)
        
        try {
          // Set loading state
          setIsUploading(true)
          setUploadProgress('Preparing file...')
          console.log('[BusinessDashboardHeader] File selected:', file.name, 'Size:', file.size, 'bytes')
          
          // Get auth token - check business token first, then user token
          // IMPORTANT: Exclude admin tokens - only use business/user tokens
          let token = localStorage.getItem('kamioi_business_token') || 
                       localStorage.getItem('kamioi_user_token') || 
                       localStorage.getItem('kamioi_token') ||
                       localStorage.getItem('authToken')
          
          // If token starts with 'admin_token_', it's an admin token - don't use it
          if (token && token.startsWith('admin_token_')) {
            console.warn('[BusinessDashboardHeader] Admin token detected, searching for business/user token...')
            // Try to find a non-admin token
            const allKeys = Object.keys(localStorage)
            token = null
            for (const key of allKeys) {
              if (key.includes('token') && !key.includes('admin')) {
                const candidate = localStorage.getItem(key)
                if (candidate && !candidate.startsWith('admin_token_') && candidate.startsWith('token_')) {
                  token = candidate
                  console.log('[BusinessDashboardHeader] Found business/user token in:', key)
                  break
                }
              }
            }
          }
          
          console.log('[BusinessDashboardHeader] Token found:', token ? 'Yes (length: ' + token.length + ', starts with: ' + token.substring(0, 10) + '...)' : 'No')
          
          if (!token || token === 'null' || token === 'undefined' || token.startsWith('admin_token_')) {
            setIsUploading(false)
            console.error('[BusinessDashboardHeader] No valid business/user token found')
            showErrorModal(
              'Authentication Error',
              'Please log in as a business user to upload files. Admin tokens cannot be used for business transactions.'
            )
            return
          }
          
          // Create FormData for file upload
          setUploadProgress('Creating upload request...')
          const formData = new FormData()
          formData.append('file', file)
          console.log('[BusinessDashboardHeader] FormData created, file appended')
          
          // Get API base URL
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
          console.log('[BusinessDashboardHeader] API Base URL:', apiBaseUrl)
          
          // Upload file to backend with timeout
          setUploadProgress('Uploading file to server...')
          console.log('[BusinessDashboardHeader] Starting file upload to:', `${apiBaseUrl}/api/business/upload-bank-file`)
          
          // Create AbortController for timeout (5 minutes for large files)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => {
            console.log('[BusinessDashboardHeader] Upload timeout reached (5 minutes), aborting...')
            controller.abort()
          }, 300000) // 5 minute timeout
          
          console.log('[BusinessDashboardHeader] Sending fetch request...')
          console.log('[BusinessDashboardHeader] Request details:', {
            url: `${apiBaseUrl}/api/business/upload-bank-file`,
            method: 'POST',
            fileSize: file.size,
            hasToken: !!token,
            tokenLength: token.length
          })
          
          let response
          try {
            // Add a progress tracker
            const startTime = Date.now()
            console.log('[BusinessDashboardHeader] Fetch started at:', new Date().toISOString())
            console.log('[BusinessDashboardHeader] About to send fetch request to:', `${apiBaseUrl}/api/business/upload-bank-file`)
            
            // Add a heartbeat to track if we're still waiting
            const heartbeatInterval = setInterval(() => {
              const elapsed = Date.now() - startTime
              console.log(`[BusinessDashboardHeader] Still waiting for response... (${elapsed}ms elapsed)`)
            }, 2000) // Log every 2 seconds
            
            try {
              response = await fetch(`${apiBaseUrl}/api/business/upload-bank-file`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
                },
                body: formData,
                signal: controller.signal
              })
              
              clearInterval(heartbeatInterval)
              const elapsedTime = Date.now() - startTime
              clearTimeout(timeoutId)
              console.log('[BusinessDashboardHeader] Fetch request completed in', elapsedTime, 'ms, status:', response.status)
            } catch (fetchErr) {
              clearInterval(heartbeatInterval)
              throw fetchErr
            }
          } catch (fetchError) {
            clearTimeout(timeoutId)
            console.error('[BusinessDashboardHeader] Fetch error details:', {
              name: fetchError.name,
              message: fetchError.message,
              type: fetchError.constructor.name
            })
            
            if (fetchError.name === 'AbortError') {
              throw new Error('Upload timed out after 5 minutes. The file may be too large or the server is taking too long to respond. Please check if the backend server is running.')
            } else if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
              throw new Error(`Network error: Could not connect to server at ${apiBaseUrl}. Please ensure the backend server is running.`)
            }
            throw fetchError
          }
          
          console.log('[BusinessDashboardHeader] Upload response status:', response.status)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('[BusinessDashboardHeader] Upload failed:', response.status, errorText)
            throw new Error(`Upload failed: ${response.status} - ${errorText}`)
          }
          
          setUploadProgress('Processing transactions...')
          const result = await response.json()
          console.log('[BusinessDashboardHeader] Upload result:', result)
          
          setIsUploading(false)
          
          if (result.success) {
            const processed = result.data?.processed || 0
            const errors = result.data?.error_count || 0
            const totalRows = result.data?.total_rows || 0
            
            showSuccessModal(
              'Upload Successful',
              `Successfully processed ${processed} transactions from ${totalRows} rows.${errors > 0 ? ` ${errors} errors occurred.` : ''}`
            )
            
            // Refresh transactions by dispatching events that BusinessTransactions will listen to
            // Wait a moment for the database to commit, then refresh
            setTimeout(() => {
              console.log('[BusinessDashboardHeader] Dispatching refresh events after bank upload...')
              // Dispatch event that BusinessTransactions component listens for
              window.dispatchEvent(new CustomEvent('refreshTransactions'))
              
              // Also trigger a data refresh event
              window.dispatchEvent(new CustomEvent('dataRefresh', { detail: { source: 'bankUpload' } }))
            }, 1500) // Wait 1.5 seconds for database commit
            
            // Add notification
            addNotification({
              type: 'success',
              title: 'Bank File Uploaded',
              message: `Processed ${processed} transactions from ${file.name}`,
              timestamp: new Date()
            })
          } else {
            showErrorModal(
              'Upload Failed',
              result.error || 'Failed to process bank file. Please check the file format and try again.'
            )
          }
        } catch (error) {
          setIsUploading(false)
          console.error('[BusinessDashboardHeader] Error uploading bank file:', error)
          
          let errorMessage = 'Unknown error occurred'
          if (error.name === 'AbortError') {
            errorMessage = 'Upload timed out. The file may be too large or the server is taking too long to respond. Please try again.'
          } else if (error.message) {
            errorMessage = error.message
          } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error: Could not connect to server. Please check your connection and try again.'
          }
          
          showErrorModal(
            'Upload Error',
            `Failed to upload file: ${errorMessage}. Please try again.`
          )
        }
      }
    }
    input.click()
  }

  const handleReceiptUpload = () => {
    setShowUploadChoice(false)
    setShowReceiptUpload(true)
  }

  const handleMXConnectSuccess = (data) => {
    console.log('MX Connect Success:', data)
    setShowMXConnect(false)
    showSuccessModal(
      'Business Bank Connected!',
      'Your business bank account has been successfully connected. You can now track business transactions and manage finances automatically.'
    )
    addNotification({
      type: 'success',
      title: 'Business Bank Account Connected',
      message: 'Your business bank account is now linked and syncing transactions.',
      timestamp: new Date()
    })
  }

  const handleMXConnectError = (error) => {
    console.error('MX Connect Error:', error)
    setShowMXConnect(false)
    showErrorModal(
      'Connection Failed',
      'Unable to connect your business bank account. Please try again or contact support.'
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
    localStorage.setItem('kamioi_business_round_up_amount', finalValue.toString())
    
    // Save to backend
    const token = localStorage.getItem('kamioi_business_token') || 
                 localStorage.getItem('kamioi_user_token') || 
                 localStorage.getItem('kamioi_token') ||
                 localStorage.getItem('authToken')
    if (token) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      fetch(`${apiBaseUrl}/api/business/settings/roundup`, {
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
      detail: { amount: finalValue, enabled: roundUpEnabled, dashboardType: 'business' }
    }))
    
    setShowInput(false) // Hide input after blur
  }

  const getInvestmentInputClass = () => {
    if (isLightMode) return 'bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-blue-400'
    return 'bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400'
  }

  const handleNotifications = () => {
    // Navigate to notifications in the business dashboard
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'notifications' }))
    }, 100)
  }

  return (
    <header className={getHeaderClass()}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={onToggleMobileSidebar}
          >
            <Menu className={`w-6 h-6 ${getTextClass()}`} />
          </button>
          <div className="relative hidden sm:block">
            <Search className={getSearchIconClass()} />
            <input
              type="text"
              placeholder="Search business investments..."
              className={getSearchInputClass()}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Round Up Amount Card - hidden on mobile */}
          <div className={`px-4 py-2 rounded-full border hidden md:flex items-center space-x-2 transition-colors ${
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
                <span className="hidden md:inline capitalize">{demoAccountType} Demo</span>
                <ChevronDown className={`hidden md:block w-4 h-4 transition-transform ${showDemoDropdown ? 'rotate-180' : ''}`} />
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

          {/* Action Buttons */}
          <button 
            onClick={handleFileUpload}
            className="bg-purple-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-purple-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden md:inline">Upload Bank File</span>
          </button>
          
          {/* Bank Sync - Now Automatic */}
          <div className="bg-green-600/20 text-green-400 px-4 py-2 rounded-full flex items-center space-x-2">
            <Link className="w-4 h-4" />
            <span className="hidden md:inline">Auto Sync</span>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className={getIconClass()}
            title={`Current: ${theme} - Click to cycle through themes`}
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
              <span className="hidden md:inline">Admin</span>
            </RouterLink>
          )}
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <ProfileAvatar 
              user={user} 
              size="md" 
              showUploadOnHover={true}
              dashboardType="business"
              onImageUpdate={async (imageUrl) => {
                console.log('Profile image updated:', imageUrl)
                // Create notification in both localStorage and backend
                if (imageUrl) {
                  // Add to localStorage for immediate UI feedback
                  notificationService.addNotification({
                    title: 'Profile Updated',
                    message: 'Your profile picture has been updated successfully.',
                    type: 'success',
                    dashboardType: 'business'
                  })
                  
                  // Also save to backend database
                  try {
                    const token = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_user_token') || localStorage.getItem('kamioi_token')
                    if (token) {
                      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                      await fetch(`${apiBaseUrl}/api/business/notifications`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          title: 'Profile Updated',
                          message: 'Your profile picture has been updated successfully.',
                          type: 'success'
                        })
                      })
                    }
                  } catch (error) {
                    console.error('Failed to save notification to backend:', error)
                  }
                }
              }}
            />
            <span className={`hidden md:inline ${getUserNameClass()}`}>{user?.name || 'Business'}</span>
          </div>
        </div>
      </div>

      {/* Upload Choice Modal - Rendered via Portal */}
      {showUploadChoice && createPortal(
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 99999,
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUploadChoice(false)
            }
          }}
        >
          <div 
            className={`${isLightMode ? 'bg-white' : 'bg-gray-900'} rounded-2xl p-6 max-w-md w-full mx-4 border ${isLightMode ? 'border-gray-200' : 'border-white/20'} shadow-2xl`} 
            style={{ zIndex: 100000 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${getTextClass()}`}>Choose Upload Type</h3>
              <button
                onClick={() => setShowUploadChoice(false)}
                className={`${getIconClass()} rounded-lg`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className={`${getSubtextClass()} mb-6`}>
              What would you like to upload?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleBankFileUpload}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border-2 border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 transition-all text-left"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold">Bank Statement File</h4>
                  <p className="text-gray-400 text-sm">Upload CSV or Excel bank statement</p>
                </div>
              </button>
              
              <button
                onClick={handleReceiptUpload}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border-2 border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 transition-all text-left"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold">Receipt or Invoice</h4>
                  <p className="text-gray-400 text-sm">AI-powered receipt processing with automatic investment allocation</p>
                </div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Receipt Upload Modal */}
      {showReceiptUpload && createPortal(
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 99999,
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowReceiptUpload(false)
            }
          }}
        >
          <div 
            className={`${isLightMode ? 'bg-white' : 'bg-gray-900'} rounded-2xl p-6 max-w-2xl w-full mx-4 border ${isLightMode ? 'border-gray-200' : 'border-white/20'} shadow-2xl max-h-[90vh] overflow-y-auto`} 
            style={{ zIndex: 100000 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${getTextClass()}`}>Upload Receipt or Invoice</h3>
              <button
                onClick={() => setShowReceiptUpload(false)}
                className={`${getIconClass()} rounded-lg`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ReceiptUpload 
              onTransactionProcessed={async (transaction) => {
                console.log('[BusinessDashboardHeader] ⚡ Receipt transaction processed:', transaction)
                console.log('[BusinessDashboardHeader] Transaction success:', transaction?.success, 'transactionId:', transaction?.transactionId)
                setShowReceiptUpload(false)
                
                showSuccessModal(
                  'Receipt Processed',
                  'Your receipt has been processed and investments have been allocated successfully!'
                )
                
                // Trigger refresh after a short delay to allow database commit
                if (transaction?.success || transaction?.transactionId) {
                  console.log('[BusinessDashboardHeader] ✅ Transaction successful, scheduling refresh...')
                  // Wait a moment for transaction and LLM mapping to be committed
                  setTimeout(() => {
                    console.log('[BusinessDashboardHeader] 🔄 Triggering refresh (3 seconds after transaction)...')
                    // Dispatch custom event for components to listen to
                    console.log('[BusinessDashboardHeader] 📡 Dispatching receipt-mapping-created event...')
                    try {
                      const event = new CustomEvent('receipt-mapping-created', { 
                        detail: { transactionId: transaction?.transactionId },
                        bubbles: true,
                        cancelable: true
                      })
                      const dispatched = window.dispatchEvent(event)
                      console.log('[BusinessDashboardHeader] ✅ Event dispatched:', dispatched, '- Components should refresh now')
                    } catch (e) {
                      console.error('[BusinessDashboardHeader] ❌ Error dispatching event:', e)
                    }
                    
                    // Call receipt processed callback to refresh AI Insights
                    if (onReceiptProcessed) {
                      console.log('[BusinessDashboardHeader] 📞 Calling onReceiptProcessed callback...')
                      try {
                        onReceiptProcessed()
                      } catch (e) {
                        console.error('[BusinessDashboardHeader] ❌ Error calling onReceiptProcessed:', e)
                      }
                    } else {
                      console.warn('[BusinessDashboardHeader] ⚠️ onReceiptProcessed callback not provided')
                    }
                    
                    // NO PAGE RELOAD - rely on event-based refresh
                    // The event listeners will handle the refresh automatically
                    console.log('[BusinessDashboardHeader] ✅ Refresh triggered - components will update automatically')
                  }, 3000) // Wait 3 seconds for database commit
                } else {
                  console.warn('[BusinessDashboardHeader] ❌ Transaction not successful, skipping refresh')
                }
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* MX Connect Widget */}
      {showMXConnect && (
      <MXConnectWidget
        isOpen={showMXConnect}
        onClose={() => {
          console.log('✅ BusinessDashboardHeader: Closing MX Connect modal');
          setShowMXConnect(false);
        }}
        onSuccess={handleMXConnectSuccess}
        onError={handleMXConnectError}
        userType="business"
      />
      )}

      {/* Upload Loading Modal */}
      {isUploading && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`relative w-full max-w-md mx-4 ${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-2xl shadow-2xl border ${isLightMode ? 'border-gray-200' : 'border-gray-700'} p-8`}>
            {/* Close button */}
            <button
              onClick={() => setIsUploading(false)}
              className={`absolute top-4 right-4 ${isLightMode ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'} transition-colors`}
            >
              <X size={20} />
            </button>

            {/* Animated Spinner */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <Loader2 
                  className={`w-16 h-16 ${isLightMode ? 'text-blue-600' : 'text-blue-400'} animate-spin`}
                  strokeWidth={2}
                />
                {/* Pulsing ring effect */}
                <div className={`absolute inset-0 rounded-full ${isLightMode ? 'bg-blue-100' : 'bg-blue-900/30'} animate-ping opacity-75`}></div>
              </div>

              {/* Title */}
              <h3 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                Uploading File
              </h3>

              {/* Progress Message */}
              <p className={`text-center ${isLightMode ? 'text-gray-600' : 'text-gray-300'} text-lg`}>
                {uploadProgress || 'Processing...'}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${isLightMode ? 'bg-blue-600' : 'bg-blue-500'} rounded-full transition-all duration-300 animate-pulse`}
                  style={{ width: '60%' }}
                ></div>
              </div>

              {/* Info Text */}
              <p className={`text-sm text-center ${isLightMode ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
                Please wait while we process your file...
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  )
}

export default BusinessDashboardHeader


