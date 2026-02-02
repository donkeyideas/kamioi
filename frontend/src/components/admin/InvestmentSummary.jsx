import React, { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, BarChart3, Filter, Download, Eye, RefreshCw, Calendar, Users, Building2, User, CheckCircle, Target, Info } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import CompanyLogo from '../common/CompanyLogo'

const InvestmentSummary = ({ user, transactions = [] }) => {
  console.log('InvestmentSummary - Component loaded successfully')
  console.log('InvestmentSummary - Received transactions prop:', transactions?.length || 0)
  const { isLightMode, isDarkMode, isCloudMode } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalInvested: 0,
    currentValue: 0,
    totalGainLoss: 0,
    uniqueStocks: 0
  })
  const [investments, setInvestments] = useState([])
  const [filteredInvestments, setFilteredInvestments] = useState([])
  const [selectedDashboard, setSelectedDashboard] = useState('all')
  const [selectedTimeframe, setSelectedTimeframe] = useState('all')
  const [selectedInvestment, setSelectedInvestment] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // System-wide aggregation options
  const dashboardOptions = [
    { value: 'all', label: 'All Users', icon: BarChart3 },
    { value: 'user', label: 'User Only', icon: User },
    { value: 'family', label: 'Family Only', icon: Users },
    { value: 'business', label: 'Business Only', icon: Building2 },
    { value: 'admin', label: 'Admin Only', icon: CheckCircle }
  ]

  // Timeframe options
  const timeframeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '1m', label: 'Last Month' },
    { value: '3m', label: 'Last 3 Months' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '1y', label: 'Last Year' }
  ]

  // Dispatch page load completion event when transactions are available
  useEffect(() => {
    // Dispatch when transactions are loaded or component mounts
    const timer = setTimeout(() => {
      console.log('📊 InvestmentSummary - Dispatching admin-page-load-complete for investments')
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'investments' }
      }))
    }, 100)
    return () => clearTimeout(timer)
  }, [transactions])

  // Process transactions when they change
  useEffect(() => {
    console.log('InvestmentSummary - Processing transactions:', transactions?.length || 0)
    console.log('InvestmentSummary - Transactions data:', transactions)
    
    if (transactions && transactions.length > 0) {
      console.log('InvestmentSummary - Sample transaction:', transactions[0])
      console.log('InvestmentSummary - Sample transaction keys:', Object.keys(transactions[0]))
      console.log('InvestmentSummary - Sample transaction values:', {
        status: transactions[0].status,
        ticker: transactions[0].ticker,
        roundUp: transactions[0].roundUp || transactions[0].round_up,
        round_up: transactions[0].round_up,
        allKeys: Object.keys(transactions[0]),
        fullTransaction: transactions[0]
      })
      calculateStatsAndInvestments(transactions)
    } else {
      console.log('InvestmentSummary - No transactions provided or empty array')
      console.log('InvestmentSummary - This might be because:')
      console.log('InvestmentSummary - 1. User navigated to Investment Summary before Transactions page loaded data')
      console.log('InvestmentSummary - 2. Data flow is broken between AdminTransactions and AdminDashboard')
      console.log('InvestmentSummary - 3. AdminDashboard allTransactions state is empty')
      
      // Reset stats when no transactions
      setStats({
        totalInvested: 0,
        currentValue: 0,
        totalGainLoss: 0,
        uniqueStocks: 0
      })
      setFilteredInvestments([])
    }
  }, [transactions])

  const calculateStatsAndInvestments = (transactions) => {
    if (!transactions || !Array.isArray(transactions)) {
      console.log('InvestmentSummary - No valid transactions provided')
      setStats({
        totalInvested: 0,
        currentValue: 0,
        totalGainLoss: 0,
        uniqueStocks: 0
      })
      setFilteredInvestments([])
      return
    }
    
    console.log('InvestmentSummary - Processing transactions:', transactions.length)
    
    // Debug: Log all transaction statuses and tickers
    console.log('InvestmentSummary - Transaction statuses:', transactions.map(tx => ({ status: tx.status, ticker: tx.ticker, merchant: tx.merchant })))
    
    // Filter for investment transactions - those with tickers that are mapped OR completed
    const investments = transactions.filter(tx => {
      const isInvestment = tx.status === 'mapped' || tx.status === 'completed'
      const hasTicker = tx.ticker && tx.ticker !== 'UNKNOWN' && tx.ticker !== null
      const hasRoundUp = (tx.roundUp > 0) || (tx.round_up > 0)

      console.log(`🔍 InvestmentSummary - Filtering transaction:`, {
        merchant: tx.merchant,
        status: tx.status,
        ticker: tx.ticker,
        roundUp: tx.roundUp,
        round_up: tx.round_up,
        isInvestment,
        hasTicker,
        hasRoundUp,
        passes: isInvestment && hasTicker && hasRoundUp
      })

      return isInvestment && hasTicker && hasRoundUp
    })

    console.log('InvestmentSummary - Investment transactions found:', investments.length)
    console.log('InvestmentSummary - Investment details:', investments.map(inv => ({ ticker: inv.ticker, status: inv.status, roundUp: inv.roundUp || inv.round_up })))

    // Company name mapping for proper display
    const getCompanyName = (ticker) => {
      const companyMap = {
        'SBUX': 'Starbucks',
        'AMZN': 'Amazon',
        'NFLX': 'Netflix',
        'BURL': 'Burlington',
        'DKS': 'Dick\'s Sporting Goods',
        'WMT': 'Walmart',
        'ADBE': 'Adobe',
        'GOOGL': 'Google',
        'CHTR': 'Spectrum',
        'AAPL': 'Apple',
        'COST': 'Costco',
        'TGT': 'Target',
        'BJ': 'BJ\'s Wholesale'
      }
      return companyMap[ticker] || ticker
    }

    // Group by ticker - SYSTEM-WIDE AGGREGATION
    const investmentGroups = {}
    investments.forEach(inv => {
      const key = inv.ticker
      if (!investmentGroups[key]) {
        investmentGroups[key] = {
          ticker: inv.ticker,
          companyName: getCompanyName(inv.ticker), // Use proper company name
          shares: 0,
          totalInvested: 0,
          currentPrice: inv.stockPrice || 0,
          // System-wide aggregation - no single dashboard
          dashboardType: 'system-wide',
          dashboardName: 'All Users',
          transactions: [],
          userCount: new Set(), // Track unique users
          dashboardCount: new Set() // Track unique dashboards
        }
      }
      
      // Aggregate across all users and dashboards
      investmentGroups[key].shares += inv.shares || 0
      investmentGroups[key].totalInvested += inv.roundUp || inv.round_up || 0
      investmentGroups[key].transactions.push(inv)
      
      // Track unique users and dashboards
      if (inv.userId) investmentGroups[key].userCount.add(inv.userId)
      if (inv.dashboard) investmentGroups[key].dashboardCount.add(inv.dashboard)
    })

    // Convert to array and calculate current values
    const investmentArray = Object.values(investmentGroups).map(inv => ({
      ...inv,
      currentValue: inv.shares * inv.currentPrice,
      gainLoss: (inv.shares * inv.currentPrice) - inv.totalInvested,
      gainLossPercent: inv.totalInvested > 0 ? 
        (((inv.shares * inv.currentPrice) - inv.totalInvested) / inv.totalInvested) * 100 : 0
    }))

    console.log('InvestmentSummary - Investment groups created:', investmentArray.length)
    setInvestments(investmentArray)
    setFilteredInvestments(investmentArray)

    // Calculate overall stats
    const totalInvested = investmentArray.reduce((sum, inv) => sum + inv.totalInvested, 0)
    const currentValue = investmentArray.reduce((sum, inv) => sum + inv.currentValue, 0)
    const totalGainLoss = currentValue - totalInvested

    setStats({
      totalInvested,
      currentValue,
      totalGainLoss,
      uniqueStocks: investmentArray.length
    })
  }

  const getDashboardName = (dashboard) => {
    switch (dashboard) {
      case 'user': return 'User Dashboard'
      case 'family': return 'Family Dashboard'
      case 'business': return 'Business Dashboard'
      case 'admin': return 'Admin Dashboard'
      default: return 'Admin Dashboard'
    }
  }

  // Filter investments based on selected options
  useEffect(() => {
    let filtered = [...investments]

    // Filter by dashboard if specific dashboard is selected
    if (selectedDashboard !== 'all') {
      filtered = filtered.filter(inv => {
        // Check if any transaction in this investment group belongs to the selected dashboard
        return inv.transactions.some(tx => tx.dashboard === selectedDashboard)
      })
    }

    // Filter by timeframe
    if (selectedTimeframe !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()
      
      switch (selectedTimeframe) {
        case '1m':
          cutoffDate.setMonth(now.getMonth() - 1)
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
      }
      
      filtered = filtered.filter(inv => 
        inv.transactions.some(tx => new Date(tx.date) >= cutoffDate)
      )
    }

    setFilteredInvestments(filtered)
  }, [selectedDashboard, selectedTimeframe, investments])

  const handleInvestmentClick = (investment) => {
    setSelectedInvestment(investment)
    setShowModal(true)
  }

  const exportData = () => {
    const csvData = filteredInvestments.map(inv => ({
      Ticker: inv.ticker,
      Company: inv.companyName,
      Shares: inv.shares,
      'Total Invested': inv.totalInvested,
      'Current Price': inv.currentPrice,
      'Current Value': inv.currentValue,
      'Gain/Loss': inv.gainLoss,
      'Gain/Loss %': inv.gainLossPercent,
      'Users': inv.userCount.size,
      'Dashboards': inv.dashboardCount.size
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `investment-summary-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getCardClass = () => isLightMode
    ? 'bg-white border border-gray-200'
    : 'bg-white/10 backdrop-blur-md border border-white/20'

  const getTextClass = () => isLightMode ? 'text-gray-900' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-300'

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${getTextClass()} mb-2`}>
              Investment Summary
            </h1>
            <p className={getSubtextClass()}>
              Track all investments across user, family, business, and admin dashboards
            </p>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <div className="text-center">
              <p className={`text-lg ${getTextClass()}`}>Loading investment data...</p>
              <p className={`text-sm ${getSubtextClass()}`}>Fetching data from all dashboards</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${getTextClass()} mb-2`}>
            Investment Summary
          </h1>
          <p className={getSubtextClass()}>
            Track all investments across user, family, business, and admin dashboards
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              if (transactions && transactions.length > 0) {
                calculateStatsAndInvestments(transactions)
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportData}
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
                ${stats.totalInvested.toLocaleString()}
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
                ${stats.currentValue.toLocaleString()}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className={`${getCardClass()} p-6 rounded-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getSubtextClass()} text-sm`}>Total Gain/Loss</p>
              <p className={`text-2xl font-bold ${stats.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${stats.totalGainLoss.toLocaleString()}
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
                {stats.uniqueStocks}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${getCardClass()} p-6 rounded-lg`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className={`w-4 h-4 ${isLightMode ? 'text-gray-500' : 'text-gray-300'}`} />
            <span className={`font-medium ${getTextClass()}`}>Filters:</span>
          </div>
          
          <select
            value={selectedDashboard}
            onChange={(e) => setSelectedDashboard(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              isLightMode 
                ? 'border-gray-300 bg-white text-gray-900' 
                : 'border-white/20 bg-white/10 text-white'
            }`}
          >
            {dashboardOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              isLightMode 
                ? 'border-gray-300 bg-white text-gray-900' 
                : 'border-white/20 bg-white/10 text-white'
            }`}
          >
            {timeframeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Investment Cards */}
      {filteredInvestments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvestments.map((investment, index) => (
          <div
            key={`${investment.ticker}-${index}`}
            onClick={() => handleInvestmentClick(investment)}
            className={`${getCardClass()} p-6 rounded-lg cursor-pointer hover:scale-105 transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <CompanyLogo 
                  symbol={investment.ticker} 
                  name={investment.companyName}
                  size="w-8 h-8"
                />
                <div>
                  <h3 className={`font-semibold ${getTextClass()}`}>
                    {investment.ticker}
                  </h3>
                  <p className={`text-sm ${getSubtextClass()}`}>
                    {investment.companyName}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm ${getSubtextClass()}`}>
                  {investment.userCount.size} users • {investment.dashboardCount.size} dashboards
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
                {selectedDashboard === 'all' 
                  ? 'No investment data available across all users'
                  : `No investment data available for ${dashboardOptions.find(d => d.value === selectedDashboard)?.label}`
                }
              </p>
              <div className="text-sm text-gray-500">
                <p>• Make sure transactions are mapped to stock tickers</p>
                <p>• Check that the backend server is running</p>
                <p>• Try refreshing the data</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investment Detail Modal */}
      {showModal && selectedInvestment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${getCardClass()} rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${getTextClass()}`}>
                {selectedInvestment.ticker} - {selectedInvestment.companyName}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className={`font-semibold ${getTextClass()} mb-2`}>Investment Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Total Shares:</span>
                      <span className={getTextClass()}>{selectedInvestment.shares.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Total Invested:</span>
                      <span className={getTextClass()}>${selectedInvestment.totalInvested.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Current Price:</span>
                      <span className={getTextClass()}>${selectedInvestment.currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Current Value:</span>
                      <span className={getTextClass()}>${selectedInvestment.currentValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Gain/Loss:</span>
                      <span className={selectedInvestment.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                        ${selectedInvestment.gainLoss.toFixed(2)} ({selectedInvestment.gainLossPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={`font-semibold ${getTextClass()} mb-2`}>Dashboard Info</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Users:</span>
                      <span className={getTextClass()}>{selectedInvestment.userCount.size} users</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Dashboards:</span>
                      <span className={getTextClass()}>{selectedInvestment.dashboardCount.size} dashboards</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={getSubtextClass()}>Transactions:</span>
                      <span className={getTextClass()}>{selectedInvestment.transactions.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`font-semibold ${getTextClass()} mb-2`}>Related Transactions</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedInvestment.transactions.map((tx, index) => (
                    <div key={index} className={`${isLightMode ? 'bg-gray-50' : 'bg-white/5'} p-3 rounded-lg`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`text-sm ${getTextClass()}`}>{tx.merchant}</p>
                          <p className={`text-xs ${getSubtextClass()}`}>{tx.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm ${getTextClass()}`}>${(tx.roundUp || tx.round_up || 0).toFixed(2)}</p>
                          <p className={`text-xs ${getSubtextClass()}`}>{tx.shares} shares</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvestmentSummary
