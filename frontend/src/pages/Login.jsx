import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { setToken, ROLES } from '../services/apiService'
import ForgotPassword from '../components/auth/ForgotPassword'
import MXConnectWidget from '../components/auth/MXConnectWidget'
import { useNotifications } from '../hooks/useNotifications'
import { User, Users, Building2, ArrowRight, CheckCircle, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, Plus, Key, Minus } from 'lucide-react'

const validatePasswordStrength = (password) => {
  const errors = []
  if (password.length < 8) errors.push('Password must be at least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('Password must include an uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('Password must include a lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('Password must include a number')
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must include a special character')
  return errors
}

const Login = ({ initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'signup' ? false : true)
  const [isDemo, setIsDemo] = useState(false)
  const [registrationType, setRegistrationType] = useState(null) // 'individual', 'family', 'business'
  
  // Demo form state
  const [demoData, setDemoData] = useState({
    email: '',
    code: ''
  })
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState('')
  const [registrationStep, setRegistrationStep] = useState(1)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showMXConnect, setShowMXConnect] = useState(false)
  const [userGuid, setUserGuid] = useState(null)
  const userGuidRef = useRef(null) // Ref to store userGuid for immediate access
  const [mxConnectData, setMxConnectData] = useState(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  
  // Notification modal state
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('error') // 'success' or 'error'
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  
  // Clear any cached demo data on component mount
  // IMPORTANT: Do NOT clear admin tokens - they should persist alongside user tokens
  useEffect(() => {
    console.log('🧹 Login - Clearing demo data and cache (preserving admin tokens)...')
    
    // 🚨 DEMO DATA CLEANUP - but preserve real admin tokens 🚨
    // Only clear user-related demo data, NOT admin tokens
    const demoKeysToClear = [
      'kamioi_user', 'kamioi_token', // User tokens (but check if demo first)
      'kamioi_family_user', 'kamioi_family_token', 
      'kamioi_business_user', 'kamioi_business_token',
      'kamioi_notifications', 'authToken', 'kamioi_users', 'kamioi_family_users', 'kamioi_business_users'
    ]
    
    // Clear demo keys, but preserve admin tokens
    for (const key of demoKeysToClear) {
      localStorage.removeItem(key)
    }
    
    // DO NOT clear kamioi_admin_token or kamioi_admin_user - these are real sessions!
    
    // Clear any demo data that might be in other keys
    // BUT preserve admin tokens and admin user data
    const demoEmails = ['user2@user2.com', 'test@test.com', 'demo@demo.com', 'admin@admin.com']
    const protectedKeys = ['kamioi_admin_token', 'kamioi_admin_user'] // Never clear these
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('kamioi_')) {
        // Skip protected admin keys
        if (protectedKeys.includes(key)) {
          console.log('🔒 Login - Preserving admin key:', key)
          continue
        }
        
        const data = localStorage.getItem(key)
        if (data) {
          try {
            const parsed = JSON.parse(data)
            if (parsed.email && demoEmails.includes(parsed.email.toLowerCase())) {
              console.log('🚨 Login - Found demo data in', key, ':', parsed.email)
              localStorage.removeItem(key)
            }
          } catch (e) {
            // If it's not JSON, check if it contains demo tokens
            // But don't clear if it's an admin token
            if (!key.includes('admin') && (data.includes('demo') || data.includes('test') || data.includes('mock'))) {
              console.log('🚨 Login - Found demo token in', key)
              localStorage.removeItem(key)
            }
          }
        }
      }
    }
    
    // Clear form data
    setLoginData({
      email: '',
      password: ''
    })
    
    console.log('✅ Login - Demo data cleanup complete')
  }, [])
  
  // Individual Account Form Data
  const [individualData, setIndividualData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ssn: '',
    
    // Address
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    
    // Financial Info
    annualIncome: '',
    employmentStatus: '',
    employer: '',
    occupation: '',
    
    // Investment Preferences
    password: '',
    confirmPassword: '',
    roundUpAmount: 1.00,
    riskTolerance: 'moderate',
    investmentGoals: [],
    
    // Subscription
    selectedPlanId: null,
    billingCycle: 'monthly',
    isTrial: false,
    promoCode: '',
    
    // Terms
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMarketing: false
  })
  
  // Family Account Form Data
  const [familyData, setFamilyData] = useState({
    // Primary Guardian Info
    guardianFirstName: '',
    guardianLastName: '',
    guardianEmail: '',
    guardianPhone: '',
    guardianDateOfBirth: '',
    guardianSsn: '',
    
    // Address
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    
    // Family Info
    spouseFirstName: '',
    spouseLastName: '',
    spouseEmail: '',
    spousePhone: '',
    children: [],
    
    // Financial Info
    householdIncome: '',
    employmentStatus: '',
    employer: '',
    
    // Investment Preferences
    password: '',
    confirmPassword: '',
    roundUpAmount: 1.50,
    riskTolerance: 'moderate',
    familyGoals: [],
    
    // Subscription
    selectedPlanId: null,
    billingCycle: 'monthly',
    isTrial: false,
    promoCode: '',
    
    // Terms
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMarketing: false,
    // Password validation
    passwordErrors: []
  })
  
  // Business Account Form Data
  const [businessData, setBusinessData] = useState({
    // Business Info
    businessName: '',
    businessType: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZipCode: '',
    businessPhone: '',
    businessEmail: '',
    businessWebsite: '',
    businessDescription: '',
    businessIndustry: '',
    businessSize: '',
    businessTaxId: '',
    businessLicense: '',
    
    // Primary Contact Info
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    contactTitle: '',
    contactSsn: '',
    
    // Financial Info
    annualRevenue: '',
    numberOfEmployees: '',
    businessBankAccount: '',
    businessCreditScore: '',
    
    // Investment Preferences
    password: '',
    confirmPassword: '',
    roundUpAmount: 2.00,
    riskTolerance: 'moderate',
    businessGoals: [],
    
    // Subscription
    selectedPlanId: null,
    billingCycle: 'monthly',
    isTrial: false,
    promoCode: '',
    
    // Terms
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMarketing: false,
    // Password validation
    passwordErrors: []
  })
  
  const { 
    user, 
    loginUser, 
    isInitialized
  } = useAuth()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Helper function to get dashboard path
  const getUserDashboardPath = (user) => {
    if (!user) return '/dashboard'
    
    const dashboard = user.dashboard || user.role
    const userId = user.account_number || user.id || 'unknown'
    
    switch (dashboard) {
      case 'admin':
        return `/admin/${userId}/`
      case 'business':
        return `/business/${userId}/`
      case 'family':
        return `/family/${userId}/`
      default:
        return `/dashboard/${userId}/`
    }
  }

  // Handle redirect for already logged in users - only after auth is initialized
  useEffect(() => {
    if (isInitialized && user) {
      // Check if there's an explicit logout or switch account request
      const forceLogin = searchParams.get('force') === 'true'
      
      if (forceLogin) {
        console.log('🔄 Login - Force login requested, allowing login page access')
        return // Don't redirect, allow login page to show
      }
      
      // Prevent redirect loops - don't redirect if we're already on a dashboard
      const isOnDashboard = location.pathname.includes('/dashboard/') || 
                            location.pathname.includes('/admin/') ||
                            location.pathname.includes('/business/') ||
                            location.pathname.includes('/family/')
      
      if (isOnDashboard) {
        console.log('🔄 Login - Already on dashboard, skipping redirect')
        return
      }
      
      console.log('🔄 Login - User already logged in, redirecting to dashboard')
      const dashboardPath = getUserDashboardPath(user)
      console.log('🔄 Login - Redirecting to:', dashboardPath)
      
      // Use window.location for a hard redirect to ensure navigation happens
      if (dashboardPath && dashboardPath !== '/dashboard' && dashboardPath !== '/login') {
        window.location.href = dashboardPath
      } else {
        navigate(dashboardPath, { replace: true })
      }
    }
  }, [user, navigate, isInitialized, location.pathname, searchParams])

  useEffect(() => {
    // Get account type from URL params
    const type = searchParams.get('type')
    if (type) {
      setRegistrationType(type)
    }
  }, [searchParams])

  // Fetch all subscription plans on mount for account type selection page
  useEffect(() => {
    const fetchAllPlans = async () => {
      setLoadingPlans(true)
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const response = await fetch(`${apiBaseUrl}/api/user/subscriptions/plans`)
        if (response.ok) {
          const data = await response.json()
          const plans = data.plans || data.data?.plans || data.data || []
          setSubscriptionPlans(Array.isArray(plans) ? plans : [])
        } else {
          console.error('Failed to fetch subscription plans:', response.status, response.statusText)
          setSubscriptionPlans([])
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error)
        setSubscriptionPlans([])
      } finally {
        setLoadingPlans(false)
      }
    }

    fetchAllPlans()
  }, [])

  // Helper function to get price for account type
  const getPriceForAccountType = (accountType) => {
    const plan = subscriptionPlans.find(p => p.account_type === accountType)
    if (plan) {
      const price = plan.price_monthly || plan.price || 0
      return `$${parseFloat(price).toFixed(0)}/month`
    }
    // Fallback prices
    const fallbackPrices = { individual: '$9/month', family: '$19/month', business: '$49/month' }
    return fallbackPrices[accountType] || '$0/month'
  }

  const handleInputChange = (field, value, formType = registrationType) => {
    switch (formType) {
      case 'individual':
        setIndividualData(prev => ({ ...prev, [field]: value }))
        break
      case 'family':
        setFamilyData(prev => ({ ...prev, [field]: value }))
        break
      case 'business':
        setBusinessData(prev => ({ ...prev, [field]: value }))
        break
      default:
        break
    }
  }

  const handleLoginInputChange = (field, value) => {
    setLoginData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field, value, checked, formType = registrationType) => {
    const updateFunction = (prev) => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    })
    
    switch (formType) {
      case 'individual':
        setIndividualData(updateFunction)
        break
      case 'family':
        setFamilyData(updateFunction)
        break
      case 'business':
        setBusinessData(updateFunction)
        break
      default:
        break
    }
  }

  const handleChildChange = (index, field, value) => {
    setFamilyData(prev => ({
      ...prev,
      children: prev.children.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }))
  }

  const addChild = () => {
    setFamilyData(prev => ({
      ...prev,
      children: [...prev.children, { name: '', age: '', relationship: 'child' }]
    }))
  }

  const removeChild = (index) => {
    setFamilyData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }))
  }

  const nextStep = () => {
    setRegistrationStep(prev => prev + 1)
  }

  const prevStep = () => {
    setRegistrationStep(prev => Math.max(prev - 1, 1))
  }

  const getTotalSteps = () => {
    switch (registrationType) {
      case 'individual':
        return 6 // Added subscription step
      case 'family':
        return 7 // Added subscription step
      case 'business':
        return 8 // Added subscription step
      default:
        return 6
    }
  }

  const isStepValid = (step) => {
    switch (registrationType) {
      case 'individual':
        switch (step) {
          case 1:
            return individualData.firstName && individualData.lastName && individualData.email && individualData.phone
          case 2:
            return individualData.address && individualData.city && individualData.state && individualData.zipCode
          case 3:
            return individualData.annualIncome && individualData.employmentStatus
          case 4:
            return true // Bank connection step - always valid (user can skip)
          case 5:
            return individualData.selectedPlanId !== null || individualData.isTrial === true
          case 6: {
            const passwordValid = individualData.password && 
                                  individualData.confirmPassword && 
                                  individualData.password === individualData.confirmPassword &&
                                  (!individualData.passwordErrors || individualData.passwordErrors.length === 0)
            return passwordValid && individualData.agreeToTerms && individualData.agreeToPrivacy
          }
          default:
            return false
        }
      case 'family':
        switch (step) {
          case 1:
            return familyData.guardianFirstName && familyData.guardianLastName && 
                   familyData.guardianEmail && familyData.guardianPhone
          case 2:
            return familyData.address && familyData.city && familyData.state && familyData.zipCode
          case 3:
            return true // Spouse information is optional
          case 4:
            return familyData.householdIncome && familyData.employmentStatus
          case 5: {
            const familyPasswordValid = familyData.password && 
                                        familyData.confirmPassword && 
                                        familyData.password === familyData.confirmPassword &&
                                        (!familyData.passwordErrors || familyData.passwordErrors.length === 0)
            return familyPasswordValid && familyData.agreeToTerms && familyData.agreeToPrivacy
          }
          case 6:
            return familyData.selectedPlanId !== null || familyData.isTrial === true
          case 7:
            return true // Bank connection step - always valid
          default:
            return false
        }
      case 'business':
        switch (step) {
          case 1:
            return businessData.businessName && businessData.businessType && 
                   businessData.businessAddress && businessData.businessCity
          case 2:
            return businessData.businessPhone && businessData.businessEmail && 
                   businessData.businessIndustry && businessData.businessSize
          case 3:
            return businessData.contactFirstName && businessData.contactLastName && 
                   businessData.contactEmail && businessData.contactPhone
          case 4:
            return businessData.annualRevenue && businessData.numberOfEmployees
          case 5:
            return businessData.businessTaxId && businessData.businessLicense
          case 6: {
            const businessPasswordValid = businessData.password && 
                                         businessData.confirmPassword && 
                                         businessData.password === businessData.confirmPassword &&
                                         (!businessData.passwordErrors || businessData.passwordErrors.length === 0)
            return businessPasswordValid && businessData.agreeToTerms && businessData.agreeToPrivacy
          }
          case 7:
            return businessData.selectedPlanId !== null || businessData.isTrial === true
          case 8:
            return true // Bank connection step - always valid
          default:
            return false
        }
      default:
        return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('🎯 handleSubmit called - isLogin:', isLogin, 'registrationStep:', registrationStep, 'getTotalSteps():', getTotalSteps())
    
    if (isLogin) {
      // Validate login data
      if (!loginData.email || !loginData.password) {
        addNotification({
          id: Date.now(),
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter both email and password',
          read: false
        })
        return
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(loginData.email)) {
        addNotification({
          id: Date.now(),
          type: 'error',
          title: 'Invalid Email',
          message: 'Please enter a valid email address',
          read: false
        })
        return
      }
      
      // Block demo/test accounts
      const blockedEmails = ['user2@user2.com', 'test@test.com', 'demo@demo.com', 'admin@admin.com']
      if (blockedEmails.includes(loginData.email.toLowerCase())) {
        addNotification({
          id: Date.now(),
          type: 'error',
          title: 'Account Unavailable',
          message: 'This account is no longer available. Please use a valid account.',
          read: false
        })
        return
      }
      
      // Handle login
      try {
        console.log('🔐 Login - Attempting login for:', loginData.email)
        const result = await loginUser(loginData.email, loginData.password)
        
        if (result.success) {
          console.log('✅ Login - Login successful')
          console.log('User data:', result.user)
          
          // Use dashboard field if available, otherwise fall back to role
          const dashboard = result.user.dashboard || result.user.role
          const userId = result.user.account_number || result.user.id
          
          // Validate user ID exists
          if (!userId) {
            console.error('🚨 Login - No user ID found, cannot redirect to dashboard')
            addNotification({
              id: Date.now(),
              type: 'error',
              title: 'Authentication Error',
              message: 'No user ID found. Please try logging in again.',
              read: false
            })
            return
          }
          
          console.log('🔍 Login redirect - Dashboard:', dashboard, 'User ID:', userId, 'Type:', typeof userId)
          
          if (dashboard === 'admin' || dashboard === 'superadmin') {
            const adminPath = `/admin/${userId}/`
            console.log('🔍 Login - Redirecting to admin dashboard:', adminPath)
            navigate(adminPath)
          } else if (dashboard === 'business') {
            const businessPath = `/business/${userId}/`
            console.log('🔍 Login - Redirecting to business dashboard:', businessPath)
            navigate(businessPath)
          } else if (dashboard === 'family') {
            const familyPath = `/family/${userId}/`
            console.log('🔍 Login - Redirecting to family dashboard:', familyPath)
            navigate(familyPath)
          } else if (dashboard === 'individual' || dashboard === 'user') {
            const userPath = `/dashboard/${userId}/`
            console.log('🔍 Login - Redirecting to user dashboard:', userPath)
            navigate(userPath)
          } else {
            console.error('🚨 Login - Unknown dashboard type:', dashboard, 'redirecting to login')
            setNotificationMessage('Authentication error: Unknown user type. Please contact support.')
            setNotificationType('error')
            setShowNotification(true)
            navigate('/login')
          }
        } else {
          console.error('❌ Login - Login failed:', result.error)
          // Determine better error message
          const errorMsg = result.error || 'Login failed. Please check your credentials and try again.'
          let displayMessage = errorMsg
          
          // Provide user-friendly error messages
          if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('Invalid credentials')) {
            displayMessage = 'Invalid email or password. Please check your credentials and try again.'
          } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
            displayMessage = 'Account not found. Please check your email address or sign up for a new account.'
          } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
            displayMessage = 'Access denied. Please contact support if you believe this is an error.'
          } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
            displayMessage = 'Unable to connect to server. Please check your internet connection and try again.'
          }
          
          setNotificationMessage(displayMessage)
          setNotificationType('error')
          setShowNotification(true)
        }
      } catch (error) {
        console.error('❌ Login - Login error:', error)
        let errorMessage = 'An unexpected error occurred. Please try again.'
        
        // Provide user-friendly error messages
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = 'Account not found. Please check your email address or sign up for a new account.'
        } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection and try again.'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        setNotificationMessage(errorMessage)
        setNotificationType('error')
        setShowNotification(true)
      }
    } else {
      // Handle registration - move to next step or complete
      console.log('📝 Registration flow - Step:', registrationStep, 'Total steps:', getTotalSteps())
      
      // For business: Create account when moving from step 7 (plan selection) to step 8 (bank connection)
      if (registrationType === 'business' && registrationStep === 7) {
        console.log('🏢 Business - Plan selected, creating account before bank connection')
        await completeRegistration()
        return
      }
      
      // Check if we're on the bank connection step (step 4 for individual, step 7 for family, step 8 for business)
      const isBankConnectionStep = (registrationType === 'individual' && registrationStep === 4) ||
                                  (registrationType === 'family' && registrationStep === 7) ||
                                  (registrationType === 'business' && registrationStep === 8)
      
      if (isBankConnectionStep) {
        // On bank connection step - user can connect bank or skip
        // MX data is stored in mxConnectData state if they connected
        // For Family: Step 7 is both bank connection AND final step
        // For Individual: Step 4 is bank connection, Step 6 is final
        // For Business: Step 8 is both bank connection AND final step
        console.log('🏦 Bank connection step - user can connect bank or proceed')
        
        // Check if this is also the final step (Family step 7, Business step 8)
        const isFinalStep = registrationStep === getTotalSteps()
        
        if (isFinalStep) {
          // This is both bank connection and final step - create account now
          console.log('🏁 Bank connection is final step - creating account now')
          await completeRegistration()
        } else {
          // Not the final step - move to next step
          console.log('➡️ Moving to next step from bank connection')
          nextStep()
        }
        return
      } else if (registrationStep < getTotalSteps()) {
        console.log('➡️ Moving to next step')
        nextStep()
      } else {
        console.log('🏁 Final step reached, calling completeRegistration')
        completeRegistration()
      }
    }
  }

  const completeRegistration = async () => {
    try {
      console.log('🚀 Starting completeRegistration function')
      console.log('Registration type:', registrationType)
      
      // Create user data from the appropriate form based on registration type
      let userData = {}
      
      switch (registrationType) {
        case 'individual':
          userData = {
            name: `${individualData.firstName} ${individualData.lastName}`,
            email: individualData.email,
            password: individualData.password,
            confirmPassword: individualData.confirmPassword,
            confirm_password: individualData.confirmPassword,
            accountType: 'individual',
            phone: individualData.phone || '',
            address: individualData.address || '',
            city: individualData.city || '',
            state: individualData.state || '',
            zipCode: individualData.zipCode || '',
            annualIncome: individualData.annualIncome || '',
            employmentStatus: individualData.employmentStatus || '',
            employer: individualData.employer || '',
            occupation: individualData.occupation || '',
            roundUpAmount: individualData.roundUpAmount || 5,
            riskTolerance: individualData.riskTolerance || 'moderate',
            firstName: individualData.firstName || '',
            lastName: individualData.lastName || '',
            agreeToTerms: individualData.agreeToTerms,
            agreeToPrivacy: individualData.agreeToPrivacy,
            agreeToMarketing: individualData.agreeToMarketing,
            // Subscription information
            subscriptionPlanId: individualData.selectedPlanId || null,
            billingCycle: individualData.billingCycle || 'monthly',
            isTrial: individualData.isTrial || false,
            promoCode: individualData.promoCode || ''
          }
          console.log('Individual data:', individualData)
          break
          
        case 'family':
          userData = {
            name: `${familyData.guardianFirstName} ${familyData.guardianLastName}`,
            email: familyData.guardianEmail,
            password: familyData.password,
            confirmPassword: familyData.confirmPassword,
            confirm_password: familyData.confirmPassword,
            accountType: 'family',
            phone: familyData.guardianPhone || '',
            address: familyData.address || '',
            city: familyData.city || '',
            state: familyData.state || '',
            zipCode: familyData.zipCode || '',
            householdIncome: familyData.householdIncome || '',
            employmentStatus: familyData.employmentStatus || '',
            employer: familyData.employer || '',
            firstName: familyData.guardianFirstName || '',
            lastName: familyData.guardianLastName || '',
            agreeToTerms: familyData.agreeToTerms,
            agreeToPrivacy: familyData.agreeToPrivacy,
            agreeToMarketing: familyData.agreeToMarketing,
            // Subscription information
            subscriptionPlanId: familyData.selectedPlanId || null,
            billingCycle: familyData.billingCycle || 'monthly',
            isTrial: familyData.isTrial || false,
            promoCode: familyData.promoCode || ''
          }
          console.log('Family data:', familyData)
          break
          
        case 'business':
          userData = {
            name: `${businessData.contactFirstName} ${businessData.contactLastName}`,
            email: businessData.contactEmail,
            password: businessData.password,
            confirmPassword: businessData.confirmPassword,
            confirm_password: businessData.confirmPassword,
            accountType: 'business',
            phone: businessData.businessPhone || businessData.contactPhone || '',
            address: businessData.businessAddress || '',
            city: businessData.businessCity || '',
            state: businessData.businessState || '',
            zipCode: businessData.businessZip || '',
            businessName: businessData.businessName || '',
            businessType: businessData.businessType || '',
            annualRevenue: businessData.annualRevenue || '',
            numberOfEmployees: businessData.numberOfEmployees || '',
            firstName: businessData.contactFirstName || '',
            lastName: businessData.contactLastName || '',
            agreeToTerms: businessData.agreeToTerms,
            agreeToPrivacy: businessData.agreeToPrivacy,
            agreeToMarketing: businessData.agreeToMarketing,
            // Subscription information
            subscriptionPlanId: businessData.selectedPlanId || null,
            billingCycle: businessData.billingCycle || 'monthly',
            isTrial: businessData.isTrial || false,
            promoCode: businessData.promoCode || ''
          }
          console.log('Business data:', businessData)
          break
          
        default:
          throw new Error('Invalid registration type')
      }
      
      console.log('📝 Registration - Creating user:', userData.email)
      console.log('📝 User data to send:', JSON.stringify(userData, null, 2))
      
      // Register user with backend
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/user/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      
      console.log('📝 Response status:', response.status)
      const result = await response.json()
      console.log('📝 Response result:', JSON.stringify(result, null, 2))
      
      if (result.success) {
        console.log('✅ Registration - User created successfully')
        console.log('UserGuid received:', result.userGuid)
        const receivedUserGuid = result.userGuid
        // Store in both state and ref for immediate access
        setUserGuid(receivedUserGuid)
        userGuidRef.current = receivedUserGuid
        
        // Check if we're on the bank connection step
        const isBankConnectionStep = (registrationType === 'individual' && registrationStep === 4) ||
                                    (registrationType === 'family' && registrationStep === 7) ||
                                    (registrationType === 'business' && registrationStep === 8)
        
        // For business: When creating account from step 7 (plan selection), move to step 8 (bank connection)
        if (registrationType === 'business' && registrationStep === 7) {
          console.log('🏢 Business - Account created from plan selection, moving to bank connection step')
          // Move to step 8 (bank connection)
          setRegistrationStep(8)
          // Trigger a state update to re-render and show the widget
          setTimeout(() => {
            setShowMXConnect(true)
          }, 100)
          return
        }
        
        if (isBankConnectionStep) {
          console.log('🏦 Bank connection step - Account created, userGuid:', receivedUserGuid)
          // Account is created, stay on bank connection step and show widget
          // Trigger a state update to re-render and show the widget
          setTimeout(() => {
            setShowMXConnect(true)
          }, 100)
          return
        } else {
          console.log('🏁 Final step - completing registration with MX data')
          // This is the final step, complete registration
          // Store userGuid for later use
          setUserGuid(result.userGuid)
          
          // Complete registration with or without MX data
          // Always update all registration data to ensure nothing is missing
          const registrationData = registrationType === 'individual' ? individualData :
                                   registrationType === 'family' ? familyData :
                                   businessData
          
          // Update all registration data via complete-registration endpoint
          try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
            const updateData = {
              userGuid: result.userGuid,
              mxData: mxConnectData ? {
                accounts: mxConnectData.accounts || [],
                member_guid: mxConnectData.member_guid || '',
                user_guid: mxConnectData.user_guid || result.userGuid || '',
                institution_name: mxConnectData.institution_name || 'Connected Bank',
                connected_at: mxConnectData.connected_at || new Date().toISOString()
              } : { accounts: [] },
              // Include all registration data
              firstName: registrationData.firstName || registrationData.guardianFirstName || registrationData.contactFirstName || '',
              lastName: registrationData.lastName || registrationData.guardianLastName || registrationData.contactLastName || '',
              phone: registrationData.phone || registrationData.guardianPhone || registrationData.businessPhone || registrationData.contactPhone || '',
              address: registrationData.address || registrationData.businessAddress || '',
              city: registrationData.city || registrationData.businessCity || '',
              state: registrationData.state || registrationData.businessState || '',
              zipCode: registrationData.zipCode || registrationData.businessZip || '',
              country: registrationData.country || 'USA',
              timezone: registrationData.timezone || '',
              annualIncome: registrationData.annualIncome || registrationData.householdIncome || registrationData.annualRevenue || '',
              employmentStatus: registrationData.employmentStatus || '',
              employer: registrationData.employer || '',
              occupation: registrationData.occupation || '',
              roundUpAmount: registrationData.roundUpAmount || 1.0,
              riskTolerance: registrationData.riskTolerance || 'moderate',
              dateOfBirth: registrationData.dateOfBirth || registrationData.guardianDateOfBirth || '',
              ssnLast4: (registrationData.ssn || registrationData.guardianSsn || registrationData.contactSsn || '').slice(-4),
              subscriptionPlanId: registrationData.selectedPlanId || null,
              billingCycle: registrationData.billingCycle || 'monthly',
              promoCode: registrationData.promoCode || ''
            }
            
            console.log('🔄 Updating all registration data:', JSON.stringify(updateData, null, 2))
            const updateResponse = await fetch(`${apiBaseUrl}/api/user/auth/complete-registration`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updateData)
            })
            
            console.log('🔄 Update response status:', updateResponse.status)
            if (updateResponse.ok) {
              const updateResult = await updateResponse.json()
              console.log('✅ Registration data updated:', JSON.stringify(updateResult, null, 2))
            } else {
              const errorText = await updateResponse.text()
              console.error('⚠️ Failed to update registration data:', errorText)
            }
          } catch (updateError) {
            console.error('⚠️ Error updating registration data:', updateError)
            // Don't fail registration if update fails
          }
          
          // If MX data was collected earlier, also call handleMXSuccess for proper flow
          if (mxConnectData && mxConnectData.accounts && mxConnectData.accounts.length > 0) {
            console.log('🏦 Including MX data in registration completion')
            const mxDataToSend = {
              accounts: mxConnectData.accounts || []
            }
            await handleMXSuccess(mxDataToSend, result.userGuid)
          }
          
          // After account creation, handle subscription payment
          // If user selected a plan, redirect to Stripe checkout
          const selectedPlanId = individualData.selectedPlanId || familyData.selectedPlanId || businessData.selectedPlanId
          const billingCycle = individualData.billingCycle || familyData.billingCycle || businessData.billingCycle || 'monthly'
          const isTrial = individualData.isTrial !== false && familyData.isTrial !== false && businessData.isTrial !== false
          
          if (selectedPlanId && !isTrial) {
            // User wants to pay now (not trial) - redirect to Stripe checkout
            console.log('💳 Redirecting to Stripe checkout for plan:', selectedPlanId)
            try {
              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
              const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('kamioi_token')
              
              // Include userGuid in case token is not yet available
              const requestBody = {
                plan_id: selectedPlanId,
                billing_cycle: billingCycle
              }
              
              // If we have userGuid, include it for authentication
              if (result.userGuid) {
                requestBody.userGuid = result.userGuid
              }
              
              const headers = {
                'Content-Type': 'application/json'
              }
              
              // Add auth token if available
              if (token) {
                headers['Authorization'] = `Bearer ${token}`
              }
              
              const response = await fetch(`${apiBaseUrl}/api/stripe/create-checkout-session`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
              })
              
              if (response.ok) {
                const data = await response.json()
                if (data.success && data.checkout_url) {
                  // Redirect to Stripe checkout
                  window.location.href = data.checkout_url
                  return
                }
              }
              console.error('Failed to create Stripe checkout session')
              // Fall through to dashboard if Stripe fails
            } catch (error) {
              console.error('Error creating Stripe checkout:', error)
              // Fall through to dashboard if Stripe fails
            }
          }
          
          // If trial or no plan selected, or Stripe failed, auto-login and go to dashboard
          console.log('✅ Registration complete - auto-logging in user')
          
          // Auto-login the user after registration
          try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
            // Normalize email to lowercase (backend expects lowercase)
            const loginEmail = (individualData.email || familyData.guardianEmail || businessData.contactEmail || '').trim().toLowerCase()
            const loginPassword = individualData.password || familyData.password || businessData.password
            
            console.log('🔍 Auto-login attempt - Email:', loginEmail, 'Password length:', loginPassword?.length)
            
            if (!loginEmail || !loginPassword) {
              console.error('❌ Missing email or password for auto-login')
              navigate('/login', { replace: true })
              return
            }
            
            const loginResponse = await fetch(`${apiBaseUrl}/api/user/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: loginEmail,
                password: loginPassword
              })
            })
            
            if (loginResponse.ok) {
              const loginResult = await loginResponse.json()
              console.log('🔍 Auto-login response:', loginResult)
              
              if (loginResult.success && loginResult.token) {
                // Store token
                setToken(loginResult.token)
                localStorage.setItem('kamioi_user_token', loginResult.token)
                localStorage.setItem('kamioi_token', loginResult.token)
                
                // Store user data if provided
                if (loginResult.user) {
                  localStorage.setItem('kamioi_user', JSON.stringify(loginResult.user))
                }
                
                // Get dashboard path based on account type
                const userData = loginResult.user || {
                  role: registrationType || 'individual',
                  account_number: result.accountNumber || result.userGuid,
                  id: result.userId || result.userGuid
                }
                const dashboardPath = getUserDashboardPath(userData)
                
                console.log('✅ Auto-login successful - redirecting to dashboard:', dashboardPath)
                console.log('✅ User data:', userData)
                
                // Use window.location for hard redirect to ensure it works
                window.location.href = dashboardPath
                return
              } else {
                console.error('❌ Auto-login failed - no token in response:', loginResult)
              }
            } else {
              const errorText = await loginResponse.text()
              console.error('❌ Auto-login failed - response not OK:', loginResponse.status, errorText)
            }
            
            console.error('❌ Auto-login failed, redirecting to login page')
            // If auto-login fails, redirect to login
            navigate('/login', { replace: true })
          } catch (error) {
            console.error('Error during auto-login:', error)
            // If auto-login fails, redirect to login
            navigate('/login', { replace: true })
          }
        }
      } else {
        console.error('❌ Registration - Failed:', result.error)
        addNotification({
          id: Date.now(),
          type: 'error',
          title: 'Registration Failed',
          message: result.error || 'Registration failed. Please try again.',
          read: false
        })
      }
    } catch (error) {
      console.error('❌ Registration - Error:', error)
      addNotification({
        id: Date.now(),
        type: 'error',
        title: 'Registration Error',
        message: error.message || 'An error occurred during registration. Please try again.',
        read: false
      })
    }
  }

  const handleMXSuccess = async (data, guid = null) => {
    console.log('✅ MX Connect Success:', data)
    setMxConnectData(data)
    
    // Use the provided guid, ref, or state (in that order for immediate availability)
    const currentUserGuid = guid || userGuidRef.current || userGuid
    console.log('🔍 handleMXSuccess - guid param:', guid)
    console.log('🔍 handleMXSuccess - userGuidRef.current:', userGuidRef.current)
    console.log('🔍 handleMXSuccess - userGuid state:', userGuid)
    console.log('🔍 handleMXSuccess - currentUserGuid (final):', currentUserGuid)
    console.log('🔍 handleMXSuccess - data:', data)
    
    // Check if we're on the bank connection step
    const isBankConnectionStep = (registrationType === 'individual' && registrationStep === 4) ||
                                (registrationType === 'family' && registrationStep === 7) ||
                                (registrationType === 'business' && registrationStep === 8)
    
    if (isBankConnectionStep) {
      console.log('🏦 Bank connection completed - storing MX data')
      setShowMXConnect(false)
      
      // For Business: Account already exists (created at step 7), so complete registration with MX data
      if (registrationType === 'business' && currentUserGuid) {
        console.log('🏢 Business - Account exists, completing registration with MX data')
        // Continue to complete registration below
      } else {
        // For Individual and Family: Store data, account will be created when user clicks "Create Account"
        console.log('🏦 Storing MX data - account will be created when user clicks "Create Account"')
        return
      }
    }
    
    // If we're not on bank connection step and don't have userGuid, just store the data
    // Account creation will happen via completeRegistration() when user clicks "Create Account"
    if (!currentUserGuid && !isBankConnectionStep) {
      console.log('🏦 MX data received but no userGuid yet - storing for later use during account creation')
      // Just store the data, don't try to complete registration
      return
    }
    
    // This is the final step, complete registration
    try {
      
      // Include full MX data with connection details
      const cleanedMxData = {
        accounts: data.accounts || [],
        member_guid: data.member_guid || '',
        user_guid: data.user_guid || currentUserGuid || '',
        institution_name: data.institution_name || 'Connected Bank',
        connected_at: new Date().toISOString()
      }
      
      // Get all registration data to send with completion
      const registrationData = registrationType === 'individual' ? individualData :
                               registrationType === 'family' ? familyData :
                               businessData
      
      const requestBody = {
        userGuid: currentUserGuid,
        mxData: cleanedMxData,
        // Include all registration data that might be missing
        firstName: registrationData.firstName || registrationData.guardianFirstName || registrationData.contactFirstName || '',
        lastName: registrationData.lastName || registrationData.guardianLastName || registrationData.contactLastName || '',
        phone: registrationData.phone || registrationData.guardianPhone || registrationData.businessPhone || registrationData.contactPhone || '',
        address: registrationData.address || registrationData.businessAddress || '',
        city: registrationData.city || registrationData.businessCity || '',
        state: registrationData.state || registrationData.businessState || '',
        zipCode: registrationData.zipCode || registrationData.businessZip || '',
        country: registrationData.country || 'USA',
        timezone: registrationData.timezone || '',
        annualIncome: registrationData.annualIncome || registrationData.householdIncome || registrationData.annualRevenue || '',
        employmentStatus: registrationData.employmentStatus || '',
        employer: registrationData.employer || '',
        occupation: registrationData.occupation || '',
        roundUpAmount: registrationData.roundUpAmount || 1.0,
        riskTolerance: registrationData.riskTolerance || 'moderate',
        dateOfBirth: registrationData.dateOfBirth || registrationData.guardianDateOfBirth || '',
        ssnLast4: (registrationData.ssn || registrationData.guardianSsn || registrationData.contactSsn || '').slice(-4),
        subscriptionPlanId: registrationData.selectedPlanId || null,
        billingCycle: registrationData.billingCycle || 'monthly',
        promoCode: registrationData.promoCode || ''
      }
      console.log('🔍 handleMXSuccess - Request body:', requestBody)
      console.log('🔍 handleMXSuccess - userGuid in request:', currentUserGuid)
      
      // Send MX data to backend to complete registration
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/user/auth/complete-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('🔍 handleMXSuccess - Response status:', response.status)
      
      if (!response.ok) {
        let errorText
        try {
          errorText = await response.text()
        } catch (e) {
          errorText = 'Unknown error occurred'
        }
        console.error('❌ handleMXSuccess - Response error:', errorText)
        throw new Error(`Failed to complete registration: ${errorText}`)
      }
      
      const result = await response.json()
      console.log('🔍 handleMXSuccess - Response result:', result)
      
      if (result.success) {
        // Store the token using the correct format for AuthContext
        setToken(ROLES.USER, result.token)
        
        // Update auth context with user data
        if (result.user) {
          localStorage.setItem('kamioi_user', JSON.stringify(result.user))
        }
        
        // Wait a moment for the state to be updated
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Force page reload to ensure AuthContext re-initializes with the new token
        console.log('Registration completed successfully - reloading page to refresh auth context')
        
        // Redirect to the correct dashboard path based on account type
        let dashboardPath
        const accountType = result.user.account_type
        const userId = result.user.account_number || result.user.id
        
        if (accountType === 'family') {
          dashboardPath = `/family/${userId}/`
        } else if (accountType === 'business') {
          dashboardPath = `/business/${userId}/`
        } else {
          // individual or default
          dashboardPath = `/dashboard/${userId}/`
        }
        
        console.log('Redirecting to dashboard path:', dashboardPath, 'for account type:', accountType)
        window.location.href = dashboardPath
      } else {
        throw new Error(result.error || 'Failed to complete registration')
      }
    } catch (error) {
      console.error('❌ MX completion error:', error)
      const errorMessage = error.message || 'Failed to complete registration'
      alert(`Registration error: ${errorMessage}. Please check your connection and try again.`)
      // Don't block the user - they can try registering again
    }
  }

  const handleMXError = (error) => {
    console.error('❌ MX Connect Error:', error)
    setShowMXConnect(false)
    // Don't block registration if bank connection fails - user can connect later
    alert('Bank connection was not completed. You can connect your bank account later in settings.')
  }

  const handleMXClose = () => {
    console.log('🔒 MX Connect Closed')
    setShowMXConnect(false)
    // If on bank connection step and user closes, allow them to continue without bank connection
    const isBankConnectionStep = (registrationType === 'individual' && registrationStep === 6) ||
                                (registrationType === 'family' && registrationStep === 7) ||
                                (registrationType === 'business' && registrationStep === 8)
      if (isBankConnectionStep) {
      // Account is created, complete registration without MX data
      const guidToUse = userGuidRef.current || userGuid
      if (guidToUse) {
        console.log('🏦 User closed bank connection widget - completing registration without bank connection, userGuid:', guidToUse)
        const mxDataToSend = { accounts: [] }
        handleMXSuccess(mxDataToSend, guidToUse)
      } else {
        console.error('🏦 User closed bank connection widget - but no userGuid available!')
        addNotification({
          id: Date.now(),
          type: 'error',
          title: 'Registration Error',
          message: 'Account information not found. Please try registering again.',
          read: false
        })
      }
    }
  }

  // Show loading spinner while auth is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    )
  }

  // Don't render login form if user is already logged in (will be redirected via useEffect above)
  // Show minimal loading screen while redirect happens
  if (user && isInitialized) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Redirecting to dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              {isDemo ? (
                <Key className="w-8 h-8 text-purple-400" />
              ) : isLogin ? (
                <User className="w-8 h-8 text-purple-400" />
              ) : (
                <Users className="w-8 h-8 text-purple-400" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isDemo ? 'Demo Access' : isLogin ? 'Welcome Back' : 'Join Kamioi'}
            </h1>
            <p className="text-white/70">
              {isDemo
                ? 'Enter your email and demo code to access the dashboard'
                : isLogin
                ? 'Sign in to your account to continue investing'
                : 'Start your investment journey with round-up investing'
              }
            </p>
          </div>

          {/* Toggle between Login, Registration, and Demo */}
          {!registrationType && (
            <div className="flex justify-center mb-8">
              <div className="bg-white/5 rounded-lg p-1 flex border border-white/10">
                <button
                  onClick={() => {
                    setIsLogin(true)
                    setIsDemo(false)
                  }}
                  className={`px-6 py-2 rounded-md transition-all font-medium ${
                    isLogin && !isDemo
                      ? 'bg-purple-600 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsLogin(false)
                    setIsDemo(false)
                  }}
                  className={`px-6 py-2 rounded-md transition-all font-medium ${
                    !isLogin && !isDemo
                      ? 'bg-purple-600 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => {
                    setIsLogin(false)
                    setIsDemo(true)
                  }}
                  className={`px-6 py-2 rounded-md transition-all flex items-center space-x-2 font-medium ${
                    isDemo
                      ? 'bg-purple-600 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>Demo</span>
                </button>
            </div>
          </div>
          )}

          {/* Demo Form */}
          {isDemo && (
            <div className="space-y-6">
              <div>
                <label htmlFor="demo-email" className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  id="demo-email"
                  type="email"
                  value={demoData.email}
                  onChange={(e) => setDemoData({ ...demoData, email: e.target.value })}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                  disabled={demoLoading}
                />
              </div>

              <div>
                <label htmlFor="demo-code" className="block text-sm font-medium text-white mb-2">
                  Demo Code
                </label>
                <div className="relative">
                  <input
                    id="demo-code"
                    type="text"
                    value={demoData.code}
                    onChange={(e) => setDemoData({ ...demoData, code: e.target.value.toUpperCase() })}
                    placeholder="Enter your demo code"
                    className="w-full px-4 pr-10 py-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 font-mono text-center tracking-wider"
                    disabled={demoLoading}
                    autoFocus
                  />
                  <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
                </div>
              </div>

              {demoError && (
                <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{demoError}</span>
                </div>
              )}

              <button
                onClick={async () => {
                  if (!demoData.email || !demoData.code) {
                    setDemoError('Please enter both email and demo code')
                    return
                  }

                  setDemoError('')
                  setDemoLoading(true)

                  try {
                    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                    const response = await fetch(`${apiBaseUrl}/api/demo/validate-code`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ 
                        code: demoData.code.trim().toUpperCase(),
                        email: demoData.email.trim()
                      })
                    })

                    const data = await response.json()

                    if (data.success && data.session) {
                      localStorage.setItem('kamioi_demo_token', data.session.token)
                      localStorage.setItem('kamioi_demo_expires', data.session.expires_at)
                      localStorage.setItem('kamioi_demo_dashboard', data.session.dashboard || 'user')
                      navigate('/demo/dashboard')
                    } else {
                      setDemoError(data.error || 'Invalid demo code. Please check and try again.')
                    }
                  } catch (err) {
                    console.error('Demo code validation error:', err)
                    setDemoError('Failed to validate demo code. Please try again.')
                  } finally {
                    setDemoLoading(false)
                  }
                }}
                disabled={demoLoading || !demoData.email || !demoData.code}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {demoLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <span>Access Demo Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="pt-6 border-t border-white/10">
                <div className="space-y-3 text-sm text-white/70">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Fully interactive demo with real data</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Switch between User, Family, Business, and Admin views</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Session expires after 4 hours of inactivity</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          {isLogin && !registrationType && (
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => handleLoginInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                    placeholder="Enter your email"
                    autoComplete="off"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => handleLoginInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                    placeholder="Enter your password"
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-purple-400 hover:text-purple-300 text-sm underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
                >
                  <User className="w-5 h-5" />
                  <span>Sign In to Dashboard</span>
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-4 text-white/50 text-sm">or</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>

              {/* Admin Login Link */}
              <div className="text-center">
                <button
                  onClick={() => navigate('/admin-login')}
                  className="text-white/70 hover:text-white text-sm underline"
                >
                  Admin Login
                </button>
              </div>
            </div>
          )}

          {/* Account Type Selection - Shows when Sign Up is clicked but no type selected */}
          {!isLogin && !registrationType && !isDemo && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Choose Your Account Type</h2>
                <p className="text-white/70">Select the account type that best fits your needs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Individual Account */}
                <button
                  onClick={() => setRegistrationType('individual')}
                  className="bg-white/10 backdrop-blur-lg p-6 rounded-xl hover:bg-white/15 transition-all duration-200 text-left group border border-white/20 hover:border-purple-500/50"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-400/30 group-hover:scale-110 transition-transform">
                      <User className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Individual</h3>
                  <p className="text-white/70 text-sm mb-4">Perfect for students and young professionals</p>
                  <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                      Personal investing
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                      Round-up investing
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                      AI-powered insights
                    </li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-white font-bold text-lg">{getPriceForAccountType('individual')}</span>
                  </div>
                </button>

                {/* Family Account */}
                <button
                  onClick={() => setRegistrationType('family')}
                  className="bg-white/10 backdrop-blur-lg p-6 rounded-xl hover:bg-white/15 transition-all duration-200 text-left group border border-white/20 hover:border-purple-500/50"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-400/30 group-hover:scale-110 transition-transform">
                      <Users className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Family</h3>
                  <p className="text-white/70 text-sm mb-4">Perfect for families managing finances together</p>
                  <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                      Up to 5 family members
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                      Shared portfolio views
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                      Family financial goals
                    </li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-white font-bold text-lg">{getPriceForAccountType('family')}</span>
                  </div>
                </button>

                {/* Business Account */}
                <button
                  onClick={() => setRegistrationType('business')}
                  className="bg-white/10 backdrop-blur-lg p-6 rounded-xl hover:bg-white/15 transition-all duration-200 text-left group border border-white/20 hover:border-purple-500/50"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-400/30 group-hover:scale-110 transition-transform">
                      <Building2 className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Business</h3>
                  <p className="text-white/70 text-sm mb-4">For businesses and teams</p>
                  <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                      Unlimited team members
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                      Financial analytics
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                      Custom reporting
                    </li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-white font-bold text-lg">{getPriceForAccountType('business')}</span>
                  </div>
                </button>
              </div>

              <div className="text-center pt-6 border-t border-white/10">
                <p className="text-white/60 text-sm">
                  All plans include a 14-day free trial. No credit card required.
                </p>
              </div>
            </div>
          )}

          {/* Registration Forms - Individual */}
          {!isLogin && registrationType === 'individual' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Individual Account</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setRegistrationType(null)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-white/70">
                    Step {registrationStep} of {getTotalSteps()}
                  </span>
        </div>
      </div>

              {/* Step 1: Personal Information */}
              {registrationStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        First Name *
                      </label>
              <input
                type="text"
                        value={individualData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your first name"
                        required
              />
            </div>
        <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Last Name *
                      </label>
          <input
            type="text"
                        value={individualData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your last name"
                        required
          />
        </div>
      </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Email Address *
                      </label>
            <input
              type="email"
                        value={individualData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your email"
                        required
            />
          </div>
          <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Phone Number *
                      </label>
        <input
          type="tel"
                        value={individualData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your phone number"
                        required
        />
                    </div>
      </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Date of Birth
                      </label>
        <input
          type="date"
                        value={individualData.dateOfBirth}
          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
        />
      </div>
      <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Social Security Number
                      </label>
        <input
          type="text"
                        value={individualData.ssn}
          onChange={(e) => handleInputChange('ssn', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
          placeholder="XXX-XX-XXXX"
        />
      </div>
      </div>
      </div>
              )}

              {/* Step 2: Address */}
              {registrationStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Address Information</h3>
      <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Street Address *
                    </label>
            <input
                      type="text"
                      value={individualData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                      placeholder="Enter your street address"
              required
            />
          </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        City *
              </label>
          <input
                        type="text"
                        value={individualData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your city"
            required
          />
      </div>
      <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        State *
            </label>
              <input
                type="text"
                        value={individualData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your state"
                required
            />
          </div>
          <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        ZIP Code *
                      </label>
            <input
              type="text"
                        value={individualData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your ZIP code"
              required
            />
          </div>
        </div>
        </div>
              )}
              
              {/* Step 3: Financial Information */}
              {registrationStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Annual Income *
                      </label>
          <input
            type="number"
                        value={individualData.annualIncome}
                        onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your annual income"
            required
          />
        </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Employment Status *
                      </label>
          <select
                        value={individualData.employmentStatus}
                        onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
            required
                      >
                        <option value="">Select employment status</option>
                        <option value="employed">Employed</option>
                        <option value="self-employed">Self-Employed</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="retired">Retired</option>
                        <option value="student">Student</option>
          </select>
        </div>
      </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Employer
                      </label>
                <input
                  type="text"
                        value={individualData.employer}
                        onChange={(e) => handleInputChange('employer', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your employer"
                />
              </div>
              <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Occupation
                      </label>
                <input
                        type="text"
                        value={individualData.occupation}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your occupation"
                />
              </div>
            </div>
          </div>
              )}
              

              {/* Step 4: Bank Connection */}
              {registrationStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connect Your Bank Account</h3>
                    <p className="text-white/70">
                      Link your bank account to enable round-up investing and automatic transfers.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 min-h-[500px]">
                    {registrationStep === 4 && (
                      <MXConnectWidget
                        key="bank-connection-step-4"
                        userGuid={userGuidRef.current || userGuid}
                        onSuccess={(data) => handleMXSuccess(data, userGuidRef.current || userGuid)}
                        onError={handleMXError}
                        onClose={handleMXClose}
                        isVisible={showMXConnect}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Subscription/Plan Selection (Individual) */}
              {registrationStep === 5 && registrationType === 'individual' && (
                <div className="space-y-4 text-center">
                  <h3 className="text-lg font-medium text-white mb-4">Choose Your Plan</h3>
                  
                  {/* Billing Cycle Toggle */}
                  <div className="flex justify-center mb-6">
                    <div className="bg-white/10 rounded-lg p-1 flex space-x-1">
                      <button
                        type="button"
                        onClick={() => handleInputChange('billingCycle', 'monthly')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          individualData.billingCycle === 'monthly'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('billingCycle', 'yearly')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          individualData.billingCycle === 'yearly'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        Yearly
                        {individualData.billingCycle === 'yearly' && (
                          <span className="ml-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded">Save up to 20%</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {loadingPlans ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-white/70">Loading plans...</p>
                    </div>
                  ) : subscriptionPlans.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-white/70">No subscription plans available at this time.</p>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="grid grid-cols-1 gap-4 max-w-md">
                        {subscriptionPlans.filter(p => p.account_type === 'individual').map((plan) => (
                          <button
                            key={plan.id}
                            onClick={() => {
                              handleInputChange('selectedPlanId', plan.id)
                              handleInputChange('isTrial', true)
                            }}
                            className={`p-6 rounded-lg border-2 transition-all text-left ${
                              individualData.selectedPlanId === plan.id
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-white/20 bg-white/5 hover:border-white/40'
                            }`}
                          >
                            <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                            <div className="mb-2">
                              <span className="text-3xl font-bold text-white">
                                ${individualData.billingCycle === 'monthly' ? (plan.price_monthly || plan.price || 0) : (plan.price_yearly || (plan.price * 10) || 0)}
                              </span>
                              <span className="text-lg text-white/70">/{individualData.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>
                            {individualData.billingCycle === 'yearly' && plan.price_yearly && plan.price_monthly && (
                              <p className="text-sm text-green-400 mb-4">
                                Save ${((plan.price_monthly * 12) - plan.price_yearly).toFixed(2)}/year
                              </p>
                            )}
                            {plan.features && plan.features.length > 0 && (
                              <ul className="space-y-2 text-sm text-gray-300 mt-4">
                                {plan.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-center">
                                    <span className="text-green-400 mr-2">✓</span>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-6 space-y-4">
                    {/* Promo Code */}
                    <div className="flex justify-center">
                      <div className="w-full max-w-md">
                        <label className="block text-sm font-medium text-white/90 mb-2">Promo Code (Optional)</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={individualData.promoCode}
                            onChange={(e) => handleInputChange('promoCode', e.target.value.toUpperCase())}
                            placeholder="Enter promo code"
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!individualData.promoCode) return
                              try {
                                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                                const response = await fetch(`${apiBaseUrl}/api/public/promo-codes/validate`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    promo_code: individualData.promoCode,
                                    plan_id: individualData.selectedPlanId,
                                    account_type: 'individual'
                                  })
                                })
                                const data = await response.json()
                                if (data.success) {
                                  addNotification({
                                    id: Date.now(),
                                    type: 'success',
                                    title: 'Promo Code Applied',
                                    message: `${data.promo_code.discount_type === 'percentage' ? `${data.promo_code.discount_value}% off` : `$${data.promo_code.discount_value} off`}`,
                                    read: false
                                  })
                                } else {
                                  addNotification({
                                    id: Date.now(),
                                    type: 'error',
                                    title: 'Invalid Promo Code',
                                    message: data.error || 'Invalid promo code',
                                    read: false
                                  })
                                }
                              } catch (error) {
                                console.error('Error validating promo code:', error)
                                addNotification({
                                  id: Date.now(),
                                  type: 'error',
                                  title: 'Error',
                                  message: 'Error validating promo code',
                                  read: false
                                })
                              }
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Trial Option */}
                    <div className="flex justify-center">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={individualData.isTrial}
                          onChange={(e) => handleInputChange('isTrial', e.target.checked)}
                          className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-white text-sm">Start with 14-day free trial</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Investment Preferences & Security */}
              {registrationStep === 6 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Investment Preferences & Security</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={individualData.password}
                        onChange={(e) => {
                          const newPassword = e.target.value
                          handleInputChange('password', newPassword)
                          // Validate password strength
                          if (newPassword) {
                            const errors = validatePasswordStrength(newPassword)
                            handleInputChange('passwordErrors', errors)
                          } else {
                            handleInputChange('passwordErrors', [])
                          }
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your password"
                        required
                      />
                      {individualData.passwordErrors && individualData.passwordErrors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {individualData.passwordErrors.map((error, idx) => (
                            <p key={idx} className="text-xs text-red-400">{error}</p>
                          ))}
                        </div>
                      )}
                      {individualData.password && (!individualData.passwordErrors || individualData.passwordErrors.length === 0) && (
                        <p className="mt-2 text-xs text-green-400">✓ Password meets requirements</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        value={individualData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none ${
                          individualData.confirmPassword && individualData.password !== individualData.confirmPassword
                            ? 'border-red-500/50 focus:border-red-500/50'
                            : 'border-white/20 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent'
                        }`}
                        placeholder="Confirm your password"
                        required
                      />
                      {individualData.confirmPassword && individualData.password !== individualData.confirmPassword && (
                        <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
                      )}
                      {individualData.confirmPassword && individualData.password === individualData.confirmPassword && individualData.password && (
                        <p className="mt-2 text-xs text-green-400">✓ Passwords match</p>
                      )}
                    </div>
                  </div>
                  {individualData.password && (
                    <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs text-white/70 mb-2">Password requirements:</p>
                      <ul className="text-xs text-white/70 space-y-1">
                        <li className={individualData.password.length >= 8 ? 'text-green-400' : ''}>
                          {individualData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(individualData.password) ? 'text-green-400' : ''}>
                          {/[A-Z]/.test(individualData.password) ? '✓' : '○'} One uppercase letter
                        </li>
                        <li className={/[a-z]/.test(individualData.password) ? 'text-green-400' : ''}>
                          {/[a-z]/.test(individualData.password) ? '✓' : '○'} One lowercase letter
                        </li>
                        <li className={/[0-9]/.test(individualData.password) ? 'text-green-400' : ''}>
                          {/[0-9]/.test(individualData.password) ? '✓' : '○'} One number
                        </li>
                        <li className={/[!@#$%^&*(),.?":{}|<>]/.test(individualData.password) ? 'text-green-400' : ''}>
                          {/[!@#$%^&*(),.?":{}|<>]/.test(individualData.password) ? '✓' : '○'} One special character
                        </li>
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Round-Up Amount
                      </label>
                      <select
                        value={individualData.roundUpAmount}
                        onChange={(e) => handleInputChange('roundUpAmount', parseFloat(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                      >
                        <option value={0.50}>$0.50</option>
                        <option value={1.00}>$1.00</option>
                        <option value={2.00}>$2.00</option>
                        <option value={5.00}>$5.00</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Risk Tolerance
                      </label>
                      <select
                        value={individualData.riskTolerance}
                        onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                      >
                        <option value="conservative">Conservative</option>
                        <option value="moderate">Moderate</option>
                        <option value="aggressive">Aggressive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Investment Goals (Select all that apply)
                    </label>
                    <div className="space-y-2">
                      {['Retirement', 'Emergency Fund', 'Education', 'Home Purchase', 'Travel', 'Other'].map(goal => (
                        <label key={goal} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={individualData.investmentGoals.includes(goal)}
                            onChange={(e) => handleArrayChange('investmentGoals', goal, e.target.checked)}
                            className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-white">{goal}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={individualData.agreeToTerms}
                        onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                        required
                      />
                      <span className="text-white text-sm">
                        I agree to the <a href="/terms-of-service" className="text-purple-400 hover:underline">Terms of Service</a> *
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={individualData.agreeToPrivacy}
                        onChange={(e) => handleInputChange('agreeToPrivacy', e.target.checked)}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                        required
                      />
                      <span className="text-white text-sm">
                        I agree to the <a href="/privacy-policy" className="text-purple-400 hover:underline">Privacy Policy</a> *
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={individualData.agreeToMarketing}
                        onChange={(e) => handleInputChange('agreeToMarketing', e.target.checked)}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-white text-sm">
                        I would like to receive marketing communications
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={prevStep}
                  disabled={registrationStep === 1}
                  className={`px-6 py-3 rounded-lg transition-all ${
                    registrationStep === 1
                      ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 inline mr-2" />
                  Previous
        </button>
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isStepValid(registrationStep)}
                  className={`px-6 py-3 rounded-lg transition-all ${
                    isStepValid(registrationStep)
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {registrationStep === getTotalSteps() ? 'Create Account' : 'Next'}
                  {registrationStep < getTotalSteps() && <ChevronRight className="w-4 h-4 inline ml-2" />}
                </button>
              </div>
            </form>
          )}

          {/* Registration Forms - Family */}
          {!isLogin && registrationType === 'family' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Family Account</h2>
                <div className="flex items-center space-x-2">
          <button
                    onClick={() => setRegistrationType(null)}
                    className="text-white/70 hover:text-white transition-colors"
          >
                    <ChevronLeft className="w-5 h-5" />
          </button>
                  <span className="text-sm text-white/70">
                    Step {registrationStep} of {getTotalSteps()}
                  </span>
              </div>
            </div>

              {/* Step 1: Primary Guardian Information */}
              {registrationStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Primary Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Guardian First Name *
                      </label>
                      <input
                        type="text"
                        value={familyData.guardianFirstName}
                        onChange={(e) => handleInputChange('guardianFirstName', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter guardian's first name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Guardian Last Name *
                      </label>
                      <input
                        type="text"
                        value={familyData.guardianLastName}
                        onChange={(e) => handleInputChange('guardianLastName', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter guardian's last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Guardian Email *
                      </label>
                      <input
                        type="email"
                        value={familyData.guardianEmail}
                        onChange={(e) => handleInputChange('guardianEmail', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter guardian's email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Guardian Phone *
                      </label>
                      <input
                        type="tel"
                        value={familyData.guardianPhone}
                        onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter guardian's phone"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Guardian Date of Birth
                      </label>
                      <input
                        type="date"
                        value={familyData.guardianDateOfBirth}
                        onChange={(e) => handleInputChange('guardianDateOfBirth', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Guardian SSN
                      </label>
                      <input
                        type="text"
                        value={familyData.guardianSsn}
                        onChange={(e) => handleInputChange('guardianSsn', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="XXX-XX-XXXX"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Address Information */}
              {registrationStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Address Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={familyData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                      placeholder="Enter your street address"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={familyData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your city"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        value={familyData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your state"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        value={familyData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter your ZIP code"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Spouse Information */}
              {registrationStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Spouse Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Spouse First Name
                      </label>
                      <input
                        type="text"
                        value={familyData.spouseFirstName}
                        onChange={(e) => handleInputChange('spouseFirstName', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter spouse's first name (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Spouse Last Name
                      </label>
                      <input
                        type="text"
                        value={familyData.spouseLastName}
                        onChange={(e) => handleInputChange('spouseLastName', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter spouse's last name (optional)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Spouse Email
                      </label>
                      <input
                        type="email"
                        value={familyData.spouseEmail}
                        onChange={(e) => handleInputChange('spouseEmail', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter spouse's email (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Spouse Phone
                      </label>
                      <input
                        type="tel"
                        value={familyData.spousePhone}
                        onChange={(e) => handleInputChange('spousePhone', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter spouse's phone (optional)"
                      />
                    </div>
                  </div>

                  {/* Children Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-white">Children</h4>
                      <button
                        type="button"
                        onClick={addChild}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Add Child
                      </button>
                    </div>
                    
                    {familyData.children.map((child, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-white">Child {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeChild(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              value={child.name}
                              onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm"
                              placeholder="Child's name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Age
                            </label>
                            <input
                              type="number"
                              value={child.age}
                              onChange={(e) => handleChildChange(index, 'age', e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm"
                              placeholder="Age"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Relationship
                            </label>
                            <select
                              value={child.relationship}
                              onChange={(e) => handleChildChange(index, 'relationship', e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm"
                            >
                              <option value="child">Child</option>
                              <option value="stepchild">Stepchild</option>
                              <option value="adopted">Adopted</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Financial Information */}
              {registrationStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Household Income *
                      </label>
                      <input
                        type="number"
                        value={familyData.householdIncome}
                        onChange={(e) => handleInputChange('householdIncome', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter household income"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Employment Status *
                      </label>
                      <select
                        value={familyData.employmentStatus}
                        onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        required
                      >
                        <option value="">Select employment status</option>
                        <option value="both-employed">Both Employed</option>
                        <option value="one-employed">One Employed</option>
                        <option value="self-employed">Self-Employed</option>
                        <option value="retired">Retired</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Employer
                    </label>
                    <input
                      type="text"
                      value={familyData.employer}
                      onChange={(e) => handleInputChange('employer', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                      placeholder="Enter employer name"
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Investment Preferences & Security */}
              {registrationStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Investment Preferences & Security</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={familyData.password}
                        onChange={(e) => {
                          const newPassword = e.target.value
                          handleInputChange('password', newPassword, 'family')
                          // Validate password strength
                          if (newPassword) {
                            const errors = validatePasswordStrength(newPassword)
                            handleInputChange('passwordErrors', errors, 'family')
                          } else {
                            handleInputChange('passwordErrors', [], 'family')
                          }
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Create a strong password"
                        required
                      />
                      {familyData.passwordErrors && familyData.passwordErrors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {familyData.passwordErrors.map((error, idx) => (
                            <p key={idx} className="text-xs text-red-400">{error}</p>
                          ))}
                        </div>
                      )}
                      {familyData.password && (!familyData.passwordErrors || familyData.passwordErrors.length === 0) && (
                        <p className="mt-2 text-xs text-green-400">✓ Password meets requirements</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        value={familyData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value, 'family')}
                        className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none ${
                          familyData.confirmPassword && familyData.password !== familyData.confirmPassword
                            ? 'border-red-500/50 focus:border-red-500/50'
                            : 'border-white/20 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent'
                        }`}
                        placeholder="Confirm your password"
                        required
                      />
                      {familyData.confirmPassword && familyData.password !== familyData.confirmPassword && (
                        <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
                      )}
                      {familyData.confirmPassword && familyData.password === familyData.confirmPassword && familyData.password && (
                        <p className="mt-2 text-xs text-green-400">✓ Passwords match</p>
                      )}
                    </div>
                  </div>
                  {familyData.password && (
                    <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs text-white/70 mb-2">Password requirements:</p>
                      <ul className="text-xs text-white/70 space-y-1">
                        <li className={familyData.password.length >= 8 ? 'text-green-400' : ''}>
                          {familyData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(familyData.password) ? 'text-green-400' : ''}>
                          {/[A-Z]/.test(familyData.password) ? '✓' : '○'} One uppercase letter
                        </li>
                        <li className={/[a-z]/.test(familyData.password) ? 'text-green-400' : ''}>
                          {/[a-z]/.test(familyData.password) ? '✓' : '○'} One lowercase letter
                        </li>
                        <li className={/[0-9]/.test(familyData.password) ? 'text-green-400' : ''}>
                          {/[0-9]/.test(familyData.password) ? '✓' : '○'} One number
                        </li>
                        <li className={/[!@#$%^&*(),.?":{}|<>]/.test(familyData.password) ? 'text-green-400' : ''}>
                          {/[!@#$%^&*(),.?":{}|<>]/.test(familyData.password) ? '✓' : '○'} One special character
                        </li>
                      </ul>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Round-Up Amount
                    </label>
                    <select
                      value={familyData.roundUpAmount}
                      onChange={(e) => handleInputChange('roundUpAmount', parseFloat(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                    >
                      <option value={1.00}>$1.00</option>
                      <option value={1.50}>$1.50</option>
                      <option value={2.00}>$2.00</option>
                      <option value={3.00}>$3.00</option>
                      <option value={5.00}>$5.00</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Risk Tolerance
                    </label>
                    <select
                      value={familyData.riskTolerance}
                      onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                    >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Family Goals (Select all that apply)
                    </label>
                    <div className="space-y-2">
                      {['Children\'s Education', 'Family Vacation', 'Home Purchase', 'Retirement', 'Emergency Fund', 'Other'].map(goal => (
                        <label key={goal} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={familyData.familyGoals.includes(goal)}
                            onChange={(e) => handleArrayChange('familyGoals', goal, e.target.checked)}
                            className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-white">{goal}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={familyData.agreeToTerms}
                        onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                        required
                      />
                      <span className="text-white text-sm">
                        I agree to the <a href="/terms-of-service" className="text-purple-400 hover:underline">Terms of Service</a> *
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={familyData.agreeToPrivacy}
                        onChange={(e) => handleInputChange('agreeToPrivacy', e.target.checked)}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                        required
                      />
                      <span className="text-white text-sm">
                        I agree to the <a href="/privacy-policy" className="text-purple-400 hover:underline">Privacy Policy</a> *
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={familyData.agreeToMarketing}
                        onChange={(e) => handleInputChange('agreeToMarketing', e.target.checked)}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-white text-sm">
                        I would like to receive marketing communications
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 6: Subscription Plan Selection (Family) */}
              {registrationStep === 6 && registrationType === 'family' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white mb-4">Choose Your Subscription Plan</h3>
                  
                  {/* Trial Option */}
                  <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-lg p-6 mb-6">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={familyData.isTrial}
                        onChange={(e) => {
                          handleInputChange('isTrial', e.target.checked)
                          if (e.target.checked) {
                            handleInputChange('selectedPlanId', null)
                          }
                        }}
                        className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-white">Try Free Trial</h4>
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">FREE</span>
                        </div>
                        <p className="text-white/70 text-sm mt-2">
                          Experience the full dashboard in simulation mode. No stocks will be purchased. Perfect for exploring all features risk-free!
                        </p>
                        <p className="text-purple-400 text-xs mt-1">✓ Full dashboard access ✓ Simulated transactions ✓ No commitments</p>
                      </div>
                    </label>
                  </div>

                  {/* Subscription Plans */}
                  {!familyData.isTrial && (
                    <div>
                      {/* Billing Cycle Selector */}
                      <div className="mb-4 flex items-center justify-center space-x-4">
                        <span className="text-white/70 text-sm">Billing Cycle:</span>
                        <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
                          <button
                            type="button"
                            onClick={() => handleInputChange('billingCycle', 'monthly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                              familyData.billingCycle === 'monthly'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            Monthly
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange('billingCycle', 'yearly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                              familyData.billingCycle === 'yearly'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            Yearly
                          </button>
                        </div>
                      </div>
                      <p className="text-white/70 mb-4">Or select a subscription plan:</p>
                      {loadingPlans ? (
                        <div className="text-center py-8">
                          <p className="text-white/70">Loading plans...</p>
                        </div>
                      ) : subscriptionPlans.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-white/70">No subscription plans available at this time.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                          {subscriptionPlans.filter(p => p.account_type === 'family').map((plan) => (
                            <label
                              key={plan.id}
                              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                                familyData.selectedPlanId === plan.id
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : 'border-white/20 bg-white/5 hover:border-blue-500/50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="familyPlan"
                                value={plan.id}
                                checked={familyData.selectedPlanId === plan.id}
                                onChange={(e) => {
                                  handleInputChange('selectedPlanId', parseInt(e.target.value))
                                  handleInputChange('isTrial', false)
                                }}
                                className="sr-only"
                              />
                              <div>
                                <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                                <div className="text-3xl font-bold text-white mb-2">
                                  ${familyData.billingCycle === 'monthly' ? (plan.price_monthly || plan.price || 0) : (plan.price_yearly || (plan.price * 10) || 0)}
                                  <span className="text-lg text-white/70">/{familyData.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                </div>
                                {familyData.billingCycle === 'yearly' && plan.price_yearly && plan.price_monthly && (
                                  <p className="text-sm text-green-400 mb-4">
                                    Save ${((plan.price_monthly * 12) - plan.price_yearly).toFixed(2)}/year
                                  </p>
                                )}
                                {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                                  <ul className="space-y-2 text-sm text-gray-300">
                                    {plan.features.slice(0, 5).map((feature, idx) => (
                                      <li key={idx} className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        {feature}
                                      </li>
                                    ))}
                                    {plan.features.length > 5 && (
                                      <li className="text-white/70">+ {plan.features.length - 5} more features</li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Promo Code */}
                  {!familyData.isTrial && (
                    <div className="mt-6 flex justify-center">
                      <div className="w-full max-w-md">
                        <label className="block text-sm font-medium text-white/90 mb-2">Promo Code (Optional)</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={familyData.promoCode}
                            onChange={(e) => handleInputChange('promoCode', e.target.value.toUpperCase())}
                            placeholder="Enter promo code"
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!familyData.promoCode) return
                              try {
                                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                                const response = await fetch(`${apiBaseUrl}/api/public/promo-codes/validate`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    promo_code: familyData.promoCode,
                                    plan_id: familyData.selectedPlanId,
                                    account_type: 'family'
                                  })
                                })
                                const data = await response.json()
                                if (data.success) {
                                  addNotification({
                                    id: Date.now(),
                                    type: 'success',
                                    title: 'Promo Code Applied',
                                    message: `${data.promo_code.discount_type === 'percentage' ? `${data.promo_code.discount_value}% off` : `$${data.promo_code.discount_value} off`}`,
                                    read: false
                                  })
                                } else {
                                  addNotification({
                                    id: Date.now(),
                                    type: 'error',
                                    title: 'Invalid Promo Code',
                                    message: data.error || 'Invalid promo code',
                                    read: false
                                  })
                                }
                              } catch (error) {
                                console.error('Error validating promo code:', error)
                                addNotification({
                                  id: Date.now(),
                                  type: 'error',
                                  title: 'Error',
                                  message: 'Error validating promo code',
                                  read: false
                                })
                              }
                            }}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 7: Bank Connection (Family) */}
              {registrationStep === 7 && registrationType === 'family' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connect Your Bank Account</h3>
                    <p className="text-white/70">
                      Link your family bank account to enable round-up investing and automatic transfers.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 min-h-[500px]">
                    {registrationStep === 7 && registrationType === 'family' && (
                      <MXConnectWidget
                        key="bank-connection-step-7-family"
                        userGuid={userGuidRef.current || userGuid}
                        onSuccess={(data) => handleMXSuccess(data, userGuidRef.current || userGuid)}
                        onError={handleMXError}
                        onClose={handleMXClose}
                        isVisible={showMXConnect}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={registrationStep === 1}
                  className={`px-6 py-3 rounded-lg transition-all ${
                    registrationStep === 1
                      ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 inline mr-2" />
                  Previous
                </button>
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isStepValid(registrationStep)}
                  className={`px-6 py-3 rounded-lg transition-all ${
                    isStepValid(registrationStep)
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {registrationStep === getTotalSteps() ? 'Create Family Account' : 'Next'}
                  {registrationStep < getTotalSteps() && <ChevronRight className="w-4 h-4 inline ml-2" />}
                </button>
              </div>
            </form>
          )}

          {/* Registration Forms - Business */}
          {!isLogin && registrationType === 'business' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Business Account</h2>
                <div className="flex items-center space-x-2">
          <button
                    onClick={() => setRegistrationType(null)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
          </button>
                  <span className="text-sm text-white/70">
                    Step {registrationStep} of {getTotalSteps()}
                  </span>
        </div>
          </div>
              
              {/* Step 1: Business Information */}
              {registrationStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        value={businessData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter business name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business Type *
                      </label>
                      <select
                        value={businessData.businessType}
                        onChange={(e) => handleInputChange('businessType', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        required
                      >
                        <option value="">Select business type</option>
                        <option value="corporation">Corporation</option>
                        <option value="llc">LLC</option>
                        <option value="partnership">Partnership</option>
                        <option value="sole-proprietorship">Sole Proprietorship</option>
                        <option value="non-profit">Non-Profit</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Business Address *
                    </label>
                    <input
                      type="text"
                      value={businessData.businessAddress}
                      onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                      placeholder="Enter business address"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business City *
                      </label>
                      <input
                        type="text"
                        value={businessData.businessCity}
                        onChange={(e) => handleInputChange('businessCity', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter business city"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business State *
                      </label>
                      <input
                        type="text"
                        value={businessData.businessState}
                        onChange={(e) => handleInputChange('businessState', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter business state"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business ZIP Code *
                      </label>
                      <input
                        type="text"
                        value={businessData.businessZipCode}
                        onChange={(e) => handleInputChange('businessZipCode', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter business ZIP code"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Business Contact & Details */}
              {registrationStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Business Contact & Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business Phone *
                      </label>
                      <input
                        type="tel"
                        value={businessData.businessPhone}
                        onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter business phone"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business Email *
                      </label>
                      <input
                        type="email"
                        value={businessData.businessEmail}
                        onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter business email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Business Website
                    </label>
                    <input
                      type="url"
                      value={businessData.businessWebsite}
                      onChange={(e) => handleInputChange('businessWebsite', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                      placeholder="https://www.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Business Description
                    </label>
                    <textarea
                      value={businessData.businessDescription}
                      onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                      placeholder="Describe your business"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business Industry *
                      </label>
                      <select
                        value={businessData.businessIndustry}
                        onChange={(e) => handleInputChange('businessIndustry', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        required
                      >
                        <option value="">Select industry</option>
                        <option value="technology">Technology</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="finance">Finance</option>
                        <option value="retail">Retail</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="consulting">Consulting</option>
                        <option value="real-estate">Real Estate</option>
                        <option value="education">Education</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business Size *
                      </label>
                      <select
                        value={businessData.businessSize}
                        onChange={(e) => handleInputChange('businessSize', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        required
                      >
                        <option value="">Select business size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Primary Contact Information */}
              {registrationStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Primary Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Contact First Name *
                      </label>
                      <input
                        type="text"
                        value={businessData.contactFirstName}
                        onChange={(e) => handleInputChange('contactFirstName', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter contact's first name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Contact Last Name *
                      </label>
                      <input
                        type="text"
                        value={businessData.contactLastName}
                        onChange={(e) => handleInputChange('contactLastName', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter contact's last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        value={businessData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter contact's email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        value={businessData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter contact's phone"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Contact Title
                      </label>
                      <input
                        type="text"
                        value={businessData.contactTitle}
                        onChange={(e) => handleInputChange('contactTitle', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="e.g., CEO, Manager, Owner"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Contact SSN
                      </label>
                      <input
                        type="text"
                        value={businessData.contactSsn}
                        onChange={(e) => handleInputChange('contactSsn', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="XXX-XX-XXXX"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Financial Information */}
              {registrationStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Annual Revenue *
                      </label>
                      <input
                        type="number"
                        value={businessData.annualRevenue}
                        onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter annual revenue"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Number of Employees *
                      </label>
                      <input
                        type="number"
                        value={businessData.numberOfEmployees}
                        onChange={(e) => handleInputChange('numberOfEmployees', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter number of employees"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business Bank Account
                      </label>
                      <input
                        type="text"
                        value={businessData.businessBankAccount}
                        onChange={(e) => handleInputChange('businessBankAccount', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter bank account info"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business Credit Score
                      </label>
                      <input
                        type="number"
                        value={businessData.businessCreditScore}
                        onChange={(e) => handleInputChange('businessCreditScore', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter credit score"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Business Documentation */}
              {registrationStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Business Documentation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business Tax ID *
                      </label>
                      <input
                        type="text"
                        value={businessData.businessTaxId}
                        onChange={(e) => handleInputChange('businessTaxId', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter business tax ID"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Business License *
                      </label>
                      <input
                        type="text"
                        value={businessData.businessLicense}
                        onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Enter business license number"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Investment Preferences & Security */}
              {registrationStep === 6 && registrationType === 'business' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Investment Preferences & Security</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={businessData.password}
                        onChange={(e) => {
                          const newPassword = e.target.value
                          handleInputChange('password', newPassword, 'business')
                          // Validate password strength
                          if (newPassword) {
                            const errors = validatePasswordStrength(newPassword)
                            handleInputChange('passwordErrors', errors, 'business')
                          } else {
                            handleInputChange('passwordErrors', [], 'business')
                          }
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                        placeholder="Create a strong password"
                        required
                      />
                      {businessData.passwordErrors && businessData.passwordErrors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {businessData.passwordErrors.map((error, idx) => (
                            <p key={idx} className="text-xs text-red-400">{error}</p>
                          ))}
                        </div>
                      )}
                      {businessData.password && (!businessData.passwordErrors || businessData.passwordErrors.length === 0) && (
                        <p className="mt-2 text-xs text-green-400">✓ Password meets requirements</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        value={businessData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value, 'business')}
                        className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none ${
                          businessData.confirmPassword && businessData.password !== businessData.confirmPassword
                            ? 'border-red-500/50 focus:border-red-500/50'
                            : 'border-white/20 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent'
                        }`}
                        placeholder="Confirm your password"
                        required
                      />
                      {businessData.confirmPassword && businessData.password !== businessData.confirmPassword && (
                        <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
                      )}
                      {businessData.confirmPassword && businessData.password === businessData.confirmPassword && businessData.password && (
                        <p className="mt-2 text-xs text-green-400">✓ Passwords match</p>
                      )}
                    </div>
                  </div>
                  {businessData.password && (
                    <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs text-white/70 mb-2">Password requirements:</p>
                      <ul className="text-xs text-white/70 space-y-1">
                        <li className={businessData.password.length >= 8 ? 'text-green-400' : ''}>
                          {businessData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(businessData.password) ? 'text-green-400' : ''}>
                          {/[A-Z]/.test(businessData.password) ? '✓' : '○'} One uppercase letter
                        </li>
                        <li className={/[a-z]/.test(businessData.password) ? 'text-green-400' : ''}>
                          {/[a-z]/.test(businessData.password) ? '✓' : '○'} One lowercase letter
                        </li>
                        <li className={/[0-9]/.test(businessData.password) ? 'text-green-400' : ''}>
                          {/[0-9]/.test(businessData.password) ? '✓' : '○'} One number
                        </li>
                        <li className={/[!@#$%^&*(),.?":{}|<>]/.test(businessData.password) ? 'text-green-400' : ''}>
                          {/[!@#$%^&*(),.?":{}|<>]/.test(businessData.password) ? '✓' : '○'} One special character
                        </li>
                      </ul>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Round-Up Amount
                    </label>
                    <select
                      value={businessData.roundUpAmount}
                      onChange={(e) => handleInputChange('roundUpAmount', parseFloat(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                    >
                      <option value={2.00}>$2.00</option>
                      <option value={3.00}>$3.00</option>
                      <option value={5.00}>$5.00</option>
                      <option value={10.00}>$10.00</option>
                      <option value={25.00}>$25.00</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Risk Tolerance
                    </label>
                    <select
                      value={businessData.riskTolerance}
                      onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                    >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Business Goals (Select all that apply)
                    </label>
                    <div className="space-y-2">
                      {['Business Expansion', 'Equipment Purchase', 'Employee Benefits', 'Retirement Planning', 'Emergency Fund', 'Market Research', 'Other'].map(goal => (
                        <label key={goal} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={businessData.businessGoals.includes(goal)}
                            onChange={(e) => handleArrayChange('businessGoals', goal, e.target.checked)}
                            className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-white">{goal}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={businessData.agreeToTerms}
                        onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                        required
                      />
                      <span className="text-white text-sm">
                        I agree to the <a href="/terms-of-service" className="text-purple-400 hover:underline">Terms of Service</a> *
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={businessData.agreeToPrivacy}
                        onChange={(e) => handleInputChange('agreeToPrivacy', e.target.checked)}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                        required
                      />
                      <span className="text-white text-sm">
                        I agree to the <a href="/privacy-policy" className="text-purple-400 hover:underline">Privacy Policy</a> *
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={businessData.agreeToMarketing}
                        onChange={(e) => handleInputChange('agreeToMarketing', e.target.checked)}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-white text-sm">
                        I would like to receive marketing communications
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 7: Subscription Plan Selection (Business) */}
              {registrationStep === 7 && registrationType === 'business' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white mb-4">Choose Your Subscription Plan</h3>
                  
                  {/* Trial Option */}
                  <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-lg p-6 mb-6">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={businessData.isTrial}
                        onChange={(e) => {
                          handleInputChange('isTrial', e.target.checked)
                          if (e.target.checked) {
                            handleInputChange('selectedPlanId', null)
                          }
                        }}
                        className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-white">Try Free Trial</h4>
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">FREE</span>
                        </div>
                        <p className="text-white/70 text-sm mt-2">
                          Experience the full dashboard in simulation mode. No stocks will be purchased. Perfect for exploring all features risk-free!
                        </p>
                        <p className="text-purple-400 text-xs mt-1">✓ Full dashboard access ✓ Simulated transactions ✓ No commitments</p>
                      </div>
                    </label>
                  </div>

                  {/* Subscription Plans */}
                  {!businessData.isTrial && (
                    <div>
                      {/* Billing Cycle Selector */}
                      <div className="mb-4 flex items-center justify-center space-x-4">
                        <span className="text-white/70 text-sm">Billing Cycle:</span>
                        <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
                          <button
                            type="button"
                            onClick={() => handleInputChange('billingCycle', 'monthly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                              businessData.billingCycle === 'monthly'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            Monthly
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange('billingCycle', 'yearly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                              businessData.billingCycle === 'yearly'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            Yearly
                          </button>
                        </div>
                      </div>
                      <p className="text-white/70 mb-4">Or select a subscription plan:</p>
                      {loadingPlans ? (
                        <div className="text-center py-8">
                          <p className="text-white/70">Loading plans...</p>
                        </div>
                      ) : subscriptionPlans.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-white/70">No subscription plans available at this time.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                          {subscriptionPlans.filter(p => p.account_type === 'business').map((plan) => (
                            <label
                              key={plan.id}
                              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                                businessData.selectedPlanId === plan.id
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : 'border-white/20 bg-white/5 hover:border-blue-500/50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="businessPlan"
                                value={plan.id}
                                checked={businessData.selectedPlanId === plan.id}
                                onChange={(e) => {
                                  handleInputChange('selectedPlanId', parseInt(e.target.value))
                                  handleInputChange('isTrial', false)
                                }}
                                className="sr-only"
                              />
                              <div>
                                <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                                <div className="text-3xl font-bold text-white mb-2">
                                  ${businessData.billingCycle === 'monthly' ? (plan.price_monthly || plan.price || 0) : (plan.price_yearly || (plan.price * 10) || 0)}
                                  <span className="text-lg text-white/70">/{businessData.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                </div>
                                {businessData.billingCycle === 'yearly' && plan.price_yearly && plan.price_monthly && (
                                  <p className="text-sm text-green-400 mb-4">
                                    Save ${((plan.price_monthly * 12) - plan.price_yearly).toFixed(2)}/year
                                  </p>
                                )}
                                {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                                  <ul className="space-y-2 text-sm text-gray-300">
                                    {plan.features.slice(0, 5).map((feature, idx) => (
                                      <li key={idx} className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        {feature}
                                      </li>
                                    ))}
                                    {plan.features.length > 5 && (
                                      <li className="text-white/70">+ {plan.features.length - 5} more features</li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Promo Code */}
                  {!businessData.isTrial && (
                    <div className="mt-6 flex justify-center">
                      <div className="w-full max-w-md">
                        <label className="block text-sm font-medium text-white/90 mb-2">Promo Code (Optional)</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={businessData.promoCode}
                            onChange={(e) => handleInputChange('promoCode', e.target.value.toUpperCase())}
                            placeholder="Enter promo code"
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!businessData.promoCode) return
                              try {
                                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                                const response = await fetch(`${apiBaseUrl}/api/public/promo-codes/validate`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    promo_code: businessData.promoCode,
                                    plan_id: businessData.selectedPlanId,
                                    account_type: 'business'
                                  })
                                })
                                const data = await response.json()
                                if (data.success) {
                                  addNotification({
                                    id: Date.now(),
                                    type: 'success',
                                    title: 'Promo Code Applied',
                                    message: `${data.promo_code.discount_type === 'percentage' ? `${data.promo_code.discount_value}% off` : `$${data.promo_code.discount_value} off`}`,
                                    read: false
                                  })
                                } else {
                                  addNotification({
                                    id: Date.now(),
                                    type: 'error',
                                    title: 'Invalid Promo Code',
                                    message: data.error || 'Invalid promo code',
                                    read: false
                                  })
                                }
                              } catch (error) {
                                console.error('Error validating promo code:', error)
                                addNotification({
                                  id: Date.now(),
                                  type: 'error',
                                  title: 'Error',
                                  message: 'Error validating promo code',
                                  read: false
                                })
                              }
                            }}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 8: Bank Connection (Business) */}
              {registrationStep === 8 && registrationType === 'business' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connect Your Bank Account</h3>
                    <p className="text-white/70">
                      Link your business bank account to enable round-ups and automatic transfers.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 min-h-[500px]">
                    {registrationStep === 8 && registrationType === 'business' && (
                      <MXConnectWidget
                        key="bank-connection-step-8-business"
                        userGuid={userGuidRef.current || userGuid}
                        onSuccess={(data) => handleMXSuccess(data, userGuidRef.current || userGuid)}
                        onError={handleMXError}
                        onClose={handleMXClose}
                        isVisible={showMXConnect}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={registrationStep === 1}
                  className={`px-6 py-3 rounded-lg transition-all ${
                    registrationStep === 1
                      ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 inline mr-2" />
                  Previous
                </button>
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isStepValid(registrationStep)}
                  className={`px-6 py-3 rounded-lg transition-all ${
                    isStepValid(registrationStep)
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {registrationStep === getTotalSteps() ? 'Create Business Account' : 'Next'}
                  {registrationStep < getTotalSteps() && <ChevronRight className="w-4 h-4 inline ml-2" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>


      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-2xl border border-blue-500/20 max-w-md w-full p-6">
            <ForgotPassword 
              onBack={() => setShowForgotPassword(false)}
              onSuccess={() => setShowForgotPassword(false)}
            />
          </div>
        </div>
      )}

      {/* Success/Error Notification Modal - Glass Effect */}
      {showNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
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
                <h3 className="text-lg font-semibold text-white mb-1">
                  {notificationType === 'success' ? 'Success' : 'Login Error'}
                </h3>
                <p className="text-gray-300">
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
    </div>
  )
}

export default Login
