import React, { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Play, Pause, RotateCcw, BarChart3, Users, DollarSign, Activity, Zap, Database, Server, Eye, Settings, X, Filter, User, Send } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import CompanyLogo from '../common/CompanyLogo'

// Helper function to build API URLs (avoids localhost issues in production)
const buildApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
  return `${baseUrl}${path}`
}

const InvestmentProcessingDashboard = ({ user, transactions = [], onRefresh }) => {
  const { isLightMode, isDarkMode, isCloudMode } = useTheme()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [systemStatus, setSystemStatus] = useState({
    isRunning: false,
    totalTransactions: 0,
    processedToday: 0,
    successRate: 0,
    averageProcessingTime: 0
  })
  const [stagedTransactions, setStagedTransactions] = useState([])
  const [processingTransactions, setProcessingTransactions] = useState([])
  const [completedTransactions, setCompletedTransactions] = useState([])
  const [failedTransactions, setFailedTransactions] = useState([])
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [isExecutingTrades, setIsExecutingTrades] = useState(false)
  const [executionResults, setExecutionResults] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Dispatch page load completion event
  useEffect(() => {
    // Small delay to ensure AdminDashboard listener is ready
    const timer = setTimeout(() => {
      console.log('📊 InvestmentProcessing - Dispatching admin-page-load-complete for investment-processing')
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'investment-processing' }
      }))
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Process real transaction data
  useEffect(() => {
    const processTransactions = () => {
      setLoading(true)
      
      console.log('InvestmentProcessingDashboard - Processing transactions:', transactions.length)
      
      // Filter transactions by status - ONLY include transactions with valid tickers
      // Investment Processing is for executing trades, not for mapping
      const hasValidTicker = (t) => t.ticker && t.ticker !== '' && t.ticker !== 'UNKNOWN' && t.ticker !== 'Unknown'

      const staged = transactions.filter(t => t.status === 'mapped' && hasValidTicker(t) && !t.processed)
      const processing = transactions.filter(t => t.status === 'processing' && hasValidTicker(t))
      const completed = transactions.filter(t => t.status === 'completed')
      const failed = transactions.filter(t => t.status === 'failed')
      
      // Update system status based on real data
      const totalTransactions = transactions.length
      const processedToday = completed.length
      const successRate = totalTransactions > 0 ? (completed.length / totalTransactions) * 100 : 0
      
      setSystemStatus({
        isRunning: true,
        totalTransactions,
        processedToday,
        successRate: Math.round(successRate * 10) / 10,
        averageProcessingTime: 2.3 // This would come from real processing metrics
      })
      
      // Process staged transactions (mapped but not processed)
      setStagedTransactions(staged.map(t => {
        const roundUpAmount = parseFloat(t.roundUp || t.round_up || 0)
        const estimatedShares = roundUpAmount > 0 ? (roundUpAmount / 100) : 0 // Rough estimate: $1 = 0.01 shares
        
        return {
          id: t.id,
          transactionId: t.transactionId || `TXN-${t.id}`,
          userId: t.userId || t.user_id || 'N/A',
          ticker: t.ticker,
          status: 'staged',
          roundUpAmount: roundUpAmount,
          estimatedShares: estimatedShares,
          timestamp: t.createdAt || t.created_at || new Date().toISOString()
        }
      }))
      
      // Process processing transactions
      setProcessingTransactions(processing.map(t => {
        const roundUpAmount = parseFloat(t.roundUp || t.round_up || 0)
        const estimatedShares = roundUpAmount > 0 ? (roundUpAmount / 100) : 0
        
        return {
          id: t.id,
          transactionId: t.transactionId || `TXN-${t.id}`,
          userId: t.userId || t.user_id || 'N/A',
          ticker: t.ticker,
          status: 'processing',
          roundUpAmount: roundUpAmount,
          estimatedShares: estimatedShares,
          timestamp: t.createdAt || t.created_at || new Date().toISOString()
        }
      }))
      
      // Process completed transactions
      setCompletedTransactions(completed.map(t => ({
        id: t.id,
        transactionId: t.transactionId || `TXN-${t.id}`,
        userId: t.userId || t.user_id || t.id,
        ticker: t.ticker,
        status: 'completed',
        roundUpAmount: parseFloat(t.roundUp || t.round_up || 0),
        actualShares: parseFloat(t.shares || t.shares_purchased || 0),
        actualPrice: parseFloat(t.price || t.price_per_share || 0),
        timestamp: t.createdAt || t.created_at || new Date().toISOString()
      })))
      
      // Process failed transactions
      setFailedTransactions(failed.map(t => ({
        id: t.id,
        transactionId: t.transactionId || `TXN-${t.id}`,
        userId: t.userId || t.user_id || t.id,
        ticker: t.ticker,
        status: 'failed',
        roundUpAmount: parseFloat(t.roundUp || t.round_up || 0),
        timestamp: t.createdAt || t.created_at || new Date().toISOString(),
        error: t.error || t.error_message || 'Unknown error'
      })))
      
      // Generate portfolio data from completed transactions
      const portfolioMap = new Map()
      completed.forEach(t => {
        const userId = t.userId || t.user_id || t.id
        if (!portfolioMap.has(userId)) {
          portfolioMap.set(userId, {
            userId,
            totalValue: 0,
            totalGain: 0,
            gainPercent: 0,
            stocks: new Set()
          })
        }
        const portfolio = portfolioMap.get(userId)
        portfolio.totalValue += parseFloat(t.roundUp || t.round_up || 0)
        portfolio.stocks.add(t.ticker)
      })
      
      const portfolios = Array.from(portfolioMap.values()).map(p => ({
        ...p,
        stocks: p.stocks.size,
        gainPercent: p.totalGain > 0 ? (p.totalGain / p.totalValue) * 100 : 0
      }))
      
      setPortfolios(portfolios)
      setLoading(false)
    }
    
        processTransactions()
      }, [transactions])

  // Reset pagination when switching tabs
  useEffect(() => {
    resetPagination()
  }, [activeTab])

  const handleStartProcessing = () => {
    setSystemStatus(prev => ({ ...prev, isRunning: true }))
  }

  const handleStopProcessing = () => {
    setSystemStatus(prev => ({ ...prev, isRunning: false }))
  }

  const handleRetryTransaction = (transactionId) => {
    console.log('Retrying transaction:', transactionId)
    // Implement retry logic
  }

  // Execute all mapped transactions via Alpaca
  const handleExecuteAllTrades = async () => {
    setIsExecutingTrades(true)
    setExecutionResults(null)

    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')

      const response = await fetch(buildApiUrl('/api/admin/investments/process-mapped'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success !== false) {
        setExecutionResults({
          success: true,
          processed: data.processed || 0,
          succeeded: data.succeeded || 0,
          failed: data.failed || 0,
          details: data.details || []
        })

        // Trigger refresh of transaction data
        if (onRefresh) {
          onRefresh()
        }

        // Also dispatch event to refresh admin dashboard
        window.dispatchEvent(new CustomEvent('refresh-admin-data'))
      } else {
        setExecutionResults({
          success: false,
          error: data.error || 'Failed to execute trades'
        })
      }
    } catch (error) {
      console.error('Error executing trades:', error)
      setExecutionResults({
        success: false,
        error: error.message || 'Network error while executing trades'
      })
    } finally {
      setIsExecutingTrades(false)
    }
  }

  // Execute a single transaction
  const handleExecuteSingleTrade = async (transaction) => {
    setIsExecutingTrades(true)

    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')

      const response = await fetch(buildApiUrl('/api/admin/investments/process-single'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction_id: transaction.id
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Trigger refresh
        if (onRefresh) {
          onRefresh()
        }
        window.dispatchEvent(new CustomEvent('refresh-admin-data'))

        setExecutionResults({
          success: true,
          message: `Successfully executed trade for ${transaction.ticker}`
        })
      } else {
        setExecutionResults({
          success: false,
          error: data.error || 'Failed to execute trade'
        })
      }
    } catch (error) {
      console.error('Error executing single trade:', error)
      setExecutionResults({
        success: false,
        error: error.message || 'Network error'
      })
    } finally {
      setIsExecutingTrades(false)
    }
  }

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionModal(true)
  }

  const closeTransactionModal = () => {
    setShowTransactionModal(false)
    setSelectedTransaction(null)
  }


  const getTextClass = () => isLightMode ? 'text-gray-900' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-300'
  const getCardClass = () => isLightMode 
    ? 'bg-white border border-gray-200' 
    : 'bg-white/10 backdrop-blur-md border border-white/20'

  // Pagination helper functions
  const getCurrentTransactions = (transactions) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return transactions.slice(startIndex, endIndex)
  }

  const getTotalPages = (transactions) => {
    return Math.ceil(transactions.length / itemsPerPage)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const resetPagination = () => {
    setCurrentPage(1)
  }

  // Pagination component
  const renderPagination = (transactions) => {
    const totalPages = getTotalPages(transactions)
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-6">
        <div className={`text-sm ${getSubtextClass()}`}>
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} transactions
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === 1
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded text-sm ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === totalPages
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'staged', label: 'Mapped', icon: Clock },
    { id: 'processing', label: 'Processing', icon: Activity },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'failed', label: 'Failed', icon: XCircle }
  ]

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${getCardClass()} rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${getSubtextClass()}`}>System Status</p>
              <p className={`text-2xl font-bold ${getTextClass()}`}>
                {systemStatus.isRunning ? 'Running' : 'Stopped'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${systemStatus.isRunning ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {systemStatus.isRunning ? <Play className="w-6 h-6 text-green-400" /> : <Pause className="w-6 h-6 text-red-400" />}
            </div>
          </div>
        </div>

        <div className={`${getCardClass()} rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${getSubtextClass()}`}>Total Transactions</p>
              <p className={`text-2xl font-bold ${getTextClass()}`}>{systemStatus.totalTransactions}</p>
            </div>
            <Database className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className={`${getCardClass()} rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${getSubtextClass()}`}>Processed Today</p>
              <p className={`text-2xl font-bold ${getTextClass()}`}>{systemStatus.processedToday}</p>
            </div>
            <Activity className="w-6 h-6 text-green-400" />
          </div>
        </div>

        <div className={`${getCardClass()} rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${getSubtextClass()}`}>Success Rate</p>
              <p className={`text-2xl font-bold ${getTextClass()}`}>{systemStatus.successRate}%</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className={`${getCardClass()} rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>System Controls</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleStartProcessing}
            disabled={systemStatus.isRunning}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Start Processing</span>
          </button>
          <button
            onClick={handleStopProcessing}
            disabled={!systemStatus.isRunning}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Pause className="w-4 h-4" />
            <span>Stop Processing</span>
          </button>
          <button
            onClick={handleExecuteAllTrades}
            disabled={isExecutingTrades || stagedTransactions.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isExecutingTrades ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Execute All Trades ({stagedTransactions.length})</span>
              </>
            )}
          </button>
        </div>

        {/* Execution Results */}
        {executionResults && (
          <div className={`mt-4 p-4 rounded-lg ${
            executionResults.success
              ? 'bg-green-500/20 border border-green-500/30'
              : 'bg-red-500/20 border border-red-500/30'
          }`}>
            {executionResults.success ? (
              <div>
                <p className="text-green-400 font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Trade Execution Complete
                </p>
                <div className="mt-2 text-sm text-gray-300">
                  <p>Processed: {executionResults.processed}</p>
                  <p>Succeeded: {executionResults.succeeded}</p>
                  <p>Failed: {executionResults.failed}</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-400 font-medium flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Trade Execution Failed
                </p>
                <p className="mt-2 text-sm text-gray-300">{executionResults.error}</p>
              </div>
            )}
            <button
              onClick={() => setExecutionResults(null)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-300"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderStaged = () => {
    const currentTransactions = getCurrentTransactions(stagedTransactions)
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className={`text-lg font-semibold ${getTextClass()}`}>Staged Transactions</h3>
          <span className={`text-sm ${getSubtextClass()}`}>{stagedTransactions.length} transactions</span>
        </div>
        <div className="space-y-3">
          {currentTransactions.map(transaction => (
          <div key={transaction.id} className={`${getCardClass()} rounded-lg p-4`}>
            <div className="flex justify-between items-center">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CompanyLogo 
                    symbol={transaction.ticker} 
                    name={transaction.ticker}
                    size="w-12 h-12" 
                    clickable={false} 
                  />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${getTextClass()}`}>User ID: {transaction.userId || 'N/A'}</p>
                  <p className={`text-sm ${getSubtextClass()}`}>${transaction.roundUpAmount} → {transaction.ticker}</p>
                  <p className={`text-xs ${getSubtextClass()}`}>Est. Shares: {transaction.estimatedShares.toFixed(4)}</p>
                  <p className={`text-xs ${getSubtextClass()}`}>ID: {transaction.transactionId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className={`text-sm ${getSubtextClass()}`}>Mapped</span>
                <button
                  onClick={() => handleExecuteSingleTrade(transaction)}
                  disabled={isExecutingTrades}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Execute</span>
                </button>
                <button
                  onClick={() => handleViewTransaction(transaction)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>View</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
        {renderPagination(stagedTransactions)}
      </div>
    )
  }

  const renderProcessing = () => {
    const currentTransactions = getCurrentTransactions(processingTransactions)
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className={`text-lg font-semibold ${getTextClass()}`}>Processing Transactions</h3>
          <span className={`text-sm ${getSubtextClass()}`}>{processingTransactions.length} transactions</span>
        </div>
        <div className="space-y-3">
          {currentTransactions.map(transaction => (
          <div key={transaction.id} className={`${getCardClass()} rounded-lg p-4`}>
            <div className="flex justify-between items-center">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CompanyLogo 
                    symbol={transaction.ticker} 
                    name={transaction.ticker}
                    size="w-12 h-12" 
                    clickable={false} 
                  />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${getTextClass()}`}>User ID: {transaction.userId || 'N/A'}</p>
                  <p className={`text-sm ${getSubtextClass()}`}>${transaction.roundUpAmount} → {transaction.ticker}</p>
                  <p className={`text-xs ${getSubtextClass()}`}>Est. Shares: {transaction.estimatedShares.toFixed(4)}</p>
                  <p className={`text-xs ${getSubtextClass()}`}>ID: {transaction.transactionId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className={`text-sm ${getSubtextClass()}`}>Processing...</span>
                <button
                  onClick={() => handleViewTransaction(transaction)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>View</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
        {renderPagination(processingTransactions)}
      </div>
    )
  }

  const renderCompleted = () => {
    const currentTransactions = getCurrentTransactions(completedTransactions)
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className={`text-lg font-semibold ${getTextClass()}`}>Completed Transactions</h3>
          <span className={`text-sm ${getSubtextClass()}`}>{completedTransactions.length} transactions</span>
        </div>
        <div className="space-y-3">
          {currentTransactions.map(transaction => (
          <div key={transaction.id} className={`${getCardClass()} rounded-lg p-4`}>
            <div className="flex justify-between items-center">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CompanyLogo 
                    symbol={transaction.ticker} 
                    name={transaction.ticker}
                    size="w-12 h-12" 
                    clickable={false} 
                  />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${getTextClass()}`}>User ID: {transaction.userId || 'N/A'}</p>
                  <p className={`text-sm ${getSubtextClass()}`}>
                    ${transaction.roundUpAmount} → {transaction.ticker} ({transaction.actualShares.toFixed(4)} shares @ ${transaction.actualPrice.toFixed(2)})
                  </p>
                  <p className={`text-xs ${getSubtextClass()}`}>ID: {transaction.transactionId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className={`text-sm text-green-400`}>Completed</span>
                <button
                  onClick={() => handleViewTransaction(transaction)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>View</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
        {renderPagination(completedTransactions)}
      </div>
    )
  }

  const renderFailed = () => {
    const currentTransactions = getCurrentTransactions(failedTransactions)
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className={`text-lg font-semibold ${getTextClass()}`}>Failed Transactions</h3>
          <span className={`text-sm ${getSubtextClass()}`}>{failedTransactions.length} transactions</span>
        </div>
        <div className="space-y-3">
          {currentTransactions.map(transaction => (
          <div key={transaction.id} className={`${getCardClass()} rounded-lg p-4`}>
            <div className="flex justify-between items-center">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CompanyLogo 
                    symbol={transaction.ticker} 
                    name={transaction.ticker}
                    size="w-12 h-12" 
                    clickable={false} 
                  />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${getTextClass()}`}>User ID: {transaction.userId || 'N/A'}</p>
                  <p className={`text-sm ${getSubtextClass()}`}>${transaction.roundUpAmount} → {transaction.ticker}</p>
                  <p className={`text-sm text-red-400`}>Error: {transaction.error}</p>
                  <p className={`text-xs ${getSubtextClass()}`}>ID: {transaction.transactionId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <button
                  onClick={() => handleRetryTransaction(transaction.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
                <button
                  onClick={() => handleViewTransaction(transaction)}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center space-x-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>View</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
        {renderPagination(failedTransactions)}
      </div>
    )
  }

  const renderPortfolio = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${getTextClass()}`}>User Portfolios</h3>
        <span className={`text-sm ${getSubtextClass()}`}>{portfolios.length} portfolios</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios.map((portfolio, index) => (
          <div key={index} className={`${getCardClass()} rounded-lg p-4`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className={`font-medium ${getTextClass()}`}>{portfolio.user}</p>
                <p className={`text-sm ${getSubtextClass()}`}>{portfolio.stocks} stocks</p>
              </div>
              <div className={`text-right ${portfolio.gainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <p className="font-semibold">${portfolio.totalValue.toFixed(2)}</p>
                <p className="text-sm">{portfolio.gainPercent >= 0 ? '+' : ''}{portfolio.gainPercent.toFixed(1)}%</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={getSubtextClass()}>Total Gain/Loss:</span>
                <span className={portfolio.totalGain >= 0 ? 'text-green-400' : 'text-red-400'}>
                  ${portfolio.totalGain >= 0 ? '+' : ''}{portfolio.totalGain.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard()
      case 'staged':
        return renderStaged()
      case 'processing':
        return renderProcessing()
      case 'completed':
        return renderCompleted()
      case 'failed':
        return renderFailed()
      default:
        return renderDashboard()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className={`${getSubtextClass()}`}>Loading investment processing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${getTextClass()}`}>Investment Processing</h1>
          <p className={`${getSubtextClass()}`}>Manage and monitor investment transactions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>

      {/* Transaction Detail Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${getCardClass()} rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold ${getTextClass()}`}>Transaction Details</h3>
              <button
                onClick={closeTransactionModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Transaction ID */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className={`font-medium ${getTextClass()}`}>Transaction ID:</span>
                <span className={`${getSubtextClass()}`}>{selectedTransaction.transactionId}</span>
              </div>

              {/* User ID */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className={`font-medium ${getTextClass()}`}>User ID:</span>
                <span className={`${getSubtextClass()}`}>{selectedTransaction.userId}</span>
              </div>

              {/* Stock Ticker */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className={`font-medium ${getTextClass()}`}>Stock Ticker:</span>
                <span className={`${getSubtextClass()}`}>{selectedTransaction.ticker}</span>
              </div>

              {/* Round Up Amount (Investment Amount) */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className={`font-medium ${getTextClass()}`}>Investment Amount:</span>
                <span className={`text-green-400 font-semibold`}>${selectedTransaction.roundUpAmount || '0.00'}</span>
              </div>

              {/* Estimated Shares (for staged/processing) */}
              {selectedTransaction.estimatedShares && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className={`font-medium ${getTextClass()}`}>Estimated Shares:</span>
                  <span className={`${getSubtextClass()}`}>{selectedTransaction.estimatedShares.toFixed(4)}</span>
                </div>
              )}

              {/* Actual Shares (for completed) */}
              {selectedTransaction.actualShares && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className={`font-medium ${getTextClass()}`}>Actual Shares Purchased:</span>
                  <span className={`text-green-400 font-semibold`}>{selectedTransaction.actualShares.toFixed(4)}</span>
                </div>
              )}

              {/* Actual Price (for completed) */}
              {selectedTransaction.actualPrice && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className={`font-medium ${getTextClass()}`}>Actual Price per Share:</span>
                  <span className={`${getSubtextClass()}`}>${selectedTransaction.actualPrice.toFixed(2)}</span>
                </div>
              )}

              {/* Status */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className={`font-medium ${getTextClass()}`}>Status:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  selectedTransaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedTransaction.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  selectedTransaction.status === 'staged' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                </span>
              </div>

              {/* Timestamp */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className={`font-medium ${getTextClass()}`}>Timestamp:</span>
                <span className={`${getSubtextClass()}`}>
                  {selectedTransaction.timestamp ? new Date(selectedTransaction.timestamp).toLocaleString() : 'N/A'}
                </span>
              </div>

              {/* Error Message (if failed) */}
              {selectedTransaction.error && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className={`font-medium ${getTextClass()}`}>Error:</span>
                  <span className={`text-red-400`}>{selectedTransaction.error}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeTransactionModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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

export default InvestmentProcessingDashboard
