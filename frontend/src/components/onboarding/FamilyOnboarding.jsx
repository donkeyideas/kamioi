import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Building2, Target, ChevronRight, ChevronLeft, Check, X, Mail } from 'lucide-react';
import MXConnectWidget from '../auth/MXConnectWidget';

const STEPS = [
  { id: 1, title: 'Family Account', icon: Users },
  { id: 2, title: 'Invite Members', icon: UserPlus },
  { id: 3, title: 'Bank Connection', icon: Building2 },
  { id: 4, title: 'Family Goals', icon: Target }
];

const FAMILY_GOAL_TEMPLATES = [
  { id: 'vacation', name: 'Family Vacation', target: 8000, description: 'Save for a memorable family trip' },
  { id: 'college', name: 'College Fund', target: 50000, description: 'Start saving for education expenses' },
  { id: 'home', name: 'Home Down Payment', target: 60000, description: 'Save for your dream home' },
  { id: 'emergency', name: 'Family Emergency Fund', target: 20000, description: 'Build a family safety net' },
  { id: 'car', name: 'Family Car', target: 25000, description: 'Save for a new family vehicle' },
  { id: 'custom', name: 'Custom Goal', target: 0, description: 'Create your own family savings goal' }
];

const FamilyOnboarding = ({ onComplete, onBack }) => {
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
    familyName: '',
    termsAccepted: false,

    // Step 2: Family Members
    familyMembers: [],
    newMemberEmail: '',
    newMemberRole: 'member',

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

  const addFamilyMember = () => {
    if (!formData.newMemberEmail) {
      setError('Please enter an email address');
      return;
    }
    if (!formData.newMemberEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.familyMembers.some(m => m.email === formData.newMemberEmail)) {
      setError('This email is already added');
      return;
    }
    if (formData.familyMembers.length >= 10) {
      setError('Maximum 10 family members allowed');
      return;
    }

    setFormData(prev => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        { email: prev.newMemberEmail, role: prev.newMemberRole, status: 'pending' }
      ],
      newMemberEmail: '',
      newMemberRole: 'member'
    }));
    setError('');
  };

  const removeFamilyMember = (email) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter(m => m.email !== email)
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
        if (!formData.name || !formData.email || !formData.password || !formData.familyName) {
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
        // Family members are optional
        return true;
      case 3:
        // Bank connection is optional
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
        // Create family account
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
        const response = await fetch(`${apiBaseUrl}/api/user/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            accountType: 'family',
            familyName: formData.familyName
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

      if (currentStep === 2 && formData.familyMembers.length > 0) {
        // Send invitations to family members
        const token = localStorage.getItem('kamioi_user_token');
        if (token) {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
          for (const member of formData.familyMembers) {
            try {
              await fetch(`${apiBaseUrl}/api/family/invite`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  email: member.email,
                  role: member.role
                })
              });
            } catch (err) {
              console.warn(`Failed to send invite to ${member.email}:`, err);
            }
          }
        }
      }

      if (currentStep === 3) {
        setShowMXConnect(true);
      }

      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1);
      } else {
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
      const token = localStorage.getItem('kamioi_user_token');
      if (token && formData.selectedGoals.length > 0) {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';

        for (const goalId of formData.selectedGoals) {
          const template = FAMILY_GOAL_TEMPLATES.find(g => g.id === goalId);
          if (template) {
            const goalData = goalId === 'custom'
              ? { name: formData.customGoalName, target_amount: parseFloat(formData.customGoalTarget) || 1000, is_family_goal: true }
              : { name: template.name, target_amount: template.target, is_family_goal: true };

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

      onComplete?.();
      navigate('/family-dashboard');
    } catch (err) {
      setError('Failed to complete setup. Redirecting to dashboard...');
      setTimeout(() => navigate('/family-dashboard'), 2000);
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
              <label className="block text-sm font-medium text-white/90 mb-1">Family Name</label>
              <input
                type="text"
                name="familyName"
                value={formData.familyName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., The Smith Family"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Your Name (Admin)</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Create password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Confirm password"
                />
              </div>
            </div>
            <div className="flex items-start">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-white/70">
                I agree to the <a href="/terms" className="text-purple-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</a>
              </label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-white/70 mb-4">
                Invite family members to join your account. They will receive an email invitation to create their profile.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  name="newMemberEmail"
                  value={formData.newMemberEmail}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="family.member@email.com"
                />
                <select
                  name="newMemberRole"
                  value={formData.newMemberRole}
                  onChange={handleInputChange}
                  className="px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Co-Admin</option>
                </select>
                <button
                  type="button"
                  onClick={addFamilyMember}
                  className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {formData.familyMembers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white/90 mb-3">Pending Invitations</h4>
                <div className="space-y-2">
                  {formData.familyMembers.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-white">{member.email}</p>
                          <p className="text-xs text-white/60 capitalize">{member.role}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFamilyMember(member.email)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.familyMembers.length === 0 && (
              <div className="text-center py-8 text-white/60">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No family members added yet.</p>
                <p className="text-sm">You can invite members now or later from your dashboard.</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {formData.bankConnected ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-white">Bank Connected Successfully!</h3>
                <p className="text-white/60 mt-2">Your family bank account is now linked.</p>
              </div>
            ) : showMXConnect ? (
              <div className="border border-white/20 rounded-lg p-4">
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
                <h3 className="text-lg font-medium text-white">Connect Family Bank Account</h3>
                <p className="text-white/60 mt-2 mb-6">
                  Link your family's primary bank account. All family members can contribute through round-up investing.
                </p>
                <button
                  onClick={() => setShowMXConnect(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Connect Bank Account
                </button>
                <p className="text-sm text-gray-400 mt-4">Each member can also link their own accounts later</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">Select Family Goals</label>
              <div className="space-y-3">
                {FAMILY_GOAL_TEMPLATES.map(goal => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => handleGoalToggle(goal.id)}
                    className={`w-full flex items-center p-4 border rounded-lg text-left transition-all ${
                      formData.selectedGoals.includes(goal.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-white/20 hover:border-gray-300'
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
                      <Check className="w-5 h-5 text-purple-600 ml-3" />
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
                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Family Business"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">Target Amount</label>
                  <input
                    type="number"
                    name="customGoalTarget"
                    value={formData.customGoalTarget}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="10000"
                  />
                </div>
              </div>
            )}
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
                        : 'bg-gray-200 text-white/60'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${isActive ? 'text-purple-600' : 'text-white/60'}`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          {STEPS[currentStep - 1].title}
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
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
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center px-4 py-2 text-white/70 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
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

export default FamilyOnboarding;
