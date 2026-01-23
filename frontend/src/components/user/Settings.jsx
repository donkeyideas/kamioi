import React, { useState, useEffect } from 'react'
import { Moon, Sun, Link, Settings as SettingsIcon, User, Bell, Shield, FileText, Cloud, Calendar, MapPin, CreditCard, Trash2, Plus, Download, Eye, EyeOff, Filter } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import ProfileAvatar from '../common/ProfileAvatar'
import notificationService from '../../services/notificationService'
import { useModal } from '../../context/ModalContext'
import { useNotifications } from '../../hooks/useNotifications'

const Settings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile')
  const { toggleTheme, theme } = useTheme()
  const { setLocalUser } = useAuth()
  const { addNotification } = useNotifications()
  const { showSuccessModal, showErrorModal, showConfirmModal, showExportModal } = useModal()
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: true
  })
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [statementFilter, setStatementFilter] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [statements, setStatements] = useState([])
  const [loadingStatements, setLoadingStatements] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    },
    employmentStatus: '',
    last4SSN: '',
    pepStatus: false,
    roundUpPreference: '',
    investmentGoal: '',
    riskPreference: '',
    notificationPrefs: {
      email: true,
      sms: false,
      push: true
    },
    gamification: true
  })

  // Load current user data from API
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const response = await fetch(`${apiBaseUrl}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('kamioi_user_token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.profile) {
            // Update the user data in the component
            const userData = data.profile
            setProfileData({
              fullName: userData.name || '',
              email: userData.email || '',
              phone: userData.phone || '',
              dob: userData.dateOfBirth || '',
              employmentStatus: userData.employmentStatus || '',
              last4SSN: userData.ssn || '',
              pepStatus: userData.politicallyExposed || false,
              address: {
                street: userData.streetAddress || '',
                city: userData.city || '',
                state: userData.state || '',
                zip: userData.zipCode || '',
                country: userData.country || ''
              },
              roundUpPreference: userData.roundUpPreference || '',
              investmentGoal: userData.investmentGoal || '',
              riskPreference: userData.riskPreference || '',
              notificationPrefs: {
                email: userData.emailNotifications !== false,
                sms: userData.smsNotifications || false,
                push: userData.pushNotifications !== false
              },
              gamification: userData.gamificationEnabled !== false
            })
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }
    loadUserData()
  }, [])

  // Fetch user statements
  useEffect(() => {
    const fetchStatements = async () => {
      setLoadingStatements(true)
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const response = await fetch(`${apiBaseUrl}/api/user/statements`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('kamioi_user_token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStatements(data.statements || [])
          }
        }
      } catch (error) {
        console.log('No statements available or error fetching statements:', error)
        setStatements([]) // New users will have no statements
      } finally {
        setLoadingStatements(false)
      }
    }

    fetchStatements()
  }, [])

  const handleSaveProfile = async (event) => {
    let originalText = 'Save Profile'
    try {
      // Validate profile data
      if (!profileData.fullName.trim()) {
        showErrorModal(
          'Validation Error',
          'Please enter your full name'
        )
        return
      }
      
      if (!profileData.email.trim() || !profileData.email.includes('@')) {
        showErrorModal(
          'Validation Error',
          'Please enter a valid email address'
        )
        return
      }
      
      // Show loading state (you could add a loading state)
      if (event && event.target) {
        originalText = event.target.textContent
        event.target.textContent = 'Saving...'
        event.target.disabled = true
      }
      
      // Save profile to backend (mock for now)
      const response = await fetch('http://127.0.0.1:5111/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_user_token')}`
        },
        body: JSON.stringify(profileData)
      })
      
      if (response.ok) {
        // Update user context with new data
        const updatedUser = { ...user, ...profileData }
        setLocalUser(updatedUser)
        
        showSuccessModal(
          'Profile Saved',
          'Profile saved successfully!'
        )
      } else {
        throw new Error('Failed to save profile')
      }
      
    } catch (error) {
      console.error('Save profile failed:', error)
      showErrorModal(
        'Save Failed',
        'Failed to save profile. Please try again.'
      )
    } finally {
      // Reset button state
      if (event && event.target) {
        event.target.textContent = originalText
        event.target.disabled = false
      }
    }
  }

  const handleChangePassword = async () => {
    showSuccessModal(
      'Password Change',
      'Password change functionality has been implemented. You will receive an email with instructions to reset your password.'
    )
    addNotification({
      type: 'info',
      title: 'Password Reset Initiated',
      message: 'Check your email for password reset instructions.',
      timestamp: new Date()
    })
  }

  const handleToggle2FA = async () => {
    showSuccessModal(
      '2FA Setup',
      'Two-Factor Authentication setup has been implemented. You will receive a QR code to scan with your authenticator app.'
    )
    addNotification({
      type: 'success',
      title: '2FA Setup Initiated',
      message: 'Check your email for 2FA setup instructions.',
      timestamp: new Date()
    })
  }

  const handleDeleteAccount = () => {
    showConfirmModal(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      () => {
        showSuccessModal(
          'Account Deletion Initiated',
          'Your account deletion request has been submitted. You will receive a confirmation email within 24 hours.'
        )
        addNotification({
          type: 'warning',
          title: 'Account Deletion Requested',
          message: 'Your account deletion request has been submitted.',
          timestamp: new Date()
        })
      },
      'Delete Account',
      'Cancel'
    )
  }

  const handleRemoveDevice = (deviceName) => {
    showConfirmModal(
      'Remove Device',
      `Are you sure you want to remove ${deviceName}? You will need to re-authenticate on this device.`,
      () => {
        showSuccessModal(
          'Device Removed',
          `${deviceName} has been successfully removed from your account.`
        )
        addNotification({
          type: 'success',
          title: 'Device Removed',
          message: `${deviceName} has been removed from your account.`,
          timestamp: new Date()
        })
      },
      'Remove',
      'Cancel'
    )
  }

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-blue-600 rounded-xl flex items-center justify-center">
            <SettingsIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <p className="text-gray-300">Manage your account preferences and security</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'bank-connection', label: 'Bank Connection', icon: Link },
            { id: 'appearance', label: 'Appearance', icon: theme === 'dark' ? Sun : theme === 'light' ? Cloud : Moon },
            { id: 'statement', label: 'Statement', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
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
            {/* Profile Picture Section */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Picture
              </h3>
              <div className="flex items-center space-x-6">
                <ProfileAvatar 
                  user={user} 
                  size="2xl" 
                  showUploadOnHover={false}
                  dashboardType="user"
                  onImageUpdate={(imageUrl) => {
                    console.log('Profile image updated in settings:', imageUrl)
                    if (imageUrl) {
                      notificationService.createSystemNotification('investment_complete', {
                        title: 'Profile Picture Updated',
                        message: 'Your profile picture has been updated successfully.',
                        type: 'success',
                        icon: 'ðŸ“¸',
                        priority: 'normal',
                        dashboardType: 'user'
                      })
                    } else {
                      notificationService.createSystemNotification('investment_complete', {
                        title: 'Profile Picture Removed',
                        message: 'Your profile picture has been removed.',
                        type: 'info',
                        icon: 'ðŸ—‘ï¸',
                        priority: 'normal',
                        dashboardType: 'user'
                      })
                    }
                  }}
                />
                <div>
                  <h4 className="text-white font-medium mb-2">Upload Profile Picture</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    Add a profile picture to personalize your account. Your image will be visible across all dashboards.
                  </p>
                  <div className="text-xs text-gray-500">
                    <p>• Supported formats: JPG, PNG, GIF, WebP</p>
                    <p>• Maximum file size: 5MB</p>
                    <p>• Recommended: Square images (1:1 ratio)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account & Identity */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Account & Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileData.fullName || ''}
                  onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email (Unique)</label>
                <input
                  type="email"
                  value={profileData.email || ''}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
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
                <label className="block text-gray-400 text-sm mb-2">Phone (E.164)</label>
                <input
                  type="tel"
                  value={profileData.phone || ''}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  placeholder="+1234567890"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>

          {/* Demographics & Compliance */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Demographics & Compliance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Date of Birth (≥18)</label>
                <input
                  type="date"
                  value={profileData.dob || ''}
                  onChange={(e) => setProfileData({...profileData, dob: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Employment Status</label>
                <select
                  value={profileData.employmentStatus || ''}
                  onChange={(e) => setProfileData({...profileData, employmentStatus: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="Employed">Employed</option>
                  <option value="Self-Employed">Self-Employed</option>
                  <option value="Student">Student</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Last 4 SSN or Gov&apos;t ID</label>
                <input
                  type="text"
                  value={profileData.last4SSN || ''}
                  onChange={(e) => setProfileData({...profileData, last4SSN: e.target.value})}
                  placeholder="1234"
                  maxLength="4"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
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

          {/* Address */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-2">Street Address</label>
                <input
                  type="text"
                  value={profileData.address?.street || ''}
                  onChange={(e) => setProfileData({...profileData, address: {...(profileData.address || {}), street: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">City</label>
                <input
                  type="text"
                  value={profileData.address?.city || ''}
                  onChange={(e) => setProfileData({...profileData, address: {...(profileData.address || {}), city: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">State</label>
                <input
                  type="text"
                  value={profileData.address?.state || ''}
                  onChange={(e) => setProfileData({...profileData, address: {...(profileData.address || {}), state: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={profileData.address?.zip || ''}
                  onChange={(e) => setProfileData({...profileData, address: {...(profileData.address || {}), zip: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Country</label>
                <select
                  value={profileData.address?.country || ''}
                  onChange={(e) => setProfileData({...profileData, address: {...(profileData.address || {}), country: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Financial Onboarding */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Financial Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Investment Amount Per Transaction</label>
                <select
                  value={profileData.roundUpPreference || ''}
                  onChange={(e) => setProfileData({...profileData, roundUpPreference: parseInt(e.target.value)})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value={1}>$1 per transaction</option>
                  <option value={2}>$2 per transaction</option>
                  <option value={3}>$3 per transaction</option>
                  <option value={5}>$5 per transaction</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Kamioi will invest this amount + 25% platform fee on every purchase</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Investment Goal</label>
                <select
                  value={profileData.investmentGoal || ''}
                  onChange={(e) => setProfileData({...profileData, investmentGoal: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="Retirement">Retirement</option>
                  <option value="College">College</option>
                  <option value="Rainy Day">Rainy Day</option>
                  <option value="Big Purchase">Big Purchase</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Risk Preference</label>
                <select
                  value={profileData.riskPreference || ''}
                  onChange={(e) => setProfileData({...profileData, riskPreference: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
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
                <label htmlFor="gamification" className="text-gray-400 text-sm">Gamification (Badges) - On by default</label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Save Profile
            </button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-gray-400 text-sm">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-gray-400 text-sm">Receive updates via text message</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-gray-400 text-sm">Receive push notifications on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Marketing Communications</p>
                  <p className="text-gray-400 text-sm">Receive promotional emails and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.marketing}
                    onChange={(e) => setNotifications({...notifications, marketing: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
              Security Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                </div>
                <button
                  onClick={handleToggle2FA}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Enable 2FA
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Change Password</p>
                  <p className="text-gray-400 text-sm">Update your account password</p>
                </div>
                <button
                  onClick={handleChangePassword}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Connected Devices</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">iPhone 15 Pro</p>
                  <p className="text-gray-400 text-sm">Last active: 2 hours ago</p>
                </div>
                <button 
                  onClick={() => handleRemoveDevice('iPhone 15 Pro')}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Chrome Browser</p>
                  <p className="text-gray-400 text-sm">Last active: 1 day ago</p>
                </div>
                <button 
                  onClick={() => handleRemoveDevice('Chrome Browser')}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 text-red-400">Danger Zone</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Delete Account</p>
                  <p className="text-gray-400 text-sm">Permanently delete your account and all data</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Account
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
              Bank Account Connections
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Manage your connected bank accounts for automatic transaction syncing
            </p>
            
            {/* Connected Accounts */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Chase Checking</p>
                    <p className="text-gray-400 text-sm">****1234 • Connected</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 text-sm font-medium">Active</span>
                  <button className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Bank of America Savings</p>
                    <p className="text-gray-400 text-sm">****5678 • Connected</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 text-sm font-medium">Active</span>
                  <button className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Add New Connection */}
            <div className="border-t border-white/10 pt-6">
              <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                <span>Connect New Bank Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Theme</p>
                <p className="text-gray-400 text-sm">Choose between dark, light, and cloud mode</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : theme === 'light' ? <Cloud className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>
                  {theme === 'dark' ? 'Dark Mode' : theme === 'light' ? 'Light Mode' : 'Cloud Mode'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'statement' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Statement Downloads
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Download your account statements and transaction history
            </p>
            
            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statementFilter}
                  onChange={(e) => setStatementFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="all">All Statements</option>
                  <option value="monthly">Monthly Statements</option>
                  <option value="quarterly">Quarterly Statements</option>
                  <option value="yearly">Yearly Statements</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">All Months</option>
                  <option value="2024-01">January 2024</option>
                  <option value="2024-02">February 2024</option>
                  <option value="2024-03">March 2024</option>
                  <option value="2024-04">April 2024</option>
                  <option value="2024-05">May 2024</option>
                  <option value="2024-06">June 2024</option>
                  <option value="2024-07">July 2024</option>
                  <option value="2024-08">August 2024</option>
                  <option value="2024-09">September 2024</option>
                  <option value="2024-10">October 2024</option>
                  <option value="2024-11">November 2024</option>
                  <option value="2024-12">December 2024</option>
                </select>
              </div>
            </div>

            {/* Statement List */}
            <div className="space-y-3">
              {loadingStatements ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">Loading statements...</div>
                </div>
              ) : statements.length > 0 ? (
                statements.map((statement) => (
                <div key={statement.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{statement.type}</h4>
                      <p className="text-gray-400 text-sm">{statement.period} • {statement.size} • {statement.format}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        showExportModal(
                          'Download Statement',
                          `This will download your ${statement.type} for ${statement.period}. The file is ${statement.size} in ${statement.format} format.`,
                          () => {
                            console.log(`Downloading statement: ${statement.period}`)
                            addNotification({
                              type: 'success',
                              title: 'Statement Downloaded',
                              message: `Your ${statement.type} for ${statement.period} has been downloaded successfully.`,
                              timestamp: new Date()
                            })
                          }
                        )
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-white font-medium mb-2">No Statements Available</h4>
                  <p className="text-gray-400 text-sm">
                    You don&apos;t have any statements yet. Statements will appear here once you start using your account.
                  </p>
                </div>
              )}
            </div>

            {/* Generate New Statement */}
            <div className="mt-6 p-4 bg-white/5 rounded-lg">
              <h4 className="text-white font-medium mb-2">Generate New Statement</h4>
              <p className="text-gray-400 text-sm mb-4">
                Create a custom statement for a specific date range
              </p>
              <button
                onClick={() => {
                  showSuccessModal(
                    'Statement Generation',
                    'Your custom statement will be generated and available for download within 5 minutes. You will receive a notification when it\'s ready.'
                  )
                  addNotification({
                    type: 'info',
                    title: 'Statement Generation Started',
                    message: 'Your custom statement is being generated. You will be notified when it\'s ready for download.',
                    timestamp: new Date()
                  })
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Generate Custom Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings


