import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock, Smartphone } from 'lucide-react';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const [totpCode, setTotpCode] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleTotpChange = (e) => {
    // Only allow numbers and max 6 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setTotpCode(value);
    setError('');
  };

  const { loginAdmin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 AdminLogin - Attempting login for:', formData.email);

      // Call login API directly to check for 2FA requirement
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
      const response = await fetch(`${apiBaseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();
      console.log('🔐 AdminLogin - Login result:', result);

      if (result.success) {
        // Check if 2FA is required
        if (result.requires_2fa) {
          console.log('🔐 AdminLogin - 2FA required for admin:', result.admin_id);
          setRequires2FA(true);
          setAdminId(result.admin_id);
        } else {
          // No 2FA required, complete login through AuthContext
          const authResult = await loginAdmin(formData.email, formData.password);
          if (authResult && authResult.success) {
            const adminIdFromResult = authResult.user?.id || 1;
            console.log('🔐 AdminLogin - Navigating to admin dashboard:', `/admin/${adminIdFromResult}/`);
            navigate(`/admin/${adminIdFromResult}/`);
          } else {
            setError(authResult?.error || 'Login failed');
          }
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('🔐 AdminLogin - Exception during login:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 AdminLogin - Verifying 2FA code for admin:', adminId);

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
      const response = await fetch(`${apiBaseUrl}/api/admin/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_id: adminId,
          code: totpCode
        })
      });

      const result = await response.json();
      console.log('🔐 AdminLogin - 2FA verification result:', result);

      if (result.success) {
        // Store the token and navigate to dashboard
        localStorage.setItem('kamioi_admin_token', result.token);

        // Create admin user object
        const adminUser = result.user || {
          id: adminId,
          email: formData.email,
          name: 'Admin',
          role: 'admin',
          dashboard: 'admin'
        };

        localStorage.setItem('kamioi_admin_user', JSON.stringify(adminUser));

        console.log('🔐 AdminLogin - 2FA verified, navigating to dashboard');
        navigate(`/admin/${adminId}/`);
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch (err) {
      console.error('🔐 AdminLogin - Exception during 2FA verification:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setAdminId(null);
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
              {requires2FA ? (
                <Smartphone className="w-8 h-8 text-red-400" />
              ) : (
                <Shield className="w-8 h-8 text-red-400" />
              )}
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {requires2FA ? 'Two-Factor Authentication' : 'Admin Portal'}
            </h1>
            <p className="text-white/70">
              {requires2FA
                ? 'Enter the 6-digit code from your authenticator app'
                : 'Secure access to Kamioi administration'}
            </p>
          </div>

          {!requires2FA ? (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-6">
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
            </form>
          ) : (
            /* 2FA Verification Form */
            <form onSubmit={handle2FASubmit} className="space-y-6">
              {/* TOTP Code Field */}
              <div>
                <label htmlFor="totpCode" className="block text-sm font-medium text-white/90 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="totpCode"
                    name="totpCode"
                    value={totpCode}
                    onChange={handleTotpChange}
                    required
                    autoFocus
                    maxLength={6}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl tracking-widest placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent font-mono"
                    placeholder="000000"
                  />
                </div>
                <p className="mt-2 text-sm text-white/50 text-center">
                  Open Google Authenticator and enter the code
                </p>
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
                disabled={isLoading || totpCode.length !== 6}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </motion.button>

              {/* Back Button */}
              <button
                type="button"
                onClick={handleBack}
                className="w-full text-white/70 hover:text-white text-sm py-2 transition-colors"
              >
                Back to login
              </button>
            </form>
          )}

          {/* Footer */}
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
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
