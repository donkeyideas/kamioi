import React, { useState, useEffect, useCallback } from 'react'
import { Brain, TrendingUp, Award, CheckCircle, XCircle, Clock, Star, Target, BarChart3, Trophy, Users, Zap, ShoppingBag, Home, Upload, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useData } from '../../context/DataContext'
import CompanyLogo from '../common/CompanyLogo'

// Check if in demo mode
const isDemoMode = localStorage.getItem('kamioi_demo_mode') === 'true'

// Demo AI recommendations for demo mode
const DEMO_AI_RECOMMENDATIONS = {
  recommendations: [
    {
      type: 'brand_education',
      title: 'Family Shopping Investment',
      description: 'Your family frequently shops at Target. TGT stock has shown steady growth of 8% this year. Round-ups from Target purchases build family wealth!',
      merchant: 'Target',
      brand_stock: 'TGT',
      priority: 'high'
    },
    {
      type: 'roundup_nudge',
      title: 'Boost Family Savings',
      description: 'Increasing your round-up from $1 to $1.50 could add $45 more per month to your family portfolio based on current spending.',
      priority: 'medium'
    },
    {
      type: 'category_education',
      title: 'Entertainment Diversification',
      description: 'Your family enjoys Netflix and Disney+. Consider how streaming investments (DIS, NFLX) align with your viewing habits!',
      category: 'Entertainment',
      priority: 'low'
    }
  ],
  insights: [
    'Your family has invested $120 through round-ups this month',
    'Top family investment: SBUX (+8.5%)',
    'All 4 family members are contributing regularly'
  ],
  disclaimer: "Kamioi's insights are for educational purposes only and are not financial advice or recommendations."
}

// Demo mapping history for demo mode
const DEMO_MAPPING_HISTORY = [
  {
    id: 'demo-map-1',
    merchant_name: 'Starbucks',
    ticker: 'SBUX',
    company_name: 'Starbucks Corporation',
    category: 'Food & Dining',
    confidence: 0.95,
    status: 'approved',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-map-2',
    merchant_name: 'Target',
    ticker: 'TGT',
    company_name: 'Target Corporation',
    category: 'Shopping',
    confidence: 0.92,
    status: 'approved',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-map-3',
    merchant_name: 'Netflix',
    ticker: 'NFLX',
    company_name: 'Netflix Inc',
    category: 'Entertainment',
    confidence: 0.98,
    status: 'auto-approved',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-map-4',
    merchant_name: 'Amazon',
    ticker: 'AMZN',
    company_name: 'Amazon.com Inc',
    category: 'Shopping',
    confidence: 0.97,
    status: 'approved',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Demo rewards for demo mode
const DEMO_REWARDS = [
  {
    id: 'reward-1',
    type: 'mapping_milestone',
    title: 'First 10 Mappings',
    description: 'Your family approved 10 AI mappings!',
    points: 50,
    earned_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    icon: 'trophy'
  },
  {
    id: 'reward-2',
    type: 'accuracy_bonus',
    title: 'High Accuracy',
    description: 'Maintained 90%+ mapping accuracy',
    points: 25,
    earned_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    icon: 'target'
  },
  {
    id: 'reward-3',
    type: 'streak',
    title: 'Weekly Streak',
    description: 'Family contributed for 7 days straight!',
    points: 30,
    earned_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    icon: 'zap'
  }
]

// Demo leaderboard for demo mode
const DEMO_LEADERBOARD = [
  { rank: 1, name: 'Sarah Johnson', points: 245, mappings: 28, avatar: 'S' },
  { rank: 2, name: 'Michael Johnson', points: 180, mappings: 22, avatar: 'M' },
  { rank: 3, name: 'Emma Johnson', points: 125, mappings: 15, avatar: 'E' },
  { rank: 4, name: 'Jake Johnson', points: 95, mappings: 12, avatar: 'J' }
]

// Demo AI performance stats
const DEMO_AI_PERFORMANCE = {
  total_mappings: 77,
  auto_approved: 45,
  manual_approved: 28,
  pending: 4,
  accuracy_rate: 94.8,
  avg_confidence: 0.89,
  top_categories: ['Shopping', 'Food & Dining', 'Entertainment'],
  improvement_trend: '+5.2%'
}

const FamilyAIInsights = ({ user }) => {
  const { isLightMode } = useTheme()
  const [activeTab, setActiveTab] = useState('ai-recommendations')
  const [loading, setLoading] = useState(false)
  const [userStats, setUserStats] = useState({
    totalMappings: 0,
    approvedMappings: 0,
    pendingMappings: 0,
    rejectedMappings: 0,
    accuracyRate: 0,
    pointsEarned: 0,
    currentTier: 'Beginner',
    nextTierPoints: 10
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
  const [mappingHistory, setMappingHistory] = useState([])
  const [rewards, setRewards] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [aiPerformance, setAiPerformance] = useState({})
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState(null)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [recommendationsError, setRecommendationsError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Use demo data in demo mode
      if (isDemoMode) {
        console.log('🎭 [FamilyAIInsights] Using demo mode data')
        setMappingHistory(DEMO_MAPPING_HISTORY)
        setRewards(DEMO_REWARDS)
        setLeaderboard(DEMO_LEADERBOARD)
        setAiPerformance(DEMO_AI_PERFORMANCE)

        const points = 105 // Demo points
        const tierInfo = calculateTier(points)
        setUserStats({
          totalMappings: 12,
          approvedMappings: 10,
          pendingMappings: 2,
          rejectedMappings: 0,
          accuracyRate: 83.3,
          pointsEarned: points,
          currentTier: tierInfo.tier,
          nextTierPoints: tierInfo.nextTierPoints,
          tierProgress: tierInfo.progress,
          nextTier: tierInfo.nextTier,
          rank: 2,
          totalUsers: 4
        })
        setLoading(false)
        return
      }

      try {
        // Get token with fallback
        const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
        if (!token) {
          console.error('❌ No token found in localStorage')
          setLoading(false)
          return
        }
        
        console.log('🔑 Using token for AI Insights:', token ? `${token.substring(0, 20)}...` : 'null')
        
        // Fetch family AI insights data
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const [insightsResponse, mappingResponse, rewardsResponse, leaderboardResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/family/ai-insights`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${apiBaseUrl}/api/family/mapping-history`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${apiBaseUrl}/api/family/rewards`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${apiBaseUrl}/api/family/leaderboard`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ])
        
        console.log('📡 AI Insights responses:', {
          insights: insightsResponse.status,
          mapping: mappingResponse.status,
          rewards: rewardsResponse.status,
          leaderboard: leaderboardResponse.status
        })
        
        // Process AI insights
        let insightsResult = null
        if (insightsResponse.ok) {
          insightsResult = await insightsResponse.json()
          if (insightsResult.success) {
            setAiPerformance(insightsResult.insights)
          }
        } else {
          insightsResult = await insightsResponse.json().catch(() => ({ error: 'Failed to parse error response' }))
          console.error('❌ AI Insights error:', insightsResponse.status, insightsResult)
        }
        
        // Process mapping history
        let mappingResult = null
        if (mappingResponse.ok) {
          mappingResult = await mappingResponse.json()
          if (mappingResult.success) {
            setMappingHistory(mappingResult.data.mappings || [])
            const points = mappingResult.data.stats.points_earned || 0
            const tierInfo = calculateTier(points)
            
            setUserStats({
              totalMappings: mappingResult.data.stats.total_mappings || 0,
              approvedMappings: mappingResult.data.stats.approved_mappings || 0,
              pendingMappings: mappingResult.data.stats.pending_mappings || 0,
              rejectedMappings: 0,
              accuracyRate: mappingResult.data.stats.accuracy_rate || 0,
              pointsEarned: points,
              currentTier: tierInfo.tier,
              nextTierPoints: tierInfo.nextTierPoints,
              tierProgress: tierInfo.progress,
              nextTier: tierInfo.nextTier
            })
          }
        } else {
          mappingResult = await mappingResponse.json().catch(() => ({ error: 'Failed to parse error response' }))
          console.error('❌ Mapping History error:', mappingResponse.status, mappingResult)
        }
        
        // Process rewards
        let rewardsResult = null
        if (rewardsResponse.ok) {
          rewardsResult = await rewardsResponse.json()
          if (rewardsResult.success) {
            setRewards(rewardsResult.data.rewards || [])
            const points = rewardsResult.data.points.total || 0
            const tierInfo = calculateTier(points)
            
            setUserStats(prev => ({
              ...prev,
              pointsEarned: points,
              currentTier: tierInfo.tier,
              nextTierPoints: tierInfo.nextTierPoints,
              tierProgress: tierInfo.progress,
              nextTier: tierInfo.nextTier
            }))
          }
        } else {
          rewardsResult = await rewardsResponse.json().catch(() => ({ error: 'Failed to parse error response' }))
          console.error('❌ Rewards error:', rewardsResponse.status, rewardsResult)
        }
        
        // Process leaderboard
        let leaderboardResult = null
        if (leaderboardResponse.ok) {
          leaderboardResult = await leaderboardResponse.json()
          if (leaderboardResult.success) {
            setLeaderboard(leaderboardResult.data.leaderboard || [])
          }
        } else {
          leaderboardResult = await leaderboardResponse.json().catch(() => ({ error: 'Failed to parse error response' }))
          console.error('❌ Leaderboard error:', leaderboardResponse.status, leaderboardResult)
        }

        console.log('✅ Family AI Insights data loaded successfully')
      } catch (error) {
        console.error('❌ Failed to fetch Family AI insights data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Set up real-time updates every 25 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing Family AI Insights data...')
      fetchData()
    }, 25001) // 25 seconds
    
    // Set up WebSocket for real-time updates (if available)
    // WebSocket server not available, using polling only
    /*
    const ws = new WebSocket('ws://localhost:8765/ws/family/insights')
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      console.log('📡 Real-time Family AI Insights update received:', update)
      if (update.type === 'new_insight' || update.type === 'mapping_updated') {
        fetchData()
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

    // Use demo data in demo mode
    if (isDemoMode) {
      setRecommendationsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate loading
      console.log('🎭 [FamilyAIInsights] Using demo AI recommendations')
      setAiRecommendations(DEMO_AI_RECOMMENDATIONS)
      setRecommendationsLoading(false)
      return
    }

    let authToken = localStorage.getItem('kamioi_user_token') || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken')
    if (authToken === 'null' || authToken === 'undefined' || !authToken) {
      authToken = null
    }
    
    // Get user ID from token or props
    let userId = user?.id || null
    if (!userId && authToken) {
      // Try to extract from token
      if (authToken.includes('user_token_') || authToken.includes('family_token_')) {
        const match = authToken.match(/(?:user_token_|family_token_)(\d+)/)
        if (match) userId = parseInt(match[1])
      }
    }
    
    // Check cache first - only call API if cache is missing or transaction count changed
    const transactionCount = (transactions || []).length
    const cacheKey = `ai_recommendations_family_${userId || 'unknown'}_${transactionCount}`
    const cachedData = localStorage.getItem(cacheKey)
    
    if (!forceRefresh && cachedData) {
      try {
        const parsed = JSON.parse(cachedData)
        const cacheTimestamp = parsed.timestamp || 0
        const cacheAge = Date.now() - cacheTimestamp
        const maxCacheAge = 7 * 24 * 60 * 60 * 1000 // 7 days
        
        // Use cache if it's less than 7 days old and transaction count matches
        if (cacheAge < maxCacheAge && parsed.transactionCount === transactionCount) {
          console.log('🤖 [FamilyAIInsights] Using cached AI recommendations (age:', Math.round(cacheAge / 1000 / 60), 'minutes)')
          setAiRecommendations(parsed.data)
          setRecommendationsLoading(false)
          return
        }
      } catch (e) {
        console.warn('🤖 [FamilyAIInsights] Failed to parse cached recommendations:', e)
      }
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
      
      console.log('🤖 [FamilyAIInsights] Fetching AI recommendations with data:', {
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
          dashboard_type: 'family',
          user_id: userId,
          user_data: userData
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          console.log('🤖 [FamilyAIInsights] AI Recommendations received:', data.data)
          setAiRecommendations(data.data)
          
          // Cache the recommendations with transaction count
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: data.data,
              timestamp: Date.now(),
              transactionCount: transactionCount
            }))
            console.log('🤖 [FamilyAIInsights] Recommendations cached for future use')
          } catch (e) {
            console.warn('🤖 [FamilyAIInsights] Failed to cache recommendations:', e)
          }
        } else {
          throw new Error(data.error || 'Failed to get recommendations')
        }
      } else {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('❌ [FamilyAIInsights] Error fetching AI recommendations:', error)
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
      console.log('🤖 [FamilyAIInsights] New transaction detected, refreshing recommendations...')
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
      console.log('🤖 [FamilyAIInsights] Recommendations tab opened, checking cache first...')
      
      // FORCE REFRESH THIS ONE TIME - Clear cache for this user
      let userId = user?.id || null
      if (!userId) {
        const authToken = localStorage.getItem('kamioi_user_token') || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken')
        if (authToken && (authToken.includes('user_token_') || authToken.includes('family_token_'))) {
          const match = authToken.match(/(?:user_token_|family_token_)(\d+)/)
          if (match) userId = parseInt(match[1])
        }
      }
      
      // Clear all cached recommendations for this user
      if (userId) {
        const transactionCount = (transactions || []).length
        const cacheKey = `ai_recommendations_family_${userId}_${transactionCount}`
        localStorage.removeItem(cacheKey)
        console.log('🤖 [FamilyAIInsights] 🗑️ Cleared cache for user:', userId, 'cacheKey:', cacheKey)
        
        // Also clear any other cache keys for this user
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(`ai_recommendations_family_${userId}_`)) {
            localStorage.removeItem(key)
            console.log('🤖 [FamilyAIInsights] 🗑️ Cleared additional cache:', key)
          }
        }
      }
      
      // Force refresh - bypass cache
      console.log('🤖 [FamilyAIInsights] 🔄 Force refreshing AI recommendations (cache cleared)')
      fetchAIRecommendations(true)
    }
  }, [activeTab, aiRecommendations, recommendationsLoading, fetchAIRecommendations, user, transactions])

  const getTextClass = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode ? 'bg-white/80 backdrop-blur-lg border-gray-200' : 'bg-white/10 backdrop-blur-lg border-white/20'

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'rejected': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  // Track recommendation clicks for admin analytics
  const trackRecommendationClick = async (productId, recommendationType) => {
    try {
      const clickData = {
        userId: user?.id || user?.userId || null,
        productId,
        recommendationType,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        source: 'family-ai-insights'
      }
      
      // Store in localStorage for admin analytics
      const existingClicks = JSON.parse(localStorage.getItem('kamioi_family_recommendation_clicks') || '[]')
      existingClicks.push(clickData)
      localStorage.setItem('kamioi_family_recommendation_clicks', JSON.stringify(existingClicks))
      
      // Send to backend for admin tracking
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      await fetch(`${apiBaseUrl}/api/analytics/recommendation-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clickData)
      })
      
      console.log('📊 Family recommendation click tracked:', clickData)
    } catch (error) {
      console.error('❌ Failed to track family recommendation click:', error)
    }
  }

  const tabs = [
    { id: 'ai-recommendations', label: 'AI Recommendations', icon: Brain },
    { id: 'mapping-history', label: 'Mapping History', icon: BarChart3 },
    { id: 'rewards', label: 'Rewards', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard', icon: Users },
    { id: 'ai-performance', label: 'AI Performance', icon: Zap }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${getTextClass()}`}>Family AI Insights & Rewards</h2>
          <p className={`${getSubtextClass()} mt-1`}>Track your family's AI mapping contributions and earn rewards together</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className={`text-sm ${getSubtextClass()}`}>Points Earned</div>
            <div className={`text-lg font-semibold ${getTextClass()}`}>{userStats.pointsEarned}</div>
          </div>
          <div className="text-right">
            <div className={`text-sm ${getSubtextClass()}`}>Accuracy</div>
            <div className={`text-lg font-semibold ${getTextClass()}`}>{userStats.accuracyRate ? userStats.accuracyRate.toFixed(2) : 0}%</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : `${getSubtextClass()} hover:bg-white/10`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
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
                      {mappingHistory?.filter(m => m.status === 'approved' || m.admin_approved === 1).length || 0}
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
        <div className={`${getCardClass()} p-6 rounded-lg border`}>
          <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>Recent Mappings</h3>
          {mappingHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400">Transaction</th>
                    <th className="text-left py-3 px-4 text-gray-400">Description</th>
                    <th className="text-left py-3 px-4 text-gray-400">Stock</th>
                    <th className="text-left py-3 px-4 text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400">Points</th>
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
                      <td className="py-3 px-4 text-white font-medium text-sm">{mapping.transaction}</td>
                      <td className="py-3 px-4 text-gray-300 text-sm">{mapping.transaction}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 flex items-center justify-center">
                            <CompanyLogo symbol={mapping.mappedTo} size="sm" />
                          </div>
                          <span className="text-blue-400 font-semibold text-sm">{mapping.mappedTo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">${mapping.amount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center space-x-1 w-fit ${getStatusColor(mapping.status)}`}>
                          {getStatusIcon(mapping.status)}
                          <span className="capitalize font-medium">{mapping.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-green-400 font-semibold">+{mapping.points}</td>
                      <td className="py-3 px-4 text-gray-400 text-sm">{new Date(mapping.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className={`${getSubtextClass()}`}>No mapping history yet</p>
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>Family Rewards & Achievements</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${getTextClass()}`}>Points Milestone Achieved</h4>
                <p className={`text-sm ${getSubtextClass()} mt-1`}>
                  No points earned yet. Start mapping transactions to begin earning rewards and climbing the tiers.
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-gray-400 text-sm font-medium">No Activity</span>
                  <span className="text-gray-400 text-sm">Start mapping to see activity</span>
                </div>
              </div>
            </div>

            {rewards.map((reward) => (
              <div key={reward.id} className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg">
                <div className={`w-8 h-8 ${reward.unlocked ? 'bg-green-500/20' : 'bg-blue-500/20'} rounded-full flex items-center justify-center`}>
                  <div className="text-lg">{reward.icon}</div>
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${getTextClass()}`}>{reward.name}</h4>
                  <p className={`text-sm ${getSubtextClass()} mt-1`}>
                    {reward.description}. {reward.unlocked ? 
                      'This reward has been unlocked and is now available in your profile.' : 
                      `Progress: ${reward.progress}% complete. Keep mapping transactions to unlock this reward.`
                    }
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`text-sm font-medium ${reward.unlocked ? 'text-green-400' : 'text-blue-400'}`}>
                      {reward.unlocked ? 'Unlocked' : 'In Progress'}
                    </span>
                    <span className="text-blue-400 text-sm">
                      {reward.unlocked ? 'Completed' : `${reward.progress}%`}
                    </span>
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
          <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>Family Performance Leaderboard</h3>
          
          <div className="space-y-4">
            {leaderboard.map((member) => (
              <div key={member.rank} className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  member.rank === 1 ? 'bg-yellow-500' : 
                  member.rank === 2 ? 'bg-gray-400' : 
                  member.rank === 3 ? 'bg-orange-500' : 'bg-gray-600'
                }`}>
                  {member.rank}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${getTextClass()}`}>{member.name}</h4>
                  <p className={`text-sm ${getSubtextClass()} mt-1`}>
                    {member.name} has completed <span className="text-blue-400 font-semibold">{member.mappings} mappings</span> with 
                    <span className="text-green-400 font-semibold"> {member.accuracy}% accuracy</span>. 
                    Currently ranked #{member.rank} with <span className="text-yellow-400 font-semibold">{member.points.toLocaleString()} points</span> 
                    in the <span className="text-purple-400 font-semibold">
                      {member.points >= 2000 ? 'Platinum' : 
                       member.points >= 1000 ? 'Gold' : 
                       member.points >= 500 ? 'Silver' : 'Bronze'} tier
                    </span>.
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`text-sm font-medium ${
                      member.rank === 1 ? 'text-yellow-400' : 
                      member.rank === 2 ? 'text-gray-400' : 
                      member.rank === 3 ? 'text-orange-400' : 'text-blue-400'
                    }`}>
                      Rank #{member.rank}
                    </span>
                    <span className="text-blue-400 text-sm">
                      {member.points >= 2000 ? 'Platinum' : 
                       member.points >= 1000 ? 'Gold' : 
                       member.points >= 500 ? 'Silver' : 'Bronze'} Tier
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Performance Tab */}
      {activeTab === 'ai-performance' && (
        <div className="space-y-6">
          <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>AI Performance Insights</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${getTextClass()}`}>Overall Performance Excellence</h4>
                <p className={`text-sm ${getSubtextClass()} mt-1`}>
                  No AI mapping data available yet. Start mapping transactions to see performance insights.
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-gray-400 text-sm font-medium">No Data</span>
                  <span className="text-gray-400 text-sm">Start mapping to see performance</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${getTextClass()}`}>Mapping Success Rate</h4>
                <p className={`text-sm ${getSubtextClass()} mt-1`}>
                  No mapping success data available yet. Start mapping transactions to see success rate analytics.
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-gray-400 text-sm font-medium">No Data</span>
                  <span className="text-gray-400 text-sm">Start mapping to see success rates</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${getTextClass()}`}>Category Performance Analysis</h4>
                <p className={`text-sm ${getSubtextClass()} mt-1`}>
                  No category performance data available yet. Start mapping transactions to see detailed category analysis.
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-gray-400 text-sm font-medium">No Data</span>
                  <span className="text-gray-400 text-sm">Start mapping to see category insights</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg">
              <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-400" />
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${getTextClass()}`}>Weekly Performance Trend</h4>
                <p className={`text-sm ${getSubtextClass()} mt-1`}>
                  No performance trend data available yet. Start mapping transactions to see weekly and monthly accuracy trends.
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-gray-400 text-sm font-medium">No Data</span>
                  <span className="text-gray-400 text-sm">Start mapping to see trends</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${getCardClass()} p-6 rounded-lg border max-w-md w-full mx-4`}>
            <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>Transaction Details</h3>
            <div className="space-y-3">
              <div>
                <span className={`text-sm ${getSubtextClass()}`}>Transaction ID:</span>
                <span className={`ml-2 font-mono ${getTextClass()}`}>{selectedTransaction.transactionId}</span>
              </div>
              <div>
                <span className={`text-sm ${getSubtextClass()}`}>Status:</span>
                <span className={`ml-2 ${getTextClass()}`}>{selectedTransaction.status}</span>
              </div>
              <div>
                <span className={`text-sm ${getSubtextClass()}`}>Merchant:</span>
                <span className={`ml-2 ${getTextClass()}`}>{selectedTransaction.merchant}</span>
              </div>
              <div>
                <span className={`text-sm ${getSubtextClass()}`}>Ticker:</span>
                <span className={`ml-2 font-mono ${getTextClass()}`}>{selectedTransaction.ticker}</span>
              </div>
              <div>
                <span className={`text-sm ${getSubtextClass()}`}>Category:</span>
                <span className={`ml-2 ${getTextClass()}`}>{selectedTransaction.category}</span>
              </div>
              <div>
                <span className={`text-sm ${getSubtextClass()}`}>Submitted Date:</span>
                <span className={`ml-2 ${getTextClass()}`}>{selectedTransaction.date}</span>
              </div>
              <div>
                <span className={`text-sm ${getSubtextClass()}`}>Points Earned:</span>
                <span className={`ml-2 text-green-400`}>+{selectedTransaction.points}</span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTransactionModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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

export default FamilyAIInsights
