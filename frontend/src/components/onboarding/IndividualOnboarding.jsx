import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, TrendingUp, Building2, Target, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import MXConnectWidget from '../auth/MXConnectWidget';

const STEPS = [
  { id: 1, title: 'Account Info', icon: User },
  { id: 2, title: 'Investment Preferences', icon: TrendingUp },
  { id: 3, title: 'Bank Connection', icon: Building2 },
  { id: 4, title: 'Goals Setup', icon: Target }
];

const RISK_LEVELS = [
  { value: 'conservative', label: 'Conservative', description: 'Lower risk, steady growth' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced risk and reward' },
  { value: 'aggressive', label: 'Aggressive', description: 'Higher risk, higher potential returns' }
];

const SECTORS = [
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'finance', label: 'Finance', icon: '🏦' },
  { value: 'consumer', label: 'Consumer', icon: '🛒' },
  { value: 'energy', label: 'Energy', icon: '⚡' },
  { value: 'real_estate', label: 'Real Estate', icon: '🏠' }
];

const GOAL_TEMPLATES = [
  { id: 'emergency', name: 'Emergency Fund', target: 10000, description: 'Build a safety net for unexpected expenses' },
  { id: 'vacation', name: 'Vacation Fund', target: 5000, description: 'Save for your dream trip' },
  { id: 'car', name: 'New Car', target: 15000, description: 'Save for a down payment on a vehicle' },
  { id: 'investment', name: 'Long-term Investing', target: 50000, description: 'Build wealth over time' },
  { id: 'custom', name: 'Custom Goal', target: 0, description: 'Create your own savings goal' }
];

const IndividualOnboarding = ({ onComplete, onBack }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userGuid, setUserGuid] = useState(null);
  const [showMXConnect, setShowMXConnect] = useState(false);

  // Form data for all steps
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,

    // Step 2: Investment Preferences
    riskTolerance: 'moderate',
    favoriteSectors: [],
    investmentExperience: 'beginner',

    // Step 3: Bank Connection
    bankConnected: false,
    mxData: null,

    // Step 4: Goals
    selectedGoals: [],
    customGoalName: '',
    customGoalTarget: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSectorToggle = (sector) => {
    setFormData(prev => ({
      ...prev,
      favoriteSectors: prev.favoriteSectors.includes(sector)
        ? prev.favoriteSectors.filter(s => s !== sector)
        : [...prev.favoriteSectors, sector]
    }));
  };

  const handleGoalToggle = (goalId) => {
    setFormData(prev => ({
      ...prev,
      selectedGoals: prev.selectedGoals.includes(goalId)
        ? prev.selectedGoals.filter(g => g !== goalId)
        : [...prev.selectedGoals, goalId]
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.name || !formData.email || !formData.password) {
          setError('All fields are required');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (!formData.termsAccepted) {
          setError('Please accept the terms and conditions');
          return false;
        }
        return true;
      case 2:
        if (!formData.riskTolerance) {
          setError('Please select your risk tolerance');
          return false;
        }
        return true;
      case 3:
        // Bank connection is optional but encouraged
        return true;
      case 4:
        // Goals are optional
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    setError('');

    try {
      if (currentStep === 1) {
        // Create user account
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
        const response = await fetch(`${apiBaseUrl}/api/user/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            accountType: 'individual'
          })
        });

        const result = await response.json();
        if (result.success) {
          setUserGuid(result.userGuid);
          if (result.token) {
            localStorage.setItem('kamioi_user_token', result.token);
          }
        } else {
          throw new Error(result.error || 'Registration failed');
        }
      }

      if (currentStep === 2) {
        // Save investment preferences
        const token = localStorage.getItem('kamioi_user_token');
        if (token) {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
          await fetch(`${apiBaseUrl}/api/user/preferences`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              riskTolerance: formData.riskTolerance,
              favoriteSectors: formData.favoriteSectors,
              investmentExperience: formData.investmentExperience
            })
          });
        }
      }

      if (currentStep === 3) {
        setShowMXConnect(true);
      }

      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Complete onboarding
        await handleComplete();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      onBack?.();
    } else {
      setCurrentStep(prev => prev - 1);
      setShowMXConnect(false);
    }
  };

  const handleMXSuccess = async (data) => {
    setFormData(prev => ({ ...prev, bankConnected: true, mxData: data }));
    setShowMXConnect(false);

    // Save bank connection
    const token = localStorage.getItem('kamioi_user_token');
    if (token && data) {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
        await fetch(`${apiBaseUrl}/api/user/bank-connections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            member_guid: data.member_guid,
            user_guid: data.user_guid,
            institution_name: data.institution_name || 'Connected Bank'
          })
        });
      } catch (err) {
        console.warn('Failed to save bank connection:', err);
      }
    }
  };

  const handleMXError = (error) => {
    console.error('MX Connect Error:', error);
    setError('Failed to connect bank. You can try again later from your dashboard.');
    setShowMXConnect(false);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save goals
      const token = localStorage.getItem('kamioi_user_token');
      if (token && formData.selectedGoals.length > 0) {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';

        for (const goalId of formData.selectedGoals) {
          const template = GOAL_TEMPLATES.find(g => g.id === goalId);
          if (template) {
            const goalData = goalId === 'custom'
              ? { name: formData.customGoalName, target_amount: parseFloat(formData.customGoalTarget) || 1000 }
              : { name: template.name, target_amount: template.target };

            await fetch(`${apiBaseUrl}/api/user/goals`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(goalData)
            });
          }
        }
      }

      // Navigate to dashboard
      onComplete?.();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to complete setup. Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                placeholder="Create a password (min 8 characters)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>
            <div className="flex items-start">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-purple-400 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-white/70">
                I agree to the <a href="/terms" className="text-purple-400 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</a>
              </label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">Risk Tolerance</label>
              <div className="space-y-3">
                {RISK_LEVELS.map(level => (
                  <label
                    key={level.value}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.riskTolerance === level.value
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/20 hover:border-white/30 bg-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="riskTolerance"
                      value={level.value}
                      checked={formData.riskTolerance === level.value}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-400 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-white">{level.label}</span>
                      <p className="text-sm text-white/60">{level.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">Favorite Sectors (Select all that interest you)</label>
              <div className="grid grid-cols-2 gap-3">
                {SECTORS.map(sector => (
                  <button
                    key={sector.value}
                    type="button"
                    onClick={() => handleSectorToggle(sector.value)}
                    className={`flex items-center p-3 border rounded-lg transition-all ${
                      formData.favoriteSectors.includes(sector.value)
                        ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                        : 'border-white/20 hover:border-white/30 bg-white/10 text-white/90'
                    }`}
                  >
                    <span className="text-xl mr-2">{sector.icon}</span>
                    <span className="font-medium">{sector.label}</span>
                    {formData.favoriteSectors.includes(sector.value) && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">Investment Experience</label>
              <select
                name="investmentExperience"
                value={formData.investmentExperience}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              >
                <option value="beginner">Beginner - New to investing</option>
                <option value="intermediate">Intermediate - Some experience</option>
                <option value="advanced">Advanced - Experienced investor</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {formData.bankConnected ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-white">Bank Connected Successfully!</h3>
                <p className="text-white/60 mt-2">Your bank account is now linked to Kamioi.</p>
              </div>
            ) : showMXConnect ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <MXConnectWidget
                  userGuid={userGuid}
                  onSuccess={handleMXSuccess}
                  onError={handleMXError}
                  onClose={() => setShowMXConnect(false)}
                  isVisible={true}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white">Connect Your Bank</h3>
                <p className="text-white/60 mt-2 mb-6">
                  Link your bank account to enable round-up investing. Your purchases will automatically round up to the nearest dollar and invest the spare change.
                </p>
                <button
                  onClick={() => setShowMXConnect(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Connect Bank Account
                </button>
                <p className="text-sm text-gray-400 mt-4">You can also do this later from your dashboard</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">Select Your Goals</label>
              <div className="space-y-3">
                {GOAL_TEMPLATES.map(goal => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => handleGoalToggle(goal.id)}
                    className={`w-full flex items-center p-4 border rounded-lg text-left transition-all ${
                      formData.selectedGoals.includes(goal.id)
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/20 hover:border-white/30 bg-white/10'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{goal.name}</span>
                        {goal.target > 0 && (
                          <span className="text-sm text-white/60">${goal.target.toLocaleString()}</span>
                        )}
                      </div>
                      <p className="text-sm text-white/60 mt-1">{goal.description}</p>
                    </div>
                    {formData.selectedGoals.includes(goal.id) && (
                      <Check className="w-5 h-5 text-purple-400 ml-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {formData.selectedGoals.includes('custom') && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">Goal Name</label>
                  <input
                    type="text"
                    name="customGoalName"
                    value={formData.customGoalName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., New Laptop"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">Target Amount</label>
                  <input
                    type="number"
                    name="customGoalTarget"
                    value={formData.customGoalTarget}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="5000"
                  />
                </div>
              </div>
            )}

            <p className="text-sm text-white/60 text-center">
              You can always add or modify goals from your dashboard later.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/20 text-white/60'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${isActive ? 'text-purple-400' : 'text-white/60'}`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-white/20'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          {STEPS[currentStep - 1].title}
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/20">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-semibold"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : currentStep === 4 ? (
              <>
                Complete Setup
                <Check className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndividualOnboarding;
