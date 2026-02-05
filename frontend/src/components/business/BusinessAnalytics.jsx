import React, { useState, useMemo } from 'react'
import { BarChart3, RefreshCw, TrendingUp, DollarSign, PieChart, ShoppingBag, Target, CheckCircle, Clock, Filter, Download, Eye } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useData } from '../../context/DataContext'
import RechartsChart from '../common/RechartsChart'
import CompanyLogo from '../common/CompanyLogo'
import { formatCurrency, formatDate } from '../../utils/formatters'

const BusinessAnalytics = ({ user }) => {
  const { isBlackMode, isLightMode } = useTheme()
  const { transactions, totalRoundUps, portfolioValue } = useData()
  const [selectedTimeframe, setSelectedTimeframe] = useState('3m')
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Filter transactions based on selected timeframe
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    const now = new Date()
    let cutoffDate = new Date()

    switch (selectedTimeframe) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30d':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6)
        break
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        cutoffDate = new Date(0) // All time
        break
    }

    return transactions.filter(tx => {
      const txDate = new Date(tx.date || tx.created_at)
      return txDate >= cutoffDate
    })
  }, [transactions, selectedTimeframe])

  // Helper function to get display round-up amount (same logic as BusinessTransactions)
  const getDisplayRoundUp = (transaction) => {
    const roundUpAmount = transaction.round_up_amount || transaction.round_up || 0
    // If round-up is 0, use $1.00 as default (current setting)
    return roundUpAmount > 0 ? roundUpAmount : 1.00
  }

  // Helper function to get ticker from transaction (same logic as BusinessTransactions)
  const getTransactionTicker = (transaction) => {
    // First check if ticker exists in transaction
    if (transaction.ticker || transaction.stock_symbol || transaction.ticker_symbol) {
      return transaction.ticker || transaction.stock_symbol || transaction.ticker_symbol
    }
    
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
      if (merchantTickerMap[merchantUpper]) return merchantTickerMap[merchantUpper]
      for (const [key, value] of Object.entries(merchantTickerMap)) {
        if (merchantUpper.includes(key)) return value
      }
    }
    return null
  }

  // Mock prices for share calculation (same across all functions)
  const getStockPrice = (ticker) => {
    const mockPrices = {
      'AAPL': 175, 'AMZN': 140, 'GOOGL': 140, 'MSFT': 380, 'TSLA': 250,
      'META': 320, 'NFLX': 450, 'NVDA': 480, 'SBUX': 95, 'WMT': 160,
      'TGT': 140, 'NKE': 100, 'DIS': 90, 'MCD': 280, 'COST': 700,
      'FL': 25, 'PSY': 50, 'DLTR': 120, 'CVS': 60, 'RETAIL': 30,
      'BURL': 30, 'CHTR': 300, 'DKS': 100, 'EL': 200
    }
    return mockPrices[ticker] || 100 // Default to $100 if ticker not found
  }

  // Helper function to calculate shares (same logic as BusinessTransactions)
  const calculateShares = (roundUpAmount, ticker) => {
    if (!ticker || !roundUpAmount || roundUpAmount <= 0) return 0
    const price = getStockPrice(ticker)
    return roundUpAmount / price
  }

  // Get all investments (transactions with tickers or allocations) - only completed and confirmed
  const investments = useMemo(() => {
    if (!filteredTransactions || !Array.isArray(filteredTransactions)) return []

    // Filter for completed and confirmed investments only
    const completedInvestments = filteredTransactions
      .filter(t => {
        const hasTicker = getTransactionTicker(t)
        const hasAllocations = t.allocations && Array.isArray(t.allocations) && t.allocations.length > 0
        const isCompleted = (t.status || '').toLowerCase() === 'completed'
        const isConfirmed = true // All completed transactions are considered confirmed
        return (hasTicker || hasAllocations) && isCompleted && isConfirmed
      })
    
    // Process investments and expand allocations into individual investment rows
    const investmentRows = []
    
    completedInvestments.forEach(t => {
      const hasAllocations = t.allocations && Array.isArray(t.allocations) && t.allocations.length > 0
      
      if (hasAllocations) {
        // If transaction has allocations, create one row per allocation
        t.allocations.forEach((alloc, index) => {
          // Try multiple field names for ticker (stock_symbol is most common in allocations)
          const allocTicker = alloc.stock_symbol || alloc.ticker || alloc.ticker_symbol || alloc.stock_ticker
          // Check multiple possible fields for allocation amount (allocation_amount is most common)
          const allocAmount = alloc.allocation_amount || alloc.amount || alloc.round_up_amount || alloc.allocationAmount || 0
          
          // Only process if we have both ticker and amount
          if (!allocTicker || !allocAmount || allocAmount <= 0) {
            console.log('📊 BusinessAnalytics - Skipping invalid allocation:', { alloc, allocTicker, allocAmount })
            return
          }
          
          const allocShares = calculateShares(allocAmount, allocTicker)
          
          console.log('📊 BusinessAnalytics - Processing allocation:', {
            ticker: allocTicker,
            amount: allocAmount,
            shares: allocShares,
            allocation: alloc
          })
          
          investmentRows.push({
            id: `${t.id}_alloc_${index}`,
            transactionId: t.id,
            date: t.date || t.created_at,
            merchant: t.merchant || t.description || 'Unknown',
            purchase: t.amount || t.purchase || 0,
            ticker: allocTicker,
            roundUp: allocAmount,
            shares: allocShares,
            percentage: alloc.allocation_percentage || alloc.percentage || 0,
            status: t.status || 'completed',
            isAllocation: true,
            allocationIndex: index
          })
        })
      } else {
        // If no allocations but has ticker, create single investment row
        const ticker = getTransactionTicker(t)
        if (ticker) {
          const roundUp = getDisplayRoundUp(t)
          const shares = calculateShares(roundUp, ticker)
          
          investmentRows.push({
            id: `${t.id}_main`,
            transactionId: t.id,
            date: t.date || t.created_at,
            merchant: t.merchant || t.description || 'Unknown',
            purchase: t.amount || t.purchase || 0,
            ticker,
            roundUp,
            shares,
            percentage: 100,
            status: t.status || 'completed',
            isAllocation: false
          })
        }
      }
    })
    
    console.log('📊 BusinessAnalytics - Investment rows created:', investmentRows.length)
    console.log('📊 BusinessAnalytics - Sample investment row:', investmentRows[0])
    
    // Group by ticker and aggregate (same logic as Admin Investment Summary)
    const investmentGroups = {}
    investmentRows.forEach(inv => {
      const key = inv.ticker
      if (!key || !inv.roundUp || inv.roundUp <= 0) {
        console.log('📊 BusinessAnalytics - Skipping invalid investment:', inv)
        return
      }
      
      if (!investmentGroups[key]) {
        investmentGroups[key] = {
          ticker: inv.ticker,
          shares: 0,
          totalInvested: 0,
          currentPrice: getStockPrice(inv.ticker),
          transactions: []
        }
      }
      
      investmentGroups[key].shares += (inv.shares || 0)
      investmentGroups[key].totalInvested += (inv.roundUp || 0)
      investmentGroups[key].transactions.push(inv)
    })
    
    console.log('📊 BusinessAnalytics - Investment groups:', Object.keys(investmentGroups).length)
    console.log('📊 BusinessAnalytics - Sample group:', Object.values(investmentGroups)[0])
    
    // Convert to array and calculate values
    const investmentArray = Object.values(investmentGroups)
      .map(inv => ({
        ...inv,
        currentValue: inv.shares * inv.currentPrice,
        gainLoss: (inv.shares * inv.currentPrice) - inv.totalInvested,
        gainLossPercent: inv.totalInvested > 0 ? 
          (((inv.shares * inv.currentPrice) - inv.totalInvested) / inv.totalInvested) * 100 : 0
      }))
      .sort((a, b) => new Date(b.transactions[0]?.date || 0) - new Date(a.transactions[0]?.date || 0))
      .slice(0, 5) // Limit to 5 investments

    return investmentArray
  }, [filteredTransactions])

  // Calculate portfolio value from investments (calculated, not from context)
  const calculatedPortfolioValue = useMemo(() => {
    return investments.reduce((sum, inv) => sum + inv.totalInvested, 0)
  }, [investments])

  // Calculate investment stats (matching Admin Investment Summary)
  const investmentStats = useMemo(() => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0)
    const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const totalGainLoss = currentValue - totalInvested
    const uniqueStocks = investments.length

    return {
      totalInvested,
      currentValue,
      totalGainLoss,
      uniqueStocks
    }
  }, [investments])

  // Company name mapping
  const getCompanyName = (ticker) => {
    const companyMap = {
      'SBUX': 'Starbucks', 'AMZN': 'Amazon', 'NFLX': 'Netflix', 'BURL': 'Burlington',
      'DKS': 'Dick\'s Sporting Goods', 'WMT': 'Walmart', 'ADBE': 'Adobe',
      'GOOGL': 'Google', 'CHTR': 'Spectrum', 'AAPL': 'Apple', 'COST': 'Costco',
      'TGT': 'Target', 'BJ': 'BJ\'s Wholesale', 'NKE': 'Nike', 'FL': 'Foot Locker',
      'PSY': 'PSY', 'DLTR': 'Dollar Tree', 'CVS': 'CVS', 'RETAIL': 'Retail'
    }
    return companyMap[ticker] || ticker
  }

  // Calculate analytics data from filtered transactions (same as UserAnalytics)
  const analyticsData = useMemo(() => {
    if (!filteredTransactions || !Array.isArray(filteredTransactions) || filteredTransactions.length === 0) {
      return {
        spending: {
          total: 0,
          categories: {},
          monthly: {}
        },
        investments: {
          total: portfolioValue || 0,
          roundUps: 0
        },
        trends: {
          spending: 'stable',
          investments: 'stable'
        }
      }
    }

    // Calculate total round-ups using display logic (includes $1.00 default)
    const calculatedRoundUps = filteredTransactions.reduce((sum, t) => sum + getDisplayRoundUp(t), 0)

    return {
      spending: {
        total: filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount || t.total_debit || 0), 0),
        categories: filteredTransactions.reduce((acc, t) => {
          const category = t.category || 'Other'
          acc[category] = (acc[category] || 0) + Math.abs(t.amount || t.total_debit || 0)
          return acc
        }, {}),
        monthly: filteredTransactions.reduce((acc, t) => {
          const date = t.date || t.created_at
          if (date) {
            const month = new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            acc[month] = (acc[month] || 0) + Math.abs(t.amount || t.total_debit || 0)
          }
          return acc
        }, {})
      },
      investments: {
        total: portfolioValue || 0,
        roundUps: calculatedRoundUps || totalRoundUps || 0
      },
      trends: {
        spending: filteredTransactions.length > 0 ? 'increasing' : 'stable',
        investments: (portfolioValue || 0) > 0 ? 'growing' : 'stable'
      }
    }
  }, [filteredTransactions, portfolioValue, totalRoundUps])

  const handleRefresh = () => {
    setLastUpdated(new Date())
  }

  const getCardClass = () => {
    if (isBlackMode) return 'bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg'
    if (isLightMode) return 'bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-lg'
    return 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg'
  }

  const getTextClass = () => {
    if (isLightMode) return 'text-gray-800'
    return 'text-white'
  }

  const getSubtextClass = () => {
    if (isLightMode) return 'text-gray-600'
    return 'text-white/60'
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${getTextClass()}`}>Business Analytics</h1>
          <p className={`text-sm ${getSubtextClass()}`}>
            Analyze your business performance and insights
            {lastUpdated && (
              <span className="ml-2">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className={`${isLightMode ? 'bg-white/80' : 'bg-white/10'} backdrop-blur-sm border ${isLightMode ? 'border-gray-200' : 'border-white/20'} ${getTextClass()} px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">3 Months</option>
            <option value="6m">6 Months</option>
            <option value="1y">1 Year</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8">
        {[
          { id: 'overview', label: 'Spending Analytics', icon: BarChart3 },
          { id: 'goals', label: 'Investment Insights', icon: Target },
          { id: 'ai', label: 'AI Insights', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`${getCardClass()} p-6 hover:scale-105 transition-transform duration-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <ShoppingBag className="w-6 h-6 text-blue-400" />
                </div>
                <span className={`text-sm ${getSubtextClass()}`}>Total Purchases</span>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${getTextClass()}`}>
                  ${analyticsData.spending.total.toLocaleString()}
                </p>
                <p className={`text-sm ${getSubtextClass()}`}>
                  {filteredTransactions?.length || 0} transactions
                </p>
              </div>
            </div>

            <div className={`${getCardClass()} p-6 hover:scale-105 transition-transform duration-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <span className={`text-sm ${getSubtextClass()}`}>Avg Purchase</span>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${getTextClass()}`}>
                  ${(filteredTransactions?.length || 0) > 0 ? (analyticsData.spending.total / filteredTransactions.length).toFixed(2) : '0.00'}
                </p>
                <p className={`text-sm ${getSubtextClass()}`}>Per transaction</p>
              </div>
            </div>

            <div className={`${getCardClass()} p-6 hover:scale-105 transition-transform duration-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
                <span className={`text-sm ${getSubtextClass()}`}>Total Round-ups</span>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${getTextClass()}`}>
                  ${analyticsData.investments.roundUps.toFixed(2)}
                </p>
                <p className={`text-sm ${getSubtextClass()}`}>From transactions</p>
              </div>
            </div>

            <div className={`${getCardClass()} p-6 hover:scale-105 transition-transform duration-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <span className={`text-sm ${getSubtextClass()}`}>Linked to Stocks</span>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${getTextClass()}`}>
                  {(filteredTransactions || []).filter(t => t.ticker || (t.allocations && t.allocations.length > 0)).length}
                </p>
                <p className={`text-sm ${getSubtextClass()}`}>Mapped transactions</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Spending by Category */}
            <div className={`${getCardClass()} p-6`}>
              <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Spending by Category</h3>
              {Object.keys(analyticsData.spending.categories).length > 0 ? (
                <RechartsChart 
                  type="donut" 
                  height={300}
                  data={Object.entries(analyticsData.spending.categories).map(([category, amount]) => ({ 
                    name: category, 
                    value: amount 
                  }))}
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <PieChart className={`w-12 h-12 ${getSubtextClass()} mx-auto mb-2`} />
                    <p className={`${getSubtextClass()}`}>No spending data yet</p>
                  </div>
                </div>
              )}
            </div>

            {/* Top Merchants */}
            <div className={`${getCardClass()} p-6`}>
              <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Top Merchants</h3>
              {(filteredTransactions || []).length > 0 ? (
                (() => {
                  // Count transactions per merchant
                  const merchantCounts = (filteredTransactions || []).reduce((acc, t) => {
                    const merchant = t.merchant || t.description || 'Unknown'
                    acc[merchant] = (acc[merchant] || 0) + 1
                    return acc
                  }, {})
                  
                  // Sort by count and filter out merchants with count <= 1 (remove low-value bars)
                  const topMerchants = Object.entries(merchantCounts)
                    .filter(([_, count]) => count > 1) // Filter out merchants with only 1 transaction
                    .sort(([_, a], [__, b]) => b - a) // Sort by count descending
                    .slice(0, 10) // Limit to top 10
                    .map(([merchant, count]) => ({ 
                      name: merchant, 
                      value: count 
                    }))
                  
                  return topMerchants.length > 0 ? (
                    <RechartsChart 
                      type="bar" 
                      height={300}
                      data={topMerchants}
                      series={[{ dataKey: 'value', name: 'Visits' }]}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <BarChart3 className={`w-12 h-12 ${getSubtextClass()} mx-auto mb-2`} />
                        <p className={`${getSubtextClass()}`}>No merchant data yet</p>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BarChart3 className={`w-12 h-12 ${getSubtextClass()} mx-auto mb-2`} />
                    <p className={`${getSubtextClass()}`}>No merchant data yet</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Round-Up Impact */}
          <div className={`${getCardClass()} p-6`}>
            <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Round-Up Impact by Category</h3>
            {Object.keys(analyticsData.spending.categories).length > 0 ? (
              <RechartsChart
                type="bar"
                height={300}
                data={Object.entries(analyticsData.spending.categories).map(([category, amount]) => {
                  // Calculate actual round-ups for this category using display logic
                  const categoryTransactions = (filteredTransactions || []).filter(t => (t.category || 'Other') === category)
                  const categoryRoundUps = categoryTransactions.reduce((sum, t) => sum + getDisplayRoundUp(t), 0)
                  return {
                    name: category,
                    value: categoryRoundUps
                  }
                })}
                series={[{ dataKey: 'value', name: 'Round-up Impact' }]}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Target className={`w-12 h-12 ${getSubtextClass()} mx-auto mb-2`} />
                  <p className={`${getSubtextClass()}`}>No round-up data yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Investment Insights Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold ${getTextClass()} mb-2`}>
                Investment Summary
              </h1>
              <p className={getSubtextClass()}>
                Track your business investments and performance
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  const csvData = investments.map(inv => ({
                    Ticker: inv.ticker,
                    Company: getCompanyName(inv.ticker),
                    Shares: inv.shares,
                    'Total Invested': inv.totalInvested,
                    'Current Value': inv.currentValue,
                    'Gain/Loss': inv.gainLoss,
                    'Gain/Loss %': inv.gainLossPercent
                  }))
                  const csv = [
                    Object.keys(csvData[0] || {}).join(','),
                    ...csvData.map(row => Object.values(row).join(','))
                  ].join('\n')
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `business-investments-${new Date().toISOString().split('T')[0]}.csv`
                  link.click()
                  URL.revokeObjectURL(url)
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`${getCardClass()} p-6 rounded-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Total Invested</p>
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    ${investmentStats.totalInvested.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className={`${getCardClass()} p-6 rounded-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Current Value</p>
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    ${investmentStats.currentValue.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className={`${getCardClass()} p-6 rounded-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Total Gain/Loss</p>
                  <p className={`text-2xl font-bold ${investmentStats.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${investmentStats.totalGainLoss.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className={`${getCardClass()} p-6 rounded-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Unique Stocks</p>
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    {investmentStats.uniqueStocks}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Investment Cards Grid */}
          {investments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {investments.map((investment, index) => (
                <div
                  key={`${investment.ticker}-${index}`}
                  className={`${getCardClass()} p-6 rounded-lg cursor-pointer hover:scale-105 transition-all duration-200`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <CompanyLogo 
                        symbol={investment.ticker} 
                        name={getCompanyName(investment.ticker)}
                        size="w-8 h-8"
                      />
                      <div>
                        <h3 className={`font-semibold ${getTextClass()}`}>
                          {investment.ticker}
                        </h3>
                        <p className={`text-sm ${getSubtextClass()}`}>
                          {getCompanyName(investment.ticker)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${getSubtextClass()}`}>
                        {investment.transactions.length} transaction{investment.transactions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Shares:</span>
                      <span className={getTextClass()}>{investment.shares.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Invested:</span>
                      <span className={getTextClass()}>${investment.totalInvested.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Current Value:</span>
                      <span className={getTextClass()}>${investment.currentValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Gain/Loss:</span>
                      <span className={investment.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                        ${investment.gainLoss.toFixed(2)} ({investment.gainLossPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`${getCardClass()} p-12 rounded-lg text-center`}>
              <div className="flex flex-col items-center space-y-4">
                <TrendingUp className="w-16 h-16 text-gray-400" />
                <div>
                  <h3 className={`text-xl font-semibold ${getTextClass()} mb-2`}>
                    No Investments Found
                  </h3>
                  <p className={`${getSubtextClass()} mb-4`}>
                    No completed investments found. Complete transactions to see investments here.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-8">
          {/* AI Insights Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${getCardClass()} p-6 hover:scale-105 transition-transform duration-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <span className={`text-sm ${getSubtextClass()}`}>AI Mappings</span>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${getTextClass()}`}>
                  {(filteredTransactions || []).filter(t => t.ticker || (t.allocations && t.allocations.length > 0)).length}
                </p>
                <p className={`text-sm ${getSubtextClass()}`}>Successfully mapped</p>
              </div>
            </div>

            <div className={`${getCardClass()} p-6 hover:scale-105 transition-transform duration-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <span className={`text-sm ${getSubtextClass()}`}>Investment Value</span>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${getTextClass()}`}>
                  ${analyticsData.investments.total.toFixed(2)}
                </p>
                <p className={`text-sm ${getSubtextClass()}`}>From round-ups</p>
              </div>
            </div>

            <div className={`${getCardClass()} p-6 hover:scale-105 transition-transform duration-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
                <span className={`text-sm ${getSubtextClass()}`}>Accuracy Rate</span>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${getTextClass()}`}>
                  {(filteredTransactions || []).filter(t => t.ticker || (t.allocations && t.allocations.length > 0)).length > 0 ? '100%' : '0%'}
                </p>
                <p className={`text-sm ${getSubtextClass()}`}>Mapping success</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback if no data */}
      {(!filteredTransactions || filteredTransactions.length === 0) && (
        <div className={`${getCardClass()} rounded-xl p-12 text-center`}>
          <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${getSubtextClass()}`} />
          <h3 className={`text-xl font-semibold ${getTextClass()} mb-2`}>No Analytics Data</h3>
          <p className={`${getSubtextClass()} mb-6`}>
            Unable to load analytics data at this time. This could be because:
          </p>
          <ul className={`${getSubtextClass()} text-sm mb-6 text-left max-w-md mx-auto space-y-1`}>
            <li>• No transaction data available yet</li>
            <li>• Analytics are still being calculated</li>
            <li>• Please try refreshing or check back later</li>
          </ul>
          <button 
            onClick={handleRefresh}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

export default BusinessAnalytics
