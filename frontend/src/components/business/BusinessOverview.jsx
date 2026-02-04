import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  MessageSquare, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet
} from 'lucide-react'
import TimeOfDay from '../common/TimeOfDay'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'

const BusinessOverview = ({ user, onNavigate }) => {
  const navigate = useNavigate()

  // Helper function to get the correct auth token (demo token takes precedence)
  const getAuthToken = () => {
    return localStorage.getItem('kamioi_demo_token') ||
           localStorage.getItem('kamioi_business_token') ||
           localStorage.getItem('kamioi_user_token') ||
           localStorage.getItem('kamioi_token') ||
           localStorage.getItem('authToken')
  }
  const { isBlackMode, isLightMode } = useTheme()
  const { transactions, totalRoundUps, portfolioValue, portfolioStats, holdings } = useData()

  // Check if in demo mode
  const isDemoMode = localStorage.getItem('kamioi_demo_mode') === 'true'
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [businessData, setBusinessData] = useState({
    total_revenue: 0,
    monthly_revenue: 0,
    revenue_growth: 0,
    total_employees: 0,
    active_projects: 0,
    completed_projects: 0,
    client_satisfaction: 0,
    team_productivity: 0,
    monthly_expenses: 0,
    profit_margin: 0,
    cash_flow: 0,
    roi: 0,
    recent_activities: [],
    key_metrics: {}
  })

  // Helper function to check if transaction has a ticker (from DB or merchant lookup)
  // Same logic as BusinessTransactions.jsx
  const transactionHasTicker = (transaction) => {
    const hasTicker = transaction.ticker || transaction.stock_symbol || transaction.ticker_symbol
    
    if (hasTicker) return true
    
    // Try merchant lookup
    if (transaction.merchant) {
      const merchantTickerMap = {
        'NETFLIX': 'NFLX', 'APPLE': 'AAPL', 'APPLE STORE': 'AAPL', 'AMAZON': 'AMZN',
        'STARBUCKS': 'SBUX', 'WALMART': 'WMT', 'TARGET': 'TGT', 'COSTCO': 'COST',
        'GOOGLE': 'GOOGL', 'MICROSOFT': 'MSFT', 'META': 'META', 'FACEBOOK': 'META',
        'TESLA': 'TSLA', 'NVIDIA': 'NVDA', 'SPOTIFY': 'SPOT', 'UBER': 'UBER',
        'MACY': 'M', 'MACYS': 'M', 'CHIPOTLE': 'CMG', 'DISNEY': 'DIS', 'NIKE': 'NKE',
        'ADOBE': 'ADBE', 'SALESFORCE': 'CRM', 'PAYPAL': 'PYPL', 'INTEL': 'INTC',
        'AMD': 'AMD', 'ORACLE': 'ORCL', 'IBM': 'IBM', 'CISCO': 'CSCO',
        'JPMORGAN': 'JPM', 'BANK OF AMERICA': 'BAC', 'WELLS FARGO': 'WFC',
        'GOLDMAN SACHS': 'GS', 'VISA': 'V', 'MASTERCARD': 'MA',
        'JOHNSON & JOHNSON': 'JNJ', 'PFIZER': 'PFE', 'UNITEDHEALTH': 'UNH',
        'HOME DEPOT': 'HD', 'LOWES': 'LOW', 'COCA-COLA': 'KO', 'PEPSI': 'PEP',
        'MCDONALDS': 'MCD', 'YUM': 'YUM', 'ESTEE LAUDER': 'EL', 'BURLINGTON': 'BURL',
        'FOOT LOCKER': 'FL', 'CHARTER': 'CHTR', 'SPECTRUM': 'CHTR',
        'DICKS': 'DKS', 'DICKS SPORTING GOODS': 'DKS'
      }
      const merchantUpper = transaction.merchant.toUpperCase().trim()
      if (merchantTickerMap[merchantUpper]) return true
      for (const [key] of Object.entries(merchantTickerMap)) {
        if (merchantUpper.includes(key)) return true
      }
    }
    return false
  }

  // Helper function to get display round-up amount (same logic as BusinessTransactions)
  const getDisplayRoundUp = (transaction) => {
    // Use round_up_amount if available, otherwise round_up, otherwise use current setting
    const roundUpAmount = transaction.round_up_amount || transaction.round_up || 0
    // If round-up is 0, use $1.00 as default (current setting)
    return roundUpAmount > 0 ? roundUpAmount : 1.00
  }

  const getCardClass = () => {
    if (isBlackMode) return 'bg-black/20 backdrop-blur-xl border border-white/10'
    if (isLightMode) return 'bg-white/80 backdrop-blur-xl border border-gray-200/50'
    return 'bg-white/10 backdrop-blur-xl border border-white/20'
  }

  const getTextClass = () => {
    if (isLightMode) return 'text-gray-800'
    return 'text-white'
  }

  const getSubtextClass = () => {
    if (isLightMode) return 'text-gray-600'
    return 'text-white/60'
  }

  const getMetricClass = () => {
    if (isLightMode) return 'text-gray-900'
    return 'text-white'
  }

  const getValueClass = () => {
    if (isLightMode) return 'text-gray-700'
    return 'text-white/80'
  }

  // Fetch business data on component mount and when transactions change
  useEffect(() => {
    fetchBusinessData()
  }, [transactions])

  const fetchBusinessData = async () => {
    try {
      setIsLoading(true)
      const authToken = getAuthToken()
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/business/dashboard/overview`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setBusinessData(result.data)
          setLastUpdated(new Date())
        }
      } else {
        // If API fails, calculate from transactions directly
        calculateFromTransactions()
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
      // Fallback to calculating from transactions
      calculateFromTransactions()
    } finally {
      setIsLoading(false)
    }
  }

  const calculateFromTransactions = () => {
    if (!transactions || transactions.length === 0) {
      return
    }

    const safeTransactions = Array.isArray(transactions) ? transactions : []
    const totalTransactions = safeTransactions.length
    
    // Calculate total spending (sum of all transaction amounts)
    const totalSpending = safeTransactions.reduce((sum, t) => sum + Math.abs(t.amount || t.purchase || t.total_debit || 0), 0)
    
    // Calculate total round-ups (using display round-up logic - includes $1.00 default)
    const totalRoundups = safeTransactions.reduce((sum, t) => sum + getDisplayRoundUp(t), 0)
    
    // Calculate monthly metrics (transactions from current month)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const monthlyTransactions = safeTransactions.filter(t => {
      if (!t.date && !t.created_at) return false
      const date = new Date(t.date || t.created_at)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    
    // Monthly Revenue = total round-ups from current month (investments made this month)
    const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + getDisplayRoundUp(t), 0)
    
    // Monthly Purchases = total spending from current month (purchases made this month)
    const monthlyPurchases = monthlyTransactions.reduce((sum, t) => sum + Math.abs(t.amount || t.purchase || t.total_debit || 0), 0)
    
    // Calculate growth (compare current month round-ups to previous month round-ups)
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const previousMonthTransactions = safeTransactions.filter(t => {
      if (!t.date && !t.created_at) return false
      const date = new Date(t.date || t.created_at)
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear
    })
    const previousMonthRevenue = previousMonthTransactions.reduce((sum, t) => sum + getDisplayRoundUp(t), 0)
    
    let revenueGrowth = 0
    if (previousMonthRevenue > 0) {
      revenueGrowth = ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    } else if (monthlyRevenue > 0) {
      revenueGrowth = 100
    }
    
    // Count transactions by status (same logic as BusinessTransactions)
    // Completed transactions = actually invested
    const completedTransactions = safeTransactions.filter(t => {
      const status = (t.status || '').toLowerCase().trim()
      return status === 'completed'
    })
    
    // Mapped transactions = ready to invest but not yet completed
    // Includes transactions with status "mapped"/"staged" OR transactions with tickers
    const mappedTransactions = safeTransactions.filter(t => {
      const status = (t.status || '').toLowerCase().trim()
      const isCompleted = status === 'completed'
      if (isCompleted) return false
      if (status === 'mapped' || status === 'staged') return true
      if (transactionHasTicker(t)) return true
      return false
    })
    
    // Invested transactions = completed transactions OR transactions with allocations (from receipts)
    const investedTransactions = safeTransactions.filter(t => {
      const status = (t.status || '').toLowerCase().trim()
      // Completed transactions are invested
      if (status === 'completed') return true
      // Transactions with allocations are invested (from receipt uploads)
      if (t.allocations && Array.isArray(t.allocations) && t.allocations.length > 0) return true
      return false
    })
    
    // Calculate investment metrics
    const totalInvested = completedTransactions.reduce((sum, t) => sum + getDisplayRoundUp(t), 0)
    const availableToInvest = mappedTransactions.reduce((sum, t) => sum + getDisplayRoundUp(t), 0)
    const investmentRate = totalTransactions > 0 ? (investedTransactions.length / totalTransactions * 100) : 0
    
    console.log('📊 BusinessOverview - Calculated Metrics:')
    console.log('  - Total Transactions:', totalTransactions)
    console.log('  - Total Spending:', totalSpending)
    console.log('  - Total Round-ups:', totalRoundups)
    console.log('  - Monthly Revenue (round-ups):', monthlyRevenue)
    console.log('  - Monthly Purchases (spending):', monthlyPurchases)
    console.log('  - Revenue Growth:', revenueGrowth)
    console.log('  - Completed Transactions:', completedTransactions.length)
    console.log('  - Mapped Transactions:', mappedTransactions.length)
    console.log('  - Invested Transactions:', investedTransactions.length)
    console.log('  - Total Invested:', totalInvested)
    console.log('  - Available to Invest:', availableToInvest)
    console.log('  - Investment Rate:', investmentRate)
    
    setBusinessData({
      quick_stats: {
        total_employees: 0,
        monthly_revenue: round(monthlyRevenue, 2),
        monthly_purchases: round(monthlyPurchases, 2),
        total_revenue: round(totalSpending, 2),
        revenue_growth: round(revenueGrowth, 2),
        active_projects: investedTransactions.length,
        total_transactions: totalTransactions,
        total_roundups: round(totalRoundups, 2),
        invested_transactions: investedTransactions.length,
        mapped_transactions: mappedTransactions.length,
        available_to_invest: round(availableToInvest, 2),
        total_invested: round(totalInvested, 2)
      },
      client_satisfaction: investedTransactions.length > 0 ? 100 : 0,
      team_productivity: investedTransactions.length > 0 ? 100 : 0,
      recent_activities: [],
      key_metrics: {
        total_spending: round(totalSpending, 2),
        total_invested: round(totalInvested, 2),
        available_to_invest: round(availableToInvest, 2),
        investment_rate: round(investmentRate, 2),
        mapped_count: mappedTransactions.length
      }
    })
    setLastUpdated(new Date())
  }

  const round = (value, decimals = 2) => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  const refreshData = () => {
    fetchBusinessData()
  }

  // Use portfolioStats for demo mode, otherwise use calculated business data
  const safePortfolioValue = isDemoMode ? (portfolioValue || 0) : (businessData?.quick_stats?.total_invested || 0)
  const gainPct = isDemoMode ? (portfolioStats?.gainPercentage || 0) : 0
  const todayGainPct = isDemoMode ? (portfolioStats?.todayGainPct || 0) : 0
  const safeHoldings = isDemoMode ? (holdings || []) : []

  // Calculate total invested from completed transactions
  const safeTransactions = Array.isArray(transactions) ? transactions : []
  const completedTransactions = safeTransactions.filter(t => t.status === 'completed')
  const totalInvested = completedTransactions.reduce((sum, t) => sum + (t.roundUp || t.round_up || 0), 0)
  const completedCount = completedTransactions.length

  const stats = [
    {
      title: 'Portfolio Value',
      value: `$${safePortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(1)}% all time`,
      icon: DollarSign,
      color: gainPct >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: gainPct >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
    },
    {
      title: 'Today\'s Change',
      value: `${todayGainPct >= 0 ? '+' : ''}${todayGainPct.toFixed(2)}%`,
      change: `${todayGainPct >= 0 ? '+' : ''}$${(safePortfolioValue * todayGainPct / 100).toFixed(2)}`,
      icon: TrendingUp,
      color: todayGainPct >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: todayGainPct >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
    },
    {
      title: 'Active Investments',
      value: safeHoldings.length.toString(),
      change: `${safeHoldings.length} stocks`,
      icon: Target,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      title: 'Total Round-ups',
      value: `$${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${completedCount} invested`,
      icon: Wallet,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    {
      title: 'Total Transactions',
      value: (businessData?.quick_stats?.total_transactions || transactions?.length || 0).toString(),
      change: `$${(businessData?.quick_stats?.monthly_purchases || businessData?.quick_stats?.total_revenue || 0).toLocaleString()} this month`,
      icon: BarChart3,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Monthly Growth',
      value: `${businessData?.quick_stats?.revenue_growth >= 0 ? '+' : ''}${(businessData?.quick_stats?.revenue_growth || 0).toFixed(1)}%`,
      change: 'vs last month',
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20'
    }
  ]

  return (
    <div className="w-full space-y-6">
      {/* Welcome Section */}
      <div className={`${getCardClass()} rounded-xl p-6`} data-tutorial="business-welcome">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${getTextClass()} mb-2`}>
              Hello, {user?.businessName || user?.company_name || user?.business_name || user?.name || 'Business'}!
              <TimeOfDay />
            </h1>
            <p className={`text-lg ${getSubtextClass()}`}>
              Manage your business investments and team
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm ${getSubtextClass()}`}>Last updated</p>
            <p className={`text-sm ${getValueClass()}`}>
              {lastUpdated.toLocaleTimeString()}
            </p>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className={`mt-2 p-2 rounded-lg transition-colors ${
                isLightMode 
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' 
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${getCardClass()} rounded-xl p-6 hover:scale-105 transition-transform duration-200 cursor-pointer`}
              onClick={() => navigate('/business/transactions')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              </div>
              
              <div>
                <h3 className={`text-sm font-medium ${getSubtextClass()} mb-1`}>
                  {stat.title}
                </h3>
                <p className={`text-2xl font-bold ${getMetricClass()} mb-1`}>
                  {stat.value}
                </p>
                <p className={`text-sm ${stat.color}`}>
                  {stat.change}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className={`${getCardClass()} rounded-xl p-6`}>
        <h2 className={`text-xl font-bold ${getTextClass()} mb-4`}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => onNavigate && onNavigate('team')}
            className={`p-4 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer ${
              isLightMode 
                ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:scale-105' 
                : 'border-white/20 hover:border-white/40 hover:bg-white/5 hover:scale-105'
            }`} 
            data-tutorial="team-management"
          >
            <Users className={`w-8 h-8 mx-auto mb-2 ${getSubtextClass()}`} />
            <p className={`font-medium ${getTextClass()}`}>Add Team Member</p>
            <p className={`text-sm ${getSubtextClass()}`}>Invite new team members</p>
          </button>
          
          <button 
            onClick={() => onNavigate && onNavigate('goals')}
            className={`p-4 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer ${
              isLightMode 
                ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:scale-105' 
                : 'border-white/20 hover:border-white/40 hover:bg-white/5 hover:scale-105'
            }`} 
            data-tutorial="business-goals"
          >
            <Target className={`w-8 h-8 mx-auto mb-2 ${getSubtextClass()}`} />
            <p className={`font-medium ${getTextClass()}`}>Set Business Goal</p>
            <p className={`text-sm ${getSubtextClass()}`}>Create new business objectives</p>
          </button>
          
          <button 
            onClick={() => onNavigate && onNavigate('analytics')}
            className={`p-4 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer ${
              isLightMode 
                ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:scale-105' 
                : 'border-white/20 hover:border-white/40 hover:bg-white/5 hover:scale-105'
            }`} 
            data-tutorial="business-analytics"
          >
            <BarChart3 className={`w-8 h-8 mx-auto mb-2 ${getSubtextClass()}`} />
            <p className={`font-medium ${getTextClass()}`}>View Analytics</p>
            <p className={`text-sm ${getSubtextClass()}`}>Analyze business performance</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default BusinessOverview
