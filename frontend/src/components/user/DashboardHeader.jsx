import React, { useState, useEffect } from 'react'
import { Sun, Moon, Link, Search, DollarSign, Upload, Cloud, Bell, Shield, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useData } from '../../context/DataContext'
import { useNotifications } from '../../hooks/useNotifications'
import { useModal } from '../../context/ModalContext'
import ProfileAvatar from '../common/ProfileAvatar'
import MXConnectWidget from '../common/MXConnectWidget'
import notificationService from '../../services/notificationService'
import { Link as RouterLink } from 'react-router-dom'

const DashboardHeader = () => {
  const { isBlackMode, toggleTheme, isLightMode, theme } = useTheme()
  const { unreadCount, addNotification } = useNotifications()
  const { user } = useAuth()
  const { addTransactions } = useData() // Now safe - useData returns default values if context not available
  const { showSuccessModal, showErrorModal, showInfoModal } = useModal()
  const [roundUpAmount, setRoundUpAmount] = useState(1)
  const [roundUpEnabled, setRoundUpEnabled] = useState(true)
  const [showInput, setShowInput] = useState(false)
  const [currentInputValue, setCurrentInputValue] = useState('')
  const [showMXConnect, setShowMXConnect] = useState(false)

  // Get unread notification count from useNotifications hook

  // Load round-up settings on mount and listen for updates
  useEffect(() => {
    const loadRoundUpSettings = () => {
      const saved = localStorage.getItem('kamioi_round_up_amount')
      const savedEnabled = localStorage.getItem('kamioi_round_up_enabled')
      if (saved) setRoundUpAmount(parseInt(saved))
      if (savedEnabled !== null) setRoundUpEnabled(savedEnabled === 'true')
      
      // Also try to fetch from API
      const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
      if (token) {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        fetch(`${apiBaseUrl}/api/user/settings/roundup`, {
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
            localStorage.setItem('kamioi_round_up_amount', (data.round_up_amount || 1).toString())
            localStorage.setItem('kamioi_round_up_enabled', (data.round_up_enabled !== false).toString())
          }
        })
        .catch(() => {}) // Silently fail, use localStorage
      }
    }
    
    loadRoundUpSettings()
    
    // Listen for settings updates
    const handleSettingsUpdate = (event) => {
      if (event.detail?.amount !== undefined) setRoundUpAmount(event.detail.amount)
      if (event.detail?.enabled !== undefined) setRoundUpEnabled(event.detail.enabled)
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

  const handleNotifications = () => {
    // Navigate to notifications in the user dashboard
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'notifications' }))
    }, 100)
  }

  const handleMXConnect = async () => {
    // Open MX Connect widget to add a new bank
    setShowMXConnect(true)
  }

  const handleAutoSync = async () => {
    // Auto Sync: Check if user has a bank connected, then sync transactions
    const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
    if (!token) {
      showErrorModal('Authentication Required', 'Please log in to sync your transactions.')
      return
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'

    try {
      // First, check if user has a bank connected
      const bankResponse = await fetch(`${apiBaseUrl}/api/user/bank-connections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const bankData = await bankResponse.json()

      // Check if user has any bank connections
      const hasBankConnected = bankData.success &&
        ((bankData.connections && bankData.connections.length > 0) ||
         (bankData.mx_data && Object.keys(bankData.mx_data).length > 0))

      if (!hasBankConnected) {
        // No bank connected - prompt to connect one
        showInfoModal(
          'No Bank Connected',
          'You need to connect a bank account first before syncing transactions. Would you like to connect one now?'
        )
        setShowMXConnect(true)
        return
      }

      // Bank is connected - sync transactions
      showSuccessModal(
        'Syncing Transactions',
        'Fetching latest transactions from your connected bank account...',
        'info'
      )

      const syncResponse = await fetch(`${apiBaseUrl}/api/user/transactions/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sync_type: 'auto',
          force_refresh: true
        })
      })

      const syncData = await syncResponse.json()

      if (syncData.success) {
        const txCount = syncData.transactions?.length || syncData.count || 0
        showSuccessModal(
          'Sync Complete!',
          `Successfully synced ${txCount} transaction${txCount !== 1 ? 's' : ''} from your bank account.`
        )
        addNotification({
          type: 'success',
          title: 'Transactions Synced',
          message: `Successfully synced ${txCount} transaction${txCount !== 1 ? 's' : ''}.`,
          timestamp: new Date()
        })
        // Refresh transactions in the data context
        if (addTransactions && syncData.transactions) {
          await addTransactions(syncData.transactions)
        }
      } else {
        showErrorModal(
          'Sync Failed',
          syncData.error || 'Unable to sync transactions. Please try again later.'
        )
      }
    } catch (error) {
      console.error('Auto sync error:', error)
      showErrorModal(
        'Sync Error',
        'An error occurred while syncing transactions. Please try again.'
      )
    }
  }

  const handleManualSync = async () => {
    // Direct transaction sync for user I7180480 (or current user)
    const userId = user?.id || user?.userId || 'I7180480'
    
    showSuccessModal(
      'Sync Transactions',
      `Syncing transactions for user ${userId}...\n\nYou can also add transactions directly via the console script provided in the test guide.`,
      'info'
    )
    
    try {
      // Try to trigger transaction sync via API
      const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token')
      }
      
      // Call sync endpoint if it exists, otherwise show manual option
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/user/transactions/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          sync_type: 'auto',
          force_refresh: true
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          addNotification({
            type: 'success',
            title: 'Transactions Synced',
            message: `Successfully synced ${data.transactions?.length || 0} transactions.`,
            timestamp: new Date()
          })
          // Refresh transactions
          if (addTransactions && data.transactions) {
            await addTransactions(data.transactions)
          }
        }
      } else if (response.status === 404) {
        // Endpoint doesn't exist - show manual option
        showInfoModal(
          'Manual Sync Required',
          'Auto sync endpoint not available. Please use the test script in browser console to add sample transactions.\n\nOpen console (F12) and run the test script from TEST_AUTO_SYNC_I7180480.js'
        )
      }
    } catch (error) {
      console.error('Sync error:', error)
      // Show info about manual sync option
      showInfoModal(
        'Sync Options',
        `For testing, you can add sample transactions using the browser console:\n\n1. Press F12 to open console\n2. Copy the test script from TEST_AUTO_SYNC_I7180480.js\n3. Run: window.testAutoSync.addTransactions()\n\nOr use the API directly to add transactions for user ${userId}.`
      )
    }
  }

  const handleMXConnectSuccess = (data) => {
    console.log('MX Connect Success:', data)
    setShowMXConnect(false)
    showSuccessModal(
      'Bank Connected!',
      'Your bank account has been successfully connected. Transactions will now sync automatically.'
    )
    addNotification({
      type: 'success',
      title: 'Bank Account Connected',
      message: 'Your bank account is now linked and syncing transactions.',
      timestamp: new Date()
    })
  }

  const handleMXConnectError = (error) => {
    console.error('MX Connect Error:', error)
    setShowMXConnect(false)
    showErrorModal(
      'Connection Failed',
      'Unable to connect your bank account. Please try again or contact support.'
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
    localStorage.setItem('kamioi_round_up_amount', finalValue.toString())
    
    // Save to backend
    const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
    if (token) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      fetch(`${apiBaseUrl}/api/user/settings/roundup`, {
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
      detail: { amount: finalValue, enabled: roundUpEnabled }
    }))
    
    setShowInput(false) // Hide input after blur
  }


  const handleFileUpload = () => {
    console.log('handleFileUpload called from DashboardHeader component')
    
    // Create a file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        console.log('File selected from toolbar:', file.name)
        
        // Process the CSV file
        const reader = new FileReader()
        reader.onload = (event) => {
          const csv = event.target.result
          const lines = csv.split('\n')
          const headers = lines[0].split(',')
          
          // Parse CSV data
          const transactions = []
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',')
              if (values.length >= headers.length) {
                const transaction = {}
                headers.forEach((header, index) => {
                  transaction[header.trim()] = values[index]?.trim() || ''
                })
                transactions.push(transaction)
              }
            }
          }
          
          console.log('Processed transactions from toolbar:', transactions.length)
          
          // Add transactions to the system
          const processedTransactions = addTransactions(transactions)
          
          // Show success message with transaction count
          showSuccessModal(
            'Transactions Uploaded Successfully',
            `Successfully uploaded ${processedTransactions.length} transactions from ${file.name}!\n\nKamioi Core Engine Processing:\n• Round-ups: $1.00 per transaction (user setting)\n• Platform fees: $0.25 per transaction (fixed)\n• Total debit: Purchase + Round-up + Fee\n• Investable amount: Entire round-up -> fractional shares\n• AI mapping: Merchants -> Stock tickers\n• Real-time pricing: Yahoo Finance integration\n\nYour portfolio has been updated with the new investments!`
          )
          addNotification({
            type: 'success',
            title: 'Transactions Processed',
            message: `${processedTransactions.length} transactions uploaded and processed successfully.`,
            timestamp: new Date()
          })
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const getHeaderClass = () => {
    if (isBlackMode) return 'bg-black/20 backdrop-blur-lg rounded-2xl p-4 mb-6 mx-6 mt-4 border border-gray-800'
    if (isLightMode) return 'bg-white/80 backdrop-blur-lg rounded-2xl p-4 mb-6 mx-6 mt-4 border border-gray-200'
    return 'bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 mx-6 mt-4 border border-white/20'
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

  const getInputClass = () => {
    if (isLightMode) return 'bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-blue-400'
    return 'bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400'
  }

  return (
    <header className={getHeaderClass()}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className={getSearchIconClass()} />
            <input
              type="text"
              placeholder="Search investments..."
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
                ${roundUpAmount}.00 Round Up
              </span>
            )}
          </div>

          {/* Upload Bank File removed for user dashboard */}
          
          {/* Bank Sync - Now Automatic */}
          <button
            onClick={handleAutoSync}
            className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-full flex items-center space-x-2 transition-colors cursor-pointer"
            title="Sync transactions from your bank account"
          >
            <Link className="w-4 h-4" />
            <span>Auto Sync</span>
          </button>

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
              <span>Admin</span>
            </RouterLink>
          )}
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <ProfileAvatar 
              user={user} 
              size="md" 
              showUploadOnHover={true}
              dashboardType="user"
              onImageUpdate={(imageUrl) => {
                console.log('Profile image updated:', imageUrl)
                // Could trigger a notification here
                if (imageUrl) {
                  notificationService.createSystemNotification('investment_complete', {
                    title: 'Profile Updated',
                    message: 'Your profile picture has been updated successfully.',
                    type: 'success',
                    icon: 'camera',
                    priority: 'normal',
                    dashboardType: 'user'
                  })
                }
              }}
            />
            <span className={getUserNameClass()}>{user?.name || 'User'}</span>
          </div>
        </div>
      </div>

      {/* MX Connect Widget */}
      <MXConnectWidget
        isOpen={showMXConnect}
        onClose={() => setShowMXConnect(false)}
        onSuccess={handleMXConnectSuccess}
        onError={handleMXConnectError}
        userType="user"
      />
    </header>
  )
}

export default DashboardHeader


