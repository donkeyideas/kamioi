import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Building, ArrowLeft, Sparkles } from 'lucide-react';
import IndividualOnboarding from '../components/onboarding/IndividualOnboarding';
import FamilyOnboarding from '../components/onboarding/FamilyOnboarding';
import BusinessOnboarding from '../components/onboarding/BusinessOnboarding';
import SEO from '../components/common/SEO';

const ACCOUNT_TYPES = [
  {
    id: 'individual',
    title: 'Individual',
    description: 'Personal finance management with round-up investing',
    icon: User,
    color: 'indigo',
    features: [
      'Automatic round-up investing',
      'Personal portfolio tracking',
      'Goal-based savings',
      'Investment insights'
    ]
  },
  {
    id: 'family',
    title: 'Family',
    description: 'Manage finances together with your family',
    icon: Users,
    color: 'purple',
    features: [
      'Shared family goals',
      'Individual member portfolios',
      'Family spending insights',
      'Parental controls'
    ]
  },
  {
    id: 'business',
    title: 'Business',
    description: 'Corporate finance and team expense management',
    icon: Building,
    color: 'blue',
    features: [
      'Team expense tracking',
      'Business analytics',
      'Role-based access',
      'Corporate investing'
    ]
  }
];

const Register = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
  };

  const handleContinue = () => {
    if (selectedType) {
      setShowOnboarding(true);
    }
  };

  const handleBack = () => {
    if (showOnboarding) {
      setShowOnboarding(false);
    } else {
      navigate('/');
    }
  };

  const handleComplete = () => {
    // Navigate based on account type
    switch (selectedType) {
      case 'individual':
        navigate('/dashboard');
        break;
      case 'family':
        navigate('/family-dashboard');
        break;
      case 'business':
        navigate('/business-dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      indigo: {
        bg: isSelected ? 'bg-indigo-500/20' : 'bg-white/10',
        border: isSelected ? 'border-indigo-500' : 'border-white/20',
        icon: 'text-indigo-400',
        button: 'bg-indigo-600 hover:bg-indigo-700'
      },
      purple: {
        bg: isSelected ? 'bg-purple-500/20' : 'bg-white/10',
        border: isSelected ? 'border-purple-500' : 'border-white/20',
        icon: 'text-purple-400',
        button: 'bg-purple-600 hover:bg-purple-700'
      },
      blue: {
        bg: isSelected ? 'bg-blue-500/20' : 'bg-white/10',
        border: isSelected ? 'border-blue-500' : 'border-white/20',
        icon: 'text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700'
      }
    };
    return colors[color];
  };

  const renderOnboarding = () => {
    switch (selectedType) {
      case 'individual':
        return <IndividualOnboarding onComplete={handleComplete} onBack={handleBack} />;
      case 'family':
        return <FamilyOnboarding onComplete={handleComplete} onBack={handleBack} />;
      case 'business':
        return <BusinessOnboarding onComplete={handleComplete} onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <>
    <SEO
      title="Sign Up for Kamioi: Start Investing Automatically"
      description="Create your free Kamioi account and start building wealth with automatic round-up investing. Choose Individual, Family, or Business plans. No hidden fees."
      keywords="sign up kamioi, create investing account, automatic investing signup, round-up investing registration"
      breadcrumbs={[
        { name: "Home", url: "https://kamioi.com/" },
        { name: "Sign Up", url: "https://kamioi.com/signup" }
      ]}
      faq={[
        { question: "How do I create a Kamioi account?", answer: "Choose your account type (Individual, Family, or Business), fill in your details, and start investing in minutes. No minimum deposit required." },
        { question: "Is it free to sign up for Kamioi?", answer: "Signing up is free. Plans start at $9/month for Individual, $19/month for Family, and $49/month for Business. All plans include a free trial." },
        { question: "What account types does Kamioi offer?", answer: "Kamioi offers Individual accounts for personal investing, Family accounts for up to 5 members with shared goals, and Business accounts for teams up to 20 users." },
        { question: "Is my information secure when signing up?", answer: "Yes. Kamioi uses bank-level 256-bit encryption, two-factor authentication, and SIPC insurance up to $500,000 to protect your data and investments." }
      ]}
    />
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-4"
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white"
          >
            {showOnboarding ? `Create Your ${selectedType?.charAt(0).toUpperCase()}${selectedType?.slice(1)} Account` : 'Join Kamioi'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-white/70"
          >
            {showOnboarding
              ? 'Complete the steps below to get started'
              : 'Choose the account type that best fits your needs'}
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!showOnboarding ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Account Type Selection */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {ACCOUNT_TYPES.map((type, index) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  const colors = getColorClasses(type.color, isSelected);

                  return (
                    <motion.button
                      key={type.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleTypeSelect(type.id)}
                      className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left backdrop-blur-lg ${colors.bg} ${colors.border} hover:shadow-lg hover:shadow-white/10`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <div className={`w-6 h-6 rounded-full ${colors.button} flex items-center justify-center`}>
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}

                      <div className={`w-12 h-12 rounded-xl ${colors.button} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2">{type.title}</h3>
                      <p className="text-sm text-white/70 mb-4">{type.description}</p>

                      <ul className="space-y-2">
                        {type.features.map((feature, i) => (
                          <li key={i} className="flex items-center text-sm text-white/70">
                            <svg className={`w-4 h-4 mr-2 ${colors.icon}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </motion.button>
                  );
                })}
              </div>

              {/* Continue Button */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center text-white/70 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Home
                </button>

                <button
                  onClick={handleContinue}
                  disabled={!selectedType}
                  className={`px-8 py-3 rounded-lg font-medium text-white transition-all ${
                    selectedType
                      ? `${getColorClasses(ACCOUNT_TYPES.find(t => t.id === selectedType)?.color || 'indigo', true).button}`
                      : 'bg-white/20 cursor-not-allowed'
                  }`}
                >
                  Continue with {selectedType ? ACCOUNT_TYPES.find(t => t.id === selectedType)?.title : '...'} Account
                </button>
              </div>

              {/* Login Link */}
              <div className="mt-8 text-center">
                <p className="text-white/70">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-purple-400 font-medium hover:underline hover:text-purple-300"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderOnboarding()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
};

export default Register;
