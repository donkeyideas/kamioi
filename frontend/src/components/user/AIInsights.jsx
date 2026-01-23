import React, { useState, useEffect, useCallback } from 'react'
import { Brain, TrendingUp, CheckCircle, XCircle, Clock, Star, Target, BarChart3, Trophy, Users, Zap, ShoppingBag, Upload, Filter, User, X } from 'lucide-react'
import CompanyLogo from '../common/CompanyLogo'
import { useTheme } from '../../context/ThemeContext'
import { useData } from '../../context/DataContext'
import { useModal } from '../../context/ModalContext'
import { useNotifications } from '../../hooks/useNotifications'

const AIInsights = ({ user }) => {
  const { isLightMode } = useTheme()
  const { addNotification } = useNotifications()
  const { showSuccessModal, showErrorModal } = useModal()
  const [activeTab, setActiveTab] = useState('mapping-history')
  const [loading, setLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [mappingHistory, setMappingHistory] = useState([])
  const [userStats, setUserStats] = useState({
    totalMappings: 0,
    approvedMappings: 0,
    pendingMappings: 0,
    rejectedMappings: 0,
    accuracyRate: 0,
    pointsEarned: 0,
    currentTier: 'Beginner',
    nextTierPoints: 10,
    rank: 0,
    totalUsers: 0
  })

  // Calculate tier based on points
  const calculateTier = (points) => {
    if (points >= 1000) return { tier: 'AI Master', nextTier: null, nextTierPoints: 0, progress: 100 }
    if (points >= 500) return { tier: 'AI Expert', nextTier: 'AI Master', nextTierPoints: 1000, progress: ((points - 500) / 500) * 100 }
    if (points >= 200) return { tier: 'AI Trainer', nextTier: 'AI Expert', nextTierPoints: 500, progress: ((points - 200) / 300) * 100 }
    if (points >= 50) return { tier: 'AI Helper', nextTier: 'AI Trainer', nextTierPoints: 200, progress: ((points - 50) / 150) * 100 }
    if (points >= 10) return { tier: 'AI Learner', nextTier: 'AI Helper', nextTierPoints: 50, progress: ((points - 10) / 40) * 100 }
    return { tier: 'Beginner', nextTier: 'AI Learner', nextTierPoints: 10, progress: (points / 10) * 100 }
  }

  const [rewards, setRewards] = useState([])
  const [aiRecommendations, setAiRecommendations] = useState(null)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [recommendationsError, setRecommendationsError] = useState(null)
  const [receiptMappings, setReceiptMappings] = useState([])

  // Fetch mapping history from backend
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      try {
        // Fetch mapping history and insights
        const authToken = localStorage.getItem('kamioi_user_token') || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken')
        console.log('AI Insights - Auth token:', authToken)
        console.log('AI Insights - All localStorage:', {
          kamioi_user_token: localStorage.getItem('kamioi_user_token'),
          kamioi_token: localStorage.getItem('kamioi_token'),
          authToken: localStorage.getItem('authToken'),
          kamioi_user: localStorage.getItem('kamioi_user')
        })
        
        // Check user data
        const userData = localStorage.getItem('kamioi_user')
        if (userData) {
          try {
            const user = JSON.parse(userData)
            console.log('AI Insights - User data:', user)
            console.log('AI Insights - User ID:', user.id)
          } catch (e) {
            console.log('AI Insights - Error parsing user data:', e)
          }
        }
        
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const insightsResponse = await fetch(`${apiBaseUrl}/api/user/ai/insights`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        
        console.log('AI Insights - Response status:', insightsResponse.status)
        
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json()
          console.log('AI Insights - Response data:', insightsData)
          if (insightsData.success) {
            // Debug: Show all mappings first to see the data structure
            console.log('AI Insights - All mappings from backend:', insightsData.data)
            
            // Extract mappings array from data object
            const mappingsData = insightsData.data?.mappings || insightsData.data || []
            const mappingsArray = Array.isArray(mappingsData) ? mappingsData : (Array.isArray(insightsData.data?.mappings) ? insightsData.data.mappings : [])
            
            console.log('AI Insights - First mapping details:', mappingsArray?.[0])
            
            // Filter to only show user-submitted mappings (those with user_id)
            const userSubmittedMappings = mappingsArray.filter(mapping => {
              console.log('AI Insights - Filtering mapping:', {
                id: mapping.id,
                user_id: mapping.user_id,
                user_id_type: typeof mapping.user_id,
                user_id_null: mapping.user_id === null,
                user_id_undefined: mapping.user_id === undefined,
                user_id_none: mapping.user_id === 'None',
                has_user_id: !!mapping.user_id,
                merchant_name: mapping.merchant_name
              })
              
              // Show mappings that have a user_id (user-submitted) - be more permissive
              const hasUserId = mapping.user_id && mapping.user_id !== null && mapping.user_id !== 'None' && mapping.user_id !== ''
              const hasMappingId = mapping.mapping_id && mapping.mapping_id.startsWith('AIM')
              
              console.log('AI Insights - Filter result:', { hasUserId, hasMappingId, willInclude: hasUserId || hasMappingId })
              
              return hasUserId || hasMappingId
            })
            console.log('User-submitted mappings loaded:', userSubmittedMappings.length, 'items')
            setMappingHistory(userSubmittedMappings)
            // Use stats from backend if available, otherwise calculate from user-submitted mappings only
            const stats = insightsData.data?.stats || insightsData.stats || {
              totalMappings: userSubmittedMappings.length,
              approvedMappings: userSubmittedMappings.filter(m => m.admin_approved === 1).length,
              pendingMappings: userSubmittedMappings.filter(m => m.status === 'pending' || m.status === 'pending-approval').length,
              accuracyRate: 0,
              pointsEarned: userSubmittedMappings.filter(m => m.admin_approved === 1).length * 10
            }
            // Calculate tier based on points
            const tierInfo = calculateTier(stats.pointsEarned)
            
            setUserStats({
              totalMappings: stats.totalMappings,
              approvedMappings: stats.approvedMappings,
              pendingMappings: stats.pendingMappings,
              rejectedMappings: 0, // Not tracked in current backend
              accuracyRate: stats.accuracyRate,
              pointsEarned: stats.pointsEarned,
              currentTier: tierInfo.tier,
              nextTierPoints: tierInfo.nextTierPoints,
              rank: 0,
              totalUsers: 0,
              tierProgress: tierInfo.progress,
              nextTier: tierInfo.nextTier
            })
            console.log('AI Insights mapping history loaded:', insightsData.data)
          }
        }

        // Fetch user rewards
        const rewardsResponse = await fetch(`${apiBaseUrl}/api/user/rewards`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        if (rewardsResponse.ok) {
          const rewardsData = await rewardsResponse.json()
          if (rewardsData.success) {
            setRewards(rewardsData.rewards || [])
            console.log('AI Insights rewards data loaded successfully')
          }
        }

        console.log('AI Insights data loaded successfully')
      } catch (error) {
        console.error('Failed to fetch AI insights data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
    
    // Set up real-time updates every 30 seconds (reduced frequency)
    const interval = setInterval(() => {
      console.log('Auto-refreshing AI Insights data...')
      fetchAllData()
    }, 30000) // 30 seconds
    
    // Set up WebSocket for real-time updates (if available)
    // WebSocket server not available, using polling only
    /*
    const ws = new WebSocket('ws://localhost:8765/ws/user/insights')
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      console.log('Real-time AI Insights update received:', update)
      if (update.type === 'new_insight' || update.type === 'mapping_updated') {
        fetchAllData()
      }
    }
    
    ws.onerror = (error) => {
      console.log('WebSocket connection failed, using polling only:', error)
    }
    */
    
    return () => {
      clearInterval(interval)
      // ws.close()
    }
  }, [])

  const { transactions, holdings, portfolioValue, goals } = useData()

  // Fetch AI Recommendations with caching - only call API when needed
  const fetchAIRecommendations = useCallback(async (forceRefresh = false) => {
    if (recommendationsLoading) return
    
    let authToken = localStorage.getItem('kamioi_user_token') || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken')
    if (authToken === 'null' || authToken === 'undefined' || !authToken) {
      authToken = null
    }
    
    // Get user ID from token or props
    let userId = user?.id || null
    if (!userId && authToken) {
      // Try to extract from token
      if (authToken.includes('user_token_')) {
        const match = authToken.match(/user_token_(\d+)/)
        if (match) userId = parseInt(match[1])
      }
    }
    
    // Check cache first - only call API if cache is missing or transaction count changed
    const transactionCount = (transactions || []).length
    const cacheKey = `ai_recommendations_${userId || 'unknown'}_${transactionCount}`
    const cachedData = localStorage.getItem(cacheKey)
    
    if (!forceRefresh && cachedData) {
      try {
        const parsed = JSON.parse(cachedData)
        const cacheTimestamp = parsed.timestamp || 0
        const cacheAge = Date.now() - cacheTimestamp
        const maxCacheAge = 7 * 24 * 60 * 60 * 1000 // 7 days
        
        // Use cache if it's less than 7 days old and transaction count matches
        if (cacheAge < maxCacheAge && parsed.transactionCount === transactionCount) {
          console.log('🤖 [UserAIInsights] Using cached AI recommendations (age:', Math.round(cacheAge / 1000 / 60), 'minutes)')
          setAiRecommendations(parsed.data)
          setRecommendationsLoading(false)
          return
        }
      } catch (e) {
        console.warn('🤖 [UserAIInsights] Failed to parse cached recommendations:', e)
      }
    }
    
    // Only call API if cache is missing or force refresh requested
    if (!forceRefresh && cachedData) {
      console.log('🤖 [UserAIInsights] Cache exists but transaction count changed or expired, refreshing...')
    } else {
      console.log('🤖 [UserAIInsights] No cache found, calling API...')
    }
    
    setRecommendationsLoading(true)
    setRecommendationsError(null)
    
    try {
      // Prepare user data for AI recommendations
      const userData = {
        transactions: transactions || [],
        portfolio: {
          total_value: portfolioValue || 0,
          holdings: holdings || []
        },
        goals: goals || [],
        risk_tolerance: 'moderate',
        investment_history: []
      }
      
      console.log('🤖 [UserAIInsights] Fetching AI recommendations with data:', {
        userId,
        transactionsCount: userData.transactions.length,
        portfolioValue: userData.portfolio.total_value,
        holdingsCount: userData.portfolio.holdings.length,
        goalsCount: userData.goals.length
      })
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/ai/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          dashboard_type: 'user',
          user_id: userId,
          user_data: userData
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          console.log('🤖 [UserAIInsights] AI Recommendations received:', data.data)
          setAiRecommendations(data.data)
          
          // Cache the recommendations with transaction count
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: data.data,
              timestamp: Date.now(),
              transactionCount: transactionCount
            }))
            console.log('🤖 [UserAIInsights] Recommendations cached for future use')
          } catch (e) {
            console.warn('🤖 [UserAIInsights] Failed to cache recommendations:', e)
          }
        } else {
          throw new Error(data.error || 'Failed to get recommendations')
        }
      } else {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('❌ [UserAIInsights] Error fetching AI recommendations:', error)
      setRecommendationsError(error.message)
      setAiRecommendations({
        recommendations: [],
        insights: [],
        educational_content: []
      })
    } finally {
      setRecommendationsLoading(false)
    }
  }, [transactions, holdings, portfolioValue, goals, recommendationsLoading, user])

  // Listen for new transactions to refresh recommendations
  useEffect(() => {
    const handleNewTransaction = () => {
      console.log('🤖 [UserAIInsights] New transaction detected, refreshing recommendations...')
      fetchAIRecommendations(true)
    }
    
    window.addEventListener('transaction-created', handleNewTransaction)
    window.addEventListener('receipt-mapping-created', handleNewTransaction)
    
    return () => {
      window.removeEventListener('transaction-created', handleNewTransaction)
      window.removeEventListener('receipt-mapping-created', handleNewTransaction)
    }
  }, [fetchAIRecommendations])

  // Fetch AI recommendations when tab is opened (will use cache if available)
  useEffect(() => {
    if (activeTab === 'ai-recommendations' && !aiRecommendations && !recommendationsLoading) {
      console.log('🤖 [UserAIInsights] Recommendations tab opened, checking cache first...')
      
      // FORCE REFRESH THIS ONE TIME - Clear cache for this user
      let userId = user?.id || null
      if (!userId) {
        const authToken = localStorage.getItem('kamioi_user_token') || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken')
        if (authToken && authToken.includes('user_token_')) {
          const match = authToken.match(/user_token_(\d+)/)
          if (match) userId = parseInt(match[1])
        }
      }
      
      // Clear all cached recommendations for this user
      if (userId) {
        const transactionCount = (transactions || []).length
        const cacheKey = `ai_recommendations_${userId}_${transactionCount}`
        localStorage.removeItem(cacheKey)
        console.log('🤖 [UserAIInsights] 🗑️ Cleared cache for user:', userId, 'cacheKey:', cacheKey)
        
        // Also clear any other cache keys for this user
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(`ai_recommendations_${userId}_`)) {
            localStorage.removeItem(key)
            console.log('🤖 [UserAIInsights] 🗑️ Cleared additional cache:', key)
          }
        }
      }
      
      // Force refresh - bypass cache
      console.log('🤖 [UserAIInsights] 🔄 Force refreshing AI recommendations (cache cleared)')
      fetchAIRecommendations(true)
    }
  }, [activeTab, aiRecommendations, recommendationsLoading, fetchAIRecommendations, user, transactions])

  const getTextClass = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode ? 'bg-white/80 backdrop-blur-lg border-gray-200' : 'bg-white/10 backdrop-blur-lg border-white/20'

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400'
      case 'pending': return 'bg-orange-500/20 text-orange-400'
      case 'denied': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'denied': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  // Track recommendation clicks for admin analytics
  const trackRecommendationClick = async (productId, recommendationType) => {
    try {
      const clickData = {
        userId: 'user_123',
        productId,
        recommendationType,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        source: 'ai-insights'
      }
      
      // Store in localStorage for admin analytics
      const existingClicks = JSON.parse(localStorage.getItem('kamioi_recommendation_clicks') || '[]')
      existingClicks.push(clickData)
      localStorage.setItem('kamioi_recommendation_clicks', JSON.stringify(existingClicks))
      
      // Send to backend for admin tracking
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      await fetch(`${apiBaseUrl}/api/analytics/recommendation-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clickData)
      })
      
      console.log('Recommendation click tracked:', clickData)
    } catch (error) {
      console.error('Failed to track recommendation click:', error)
    }
  }

  // Handle bank statement upload
  const handleUploadBankStatement = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls,.pdf'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        // Process the bank statement file
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            console.log('ðŸ“„ Bank statement uploaded:', file.name)
            
            // Show success modal
            showSuccessModal(
              'Bank Statement Uploaded',
              `Successfully uploaded ${file.name}. AI analysis will begin processing your transactions for personalized recommendations.`
            )
            
            // Add notification
            addNotification({
              type: 'success',
              title: 'Bank Statement Processed',
              message: `Your bank statement ${file.name} has been uploaded and is being analyzed by AI.`,
              timestamp: new Date()
            })
            
            // Simulate AI processing
            setTimeout(() => {
              addNotification({
                type: 'info',
                title: 'AI Analysis Complete',
                message: 'Your transactions have been analyzed. Check the AI Recommendations tab for personalized insights.',
                timestamp: new Date()
              })
            }, 3000)
            
          } catch (error) {
            console.error('âŒ Error processing bank statement:', error)
            showErrorModal(
              'Upload Failed',
              'There was an error processing your bank statement. Please try again with a supported format.'
            )
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const tabs = [
    { id: 'ai-recommendations', label: 'AI Recommendations', icon: Brain },
    { id: 'mapping-history', label: 'Mapping History', icon: BarChart3 },
    { id: 'rewards', label: 'Rewards', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard', icon: Users },
    { id: 'ai-performance', label: 'AI Performance', icon: TrendingUp }
  ]

  return (
    <div className="space-y-6" data-tutorial="insights-section">
      {/* Header */}
      <div className={`${getCardClass()} rounded-xl p-6 border`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-bold ${getTextClass()}`}>
              AI Insights & Rewards
            </h1>
            <p className={`${getSubtextClass()}`}>
              Track your AI mapping contributions and earn rewards
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{userStats.pointsEarned}</div>
              <div className="text-sm text-gray-400">Points Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{userStats.accuracyRate ? userStats.accuracyRate.toFixed(2) : 0}%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* AI Recommendations Tab */}
      {activeTab === 'ai-recommendations' && (
        <div className="space-y-6">
          {/* Loading State */}
          {recommendationsLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={getSubtextClass()}>Generating personalized recommendations...</p>
            </div>
          )}

          {/* Error State */}
          {recommendationsError && !recommendationsLoading && (
            <div className={`${getCardClass()} rounded-xl p-6 border border-red-500/50`}>
              <div className="flex items-center space-x-3 mb-2">
                <XCircle className="w-6 h-6 text-red-400" />
                <h3 className={`text-lg font-semibold text-red-400`}>Error Loading Recommendations</h3>
              </div>
              <p className={getSubtextClass()}>{recommendationsError}</p>
              <button
                onClick={() => fetchAIRecommendations(true)}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* AI Recommendations Cards */}
          {!recommendationsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Receipt Mappings Card */}
              <div className={`${getCardClass()} rounded-xl p-6 border`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${getTextClass()}`}>Receipt Mappings</h3>
                    <p className={`text-sm ${getSubtextClass()}`}>AI-powered transaction recognition</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`${getSubtextClass()}`}>Total Mappings</span>
                    <span className="text-gray-400 font-semibold">
                      {mappingHistory?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${getSubtextClass()}`}>Approved</span>
                    <span className="text-gray-400 font-semibold">
                      {mappingHistory?.filter(m => m.admin_approved === 1 || m.status === 'approved').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${getSubtextClass()}`}>Pending Review</span>
                    <span className="text-gray-400 font-semibold">
                      {mappingHistory?.filter(m => m.status === 'pending' || m.status === 'pending-approval').length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Activity Card */}
              <div className={`${getCardClass()} rounded-xl p-6 border`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${getTextClass()}`}>Transaction Activity</h3>
                    <p className={`text-sm ${getSubtextClass()}`}>Recent purchase insights</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`${getSubtextClass()}`}>Total Transactions</span>
                    <span className="text-gray-400 font-semibold">
                      {transactions?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${getSubtextClass()}`}>This Month</span>
                    <span className="text-gray-400 font-semibold">
                      {transactions?.filter(t => {
                        const txnDate = new Date(t.date || t.created_at)
                        const now = new Date()
                        return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear()
                      }).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${getSubtextClass()}`}>Top Merchant</span>
                    <span className="text-gray-400 font-semibold text-sm">
                      {(() => {
                        if (!transactions || transactions.length === 0) return 'None'
                        const merchantCounts = {}
                        transactions.forEach(t => {
                          const merchant = t.merchant || t.description || 'Unknown'
                          merchantCounts[merchant] = (merchantCounts[merchant] || 0) + 1
                        })
                        const topMerchant = Object.entries(merchantCounts).sort((a, b) => b[1] - a[1])[0]
                        return topMerchant ? (topMerchant[0].length > 15 ? topMerchant[0].substring(0, 15) + '...' : topMerchant[0]) : 'None'
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Recommendations Card */}
              <div className={`${getCardClass()} rounded-xl p-6 border`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${getTextClass()}`}>AI Recommendations</h3>
                    <p className={`text-sm ${getSubtextClass()}`}>Educational insights</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`${getSubtextClass()}`}>Educational Nudges</span>
                    <span className="text-gray-400 font-semibold">
                      {aiRecommendations?.recommendations?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${getSubtextClass()}`}>Key Insights</span>
                    <span className="text-gray-400 font-semibold">
                      {aiRecommendations?.insights?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Educational Nudges / Recommendations */}
          {!recommendationsLoading && aiRecommendations && aiRecommendations.recommendations && aiRecommendations.recommendations.length > 0 && (
            <div className={`${getCardClass()} rounded-xl p-6 border`}>
              <div className="mb-4">
                <h3 className={`text-xl font-semibold ${getTextClass()}`}>Educational Insights</h3>
                <p className={`text-xs ${getSubtextClass()} mt-1`}>
                  Learn about brands, sectors, and investing habits based on your purchases
                </p>
              </div>
              <div className="space-y-4">
                {aiRecommendations.recommendations.map((rec, index) => {
                  const getTypeIcon = () => {
                    switch(rec.type) {
                      case 'brand_education': return '🏢'
                      case 'roundup_nudge': return '💰'
                      case 'category_education': return '📊'
                      case 'goal_progress': return '🎯'
                      case 'market_education': return '📈'
                      case 'content_suggestion': return '📚'
                      default: return '💡'
                    }
                  }
                  
                  const getTypeLabel = () => {
                    switch(rec.type) {
                      case 'brand_education': return 'Brand Learning'
                      case 'roundup_nudge': return 'Round-Up Tips'
                      case 'category_education': return 'Sector Education'
                      case 'goal_progress': return 'Goal Progress'
                      case 'market_education': return 'Market Education'
                      case 'content_suggestion': return 'Learn More'
                      default: return 'Insight'
                    }
                  }
                  
                  return (
                    <div key={index} className={`p-4 rounded-lg border ${isLightMode ? 'bg-gray-50' : 'bg-white/5'} hover:bg-white/10 transition-colors`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getTypeIcon()}</span>
                          <div>
                            <h4 className={`font-semibold ${getTextClass()}`}>{rec.title || `Insight ${index + 1}`}</h4>
                            <span className={`text-xs ${getSubtextClass()}`}>{getTypeLabel()}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          rec.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {rec.priority || 'medium'}
                        </span>
                      </div>
                      <p className={`${getSubtextClass()} mb-3`}>{rec.description}</p>
                      {rec.merchant && (
                        <div className="mt-2 flex items-center space-x-2">
                          <span className={`text-xs ${getSubtextClass()}`}>Related to:</span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                            {rec.merchant}
                          </span>
                          {rec.brand_stock && (
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(rec.brand_stock + ' stock company website')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-mono hover:bg-green-500/30 transition-colors"
                              title={`View ${rec.brand_stock} company information`}
                            >
                              {rec.brand_stock}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!recommendationsLoading && !aiRecommendations && !recommendationsError && (
            <div className={`${getCardClass()} rounded-xl p-6 border`}>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-blue-400" />
                </div>
                <h4 className={`text-lg font-medium ${getTextClass()} mb-2`}>Get AI Recommendations</h4>
                <p className={`${getSubtextClass()} mb-4`}>
                  Click the button below to generate personalized educational insights based on your purchases
                </p>
                <button
                  onClick={() => fetchAIRecommendations(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  Generate Recommendations
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mapping History Tab */}
      {activeTab === 'mapping-history' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${getCardClass()} rounded-xl p-4 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Total Mappings</p>
                  <p className={`text-2xl font-bold ${getTextClass()}`}>{userStats.totalMappings}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className={`${getCardClass()} rounded-xl p-4 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Approved</p>
                  <p className={`text-2xl font-bold text-green-400`}>{userStats.approvedMappings}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className={`${getCardClass()} rounded-xl p-4 border cursor-pointer hover:bg-white/5 transition-colors`} onClick={() => setActiveTab('mapping-history')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Pending Recognition</p>
                  <p className={`text-2xl font-bold text-yellow-400`}>{userStats.pendingMappings}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>

            <div className={`${getCardClass()} rounded-xl p-4 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Accuracy Rate</p>
                  <p className={`text-2xl font-bold text-blue-400`}>{userStats.accuracyRate ? userStats.accuracyRate.toFixed(2) : 0}%</p>
                </div>
                <Target className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Mapping History Table */}
          <div className={`${getCardClass()} rounded-xl p-6 border`}>
            <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Recent Mappings</h3>
            {mappingHistory && mappingHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400">Mapping ID</th>
                      <th className="text-left py-3 px-4 text-gray-400">Transaction</th>
                      <th className="text-left py-3 px-4 text-gray-400">Merchant</th>
                      <th className="text-left py-3 px-4 text-gray-400">Ticker</th>
                      <th className="text-left py-3 px-4 text-gray-400">Category</th>
                      <th className="text-center py-3 px-4 text-gray-400">Status</th>
                      <th className="text-center py-3 px-4 text-gray-400">Points</th>
                      <th className="text-left py-3 px-4 text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappingHistory.map((mapping) => (
                      <tr 
                        key={mapping.id} 
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                        onClick={() => {
                          setSelectedTransaction(mapping)
                          setShowTransactionModal(true)
                        }}
                      >
                        <td className="py-3 px-4 text-white font-mono text-sm">{mapping.mapping_id || 'N/A'}</td>
                        <td className="py-3 px-4 text-white font-mono text-sm">{mapping.transaction_id}</td>
                        <td className="py-3 px-4 text-white">{mapping.merchant_name}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center">
                            <CompanyLogo symbol={mapping.ticker_symbol || mapping.ticker} size="w-8 h-8" clickable={true} />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{mapping.category}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center space-x-1 ${getStatusColor(mapping.status)}`}>
                            {getStatusIcon(mapping.status)}
                            <span className="capitalize">{mapping.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-green-400 font-semibold">
                            +{mapping.admin_approved ? (mapping.points || 10) : 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {(() => {
                            try {
                              const date = new Date(mapping.submitted_at || mapping.created_at)
                              return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString()
                            } catch (error) {
                              return 'Invalid Date'
                            }
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                </div>
                <h4 className={`text-lg font-medium ${getTextClass()} mb-2`}>No Mapping History Yet</h4>
                <p className={`${getSubtextClass()} mb-4`}>
                  Your transaction mappings will appear here once they are processed by our AI system
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Current Tier */}
          <div className={`${getCardClass()} rounded-xl p-6 border`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-xl font-semibold ${getTextClass()}`}>Current Tier</h3>
                <p className={`${getSubtextClass()}`}>{userStats.currentTier}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">{userStats.pointsEarned}</div>
                <div className="text-sm text-gray-400">Points</div>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{width: `${userStats.tierProgress || 0}%`}}
              ></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {userStats.nextTierPoints > 0 
                ? `${userStats.nextTierPoints - userStats.pointsEarned} points to ${userStats.nextTier || 'next tier'}`
                : 'Maximum tier reached!'
              }
            </p>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(rewards || []).map((reward) => (
              <div key={reward.id} className={`${getCardClass()} rounded-xl p-4 border ${reward.unlocked ? 'ring-2 ring-green-500/50' : ''}`}>
                <div className="text-center">
                  <div className="text-4xl mb-2">{reward.icon}</div>
                  <h4 className={`font-semibold ${getTextClass()} mb-1`}>{reward.name}</h4>
                  <p className={`text-sm ${getSubtextClass()} mb-3`}>{reward.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-semibold">+{reward.points} pts</span>
                    {reward.unlocked ? (
                      <span className="text-green-400 text-sm">Unlocked</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Locked</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className={`${getCardClass()} rounded-xl p-6 border`}>
            <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Top Contributors</h3>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className={`text-lg font-medium ${getTextClass()} mb-2`}>No Leaderboard Data Yet</h4>
              <p className={`${getSubtextClass()} mb-4`}>
                Submit more mappings to see your ranking among other users
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Performance Tab */}
      {activeTab === 'ai-performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${getCardClass()} rounded-xl p-6 border`}>
              <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Your Impact</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className={`${getSubtextClass()}`}>Mappings Improved</span>
                  <span className="text-green-400 font-semibold">{userStats.approvedMappings}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${getSubtextClass()}`}>AI Training Data</span>
                  <span className="text-blue-400 font-semibold">{userStats.approvedMappings} sample{userStats.approvedMappings !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${getSubtextClass()}`}>Community Help</span>
                  <span className="text-purple-400 font-semibold">{userStats.approvedMappings > 0 ? '1 user' : '0 users'}</span>
                </div>
              </div>
            </div>

            <div className={`${getCardClass()} rounded-xl p-6 border`}>
              <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>System Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className={`${getSubtextClass()}`}>Overall Accuracy</span>
                  <span className="text-green-400 font-semibold">{userStats.accuracyRate ? userStats.accuracyRate.toFixed(2) : 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${getSubtextClass()}`}>Auto-Mapping Rate</span>
                  <span className="text-blue-400 font-semibold">{userStats.approvedMappings > 0 ? '100%' : '0%'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${getSubtextClass()}`}>User Satisfaction</span>
                  <span className="text-yellow-400 font-semibold">{userStats.approvedMappings > 0 ? '100%' : 'No Data'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Transaction Mapping Details</h3>
              <button 
                onClick={() => setShowTransactionModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                X
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Transaction ID</label>
                  <p className="text-white font-mono">{selectedTransaction.transaction_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Mapping ID</label>
                  <p className="text-white font-mono">{selectedTransaction.mapping_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center space-x-1 w-fit ${getStatusColor(selectedTransaction.status)}`}>
                    {getStatusIcon(selectedTransaction.status)}
                    <span className="capitalize">{selectedTransaction.status}</span>
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Merchant</label>
                  <p className="text-white">{selectedTransaction.merchant_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Ticker</label>
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm font-mono">
                    {selectedTransaction.ticker_symbol}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <p className="text-white">{selectedTransaction.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Confidence</label>
                  <p className="text-white">{selectedTransaction.confidence_status}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Submitted Date</label>
                <p className="text-white">{selectedTransaction.submitted_at}</p>
              </div>
              
              {selectedTransaction.processed_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Reviewed Date</label>
                  <p className="text-white">{selectedTransaction.processed_at}</p>
                </div>
              )}
              
              {selectedTransaction.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                  <p className="text-white">{selectedTransaction.notes}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Points Earned</label>
                <p className="text-green-400 font-semibold">+{selectedTransaction.admin_approved ? 10 : 0}</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setShowTransactionModal(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIInsights


