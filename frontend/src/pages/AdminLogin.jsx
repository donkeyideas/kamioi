import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock, KeyRound, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const totpInputRef = useRef(null);

  const navigate = useNavigate();
  const { loginAdmin } = useAuth();

  // Focus on TOTP input when 2FA is required
  useEffect(() => {
    if (requires2FA && totpInputRef.current) {
      totpInputRef.current.focus();
    }
  }, [requires2FA]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 AdminLogin - Attempting login for:', formData.email);
      // Use AuthContext's loginAdmin function which properly handles token storage
      // Pass TOTP code if in 2FA mode
      const result = await loginAdmin(formData.email, formData.password, requires2FA ? totpCode : null);
      console.log('🔐 AdminLogin - Login result:', result);

      // Check if 2FA is required
      if (result && result.requires_2fa) {
        console.log('🔐 AdminLogin - 2FA required');
        setRequires2FA(true);
        setIsLoading(false);
        return;
      }

      if (result && result.success) {
        // AuthContext has already stored the token and set the admin state
        // Navigate to admin dashboard using the admin ID from the result
        const adminId = result.user?.id || 1;
        console.log('🔐 AdminLogin - Navigating to admin dashboard:', `/admin/${adminId}/`);
        navigate(`/admin/${adminId}/`);
      } else {
        const errorMsg = result?.error || 'Login failed';
        console.error('🔐 AdminLogin - Login failed:', errorMsg);
        setError(errorMsg);
        // If 2FA code was wrong, don't reset the 2FA state
        if (requires2FA) {
          setTotpCode('');
        }
      }
    } catch (err) {
      console.error('🔐 AdminLogin - Exception during login:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setTotpCode('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4"
            >
              <Shield className="w-8 h-8 text-red-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-white/70">Secure access to Kamioi administration</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {requires2FA ? (
              /* 2FA Verification Step */
              <>
                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to login</span>
                </button>

                {/* 2FA Info */}
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-3">
                    <KeyRound className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Two-Factor Authentication</h3>
                  <p className="text-white/60 text-sm">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                {/* TOTP Code Field */}
                <div>
                  <label htmlFor="totpCode" className="block text-sm font-medium text-white/90 mb-2">
                    Authentication Code
                  </label>
                  <input
                    ref={totpInputRef}
                    type="text"
                    id="totpCode"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Verify Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || totpCode.length !== 6}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5" />
                      <span>Verify & Continue</span>
                    </>
                  )}
                </motion.button>
              </>
            ) : (
              /* Standard Login Form */
              <>
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                    Admin Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
                      placeholder="admin@kamioi.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
                      placeholder="Enter admin password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Access Admin Dashboard</span>
                    </>
                  )}
                </motion.button>
              </>
            )}
          </form>

          {/* Footer - only show when not in 2FA mode */}
          {!requires2FA && (
            <div className="mt-8 text-center">
              <p className="text-white/50 text-sm">
                Authorized personnel only
              </p>
              <div className="mt-4 flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/login')}
                  className="text-white/70 hover:text-white text-sm underline"
                >
                  Regular User Login
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
