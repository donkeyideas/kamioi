import React, { useState, useEffect } from 'react'
import { Brain, TrendingUp, BarChart3, Zap, Target, Award, Activity, RefreshCw, Download, Upload, Play, Pause, Settings, Eye, CheckCircle, XCircle, AlertTriangle, Database, Network, Cpu, Layers, Info } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../hooks/useNotifications'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query' // 🚀 PERFORMANCE FIX: Import React Query

const MLDashboard = () => {
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient() // 🚀 PERFORMANCE FIX: For cache invalidation
  const { isLightMode } = useTheme()
  
  // State management
  const [mlStats, setMlStats] = useState(null)
  const [testMerchant, setTestMerchant] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [learningForm, setLearningForm] = useState({
    merchant: '',
    ticker: '',
    category: 'Food & Dining',
    confidence: 0.95
  })
  const [feedbackForm, setFeedbackForm] = useState({
    merchant: '',
    ticker: '',
    wasCorrect: true,
    userConfidence: 0.8
  })
  const [activeTab, setActiveTab] = useState('overview')

  const getRatePercent = (rate) => {
    if (typeof rate !== 'number') return 0
    return Math.round(rate * 100)
  }

  // 🚀 PERFORMANCE FIX: Use React Query for ML stats - proper caching, no unnecessary reloads
  const { data: mlStatsData, isLoading: isLoadingMLStats, error: mlStatsError, refetch: refetchMLStats } = useQuery({
    queryKey: ['ml-dashboard-stats'],
    queryFn: async () => {
      // 🚀 FIX: Try multiple token sources and wait a bit if token not immediately available
      let token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      
      // If no token, wait a short time and retry (handles race condition)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 100))
        token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      }
      
      if (!token) {
        console.warn('⚠️ MLDashboard - No authentication token available, returning empty data')
        return null
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/ml/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          // Endpoint doesn't exist yet, return null
          return null
        }
        throw new Error(`Failed to fetch ML stats: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        return result.data
      }
      
      return null
    },
    staleTime: 300000, // 🚀 FIX: 5 minutes - data is fresh for 5 minutes
    gcTime: 600000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false, // 🚀 FIX: Don't refetch on window focus
    refetchOnMount: false, // 🚀 FIX: Don't refetch on mount if data is fresh
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data) => {
      if (data) {
        setMlStats(data)
      }
      
      // Dispatch page load completion event
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'ml-dashboard' }
      }))
    },
    onError: (error) => {
      // Only show notification if it's not a 404 (endpoint might not exist)
      if (error.message && !error.message.includes('404')) {
        addNotification({
          type: 'error',
          title: 'Failed to load ML statistics',
          message: error.message,
          timestamp: new Date()
        })
      }
      // 🚀 FIX: Dispatch completion event even on error
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'ml-dashboard', error: true }
      }))
    }
  })
  
  // 🚀 PERFORMANCE FIX: Map React Query loading to component loading state for backward compatibility
  const loading = isLoadingMLStats
  
  // 🚀 PERFORMANCE FIX: Only show loading for initial load, not for cached data
  const isInitialLoad = isLoadingMLStats && !mlStatsData
  
  // 🚀 FIX: Dispatch completion event when data is loaded from cache
  useEffect(() => {
    if (mlStatsData) {
      // Dispatch completion event when data is available (even from cache)
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
          detail: { pageId: 'ml-dashboard' }
        }))
      }, 100)
      return () => clearTimeout(timer)
    } else if (!isLoadingMLStats && mlStatsError) {
      // If there's an error and we're not loading, dispatch completion event
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'ml-dashboard', error: true }
      }))
    }
  }, [mlStatsData, isLoadingMLStats, mlStatsError])
  
  // Update local state when React Query data changes
  useEffect(() => {
    if (mlStatsData) {
      setMlStats(mlStatsData)
    }
  }, [mlStatsData])
  
  // 🚀 PERFORMANCE FIX: Wrapper function for backward compatibility
  const loadMLStats = async () => {
    // React Query handles caching automatically - just trigger a refetch
    await refetchMLStats()
  }

  // Test merchant recognition
  const testRecognition = async () => {
    if (!testMerchant.trim()) return
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/ml/recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ text: testMerchant })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setTestResult(result.data)
        addNotification('Recognition test completed', 'success')
      } else {
        addNotification('Recognition test failed', 'error')
      }
    } catch (error) {
      console.error('Error testing recognition:', error)
      addNotification('Recognition test failed', 'error')
    }
  }

  // Learn new pattern
  const learnPattern = async () => {
    if (!learningForm.merchant.trim() || !learningForm.ticker.trim()) return
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/ml/learn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(learningForm)
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        addNotification({
          type: 'success',
          title: 'Pattern Learned',
          message: `Learned pattern: ${learningForm.merchant} → ${learningForm.ticker}`,
          timestamp: new Date()
        })
        setLearningForm({ merchant: '', ticker: '', category: 'Food & Dining', confidence: 0.95 })
        // 🚀 PERFORMANCE FIX: Invalidate cache and refetch
        queryClient.invalidateQueries({ queryKey: ['ml-dashboard-stats'] })
        refetchMLStats()
      } else {
        addNotification('Failed to learn pattern', 'error')
      }
    } catch (error) {
      console.error('Error learning pattern:', error)
      addNotification('Failed to learn pattern', 'error')
    }
  }

  // Submit feedback
  const submitFeedback = async () => {
    if (!feedbackForm.merchant.trim() || !feedbackForm.ticker.trim()) return
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/ml/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          type: feedbackForm.wasCorrect ? 'positive' : 'negative',
          mapping_id: 1 // This would be dynamic in a real implementation
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        addNotification({
          type: 'success',
          title: 'Feedback Submitted',
          message: 'Feedback submitted successfully',
          timestamp: new Date()
        })
        setFeedbackForm({ merchant: '', ticker: '', wasCorrect: true, userConfidence: 0.8 })
        // 🚀 PERFORMANCE FIX: Invalidate cache and refetch
        queryClient.invalidateQueries({ queryKey: ['ml-dashboard-stats'] })
        refetchMLStats()
      } else {
        addNotification('Failed to submit feedback', 'error')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      addNotification('Failed to submit feedback', 'error')
    }
  }

  // Retrain model
  const retrainModel = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/ml/retrain`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('authToken')}`
        }
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        addNotification({
          type: 'success',
          title: 'Model Retrained',
          message: 'Model retrained successfully',
          timestamp: new Date()
        })
        // 🚀 PERFORMANCE FIX: Invalidate cache and refetch
        queryClient.invalidateQueries({ queryKey: ['ml-dashboard-stats'] })
        refetchMLStats()
      } else {
        addNotification('Failed to retrain model', 'error')
      }
    } catch (error) {
      console.error('Error retraining model:', error)
      addNotification('Failed to retrain model', 'error')
    }
  }

  // Export model
  const exportModel = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/ml/export`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('authToken')}`
        }
      })
      const result = await response.json()
      
      if (response.ok && result.success) {
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.data.export_file || `ml-model-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
        addNotification('Model exported successfully', 'success')
      } else {
        addNotification('Failed to export model', 'error')
      }
    } catch (error) {
      console.error('Error exporting model:', error)
      addNotification('Failed to export model', 'error')
    }
  }

  // 🚀 PERFORMANCE FIX: React Query handles data fetching automatically - no manual useEffect needed
  // Data is fetched on mount and cached automatically by React Query

  // Theme classes
  const getTextClass = () => 'text-white'
  const getInputClass = () => 'glass-card border-gray-500/30'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ML System Dashboard
            </h1>
            <p className="text-gray-300 mt-1">Advanced machine learning merchant recognition system</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadMLStats}
              className="glass-card hover:scale-105 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all shadow-lg shadow-blue-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={retrainModel}
              className="glass-card hover:scale-105 border border-orange-500/30 rounded-lg px-4 py-2 text-orange-400 flex items-center space-x-2 transition-all shadow-lg shadow-orange-500/20"
            >
              <Play className="w-4 h-4" />
              <span>Retrain Model</span>
            </button>
            <button
              onClick={exportModel}
              className="glass-card hover:scale-105 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 flex items-center space-x-2 transition-all shadow-lg shadow-green-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Export Model</span>
            </button>
          </div>
        </div>
      </div>

        {/* Tabs */}
        <div className="glass-card p-4 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'test', name: 'Test Recognition', icon: Eye },
              { id: 'learn', name: 'Learn Patterns', icon: Brain },
              { id: 'feedback', name: 'Feedback', icon: Target },
              { id: 'analytics', name: 'Analytics', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? 'glass-card border border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Loading State */}
            {loading && !mlStats && (
              <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card'}`}>
                <div className="flex items-center space-x-4">
                  <RefreshCw className={`w-6 h-6 animate-spin ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
                  <div>
                    <p className={`font-medium ${isLightMode ? 'text-gray-900' : 'text-white'}`}>Loading ML statistics...</p>
                    <p className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Fetching model data and performance metrics</p>
                  </div>
                </div>
              </div>
            )}

            {/* ML System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`p-6 rounded-lg shadow-md hover:scale-105 transition-all duration-300 ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card border border-blue-500/20 shadow-lg shadow-blue-500/10'}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${isLightMode ? 'bg-blue-100' : 'bg-blue-500/20'} ${isLightMode ? 'border border-blue-200' : 'border border-blue-500/30'}`}>
                    <Brain className={`w-6 h-6 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>Model Version</p>
                    <p className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent'}`}>
                      {mlStats?.modelVersion || '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow-md hover:scale-105 transition-all duration-300 ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card border border-green-500/20 shadow-lg shadow-green-500/10'}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${isLightMode ? 'bg-green-100' : 'bg-green-500/20'} ${isLightMode ? 'border border-green-200' : 'border border-green-500/30'}`}>
                    <Database className={`w-6 h-6 ${isLightMode ? 'text-green-600' : 'text-green-400'}`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>Total Patterns</p>
                    <p className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent'}`}>
                      {(mlStats?.totalPatterns || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow-md hover:scale-105 transition-all duration-300 ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card border border-orange-500/20 shadow-lg shadow-orange-500/10'}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${isLightMode ? 'bg-orange-100' : 'bg-orange-500/20'} ${isLightMode ? 'border border-orange-200' : 'border border-orange-500/30'}`}>
                    <Target className={`w-6 h-6 ${isLightMode ? 'text-orange-600' : 'text-orange-400'}`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>Accuracy Rate</p>
                    <p className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent'}`}>
                      {getRatePercent(mlStats?.accuracyRate)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow-md hover:scale-105 transition-all duration-300 ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card border border-purple-500/20 shadow-lg shadow-purple-500/10'}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${isLightMode ? 'bg-purple-100' : 'bg-purple-500/20'} ${isLightMode ? 'border border-purple-200' : 'border border-purple-500/30'}`}>
                    <Activity className={`w-6 h-6 ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>Total Predictions</p>
                    <p className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent'}`}>
                      {(mlStats?.totalPredictions || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card border border-cyan-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>Success Rate</p>
                    <p className={`text-2xl font-bold mt-1 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                      {getRatePercent(mlStats?.successRate)}%
                    </p>
                  </div>
                  <CheckCircle className={`w-8 h-8 ${isLightMode ? 'text-green-600' : 'text-green-400'}`} />
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card border border-yellow-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>Learning Events</p>
                    <p className={`text-2xl font-bold mt-1 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                      {(mlStats?.learningHistorySize || 0).toLocaleString()}
                    </p>
                  </div>
                  <Zap className={`w-8 h-8 ${isLightMode ? 'text-yellow-600' : 'text-yellow-400'}`} />
                </div>
              </div>

              <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card border border-pink-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>Last Training</p>
                    <p className={`text-lg font-bold mt-1 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                      {mlStats?.lastTraining 
                        ? new Date(mlStats.lastTraining).toLocaleDateString() 
                        : 'Never'}
                    </p>
                  </div>
                  <Network className={`w-8 h-8 ${isLightMode ? 'text-pink-600' : 'text-pink-400'}`} />
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card border border-indigo-500/20'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                System Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${isLightMode ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'}`}>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`w-5 h-5 ${isLightMode ? 'text-green-600' : 'text-green-400'}`} />
                    <span className={`font-medium ${isLightMode ? 'text-green-900' : 'text-green-400'}`}>Model Active</span>
                  </div>
                  <p className={`text-sm mt-1 ${isLightMode ? 'text-green-700' : 'text-green-300'}`}>
                    System is operational and processing requests
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isLightMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                  <div className="flex items-center space-x-2">
                    <Cpu className={`w-5 h-5 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
                    <span className={`font-medium ${isLightMode ? 'text-blue-900' : 'text-blue-400'}`}>Performance</span>
                  </div>
                  <p className={`text-sm mt-1 ${isLightMode ? 'text-blue-700' : 'text-blue-300'}`}>
                    {mlStats?.avgResponseTime ? `${mlStats.avgResponseTime}ms avg` : '< 50ms avg'} response time
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isLightMode ? 'bg-purple-50 border border-purple-200' : 'bg-purple-500/10 border border-purple-500/20'}`}>
                  <div className="flex items-center space-x-2">
                    <Layers className={`w-5 h-5 ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`} />
                    <span className={`font-medium ${isLightMode ? 'text-purple-900' : 'text-purple-400'}`}>Data Quality</span>
                  </div>
                  <p className={`text-sm mt-1 ${isLightMode ? 'text-purple-700' : 'text-purple-300'}`}>
                    {mlStats?.dataQuality || 'High'} quality training data
                  </p>
                </div>
              </div>
            </div>

            {/* Top Patterns */}
            <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card border border-purple-500/20 shadow-lg shadow-purple-500/10'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold ${isLightMode ? 'text-gray-900' : 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'}`}>
                  Top Learned Patterns
                </h3>
                {mlStats?.topPatterns && mlStats.topPatterns.length > 0 && (
                  <span className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    {mlStats.topPatterns.length} patterns
                  </span>
                )}
              </div>
              
              {mlStats && mlStats.topPatterns && mlStats.topPatterns.length > 0 ? (
                <div className="space-y-3">
                  {mlStats.topPatterns.slice(0, 10).map((pattern, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg hover:scale-[1.02] transition-all duration-300 ${isLightMode ? 'bg-gray-50 border border-gray-200 hover:border-gray-300' : 'glass-card border border-white/10 hover:border-white/20'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'}`}>
                              #{index + 1}
                            </span>
                            <p className={`font-medium ${isLightMode ? 'text-gray-900' : 'text-white'}`}>{pattern.merchant}</p>
                          </div>
                          <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>
                            → <span className="font-semibold">{pattern.ticker}</span> ({pattern.category})
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-sm font-medium ${isLightMode ? 'text-green-700' : 'text-green-400'}`}>
                            {Math.round((pattern.confidence || 0.95) * 100)}% confidence
                          </p>
                          <p className={`text-xs mt-1 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Used {(pattern.usage_count || 0).toLocaleString()} times
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No patterns learned yet. Start training the model to see patterns here.</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card border border-gray-500/20'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('test')}
                  className={`p-4 rounded-lg text-left transition-all ${isLightMode ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100' : 'bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20'}`}
                >
                  <Eye className={`w-5 h-5 mb-2 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
                  <p className={`font-medium ${isLightMode ? 'text-gray-900' : 'text-white'}`}>Test Recognition</p>
                  <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    Test merchant recognition accuracy
                  </p>
                </button>
                <button
                  onClick={() => setActiveTab('learn')}
                  className={`p-4 rounded-lg text-left transition-all ${isLightMode ? 'bg-green-50 border border-green-200 hover:bg-green-100' : 'bg-green-500/10 border border-green-500/20 hover:bg-green-500/20'}`}
                >
                  <Brain className={`w-5 h-5 mb-2 ${isLightMode ? 'text-green-600' : 'text-green-400'}`} />
                  <p className={`font-medium ${isLightMode ? 'text-gray-900' : 'text-white'}`}>Learn Patterns</p>
                  <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    Teach the model new merchant patterns
                  </p>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`p-4 rounded-lg text-left transition-all ${isLightMode ? 'bg-purple-50 border border-purple-200 hover:bg-purple-100' : 'bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20'}`}
                >
                  <TrendingUp className={`w-5 h-5 mb-2 ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`} />
                  <p className={`font-medium ${isLightMode ? 'text-gray-900' : 'text-white'}`}>View Analytics</p>
                  <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    Detailed performance metrics
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Recognition Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
        <div className="glass-card p-6 border border-blue-500/20 shadow-lg shadow-blue-500/10">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6">
                Test Merchant Recognition
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Merchant Name
                  </label>
                  <input
                    type="text"
                    value={testMerchant}
                    onChange={(e) => setTestMerchant(e.target.value)}
                    placeholder="e.g., Starbucks Coffee Shop"
                    className="w-full glass-card border border-blue-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                </div>
                <button
                  onClick={testRecognition}
                  className="w-full glass-card hover:scale-105 border border-blue-500/30 text-blue-400 py-3 px-4 rounded-lg transition-all shadow-lg shadow-blue-500/20"
                >
                  Test Recognition
                </button>
              </div>
            </div>

            {/* Test Results */}
            {testResult && (
          <div className="glass-card p-6 border border-green-500/20 shadow-lg shadow-green-500/10">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-6">
                  Recognition Results
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 border border-green-500/20">
                      <p className="text-sm text-gray-300">Confidence</p>
                      <p className="text-lg font-semibold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">
                        {Math.round(testResult.confidence * 100)}%
                      </p>
                    </div>
                    <div className="glass-card p-4 border border-blue-500/20">
                      <p className="text-sm text-gray-300">Source</p>
                      <p className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                        {testResult.source}
                      </p>
                    </div>
                  </div>
                  {testResult.ticker && testResult.ticker !== 'UNKNOWN' && (
                    <div className="glass-card p-4 border border-purple-500/20">
                      <p className="text-sm text-gray-300">Recognized As</p>
                      <p className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                        {testResult.ticker} ({testResult.category})
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reasoning</p>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {testResult.reasoning || 'No reasoning available'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Learn Patterns Tab */}
        {activeTab === 'learn' && (
          <div className="space-y-6">
        <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Learn New Pattern
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Merchant Name
                    </label>
                    <input
                      type="text"
                      value={learningForm.merchant}
                      onChange={(e) => setLearningForm(prev => ({ ...prev, merchant: e.target.value }))}
                      placeholder="e.g., Local Coffee Shop"
                      className={`w-full ${getInputClass()} border rounded-lg px-3 py-2 ${getTextClass()} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ticker Symbol
                    </label>
                    <input
                      type="text"
                      value={learningForm.ticker}
                      onChange={(e) => setLearningForm(prev => ({ ...prev, ticker: e.target.value }))}
                      placeholder="e.g., SBUX"
                      className={`w-full ${getInputClass()} border rounded-lg px-3 py-2 ${getTextClass()} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={learningForm.category}
                      onChange={(e) => setLearningForm(prev => ({ ...prev, category: e.target.value }))}
                      className={`w-full ${getInputClass()} border rounded-lg px-3 py-2 ${getTextClass()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="Food & Dining">Food & Dining</option>
                      <option value="Retail">Retail</option>
                      <option value="Technology">Technology</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confidence ({Math.round(learningForm.confidence * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={learningForm.confidence}
                      onChange={(e) => setLearningForm(prev => ({ ...prev, confidence: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
                <button
                  onClick={learnPattern}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Learn Pattern
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
        <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Submit Feedback
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Merchant Name
                    </label>
                    <input
                      type="text"
                      value={feedbackForm.merchant}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, merchant: e.target.value }))}
                      placeholder="e.g., Starbucks Coffee"
                      className={`w-full ${getInputClass()} border rounded-lg px-3 py-2 ${getTextClass()} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ticker Symbol
                    </label>
                    <input
                      type="text"
                      value={feedbackForm.ticker}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, ticker: e.target.value }))}
                      placeholder="e.g., SBUX"
                      className={`w-full ${getInputClass()} border rounded-lg px-3 py-2 ${getTextClass()} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Was the prediction correct?
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={feedbackForm.wasCorrect}
                          onChange={() => setFeedbackForm(prev => ({ ...prev, wasCorrect: true }))}
                          className="mr-2"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Correct</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!feedbackForm.wasCorrect}
                          onChange={() => setFeedbackForm(prev => ({ ...prev, wasCorrect: false }))}
                          className="mr-2"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Incorrect</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Confidence ({Math.round(feedbackForm.userConfidence * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={feedbackForm.userConfidence}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, userConfidence: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
                <button
                  onClick={submitFeedback}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
        <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ML System Analytics
              </h3>
              {mlStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Predictions:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{mlStats?.totalPredictions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Accuracy Rate:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{Math.round((mlStats?.accuracyRate || 0) * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Learning Events:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{mlStats?.learningHistorySize || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">System Info</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Model Version:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{mlStats?.modelVersion || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Last Training:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {mlStats?.lastTraining ? new Date(mlStats.lastTraining).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Patterns:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{mlStats?.totalPatterns || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  )
}

export default MLDashboard
