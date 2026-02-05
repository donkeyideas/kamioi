/**
 * AccountTypeStep - Step 1: Choose account type (Individual, Family, Business)
 */

import React, { useState, useEffect } from 'react'
import { useSignup } from '../SignupContext'
import { User, Users, Building2, Check } from 'lucide-react'

const AccountTypeStep = ({ allowedAccountTypes = ['individual', 'family', 'business'] }) => {
  const { formData, updateField, nextStep } = useSignup()
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const response = await fetch(`${apiBaseUrl}/api/user/subscriptions/plans`)
        if (response.ok) {
          const data = await response.json()
          setPlans(data.plans || [])
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
      } finally {
        setLoadingPlans(false)
      }
    }
    fetchPlans()
  }, [])

  // Auto-select if only one account type is allowed, or clear if selected type is no longer allowed
  useEffect(() => {
    if (allowedAccountTypes.length === 1 && !formData.accountType) {
      // Auto-select the only available type
      updateField('accountType', allowedAccountTypes[0])
    } else if (formData.accountType && !allowedAccountTypes.includes(formData.accountType)) {
      // Clear selection if selected type is no longer allowed
      updateField('accountType', null)
    }
  }, [allowedAccountTypes, formData.accountType, updateField])

  const getPriceForType = (accountType) => {
    const plan = plans.find(p => p.account_type === accountType)
    if (plan) {
      const price = plan.price_monthly || plan.price || 0
      return `$${parseFloat(price).toFixed(2)}`
    }
    return '$0'
  }

  const accountTypes = [
    {
      id: 'individual',
      name: 'Individual',
      description: 'Perfect for personal investing and building your portfolio',
      icon: User,
      features: [
        'Automatic round-ups on purchases',
        'AI-powered investment insights',
        'Real-time portfolio tracking',
        'Personalized recommendations'
      ]
    },
    {
      id: 'family',
      name: 'Family',
      description: 'Invest together and teach financial literacy to your family',
      icon: Users,
      features: [
        'Up to 5 family members',
        'Shared family goals',
        'Parental controls',
        'Individual portfolios per member'
      ]
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Investment benefits for employees and corporate fund management',
      icon: Building2,
      features: [
        'Unlimited team members',
        'Advanced analytics dashboard',
        'API access',
        'Dedicated account manager'
      ]
    }
  ]

  const handleSelect = (typeId) => {
    updateField('accountType', typeId)

    // Also set the default plan ID based on account type
    const plan = plans.find(p => p.account_type === typeId)
    if (plan) {
      updateField('planId', plan.id)
    }
  }

  const handleContinue = () => {
    if (formData.accountType) {
      nextStep()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Account Type</h2>
        <p className="text-white/70">Select the account that best fits your needs</p>
      </div>

      {loadingPlans ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/70">Loading plans...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {accountTypes.filter(type => allowedAccountTypes.includes(type.id)).map((type) => {
            const Icon = type.icon
            const isSelected = formData.accountType === type.id
            const price = getPriceForType(type.id)

            return (
              <button
                key={type.id}
                onClick={() => handleSelect(type.id)}
                className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-blue-500' : 'bg-white/10'
                  }`}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-white/70'}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-white">{type.name}</h3>
                      <span className="text-xl font-bold text-white">{price}<span className="text-sm text-white/70">/mo</span></span>
                    </div>
                    <p className="text-white/70 text-sm mb-3">{type.description}</p>

                    <ul className="space-y-1">
                      {type.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-white/60">
                          <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!formData.accountType}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
          formData.accountType
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-white/10 text-white/50 cursor-not-allowed'
        }`}
      >
        Continue
      </button>
    </div>
  )
}

export default AccountTypeStep
