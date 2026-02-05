import React, { useState, useEffect } from 'react'
import { Settings, Save, Users, Building2, AlertTriangle, CheckCircle, RefreshCw, Phone, Info, Lock, User, Briefcase, Shield, ShieldCheck, ShieldOff, Eye, EyeOff, Key } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const SystemSettings = ({ user }) => {
  const { isLightMode, isDarkMode, isCloudMode } = useTheme()
  const [activeTab, setActiveTab] = useState('system')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 2FA state
  const [twoFAStatus, setTwoFAStatus] = useState({ enabled: false, available: false })
  const [twoFASetup, setTwoFASetup] = useState(null) // { qr_code, secret }
  const [twoFAVerifyCode, setTwoFAVerifyCode] = useState('')
  const [twoFADisablePassword, setTwoFADisablePassword] = useState('')
  const [twoFADisableCode, setTwoFADisableCode] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [twoFAError, setTwoFAError] = useState(null)
  const [twoFASuccess, setTwoFASuccess] = useState(null)
  
  // System configuration state
  const [systemConfig, setSystemConfig] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    apiRateLimit: 1000,
    maxUsers: 10000,
    securityLevel: 'high',
    version: '1.0.0',
    backupFrequency: 'daily'
  })
  
  // Business settings state
  const [businessSettings, setBusinessSettings] = useState({
    companyName: '',
    supportEmail: '',
    website: '',
    address: '',
    phone: '',
    description: ''
  })

  // Access controls state for login page
  const [accessControls, setAccessControls] = useState({
    signInEnabled: true,
    signUpEnabled: true,
    demoOnly: false,
    allowedAccountTypes: ['individual', 'family', 'business']
  })

  const getTextColor = () => (isLightMode ? 'text-gray-800' : 'text-white')
  const getSubtextClass = () => (isLightMode ? 'text-gray-600' : 'text-gray-400')
  const getCardClass = () => `bg-white/10 backdrop-blur-xl rounded-lg shadow-lg p-6 border border-white/20 ${isLightMode ? 'bg-opacity-80' : 'bg-opacity-10'}`

  const fetchSystemSettings = async (signal = null) => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('authToken') || 'admin_token_3'
      
      // OPTIMIZED: Parallelize API calls for better performance
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const [systemResponse, businessResponse, accessResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/settings/system`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal
        }),
        fetch(`${apiBaseUrl}/api/admin/settings/business`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal
        }),
        fetch(`${apiBaseUrl}/api/admin/settings/access-controls`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal
        })
      ])
      
      if (signal?.aborted) return
      
      if (systemResponse.ok) {
        const systemResult = await systemResponse.json()
        if (systemResult.success && systemResult.settings) {
          setSystemConfig({...systemConfig, ...systemResult.settings})
        }
      }

      if (businessResponse.ok) {
        const businessResult = await businessResponse.json()
        if (businessResult.success && businessResult.settings) {
          setBusinessSettings({...businessSettings, ...businessResult.settings})
        }
      } else {
        // Business settings endpoint doesn't exist - that's okay, use defaults
        console.log('Business settings endpoint not available, using defaults')
      }

      if (accessResponse.ok) {
        const accessResult = await accessResponse.json()
        if (accessResult.success && accessResult.settings) {
          setAccessControls({
            signInEnabled: accessResult.settings.sign_in_enabled !== false,
            signUpEnabled: accessResult.settings.sign_up_enabled !== false,
            demoOnly: accessResult.settings.demo_only === true,
            allowedAccountTypes: accessResult.settings.allowed_account_types || ['individual', 'family', 'business']
          })
        }
      } else {
        console.log('Access controls endpoint not available, using defaults')
      }
      
      if (!signal?.aborted) {
        // Dispatch page load completion event for Loading Report
        window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
          detail: { pageId: 'settings' }
        }))
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching system settings:', err)
        setError('Failed to load system settings')
        // Still dispatch completion event even on error
        if (!signal?.aborted) {
          window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
            detail: { pageId: 'settings' }
          }))
        }
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  const saveSystemConfig = async () => {
    setIsSaving(true)
    setSaveStatus(null)
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/settings/system`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(systemConfig)
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSaveStatus('success')
          setTimeout(() => setSaveStatus(null), 3000)
        } else {
          setSaveStatus('error')
        }
      } else {
        setSaveStatus('error')
      }
    } catch (err) {
      console.error('Error saving system config:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const saveBusinessSettings = async () => {
    setIsSaving(true)
    setSaveStatus(null)
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/settings/business`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(businessSettings)
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSaveStatus('success')
          setTimeout(() => setSaveStatus(null), 3000)
        } else {
          setSaveStatus('error')
        }
      } else {
        setSaveStatus('error')
      }
    } catch (err) {
      console.error('Error saving business settings:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const saveAccessControls = async () => {
    setIsSaving(true)
    setSaveStatus(null)
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/settings/access-controls`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sign_in_enabled: accessControls.signInEnabled,
          sign_up_enabled: accessControls.signUpEnabled,
          demo_only: accessControls.demoOnly,
          allowed_account_types: accessControls.allowedAccountTypes
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSaveStatus('success')
          setTimeout(() => setSaveStatus(null), 3000)
        } else {
          setSaveStatus('error')
        }
      } else {
        setSaveStatus('error')
      }
    } catch (err) {
      console.error('Error saving access controls:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleAccountType = (type) => {
    setAccessControls(prev => {
      const current = prev.allowedAccountTypes || []
      if (current.includes(type)) {
        // Remove if already included (but keep at least one)
        const filtered = current.filter(t => t !== type)
        return { ...prev, allowedAccountTypes: filtered.length > 0 ? filtered : [type] }
      } else {
        // Add if not included
        return { ...prev, allowedAccountTypes: [...current, type] }
      }
    })
  }

  // 2FA Functions
  const fetch2FAStatus = async () => {
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/2fa/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTwoFAStatus({ enabled: result.enabled, available: result.available })
        }
      }
    } catch (err) {
      console.error('Error fetching 2FA status:', err)
    }
  }

  const setup2FA = async () => {
    setTwoFALoading(true)
    setTwoFAError(null)
    setTwoFASuccess(null)
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/2fa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      if (result.success) {
        setTwoFASetup({ qr_code: result.qr_code, secret: result.secret })
      } else {
        setTwoFAError(result.error || 'Failed to setup 2FA')
      }
    } catch (err) {
      setTwoFAError('Failed to connect to server')
    } finally {
      setTwoFALoading(false)
    }
  }

  const verify2FA = async () => {
    if (!twoFAVerifyCode || twoFAVerifyCode.length !== 6) {
      setTwoFAError('Please enter a 6-digit verification code')
      return
    }
    setTwoFALoading(true)
    setTwoFAError(null)
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: twoFAVerifyCode })
      })
      const result = await response.json()
      if (result.success) {
        setTwoFASuccess('Two-factor authentication has been enabled!')
        setTwoFAStatus({ ...twoFAStatus, enabled: true })
        setTwoFASetup(null)
        setTwoFAVerifyCode('')
        setTimeout(() => setTwoFASuccess(null), 5000)
      } else {
        setTwoFAError(result.error || 'Invalid verification code')
      }
    } catch (err) {
      setTwoFAError('Failed to verify code')
    } finally {
      setTwoFALoading(false)
    }
  }

  const disable2FA = async () => {
    if (!twoFADisablePassword) {
      setTwoFAError('Please enter your password')
      return
    }
    if (twoFAStatus.enabled && !twoFADisableCode) {
      setTwoFAError('Please enter your current 2FA code')
      return
    }
    setTwoFALoading(true)
    setTwoFAError(null)
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: twoFADisablePassword, code: twoFADisableCode })
      })
      const result = await response.json()
      if (result.success) {
        setTwoFASuccess('Two-factor authentication has been disabled')
        setTwoFAStatus({ ...twoFAStatus, enabled: false })
        setTwoFADisablePassword('')
        setTwoFADisableCode('')
        setTimeout(() => setTwoFASuccess(null), 5000)
      } else {
        setTwoFAError(result.error || 'Failed to disable 2FA')
      }
    } catch (err) {
      setTwoFAError('Failed to connect to server')
    } finally {
      setTwoFALoading(false)
    }
  }

  const cancelSetup = () => {
    setTwoFASetup(null)
    setTwoFAVerifyCode('')
    setTwoFAError(null)
  }

  useEffect(() => {
    const abortController = new AbortController()
    fetchSystemSettings(abortController.signal)
    fetch2FAStatus()

    return () => {
      abortController.abort()
    }
  }, [])

  const renderSystemConfigTab = () => (
    <div className="space-y-6">
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-4 flex items-center space-x-2`}>
          <Settings className="w-5 h-5" />
          <span>System Configuration</span>
        </h3>
        <p className={`${getSubtextClass()} mb-6`}>Configure global system settings and preferences.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className={`block text-sm font-medium ${getTextColor()}`}>Maintenance Mode</label>
                <p className={`text-xs ${getSubtextClass()}`}>Enable maintenance mode to restrict access</p>
              </div>
              <button
                onClick={() => setSystemConfig({...systemConfig, maintenanceMode: !(systemConfig?.maintenanceMode || false)})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  (systemConfig?.maintenanceMode || false) ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    (systemConfig?.maintenanceMode || false) ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className={`block text-sm font-medium ${getTextColor()}`}>Registration Enabled</label>
                <p className={`text-xs ${getSubtextClass()}`}>Allow new user registrations</p>
              </div>
              <button
                onClick={() => setSystemConfig({...systemConfig, registrationEnabled: !(systemConfig?.registrationEnabled !== false)})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  (systemConfig?.registrationEnabled !== false) ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    (systemConfig?.registrationEnabled !== false) ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>API Rate Limit</label>
              <input
                type="number"
                value={systemConfig?.apiRateLimit || 1000}
                onChange={(e) => setSystemConfig({...systemConfig, apiRateLimit: parseInt(e.target.value) || 1000})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className={`text-xs ${getSubtextClass()} mt-1`}>Requests per hour per user</p>
            </div>

            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Max Users</label>
              <input
                type="number"
                value={systemConfig?.maxUsers || 10000}
                onChange={(e) => setSystemConfig({...systemConfig, maxUsers: parseInt(e.target.value) || 10000})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className={`text-xs ${getSubtextClass()} mt-1`}>Maximum number of users allowed</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Security Level</label>
              <select
                value={systemConfig?.securityLevel || 'high'}
                onChange={(e) => setSystemConfig({...systemConfig, securityLevel: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Version</label>
              <input
                type="text"
                value={systemConfig?.version || '1.0.0'}
                onChange={(e) => setSystemConfig({...systemConfig, version: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Backup Frequency</label>
              <select
                value={systemConfig?.backupFrequency || 'daily'}
                onChange={(e) => setSystemConfig({...systemConfig, backupFrequency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={saveSystemConfig}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save System Config'}</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderBusinessInfoTab = () => (
    <div className="space-y-6">
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-4 flex items-center space-x-2`}>
          <Building2 className="w-5 h-5" />
          <span>Business Information</span>
        </h3>
        <p className={`${getSubtextClass()} mb-6`}>Configure your business details and contact information.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Company Name</label>
              <input
                type="text"
                value={businessSettings.companyName}
                onChange={(e) => setBusinessSettings({...businessSettings, companyName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Support Email</label>
              <input
                type="email"
                value={businessSettings.supportEmail}
                onChange={(e) => setBusinessSettings({...businessSettings, supportEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="support@company.com"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Website</label>
              <input
                type="url"
                value={businessSettings.website}
                onChange={(e) => setBusinessSettings({...businessSettings, website: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://company.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Phone</label>
              <input
                type="tel"
                value={businessSettings.phone}
                onChange={(e) => setBusinessSettings({...businessSettings, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Address</label>
              <textarea
                value={businessSettings.address}
                onChange={(e) => setBusinessSettings({...businessSettings, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Enter business address"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Description</label>
              <textarea
                value={businessSettings.description}
                onChange={(e) => setBusinessSettings({...businessSettings, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Brief description of your business"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={saveBusinessSettings}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Business Info'}</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderAccessControlsTab = () => (
    <div className="space-y-6">
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-4 flex items-center space-x-2`}>
          <Lock className="w-5 h-5" />
          <span>Login Page Access Controls</span>
        </h3>
        <p className={`${getSubtextClass()} mb-6`}>Control which authentication options are available on the login page.</p>

        {/* Main Toggle - Demo Only Mode */}
        <div className="mb-8 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <label className={`block text-sm font-medium ${getTextColor()}`}>Demo Only Mode</label>
              <p className={`text-xs ${getSubtextClass()}`}>When enabled, only the Demo tab is visible (hides Sign In & Sign Up)</p>
            </div>
            <button
              onClick={() => setAccessControls({...accessControls, demoOnly: !accessControls.demoOnly})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                accessControls.demoOnly ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  accessControls.demoOnly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Individual Tab Controls */}
        <div className={`space-y-4 ${accessControls.demoOnly ? 'opacity-50 pointer-events-none' : ''}`}>
          <h4 className={`text-sm font-semibold ${getTextColor()} mb-3`}>Tab Visibility</h4>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-blue-400" />
              <div>
                <label className={`block text-sm font-medium ${getTextColor()}`}>Sign In Tab</label>
                <p className={`text-xs ${getSubtextClass()}`}>Allow existing users to sign in</p>
              </div>
            </div>
            <button
              onClick={() => setAccessControls({...accessControls, signInEnabled: !accessControls.signInEnabled})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                accessControls.signInEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  accessControls.signInEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-green-400" />
              <div>
                <label className={`block text-sm font-medium ${getTextColor()}`}>Sign Up Tab</label>
                <p className={`text-xs ${getSubtextClass()}`}>Allow new user registrations</p>
              </div>
            </div>
            <button
              onClick={() => setAccessControls({...accessControls, signUpEnabled: !accessControls.signUpEnabled})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                accessControls.signUpEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  accessControls.signUpEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Account Type Controls */}
        <div className={`mt-8 ${accessControls.demoOnly || !accessControls.signUpEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <h4 className={`text-sm font-semibold ${getTextColor()} mb-3`}>Allowed Account Types for Sign Up</h4>
          <p className={`text-xs ${getSubtextClass()} mb-4`}>Select which account types users can create during registration</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Individual */}
            <button
              onClick={() => toggleAccountType('individual')}
              className={`p-4 rounded-lg border-2 transition-all ${
                accessControls.allowedAccountTypes?.includes('individual')
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-500/30 bg-white/5 hover:border-gray-400'
              }`}
            >
              <User className={`w-8 h-8 mx-auto mb-2 ${
                accessControls.allowedAccountTypes?.includes('individual') ? 'text-blue-400' : 'text-gray-400'
              }`} />
              <p className={`font-medium ${getTextColor()}`}>Individual</p>
              <p className={`text-xs ${getSubtextClass()}`}>Personal accounts</p>
            </button>

            {/* Family */}
            <button
              onClick={() => toggleAccountType('family')}
              className={`p-4 rounded-lg border-2 transition-all ${
                accessControls.allowedAccountTypes?.includes('family')
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-gray-500/30 bg-white/5 hover:border-gray-400'
              }`}
            >
              <Users className={`w-8 h-8 mx-auto mb-2 ${
                accessControls.allowedAccountTypes?.includes('family') ? 'text-green-400' : 'text-gray-400'
              }`} />
              <p className={`font-medium ${getTextColor()}`}>Family</p>
              <p className={`text-xs ${getSubtextClass()}`}>Family accounts</p>
            </button>

            {/* Business */}
            <button
              onClick={() => toggleAccountType('business')}
              className={`p-4 rounded-lg border-2 transition-all ${
                accessControls.allowedAccountTypes?.includes('business')
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-500/30 bg-white/5 hover:border-gray-400'
              }`}
            >
              <Briefcase className={`w-8 h-8 mx-auto mb-2 ${
                accessControls.allowedAccountTypes?.includes('business') ? 'text-purple-400' : 'text-gray-400'
              }`} />
              <p className={`font-medium ${getTextColor()}`}>Business</p>
              <p className={`text-xs ${getSubtextClass()}`}>Business accounts</p>
            </button>
          </div>
        </div>

        {/* Current Status Summary */}
        <div className="mt-8 p-4 bg-white/5 rounded-lg">
          <h4 className={`text-sm font-semibold ${getTextColor()} mb-2`}>Current Configuration</h4>
          <div className="space-y-1 text-sm">
            <p className={getSubtextClass()}>
              <span className="font-medium">Visible Tabs:</span>{' '}
              {accessControls.demoOnly ? (
                <span className="text-yellow-400">Demo Only</span>
              ) : (
                [
                  accessControls.signInEnabled && 'Sign In',
                  accessControls.signUpEnabled && 'Sign Up',
                  'Demo'
                ].filter(Boolean).join(', ')
              )}
            </p>
            {!accessControls.demoOnly && accessControls.signUpEnabled && (
              <p className={getSubtextClass()}>
                <span className="font-medium">Available Account Types:</span>{' '}
                {accessControls.allowedAccountTypes?.length > 0
                  ? accessControls.allowedAccountTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')
                  : 'None selected'}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={saveAccessControls}
            disabled={isSaving}
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Access Controls'}</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-4 flex items-center space-x-2`}>
          <Shield className="w-5 h-5" />
          <span>Two-Factor Authentication (2FA)</span>
        </h3>
        <p className={`${getSubtextClass()} mb-6`}>
          Add an extra layer of security to your admin account using a Time-based One-Time Password (TOTP) authenticator app.
        </p>

        {/* Error/Success Messages */}
        {twoFAError && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{twoFAError}</span>
          </div>
        )}
        {twoFASuccess && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-300">{twoFASuccess}</span>
          </div>
        )}

        {/* 2FA Status */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {twoFAStatus.enabled ? (
                <ShieldCheck className="w-8 h-8 text-green-400" />
              ) : (
                <ShieldOff className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <p className={`font-medium ${getTextColor()}`}>
                  {twoFAStatus.enabled ? 'Two-Factor Authentication Enabled' : 'Two-Factor Authentication Disabled'}
                </p>
                <p className={`text-sm ${getSubtextClass()}`}>
                  {twoFAStatus.enabled
                    ? 'Your account is protected with 2FA'
                    : 'Enable 2FA to add extra security to your account'}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              twoFAStatus.enabled
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {twoFAStatus.enabled ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {!twoFAStatus.available ? (
          <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300">2FA is not available on this server. Please contact your administrator.</p>
          </div>
        ) : twoFAStatus.enabled ? (
          /* Disable 2FA Form */
          <div className="space-y-4">
            <h4 className={`text-sm font-semibold ${getTextColor()}`}>Disable Two-Factor Authentication</h4>
            <p className={`text-sm ${getSubtextClass()}`}>
              To disable 2FA, enter your password and current 2FA code for verification.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Password</label>
                <input
                  type="password"
                  value={twoFADisablePassword}
                  onChange={(e) => setTwoFADisablePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 bg-white/10 border border-gray-500/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Current 2FA Code</label>
                <input
                  type="text"
                  value={twoFADisableCode}
                  onChange={(e) => setTwoFADisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-white/10 border border-gray-500/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-lg tracking-widest"
                />
              </div>
            </div>

            <button
              onClick={disable2FA}
              disabled={twoFALoading}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {twoFALoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldOff className="w-4 h-4" />
              )}
              <span>{twoFALoading ? 'Disabling...' : 'Disable 2FA'}</span>
            </button>
          </div>
        ) : twoFASetup ? (
          /* 2FA Setup In Progress */
          <div className="space-y-6">
            <h4 className={`text-sm font-semibold ${getTextColor()}`}>Setup Two-Factor Authentication</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code */}
              <div className="text-center">
                <p className={`text-sm ${getSubtextClass()} mb-4`}>
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={twoFASetup.qr_code} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              </div>

              {/* Manual Entry */}
              <div>
                <p className={`text-sm ${getSubtextClass()} mb-4`}>
                  Or manually enter this secret key in your authenticator app:
                </p>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${getTextColor()}`}>Secret Key</label>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-gray-400 hover:text-white"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <code className={`block text-sm ${showSecret ? 'text-green-400' : 'blur-sm'} bg-black/30 p-2 rounded font-mono break-all`}>
                    {twoFASetup.secret}
                  </code>
                  {showSecret && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(twoFASetup.secret)
                        setTwoFASuccess('Secret key copied to clipboard')
                        setTimeout(() => setTwoFASuccess(null), 2000)
                      }}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                    >
                      Click to copy
                    </button>
                  )}
                </div>

                {/* Verification Input */}
                <div className="mt-6">
                  <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                    Enter the 6-digit code from your app to verify
                  </label>
                  <input
                    type="text"
                    value={twoFAVerifyCode}
                    onChange={(e) => setTwoFAVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-white/10 border border-gray-500/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelSetup}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={verify2FA}
                disabled={twoFALoading || twoFAVerifyCode.length !== 6}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {twoFALoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{twoFALoading ? 'Verifying...' : 'Enable 2FA'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Enable 2FA Button */
          <div>
            <button
              onClick={setup2FA}
              disabled={twoFALoading}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {twoFALoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Key className="w-5 h-5" />
              )}
              <span>{twoFALoading ? 'Setting up...' : 'Set Up Two-Factor Authentication'}</span>
            </button>
            <p className={`text-sm ${getSubtextClass()} mt-2`}>
              You will need an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className={`text-lg ${getTextColor()}`}>Loading system settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className={`text-lg ${getTextColor()}`}>{error}</p>
          <button 
            onClick={fetchSystemSettings}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Settings</h1>
          <p className="text-gray-400 mt-1">Configure global system settings and business information</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'system'
              ? 'bg-blue-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          System Config
        </button>
        <button
          onClick={() => setActiveTab('business')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'business'
              ? 'bg-blue-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Business Info
        </button>
        <button
          onClick={() => setActiveTab('access')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'access'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Access Controls
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'security'
              ? 'bg-green-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Security
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'system' && renderSystemConfigTab()}
      {activeTab === 'business' && renderBusinessInfoTab()}
      {activeTab === 'access' && renderAccessControlsTab()}
      {activeTab === 'security' && renderSecurityTab()}

      {/* Save Status */}
      {saveStatus && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          saveStatus === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {saveStatus === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>
              {saveStatus === 'success' ? 'Settings saved successfully!' : 'Failed to save settings'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemSettings