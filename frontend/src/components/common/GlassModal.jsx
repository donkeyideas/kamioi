import React from 'react'
import { X, AlertCircle, CheckCircle, Info, DollarSign, Brain, MapPin, User } from 'lucide-react'

const GlassModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info'
  confirmText = 'OK',
  onConfirm,
  cancelText,
  onCancel,
  showCloseButton = true,
  user = null // User object for user details modal
}) => {
  if (!isOpen) return null

  // If user prop is passed, render User Details modal
  if (user) {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="glass-card rounded-2xl shadow-2xl border border-white/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-xl font-bold text-white">{title || 'User Details'}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-xl font-semibold text-white">{user.name || 'Unknown'}</p>
              <p className="text-gray-400">{user.email || 'No email'}</p>
              <p className="text-gray-500 text-sm">ID: {user.id}</p>
            </div>
          </div>

          {/* Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-white font-semibold mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                Financial Metrics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Balance:</span>
                  <span className="text-white">${(user.total_balance || user.totalPortfolioValue || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Round-ups:</span>
                  <span className="text-white">${(user.round_ups || user.totalRoundUps || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Growth Rate:</span>
                  <span className="text-white">{(user.growth_rate || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-white font-semibold mb-3 flex items-center">
                <Brain className="w-4 h-4 mr-2 text-purple-400" />
                AI & Behavioral
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">AI Health:</span>
                  <span className="text-white">{user.ai_health || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mapping Accuracy:</span>
                  <span className="text-white">{(user.mapping_accuracy || 0).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className={`${
                    user.risk_level === 'High' ? 'text-red-400' :
                    user.risk_level === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>{user.risk_level || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Engagement:</span>
                  <span className="text-white">{user.engagement || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-6">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-400" />
              Address Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">City:</span>
                <span className="text-white">{user.address?.city || user.city || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">State:</span>
                <span className="text-white">{user.address?.state || user.state || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ZIP Code:</span>
                <span className="text-white">{user.address?.zip || user.zip || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phone:</span>
                <span className="text-white">{user.phone || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <User className="w-4 h-4 mr-2 text-cyan-400" />
              Account Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Account Type:</span>
                <span className="text-white">{user.account_type || user.role || 'individual'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`${
                  user.status === 'Active' ? 'text-green-400' :
                  user.status === 'Suspended' ? 'text-red-400' : 'text-yellow-400'
                }`}>{user.status || 'Active'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Created:</span>
                <span className="text-white">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Login:</span>
                <span className="text-white">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default modal (for notifications, confirmations, etc.)
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-400" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-400" />
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-400" />
      default:
        return <Info className="w-6 h-6 text-blue-400" />
    }
  }

  const getTitleColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'warning':
        return 'text-yellow-400'
      default:
        return 'text-blue-400'
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl shadow-2xl border border-white/20 p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h3 className={`text-xl font-bold ${getTitleColor()}`}>
              {title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information')}
            </h3>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-white text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          {onCancel && cancelText && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-200"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm || onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              type === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : type === 'error'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : type === 'warning'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GlassModal
