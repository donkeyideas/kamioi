import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, User, Mail, Phone, MapPin, CreditCard, Shield, CheckCircle, ArrowRight, Info, Star, Award, Users, DollarSign, TrendingUp, FileText, Calendar, Globe, Upload, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const BusinessRegistration = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const { isLightMode } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    businessType: '',
    industry: '',
    taxId: '',
    businessAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',

    // Contact Information
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactTitle: '',
    password: '',
    confirmPassword: '',

    // Business Details
    employeeCount: '',
    annualRevenue: '',
    businessDescription: '',
    website: '',

    // Investment Preferences
    investmentGoal: '',
    riskTolerance: 'moderate',
    roundUpAmount: 1.00,
    autoInvest: true,

    // Terms and Conditions
    agreeToTerms: false,
    agreeToMarketing: false,

    // Bank Connection
    bankConnected: false,
    bankAccountType: '',
    bankName: '',
    accountNumber: ''
  })


  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200' : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'

  const businessTypes = [
    'LLC',
    'Corporation (C-Corp)',
    'S-Corporation',
    'Partnership',
    'Sole Proprietorship',
    'Non-Profit',
    'Other'
  ]

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Retail',
    'Manufacturing',
    'Professional Services',
    'Real Estate',
    'Education',
    'Food & Beverage',
    'Consulting',
    'Other'
  ]

  const employeeCounts = [
    '1-5',
    '6-10',
    '11-25',
    '26-50',
    '51-100',
    '101-250',
    '250+'
  ]

  const revenueRanges = [
    'Not specified',
    '$5M - $10M',
    '$10M+'
  ]

  const businessBenefits = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Management',
      description: 'Manage investments for your entire team with individual tracking'
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: 'Higher Limits',
      description: 'Increased investment limits and priority processing'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Business Analytics',
      description: 'Advanced reporting and expense categorization'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Enhanced Security',
      description: 'Bank-level security with business-grade protection'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Priority Support',
      description: 'Dedicated business support team and faster response times'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Tax Integration',
      description: 'Seamless integration with business tax software'
    }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'

      // Step 1: Register business user
      const response = await fetch(`${apiBaseUrl}/api/user/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.contactName,
          email: formData.contactEmail,
          password: formData.password,
          accountType: 'business',
          // Business-specific fields
          company_name: formData.businessName,
          business_type: formData.businessType,
          tax_id: formData.taxId,
          industry: formData.industry,
          phone: formData.contactPhone,
          address: formData.businessAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          employee_count: formData.employeeCount,
          annual_revenue: formData.annualRevenue,
          business_description: formData.businessDescription,
          website: formData.website,
          risk_tolerance: formData.riskTolerance,
          round_up_amount: formData.roundUpAmount,
          investment_goals: formData.investmentGoal,
          terms_agreed: formData.agreeToTerms,
          marketing_agreed: formData.agreeToMarketing
        })
      })

      const result = await response.json()

      if (result.success) {
        // Store auth token
        localStorage.setItem('authToken', result.token)
        localStorage.setItem('userGuid', result.userGuid)
        localStorage.setItem('kamioi_user_token', result.token)

        console.log('Business registration successful:', result)

        // Navigate to business dashboard
        navigate('/business-dashboard')
      } else {
        setError(result.error || 'Registration failed. Please try again.')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('An error occurred during registration. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isLightMode ? 'bg-blue-100' : 'bg-blue-500/20'} mb-4`}>
          <Building2 className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className={`text-2xl font-bold ${getTextColor()} mb-2`}>Business Information</h2>
        <p className={getSubtextClass()}>Tell us about your business to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Business Name *
          </label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Enter your business name"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Business Type *
          </label>
          <select
            value={formData.businessType}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            style={{
              backgroundColor: isLightMode ? 'white' : 'rgba(255, 255, 255, 0.1)',
              color: isLightMode ? '#374151' : 'white'
            }}
            required
          >
            <option 
              value="" 
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Select business type
            </option>
            {businessTypes.map(type => (
              <option 
                key={type} 
                value={type}
                style={{ 
                  backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                  color: isLightMode ? '#374151' : 'white' 
                }}
              >
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Industry *
          </label>
          <select
            value={formData.industry}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            style={{
              backgroundColor: isLightMode ? 'white' : 'rgba(255, 255, 255, 0.1)',
              color: isLightMode ? '#374151' : 'white'
            }}
            required
          >
            <option 
              value="" 
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Select industry
            </option>
            {industries.map(industry => (
              <option 
                key={industry} 
                value={industry}
                style={{ 
                  backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                  color: isLightMode ? '#374151' : 'white' 
                }}
              >
                {industry}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Tax ID (EIN) *
          </label>
          <input
            type="text"
            value={formData.taxId}
            onChange={(e) => handleInputChange('taxId', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="XX-XXXXXXX"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Business Address *
          </label>
          <input
            type="text"
            value={formData.businessAddress}
            onChange={(e) => handleInputChange('businessAddress', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Enter your business address"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            City *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            State *
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            ZIP Code *
          </label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Country *
          </label>
          <select
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            style={{
              backgroundColor: isLightMode ? 'white' : 'rgba(255, 255, 255, 0.1)',
              color: isLightMode ? '#374151' : 'white'
            }}
            required
          >
            <option 
              value="US"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              United States
            </option>
            <option 
              value="CA"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Canada
            </option>
            <option 
              value="UK"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              United Kingdom
            </option>
            <option 
              value="AU"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Australia
            </option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isLightMode ? 'bg-green-100' : 'bg-green-500/20'} mb-4`}>
          <User className="w-8 h-8 text-green-400" />
        </div>
        <h2 className={`text-2xl font-bold ${getTextColor()} mb-2`}>Contact Information</h2>
        <p className={getSubtextClass()}>Primary contact details for your business account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Contact Name *
          </label>
          <input
            type="text"
            value={formData.contactName}
            onChange={(e) => handleInputChange('contactName', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Full name"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Contact Title *
          </label>
          <input
            type="text"
            value={formData.contactTitle}
            onChange={(e) => handleInputChange('contactTitle', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="CEO, Owner, Manager, etc."
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Business Email *
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="contact@yourbusiness.com"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Business Phone *
          </label>
          <input
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="(555) 123-4567"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Min 8 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Confirm Password *
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Re-enter password"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Number of Employees *
          </label>
          <select
            value={formData.employeeCount}
            onChange={(e) => handleInputChange('employeeCount', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            style={{
              backgroundColor: isLightMode ? 'white' : 'rgba(255, 255, 255, 0.1)',
              color: isLightMode ? '#374151' : 'white'
            }}
            required
          >
            <option 
              value="" 
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Select employee count
            </option>
            {employeeCounts.map(count => (
              <option 
                key={count} 
                value={count}
                style={{ 
                  backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                  color: isLightMode ? '#374151' : 'white' 
                }}
              >
                {count} employees
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Annual Revenue *
          </label>
          <select
            value={formData.annualRevenue}
            onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            style={{
              backgroundColor: isLightMode ? 'white' : 'rgba(255, 255, 255, 0.1)',
              color: isLightMode ? '#374151' : 'white'
            }}
            required
          >
            <option 
              value="" 
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Select revenue range
            </option>
            {revenueRanges.map(range => (
              <option 
                key={range} 
                value={range}
                style={{ 
                  backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                  color: isLightMode ? '#374151' : 'white' 
                }}
              >
                {range}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Business Description
          </label>
          <textarea
            value={formData.businessDescription}
            onChange={(e) => handleInputChange('businessDescription', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Brief description of your business and what you do"
          />
        </div>

        <div className="md:col-span-2">
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Website (Optional)
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="https://yourbusiness.com"
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isLightMode ? 'bg-purple-100' : 'bg-purple-500/20'} mb-4`}>
          <TrendingUp className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className={`text-2xl font-bold ${getTextColor()} mb-2`}>Investment Preferences</h2>
        <p className={getSubtextClass()}>Configure your business investment settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Investment Goal *
          </label>
          <select
            value={formData.investmentGoal}
            onChange={(e) => handleInputChange('investmentGoal', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            style={{
              backgroundColor: isLightMode ? 'white' : 'rgba(255, 255, 255, 0.1)',
              color: isLightMode ? '#374151' : 'white'
            }}
            required
          >
            <option 
              value="" 
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Select investment goal
            </option>
            <option 
              value="emergency-fund"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Emergency Fund
            </option>
            <option 
              value="business-expansion"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Business Expansion
            </option>
            <option 
              value="equipment-purchase"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Equipment Purchase
            </option>
            <option 
              value="retirement-planning"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Retirement Planning
            </option>
            <option 
              value="tax-optimization"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Tax Optimization
            </option>
            <option 
              value="general-investing"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              General Investing
            </option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Risk Tolerance *
          </label>
          <select
            value={formData.riskTolerance}
            onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            style={{
              backgroundColor: isLightMode ? 'white' : 'rgba(255, 255, 255, 0.1)',
              color: isLightMode ? '#374151' : 'white'
            }}
            required
          >
            <option 
              value="conservative"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Conservative
            </option>
            <option 
              value="moderate"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Moderate
            </option>
            <option 
              value="aggressive"
              style={{ 
                backgroundColor: isLightMode ? 'white' : 'rgba(17, 24, 39, 0.9)', 
                color: isLightMode ? '#374151' : 'white' 
              }}
            >
              Aggressive
            </option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
            Default Round-up Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="10.00"
              value={formData.roundUpAmount}
              onChange={(e) => handleInputChange('roundUpAmount', parseFloat(e.target.value))}
              className={`w-full pl-8 pr-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
          </div>
          <p className={`text-xs ${getSubtextClass()} mt-1`}>
            Amount to round up per transaction
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
          <div>
            <label className={`block text-sm font-medium ${getTextColor()}`}>
              Auto-invest Round-ups
            </label>
            <p className={`text-xs ${getSubtextClass()}`}>
              Automatically invest round-ups when they reach threshold
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.autoInvest}
              onChange={(e) => handleInputChange('autoInvest', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Business Benefits */}
      <div className="mt-8">
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-4`}>Business Account Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businessBenefits.map((benefit, index) => (
            <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-blue-400">{benefit.icon}</div>
                <h4 className={`font-semibold ${getTextColor()}`}>{benefit.title}</h4>
              </div>
              <p className={`text-sm ${getSubtextClass()}`}>{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isLightMode ? 'bg-orange-100' : 'bg-orange-500/20'} mb-4`}>
          <CheckCircle className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className={`text-2xl font-bold ${getTextColor()} mb-2`}>Review & Submit</h2>
        <p className={getSubtextClass()}>Review your information and submit your application</p>
      </div>

      {/* Review Summary */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-4`}>Application Summary</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className={`font-medium ${getTextColor()} mb-2`}>Business Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className={getSubtextClass()}>Name:</span> {formData.businessName}</p>
                <p><span className={getSubtextClass()}>Type:</span> {formData.businessType}</p>
                <p><span className={getSubtextClass()}>Industry:</span> {formData.industry}</p>
                <p><span className={getSubtextClass()}>Tax ID:</span> {formData.taxId}</p>
              </div>
            </div>
            <div>
              <h4 className={`font-medium ${getTextColor()} mb-2`}>Contact Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className={getSubtextClass()}>Contact:</span> {formData.contactName}</p>
                <p><span className={getSubtextClass()}>Title:</span> {formData.contactTitle}</p>
                <p><span className={getSubtextClass()}>Email:</span> {formData.contactEmail}</p>
                <p><span className={getSubtextClass()}>Phone:</span> {formData.contactPhone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-4`}>Terms and Conditions</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              checked={formData.agreeToTerms}
              onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
              className="mt-1"
              required
            />
            <label htmlFor="terms" className={`text-sm ${getTextColor()}`}>
              I agree to the <a href="#" className="text-blue-400 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a> for business accounts. *
            </label>
          </div>
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="marketing"
              checked={formData.agreeToMarketing}
              onChange={(e) => handleInputChange('agreeToMarketing', e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="marketing" className={`text-sm ${getTextColor()}`}>
              I would like to receive marketing communications and business investment tips via email.
            </label>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className={`p-4 rounded-lg ${isLightMode ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'} border`}>
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className={`font-semibold ${getTextColor()} mb-1`}>Application Review Process</h4>
            <p className={`text-sm ${getSubtextClass()}`}>
              Your business account application will be reviewed by our team within 24 hours. 
              We may contact you for additional verification documents. Once approved, you'll 
              receive an email with your account credentials and next steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isLightMode ? 'bg-green-100' : 'bg-green-500/20'} mb-4`}>
          <CreditCard className="w-8 h-8 text-green-400" />
        </div>
        <h2 className={`text-2xl font-bold ${getTextColor()} mb-2`}>Connect Your Business Bank Account</h2>
        <p className={getSubtextClass()}>Link your business bank account to enable automatic transaction syncing and round-up investments</p>
      </div>

      {/* Bank Connection Options */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-4`}>Bank Connection Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`font-medium ${getTextColor()}`}>Connect Bank Account (Recommended)</p>
                <p className={`text-sm ${getSubtextClass()}`}>Secure connection via MX.com for automatic transaction syncing</p>
              </div>
            </div>
            <button
              onClick={() => handleInputChange('bankConnected', true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                formData.bankConnected
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {formData.bankConnected ? 'Connected' : 'Connect'}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`font-medium ${getTextColor()}`}>Manual Bank File Upload</p>
                <p className={`text-sm ${getSubtextClass()}`}>Upload CSV/Excel files with your transaction data</p>
              </div>
            </div>
            <button
              onClick={() => handleInputChange('bankConnected', false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !formData.bankConnected
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {!formData.bankConnected ? 'Selected' : 'Select'}
            </button>
          </div>
        </div>
      </div>

      {/* Bank Connection Benefits */}
      <div className={`p-4 rounded-lg ${isLightMode ? 'bg-green-50 border-green-200' : 'bg-green-500/10 border-green-500/20'} border`}>
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
          <div>
            <h4 className={`font-semibold ${getTextColor()} mb-1`}>Why Connect Your Bank Account?</h4>
            <ul className={`text-sm ${getSubtextClass()} space-y-1`}>
              <li>• Automatic transaction detection and categorization</li>
              <li>• Real-time round-up calculations and investments</li>
              <li>• Seamless integration with your business financial workflow</li>
              <li>• Enhanced security with bank-level encryption</li>
              <li>• No manual data entry required</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <button
          onClick={() => handleInputChange('bankConnected', false)}
          className="text-gray-400 hover:text-gray-300 text-sm underline"
        >
          Skip for now - I'll connect my bank account later
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold ${getTextColor()} mb-4`}>
              Business Account Registration
            </h1>
            <p className={`text-xl ${getSubtextClass()}`}>
              Join thousands of businesses already investing with Kamioi
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5].map(step => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step <= currentStep 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 5 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Business Info</span>
              <span>Contact Info</span>
              <span>Investment</span>
              <span>Review</span>
              <span>Bank Connection</span>
            </div>
          </div>

          {/* Form Content */}
          <div className={getCardClass()}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              <button
                onClick={prevStep}
                disabled={currentStep === 1 || isLoading}
                className={`px-6 py-2 rounded-lg transition-all ${
                  currentStep === 1 || isLoading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 hover:text-white'
                }`}
              >
                Previous
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={nextStep}
                  className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-6 py-2 text-blue-400 flex items-center space-x-2 transition-all"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!formData.agreeToTerms || isLoading}
                  className={`px-6 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                    formData.agreeToTerms && !isLoading
                      ? 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessRegistration
