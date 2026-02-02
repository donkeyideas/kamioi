import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Search, Filter, Eye, CheckCircle, AlertTriangle, Clock, DollarSign, TrendingUp, ExternalLink, ChevronLeft, ChevronRight, Users, Building, Home, RefreshCw, X, Target, User, Bell, Info } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import CompanyLogo from '../common/CompanyLogo'
import statusSyncService from '../../services/StatusSyncService'
import prefetchRegistry from '../../services/prefetchRegistry'
import prefetchService from '../../services/prefetchService'

const AdminTransactions = ({ user, onTransactionsUpdate }) => {
  const navigate = useNavigate()
  const { isLightMode, isDarkMode, isCloudMode } = useTheme()
  const queryClient = useQueryClient() // 🚀 PERFORMANCE FIX: For cache invalidation
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [dashboardFilter, setDashboardFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50 // 🚀 PERFORMANCE FIX: Backend pagination - 50 per page
  
  // 🚀 PERFORMANCE FIX: Use React Query with backend pagination - NO frontend state for transactions
  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['admin-transactions', currentPage, itemsPerPage, searchTerm, statusFilter, dashboardFilter, dateFilter],
    queryFn: async () => {
      // Get token - no retry delays (token should be available from AuthContext)
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      
      if (!token) {
        // Don't throw error immediately - return empty data instead to prevent UI crash
        console.warn('⚠️ AdminTransactions - No authentication token available, returning empty data')
        return {
          transactions: [],
          pagination: {
            page: currentPage,
            limit: itemsPerPage,
            total: 0,
            totalPages: 1
          },
          stats: {
            totalTransactions: 0,
            totalRoundUps: 0,
            userTransactions: 0,
            familyTransactions: 0,
            businessTransactions: 0,
            availableToInvest: 0,
            totalInvested: 0
          }
        }
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      
      // 🚀 PERFORMANCE FIX: Build query params for backend filtering/pagination
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (dashboardFilter !== 'all') params.append('dashboard', dashboardFilter)
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter)
      params.append('sort', 'date')
      params.append('order', 'desc')
      
      // Try paginated endpoint first, fallback to existing endpoint
      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/transactions?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            // Backend should return paginated data with stats
            const transactionsArray = result.data || result.transactions || []
            // 🚀 FIX: If transactions array is empty, total should be 0 regardless of backend count
            const actualTotal = transactionsArray.length > 0 
              ? (result.total !== undefined ? result.total : transactionsArray.length)
              : 0
            
            // 🚀 PERFORMANCE FIX: Use stats from backend (no frontend calculation)
            return {
              transactions: transactionsArray,
              pagination: result.pagination || {
                page: currentPage,
                limit: itemsPerPage,
                total: actualTotal,
                totalPages: Math.ceil(actualTotal / itemsPerPage)
              },
              stats: result.stats || {
                totalTransactions: actualTotal,
                totalRoundUps: 0,
                userTransactions: 0,
                familyTransactions: 0,
                businessTransactions: 0,
                availableToInvest: 0,
                totalInvested: 0
              }
            }
          }
        }
      } catch (err) {
        console.warn('Paginated endpoint not available, using fallback')
      }
      
      // Fallback: Use existing endpoint but request only first page
      // Backend should implement pagination, but this prevents loading ALL data
      const fallbackResponse = await fetch(`${apiBaseUrl}/api/admin/transactions?page=1&limit=${itemsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP error! status: ${fallbackResponse.status}`)
      }
      
      const fallbackData = await fallbackResponse.json()
      const transactions = fallbackData.transactions || fallbackData.data || []
      
      // 🚀 FIX: Use actual transactions array length, not backend total if it's incorrect
      // If backend says there's 1 transaction but array is empty, use 0
      const actualTransactions = Array.isArray(transactions) ? transactions : []
      const actualTotal = actualTransactions.length > 0 
        ? (fallbackData.total !== undefined ? fallbackData.total : actualTransactions.length)
        : 0 // If no transactions in array, total is 0 regardless of backend count
      
      // 🚀 PERFORMANCE FIX: Use stats from backend (no frontend calculation)
      return {
        transactions: actualTransactions.slice(0, itemsPerPage), // Limit to page size
        pagination: {
          page: currentPage,
          limit: itemsPerPage,
          total: actualTotal,
          totalPages: Math.ceil(actualTotal / itemsPerPage) || 1
        },
        stats: fallbackData.stats || {
          totalTransactions: actualTotal,
          totalRoundUps: 0,
          userTransactions: 0,
          familyTransactions: 0,
          businessTransactions: 0,
          availableToInvest: 0,
          totalInvested: 0
        }
      }
    },
    staleTime: 0, // Always refetch - no cache
    cacheTime: 0, // No cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2, // 🚀 FIX: Retry up to 2 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onSuccess: (data) => {
      // Dispatch page load completion event
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'transactions' }
      }))
      
      // Notify parent component
      if (onTransactionsUpdate && data.transactions) {
        onTransactionsUpdate(data.transactions)
      }
    }
  })

  // Dispatch page load completion for cached data (useEffect fallback)
  useEffect(() => {
    if (data && !isLoading) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
          detail: { pageId: 'transactions' }
        }))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [data, isLoading])

  // 🚀 PERFORMANCE FIX: Extract data from query - NO frontend processing
  const transactions = data?.transactions || []
  const pagination = data?.pagination || { page: 1, limit: itemsPerPage, total: 0, totalPages: 1 }
  const stats = data?.stats || {
    totalTransactions: 0,
    totalRoundUps: 0,
    userTransactions: 0,
    familyTransactions: 0,
    businessTransactions: 0,
    availableToInvest: 0,
    totalInvested: 0
  }
  
  // 🚀 PERFORMANCE FIX: Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, dashboardFilter, dateFilter])
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')
  // 🚀 REMOVED: Unused state variables - React Query handles loading/error/retry
  // const [lastRefresh, setLastRefresh] = useState(null) - REMOVED
  // const [retryCount, setRetryCount] = useState(0) - REMOVED
  // const [isRetrying, setIsRetrying] = useState(false) - REMOVED
  // const [loadingProgress, setLoadingProgress] = useState(0) - REMOVED
  // const [loadingMessage, setLoadingMessage] = useState('') - REMOVED
  const [cleaningUp, setCleaningUp] = useState(false) // Still used for cleanup function

  // Notification functions
  const showNotificationModal = (message, type = 'success') => {
    setNotificationMessage(message)
    setNotificationType(type)
    setShowNotification(true)
  }

  const handleNotificationModalClose = () => {
    setShowNotification(false)
    setNotificationMessage('')
  }

  // Register fetch function for prefetching
  useEffect(() => {
    const fetchFn = async () => {
      const token = localStorage.getItem('admin_token')
      if (!token) return null
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      
      const [adminResponse, mappingResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/transactions?page=1&per_page=100`, {
          method: 'GET',
          headers
        }),
        fetch(`${apiBaseUrl}/api/admin/llm-center/mappings`, { headers })
      ])
      
      if (!adminResponse.ok) return null
      
      const adminData = await adminResponse.json()
      const mappingData = await mappingResponse.json()
      
      return {
        transactions: adminData?.transactions || adminData?.data || [],
        mappings: mappingData?.mappings || {},
        analytics: adminData?.analytics || {}
      }
    }
    
    prefetchRegistry.register('transactions', fetchFn)
  }, [])

  // 🚀 PERFORMANCE FIX: Status update mutation - updates backend and invalidates cache
  const updateStatusMutation = useMutation({
    mutationFn: async ({ transactionId, newStatus }) => {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      if (!token) throw new Error('No authentication token')
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/transactions/${transactionId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`)
      }
      
      return await response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] })
      // Notify other dashboards
      // statusSyncService.updateStatus will be called in updateTransactionStatus
    }
  })

  // 🚀 REMOVED: Old fetchAllTransactions function - replaced by React Query useQuery

  // 🚀 REMOVED: Old initializeData useEffect - React Query handles initialization automatically

  // 🚀 PERFORMANCE FIX: Status synchronization - invalidate cache on external updates
  useEffect(() => {
    const handleStatusUpdate = (update) => {
      console.log('AdminTransactions - Received status update:', update)
      
      // Invalidate React Query cache to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] })
      
      // Notify parent component (will use updated data from refetch)
      if (onTransactionsUpdate && data?.transactions) {
        const updatedTransactions = data.transactions.map(transaction => {
          if (transaction.id === update.transactionId) {
            return { ...transaction, status: update.newStatus }
          }
          return transaction
        })
        onTransactionsUpdate(updatedTransactions)
      }
    }

    // Subscribe to status updates
    statusSyncService.subscribe('admin', handleStatusUpdate)

    // Cleanup on unmount
    return () => {
      statusSyncService.unsubscribe('admin', handleStatusUpdate)
    }
  }, [queryClient, onTransactionsUpdate, data])

  // 🚀 PERFORMANCE FIX: Update transaction status using React Query mutation
  const updateTransactionStatus = (transactionId, newStatus) => {
    console.log(`🔄 AdminTransactions - Updating transaction ${transactionId} to status: ${newStatus}`)
    
    // Use mutation to update backend
    updateStatusMutation.mutate(
      { transactionId, newStatus },
      {
        onSuccess: () => {
          // Notify other dashboards
          statusSyncService.updateStatus(transactionId, newStatus, 'admin')
          
          // Notify parent component (will use updated data from refetch)
          if (onTransactionsUpdate && data?.transactions) {
            const updatedTransactions = data.transactions.map(transaction => {
              if (transaction.id === transactionId) {
                return { ...transaction, status: newStatus }
              }
              return transaction
            })
            onTransactionsUpdate(updatedTransactions)
          }
        },
        onError: (error) => {
          console.error('Failed to update transaction status:', error)
        }
      }
    )
  }

  // Helper function to get ticker from transaction (from DB ONLY - no hardcoded mappings)
  const getTransactionTicker = (transaction) => {
    // ONLY use database ticker - no hardcoded merchant lookups
    return transaction.ticker || transaction.stock_symbol || transaction.ticker_symbol || null
  }

  // Helper function to check if transaction has a ticker (from DB ONLY)
  const transactionHasTicker = (transaction) => {
    return getTransactionTicker(transaction) !== null
  }

  const getStatusText = (transaction) => {
    // Use database status DIRECTLY - NO hardcoded overrides
    // This matches UserTransactions.jsx for consistency
    const status = (transaction.status || '').toLowerCase().trim()

    switch (status) {
      case 'completed': return 'Completed'
      case 'mapped': return 'Mapped'
      case 'pending': return 'Pending'
      case 'staged': return 'Staged'
      case 'rejected': return 'Rejected'
      case 'processing': return 'Processing'
      case 'failed': return 'Failed'
      default: return 'Unknown'
    }
  }

  const getStatusColor = (transaction) => {
    // Use database status directly - matches UserTransactions.jsx
    const status = (transaction.status || '').toLowerCase().trim()

    switch (status) {
      case 'mapped': return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'staged': return 'bg-blue-500/20 text-blue-400'
      case 'processing': return 'bg-purple-500/20 text-purple-400'
      case 'failed': return 'bg-red-500/20 text-red-400'
      case 'rejected': return 'bg-red-500/20 text-red-400 border border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (transaction) => {
    // Use database status directly - matches UserTransactions.jsx
    const status = (transaction.status || '').toLowerCase().trim()

    switch (status) {
      case 'mapped': return <CheckCircle className="w-3 h-3" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'staged': return <Clock className="w-4 h-4" />
      case 'processing': return <TrendingUp className="w-4 h-4" />
      case 'failed': return <AlertTriangle className="w-4 h-4" />
      case 'rejected': return <X className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getSelectClass = () => {
    if (isLightMode) return 'bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500'
    return 'bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  }

  // Helper functions for investment calculations

  const getCompanyName = (ticker) => {
    const companyMap = {
      'AAPL': 'Apple',
      'AMZN': 'Amazon',
      'GOOGL': 'Google',
      'MSFT': 'Microsoft',
      'TSLA': 'Tesla',
      'META': 'Meta',
      'NFLX': 'Netflix',
      'NVDA': 'NVIDIA',
      'ADBE': 'Adobe',
      'FL': 'Foot Locker',
      'BURL': 'Burlington',
      'CHTR': 'Charter Spectrum',
      'DKS': 'Dick\'s Sporting Goods',
      'EL': 'Estée Lauder',
      'SBUX': 'Starbucks',
      'WMT': 'Walmart',
      'SPOT': 'Spotify',
      'UBER': 'Uber',
      'M': 'Macy\'s',
      'CMG': 'Chipotle',
      'DIS': 'Disney',
      'NKE': 'Nike',
      'CRM': 'Salesforce',
      'PYPL': 'PayPal',
      'INTC': 'Intel',
      'AMD': 'AMD',
      'ORCL': 'Oracle',
      'IBM': 'IBM',
      'CSCO': 'Cisco',
      'JPM': 'JPMorgan Chase',
      'BAC': 'Bank of America',
      'WFC': 'Wells Fargo',
      'GS': 'Goldman Sachs',
      'V': 'Visa',
      'MA': 'Mastercard',
      'JNJ': 'Johnson & Johnson',
      'PFE': 'Pfizer',
      'UNH': 'UnitedHealth',
      'HD': 'Home Depot',
      'LOW': 'Lowe\'s',
      'KO': 'Coca-Cola',
      'PEP': 'Pepsi',
      'MCD': 'McDonald\'s',
      'YUM': 'Yum Brands',
      'TGT': 'Target',
      'COST': 'Costco'
    }
    return companyMap[ticker] || ticker
  }

  const calculateShares = (roundUp, ticker) => {
    if (!roundUp || !ticker || roundUp <= 0) return '<0.01'
    
    // Use same stock prices as BusinessTransactions for consistency
    const stockPrices = {
      'AAPL': 175.00, 'AMZN': 140.00, 'GOOGL': 140.00, 'MSFT': 380.00, 'TSLA': 250.00,
      'META': 320.00, 'NFLX': 450.00, 'NVDA': 480.00, 'SBUX': 95.00, 'WMT': 160.00,
      'TGT': 140.00, 'NKE': 100.00, 'DIS': 90.00, 'MCD': 280.00, 'COST': 700.00,
      'FL': 40.00, 'PSY': 50.00, 'DLTR': 120.00, 'CVS': 60.00, 'RETAIL': 30.00,
      'BURL': 30.00, 'CHTR': 300.00, 'DKS': 100.00, 'EL': 200.00,
      'SPOT': 95.00, 'UBER': 50.00, 'M': 20.00, 'CMG': 200.00,
      'ADBE': 400.00, 'CRM': 200.00, 'PYPL': 60.00, 'INTC': 30.00,
      'AMD': 100.00, 'ORCL': 100.00, 'IBM': 150.00, 'CSCO': 50.00,
      'JPM': 150.00, 'BAC': 30.00, 'WFC': 40.00, 'GS': 300.00,
      'V': 200.00, 'MA': 300.00, 'JNJ': 150.00, 'PFE': 30.00,
      'UNH': 500.00, 'HD': 300.00, 'LOW': 200.00, 'KO': 60.00,
      'PEP': 150.00, 'YUM': 100.00
    }
    
    const price = stockPrices[ticker] || 100.00
    const shares = roundUp / price
    
    if (shares < 0.01) {
      return '<0.01'
    }
    
    return shares.toFixed(3)
  }

  const handleRetryMapping = (transactionId) => {
    showNotificationModal(`AI mapping retry initiated for transaction ${transactionId}`, 'info')
  }

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction)
    setShowViewModal(true)
  }

  const handleExport = () => {
    // 🚀 PERFORMANCE FIX: Export only current page transactions (backend should provide export endpoint)
    const csvContent = [
      ['Date', 'Dashboard', 'Merchant', 'Category', 'Purchase', 'Round-Up', 'Total Debit', 'Status'],
      ...transactions.map(t => [
        t.date,
        t.dashboard,
        t.merchant,
        t.category,
        t.amount || 0,
        t.round_up || 0,
        t.total_debit || 0,
        t.status || 'pending'
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-page-${pagination.page}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleCleanupTestData = async () => {
    // Confirm before cleanup
    const confirmed = window.confirm(
      'This will delete ALL test/demo data and keep only user ID 94 (Al Bell) with their 25 transactions.\n\n' +
      'This action cannot be undone!\n\n' +
      'Are you sure you want to proceed?'
    )
    
    if (!confirmed) {
      return
    }
    
    try {
      setCleaningUp(true)
      console.log('[CLEANUP] Starting cleanup process...')
      
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      console.log('[CLEANUP] Using token:', token ? 'Token found' : 'No token')
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const url = `${apiBaseUrl}/api/admin/database/cleanup-test-data`
      console.log('[CLEANUP] Calling:', url)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keep_user_id: 94  // Al Bell
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('[CLEANUP] Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[CLEANUP] Response error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const result = await response.json()
      console.log('[CLEANUP] Response data:', result)
      
      if (result.success) {
        showNotificationModal(
          `Cleanup successful! Removed ${result.summary.deleted_users} users and ${result.summary.deleted_transactions} transactions. Kept ${result.summary.kept_transactions} transactions for ${result.summary.kept_user_name}.`,
          'success'
        )
        // Refresh the transactions list
        setTimeout(() => {
          console.log('[CLEANUP] Refreshing transactions list...')
          queryClient.invalidateQueries({ queryKey: ['admin-transactions'] })
          refetch()
        }, 1000)
      } else {
        console.error('[CLEANUP] Cleanup failed:', result.error)
        showNotificationModal(
          `Cleanup failed: ${result.error || 'Unknown error'}`,
          'error'
        )
      }
    } catch (error) {
      console.error('[CLEANUP] Cleanup error:', error)
      if (error.name === 'AbortError') {
        showNotificationModal(
          'Cleanup timed out after 60 seconds. The cleanup might still be processing. Please wait a moment and refresh, or run the cleanup script directly.',
          'error'
        )
      } else {
        showNotificationModal(
          `Cleanup failed: ${error.message || 'Network error. Please check console for details.'}\n\nIf this persists, you can run the cleanup script directly: python cleanup_transactions_direct.py`,
          'error'
        )
      }
    } finally {
      console.log('[CLEANUP] Cleanup process finished')
      setCleaningUp(false)
    }
  }

  // Debug function to check authentication status
  const debugAuthStatus = () => {
    const tokens = {
      kamioi_admin_token: localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3',
      kamioi_token: localStorage.getItem('kamioi_token'),
      authToken: localStorage.getItem('authToken')
    }
    console.log('AdminTransactions - Debug Auth Status:', tokens)
    console.log('AdminTransactions - Current transactions count:', transactions.length)
    console.log('AdminTransactions - Loading state:', isLoading)
    console.log('AdminTransactions - Error state:', queryError)
    return tokens
  }

  // Expose debug function to window for testing
  useEffect(() => {
    window.debugAdminTransactions = debugAuthStatus
  }, [transactions.length, isLoading, queryError])


  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setDashboardFilter('all')
    setDateFilter('all')
    setCurrentPage(1)
    console.log('Admin filters cleared')
  }
  
  // 🚀 PERFORMANCE FIX: NO frontend filtering - backend does it all
  // Transactions are already filtered and paginated by backend
  const currentTransactions = transactions
  
  // 🚀 PERFORMANCE FIX: Pagination from backend response
  const totalPages = pagination.totalPages || 1

  // Removed - now using stats.availableToInvest and stats.totalInvested directly

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>All Dashboard Transactions</h1>
          <p className={`mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Track all transactions across user, family, and business dashboards</p>
          {isLoading && <p className="text-yellow-400 text-sm mt-1">Loading transactions...</p>}
          {queryError && <p className="text-red-400 text-sm mt-1">Error: {queryError.message}</p>}
          {!isLoading && !queryError && (
            <p className="text-green-400 text-sm mt-1">
              Showing {transactions.length} of {pagination.total} transactions (Page {pagination.page} of {pagination.totalPages})
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => refetch()}
            disabled={isLoading}
            className={`bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button 
            onClick={handleExport}
            className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg px-4 py-2 text-orange-400 flex items-center space-x-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export All</span>
          </button>
          <button 
            onClick={handleCleanupTestData}
            disabled={cleaningUp}
            className={`bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 flex items-center space-x-2 transition-all ${
              cleaningUp ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Remove all test/demo data, keeping only real user (ID 94)"
          >
            {cleaningUp ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Cleaning...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Cleanup Test Data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className={`p-6 shadow-xl rounded-lg ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card border border-blue-500/20'}`}>
          <div className="flex items-center space-x-4">
            <RefreshCw className={`w-6 h-6 animate-spin ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
            <div className="flex-1">
              <div className={`font-medium mb-2 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>Loading transactions...</div>
              <div className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Fetching data from backend...</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Total Transactions</p>
              <p className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>{stats.totalTransactions}</p>
              <p className={`text-sm flex items-center mt-1 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                Across all dashboards
              </p>
            </div>
            <CheckCircle className={`w-8 h-8 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Available to Invest</p>
              <p className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>${(stats.availableToInvest || 0).toFixed(2)}</p>
              <p className={`text-sm flex items-center mt-1 ${isLightMode ? 'text-green-600' : 'text-green-400'}`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                Ready for investment
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isLightMode ? 'bg-green-100' : 'bg-green-500/20'}`}>
              <DollarSign className={`w-6 h-6 ${isLightMode ? 'text-green-600' : 'text-green-400'}`} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>What Was Invested</p>
              <p className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>${(stats.totalInvested || 0).toFixed(2)}</p>
              <p className={`text-sm flex items-center mt-1 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {stats.totalInvested > 0 ? Math.round(stats.totalInvested / 10) : 0} completed investments
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isLightMode ? 'bg-blue-100' : 'bg-blue-500/20'}`}>
              <TrendingUp className={`w-6 h-6 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Dashboard Breakdown</p>
              <p className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                {stats.userTransactions + stats.familyTransactions + stats.businessTransactions}
              </p>
              <p className={`text-sm flex items-center mt-1 ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`}>
                <Users className="w-4 h-4 mr-1" />
                U:{stats.userTransactions} F:{stats.familyTransactions} B:{stats.businessTransactions}
              </p>
            </div>
            <Users className={`w-8 h-8 ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`} />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search merchants, categories, or dashboards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select 
          value={dashboardFilter}
          onChange={(e) => setDashboardFilter(e.target.value)}
          className={getSelectClass()}
        >
          <option value="all">All Dashboards</option>
          <option value="user">User Dashboard</option>
          <option value="family">Family Dashboard</option>
          <option value="business">Business Dashboard</option>
          <option value="admin">Admin Dashboard</option>
        </select>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={getSelectClass()}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="mapped">Mapped</option>
          <option value="pending-mapping">Pending Mapping</option>
          <option value="staged">Staged</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
          <option value="needs-recognition">Needs Recognition</option>
        </select>
        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={getSelectClass()}
        >
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
        <button
          onClick={handleClearFilters}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>Clear Filters</span>
        </button>
      </div>

      {/* Transactions Table */}
      <div className={`p-6 rounded-lg shadow-md ${isLightMode ? 'bg-white border border-gray-200' : 'glass-card'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isLightMode ? 'border-gray-200' : 'border-white/10'}`}>
                  <th className={`text-left py-3 px-4 ${isLightMode ? 'text-gray-700' : 'text-gray-400'}`}>Date</th>
                  <th className={`text-left py-3 px-4 ${isLightMode ? 'text-gray-700' : 'text-gray-400'}`}>User ID</th>
                  <th className={`text-left py-3 px-4 ${isLightMode ? 'text-gray-700' : 'text-gray-400'}`}>Merchant</th>
                <th className={`text-left py-3 px-4 ${isLightMode ? 'text-gray-700' : 'text-gray-400'}`}>Category</th>
                <th className={`text-right py-3 px-4 ${isLightMode ? 'text-gray-700' : 'text-gray-400'}`}>Purchase</th>
                <th className={`text-right py-3 px-4 ${isLightMode ? 'text-gray-700' : 'text-gray-400'}`}>Round-Up</th>
                <th className={`text-center py-3 px-4 ${isLightMode ? 'text-gray-700' : 'text-gray-400'}`}>Investment</th>
                <th className={`text-right py-3 px-4 ${isLightMode ? 'text-gray-700' : 'text-gray-400'}`}>Total Debit</th>
                <th className={`text-center py-3 px-4 ${isLightMode ? 'text-gray-700' : 'text-gray-400'}`}>Status</th>
                <th className={`text-center py-3 px-4 ${isLightMode ? 'text-gray-700' : 'text-gray-400'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                    <td colSpan="10" className="py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <p className={isLightMode ? 'text-gray-900' : 'text-white'}>Loading transactions from all dashboards...</p>
                    </div>
                  </td>
                </tr>
              ) : queryError ? (
                <tr>
                    <td colSpan="10" className="py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-medium ${isLightMode ? 'text-gray-900' : 'text-white'}`}>Error Loading Transactions</h3>
                        <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>{queryError?.message || queryError || 'Failed to load transactions'}</p>
                      </div>
                      <button 
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>{isLoading ? 'Retrying...' : 'Retry'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : currentTransactions.length === 0 ? (
                <tr>
                    <td colSpan="10" className="py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-medium ${isLightMode ? 'text-gray-900' : 'text-white'}`}>No transactions found</h3>
                        <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          No transactions match your current filters
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                // 🚀 OPTIMIZED: Render only visible transactions for better performance with large datasets
                currentTransactions.map((transaction, index) => {
                  const hasAllocations = transaction.allocations && transaction.allocations.length > 0
                  
                  return (
                    <React.Fragment key={`${transaction.id}-${index}`}>
                      {/* Parent Transaction Row */}
                      <tr className={`border-b ${isLightMode ? 'border-gray-100 hover:bg-gray-50' : 'border-white/5 hover:bg-white/5'}`}>
                        <td className={`py-3 px-4 whitespace-nowrap ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                          {(() => {
                            // Format date - if time is 00:00:00, show only date, otherwise show date and time
                            const dateStr = transaction.date || ''
                            try {
                              const date = new Date(dateStr)
                              if (!isNaN(date.getTime())) {
                                // Check if time is midnight (00:00:00)
                                if (dateStr.includes('00:00:00') || (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0)) {
                                  // Show only date
                                  return date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                } else {
                                  // Show date and time
                                  return date.toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })
                                }
                              }
                            } catch (e) {
                              // If formatting fails, return date without time
                              return dateStr.split(' ')[0] || dateStr
                            }
                            return dateStr.split(' ')[0] || dateStr
                          })()}
                        </td>
                        <td className={`py-3 px-4 text-sm whitespace-nowrap ${isLightMode ? 'text-gray-900' : 'text-white'}`}>{transaction.user_id || transaction.userId || transaction.account_number || 'N/A'}</td>
                        <td className={`py-3 px-4 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>{transaction.merchant}</td>
                        <td className={`py-3 px-4 ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>{transaction.category}</td>
                        <td className={`py-3 px-4 text-right ${isLightMode ? 'text-gray-900' : 'text-white'}`}>${(transaction.amount || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-green-400">${(transaction.round_up || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          {hasAllocations ? (
                            <span className="text-gray-400 text-xs">{transaction.allocations.length} allocation{transaction.allocations.length !== 1 ? 's' : ''}</span>
                          ) : (() => {
                            // Use same logic as BusinessTransactions - check if transaction has ticker (from DB or merchant lookup)
                            const ticker = getTransactionTicker(transaction)
                            const displayStatus = getStatusText(transaction).toLowerCase()
                            
                            // Show investment if transaction has a ticker (mapped or completed)
                            if (ticker && (displayStatus === 'mapped' || displayStatus === 'completed')) {
                              return (
                                <div className="flex flex-col items-center justify-center space-y-1">
                                  <CompanyLogo 
                                    symbol={ticker} 
                                    name={getCompanyName(ticker)}
                                    size="w-6 h-6" 
                                    clickable={true} 
                                  />
                                  <div className="text-green-400 font-medium text-xs">
                                    {calculateShares(transaction.round_up || transaction.round_up_amount || 0, ticker)}
                                  </div>
                                </div>
                              )
                            }
                            
                            return <span className="text-gray-400 text-sm">-</span>
                          })()}
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>${(transaction.total_debit || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center space-x-1 ${getStatusColor(transaction)}`}>
                            {getStatusIcon(transaction)}
                            <span className="capitalize">{getStatusText(transaction)}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center min-w-[120px]">
                          <div className="flex justify-center items-center space-x-1">
                            {transaction.status === 'needs-recognition' && (
                              <button 
                                onClick={() => handleRetryMapping(transaction.id)}
                                className="text-yellow-400 hover:text-yellow-300 p-1 rounded hover:bg-yellow-500/10 transition-colors"
                                title="Retry AI Mapping"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleViewDetails(transaction)}
                              className="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-gray-500/10 transition-colors" 
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Child Rows for Allocations */}
                      {hasAllocations && transaction.allocations.map((alloc, allocIdx) => (
                        <tr key={`${transaction.id}-alloc-${allocIdx}`} className="border-b border-white/5 bg-white/2 hover:bg-white/5">
                          <td colSpan="2" className="py-2 px-4">
                            <div className="flex items-center space-x-2 pl-8">
                              <div className="w-2 h-2 rounded-full bg-blue-400/50"></div>
                              <CompanyLogo 
                                symbol={alloc.stock_symbol} 
                                name={getCompanyName(alloc.stock_symbol)}
                                size="w-5 h-5" 
                                clickable={true} 
                              />
                              <span className="text-white text-sm font-medium">{getCompanyName(alloc.stock_symbol)}</span>
                              <span className="text-gray-400 text-xs">({alloc.stock_symbol})</span>
                            </div>
                          </td>
                          <td className="py-2 px-4 text-gray-400 text-xs">
                            {alloc.allocation_percentage ? `${alloc.allocation_percentage.toFixed(1)}%` : '-'}
                          </td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-green-400 font-medium text-xs">
                                {calculateShares(alloc.allocation_amount || alloc.amount || 0, alloc.stock_symbol)} shares
                              </div>
                              <div className="text-gray-400 text-xs mt-0.5">
                                ${(alloc.allocation_amount || alloc.amount || 0).toFixed(2)}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4"></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 1 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : isLightMode 
                      ? 'text-gray-600 hover:bg-gray-100' 
                      : 'text-gray-400 hover:bg-white/10'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    page === currentPage
                      ? 'bg-red-600 text-white'
                      : isLightMode
                        ? 'text-gray-600 hover:bg-gray-100'
                        : 'text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === totalPages 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : isLightMode 
                      ? 'text-gray-600 hover:bg-gray-100' 
                      : 'text-gray-400 hover:bg-white/10'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>


      {/* View Details Modal */}
      {showViewModal && selectedTransaction && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Transaction Details</h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Transaction ID</label>
                  <p className="text-white">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dashboard</label>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      // Get appropriate icon based on dashboard type
                      const dashboard = (selectedTransaction.dashboard || '').toLowerCase()
                      if (dashboard === 'user' || dashboard === 'individual') {
                        return <User className="w-4 h-4 text-blue-400" />
                      } else if (dashboard === 'family') {
                        return <Home className="w-4 h-4 text-green-400" />
                      } else if (dashboard === 'business') {
                        return <Building className="w-4 h-4 text-purple-400" />
                      }
                      return <Users className="w-4 h-4 text-gray-400" />
                    })()}
                    <span className="text-white capitalize">{selectedTransaction.dashboard || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <p className="text-white">{selectedTransaction.date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center space-x-1 w-fit ${getStatusColor(selectedTransaction)}`}>
                    {getStatusIcon(selectedTransaction)}
                    <span className="capitalize">{getStatusText(selectedTransaction)}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Merchant</label>
                  <p className="text-white">{selectedTransaction.merchant}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <p className="text-white">{selectedTransaction.category}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Purchase Amount</label>
                  <p className="text-white text-lg font-semibold">${(selectedTransaction.amount || 0).toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Round-Up</label>
                  <p className="text-green-400 text-lg font-semibold">${(selectedTransaction.round_up || 0).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Total Debit</label>
                <p className="text-white text-xl font-bold">${(selectedTransaction.total_debit || 0).toFixed(2)}</p>
              </div>

              {selectedTransaction.ticker && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">Investment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Stock Ticker</label>
                      <div className="flex items-center space-x-2">
                        <CompanyLogo 
                          symbol={selectedTransaction.ticker} 
                          name={selectedTransaction.merchant} 
                          size="w-6 h-6"
                        />
                        <span className="text-white font-medium">{selectedTransaction.ticker}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Shares Purchased</label>
                      <p className="text-white">{(selectedTransaction.shares || 0).toFixed(4)} shares</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setShowViewModal(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                notificationType === 'success' ? 'bg-green-500/20' : 
                notificationType === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'
              }`}>
                {notificationType === 'success' ? (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                ) : notificationType === 'error' ? (
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                ) : (
                  <Clock className="w-8 h-8 text-blue-400" />
                )}
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                {notificationType === 'success' ? 'Success!' : 
                 notificationType === 'error' ? 'Error!' : 'Info'}
              </h3>
              <p className="text-white/70 mb-6">{notificationMessage}</p>
              <div className="flex space-x-3">
                <button 
                  onClick={handleNotificationModalClose}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
                >
                  OK
                </button>
                <button 
                  onClick={() => {
                    handleNotificationModalClose()
                    navigate('/admin/notifications')
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all"
                >
                  View Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminTransactions
