import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, UserCog, CreditCard, Users, ChevronRight, ChevronLeft, Check, X, Mail, Briefcase } from 'lucide-react';
import MXConnectWidget from '../auth/MXConnectWidget';

const STEPS = [
  { id: 1, title: 'Business Info', icon: Building },
  { id: 2, title: 'Admin Account', icon: UserCog },
  { id: 3, title: 'Payment Setup', icon: CreditCard },
  { id: 4, title: 'Team Invitation', icon: Users }
];

const BUSINESS_TYPES = [
  { value: 'llc', label: 'LLC', description: 'Limited Liability Company' },
  { value: 'corporation', label: 'Corporation', description: 'C-Corp or S-Corp' },
  { value: 'sole_proprietor', label: 'Sole Proprietor', description: 'Individual business owner' },
  { value: 'partnership', label: 'Partnership', description: 'Two or more owners' },
  { value: 'nonprofit', label: 'Non-Profit', description: '501(c)(3) organization' }
];

const TEAM_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features' },
  { value: 'manager', label: 'Manager', description: 'Can manage team and view reports' },
  { value: 'accountant', label: 'Accountant', description: 'Access to financial data' },
  { value: 'member', label: 'Team Member', description: 'Basic access only' }
];

const BusinessOnboarding = ({ onComplete, onBack }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userGuid, setUserGuid] = useState(null);
  const [showMXConnect, setShowMXConnect] = useState(false);

  // Form data for all steps
  const [formData, setFormData] = useState({
    // Step 1: Business Info
    businessName: '',
    businessType: 'llc',
    ein: '',
    industry: '',
    website: '',

    // Step 2: Admin Account
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    adminTitle: '',
    termsAccepted: false,

    // Step 3: Payment Setup
    bankConnected: false,
    mxData: null,

    // Step 4: Team Members
    teamMembers: [],
    newMemberEmail: '',
    newMemberRole: 'member',
    newMemberName: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const addTeamMember = () => {
    if (!formData.newMemberEmail || !formData.newMemberName) {
      setError('Please enter name and email');
      return;
    }
    if (!formData.newMemberEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.teamMembers.some(m => m.email === formData.newMemberEmail)) {
      setError('This email is already added');
      return;
    }
    if (formData.teamMembers.length >= 25) {
      setError('Maximum 25 team members allowed in initial setup');
      return;
    }

    setFormData(prev => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        {
          name: prev.newMemberName,
          email: prev.newMemberEmail,
          role: prev.newMemberRole,
          status: 'pending'
        }
      ],
      newMemberName: '',
      newMemberEmail: '',
      newMemberRole: 'member'
    }));
    setError('');
  };

  const removeTeamMember = (email) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter(m => m.email !== email)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.businessName || !formData.businessType) {
          setError('Business name and type are required');
          return false;
        }
        return true;
      case 2:
        if (!formData.adminName || !formData.adminEmail || !formData.adminPassword) {
          setError('All admin fields are required');
          return false;
        }
        if (formData.adminPassword !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.adminPassword.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (!formData.termsAccepted) {
          setError('Please accept the terms and conditions');
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
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
      if (currentStep === 2) {
        // Create business account with admin
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
        const response = await fetch(`${apiBaseUrl}/api/user/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.adminName,
            email: formData.adminEmail,
            password: formData.adminPassword,
            accountType: 'business',
            businessName: formData.businessName,
            businessType: formData.businessType,
            ein: formData.ein,
            industry: formData.industry,
            adminTitle: formData.adminTitle
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

      if (currentStep === 3) {
        setShowMXConnect(true);
      }

      if (currentStep === 4 && formData.teamMembers.length > 0) {
        // Send invitations to team members
        const token = localStorage.getItem('kamioi_user_token');
        if (token) {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
          for (const member of formData.teamMembers) {
            try {
              await fetch(`${apiBaseUrl}/api/business/invite`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  name: member.name,
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
        await fetch(`${apiBaseUrl}/api/business/bank-connections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            member_guid: data.member_guid,
            user_guid: data.user_guid,
            institution_name: data.institution_name || 'Business Bank',
            account_type: 'business'
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
      onComplete?.();
      navigate('/business-dashboard');
    } catch (err) {
      setError('Failed to complete setup. Redirecting to dashboard...');
      setTimeout(() => navigate('/business-dashboard'), 2000);
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
              <label className="block text-sm font-medium text-white/90 mb-1">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">Business Type *</label>
              <div className="grid grid-cols-1 gap-2">
                {BUSINESS_TYPES.map(type => (
                  <label
                    key={type.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.businessType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-white/20 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="businessType"
                      value={type.value}
                      checked={formData.businessType === type.value}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-white">{type.label}</span>
                      <span className="text-sm text-white/60 ml-2">- {type.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">EIN (Optional)</label>
                <input
                  type="text"
                  name="ein"
                  value={formData.ein}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="XX-XXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Technology"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Website (Optional)</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>You're creating the admin account for {formData.businessName || 'your business'}.</strong>
                <br />This will be the primary administrator with full access.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Your Name *</label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Job Title</label>
                <input
                  type="text"
                  name="adminTitle"
                  value={formData.adminTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., CEO, CFO"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Work Email *</label>
              <input
                type="email"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@company.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Password *</label>
                <input
                  type="password"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-white/70">
                I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>,{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>, and{' '}
                <a href="/business-terms" className="text-blue-600 hover:underline">Business Agreement</a>
              </label>
            </div>
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
                <h3 className="text-lg font-medium text-white">Business Bank Connected!</h3>
                <p className="text-white/60 mt-2">Your business bank account is now linked.</p>
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
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white">Connect Business Bank Account</h3>
                <p className="text-white/60 mt-2 mb-6">
                  Link your business bank account to enable automated expense tracking and round-up investing for your company.
                </p>
                <button
                  onClick={() => setShowMXConnect(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connect Business Account
                </button>
                <p className="text-sm text-gray-400 mt-4">You can also connect via Stripe or other payment processors later</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-white/70 mb-4">
                Invite team members to join your business account. They will receive email invitations with role-specific access.
              </p>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    name="newMemberName"
                    value={formData.newMemberName}
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Name"
                  />
                  <input
                    type="email"
                    name="newMemberEmail"
                    value={formData.newMemberEmail}
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@company.com"
                  />
                  <select
                    name="newMemberRole"
                    value={formData.newMemberRole}
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-white/10 backdrop-blur-lg/10 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {TEAM_ROLES.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={addTeamMember}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-white/70 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center"
                >
                  <Briefcase className="w-5 h-5 mr-2" />
                  Add Team Member
                </button>
              </div>
            </div>

            {formData.teamMembers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white/90 mb-3">
                  Team Members ({formData.teamMembers.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formData.teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-medium">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{member.name}</p>
                          <p className="text-xs text-white/60">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded capitalize">
                          {member.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTeamMember(member.email)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.teamMembers.length === 0 && (
              <div className="text-center py-8 text-white/60">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No team members added yet.</p>
                <p className="text-sm">You can invite team members now or later from your dashboard.</p>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-white/90 mb-2">Role Permissions</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                {TEAM_ROLES.map(role => (
                  <div key={role.value} className="flex items-start">
                    <span className="font-medium mr-1">{role.label}:</span>
                    <span>{role.description}</span>
                  </div>
                ))}
              </div>
            </div>
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-white/60'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${isActive ? 'text-blue-600' : 'text-white/60'}`}>
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
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

export default BusinessOnboarding;
