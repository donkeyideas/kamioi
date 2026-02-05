import React, { useState, useEffect } from 'react'
import { Moon, Sun, Link, Settings, Users, Bell, FileText, Shield, Cloud, Eye, EyeOff, Calendar, Download, MapPin, CreditCard, Trash2, Plus, Search, DollarSign, Play, Square, X, CheckCircle, AlertTriangle, Filter, Upload, Phone, User, Info } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useModal } from '../../context/ModalContext'
import { useNotifications } from '../../hooks/useNotifications'
import ProfileAvatar from '../common/ProfileAvatar'
import notificationService from '../../services/notificationService'
import MXConnectWidget from '../common/MXConnectWidget'

// Demo data for demo mode
const DEMO_BANK_CONNECTIONS = [
  {
    id: 'demo-bank-1',
    institution_name: 'Chase',
    bank_name: 'Chase',
    account_name: 'Chase Family Checking',
    account_type: 'checking',
    last_four: '4523',
    status: 'active',
    connected_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'demo-bank-2',
    institution_name: 'Bank of America',
    bank_name: 'Bank of America',
    account_name: 'Family Savings',
    account_type: 'savings',
    last_four: '7891',
    status: 'active',
    connected_at: '2024-02-20T14:15:00Z'
  }
]

const DEMO_SUBSCRIPTION_PLANS = [
  {
    id: 'plan-basic',
    name: 'Basic Family',
    price: 4.99,
    interval: 'month',
    features: ['Up to 4 family members', 'Basic analytics', 'Email support']
  },
  {
    id: 'plan-premium',
    name: 'Premium Family',
    price: 9.99,
    interval: 'month',
    features: ['Unlimited family members', 'Advanced analytics', 'Priority support', 'Tax reports']
  },
  {
    id: 'plan-elite',
    name: 'Elite Family',
    price: 19.99,
    interval: 'month',
    features: ['All Premium features', 'Dedicated advisor', 'Custom goals', 'Family financial planning']
  }
]

const DEMO_CURRENT_SUBSCRIPTION = {
  id: 'sub-demo-1',
  plan_id: 'plan-premium',
  plan_name: 'Premium Family',
  status: 'active',
  current_period_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  price: 9.99
}

const DEMO_STATEMENTS = [
  {
    id: 1,
    type: 'monthly',
    period: 'January 2024',
    date: '2024-01-31',
    amount: 28934,
    status: 'available',
    format: 'PDF',
    size: '245 KB',
    transactions: 87,
    roundUps: 342,
    investments: 4523
  },
  {
    id: 2,
    type: 'monthly',
    period: 'December 2023',
    date: '2023-12-31',
    amount: 26780,
    status: 'available',
    format: 'PDF',
    size: '238 KB',
    transactions: 92,
    roundUps: 315,
    investments: 4180
  },
  {
    id: 3,
    type: 'annual',
    period: 'Tax Year 2023',
    date: '2024-01-15',
    amount: 156789,
    status: 'available',
    format: 'PDF',
    size: '1.2 MB',
    transactions: 1024,
    roundUps: 3842,
    investments: 52340
  }
]

const FamilySettings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile')
  const { toggleTheme, theme } = useTheme()
  const { refreshUser } = useAuth()
  const { showSuccessModal, showErrorModal, showConfirmationModal } = useModal()
  const { addNotification } = useNotifications()

  // Check if in demo mode
  const isDemoMode = localStorage.getItem('kamioi_demo_mode') === 'true'

  // Helper function to get the correct auth token (demo token takes precedence)
  const getAuthToken = () => {
    return localStorage.getItem('kamioi_demo_token') ||
           localStorage.getItem('kamioi_user_token') ||
           localStorage.getItem('authToken')
  }
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: true
  })
  const [showPassword, setShowPassword] = useState(false)
  const [statements, setStatements] = useState([])
  const [filteredStatements, setFilteredStatements] = useState([])
  const [statementFilter, setStatementFilter] = useState('all')
  const [statementSearch, setStatementSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [isGeneratingStatement, setIsGeneratingStatement] = useState(false)
  const [profileData, setProfileData] = useState({
    familyName: '',
    guardianEmail: user?.email || '',
    phone: '',
    familyCode: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    },
    familySize: 0,
    last4SSN: '',
    pepStatus: false,
    roundUpPreference: 1,
    investmentGoal: '',
    riskPreference: '',
    notificationPrefs: {
      email: true,
      sms: false,
      push: true
    },
    gamification: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankConnections, setBankConnections] = useState([])
  const [showRoundUpModal, setShowRoundUpModal] = useState(false)
  const [roundUpAmount, setRoundUpAmount] = useState(1)
  const [roundUpEnabled, setRoundUpEnabled] = useState(true)
  const [savingRoundUp, setSavingRoundUp] = useState(false)
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [loadingSubscription, setLoadingSubscription] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [validatedPromo, setValidatedPromo] = useState(null)
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')
  const [cancelling, setCancelling] = useState(false)

  // Fetch family settings on component mount
  useEffect(() => {
    fetchFamilySettings()
    fetchPlans()
    fetchCurrentSubscription()
    fetchBankConnections()
  }, [])

  const fetchBankConnections = async () => {
    try {
      // In demo mode, use demo data
      if (isDemoMode) {
        console.log('FamilySettings - Demo mode detected, loading demo bank connections')
        setBankConnections(DEMO_BANK_CONNECTIONS)
        return
      }

      const token = getAuthToken()
      if (!token) return

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/bank-connections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.connections) {
          setBankConnections(Array.isArray(result.connections) ? result.connections : [])
        }
      }
    } catch (error) {
      console.error('Error fetching bank connections:', error)
      // Fallback to demo data on error if in demo mode
      if (isDemoMode) {
        setBankConnections(DEMO_BANK_CONNECTIONS)
      }
    }
  }

  const handleDisconnectBank = async (connectionId) => {
    try {
      const token = getAuthToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/bank-connections/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          showSuccessModal('Success', 'Bank account disconnected successfully!')
          addNotification({
            type: 'success',
            title: 'Disconnected',
            message: 'Bank account has been disconnected.',
            timestamp: new Date().toISOString()
          })
          await fetchBankConnections()
        } else {
          throw new Error(result.message || 'Failed to disconnect bank account')
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to disconnect bank account' }))
        throw new Error(errorData.message || 'Failed to disconnect bank account')
      }
    } catch (error) {
      console.error('Error disconnecting bank:', error)
      showErrorModal('Error', error.message || 'Failed to disconnect bank account. Please try again.')
    }
  }

  const handleDisconnectClick = (connectionId, accountName) => {
    if (!connectionId) {
      showErrorModal('Error', 'Invalid connection ID. Please try again.')
      return
    }
    showConfirmationModal(
      'Disconnect Bank Account',
      `Are you sure you want to disconnect ${accountName}? This will stop automatic transaction syncing.`,
      async () => {
        await handleDisconnectBank(connectionId)
      },
      'warning',
      'Disconnect'
    )
  }

  const handleMXConnectSuccess = async (data) => {
    try {
      const token = getAuthToken()
      const account = data.accounts && data.accounts.length > 0 ? data.accounts[0] : {}
      const connectionData = {
        institution_name: 'Chase', // From demo mode
        bank_name: 'Chase',
        account_name: account.account_name || 'Chase Checking',
        account_type: account.account_type || 'checking',
        account_id: account.account_id || 'demo_001',
        member_guid: data.member_guid || '',
        user_guid: data.user_guid || ''
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const saveResponse = await fetch(`${apiBaseUrl}/api/family/bank-connections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(connectionData)
      })

      if (saveResponse.ok) {
        setShowBankModal(false)
        await new Promise(resolve => setTimeout(resolve, 500))
        await fetchBankConnections()
        showSuccessModal('Success', 'Bank account connected successfully!')
      } else {
        throw new Error('Failed to save bank connection')
      }
    } catch (error) {
      console.error('Error saving bank connection:', error)
      showErrorModal('Error', 'Failed to save bank connection. Please try again.')
      setShowBankModal(false)
    }
  }

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true)

      // In demo mode, use demo data
      if (isDemoMode) {
        console.log('FamilySettings - Demo mode detected, loading demo subscription plans')
        setPlans(DEMO_SUBSCRIPTION_PLANS)
        setLoadingPlans(false)
        return
      }

      const token = getAuthToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/subscriptions/plans`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (response.ok) {
        const json = await response.json()
        setPlans(Array.isArray(json.data) ? json.data : [])
      }
    } catch (e) {
      console.error('Failed to load plans:', e)
      // Fallback to demo data on error if in demo mode
      if (isDemoMode) {
        setPlans(DEMO_SUBSCRIPTION_PLANS)
      } else {
        setPlans([])
      }
    } finally {
      setLoadingPlans(false)
    }
  }

  const fetchCurrentSubscription = async () => {
    try {
      setLoadingSubscription(true)

      // In demo mode, use demo data
      if (isDemoMode) {
        console.log('FamilySettings - Demo mode detected, loading demo subscription')
        setCurrentSubscription(DEMO_CURRENT_SUBSCRIPTION)
        setLoadingSubscription(false)
        return
      }

      const token = getAuthToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/subscriptions/current`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (response.ok) {
        const json = await response.json()
        setCurrentSubscription(json.subscription || null)
      }
    } catch (e) {
      console.error('Failed to fetch current subscription:', e)
      // Fallback to demo data on error if in demo mode
      if (isDemoMode) {
        setCurrentSubscription(DEMO_CURRENT_SUBSCRIPTION)
      }
    } finally {
      setLoadingSubscription(false)
    }
  }

  const validatePromoCode = async (code, planId) => {
    if (!code || !code.trim()) {
      setPromoError('Please enter a promo code')
      setValidatedPromo(null)
      return false
    }

    try {
      setValidatingPromo(true)
      setPromoError('')
      const token = getAuthToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/subscriptions/validate-promo`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          promo_code: code.toUpperCase().trim(),
          plan_id: planId
        })
      })
      const result = await response.json()
      if (response.ok && result.success) {
        setValidatedPromo(result.promo_code)
        setPromoError('')
        return true
      } else {
        setPromoError(result.error || 'Invalid promo code')
        setValidatedPromo(null)
        return false
      }
    } catch (error) {
      console.error('Error validating promo code:', error)
      setPromoError('Failed to validate promo code')
      setValidatedPromo(null)
      return false
    } finally {
      setValidatingPromo(false)
    }
  }

  const cancelSubscription = async () => {
    if (!currentSubscription) return
    
    try {
      setCancelling(true)
      const token = getAuthToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/subscriptions/cancel`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const result = await response.json()
      
      if (response.ok && result.success) {
        await fetchCurrentSubscription()
        // Show success notification modal
        setNotificationMessage(result.message || 'Subscription will cancel at the end of your billing period')
        setNotificationType('success')
        setShowNotification(true)
        // Auto-close after 5 seconds (longer for important message)
        setTimeout(() => {
          setShowNotification(false)
        }, 5000)
      } else {
        setNotificationMessage(result.error || 'Failed to cancel subscription')
        setNotificationType('error')
        setShowNotification(true)
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      setNotificationMessage('Failed to cancel subscription. Please try again.')
      setNotificationType('error')
      setShowNotification(true)
    } finally {
      setCancelling(false)
    }
  }

  const subscribeToPlan = async (plan) => {
    try {
      setSubscribing(true)
      const token = getAuthToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/subscriptions/subscribe`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_cycle: 'monthly',
          promo_code: validatedPromo ? promoCode.toUpperCase().trim() : null
        })
      })
      const result = await response.json()
        if (response.ok && result.success) {
          const hadPromo = validatedPromo !== null
          await fetchCurrentSubscription()
          setPromoCode('')
          setValidatedPromo(null)
          // Show success notification modal
          setNotificationMessage('Successfully subscribed to ' + plan.name + (hadPromo ? ' with promo code!' : '!'))
          setNotificationType('success')
          setShowNotification(true)
          // Auto-close after 3 seconds
          setTimeout(() => {
            setShowNotification(false)
          }, 3000)
      } else {
        setNotificationMessage(result.error || 'Failed to subscribe to plan')
        setNotificationType('error')
        setShowNotification(true)
      }
    } catch (error) {
      console.error('Error subscribing to plan:', error)
      setNotificationMessage('Failed to subscribe to plan. Please try again.')
      setNotificationType('error')
      setShowNotification(true)
    } finally {
      setSubscribing(false)
    }
  }

  const fetchFamilySettings = async () => {
    try {
      setLoading(true)

      // In demo mode, use demo profile data
      if (isDemoMode) {
        console.log('FamilySettings - Demo mode detected, loading demo profile')
        const demoProfile = {
          familyName: 'The Doe Family',
          guardianEmail: user?.email || 'john.doe@email.com',
          phone: '(555) 123-4567',
          familyCode: 'DOE-FAMILY-2024',
          address: {
            street: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
            country: 'US'
          },
          familySize: 4,
          last4SSN: '1234',
          pepStatus: false,
          roundUpPreference: 1,
          investmentGoal: 'Build family wealth and save for education',
          riskPreference: 'moderate',
          notificationPrefs: {
            email: true,
            sms: false,
            push: true
          },
          gamification: true
        }
        setProfileData(demoProfile)
        setRoundUpAmount(1)
        setRoundUpEnabled(true)
        setLoading(false)
        return
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/settings`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const data = result.settings || result.data || {}
          setProfileData({
            familyName: data.family_name || '',
            guardianEmail: data.guardian_email || user?.email || '',
            phone: data.phone || '',
            familyCode: data.family_code || '',
            address: data.address || {
              street: '',
              city: '',
              state: '',
              zip: '',
              country: 'US'
            },
            familySize: data.family_size || 0,
            last4SSN: '',
            pepStatus: false,
            roundUpPreference: data.round_up_preference || 1,
          })

          // Also set round-up settings state
          setRoundUpAmount(data.round_up_preference || 1)
          const savedEnabled = localStorage.getItem('kamioi_family_round_up_enabled')
          setRoundUpEnabled(savedEnabled !== 'false') // Default to true

          // Update additional profile data
          setProfileData(prev => ({
            ...prev,
            investmentGoal: data.investment_goal || '',
            riskPreference: data.risk_preference || '',
            notificationPrefs: data.notification_preferences || {
              email: true,
              sms: false,
              push: true
            },
            gamification: true
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching family settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveRoundUpSettings = async () => {
    try {
      setSavingRoundUp(true)
      const token = getAuthToken()
      
      // Save to backend
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/settings/roundup`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          round_up_amount: roundUpAmount,
          round_up_enabled: roundUpEnabled
        })
      })
      
      // Save to localStorage for immediate UI update
      localStorage.setItem('kamioi_family_round_up_amount', roundUpAmount.toString())
      localStorage.setItem('kamioi_family_round_up_enabled', roundUpEnabled.toString())
      
      // Dispatch event to update header
      window.dispatchEvent(new CustomEvent('roundUpSettingsUpdated', {
        detail: { amount: roundUpAmount, enabled: roundUpEnabled, dashboardType: 'family' }
      }))
      
      if (response.ok) {
        await notificationService.addNotification({
          type: 'success',
          title: 'Settings Saved',
          message: 'Round-up settings updated successfully',
          timestamp: new Date().toISOString()
        })
        setShowRoundUpModal(false)
      } else {
        // Still save locally even if backend fails
        await notificationService.addNotification({
          type: 'success',
          title: 'Settings Saved Locally',
          message: 'Round-up settings saved (will sync when connection is restored)',
          timestamp: new Date().toISOString()
        })
        setShowRoundUpModal(false)
      }
    } catch (error) {
      console.error('Error saving round-up settings:', error)
      // Save locally even if backend fails
      localStorage.setItem('kamioi_family_round_up_amount', roundUpAmount.toString())
      localStorage.setItem('kamioi_family_round_up_enabled', roundUpEnabled.toString())
      window.dispatchEvent(new CustomEvent('roundUpSettingsUpdated', {
        detail: { amount: roundUpAmount, enabled: roundUpEnabled, dashboardType: 'family' }
      }))
      await notificationService.addNotification({
        type: 'info',
        title: 'Settings Saved Locally',
        message: 'Round-up settings saved locally',
        timestamp: new Date().toISOString()
      })
      setShowRoundUpModal(false)
    } finally {
      setSavingRoundUp(false)
    }
  }

  const handleSaveProfile = async (event) => {
    let originalText = 'Save Profile'
    try {
      // Validate profile data
      if (!profileData.familyName.trim()) {
        await notificationService.addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter a family name',
          timestamp: new Date().toISOString()
        })
        return
      }
      
      // Show loading state
      if (event && event.target) {
        const submitButton = event.target
        originalText = submitButton.textContent
        submitButton.textContent = 'Saving...'
        submitButton.disabled = true
      }
      
      // Call backend to save family profile
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          family_name: profileData.familyName,
          guardian_email: profileData.guardianEmail,
          phone: profileData.phone,
          family_code: profileData.familyCode,
          address: profileData.address,
          family_size: profileData.familySize,
          roundUpPreference: profileData.roundUpPreference,
          investment_goal: profileData.investmentGoal,
          risk_preference: profileData.riskPreference,
          notification_preferences: profileData.notificationPrefs
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await notificationService.addNotification({
          type: 'success',
          title: 'Profile Saved',
          message: 'Family profile saved successfully!',
          timestamp: new Date().toISOString()
        })
          
          // Refresh user data from API to update throughout the app
          if (refreshUser) {
            try {
              await refreshUser()
              console.log('✅ User data refreshed after family profile update')
            } catch (error) {
              console.error('Failed to refresh user data:', error)
            }
          }
        } else {
          throw new Error(result.error || 'Failed to save profile')
        }
      } else {
        throw new Error('Network error')
      }
      
    } catch (error) {
      console.error('Save profile failed:', error)
      await notificationService.addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save family profile. Please try again.',
        timestamp: new Date().toISOString()
      })
    } finally {
      // Reset button state
      if (event && event.target) {
        event.target.textContent = originalText
        event.target.disabled = false
      }
    }
  }

  const handleChangePassword = async () => {
    await notificationService.addNotification({
      type: 'info',
      title: 'Password Change',
      message: 'Family password change functionality would be implemented here',
      timestamp: new Date().toISOString()
    })
  }

  const handleToggle2FA = async () => {
    await notificationService.addNotification({
      type: 'info',
      title: '2FA Setup',
      message: 'Family 2FA toggle functionality would be implemented here',
      timestamp: new Date().toISOString()
    })
  }

  const handleDeleteAccount = async () => {
    // Use internal modal instead of window.confirm
    const confirmed = await new Promise((resolve) => {
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
      modal.innerHTML = `
        <div class="bg-gray-800 border border-white/20 rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold text-white mb-4">Delete Family Account</h3>
          <p class="text-gray-300 mb-6">Are you sure you want to delete your family account? This action cannot be undone.</p>
          <div class="flex space-x-3">
            <button id="confirm-delete" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Delete Account
            </button>
            <button id="cancel-delete" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
          </div>
        </div>
      `
      document.body.appendChild(modal)
      
      modal.querySelector('#confirm-delete').onclick = () => {
        document.body.removeChild(modal)
        resolve(true)
      }
      modal.querySelector('#cancel-delete').onclick = () => {
        document.body.removeChild(modal)
        resolve(false)
      }
    })
    
    if (confirmed) {
      await notificationService.addNotification({
        type: 'info',
        title: 'Account Deletion',
        message: 'Family account deletion functionality would be implemented here',
        timestamp: new Date().toISOString()
      })
    }
  }

  // Statements functionality
  useEffect(() => {
    const fetchStatements = async () => {
      try {
        // In demo mode, use demo statements
        if (isDemoMode) {
          console.log('FamilySettings - Demo mode detected, loading demo statements')
          setStatements(DEMO_STATEMENTS)
          setFilteredStatements(DEMO_STATEMENTS)
          return
        }

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const response = await fetch(`${apiBaseUrl}/api/family/statements`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStatements(data.statements || [])
            setFilteredStatements(data.statements || [])
          }
        }
      } catch (error) {
        console.log('No statements available or error fetching statements:', error)
        // Fallback to demo data on error if in demo mode
        if (isDemoMode) {
          setStatements(DEMO_STATEMENTS)
          setFilteredStatements(DEMO_STATEMENTS)
        } else {
          setStatements([]) // New families will have no statements
          setFilteredStatements([])
        }
      }
    }

    fetchStatements()
  }, [isDemoMode])

  useEffect(() => {
    let filtered = Array.isArray(statements) ? statements : []

    // Filter by type
    if (statementFilter !== 'all') {
      filtered = filtered.filter(stmt => stmt && stmt.type === statementFilter)
    }

    // Filter by search term
    if (statementSearch) {
      filtered = filtered.filter(stmt => 
        stmt && (
          (stmt.period && stmt.period.toLowerCase().includes(statementSearch.toLowerCase())) ||
          (stmt.type && stmt.type.toLowerCase().includes(statementSearch.toLowerCase()))
        )
      )
    }

    // Filter by month
    if (selectedMonth) {
      filtered = filtered.filter(stmt => {
        if (!stmt || !stmt.date) return false
        const stmtDate = new Date(stmt.date)
        return !isNaN(stmtDate.getTime()) && stmtDate.getMonth() === parseInt(selectedMonth)
      })
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(stmt => {
        if (!stmt || !stmt.date) return false
        const stmtDate = new Date(stmt.date)
        return !isNaN(stmtDate.getTime()) && stmtDate.getFullYear() === parseInt(selectedYear)
      })
    }

    setFilteredStatements(filtered)
  }, [statements, statementFilter, statementSearch, selectedMonth, selectedYear])

  const handleDownloadStatement = async (statement) => {
    if (!statement) return
    try {
      // Show download started notification
      const period = statement.period || 'statement'
      await notificationService.addNotification({
        type: 'info',
        title: 'Download Started',
        message: `Downloading ${period} statement...`,
        timestamp: new Date().toISOString()
      })
      
      // Create a proper Kamioi-branded PDF content
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      
      const mockPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
/F2 6 0 R
/F3 7 0 R
/F4 8 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 1200
>>
stream
BT
/F1 28 Tf
72 750 Td
(KAMIOI) Tj
0 -50 Td
/F2 20 Tf
(Family Financial Statement) Tj
0 -40 Td
/F3 16 Tf
(${statement.period}) Tj
0 -60 Td
/F4 10 Tf
(===============================================) Tj
0 -30 Td
/F1 14 Tf
(ACCOUNT INFORMATION) Tj
0 -25 Td
/F3 12 Tf
(Family: Johnson Family) Tj
0 -15 Td
(Statement Date: ${currentDate}) Tj
0 -15 Td
(Statement Type: ${statement.type.charAt(0).toUpperCase() + statement.type.slice(1)}) Tj
0 -15 Td
(Account Number: ****-****-****-1234) Tj
0 -40 Td
/F4 10 Tf
(===============================================) Tj
0 -30 Td
/F1 14 Tf
(FINANCIAL SUMMARY) Tj
0 -25 Td
/F3 12 Tf
(Total Family Value: $${statement.amount.toLocaleString()}) Tj
0 -15 Td
(Total Transactions: ${statement.transactions}) Tj
0 -15 Td
(Total Round-ups: $${statement.roundUps.toLocaleString()}) Tj
0 -15 Td
(Total Investments: $${statement.investments.toLocaleString()}) Tj
0 -15 Td
(Average Transaction: $${Math.round(statement.amount / statement.transactions).toLocaleString()}) Tj
0 -40 Td
/F4 10 Tf
(===============================================) Tj
0 -30 Td
/F1 14 Tf
(FAMILY MEMBERS) Tj
0 -25 Td
/F3 12 Tf
(John Johnson - Portfolio: $${Math.round(statement.amount * 0.4).toLocaleString()}) Tj
0 -15 Td
(Jane Johnson - Portfolio: $${Math.round(statement.amount * 0.35).toLocaleString()}) Tj
0 -15 Td
(Junior Johnson - Portfolio: $${Math.round(statement.amount * 0.25).toLocaleString()}) Tj
0 -40 Td
/F4 10 Tf
(===============================================) Tj
0 -30 Td
/F1 14 Tf
(INVESTMENT HOLDINGS) Tj
0 -25 Td
/F3 12 Tf
(Apple Inc. (AAPL) - $${Math.round(statement.investments * 0.3).toLocaleString()}) Tj
0 -15 Td
(Microsoft Corp. (MSFT) - $${Math.round(statement.investments * 0.25).toLocaleString()}) Tj
0 -15 Td
(Tesla Inc. (TSLA) - $${Math.round(statement.investments * 0.2).toLocaleString()}) Tj
0 -15 Td
(Amazon.com Inc. (AMZN) - $${Math.round(statement.investments * 0.15).toLocaleString()}) Tj
0 -15 Td
(Google LLC (GOOGL) - $${Math.round(statement.investments * 0.1).toLocaleString()}) Tj
0 -40 Td
/F4 10 Tf
(===============================================) Tj
0 -30 Td
/F1 14 Tf
(STATEMENT FOOTER) Tj
0 -25 Td
/F3 10 Tf
(This statement was generated by Kamioi's AI-powered) Tj
0 -15 Td
(family investment platform on ${currentDate}.) Tj
0 -15 Td
(For questions, contact support@kamioi.com) Tj
0 -15 Td
(Phone: 1-800-KAMIOI-1) Tj
0 -15 Td
(Website: www.kamioi.com) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Oblique
>>
endobj

7 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

8 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Courier
>>
endobj

xref
0 9
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000369 00000 n 
0000000500 00000 n 
0000000600 00000 n 
0000000700 00000 n 
trailer
<<
/Size 9
/Root 1 0 R
>>
startxref
1500
%%EOF`
      
      // Create and trigger download
      const blob = new Blob([mockPDFContent], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `family-statement-${period.replace(' ', '-').toLowerCase()}.pdf`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Show success notification
      await notificationService.addNotification({
        type: 'success',
        title: 'Statement Downloaded',
        message: `${period} statement has been downloaded successfully.`,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      await notificationService.addNotification({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download statement. Please try again.',
        timestamp: new Date().toISOString()
      })
    }
  }

  const handleGenerateStatement = async () => {
    setIsGeneratingStatement(true)
    
    try {
      // Generate period name from current date
      const now = new Date()
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const periodName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`
      
      // Create statement in generating state first
      const newStatement = {
        id: Date.now(),
        type: 'monthly',
        period: periodName,
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        status: 'generating',
        format: 'PDF',
        size: '0 MB',
        transactions: 0,
        roundUps: 0,
        investments: 0
      }
      
      setStatements(prev => [newStatement, ...prev])
      
      // Call API to generate statement
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/statements/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          type: 'monthly',
          period: periodName,
          start_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          end_date: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Update statement with real data from API
          const completedStatement = {
            ...newStatement,
            status: 'available',
            amount: result.statement?.total_amount || 0,
            size: result.statement?.size || '0 MB',
            transactions: result.statement?.transaction_count || 0,
            roundUps: result.statement?.total_round_ups || 0,
            investments: result.statement?.total_invested || 0
          }
          
          setStatements(prev => prev.map(stmt => 
            stmt.id === newStatement.id ? completedStatement : stmt
          ))
          
          await notificationService.addNotification({
            type: 'success',
            title: 'Statement Generated',
            message: `Your ${periodName} statement is now available for download.`,
            timestamp: new Date().toISOString()
          })
        } else {
          throw new Error(result.error || 'Failed to generate statement')
        }
      } else {
        throw new Error('Failed to generate statement')
      }
    } catch (error) {
      await notificationService.addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate statement. Please try again.',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsGeneratingStatement(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-400 bg-green-400/20'
      case 'generating': return 'text-yellow-400 bg-yellow-400/20'
      case 'error': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'monthly': return 'text-blue-400 bg-blue-400/20'
      case 'quarterly': return 'text-purple-400 bg-purple-400/20'
      case 'annual': return 'text-orange-400 bg-orange-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  return (
    <>
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Settings className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Family Settings</h2>
            <p className="text-gray-300">Manage your family account preferences and security</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {[
            { id: 'profile', label: 'Family Profile', icon: Users },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'bank-connection', label: 'Bank Connection', icon: Link },
            { id: 'statements', label: 'Statements', icon: FileText },
            { id: 'subscription', label: 'Subscription', icon: CreditCard },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'appearance', label: 'Appearance', icon: theme === 'dark' ? Sun : theme === 'light' ? Cloud : Moon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Family Profile Picture Section */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Family Profile Picture
            </h3>
            <div className="flex items-center space-x-6">
              <ProfileAvatar 
                user={user} 
                size="2xl" 
                showUploadOnHover={false}
                dashboardType="family"
                onImageUpdate={(imageUrl) => {
                  console.log('Family profile image updated in settings:', imageUrl)
                  if (imageUrl) {
                    notificationService.createSystemNotification('family_invite', {
                      title: 'Family Profile Picture Updated',
                      message: 'Your family profile picture has been updated successfully.',
                      type: 'success',
                      icon: '📸',
                      priority: 'normal',
                      dashboardType: 'family'
                    })
                  } else {
                    notificationService.createSystemNotification('family_invite', {
                      title: 'Family Profile Picture Removed',
                      message: 'Your family profile picture has been removed.',
                      type: 'info',
                      icon: '🗑️',
                      priority: 'normal',
                      dashboardType: 'family'
                    })
                  }
                }}
              />
              <div>
                <h4 className="text-white font-medium mb-2">Upload Family Profile Picture</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Add a family profile picture to personalize your family account. Your image will be visible across all family dashboards.
                </p>
                <div className="text-xs text-gray-500">
                  <p>• Supported formats: JPG, PNG, GIF, WebP</p>
                  <p>• Maximum file size: 5MB</p>
                  <p>• Recommended: Square images (1:1 ratio)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Family Information */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Family Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Family Name</label>
                <input
                  type="text"
                  value={profileData.familyName}
                  onChange={(e) => setProfileData({...profileData, familyName: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Guardian Email (Unique)</label>
                <input
                  type="email"
                  value={profileData.guardianEmail}
                  onChange={(e) => setProfileData({...profileData, guardianEmail: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Family Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new family password"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Family Phone (E.164)</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  placeholder="+1234567890"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50"
                />
              </div>
            </div>
          </div>

          {/* Family Demographics & Compliance */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Family Demographics & Compliance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Family Size</label>
                <select
                  value={profileData.familySize}
                  onChange={(e) => setProfileData({...profileData, familySize: parseInt(e.target.value)})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500/50"
                >
                  <option value={2}>2 Members</option>
                  <option value={3}>3 Members</option>
                  <option value={4}>4 Members</option>
                  <option value={5}>5 Members</option>
                  <option value={6}>6+ Members</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Family Code</label>
                <input
                  type="text"
                  value={profileData.familyCode}
                  onChange={(e) => setProfileData({...profileData, familyCode: e.target.value})}
                  placeholder="FAMILY2024"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Guardian Last 4 SSN or Gov't ID</label>
                <input
                  type="text"
                  value={profileData.last4SSN}
                  onChange={(e) => setProfileData({...profileData, last4SSN: e.target.value})}
                  placeholder="1234"
                  maxLength="4"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pep"
                  checked={profileData.pepStatus}
                  onChange={(e) => setProfileData({...profileData, pepStatus: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="pep" className="text-gray-400 text-sm">Politically Exposed Person (PEP)</label>
              </div>
            </div>
          </div>

          {/* Family Address */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Family Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-2">Street Address</label>
                <input
                  type="text"
                  value={profileData.address.street}
                  onChange={(e) => setProfileData({...profileData, address: {...profileData.address, street: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">City</label>
                <input
                  type="text"
                  value={profileData.address.city}
                  onChange={(e) => setProfileData({...profileData, address: {...profileData.address, city: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">State</label>
                <input
                  type="text"
                  value={profileData.address.state}
                  onChange={(e) => setProfileData({...profileData, address: {...profileData.address, state: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={profileData.address.zip}
                  onChange={(e) => setProfileData({...profileData, address: {...profileData.address, zip: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Country</label>
                <select
                  value={profileData.address.country}
                  onChange={(e) => setProfileData({...profileData, address: {...profileData.address, country: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500/50"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Round Up Settings Card */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Round Up Settings</h3>
              </div>
              <button 
                onClick={() => setShowRoundUpModal(true)} 
                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                Configure
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-3">
              Configure your family round-up amount and enable/disable automatic round-ups
            </p>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="text-white font-semibold">${roundUpAmount}.00</div>
                <div className="text-gray-400 text-xs">
                  {roundUpEnabled ? 'Round-ups enabled' : 'Round-ups disabled'}
                </div>
              </div>
            </div>
          </div>

          {/* Family Financial Preferences */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Family Financial Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Family Investment Amount Per Transaction</label>
                <select
                  value={profileData.roundUpPreference}
                  onChange={(e) => setProfileData({...profileData, roundUpPreference: parseInt(e.target.value)})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500/50"
                >
                  <option value={1}>$1 per transaction</option>
                  <option value={2}>$2 per transaction</option>
                  <option value={3}>$3 per transaction</option>
                  <option value={5}>$5 per transaction</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Kamioi will invest this amount + 25% platform fee on every family purchase</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Family Investment Goal</label>
                <select
                  value={profileData.investmentGoal}
                  onChange={(e) => setProfileData({...profileData, investmentGoal: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500/50"
                >
                  <option value="Family Future">Family Future</option>
                  <option value="College Fund">College Fund</option>
                  <option value="Family Emergency">Family Emergency</option>
                  <option value="Family Vacation">Family Vacation</option>
                  <option value="Home Purchase">Home Purchase</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Family Risk Preference</label>
                <select
                  value={profileData.riskPreference}
                  onChange={(e) => setProfileData({...profileData, riskPreference: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500/50"
                >
                  <option value="Conservative">Conservative</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Aggressive">Aggressive</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="gamification"
                  checked={profileData.gamification}
                  onChange={(e) => setProfileData({...profileData, gamification: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="gamification" className="text-gray-400 text-sm">Family Gamification (Badges) - On by default</label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Save Family Profile
            </button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Family Notification Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-gray-400 text-sm">Receive family updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-gray-400 text-sm">Receive family updates via text message</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-gray-400 text-sm">Receive family push notifications on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Family Marketing Communications</p>
                  <p className="text-gray-400 text-sm">Receive family promotional emails and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.marketing}
                    onChange={(e) => setNotifications({...notifications, marketing: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Family Security Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-gray-400 text-sm">Add an extra layer of security to your family account</p>
                </div>
                <button
                  onClick={handleToggle2FA}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Enable Family 2FA
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Change Family Password</p>
                  <p className="text-gray-400 text-sm">Update your family account password</p>
                </div>
                <button
                  onClick={handleChangePassword}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Change Family Password
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Family Connected Devices</h3>
            {isDemoMode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">iPhone 15 Pro</p>
                      <p className="text-gray-400 text-sm">Last active: Today at 2:45 PM</p>
                    </div>
                  </div>
                  <span className="text-green-400 text-sm">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">MacBook Pro</p>
                      <p className="text-gray-400 text-sm">Last active: Today at 11:30 AM</p>
                    </div>
                  </div>
                  <span className="text-green-400 text-sm">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">iPad Air</p>
                      <p className="text-gray-400 text-sm">Last active: Yesterday at 8:15 PM</p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">Inactive</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No devices currently connected</p>
                <p className="text-gray-500 text-sm mt-2">Device tracking will be available in a future update</p>
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 text-red-400">Family Danger Zone</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Delete Family Account</p>
                  <p className="text-gray-400 text-sm">Permanently delete your family account and all data</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Family Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bank-connection' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Link className="w-5 h-5 mr-2" />
              Family Bank Account Connections
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Manage your family's connected bank accounts for automatic transaction syncing
            </p>
            
            {/* Connected Accounts */}
            <div className="space-y-4 mb-6">
              {bankConnections.length > 0 ? (
                bankConnections.map((connection) => (
                  <div key={connection.id || connection.account_id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {connection.bank_name || connection.institution_name || 'Bank Account'}
                          {connection.account_type ? ` ${connection.account_type}` : ''}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {connection.account_name || '••••••••'} • {connection.status === 'active' ? 'Connected' : connection.status || 'Connected'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        connection.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {connection.status === 'active' ? 'Active' : connection.status || 'Active'}
                      </span>
                      <button 
                        onClick={() => {
                          const connectionId = connection.id;
                          const accountName = connection.bank_name || connection.institution_name || connection.account_name || 'Bank Account';
                          handleDisconnectClick(connectionId, accountName);
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Disconnect Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Link className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400 text-sm">No bank accounts connected</p>
                  <p className="text-gray-500 text-xs mt-2">Connect a bank account to enable automatic transaction syncing</p>
                </div>
              )}
            </div>
            
            {/* Add New Connection */}
            <div className="border-t border-white/10 pt-6">
              <button onClick={()=>setShowBankModal(true)} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                <span>Connect New Family Bank Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'statements' && (
        <div className="space-y-6">
          {/* Statements Header */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Family Statements</h3>
                <p className="text-gray-400 text-sm">Download and manage your family's financial statements</p>
              </div>
              <button
                onClick={handleGenerateStatement}
                disabled={isGeneratingStatement}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>{isGeneratingStatement ? 'Generating...' : 'Generate New Statement'}</span>
              </button>
            </div>

            {/* Filters and Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search statements..."
                  value={statementSearch}
                  onChange={(e) => setStatementSearch(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <select
                value={statementFilter}
                onChange={(e) => setStatementFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500/50"
              >
                <option value="all">All Types</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500/50"
              >
                <option value="">All Months</option>
                <option value="0">January</option>
                <option value="1">February</option>
                <option value="2">March</option>
                <option value="3">April</option>
                <option value="4">May</option>
                <option value="5">June</option>
                <option value="6">July</option>
                <option value="7">August</option>
                <option value="8">September</option>
                <option value="9">October</option>
                <option value="10">November</option>
                <option value="11">December</option>
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500/50"
              >
                <option value="">All Years</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          </div>

          {/* Statements List */}
          <div className="glass-card p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Available Statements ({filteredStatements.length})</h4>
            {filteredStatements.length > 0 ? (
              <div className="space-y-4">
                {filteredStatements.map((statement) => {
                  if (!statement) return null
                  const safeStatement = {
                    id: statement.id || Date.now(),
                    period: statement.period || 'N/A',
                    type: statement.type || 'unknown',
                    status: statement.status || 'unknown',
                    amount: typeof statement.amount === 'number' ? statement.amount : 0,
                    transactions: typeof statement.transactions === 'number' ? statement.transactions : 0,
                    roundUps: typeof statement.roundUps === 'number' ? statement.roundUps : 0,
                    format: statement.format || 'PDF',
                    size: statement.size || '0 MB'
                  }
                  return (
                  <div key={safeStatement.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="text-white font-semibold">{safeStatement.period}</h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(safeStatement.type)}`}>
                            {safeStatement.type.charAt(0).toUpperCase() + safeStatement.type.slice(1)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(safeStatement.status)}`}>
                            {safeStatement.status.charAt(0).toUpperCase() + safeStatement.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>${safeStatement.amount.toLocaleString()}</span>
                          <span>{safeStatement.transactions} transactions</span>
                          <span>${safeStatement.roundUps} round-ups</span>
                          <span>{safeStatement.format} • {safeStatement.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {safeStatement.status === 'available' && (
                        <button
                          onClick={() => handleDownloadStatement(statement)}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      )}
                      {safeStatement.status === 'generating' && (
                        <div className="flex items-center space-x-2 text-yellow-400">
                          <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">Generating...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No statements found matching your criteria</p>
              </div>
            )}
          </div>

          {/* Statement Summary */}
          <div className="glass-card p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Statement Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  ${statements.reduce((sum, stmt) => sum + stmt.amount, 0).toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm">Total Family Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {statements.reduce((sum, stmt) => sum + stmt.transactions, 0)}
                </div>
                <div className="text-gray-400 text-sm">Total Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  ${statements.reduce((sum, stmt) => sum + stmt.roundUps, 0).toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm">Total Round-ups</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="mr-3 h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Subscription</h3>
            </div>
            <p className="text-gray-400 text-sm mb-3">
              Choose a plan and manage your family subscription
            </p>
            
            {/* Current Subscription */}
            {loadingSubscription ? (
              <div className="text-gray-400 text-sm mb-4">Loading subscription...</div>
            ) : currentSubscription ? (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-green-400 font-semibold">Current Plan: {currentSubscription.plan_name || currentSubscription.tier}</div>
                    <div className="text-gray-400 text-sm mt-1">
                      ${currentSubscription.price_monthly || currentSubscription.amount || 0}/month • {currentSubscription.status || 'active'}
                    </div>
                    {currentSubscription.current_period_end && (
                      <div className="text-gray-500 text-xs mt-1">
                        Billing period ends: {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {currentSubscription.status === 'active' && currentSubscription.auto_renewal !== 0 && (
                    <button
                      onClick={cancelSubscription}
                      disabled={cancelling}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                    </button>
                  )}
                  {(currentSubscription.auto_renewal === 0 || currentSubscription.status === 'cancelled') && (
                    <div className="px-4 py-2 bg-yellow-600/20 border border-yellow-600/40 text-yellow-400 rounded-lg text-sm">
                      Cancelling at period end
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="text-yellow-400 text-sm">No active subscription</div>
              </div>
            )}
            
            {/* Promo Code Input */}
            <div className="mt-4 mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Promo Code (Optional)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value)
                    setPromoError('')
                    setValidatedPromo(null)
                  }}
                  onBlur={() => {
                    if (promoCode.trim() && plans.length > 0) {
                      validatePromoCode(promoCode, plans[0].id)
                    }
                  }}
                  placeholder="Enter promo code"
                  className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/10 border-white/20 text-white border focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => {
                    if (promoCode.trim() && plans.length > 0) {
                      validatePromoCode(promoCode, plans[0].id)
                    }
                  }}
                  disabled={validatingPromo || !promoCode.trim()}
                  className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validatingPromo ? 'Validating...' : 'Apply'}
                </button>
              </div>
              {validatedPromo && (
                <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-green-400 text-sm">
                    ✓ Promo code applied! {validatedPromo.discount_type === 'free_months' 
                      ? `${validatedPromo.discount_value} free months` 
                      : validatedPromo.discount_type === 'percentage'
                      ? `${validatedPromo.discount_value}% off`
                      : `$${validatedPromo.discount_value} off`}
                  </div>
                </div>
              )}
              {promoError && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="text-red-400 text-sm">{promoError}</div>
                </div>
              )}
            </div>
            
            {/* Available Plans */}
            <div className="mt-3 space-y-3">
              {loadingPlans && <div className="text-gray-400 text-sm">Loading plans...</div>}
              {!loadingPlans && plans.length === 0 && (
                <div className="text-gray-400 text-sm">No plans available yet.</div>
              )}
              {!loadingPlans && plans.map((plan) => (
                <div key={plan.id} className={`flex items-center justify-between rounded-lg p-3 ${
                  currentSubscription?.plan_id === plan.id 
                    ? 'bg-purple-500/20 border border-purple-500/40' 
                    : 'bg-white/5'
                }`}>
                  <div>
                    <div className="text-white font-semibold">{plan.name}</div>
                    <div className="text-gray-400 text-sm">${plan.price_monthly}/month • {plan.tier}</div>
                  </div>
                  <button 
                    disabled={subscribing || currentSubscription?.plan_id === plan.id} 
                    onClick={() => subscribeToPlan(plan)} 
                    className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                      currentSubscription?.plan_id === plan.id
                        ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                    }`}
                  >
                    {subscribing ? 'Processing...' : currentSubscription?.plan_id === plan.id ? 'Current' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Family Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Theme</p>
                <p className="text-gray-400 text-sm">Choose between dark, light, and cloud mode for your family dashboard</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : theme === 'light' ? <Cloud className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>
                  {theme === 'dark' ? 'DARK MODE' : theme === 'light' ? 'LIGHT MODE' : 'CLOUD MODE'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
    {/* Round Up Settings Modal */}
    {showRoundUpModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Round Up Settings</h3>
            <button onClick={() => setShowRoundUpModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="space-y-6">
            {/* Round Up Amount */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Round Up Amount (Whole Dollars Only)</label>
              <div className="flex items-center space-x-2">
                <span className="text-white text-lg">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={roundUpAmount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    if (value >= 1) setRoundUpAmount(value)
                  }}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1"
                />
                <span className="text-white text-lg">.00</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                This amount will be added to new transactions only. Existing transactions won't be affected.
              </p>
            </div>
            
            {/* Enable/Disable Toggle */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Round Up Status</label>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="text-white font-medium">
                    {roundUpEnabled ? 'Round-ups Active' : 'Round-ups Paused'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {roundUpEnabled 
                      ? 'Round-ups will be applied to new transactions'
                      : 'Round-ups are disabled for new transactions'}
                  </div>
                </div>
                <button
                  onClick={() => setRoundUpEnabled(!roundUpEnabled)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    roundUpEnabled
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {roundUpEnabled ? (
                    <>
                      <Square className="w-4 h-4" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Enable</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Info Note */}
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-xs text-blue-300">
                <strong>Note:</strong> Changes apply to new transactions only. Existing transactions will keep their original round-up amounts.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={() => setShowRoundUpModal(false)} className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-white">Cancel</button>
            <button disabled={savingRoundUp} onClick={saveRoundUpSettings} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              {savingRoundUp ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    )}
    
    {/* MX Connect Modal */}
    {showBankModal && (
      <MXConnectWidget 
        isOpen={showBankModal} 
        onClose={() => setShowBankModal(false)} 
        userType="family" 
        onSuccess={handleMXConnectSuccess}
        onError={() => setShowBankModal(false)} 
      />
    )}

    {/* Success/Error Notification Modal - Glass Effect */}
    {showNotification && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-opacity duration-300">
        <div className={`${theme === 'light' ? 'bg-white/90 backdrop-blur-xl border-gray-300' : 'bg-gray-800/90 backdrop-blur-xl border-gray-700'} border rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100`}>
          <div className="flex items-center space-x-4">
            {notificationType === 'success' ? (
              <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-1`}>
                {notificationType === 'success' ? 'Success' : 'Error'}
              </h3>
              <p className={`${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                {notificationMessage}
              </p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg transition-colors font-medium ${
                notificationType === 'success'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default FamilySettings
