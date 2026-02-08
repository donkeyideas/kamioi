import React from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Clock, Database, Users, DollarSign, BarChart3, Brain, Target, TrendingUp, MessageSquare, Award, Megaphone, FileText, CreditCard, Settings, User } from 'lucide-react'

const LoadingReport = ({ 
  pageName, 
  loadingItems = [], 
  isVisible = false, 
  onClose = () => {} 
}) => {
  if (!isVisible) return null

  const getPageIcon = (pageName) => {
    const iconMap = {
      'Platform Overview': BarChart3,
      'Financial Analytics': DollarSign,
      'Transactions': RefreshCw,
      'Investment Summary': TrendingUp,
      'Investment Processing': Target,
      'LLM Center': Brain,
      'ML Dashboard': BarChart3,
      'LLM Data Management': Database,
      'User Management': Users,
      'Employee Management': Users,
      'Notifications & Messaging': MessageSquare,
      'Badges': Award,
      'Advertisement': Megaphone,
      'Content Management': FileText,
      'Subscriptions': CreditCard,
      'System Settings': Settings
    }
    return iconMap[pageName] || Database
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'loading':
        return 'Loading...'
      case 'success':
        return 'Loaded'
      case 'error':
        return 'Failed'
      case 'pending':
        return 'Pending'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'loading':
        return 'text-blue-400'
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'pending':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  const PageIcon = getPageIcon(pageName)
  const completedItems = loadingItems.filter(item => item.status === 'success').length
  const totalItems = loadingItems.length
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <PageIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{pageName}</h2>
              <p className="text-sm text-gray-400">Loading Report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white">Overall Progress</span>
            <span className="text-sm text-gray-400">{completedItems}/{totalItems} completed</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Loading Items */}
        <div className="space-y-3">
          {loadingItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(item.status)}
                <div>
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-gray-400">{item.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
                {item.duration && (
                  <span className="text-xs text-gray-500">
                    {item.duration}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-400">{completedItems}</p>
              <p className="text-xs text-gray-400">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {loadingItems.filter(item => item.status === 'loading').length}
              </p>
              <p className="text-xs text-gray-400">Loading</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {loadingItems.filter(item => item.status === 'error').length}
              </p>
              <p className="text-xs text-gray-400">Failed</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Close
          </button>
          {loadingItems.some(item => item.status === 'error') && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              Retry Failed
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoadingReport



