import React, { useState, useEffect } from 'react'
import { Moon, Sun, Settings as SettingsIcon, Calendar, Upload, Eye, EyeOff, Shield, Phone, MapPin, CreditCard, User, Bell, Cloud, Smartphone, CheckCircle, XCircle } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import ProfileAvatar from '../common/ProfileAvatar'
import notificationService from '../../services/notificationService'
import { useNotifications } from '../../hooks/useNotifications'

const AdminSettings = ({ user }) => {
  const { addNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState('profile')
  const { toggleTheme, isDarkMode } = useTheme()
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: true
  })
  const [showPassword, setShowPassword] = useState(false)
  const [profileData, setProfileData] = useState({
    adminName: '',
    adminEmail: user?.email || '',
    phone: '',
    adminCode: 'ADMIN2024',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    },
    adminLevel: 'Super Admin',
    last4SSN: '',
    pepStatus: false,
    roundUpPreference: 1,
    investmentGoal: 'Platform Growth',
    riskPreference: 'Moderate',
    notificationPrefs: {
      email: true,
      sms: false,
      push: true
    },
    gamification: true
  })

  // 2FA states
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [showSetup2FA, setShowSetup2FA] = useState(false)
  const [qrCodeData, setQrCodeData] = useState(null)
  const [totpSecret, setTotpSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [setupError, setSetupError] = useState('')

  // Check 2FA status on mount
  useEffect(() => {
    const check2FAStatus = async () => {
      if (!user?.id) return

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const token = localStorage.getItem('kamioi_admin_token')

        const response = await fetch(`${apiBaseUrl}/api/admin/auth/2fa/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()
        if (data.success) {
          setTwoFAEnabled(data.enabled)
        }
      } catch (err) {
        console.error('Error checking 2FA status:', err)
      }
    }

    check2FAStatus()
  }, [user?.id])

  const handleSaveProfile = () => {
    addNotification({
      type: 'success',
      title: 'Profile Saved',
      message: 'Admin profile saved successfully!',
      timestamp: new Date()
    })
  }

  const handleChangePassword = () => {
    addNotification({
      type: 'info',
      title: 'Change Password',
      message: 'Admin password change functionality would be implemented here',
      timestamp: new Date()
    })
  }

  const handleSetup2FA = async () => {
    setTwoFALoading(true)
    setSetupError('')

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const token = localStorage.getItem('kamioi_admin_token')

      const response = await fetch(`${apiBaseUrl}/api/admin/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setQrCodeData(data.qr_code)
        setTotpSecret(data.secret)
        setShowSetup2FA(true)
      } else {
        setSetupError(data.error || 'Failed to setup 2FA')
      }
    } catch (err) {
      console.error('Error setting up 2FA:', err)
      setSetupError('Network error. Please try again.')
    } finally {
      setTwoFALoading(false)
    }
  }

  const handleEnable2FA = async () => {
    if (verificationCode.length !== 6) {
      setSetupError('Please enter a 6-digit code')
      return
    }

    setTwoFALoading(true)
    setSetupError('')

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const token = localStorage.getItem('kamioi_admin_token')

      const response = await fetch(`${apiBaseUrl}/api/admin/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: verificationCode
        })
      })

      const data = await response.json()

      if (data.success) {
        setTwoFAEnabled(true)
        setShowSetup2FA(false)
        setVerificationCode('')
        setQrCodeData(null)
        setTotpSecret('')
        addNotification({
          type: 'success',
          title: '2FA Enabled',
          message: 'Two-factor authentication has been enabled for your account.',
          timestamp: new Date()
        })
      } else {
        setSetupError(data.error || 'Invalid verification code')
      }
    } catch (err) {
      console.error('Error enabling 2FA:', err)
      setSetupError('Network error. Please try again.')
    } finally {
      setTwoFALoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return
    }

    setTwoFALoading(true)

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const token = localStorage.getItem('kamioi_admin_token')

      const response = await fetch(`${apiBaseUrl}/api/admin/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setTwoFAEnabled(false)
        addNotification({
          type: 'info',
          title: '2FA Disabled',
          message: 'Two-factor authentication has been disabled.',
          timestamp: new Date()
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: data.error || 'Failed to disable 2FA',
          timestamp: new Date()
        })
      }
    } catch (err) {
      console.error('Error disabling 2FA:', err)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Network error. Please try again.',
        timestamp: new Date()
      })
    } finally {
      setTwoFALoading(false)
    }
  }

  const handleCancelSetup = () => {
    setShowSetup2FA(false)
    setVerificationCode('')
    setQrCodeData(null)
    setTotpSecret('')
    setSetupError('')
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your admin account? This action cannot be undone.')) {
      addNotification({
        type: 'info',
        title: 'Delete Account',
        message: 'Admin account deletion functionality would be implemented here',
        timestamp: new Date()
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
            <SettingsIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Settings</h2>
            <p className="text-gray-300">Manage your admin account preferences and security</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {[
            { id: 'profile', label: 'Admin Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'appearance', label: 'Appearance', icon: isDarkMode ? Sun : Moon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
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
          {/* Admin Profile Picture Section */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Admin Profile Picture
            </h3>
            <div className="flex items-center space-x-6">
              <ProfileAvatar
                user={{...user, accountType: 'admin'}}
                size="2xl"
                showUploadOnHover={false}
                dashboardType="admin"
                onImageUpdate={(imageUrl) => {
                  console.log('Admin profile image updated in settings:', imageUrl)
                  if (imageUrl) {
                    notificationService.createSystemNotification('system_alert', {
                      title: 'Admin Profile Picture Updated',
                      message: 'Your admin profile picture has been updated successfully.',
                      type: 'success',
                      icon: '📸',
                      priority: 'normal',
                      dashboardType: 'admin'
                    })
                  } else {
                    notificationService.createSystemNotification('system_alert', {
                      title: 'Admin Profile Picture Removed',
                      message: 'Your admin profile picture has been removed.',
                      type: 'info',
                      icon: '🗑️',
                      priority: 'normal',
                      dashboardType: 'admin'
                    })
                  }
                }}
              />
              <div>
                <h4 className="text-white font-medium mb-2">Upload Admin Profile Picture</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Add an admin profile picture to personalize your administrator account. Your image will be visible across all admin dashboards.
                </p>
                <div className="text-xs text-gray-500">
                  <p>• Supported formats: JPG, PNG, GIF, WebP</p>
                  <p>• Maximum file size: 5MB</p>
                  <p>• Recommended: Square images (1:1 ratio)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Information */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Admin Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Admin Name</label>
                <input
                  type="text"
                  value={profileData.adminName}
                  onChange={(e) => setProfileData({...profileData, adminName: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Admin Email (Unique)</label>
                <input
                  type="email"
                  value={profileData.adminEmail}
                  onChange={(e) => setProfileData({...profileData, adminEmail: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Admin Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new admin password"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
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
                <label className="block text-gray-400 text-sm mb-2">Admin Phone (E.164)</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  placeholder="+1234567890"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                />
              </div>
            </div>
          </div>

          {/* Admin Demographics & Compliance */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Admin Demographics & Compliance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Admin Level</label>
                <select
                  value={profileData.adminLevel}
                  onChange={(e) => setProfileData({...profileData, adminLevel: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500/50"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Support">Support</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Admin Code</label>
                <input
                  type="text"
                  value={profileData.adminCode}
                  onChange={(e) => setProfileData({...profileData, adminCode: e.target.value})}
                  placeholder="ADMIN2024"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Admin Last 4 SSN or Gov't ID</label>
                <input
                  type="text"
                  value={profileData.last4SSN}
                  onChange={(e) => setProfileData({...profileData, last4SSN: e.target.value})}
                  placeholder="1234"
                  maxLength="4"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
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

          {/* Admin Address */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Admin Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-2">Street Address</label>
                <input
                  type="text"
                  value={profileData.address.street}
                  onChange={(e) => setProfileData({...profileData, address: {...profileData.address, street: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">City</label>
                <input
                  type="text"
                  value={profileData.address.city}
                  onChange={(e) => setProfileData({...profileData, address: {...profileData.address, city: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">State</label>
                <input
                  type="text"
                  value={profileData.address.state}
                  onChange={(e) => setProfileData({...profileData, address: {...profileData.address, state: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={profileData.address.zip}
                  onChange={(e) => setProfileData({...profileData, address: {...profileData.address, zip: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Country</label>
                <select
                  value={profileData.address.country}
                  onChange={(e) => setProfileData({...profileData, address: {...profileData.address, country: e.target.value}})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500/50"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Admin Financial Preferences */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Admin Financial Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Admin Round-Up Preference</label>
                <select
                  value={profileData.roundUpPreference}
                  onChange={(e) => setProfileData({...profileData, roundUpPreference: parseInt(e.target.value)})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500/50"
                >
                  <option value={1}>$1</option>
                  <option value={2}>$2</option>
                  <option value={3}>$3</option>
                  <option value={5}>$5 (Custom)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Admin Investment Goal</label>
                <select
                  value={profileData.investmentGoal}
                  onChange={(e) => setProfileData({...profileData, investmentGoal: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500/50"
                >
                  <option value="Platform Growth">Platform Growth</option>
                  <option value="Admin Emergency">Admin Emergency</option>
                  <option value="Admin Expansion">Admin Expansion</option>
                  <option value="Admin Innovation">Admin Innovation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Admin Risk Preference</label>
                <select
                  value={profileData.riskPreference}
                  onChange={(e) => setProfileData({...profileData, riskPreference: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500/50"
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
                <label htmlFor="gamification" className="text-gray-400 text-sm">Admin Gamification (Badges) - On by default</label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Save Admin Profile
            </button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Admin Notification Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-gray-400 text-sm">Receive admin updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-gray-400 text-sm">Receive admin updates via text message</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-gray-400 text-sm">Receive admin push notifications on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Admin Marketing Communications</p>
                  <p className="text-gray-400 text-sm">Receive admin promotional emails and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.marketing}
                    onChange={(e) => setNotifications({...notifications, marketing: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
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
              Admin Security Settings
            </h3>
            <div className="space-y-4">
              {/* 2FA Section */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${twoFAEnabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <Smartphone className={`w-5 h-5 ${twoFAEnabled ? 'text-green-400' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-medium">Two-Factor Authentication</p>
                      {twoFAEnabled ? (
                        <span className="flex items-center text-green-400 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Enabled
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-400 text-xs">
                          <XCircle className="w-3 h-3 mr-1" />
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {twoFAEnabled
                        ? 'Your account is protected with Google Authenticator'
                        : 'Add an extra layer of security using Google Authenticator'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={twoFAEnabled ? handleDisable2FA : handleSetup2FA}
                  disabled={twoFALoading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    twoFAEnabled
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50`}
                >
                  {twoFALoading ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Loading...
                    </span>
                  ) : twoFAEnabled ? (
                    'Disable 2FA'
                  ) : (
                    'Enable 2FA'
                  )}
                </button>
              </div>

              {/* 2FA Setup Modal */}
              {showSetup2FA && (
                <div className="p-6 bg-white/5 rounded-lg border border-white/20 space-y-4">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-white mb-2">Setup Two-Factor Authentication</h4>
                    <p className="text-gray-400 text-sm">
                      Scan the QR code below with Google Authenticator app
                    </p>
                  </div>

                  {/* QR Code */}
                  {qrCodeData && (
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg">
                        <img src={qrCodeData} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                    </div>
                  )}

                  {/* Manual Entry */}
                  {totpSecret && (
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-2">Or enter this code manually:</p>
                      <code className="bg-white/10 px-4 py-2 rounded text-white font-mono text-sm">
                        {totpSecret}
                      </code>
                    </div>
                  )}

                  {/* Verification Input */}
                  <div className="max-w-xs mx-auto">
                    <label className="block text-gray-400 text-sm mb-2 text-center">
                      Enter the 6-digit code from the app
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setVerificationCode(value)
                        setSetupError('')
                      }}
                      maxLength={6}
                      placeholder="000000"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-red-500/50 font-mono"
                    />
                  </div>

                  {/* Error */}
                  {setupError && (
                    <div className="text-center text-red-400 text-sm">
                      {setupError}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={handleCancelSetup}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEnable2FA}
                      disabled={twoFALoading || verificationCode.length !== 6}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {twoFALoading ? 'Verifying...' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>
              )}

              {/* Change Password */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Change Admin Password</p>
                  <p className="text-gray-400 text-sm">Update your admin account password</p>
                </div>
                <button
                  onClick={handleChangePassword}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Change Admin Password
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Admin Connected Devices</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">iPhone 15 Pro (Admin)</p>
                  <p className="text-gray-400 text-sm">Last active: 2 hours ago</p>
                </div>
                <button className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Chrome Browser (Admin)</p>
                  <p className="text-gray-400 text-sm">Last active: 1 day ago</p>
                </div>
                <button className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 text-red-400">Admin Danger Zone</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Delete Admin Account</p>
                  <p className="text-gray-400 text-sm">Permanently delete your admin account and all data</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Admin Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Admin Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Theme</p>
                <p className="text-gray-400 text-sm">Choose between dark and light mode for your admin dashboard</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white transition-colors"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSettings
