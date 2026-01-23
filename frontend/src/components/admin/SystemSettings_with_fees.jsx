import React, { useState, useEffect } from 'react'
import { Settings, Save, DollarSign, Users, Building2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const SystemSettings = () => {
  const { isLightMode } = useTheme()
  const [activeTab, setActiveTab] = useState('system')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
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

  const [feeSettings, setFeeSettings] = useState({
    individual: { isActive: true, type: 'fixed', amount: 0.25 },
    family: { isActive: true, type: 'fixed', amount: 0.25 },
    business: { isActive: true, type: 'fixed', amount: 0.25 }
  })


  const getTextColor = () => (isLightMode ? 'text-gray-800' : 'text-white')
  const getSubtextClass = () => (isLightMode ? 'text-gray-600' : 'text-gray-400')
  const getCardClass = () => `bg-white/10 backdrop-blur-xl rounded-lg shadow-lg p-6 border border-white/20 ${isLightMode ? 'bg-opacity-80' : 'bg-opacity-10'}`

  const fetchSystemSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('authToken') || 'admin_token_3'
      
      // Fetch fee settings
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const feesResponse = await fetch(`${apiBaseUrl}/api/admin/settings/fees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (feesResponse.ok) {
        const feesResult = await feesResponse.json()
        if (feesResult.success && feesResult.fees) {
          setFeeSettings(prevSettings => ({
            ...prevSettings,
            ...feesResult.fees
          }))
        }
      }

      // Fetch system settings
      const systemResponse = await fetch(`${apiBaseUrl}/api/admin/settings/system`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (systemResponse.ok) {
        const systemResult = await systemResponse.json()
        if (systemResult.success) {
          setSystemConfig(systemResult.settings)
        }
      }
      
    } catch (err) {
      console.error('Error fetching system settings:', err)
      setError('Failed to load system settings')
    } finally {
      setLoading(false)
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

  const saveFeeSettings = async () => {
    setIsSaving(true)
    setSaveStatus(null)
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/settings/fees`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feeSettings)
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
      console.error('Error saving fee settings:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    fetchSystemSettings()
  }, [])

  const renderFeesTab = () => {
    const calculateFee = (amount, accountType) => {
      const settings = feeSettings[accountType]
      if (!settings.isActive) return 0
      
      if (settings.type === 'fixed') {
        return settings.amount
      } else {
        return (amount * settings.amount) / 100
      }
    }

    const previewAmounts = [10, 25, 50, 100, 250, 500]

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Management Section */}
        <div className="space-y-6">
          <div className={getCardClass()}>
            <h3 className={`text-lg font-semibold ${getTextColor()} mb-4 flex items-center space-x-2`}>
              <DollarSign className="w-5 h-5" />
              <span>Fee Management</span>
            </h3>
            <p className={`${getSubtextClass()} mb-6`}>Configure account-type specific transaction fees.</p>
            
            <div className="space-y-6">
              {/* Individual Accounts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className={`font-medium ${getTextColor()} flex items-center space-x-2`}>
                    <Users className="w-4 h-4" />
                    <span>Individual Accounts</span>
                  </h5>
                  <button
                    onClick={() => setFeeSettings({
                      ...feeSettings,
                      individual: {...feeSettings.individual, isActive: !feeSettings.individual.isActive}
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      feeSettings.individual.isActive ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feeSettings.individual.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Fee Type</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setFeeSettings({
                          ...feeSettings,
                          individual: {...feeSettings.individual, type: 'fixed'}
                        })}
                        className={`px-3 py-1 rounded text-sm ${
                          feeSettings.individual.type === 'fixed' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Fixed
                      </button>
                      <button
                        onClick={() => setFeeSettings({
                          ...feeSettings,
                          individual: {...feeSettings.individual, type: 'percentage'}
                        })}
                        className={`px-3 py-1 rounded text-sm ${
                          feeSettings.individual.type === 'percentage' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      {feeSettings.individual.type === 'fixed' ? 'Fixed Amount' : 'Percentage'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={feeSettings.individual.amount}
                        onChange={(e) => setFeeSettings({
                          ...feeSettings,
                          individual: {...feeSettings.individual, amount: parseFloat(e.target.value) || 0}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step={feeSettings.individual.type === 'percentage' ? "0.1" : "0.01"}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {feeSettings.individual.type === 'fixed' ? 'USD' : '%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Family Accounts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className={`font-medium ${getTextColor()} flex items-center space-x-2`}>
                    <Users className="w-4 h-4" />
                    <span>Family Accounts</span>
                  </h5>
                  <button
                    onClick={() => setFeeSettings({
                      ...feeSettings,
                      family: {...feeSettings.family, isActive: !feeSettings.family.isActive}
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      feeSettings.family.isActive ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feeSettings.family.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Fee Type</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setFeeSettings({
                          ...feeSettings,
                          family: {...feeSettings.family, type: 'fixed'}
                        })}
                        className={`px-3 py-1 rounded text-sm ${
                          feeSettings.family.type === 'fixed' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Fixed
                      </button>
                      <button
                        onClick={() => setFeeSettings({
                          ...feeSettings,
                          family: {...feeSettings.family, type: 'percentage'}
                        })}
                        className={`px-3 py-1 rounded text-sm ${
                          feeSettings.family.type === 'percentage' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      {feeSettings.family.type === 'fixed' ? 'Fixed Amount' : 'Percentage'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={feeSettings.family.amount}
                        onChange={(e) => setFeeSettings({
                          ...feeSettings,
                          family: {...feeSettings.family, amount: parseFloat(e.target.value) || 0}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step={feeSettings.family.type === 'percentage' ? "0.1" : "0.01"}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {feeSettings.family.type === 'fixed' ? 'USD' : '%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Accounts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className={`font-medium ${getTextColor()} flex items-center space-x-2`}>
                    <Building2 className="w-4 h-4" />
                    <span>Business Accounts</span>
                  </h5>
                  <button
                    onClick={() => setFeeSettings({
                      ...feeSettings,
                      business: {...feeSettings.business, isActive: !feeSettings.business.isActive}
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      feeSettings.business.isActive ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feeSettings.business.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>Fee Type</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setFeeSettings({
                          ...feeSettings,
                          business: {...feeSettings.business, type: 'fixed'}
                        })}
                        className={`px-3 py-1 rounded text-sm ${
                          feeSettings.business.type === 'fixed' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Fixed
                      </button>
                      <button
                        onClick={() => setFeeSettings({
                          ...feeSettings,
                          business: {...feeSettings.business, type: 'percentage'}
                        })}
                        className={`px-3 py-1 rounded text-sm ${
                          feeSettings.business.type === 'percentage' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      {feeSettings.business.type === 'fixed' ? 'Fixed Amount' : 'Percentage'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={feeSettings.business.amount}
                        onChange={(e) => setFeeSettings({
                          ...feeSettings,
                          business: {...feeSettings.business, amount: parseFloat(e.target.value) || 0}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step={feeSettings.business.type === 'percentage' ? "0.1" : "0.01"}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {feeSettings.business.type === 'fixed' ? 'USD' : '%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Preview Section */}
        <div className="space-y-6">
          <div className={getCardClass()}>
            <h3 className={`text-lg font-semibold ${getTextColor()} mb-4 flex items-center space-x-2`}>
              <DollarSign className="w-5 h-5" />
              <span>Fee Preview</span>
            </h3>
            <p className={`${getSubtextClass()} mb-6`}>See how fees will be calculated for different transaction amounts.</p>
            
            <div className="space-y-4">
              {previewAmounts.map((amount) => (
                <div key={amount} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className={`font-medium ${getTextColor()}`}>${amount} transaction:</span>
                  <div className="flex space-x-4 text-sm">
                    <span className={getSubtextClass()}>
                      Individual: ${calculateFee(amount, 'individual').toFixed(2)}
                    </span>
                    <span className={getSubtextClass()}>
                      Family: ${calculateFee(amount, 'family').toFixed(2)}
                    </span>
                    <span className={getSubtextClass()}>
                      Business: ${calculateFee(amount, 'business').toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="lg:col-span-2 flex justify-end">
          <button
            onClick={saveFeeSettings}
            disabled={isSaving}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Fee Settings'}</span>
          </button>
        </div>
      </div>
    )
  }

  const renderSystemConfigTab = () => {
    return (
      <div className="space-y-6">
        <div className={getCardClass()}>
          <h3 className={`text-lg font-semibold ${getTextColor()} mb-4 flex items-center space-x-2`}>
            <Settings className="w-5 h-5" />
            <span>System Controls</span>
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className={`block text-sm font-medium ${getTextColor()}`}>
                  Maintenance Mode
                </label>
                <p className={`text-xs ${getSubtextClass()}`}>
                  Temporarily disable the system for maintenance
                </p>
              </div>
              <button
                onClick={() => setSystemConfig({...systemConfig, maintenanceMode: !systemConfig?.maintenanceMode})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  systemConfig?.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    systemConfig?.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className={`block text-sm font-medium ${getTextColor()}`}>
                  User Registration
                </label>
                <p className={`text-xs ${getSubtextClass()}`}>
                  Allow new users to register accounts
                </p>
              </div>
              <button
                onClick={() => setSystemConfig({...systemConfig, registrationEnabled: !systemConfig?.registrationEnabled})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  systemConfig?.registrationEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    systemConfig?.registrationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSystemConfig}
            disabled={isSaving}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
    )
  }

  const renderBusinessInfoTab = () => {
    return (
      <div className="space-y-6">
        <div className={getCardClass()}>
          <h3 className={`text-lg font-semibold ${getTextColor()} mb-4 flex items-center space-x-2`}>
            <Building2 className="w-5 h-5" />
            <span>Company Details</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Company Name
              </label>
              <input
                type="text"
                value={businessSettings.companyName}
                onChange={(e) => setBusinessSettings({...businessSettings, companyName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Support Email
              </label>
              <input
                type="email"
                value={businessSettings.supportEmail}
                onChange={(e) => setBusinessSettings({...businessSettings, supportEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className={getTextColor()}>Loading system settings...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Settings</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">System Settings</h1>
          <p className="text-gray-400 mt-1">Configure global system settings, fees, and business information</p>
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
          onClick={() => setActiveTab('fees')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'fees' 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Fees
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'system' && renderSystemConfigTab()}
      {activeTab === 'business' && renderBusinessInfoTab()}
      {activeTab === 'fees' && renderFeesTab()}

      {/* Save Status */}
      {saveStatus && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          saveStatus === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {saveStatus === 'success' ? (
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Settings saved successfully!</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Failed to save settings. Please try again.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SystemSettings


