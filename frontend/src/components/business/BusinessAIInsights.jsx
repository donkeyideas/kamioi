import React, { useState, useEffect, useCallback } from 'react'
import { Brain, CheckCircle, XCircle, BarChart3, Eye, Clock, ShoppingBag, Target, TrendingUp, Award, Users, Zap, RefreshCw, Filter, Upload, User, Building2, DollarSign, BookOpen, Lightbulb, Trophy, Star, Gift, Medal } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useData } from '../../context/DataContext'
import { useDemo } from '../../context/DemoContext'
import CompanyLogo from '../common/CompanyLogo'

// NOTE: isDemoMode is now retrieved via useDemo() hook inside the component
// This ensures it's always up-to-date when localStorage changes

// Demo AI recommendations for demo mode
const DEMO_AI_RECOMMENDATIONS = {
  recommendations: [
    {
      type: 'brand_education',
      title: 'Top Merchant Investment Opportunity',
      description: 'Your most frequent purchases are at Starbucks. Did you know SBUX has grown 15% this year? Consider increasing your round-up to invest more in brands you love.',
      merchant: 'Starbucks',
      brand_stock: 'SBUX',
      priority: 'high'
    },
    {
      type: 'roundup_nudge',
      title: 'Round-Up Optimization',
      description: 'Increasing your round-up from $1 to $2 could grow your portfolio 2x faster based on your current transaction frequency.',
      priority: 'medium'
    },
    {
      type: 'category_education',
      title: 'Sector Diversification',
      description: 'Most of your investments are in retail and food sectors. Consider adding tech purchases to diversify with companies like AAPL or MSFT.',
      category: 'Technology',
      priority: 'low'
    }
  ],
  insights: [
    'Your team has invested $15,230 through round-ups this quarter',
    'Top performing investment: SBUX (+12.5%)',
    'Transaction mapping accuracy is at 95%'
  ],
  disclaimer: "Kamioi's insights are for educational purposes only and are not financial advice or recommendations."
}

// Demo mapping history for Mapping History tab
const DEMO_MAPPING_HISTORY = [
  {
    id: 'demo-hist-1',
    mapping_id: 'AIM-001',
    transaction_id: 'TXN-12345',
    merchant_name: 'Starbucks Coffee',
    ticker_symbol: 'SBUX',
    category: 'Food & Beverage',
    status: 'approved',
    admin_approved: 1,
    points: 10,
    confidence: 0.95,
    submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-hist-2',
    mapping_id: 'AIM-002',
    transaction_id: 'TXN-12346',
    merchant_name: 'Amazon Web Services',
    ticker_symbol: 'AMZN',
    category: 'Technology',
    status: 'approved',
    admin_approved: 1,
    points: 10,
    confidence: 0.98,
    submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-hist-3',
    mapping_id: 'AIM-003',
    transaction_id: 'TXN-12347',
    merchant_name: 'Microsoft Office',
    ticker_symbol: 'MSFT',
    category: 'Software',
    status: 'pending',
    admin_approved: 0,
    points: 0,
    confidence: 0.88,
    submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Demo rewards data
const DEMO_REWARDS = [
  {
    id: 'reward-1',
    name: 'Earn 2% cashback on coffee purchases',
    description: 'Map 5 coffee transactions',
    icon: 'gift',
    points: 50,
    unlocked: false
  },
  {
    id: 'reward-2',
    name: 'Extra $2.50 for your next round-up',
    description: 'Complete 10 mappings',
    icon: 'star',
    points: 100,
    unlocked: false
  }
]

// Demo leaderboard data
const DEMO_LEADERBOARD = [
  { rank: 1, name: 'Sarah M.', points: 2450, tier: 'AI Master', mappings: 245 },
  { rank: 2, name: 'John D.', points: 1820, tier: 'AI Expert', mappings: 182 },
  { rank: 3, name: 'Demo User', points: 100, tier: 'AI Helper', mappings: 12, isCurrentUser: true },
  { rank: 4, name: 'Alex K.', points: 890, tier: 'AI Trainer', mappings: 89 },
  { rank: 5, name: 'Maria L.', points: 650, tier: 'AI Helper', mappings: 65 }
]

// Demo receipt mappings
const DEMO_RECEIPT_MAPPINGS = [
  {
    id: 'demo-mapping-1',
    merchant_name: 'Office Depot',
    ticker: 'ODP',
    company_name: 'Office Depot',
    category: 'Office Supplies',
    confidence: 0.92,
    status: 'approved',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-mapping-2',
    merchant_name: 'Zoom Video Communications',
    ticker: 'ZM',
    company_name: 'Zoom',
    category: 'Technology',
    confidence: 0.95,
    status: 'approved',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-mapping-3',
    merchant_name: 'Adobe Creative Cloud',
    ticker: 'ADBE',
    company_name: 'Adobe',
    category: 'Software',
    confidence: 0.98,
    status: 'auto-approved',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-mapping-4',
    merchant_name: 'Local Restaurant',
    ticker: null,
    company_name: null,
    category: 'Food & Dining',
    confidence: 0.45,
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Helper function to get company name from ticker
const getCompanyName = (ticker) => {
  if (!ticker) return null
  const companyMap = {
    'AAPL': 'Apple',
    'AMZN': 'Amazon',
    'GOOGL': 'Google',
    'MSFT': 'Microsoft',
    'TSLA': 'Tesla',
    'META': 'Meta',
    'NFLX': 'Netflix',
    'NVDA': 'NVIDIA',
    'SBUX': 'Starbucks',
    'WMT': 'Walmart',
    'FL': 'Foot Locker',
    'NKE': 'Nike',
    'TGT': 'Target',
    'DLTR': 'Dollar Tree'
  }
  return companyMap[ticker.toUpperCase()] || null
}

// Helper function to get confidence color based on percentage (1-100%)
const getConfidenceColor = (confidence, isLightMode = false) => {
  if (!confidence && confidence !== 0) return isLightMode ? 'text-gray-500' : 'text-gray-400'
  
  // Convert to percentage if needed (0.0-1.0 to 0-100)
  const percentage = confidence <= 1 ? confidence * 100 : confidence
  
  // Smart color logic:
  // 80-100%: Green (high confidence)
  // 60-79%: Yellow/Orange (medium-high confidence)
  // 40-59%: Yellow (medium confidence)
  // 20-39%: Orange (low-medium confidence)
  // 1-19%: Red (low confidence)
  if (percentage >= 80) {
    return isLightMode ? 'text-green-600' : 'text-green-400'
  } else if (percentage >= 60) {
    return isLightMode ? 'text-yellow-600' : 'text-yellow-400'
  } else if (percentage >= 40) {
    return isLightMode ? 'text-yellow-500' : 'text-yellow-500'
  } else if (percentage >= 20) {
    return isLightMode ? 'text-orange-600' : 'text-orange-400'
  } else {
    return isLightMode ? 'text-red-600' : 'text-red-400'
  }
}

const BusinessAIInsights = ({ user }) => {
  const { isLightMode } = useTheme()
  const { transactions, holdings, portfolioValue, goals } = useData()
  const { isDemoMode } = useDemo()
  const [activeTab, setActiveTab] = useState('recommendations')
  const [loading, setLoading] = useState(false)
  const [receiptMappings, setReceiptMappings] = useState([])
  const [receiptMappingsLoaded, setReceiptMappingsLoaded] = useState(false)
  const [receiptMappingsLoading, setReceiptMappingsLoading] = useState(false)
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
    totalUsers: 0,
    tierProgress: 0,
    nextTier: 'AI Learner'
  })
  const [rewards, setRewards] = useState([])
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [mappingHistory, setMappingHistory] = useState([])
  const [aiRecommendations, setAiRecommendations] = useState(null)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [recommendationsError, setRecommendationsError] = useState(null)

  // Fetch mapping history from backend (same as user dashboard)
  useEffect(() => {
    const fetchMappingHistory = async () => {
      setLoading(true)

      // Use demo data in demo mode
      if (isDemoMode) {
        setMappingHistory(DEMO_MAPPING_HISTORY)
        setRewards(DEMO_REWARDS)
        setUserStats({
          totalMappings: 12,
          approvedMappings: 10,
          pendingMappings: 2,
          rejectedMappings: 0,
          accuracyRate: 83.3,
          pointsEarned: 100,
          currentTier: 'AI Helper',
          nextTierPoints: 200,
          rank: 15,
          totalUsers: 100,
          tierProgress: 50,
          nextTier: 'AI Trainer'
        })
        setLoading(false)
        return
      }

      try {
        const authToken = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken')
        if (authToken === 'null' || authToken === 'undefined' || !authToken) {
          const fallbackToken = localStorage.getItem('kamioi_user_token')
          if (!fallbackToken) {
            console.log('📋 [BusinessAIInsights] No auth token available')
            setLoading(false)
            return
          }
        }
        
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const insightsResponse = await fetch(`${apiBaseUrl}/api/business/ai/insights`, {
          headers: {
            'Authorization': `Bearer ${authToken || localStorage.getItem('kamioi_user_token')}`
          }
        })
        
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json()
          if (insightsData.success) {
            // Extract mappings array from data object
            const mappingsData = insightsData.data?.mappings || insightsData.data || []
            const mappingsArray = Array.isArray(mappingsData) ? mappingsData : (Array.isArray(insightsData.data?.mappings) ? insightsData.data.mappings : [])
            
            // Filter to only show user-submitted mappings (those with user_id)
            const userSubmittedMappings = mappingsArray.filter(mapping => {
              const hasUserId = mapping.user_id && mapping.user_id !== null && mapping.user_id !== 'None' && mapping.user_id !== ''
              const mappingIdStr = mapping.mapping_id ? String(mapping.mapping_id) : ''
              const hasMappingId = mappingIdStr && mappingIdStr.startsWith('AIM')
              return hasUserId || hasMappingId
            })
            
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
            const tierInfo = calculateTier(stats.pointsEarned || 0)
            
            setUserStats({
              totalMappings: stats.totalMappings,
              approvedMappings: stats.approvedMappings,
              pendingMappings: stats.pendingMappings,
              rejectedMappings: 0,
              accuracyRate: stats.accuracyRate || 0,
              pointsEarned: stats.pointsEarned || 0,
              currentTier: tierInfo.tier,
              nextTierPoints: tierInfo.nextTierPoints,
              rank: 0,
              totalUsers: 0,
              tierProgress: tierInfo.progress,
              nextTier: tierInfo.nextTier
            })
          }
        }

        // Fetch user rewards
        const rewardsResponse = await fetch(`${apiBaseUrl}/api/user/rewards`, {
          headers: {
            'Authorization': `Bearer ${authToken || localStorage.getItem('kamioi_user_token')}`
          }
        })
        if (rewardsResponse.ok) {
          const rewardsData = await rewardsResponse.json()
          if (rewardsData.success) {
            setRewards(rewardsData.rewards || [])
          }
        }
      } catch (error) {
        console.error('Failed to fetch mapping history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMappingHistory()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchMappingHistory()
    }, 30000)
    
    return () => {
      clearInterval(interval)
    }
  }, [])

  // Fetch receipt mappings - ALWAYS from backend (source of truth)
  const fetchReceiptMappings = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous fetches
    if (receiptMappingsLoading && !forceRefresh) {
      console.log('📋 [BusinessAIInsights] Already loading, skipping duplicate fetch')
      return
    }

    // Use demo data in demo mode
    if (isDemoMode) {
      setReceiptMappings(DEMO_RECEIPT_MAPPINGS)
      setReceiptMappingsLoaded(true)
      setReceiptMappingsLoading(false)
      const totalMappings = DEMO_RECEIPT_MAPPINGS.length
      const approvedMappings = DEMO_RECEIPT_MAPPINGS.filter(m => m.status === 'approved' || m.status === 'auto-approved').length
      const pendingMappings = DEMO_RECEIPT_MAPPINGS.filter(m => m.status === 'pending').length
      const accuracyRate = totalMappings > 0 ? Math.round((approvedMappings / totalMappings) * 100 * 10) / 10 : 0
      setUserStats(prev => ({
        ...prev,
        totalMappings,
        approvedMappings,
        pendingMappings,
        accuracyRate
      }))
      return
    }

    // ALWAYS fetch from backend - backend is the source of truth
    // Don't skip based on loaded state - always get fresh data
    console.log('📋 [BusinessAIInsights] 🔄 Fetching receipt mappings from backend (source of truth)...', { forceRefresh })
    setReceiptMappingsLoading(true)
    setReceiptMappingsLoaded(false) // Always reset loaded state when fetching
    try {
      let authToken = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken')
      if (authToken === 'null' || authToken === 'undefined' || !authToken) {
        authToken = localStorage.getItem('kamioi_user_token') || null
      }
      
      console.log('📋 [BusinessAIInsights] Using token:', authToken ? 'Token exists' : 'No token')
      
      // Fetch with timeout
      const fetchWithTimeout = (url, options, timeout = 10000) => {
        return Promise.race([
          fetch(url, options),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ])
      }
      
      // Fetch all mappings without status filter
      let fetchedReceiptMappings = []
      
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const allRes = await fetchWithTimeout(`${apiBaseUrl}/api/receipts/llm-mappings?page=1&limit=100`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
        
        if (allRes.ok) {
          const data = await allRes.json()
          console.log('📋 [BusinessAIInsights] API Response:', {
            success: data.success,
            hasMappings: !!data.mappings,
            mappingsLength: data.mappings?.length || 0,
            hasData: !!data.data,
            dataIsArray: Array.isArray(data.data),
            dataLength: Array.isArray(data.data) ? data.data.length : 0,
            pagination: data.pagination,
            error: data.error,
            fullResponse: data
          })
          
          if (data.success && data.mappings) {
            fetchedReceiptMappings = data.mappings
            console.log('📋 [BusinessAIInsights] Fetched all mappings:', fetchedReceiptMappings.length)
          } else if (data.success && Array.isArray(data.data)) {
            fetchedReceiptMappings = data.data
            console.log('📋 [BusinessAIInsights] Fetched all mappings (data.data):', fetchedReceiptMappings.length)
          } else {
            console.warn('📋 [BusinessAIInsights] Unexpected response format:', data)
            // Try to extract mappings from any field
            if (data.data && data.data.mappings) {
              fetchedReceiptMappings = data.data.mappings
              console.log('📋 [BusinessAIInsights] Found mappings in data.data.mappings:', fetchedReceiptMappings.length)
            }
          }
        } else {
          const errorText = await allRes.text()
          console.error('❌ [BusinessAIInsights] Fetch not OK:', allRes.status, allRes.statusText, errorText)
        }
      } catch (e) {
        console.error('❌ [BusinessAIInsights] Fetch error:', e.message)
      }
      
      console.log('📋 [BusinessAIInsights] Total LLM mappings fetched:', fetchedReceiptMappings.length)
      
      // Filter out old test data and sort by created_at (newest first) and remove duplicates
      fetchedReceiptMappings = fetchedReceiptMappings
        .filter((m) => {
          // Filter out test data
          if (m.receipt_id === '999999' || m.merchant_name === 'Test Merchant' || m.ticker === 'TEST') {
            console.log('📋 [BusinessAIInsights] Filtering out test mapping:', m.id, m.merchant_name)
            return false
          }
          return true
        })
        .filter((m, index, self) => index === self.findIndex(t => t.id === m.id))
      
      // Also fetch receipt transactions (transactions with transaction_type='receipt' or category='receipt')
      let receiptTransactions = []
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const txnResponse = await fetch(`${apiBaseUrl}/api/business/transactions`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
        
        if (txnResponse.ok) {
          const txnData = await txnResponse.json()
          if (txnData.success && txnData.data) {
            const allTransactions = Array.isArray(txnData.data) ? txnData.data : []
            
            console.log('📋 [BusinessAIInsights] Total transactions fetched:', allTransactions.length)
            
            // Get current user ID from various sources as fallback
            const currentUserId = user?.id || 
                                 (authToken && authToken.includes('business_token_') ? authToken.match(/business_token_(\d+)/)?.[1] : null) ||
                                 (authToken && authToken.includes('user_token_') ? authToken.match(/user_token_(\d+)/)?.[1] : null)
            
            console.log('📋 [BusinessAIInsights] Current user ID (fallback):', currentUserId)
            
            // Filter for receipt transactions
            // Include transactions where category='receipt' OR transaction_type='receipt'
            receiptTransactions = allTransactions
              .filter(t => {
                const isReceipt = (t.transaction_type === 'receipt' || t.category === 'receipt')
                // More lenient user_id check - accept if it exists OR use current user as fallback
                let hasUserId = t.user_id !== undefined && t.user_id !== null && t.user_id !== 'None' && t.user_id !== ''
                
                // If no user_id but we have a current user, we'll add it in the map step
                if (!hasUserId && currentUserId) {
                  hasUserId = true // We'll set it in the mapping
                }
                
                console.log('📋 [BusinessAIInsights] Checking transaction:', {
                  id: t.id,
                  transaction_type: t.transaction_type,
                  category: t.category,
                  isReceipt,
                  hasUserId,
                  user_id: t.user_id,
                  merchant: t.merchant,
                  willInclude: isReceipt && hasUserId
                })
                
                return isReceipt && hasUserId
              })
              .flatMap(t => {
                // Use transaction's user_id or fallback to current user
                const mappingUserId = t.user_id || currentUserId || null
                
                // If transaction has allocations, create a mapping for EACH allocation (child)
                if (t.allocations && Array.isArray(t.allocations) && t.allocations.length > 0) {
                  console.log('📋 [BusinessAIInsights] Transaction has allocations, creating mappings for each:', t.allocations.length)
                  
                  return t.allocations.map((allocation, index) => {
                    const ticker = allocation.ticker || allocation.symbol || null
                    const companyName = allocation.company || allocation.name || t.merchant || 'Unknown'
                    const merchantName = allocation.merchant || allocation.company || allocation.name || t.merchant || 'Unknown'
                    
                    const mapping = {
                      id: `txn_${t.id}_alloc_${index}`, // Unique ID for each allocation
                      transaction_id: t.id,
                      allocation_index: index,
                      user_id: mappingUserId,
                      merchant_name: merchantName,
                      ticker: ticker,
                      company_name: companyName,
                      category: t.category || 'receipt',
                      confidence: ticker ? 0.85 : 0.5, // Higher confidence if ticker exists
                      status: ticker ? 'approved' : 'pending',
                      created_at: t.date || t.created_at || new Date().toISOString(),
                      receipt_id: t.receipt_id || null,
                      source_type: 'receipt_transaction_allocation', // Mark as allocation child
                      amount: allocation.amount || allocation.total || (t.amount * (allocation.percentage || 0) / 100) || 0,
                      description: `${merchantName} - ${allocation.percentage || 0}% allocation`,
                      percentage: allocation.percentage || 0,
                      shares: allocation.shares || 0,
                      parent_transaction: t // Keep reference to parent
                    }
                    
                    console.log('📋 [BusinessAIInsights] Created allocation mapping:', {
                      id: mapping.id,
                      merchant: mapping.merchant_name,
                      ticker: mapping.ticker,
                      category: mapping.category,
                      status: mapping.status,
                      percentage: mapping.percentage,
                      user_id: mapping.user_id
                    })
                    
                    return mapping
                  })
                } else {
                  // No allocations - create single mapping for the transaction (parent)
                  const ticker = t.ticker || null
                  
                  const mapping = {
                    id: `txn_${t.id}`, // Prefix to avoid conflicts with LLM mapping IDs
                    transaction_id: t.id,
                    user_id: mappingUserId,
                    merchant_name: t.merchant || t.description || 'Unknown',
                    ticker: ticker,
                    company_name: t.merchant || t.description || 'Unknown',
                    category: t.category || 'receipt',
                    confidence: ticker ? 0.85 : 0.5, // Higher confidence if ticker exists
                    status: ticker ? 'approved' : 'pending',
                    created_at: t.date || t.created_at || new Date().toISOString(),
                    receipt_id: t.receipt_id || null,
                    source_type: 'receipt_transaction', // Mark as coming from transactions
                    amount: t.amount || 0,
                    description: t.description || ''
                  }
                  
                  console.log('📋 [BusinessAIInsights] Converted transaction to mapping (no allocations):', {
                    id: mapping.id,
                    merchant: mapping.merchant_name,
                    ticker: mapping.ticker,
                    category: mapping.category,
                    status: mapping.status,
                    user_id: mapping.user_id
                  })
                  
                  return [mapping] // Return as array for flatMap
                }
              })
            
            console.log('📋 [BusinessAIInsights] Fetched receipt transactions:', receiptTransactions.length)
            if (receiptTransactions.length > 0) {
              console.log('📋 [BusinessAIInsights] Sample receipt transaction:', receiptTransactions[0])
            } else {
              console.log('📋 [BusinessAIInsights] No receipt transactions found. Total transactions:', allTransactions.length)
              console.log('📋 [BusinessAIInsights] Sample transactions:', allTransactions.slice(0, 3).map(t => ({
                id: t.id,
                transaction_type: t.transaction_type,
                category: t.category,
                user_id: t.user_id,
                merchant: t.merchant
              })))
            }
          } else {
            console.warn('📋 [BusinessAIInsights] Transaction API response missing data:', txnData)
          }
        } else {
          const errorText = await txnResponse.text()
          console.error('❌ [BusinessAIInsights] Transaction fetch not OK:', txnResponse.status, errorText)
        }
      } catch (error) {
        console.error('❌ [BusinessAIInsights] Error fetching receipt transactions:', error)
      }
      
      // Combine LLM mappings and receipt transactions
      const allMappings = [...fetchedReceiptMappings, ...receiptTransactions]
      
      console.log('📋 [BusinessAIInsights] Before deduplication:', {
        llmMappings: fetchedReceiptMappings.length,
        receiptTransactions: receiptTransactions.length,
        total: allMappings.length,
        sampleIds: allMappings.map(m => m.id)
      })
      
      // Remove duplicates (by unique id - allocations have unique IDs like txn_123_alloc_0, txn_123_alloc_1)
      const uniqueMappings = allMappings.filter((m, index, self) => {
        // Always check by unique id - allocations have unique IDs so they won't be deduplicated
        const firstIndex = self.findIndex(t => t.id === m.id)
        const isUnique = index === firstIndex
        
        if (!isUnique) {
          console.log('📋 [BusinessAIInsights] Duplicate found and removed:', {
            id: m.id,
            merchant: m.merchant_name,
            ticker: m.ticker,
            firstIndex,
            currentIndex: index
          })
        }
        
        return isUnique
      })
      
      console.log('📋 [BusinessAIInsights] After deduplication:', {
        before: allMappings.length,
        after: uniqueMappings.length,
        removed: allMappings.length - uniqueMappings.length
      })
      
      // Sort by created_at (newest first)
      uniqueMappings.sort((a, b) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateB - dateA
      })
      
      console.log('📋 [BusinessAIInsights] ✅ Final combined mappings:', {
        llmMappings: fetchedReceiptMappings.length,
        receiptTransactions: receiptTransactions.length,
        total: uniqueMappings.length,
        allMappingIds: uniqueMappings.map(m => ({
          id: m.id,
          merchant: m.merchant_name,
          ticker: m.ticker,
          transaction_id: m.transaction_id,
          allocation_index: m.allocation_index
        }))
      })
      console.log('📋 [BusinessAIInsights] All mappings:', uniqueMappings.map(m => ({
        id: m.id,
        merchant: m.merchant_name,
        ticker: m.ticker,
        status: m.status
      })))
      
      setReceiptMappings(uniqueMappings)
      setReceiptMappingsLoaded(true)
      console.log('📋 [BusinessAIInsights] ✅ Receipt mappings state updated, count:', uniqueMappings.length)
      
      // Update stats with combined mappings (non-blocking)
      setTimeout(() => {
        const totalMappings = uniqueMappings.length
        const approvedMappings = uniqueMappings.filter(m => m.status === 'approved' || m.status === 'auto-approved').length
        const pendingMappings = uniqueMappings.filter(m => m.status === 'pending').length
        const rejectedMappings = uniqueMappings.filter(m => m.status === 'rejected').length
        const accuracyRate = totalMappings > 0 ? Math.round((approvedMappings / totalMappings) * 100 * 10) / 10 : 0
        
        setUserStats({
          totalMappings,
          approvedMappings,
          pendingMappings,
          rejectedMappings,
          accuracyRate
        })
      }, 0)
    } catch (error) {
      console.error('❌ [BusinessAIInsights] Error fetching receipt mappings:', error)
    } finally {
      setReceiptMappingsLoading(false)
    }
  }, []) // Empty deps - function is stable and doesn't need to recreate

  // Fetch AI Recommendations with caching - only call API when needed
  const fetchAIRecommendations = useCallback(async (forceRefresh = false) => {
    if (recommendationsLoading) return

    // Use demo data in demo mode
    if (isDemoMode) {
      setRecommendationsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 800)) // Simulate loading
      setAiRecommendations(DEMO_AI_RECOMMENDATIONS)
      setRecommendationsLoading(false)
      return
    }

    let authToken = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken')
    if (authToken === 'null' || authToken === 'undefined' || !authToken) {
      authToken = localStorage.getItem('kamioi_user_token') || null
    }
    
    // Get user ID from token or props
    let userId = user?.id || null
    if (!userId && authToken) {
      // Try to extract from token
      if (authToken.includes('business_token_')) {
        const match = authToken.match(/business_token_(\d+)/)
        if (match) userId = parseInt(match[1])
      } else if (authToken.includes('user_token_')) {
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
          console.log('🤖 [BusinessAIInsights] Using cached AI recommendations (age:', Math.round(cacheAge / 1000 / 60), 'minutes)')
          setAiRecommendations(parsed.data)
          setRecommendationsLoading(false)
          return
        }
      } catch (e) {
        console.warn('🤖 [BusinessAIInsights] Failed to parse cached recommendations:', e)
      }
    }
    
    // Only call API if cache is missing or force refresh requested
    if (!forceRefresh && cachedData) {
      console.log('🤖 [BusinessAIInsights] Cache exists but transaction count changed or expired, refreshing...')
    } else {
      console.log('🤖 [BusinessAIInsights] No cache found, calling API...')
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
        risk_tolerance: 'moderate', // Default, could be from user settings
        investment_history: [] // Could be populated from transaction history
      }
      
      console.log('🤖 [BusinessAIInsights] Fetching AI recommendations with data:', {
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
          dashboard_type: 'business',
          user_id: userId, // Pass user_id to fetch round-up settings
          user_data: userData
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          console.log('🤖 [BusinessAIInsights] AI Recommendations received:', data.data)
          setAiRecommendations(data.data)
          
          // Cache the recommendations with transaction count
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: data.data,
              timestamp: Date.now(),
              transactionCount: transactionCount
            }))
            console.log('🤖 [BusinessAIInsights] Recommendations cached for future use')
          } catch (e) {
            console.warn('🤖 [BusinessAIInsights] Failed to cache recommendations:', e)
          }
        } else {
          throw new Error(data.error || 'Failed to get recommendations')
        }
      } else {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('❌ [BusinessAIInsights] Error fetching AI recommendations:', error)
      setRecommendationsError(error.message)
      // Set fallback empty recommendations
      setAiRecommendations({
        recommendations: [],
        insights: [],
        risk_analysis: {},
        opportunities: []
      })
    } finally {
      setRecommendationsLoading(false)
    }
  }, [transactions, holdings, portfolioValue, goals, recommendationsLoading, user])

  // Listen for new transactions to refresh recommendations
  useEffect(() => {
    const handleNewTransaction = () => {
      console.log('🤖 [BusinessAIInsights] New transaction detected, refreshing recommendations...')
      // Force refresh when new transaction is added
      fetchAIRecommendations(true)
    }
    
    // Listen for transaction created events
    window.addEventListener('transaction-created', handleNewTransaction)
    window.addEventListener('receipt-mapping-created', handleNewTransaction)
    
    return () => {
      window.removeEventListener('transaction-created', handleNewTransaction)
      window.removeEventListener('receipt-mapping-created', handleNewTransaction)
    }
  }, [fetchAIRecommendations])

  // Fetch rewards data
  const fetchData = async () => {
    if (!loading) {
      setLoading(true)
      try {
        let authToken = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken')
        if (authToken === 'null' || authToken === 'undefined' || !authToken) {
          authToken = localStorage.getItem('kamioi_user_token') || null
        }
        
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const rewardsRes = await fetch(`${apiBaseUrl}/api/user/rewards`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
        
        if (rewardsRes.ok) {
          const rewardsData = await rewardsRes.json()
          if (rewardsData.success && rewardsData.rewards) {
            setRewards(rewardsData.rewards)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch AI recommendations when tab is opened (will use cache if available)
  useEffect(() => {
    if (activeTab === 'recommendations' && !aiRecommendations && !recommendationsLoading) {
      console.log('🤖 [BusinessAIInsights] Recommendations tab opened, checking cache first...')
      
      // FORCE REFRESH THIS ONE TIME - Clear cache for this user
      let userId = user?.id || null
      if (!userId) {
        const authToken = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken') || localStorage.getItem('kamioi_user_token')
        if (authToken) {
          if (authToken.includes('business_token_')) {
            const match = authToken.match(/business_token_(\d+)/)
            if (match) userId = parseInt(match[1])
          } else if (authToken.includes('user_token_')) {
            const match = authToken.match(/user_token_(\d+)/)
            if (match) userId = parseInt(match[1])
          }
        }
      }
      
      // Clear all cached recommendations for this user
      if (userId) {
        const transactionCount = (transactions || []).length
        const cacheKey = `ai_recommendations_${userId}_${transactionCount}`
        localStorage.removeItem(cacheKey)
        console.log('🤖 [BusinessAIInsights] 🗑️ Cleared cache for user:', userId, 'cacheKey:', cacheKey)
        
        // Also clear any other cache keys for this user (in case transaction count changed)
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(`ai_recommendations_${userId}_`)) {
            localStorage.removeItem(key)
            console.log('🤖 [BusinessAIInsights] 🗑️ Cleared additional cache:', key)
          }
        }
      }
      
      // Force refresh - bypass cache
      console.log('🤖 [BusinessAIInsights] 🔄 Force refreshing AI recommendations (cache cleared)')
      fetchAIRecommendations(true)
    }
  }, [activeTab, aiRecommendations, recommendationsLoading, fetchAIRecommendations, user, transactions])

  // Listen for receipt mapping created events - always refresh when event is received
  useEffect(() => {
    const handleReceiptMappingCreated = (event) => {
      console.log('📋 [BusinessAIInsights] 🎯🎯🎯 Receipt mapping created event RECEIVED!', event?.detail)
      
      // Force refresh immediately - don't check current state
      console.log('📋 [BusinessAIInsights] 🔄 FORCING refresh - clearing loaded state...')
      setReceiptMappingsLoaded(false)
      
      // Fetch immediately with force refresh flag
      console.log('📋 [BusinessAIInsights] 🚀 Calling fetchReceiptMappings(true) NOW...')
      fetchReceiptMappings(true) // ALWAYS force refresh on event - no delay
    }
    
    console.log('📋 [BusinessAIInsights] ✅ Setting up receipt-mapping-created event listener (permanent)')
    window.addEventListener('receipt-mapping-created', handleReceiptMappingCreated)
    
    return () => {
      console.log('📋 [BusinessAIInsights] 🧹 Cleaning up receipt-mapping-created event listener')
      window.removeEventListener('receipt-mapping-created', handleReceiptMappingCreated)
    }
  }, []) // Set up once - fetchReceiptMappings is stable

  // Always refresh when switching to receipt-mappings tab (ensures fresh data from backend)
  useEffect(() => {
    if (activeTab === 'receipt-mappings' && !receiptMappingsLoading) {
      console.log('📋 [BusinessAIInsights] Tab switched to receipt-mappings, ALWAYS fetching fresh from backend...')
      setReceiptMappingsLoaded(false) // Clear cached state
      // Always fetch from backend when tab is active - backend is source of truth
      const timer = setTimeout(() => {
        fetchReceiptMappings(true) // Force refresh - always fetch from backend
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [activeTab]) // Only depend on activeTab - fetchReceiptMappings is stable

  // Calculate tier based on points
  const calculateTier = (points) => {
    if (points >= 1000) return { tier: 'AI Master', nextTier: null, nextTierPoints: 0, progress: 100 }
    if (points >= 500) return { tier: 'AI Expert', nextTier: 'AI Master', nextTierPoints: 1000, progress: ((points - 500) / 500) * 100 }
    if (points >= 200) return { tier: 'AI Trainer', nextTier: 'AI Expert', nextTierPoints: 500, progress: ((points - 200) / 300) * 100 }
    if (points >= 50) return { tier: 'AI Helper', nextTier: 'AI Trainer', nextTierPoints: 200, progress: ((points - 50) / 150) * 100 }
    if (points >= 10) return { tier: 'AI Learner', nextTier: 'AI Helper', nextTierPoints: 50, progress: ((points - 10) / 40) * 100 }
    return { tier: 'Beginner', nextTier: 'AI Learner', nextTierPoints: 10, progress: (points / 10) * 100 }
  }

  const getTextClass = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode ? 'bg-white/80 backdrop-blur-lg border-gray-200' : 'bg-white/10 backdrop-blur-lg border-white/20'


  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'auto-approved':
        return 'bg-green-500/20 text-green-400'
      case 'pending':
      case 'pending-approval':
        return 'bg-orange-500/20 text-orange-400'
      case 'denied':
      case 'rejected':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'auto-approved':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
      case 'pending-approval':
        return <Clock className="w-4 h-4" />
      case 'denied':
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }


  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${getTextClass()} mb-2`}>Business AI Insights & Rewards</h1>
          <p className={getSubtextClass()}>Track your business AI mapping contributions and earn rewards</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-white/10">
          {[
            { id: 'recommendations', label: 'AI Recommendations', icon: Brain },
            { id: 'mapping-history', label: 'Mapping History', icon: BarChart3 },
            { id: 'receipt-mappings', label: 'Receipt Mappings', icon: ShoppingBag },
            { id: 'rewards', label: 'Rewards', icon: Award },
            { id: 'leaderboard', label: 'Leaderboard', icon: Users },
            { id: 'ai-performance', label: 'AI Performance', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Receipt Mappings Tab */}
        {activeTab === 'receipt-mappings' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className={`${getCardClass()} p-4 rounded-lg border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSubtextClass()}`}>Total Receipt Mappings</p>
                    <p className={`text-2xl font-bold ${getTextClass()}`}>{userStats.totalMappings}</p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className={`${getCardClass()} p-4 rounded-lg border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSubtextClass()}`}>Approved</p>
                    <p className={`text-2xl font-bold ${getTextClass()}`}>{userStats.approvedMappings}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className={`${getCardClass()} p-4 rounded-lg border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSubtextClass()}`}>Pending</p>
                    <p className={`text-2xl font-bold ${getTextClass()}`}>{userStats.pendingMappings}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <div className={`${getCardClass()} p-4 rounded-lg border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${getSubtextClass()}`}>Approval Rate</p>
                    <p className={`text-2xl font-bold ${getTextClass()}`}>{userStats.accuracyRate}%</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Receipt Mappings Table */}
            <div className={`${getCardClass()} p-6 rounded-lg border`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className={`text-lg font-semibold ${getTextClass()} mb-1`}>Receipt Mappings</h3>
                  <p className={`text-sm ${getSubtextClass()}`}>
                    Track your receipt processing submissions and their mapping status in the LLM Center
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      console.log('📋 [BusinessAIInsights] 🔄 Refresh button clicked - fetching fresh from backend...')
                      setReceiptMappingsLoaded(false)
                      fetchReceiptMappings(true) // Always force refresh from backend
                    }}
                    disabled={receiptMappingsLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      receiptMappingsLoading
                        ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {receiptMappingsLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <div className={`text-sm ${getSubtextClass()}`}>
                    Showing {receiptMappings.length} mapping{receiptMappings.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              {receiptMappingsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className={getSubtextClass()}>Loading receipt mappings...</p>
                </div>
              ) : receiptMappings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-gray-400">Merchant</th>
                        <th className="text-left py-3 px-4 text-gray-400">Ticker</th>
                        <th className="text-left py-3 px-4 text-gray-400">Company</th>
                        <th className="text-left py-3 px-4 text-gray-400">Category</th>
                        <th className="text-left py-3 px-4 text-gray-400">Confidence</th>
                        <th className="text-left py-3 px-4 text-gray-400">Status</th>
                        <th className="text-left py-3 px-4 text-gray-400">Date</th>
                        <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptMappings.map((mapping) => (
                        <tr 
                          key={mapping.id} 
                          className="border-b border-white/5 hover:bg-white/5"
                        >
                          <td className="py-3 px-4 text-white font-medium">{mapping.merchant_name || 'N/A'}</td>
                          <td className="py-3 px-4 text-center">
                            {mapping.ticker ? (
                              <div className="flex items-center justify-center">
                                <CompanyLogo 
                                  symbol={mapping.ticker} 
                                  name={getCompanyName(mapping.ticker)}
                                  size="w-8 h-8" 
                                  clickable={true} 
                                />
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-white">
                            {getCompanyName(mapping.ticker) || mapping.company_name || mapping.merchant_name || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-gray-300">{mapping.category || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${getConfidenceColor(mapping.confidence, isLightMode)}`}>
                              {mapping.confidence ? `${Math.round(mapping.confidence * 100)}%` : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center space-x-1 w-fit ${getStatusColor(mapping.status)}`}>
                              {getStatusIcon(mapping.status)}
                              <span className="capitalize">{mapping.status || 'pending'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {mapping.created_at 
                              ? new Date(mapping.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                setSelectedTransaction(mapping)
                                setShowTransactionModal(true)
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className={`text-lg font-medium ${getTextClass()} mb-2`}>No Receipt Mappings Yet</h4>
                  <p className={`${getSubtextClass()} mb-4 max-w-md mx-auto`}>
                    Upload receipts to start creating mappings that will appear here. 
                    Each receipt you process will generate AI mappings for review.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Recommendations Tab */}
        {activeTab === 'recommendations' && (
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
                  onClick={() => fetchAIRecommendations()}
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
                        {receiptMappings?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${getSubtextClass()}`}>Approved</span>
                      <span className="text-gray-400 font-semibold">
                        {receiptMappings?.filter(m => m.status === 'approved' || m.status === 'auto-approved').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${getSubtextClass()}`}>Pending Review</span>
                      <span className="text-gray-400 font-semibold">
                        {receiptMappings?.filter(m => m.status === 'pending').length || 0}
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
                        case 'brand_education': return <Building2 className="w-6 h-6 text-blue-400" />
                        case 'roundup_nudge': return <DollarSign className="w-6 h-6 text-green-400" />
                        case 'category_education': return <BarChart3 className="w-6 h-6 text-purple-400" />
                        case 'goal_progress': return <Target className="w-6 h-6 text-orange-400" />
                        case 'market_education': return <TrendingUp className="w-6 h-6 text-cyan-400" />
                        case 'content_suggestion': return <BookOpen className="w-6 h-6 text-pink-400" />
                        default: return <Lightbulb className="w-6 h-6 text-yellow-400" />
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
                            {getTypeIcon()}
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
                        {rec.category && (
                          <div className="mt-2">
                            <span className={`text-xs ${getSubtextClass()}`}>Category: </span>
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                              {rec.category}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}


            {/* Educational Insights */}
            {!recommendationsLoading && aiRecommendations && aiRecommendations.insights && aiRecommendations.insights.length > 0 && (
              <div className={`${getCardClass()} rounded-xl p-6 border`}>
                <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Key Insights</h3>
                <ul className="space-y-3">
                  {aiRecommendations.insights.map((insight, index) => (
                    <li key={index} className={`flex items-start space-x-3 ${getSubtextClass()}`}>
                      <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            {!recommendationsLoading && aiRecommendations && (
              <div className={`${getCardClass()} rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/5`}>
                <p className={`text-xs ${isLightMode ? 'text-yellow-800' : 'text-yellow-300'} text-center`}>
                  {aiRecommendations.disclaimer || "Kamioi's insights are for educational purposes only and are not financial advice or recommendations."}
                </p>
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

            {/* Empty State - No Recommendations */}
            {!recommendationsLoading && aiRecommendations && 
             (!aiRecommendations.recommendations || aiRecommendations.recommendations.length === 0) &&
             (!aiRecommendations.insights || aiRecommendations.insights.length === 0) && (
              <div className={`${getCardClass()} rounded-xl p-6 border`}>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className={`text-lg font-medium ${getTextClass()} mb-2`}>No AI Recommendations Yet</h4>
                  <p className={`${getSubtextClass()} mb-4`}>
                    {transactions && transactions.length > 0
                      ? 'Submit more mappings to start receiving personalized AI recommendations'
                      : 'Upload your bank statement to start receiving personalized AI recommendations'}
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

              <div className={`${getCardClass()} rounded-xl p-4 border cursor-pointer hover:bg-white/5 transition-colors`}>
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
                          <td className="py-3 px-4 text-white font-mono text-sm">{mapping.transaction_id || 'N/A'}</td>
                          <td className="py-3 px-4 text-white">{mapping.merchant_name || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              <CompanyLogo symbol={mapping.ticker_symbol || mapping.ticker} size="w-8 h-8" clickable={true} />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{mapping.category || 'N/A'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center space-x-1 ${getStatusColor(mapping.status)}`}>
                              {getStatusIcon(mapping.status)}
                              <span className="capitalize">{mapping.status || 'pending'}</span>
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
              {(rewards || []).map((reward) => {
                // Convert icon string to Lucide icon component
                const getRewardIcon = () => {
                  switch (reward.icon) {
                    case 'trophy': return <Trophy className="w-8 h-8 text-yellow-400" />
                    case 'star': return <Star className="w-8 h-8 text-yellow-400" />
                    case 'gift': return <Gift className="w-8 h-8 text-pink-400" />
                    case 'medal': return <Medal className="w-8 h-8 text-orange-400" />
                    case 'award': return <Award className="w-8 h-8 text-green-400" />
                    case 'target': return <Target className="w-8 h-8 text-blue-400" />
                    case 'zap': return <Zap className="w-8 h-8 text-purple-400" />
                    default: return <Award className="w-8 h-8 text-blue-400" />
                  }
                }

                return (
                  <div key={reward.id} className={`${getCardClass()} rounded-xl p-4 border ${reward.unlocked ? 'ring-2 ring-green-500/50' : ''}`}>
                    <div className="text-center">
                      <div className="flex justify-center mb-2">{getRewardIcon()}</div>
                      <h4 className={`font-semibold ${getTextClass()} mb-1`}>{reward.name}</h4>
                      <p className={`text-sm ${getSubtextClass()} mb-3`}>{reward.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 font-semibold">+{reward.points || 0} pts</span>
                        {reward.unlocked ? (
                          <span className="text-green-400 text-sm">Unlocked</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Locked</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className={`${getCardClass()} rounded-xl p-6 border`}>
              <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Top Contributors</h3>
              {isDemoMode ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-gray-400">Rank</th>
                        <th className="text-left py-3 px-4 text-gray-400">User</th>
                        <th className="text-left py-3 px-4 text-gray-400">Tier</th>
                        <th className="text-center py-3 px-4 text-gray-400">Mappings</th>
                        <th className="text-center py-3 px-4 text-gray-400">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_LEADERBOARD.map((user) => (
                        <tr
                          key={user.rank}
                          className={`border-b border-white/5 ${user.isCurrentUser ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {user.rank === 1 && <Trophy className="w-5 h-5 text-yellow-400 mr-2" />}
                              {user.rank === 2 && <Medal className="w-5 h-5 text-gray-300 mr-2" />}
                              {user.rank === 3 && <Medal className="w-5 h-5 text-orange-400 mr-2" />}
                              <span className={`font-semibold ${user.rank <= 3 ? 'text-white' : 'text-gray-400'}`}>
                                #{user.rank}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${user.isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                              {user.name} {user.isCurrentUser && '(You)'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.tier === 'AI Master' ? 'bg-purple-500/20 text-purple-400' :
                              user.tier === 'AI Expert' ? 'bg-blue-500/20 text-blue-400' :
                              user.tier === 'AI Trainer' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {user.tier}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-300">{user.mappings}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-green-400 font-semibold">{user.points.toLocaleString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className={`text-lg font-medium ${getTextClass()} mb-2`}>No Leaderboard Data Yet</h4>
                  <p className={`${getSubtextClass()} mb-4`}>
                    Submit more mappings to see your ranking among other users
                  </p>
                </div>
              )}
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

        {/* Other tabs can be implemented similarly */}
        {activeTab !== 'receipt-mappings' && activeTab !== 'recommendations' && activeTab !== 'mapping-history' && activeTab !== 'rewards' && activeTab !== 'leaderboard' && activeTab !== 'ai-performance' && (
          <div className={`${getCardClass()} p-6 rounded-lg border`}>
            <p className={getSubtextClass()}>Coming soon: {activeTab}</p>
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
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Transaction ID</label>
                    <p className="text-white font-mono">{selectedTransaction.transaction_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Mapping ID</label>
                    <p className="text-white font-mono">{selectedTransaction.mapping_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center space-x-1 w-fit ${getStatusColor(selectedTransaction.status)}`}>
                      {getStatusIcon(selectedTransaction.status)}
                      <span className="capitalize">{selectedTransaction.status || 'pending'}</span>
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Merchant</label>
                    <p className="text-white">{selectedTransaction.merchant_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Ticker</label>
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm font-mono">
                      {selectedTransaction.ticker_symbol || selectedTransaction.ticker || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                    <p className="text-white">{selectedTransaction.category || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Confidence</label>
                    <p className={`font-medium ${getConfidenceColor(selectedTransaction.confidence, isLightMode)}`}>
                      {selectedTransaction.confidence
                        ? `${Math.round(selectedTransaction.confidence * 100)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Submitted Date</label>
                  <p className="text-white">
                    {(() => {
                      const dateStr = selectedTransaction.submitted_at || selectedTransaction.created_at
                      if (!dateStr) return 'N/A'
                      try {
                        const date = new Date(dateStr)
                        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      } catch {
                        return 'N/A'
                      }
                    })()}
                  </p>
                </div>

                {selectedTransaction.processed_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Reviewed Date</label>
                    <p className="text-white">
                      {(() => {
                        try {
                          const date = new Date(selectedTransaction.processed_at)
                          return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        } catch {
                          return 'N/A'
                        }
                      })()}
                    </p>
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
                  <p className="text-green-400 font-semibold">+{selectedTransaction.points || (selectedTransaction.admin_approved ? 10 : 0)}</p>
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
    </div>
  )
}

export default BusinessAIInsights

