import React, { useState, useEffect } from 'react'
import { Upload, Download, Search, Filter, Edit, Eye, CheckCircle, AlertTriangle, Clock, DollarSign, TrendingUp, ExternalLink, ChevronLeft, ChevronRight, X, Target } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useTheme } from '../../context/ThemeContext'
import { useParams } from 'react-router-dom'
import statusSyncService from '../../services/StatusSyncService'
// Version check for dynamic CSV parser
console.log('🔧 BusinessTransactions.jsx - Dynamic Parser V2.0 Loaded!', new Date().toISOString())
import { useModal } from '../../context/ModalContext'
import { useNotifications } from '../../hooks/useNotifications'
import CompanyLogo from '../common/CompanyLogo'
import ReceiptUpload from '../user/ReceiptUpload'
import TransactionDetails from './TransactionDetails'
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters'

  // Company data with verified domains and reliable logo sources
  const getCompanyData = (ticker) => {
    if (!ticker) return { domain: 'example.com', logo: null, name: 'Unknown' }
    
    const companyData = {
      'AAPL': { domain: 'apple.com', name: 'Apple', logo: 'https://logo.clearbit.com/apple.com' },
      'AMZN': { domain: 'amazon.com', name: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com' },
      'GOOGL': { domain: 'google.com', name: 'Google', logo: 'https://logo.clearbit.com/google.com' },
      'MSFT': { domain: 'microsoft.com', name: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com' },
      'TSLA': { domain: 'tesla.com', name: 'Tesla', logo: 'https://logo.clearbit.com/tesla.com' },
      'META': { domain: 'meta.com', name: 'Meta', logo: 'https://logo.clearbit.com/meta.com' },
      'NFLX': { domain: 'netflix.com', name: 'Netflix', logo: 'https://logo.clearbit.com/netflix.com' },
      'NVDA': { domain: 'nvidia.com', name: 'NVIDIA', logo: 'https://logo.clearbit.com/nvidia.com' },
      'SBUX': { domain: 'starbucks.com', name: 'Starbucks', logo: 'https://logo.clearbit.com/starbucks.com' },
      'WMT': { domain: 'walmart.com', name: 'Walmart', logo: 'https://logo.clearbit.com/walmart.com' },
      'SPOT': { domain: 'spotify.com', name: 'Spotify', logo: 'https://logo.clearbit.com/spotify.com' },
      'UBER': { domain: 'uber.com', name: 'Uber', logo: 'https://logo.clearbit.com/uber.com' },
      'M': { domain: 'macys.com', name: 'Macy\'s', logo: 'https://logo.clearbit.com/macys.com' },
      'CMG': { domain: 'chipotle.com', name: 'Chipotle', logo: 'https://logo.clearbit.com/chipotle.com' },
      'DIS': { domain: 'disney.com', name: 'Disney', logo: 'https://logo.clearbit.com/disney.com' },
      'NKE': { domain: 'nike.com', name: 'Nike', logo: 'https://logo.clearbit.com/nike.com' },
      'ADBE': { domain: 'adobe.com', name: 'Adobe', logo: 'https://logo.clearbit.com/adobe.com' },
      'CRM': { domain: 'salesforce.com', name: 'Salesforce', logo: 'https://logo.clearbit.com/salesforce.com' },
      'PYPL': { domain: 'paypal.com', name: 'PayPal', logo: 'https://logo.clearbit.com/paypal.com' },
      'INTC': { domain: 'intel.com', name: 'Intel', logo: 'https://logo.clearbit.com/intel.com' },
      'AMD': { domain: 'amd.com', name: 'AMD', logo: 'https://logo.clearbit.com/amd.com' },
      'ORCL': { domain: 'oracle.com', name: 'Oracle', logo: 'https://logo.clearbit.com/oracle.com' },
      'IBM': { domain: 'ibm.com', name: 'IBM', logo: 'https://logo.clearbit.com/ibm.com' },
      'CSCO': { domain: 'cisco.com', name: 'Cisco', logo: 'https://logo.clearbit.com/cisco.com' },
      'JPM': { domain: 'jpmorganchase.com', name: 'JPMorgan Chase', logo: 'https://logo.clearbit.com/jpmorganchase.com' },
      'BAC': { domain: 'bankofamerica.com', name: 'Bank of America', logo: 'https://logo.clearbit.com/bankofamerica.com' },
      'WFC': { domain: 'wellsfargo.com', name: 'Wells Fargo', logo: 'https://logo.clearbit.com/wellsfargo.com' },
      'GS': { domain: 'goldmansachs.com', name: 'Goldman Sachs', logo: 'https://logo.clearbit.com/goldmansachs.com' },
      'V': { domain: 'visa.com', name: 'Visa', logo: 'https://logo.clearbit.com/visa.com' },
      'MA': { domain: 'mastercard.com', name: 'Mastercard', logo: 'https://logo.clearbit.com/mastercard.com' },
      'JNJ': { domain: 'jnj.com', name: 'Johnson & Johnson', logo: 'https://logo.clearbit.com/jnj.com' },
      'PFE': { domain: 'pfizer.com', name: 'Pfizer', logo: 'https://logo.clearbit.com/pfizer.com' },
      'UNH': { domain: 'unitedhealthgroup.com', name: 'UnitedHealth', logo: 'https://logo.clearbit.com/unitedhealthgroup.com' },
      'HD': { domain: 'homedepot.com', name: 'Home Depot', logo: 'https://logo.clearbit.com/homedepot.com' },
      'LOW': { domain: 'lowes.com', name: 'Lowe\'s', logo: 'https://logo.clearbit.com/lowes.com' },
      'KO': { domain: 'coca-cola.com', name: 'Coca-Cola', logo: 'https://logo.clearbit.com/coca-cola.com' },
      'PEP': { domain: 'pepsi.com', name: 'PepsiCo', logo: 'https://logo.clearbit.com/pepsi.com' },
      'MCD': { domain: 'mcdonalds.com', name: 'McDonald\'s', logo: 'https://logo.clearbit.com/mcdonalds.com' },
      'YUM': { domain: 'yum.com', name: 'Yum! Brands', logo: 'https://logo.clearbit.com/yum.com' },
      'TGT': { domain: 'target.com', name: 'Target', logo: 'https://logo.clearbit.com/target.com' },
      'COST': { domain: 'costco.com', name: 'Costco', logo: 'https://logo.clearbit.com/costco.com' },
      'EL': { domain: 'esteelauder.com', name: 'Estée Lauder', logo: 'https://logo.clearbit.com/esteelauder.com' },
      'BURL': { domain: 'burlington.com', name: 'Burlington', logo: 'https://logo.clearbit.com/burlington.com' },
      'FL': { domain: 'footlocker.com', name: 'Foot Locker', logo: 'https://logo.clearbit.com/footlocker.com' },
      'CHTR': { domain: 'spectrum.com', name: 'Charter Spectrum', logo: 'https://logo.clearbit.com/spectrum.com' },
      'DKS': { domain: 'dickssportinggoods.com', name: 'Dick\'s Sporting Goods', logo: 'https://logo.clearbit.com/dickssportinggoods.com' }
    }
    
    return companyData[ticker] || { domain: 'example.com', logo: null, name: ticker }
  }

// Helper function to get company domain from ticker
const getCompanyDomain = (ticker) => {
  return getCompanyData(ticker).domain
}

// Helper function to get company logo
const getCompanyLogo = (ticker) => {
  return getCompanyData(ticker).logo
}

// Helper function to get company name
const getCompanyName = (ticker) => {
  return getCompanyData(ticker).name
}


// Simple fallback logo creation without Unicode issues
const createFallbackLogo = (ticker) => {
  const canvas = document.createElement('canvas')
  canvas.width = 24
  canvas.height = 24
  const ctx = canvas.getContext('2d')
  
  // Company-specific colors
  const companyColors = {
    'AAPL': { color: '#A8A8A8', bg: '#FFFFFF' },
    'AMZN': { color: '#FF9900', bg: '#000000' },
    'GOOGL': { color: '#4285F4', bg: '#FFFFFF' },
    'MSFT': { color: '#00BCF2', bg: '#FFFFFF' },
    'TSLA': { color: '#CC0000', bg: '#FFFFFF' },
    'META': { color: '#1877F2', bg: '#FFFFFF' },
    'NFLX': { color: '#E50914', bg: '#FFFFFF' },
    'NVDA': { color: '#76B900', bg: '#FFFFFF' },
    'SBUX': { color: '#00704A', bg: '#FFFFFF' },
    'WMT': { color: '#004C91', bg: '#FFFFFF' },
    'SPOT': { color: '#1DB954', bg: '#FFFFFF' },
    'UBER': { color: '#000000', bg: '#FFFFFF' },
    'M': { color: '#E31E24', bg: '#FFFFFF' },
    'CMG': { color: '#FF6B35', bg: '#FFFFFF' },
    'DIS': { color: '#113CCF', bg: '#FFFFFF' },
    'NKE': { color: '#000000', bg: '#FFFFFF' },
    'ADBE': { color: '#FF0000', bg: '#FFFFFF' },
    'CRM': { color: '#00A1E0', bg: '#FFFFFF' },
    'PYPL': { color: '#0070BA', bg: '#FFFFFF' },
    'INTC': { color: '#0071C5', bg: '#FFFFFF' },
    'AMD': { color: '#ED1C24', bg: '#FFFFFF' },
    'ORCL': { color: '#F80000', bg: '#FFFFFF' },
    'IBM': { color: '#052FAD', bg: '#FFFFFF' },
    'CSCO': { color: '#1BA0D7', bg: '#FFFFFF' },
    'JPM': { color: '#0066B2', bg: '#FFFFFF' },
    'BAC': { color: '#E31837', bg: '#FFFFFF' },
    'WFC': { color: '#D71E2B', bg: '#FFFFFF' },
    'GS': { color: '#000000', bg: '#FFFFFF' },
    'V': { color: '#1A1F71', bg: '#FFFFFF' },
    'MA': { color: '#EB001B', bg: '#FFFFFF' },
    'JNJ': { color: '#0066B2', bg: '#FFFFFF' },
    'PFE': { color: '#00A0E1', bg: '#FFFFFF' },
    'UNH': { color: '#00A0E1', bg: '#FFFFFF' },
    'HD': { color: '#F96302', bg: '#FFFFFF' },
    'LOW': { color: '#004990', bg: '#FFFFFF' },
    'KO': { color: '#FF0000', bg: '#FFFFFF' },
    'PEP': { color: '#0066B2', bg: '#FFFFFF' },
    'MCD': { color: '#FFC72C', bg: '#FFFFFF' },
    'YUM': { color: '#FF6B35', bg: '#FFFFFF' },
    'TGT': { color: '#CC0000', bg: '#FFFFFF' },
    'COST': { color: '#E31837', bg: '#FFFFFF' },
    'EL': { color: '#FF69B4', bg: '#FFFFFF' },
    'BURL': { color: '#8B4513', bg: '#FFFFFF' },
    'FL': { color: '#FF6B35', bg: '#FFFFFF' },
    'CHTR': { color: '#00A8E8', bg: '#FFFFFF' },
    'DKS': { color: '#FFD700', bg: '#000000' }
  }
  
  const style = companyColors[ticker] || { color: '#4F46E5', bg: '#FFFFFF' }
  
  // Draw background
  ctx.fillStyle = style.bg
  ctx.fillRect(0, 0, 24, 24)
  
  // Draw border
  ctx.strokeStyle = style.color
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, 22, 22)
  
  // Draw text (first letter of ticker)
  ctx.fillStyle = style.color
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ticker.charAt(0), 12, 12)
  
  return canvas.toDataURL()
}




// Stock price cache - populated from API
let stockPriceCache = {}

// Fetch real stock prices from API
const fetchStockPrices = async (tickers) => {
  if (!tickers || tickers.length === 0) return
  try {
    const uniqueTickers = [...new Set(tickers.filter(t => t && t !== 'UNKNOWN'))]
    if (uniqueTickers.length === 0) return
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
    const response = await fetch(`${apiBaseUrl}/api/stock/prices?symbols=${uniqueTickers.join(',')}`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.prices) {
        Object.entries(data.prices).forEach(([symbol, info]) => {
          stockPriceCache[symbol] = info.price
        })
        console.log('Business: Updated stock prices:', stockPriceCache)
      }
    }
  } catch (error) {
    console.error('Error fetching stock prices:', error)
  }
}

// Helper function to calculate shares using cached prices
const calculateShares = (amount, ticker) => {
  if (!ticker || !amount) return '0.000'

  // Use cached price or minimal fallback
  const price = stockPriceCache[ticker?.toUpperCase()] || 100.00
  const shares = amount / price

  if (shares < 0.01) {
    return '<0.01'
  }

  return shares.toFixed(3)
}

const BusinessTransactions = ({ user }) => {
  const { userId } = useParams()
  const { transactions, addTransactions, totalRoundUps, setTransactions, refreshData } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [userMappings, setUserMappings] = useState([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [mappingDetails, setMappingDetails] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState('')
  const [mappingForm, setMappingForm] = useState({
    merchant: '',
    companyName: '',
    ticker: '',
    category: 'Food & Dining',
    confidence: 'High (90-100%)',
    notes: ''
  })
  
  const itemsPerPage = 10
  const [roundUpAmount, setRoundUpAmount] = useState(1)
  const [roundUpEnabled, setRoundUpEnabled] = useState(true)
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  
  // Listen for refresh events from bank file upload
  useEffect(() => {
    const handleRefreshTransactions = async () => {
      console.log('[BusinessTransactions] Received refreshTransactions event, refreshing data...')
      if (refreshData) {
        try {
          await refreshData()
          console.log('[BusinessTransactions] Data refreshed successfully')
        } catch (error) {
          console.error('[BusinessTransactions] Error refreshing data:', error)
        }
      }
    }
    
    const handleDataRefresh = async (event) => {
      console.log('[BusinessTransactions] Received dataRefresh event:', event.detail)
      if (refreshData) {
        try {
          await refreshData()
          console.log('[BusinessTransactions] Data refreshed successfully')
        } catch (error) {
          console.error('[BusinessTransactions] Error refreshing data:', error)
        }
      }
    }
    
    window.addEventListener('refreshTransactions', handleRefreshTransactions)
    window.addEventListener('dataRefresh', handleDataRefresh)
    
    return () => {
      window.removeEventListener('refreshTransactions', handleRefreshTransactions)
      window.removeEventListener('dataRefresh', handleDataRefresh)
    }
  }, [refreshData])

  // Safety check: ensure transactions is an array (define early so all functions can use it)
  const safeTransactions = Array.isArray(transactions) ? transactions : []

  // Fetch real stock prices for all tickers in transactions
  useEffect(() => {
    if (safeTransactions && safeTransactions.length > 0) {
      const tickers = safeTransactions
        .map(t => t.ticker)
        .filter(t => t && t !== 'UNKNOWN' && t !== 'Unknown')
      if (tickers.length > 0) {
        fetchStockPrices(tickers)
      }
    }
  }, [safeTransactions])

  // Load round-up settings for display purposes
  React.useEffect(() => {
    const loadRoundUpSettings = () => {
      const saved = localStorage.getItem('kamioi_business_round_up_amount')
      const savedEnabled = localStorage.getItem('kamioi_business_round_up_enabled')
      if (saved) setRoundUpAmount(parseInt(saved))
      if (savedEnabled !== null) setRoundUpEnabled(savedEnabled === 'true')
      
      // Also fetch from API
      const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
      if (token) {
              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        fetch(`${apiBaseUrl}/api/business/settings/roundup`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.success) {
            setRoundUpAmount(data.round_up_amount || 1)
            setRoundUpEnabled(data.round_up_enabled !== false)
            localStorage.setItem('kamioi_business_round_up_amount', (data.round_up_amount || 1).toString())
            localStorage.setItem('kamioi_business_round_up_enabled', (data.round_up_enabled !== false).toString())
          }
        })
        .catch(() => {})
      }
    }
    
    loadRoundUpSettings()
    
    // Listen for settings updates
    const handleSettingsUpdate = (event) => {
      if (event.detail?.dashboardType === 'business' || !event.detail?.dashboardType) {
        if (event.detail?.amount !== undefined) setRoundUpAmount(event.detail.amount)
        if (event.detail?.enabled !== undefined) setRoundUpEnabled(event.detail.enabled)
      }
    }
    
    window.addEventListener('roundUpSettingsUpdated', handleSettingsUpdate)
    
    // Listen for receipt upload request from header
    const handleReceiptUploadRequest = () => {
      setShowReceiptUpload(true)
    }
    
    window.addEventListener('business:open-receipt-upload', handleReceiptUploadRequest)
    
    return () => {
      window.removeEventListener('roundUpSettingsUpdated', handleSettingsUpdate)
      window.removeEventListener('business:open-receipt-upload', handleReceiptUploadRequest)
    }
  }, [])
  
  // Helper function to get display round-up amount
  const getDisplayRoundUp = (transaction) => {
    // If transaction already has a round-up value (not 0), use it
    if (transaction.round_up && transaction.round_up > 0) {
      return transaction.round_up
    }
    // If round-ups are enabled and transaction has no round-up, use current setting
    if (roundUpEnabled) {
      return roundUpAmount
    }
    // Round-ups disabled
    return 0
  }

  // Status synchronization - listen for status updates from other dashboards
  React.useEffect(() => {
    const handleStatusUpdate = (update) => {
      console.log('📡 BusinessTransactions - Received status update:', update)
      
      // Update the transaction in the local state
      setTransactions(prevTransactions => {
        return prevTransactions.map(transaction => {
          if (transaction.id === update.transactionId) {
            console.log(`🔄 BusinessTransactions - Updating transaction ${update.transactionId} status: ${transaction.status} -> ${update.newStatus}`)
            return {
              ...transaction,
              status: update.newStatus
            }
          }
          return transaction
        })
      })
    }

    // Subscribe to status updates
    statusSyncService.subscribe('business', handleStatusUpdate)

    // Cleanup on unmount
    return () => {
      statusSyncService.unsubscribe('business', handleStatusUpdate)
    }
  }, [setTransactions])

  // Function to update transaction status and notify other dashboards
  const updateTransactionStatus = (transactionId, newStatus) => {
    console.log(`🔄 BusinessTransactions - Updating transaction ${transactionId} to status: ${newStatus}`)
    
    // Update local state
    setTransactions(prevTransactions => {
      return prevTransactions.map(transaction => {
        if (transaction.id === transactionId) {
          return {
            ...transaction,
            status: newStatus
          }
        }
        return transaction
      })
    })

    // Notify other dashboards
    statusSyncService.updateStatus(transactionId, newStatus, 'business')
  }
  
  // Debug: Log transactions data
  console.log('🔄 BusinessTransactions - Received transactions:', {
    count: transactions?.length || 0,
    transactions: transactions,
    transactionsType: typeof transactions,
    isArray: Array.isArray(transactions),
    totalRoundUps
  })
  const { addNotification } = useNotifications()
  const { showSuccessModal, showErrorModal } = useModal()
  const { isLightMode } = useTheme()

  // Helper function to check if transaction has a ticker from database only
  // REMOVED hardcoded merchantTickerMap - use database status directly
  const transactionHasTicker = (transaction) => {
    return !!(transaction.ticker || transaction.stock_symbol || transaction.ticker_symbol)
  }

  const getStatusText = (transaction) => {
    // Use database status directly - NO hardcoded overrides
    const status = (transaction.status || '').toLowerCase().trim()
    switch (status) {
      case 'completed': return 'Completed'
      case 'mapped': return 'Mapped'
      case 'staged': return 'Staged'
      case 'pending-mapping': return 'Pending Mapping'
      case 'pending-approval': return 'Pending Approval'
      case 'needs-recognition': return 'Needs Recognition'
      case 'pending': return 'Pending'
      case 'no-investment': return 'No Investment'
      case 'rejected': return 'Rejected'
      default: return 'Unknown'
    }
  }

  const getStatusColor = (transaction) => {
    // Use database status directly
    const status = (transaction.status || '').toLowerCase().trim()
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'mapped': return 'bg-green-500/20 text-green-400'
      case 'staged': return 'bg-blue-500/20 text-blue-400'
      case 'pending-mapping': return 'bg-orange-500/20 text-orange-400'
      case 'pending-approval': return 'bg-yellow-500/20 text-yellow-400'
      case 'needs-recognition': return 'bg-yellow-500/20 text-yellow-400'
      case 'pending': return 'bg-gray-500/20 text-gray-400'
      case 'no-investment': return 'bg-gray-500/20 text-gray-400'
      case 'rejected': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (transaction) => {
    // Use database status directly
    const status = (transaction.status || '').toLowerCase().trim()
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'mapped': return <CheckCircle className="w-4 h-4" />
      case 'staged': return <Clock className="w-4 h-4" />
      case 'pending-mapping': return <Clock className="w-4 h-4" />
      case 'pending-approval': return <Clock className="w-4 h-4" />
      case 'needs-recognition': return <Eye className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'no-investment': return <AlertTriangle className="w-4 h-4" />
      case 'rejected': return <X className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  // Function to suggest stock symbol for pending transactions
  const suggestStockSymbol = (transaction) => {
    // TODO: Implement real stock suggestion API call
    // For now, return null to avoid hardcoded data
    return null
  }

  // Function to calculate possible shares for pending transactions
  const calculatePossibleShares = (suggestedTicker, investableAmount) => {
    if (!suggestedTicker || !investableAmount) return 0
    
    // TODO: Implement real stock price API call
    // For now, return 0 to avoid hardcoded data
    return 0
  }

  const getSelectClass = () => {
    if (isLightMode) return 'bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500'
    return 'bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  }

  // Helper function to parse confidence string to number
  const parseConfidenceToNumber = (confidenceString) => {
    if (typeof confidenceString === 'number') return confidenceString
    
    // Handle named confidence levels
    switch (confidenceString) {
      case 'Very High': return 95
      case 'High': return 85
      case 'Medium': return 70
      case 'Low': return 50
      case 'Very Low': return 25
      default: return 70 // Default to Medium
    }
  }

  const handleEditTransaction = (transactionId) => {
    setSelectedTransaction(transactionId)
    const transaction = safeTransactions.find(t => t.id === transactionId)
    // Reset form with transaction data
    setMappingForm({
      mapping_id: `AIM${Math.floor(Math.random() * 9000000) + 1000000}`, // Generate unique mapping ID
      merchant: transaction?.description || transaction?.merchant || '', // Use description (full bank data) for mapping
      companyName: transaction?.merchant || '', // Start with merchant name as suggestion
      ticker: transaction?.ticker || '',
      category: transaction?.category || 'Food & Dining',
            confidence: 'Medium', // Default to medium confidence
      notes: ''
    })
    setShowEditModal(true)
  }

  const lookupStockTicker = async (merchantName) => {
    if (!merchantName || merchantName.length < 3) {
      console.log('🔍 Ticker lookup skipped - merchant name too short:', merchantName)
      return null
    }

    console.log('🔍 Looking up ticker for:', merchantName)
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/lookup/ticker?company=${encodeURIComponent(merchantName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.ticker) {
          console.log('✅ Ticker found:', data.ticker)
          return data.ticker
        } else {
          console.log('❌ No ticker found for:', merchantName)
          return null
        }
      } else {
        console.log('❌ Ticker lookup failed:', response.status)
        return null
      }
    } catch (error) {
      console.error('❌ Ticker lookup error:', error)
      return null
    }
  }

  const handleCompanyNameChange = async (companyName) => {
    setMappingForm(prev => ({ ...prev, companyName }))
    
    // Auto-lookup ticker when company name changes
    if (companyName && companyName.length >= 3) {
      const ticker = await lookupStockTicker(companyName)
      if (ticker) {
        setMappingForm(prev => ({ ...prev, ticker }))
      }
    }
  }

  const handleRetryMapping = async (transactionId, event) => {
    let originalText = 'Retry AI Mapping'
    
    try {
      const transaction = safeTransactions.find(t => t.id === transactionId)
      if (!transaction) {
        showErrorModal(
          'Transaction Not Found',
          'Transaction not found'
        )
        return
      }
      
      // Show loading state
      if (event && event.target) {
        originalText = event.target.textContent
        event.target.textContent = 'Processing...'
        event.target.disabled = true
      }
      
      // Call backend to retry AI mapping
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/transactions/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          description: transaction.description,
          amount: transaction.amount,
          merchantName: transaction.merchant || ''
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Update the transaction with new AI analysis
          const updatedTransactions = safeTransactions.map(t => 
            t.id === transactionId 
              ? {
                  ...t,
                  category: result.data.aiAnalysis.category,
                  aiConfidence: result.data.aiAnalysis.confidence,
                  suggestedStock: result.data.investment.suggestedTicker,
                  status: 'processed'
                }
              : t
          )
          
          // Update context (you might need to add this method to DataContext)
          // updateTransactions(updatedTransactions)
          
          showSuccessModal(
          'AI Mapping Updated',
          'AI mapping updated successfully!'
        )
        } else {
          throw new Error(result.error || 'Failed to process transaction')
        }
      } else {
        throw new Error('Network error')
      }
      
    } catch (error) {
      console.error('Retry mapping failed:', error)
      showErrorModal(
        'AI Mapping Failed',
        'Failed to retry AI mapping. Please try again.'
      )
    } finally {
      // Reset button state
      if (event && event.target) {
        event.target.textContent = originalText
        event.target.disabled = false
      }
    }
  }

  const handleViewDetails = async (transactionId) => {
    // Find the full transaction object
    const transaction = safeTransactions.find(t => t.id === transactionId)
    
    // Ensure user_id is included - get from multiple sources if missing
    if (transaction && !transaction.user_id) {
      // Try to get user_id from various sources
      let currentUserId = transaction.user_id || 
                         userId || 
                         user?.id || 
                         localStorage.getItem('kamioi_business_user_id')
      
      // If still not found, try to extract from token
      if (!currentUserId) {
        const businessToken = localStorage.getItem('kamioi_business_token')
        if (businessToken && businessToken.includes('business_token_')) {
          const tokenMatch = businessToken.match(/business_token_(\d+)/)
          if (tokenMatch) {
            currentUserId = tokenMatch[1]
          }
        }
      }
      
      // If still not found, try user_token
      if (!currentUserId) {
        const userToken = localStorage.getItem('kamioi_user_token')
        if (userToken && userToken.includes('user_token_')) {
          const tokenMatch = userToken.match(/user_token_(\d+)/)
          if (tokenMatch) {
            currentUserId = tokenMatch[1]
          }
        }
      }
      
      if (currentUserId) {
        transaction.user_id = parseInt(currentUserId) || currentUserId
      }
    }
    
    console.log('🔍 [BusinessTransactions] View Details - Transaction:', {
      id: transaction?.id,
      user_id: transaction?.user_id,
      merchant: transaction?.merchant,
      category: transaction?.category,
      transaction_type: transaction?.transaction_type
    })
    
    // If user_id is still missing, try to fetch transaction directly from API
    if (transaction && !transaction.user_id) {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const token = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
        const txnResponse = await fetch(`${apiBaseUrl}/api/business/transactions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (txnResponse.ok) {
          const txnData = await txnResponse.json()
          if (txnData.success && txnData.data) {
            const fullTransaction = txnData.data.find(t => t.id === transaction.id || t.id?.toString() === transaction.id?.toString())
            if (fullTransaction && fullTransaction.user_id) {
              transaction.user_id = fullTransaction.user_id
              console.log('✅ [BusinessTransactions] Fetched user_id from API:', fullTransaction.user_id)
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ [BusinessTransactions] Could not fetch user_id from API:', error)
      }
    }
    
    setSelectedTransaction(transaction)
    setShowViewModal(true)
    
    // Fetch user's mapping data for this transaction
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/business/ai/insights`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kamioi_user_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Find mapping for this specific transaction
        const userMapping = data.data?.find(mapping => 
          mapping.transaction_id === transactionId
        )
        setMappingDetails(userMapping || null)
      } else {
        setMappingDetails(null)
      }
    } catch (error) {
      console.error('Error fetching mapping data:', error)
      setMappingDetails(null)
    }
  }

  const [selectedAllocation, setSelectedAllocation] = useState(null)

  const handleViewAllocationDetails = (transaction, allocation) => {
    // Create a detailed allocation object for the modal
    const allocationDetails = {
      ...allocation,
      transaction: {
        id: transaction.id,
        merchant: transaction.merchant,
        date: transaction.date,
        amount: transaction.amount,
        round_up: transaction.round_up || transaction.round_up_amount,
        total_debit: transaction.total_debit
      },
      companyName: getCompanyName(allocation.stock_symbol),
      shares: calculateShares(allocation.allocation_amount || allocation.amount || 0, allocation.stock_symbol),
      allocationAmount: allocation.allocation_amount || allocation.amount || 0,
      allocationPercentage: allocation.allocation_percentage || 0,
      stock_symbol: allocation.stock_symbol
    }
    setSelectedTransaction(allocationDetails)
    setSelectedAllocation(allocationDetails)
    setShowViewModal(true)
    setMappingDetails(null) // No mapping details for individual allocations
  }

  const handleUploadCSV = () => {
    console.log('🔧 handleUploadCSV called from BusinessTransactions component')
    // Trigger the file input click to open file dialog
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.csv'
    fileInput.style.display = 'none'
    document.body.appendChild(fileInput)
    
    fileInput.onchange = async (event) => {
      const file = event.target.files[0]
      if (file) {
        console.log('🔧 Business CSV file selected:', file.name)
        try {
          // Parse CSV file
        const reader = new FileReader()
          reader.onload = async (event) => {
          const csv = event.target.result
          const lines = csv.split('\n')
          const headers = lines[0].split(',')
          
          // Parse CSV data
          const transactions = []
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',')
              if (values.length >= headers.length) {
                const transaction = {}
                headers.forEach((header, index) => {
                  transaction[header.trim()] = values[index]?.trim() || ''
                })
                transactions.push(transaction)
              }
            }
          }
          
            console.log('🔧 Business CSV parsed:', transactions.length, 'transactions')
            
            // Start processing with progress bar
            setIsProcessing(true)
            setProcessingProgress(0)
            setProcessingMessage('Starting transaction processing...')
            
            // Use the DataContext addTransactions function with parsed data
            await addTransactions(transactions, null, (progress, message) => {
              setProcessingProgress(progress)
              setProcessingMessage(message)
            })
            
            // Hide processing bar
            setIsProcessing(false)
          addNotification({
            type: 'success',
              title: 'CSV Upload Successful',
              message: `Business transactions uploaded and processed successfully! ${transactions.length} transactions processed.`
          })
        }
        reader.readAsText(file)
        } catch (error) {
          console.error('❌ Business CSV upload failed:', error)
        addNotification({
            type: 'error',
            title: 'CSV Upload Failed',
            message: 'Failed to upload business transactions. Please try again.'
          })
        }
      }
      document.body.removeChild(fileInput)
    }
    
    fileInput.click()
  }

  const handleExport = async () => {
    try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/business/export/transactions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kamioi_user_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Create download link
          const link = document.createElement('a')
          link.href = data.download_url
          link.download = `business-transactions-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          showSuccessModal(
            'Export Successful',
            'Business transactions exported successfully!'
          )
        } else {
          throw new Error(data.error || 'Export failed')
        }
      } else {
        throw new Error('Network error')
      }
      
    } catch (error) {
      console.error('Export failed:', error)
      showErrorModal(
        'Export Failed',
        'Failed to export transactions. Please try again.'
      )
    }
  }

  const filteredTransactions = safeTransactions.filter(transaction => {
    // Filter by transaction type
    if (typeFilter !== 'all') {
      const transactionType = transaction.transaction_type || 'bank'
      if (typeFilter === 'receipt' && transactionType !== 'receipt') return false
      if (typeFilter === 'bank' && transactionType !== 'bank') return false
    }
    
    const merchant = transaction.merchant || transaction.description || 'Unknown'
    const category = transaction.category || 'General'
    const matchesSearch = merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Use the same display status logic as getStatusText for filtering
    // This ensures the filter matches EXACTLY what the user sees in the UI
    const displayStatus = getStatusText(transaction).toLowerCase()
    
    let matchesStatus = false
    
    if (statusFilter === 'all') {
      matchesStatus = true
    } else {
      const filterStatus = statusFilter.toLowerCase()
      
      // Match EXACTLY the display status - no fuzzy matching
      // This ensures "Pending" only shows "Pending", "Mapped" only shows "Mapped", etc.
      matchesStatus = displayStatus === filterStatus
      
      // Handle special cases for filter options that don't match display text exactly
      if (filterStatus === 'pending-approval') {
        matchesStatus = displayStatus === 'pending approval'
      } else if (filterStatus === 'needs-recognition') {
        matchesStatus = displayStatus === 'needs recognition'
      } else if (filterStatus === 'pending-mapping') {
        matchesStatus = displayStatus === 'pending mapping'
      } else if (filterStatus === 'no-investment') {
        matchesStatus = displayStatus === 'no investment'
      }
    }
    
    // Date filtering logic
    let matchesDate = true
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.date)
      const now = new Date()
      
      switch (dateFilter) {
        case 'today': {
          matchesDate = transactionDate.toDateString() === now.toDateString()
          break
        }
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = transactionDate >= weekAgo
          break
        }
        case 'month': {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = transactionDate >= monthAgo
          break
        }
        case 'year': {
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          matchesDate = transactionDate >= yearAgo
          break
        }
        default: {
          matchesDate = true
          break
        }
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  // Debug logging for transaction filtering
  console.log('🔍 Transaction Filtering Debug:')
  console.log('  - Total transactions:', safeTransactions.length)
  console.log('  - Search term:', searchTerm)
  console.log('  - Status filter:', statusFilter)
  console.log('  - Date filter:', dateFilter)
  console.log('  - Filtered transactions:', filteredTransactions.length)
  console.log('  - Sample transaction:', safeTransactions[0])
  
  // Debug transaction amounts and statuses
  if (safeTransactions.length > 0) {
    console.log('💰 Transaction Amount Debug:')
    safeTransactions.slice(0, 3).forEach((txn, index) => {
      console.log(`  Transaction ${index + 1}:`, {
        id: txn.id,
        merchant: txn.merchant,
        amount: txn.amount,
        purchase: txn.purchase,
        round_up: txn.round_up,
        total_debit: txn.total_debit,
        investable: txn.investable,
        date: txn.date,
        formatted_date: formatDate(txn.date),
        status: txn.status,
        display_status: getStatusText(txn)
      })
      console.log(`  Full Transaction ${index + 1} Object:`, txn)
    })
    
    // Debug ALL transaction statuses
    console.log('📊 Status Summary (all transactions):')
    const statusCounts = {}
    const statusDetails = []
    safeTransactions.forEach(txn => {
      const status = txn.status || 'undefined'
      statusCounts[status] = (statusCounts[status] || 0) + 1
      statusDetails.push({
        id: txn.id,
        merchant: txn.merchant,
        status: status,
        display: getStatusText(txn)
      })
      if (status === 'staged' || status === 'mapped') {
        console.log(`  📌 Transaction ${txn.id} (${txn.merchant}): status="${status}", display="${getStatusText(txn)}"`)
      }
    })
    console.log('  Status counts:', JSON.stringify(statusCounts, null, 2))
    console.log('  All transaction statuses:', statusDetails)
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Pending Business Recognition = transactions that actually need AI mapping
  // These are transactions that:
  // 1. Don't have a ticker (from DB or merchant lookup)
  // 2. Don't have allocations
  // 3. Are not completed
  // 4. Have status pending, needs-recognition, or pending-approval
  const pendingTransactions = safeTransactions.filter(t => {
    const status = (t.status || '').toLowerCase().trim()
    const isCompleted = status === 'completed'
    
    // Completed transactions don't need recognition
    if (isCompleted) return false
    
    // If transaction has allocations, it's already mapped/invested
    if (t.allocations && Array.isArray(t.allocations) && t.allocations.length > 0) {
      return false
    }
    
    // If transaction has a ticker (from DB or merchant lookup), it's already mapped
    if (transactionHasTicker(t)) return false
    
    // Only count transactions that actually need recognition
    return status === 'pending' || 
           status === 'needs-recognition' || 
           status === 'pending-approval' ||
           status === 'pending-mapping'
  })
  
  // Mapped transactions = transactions that are mapped/staged OR have a ticker (ready to invest but not yet completed)
  // This matches the getStatusText logic - if a transaction has a ticker, it's considered "mapped"
  const mappedTransactions = safeTransactions.filter(t => {
    const status = (t.status || '').toLowerCase().trim()
    const isCompleted = status === 'completed'
    
    // If completed, it's not "available to invest" - it's already invested
    if (isCompleted) return false
    
    // If status is mapped or staged, it's available to invest
    if (status === 'mapped' || status === 'staged') return true
    
    // If transaction has a ticker (from DB or merchant lookup), it's considered mapped
    // This matches the getStatusText logic
    if (transactionHasTicker(t)) return true
    
    return false
  })
  
  const completedTransactions = safeTransactions.filter(t => t.status === 'completed')
  
  // Calculate summary metrics from actual transaction data
  // Available to Invest = Round-ups from mapped transactions (ready to invest but not yet invested)
  // What Was Invested = Round-ups from completed transactions (actually invested)
  // Use display round-up amounts (includes current setting for transactions with $0.00)
  const calculatedTotalRoundUps = safeTransactions.reduce((sum, t) => sum + getDisplayRoundUp(t), 0)
  const availableToInvest = mappedTransactions.reduce((sum, t) => sum + getDisplayRoundUp(t), 0)
  const totalInvested = completedTransactions.reduce((sum, t) => sum + getDisplayRoundUp(t), 0)
  const pendingRecognition = pendingTransactions.length

  // Debug logging for summary calculations
  console.log('💰 Summary Calculations Debug:')
  console.log('  - Total Round-ups (from context):', totalRoundUps)
  console.log('  - Total Round-ups (calculated):', calculatedTotalRoundUps)
  console.log('  - Total Invested:', totalInvested)
  console.log('  - Available to Invest:', availableToInvest)
  console.log('  - Mapped Transactions Count:', mappedTransactions.length)
  console.log('  - Mapped Transactions Details:', mappedTransactions.map(t => ({
    id: t.id,
    merchant: t.merchant,
    status: t.status,
    ticker: t.ticker,
    hasTicker: transactionHasTicker(t),
    roundUp: getDisplayRoundUp(t)
  })))
  console.log('  - Pending Recognition:', pendingRecognition)
  console.log('  - Completed Transactions:', completedTransactions.length)
  console.log('  - Total Transactions:', safeTransactions.length)

  return (
    <div className="space-y-6" data-tutorial="transactions-section">
      {/* Receipt Upload Section */}
      {showReceiptUpload && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Upload Receipt or Invoice</h2>
            <button
              onClick={() => setShowReceiptUpload(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <ReceiptUpload 
            onTransactionProcessed={async (transaction) => {
              console.log('[BusinessTransactions] Receipt transaction processed:', transaction)
              // Refresh transactions after receipt processing
              if (transaction?.success || transaction?.transactionId) {
                console.log('[BusinessTransactions] Transaction created successfully, refreshing list...')
                console.log('[BusinessTransactions] Transaction ID:', transaction.transactionId)
                
                // Wait longer to ensure transaction is committed to database and LLM mapping is created
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                // Use DataContext's refreshData to reload all transactions from API
                try {
                  console.log('[BusinessTransactions] Calling refreshData() to reload transactions...')
                  if (refreshData) {
                    await refreshData()
                    console.log('[BusinessTransactions] ✅ refreshData() completed')
                    
                    // Wait a bit more and check if transaction appears
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    
                    // Force another refresh to ensure we have the latest data
                    await refreshData()
                    console.log('[BusinessTransactions] ✅ Second refreshData() completed')
                  } else {
                    console.warn('[BusinessTransactions] ⚠️ refreshData not available, falling back to manual refresh')
                    
                    // Fallback: manual refresh
                    const token = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
                    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                    const response = await fetch(`${apiBaseUrl}/api/business/transactions`, {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    })
                    
                    if (response.ok) {
                      const data = await response.json()
                      if (data.success && data.data) {
                        const transactionList = Array.isArray(data.data) ? data.data : (data.data.transactions || [])
                        console.log('[BusinessTransactions] ✅ Manual refresh completed:', transactionList.length, 'transactions')
                        
                        // Update transactions state directly
                        if (setTransactions) {
                          setTransactions(transactionList)
                          console.log('[BusinessTransactions] ✅ Transactions state updated with', transactionList.length, 'transactions')
                        }
                        
                        // Check if the new transaction is in the list
                        const newTransaction = transactionList.find(t => t.id === transaction.transactionId || t.id?.toString() === transaction.transactionId?.toString())
                        if (newTransaction) {
                          console.log('[BusinessTransactions] ✅ New transaction found in list:', newTransaction.id)
                        } else {
                          console.warn('[BusinessTransactions] ⚠️ New transaction NOT found in list. Transaction ID:', transaction.transactionId)
                          console.log('[BusinessTransactions] Available transaction IDs:', transactionList.map(t => t.id))
                          console.log('[BusinessTransactions] Transaction merchant:', transaction.merchant || transaction.description)
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error('[BusinessTransactions] Error refreshing transactions:', error)
                  // Fallback to page reload if API refresh fails
                  console.log('[BusinessTransactions] Reloading page as fallback...')
                  setTimeout(() => window.location.reload(), 1000)
                }
              } else {
                console.warn('[BusinessTransactions] Transaction processing did not indicate success:', transaction)
              }
              setShowReceiptUpload(false)
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Business Transactions</h1>
          <p className="text-gray-400 mt-1">Track your business round-ups and investments</p>
        </div>
        <div className="flex space-x-3">
          {!showReceiptUpload && (
            <button 
              onClick={() => setShowReceiptUpload(true)}
              className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg px-4 py-2 text-purple-400 flex items-center space-x-2 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Receipt</span>
            </button>
          )}
          <button 
            onClick={handleUploadCSV}
            className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Business CSV</span>
          </button>
          <button 
            onClick={() => {
              // TODO: Implement bank sync functionality
                  addNotification({
                type: 'info',
                title: 'Bank Sync Coming Soon',
                message: 'Bank synchronization feature will be available in a future update.'
              })
            }}
            className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg px-4 py-2 text-purple-400 flex items-center space-x-2 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Bank Sync</span>
          </button>
          <button 
            onClick={handleExport}
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 flex items-center space-x-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Available to Invest</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(availableToInvest, '$', 2)}</p>
              <p className="text-green-400 text-sm flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Ready for business investment
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">What Was Invested</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalInvested, '$', 2)}</p>
              <p className="text-blue-400 text-sm flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {completedTransactions.length} completed investments
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Business Recognition</p>
              <p className="text-2xl font-bold text-white">{pendingRecognition}</p>
              <p className="text-yellow-400 text-sm flex items-center mt-1">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Needs AI mapping
              </p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search business merchants or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
          </div>
          <div className="flex gap-4">
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={getSelectClass()}
        >
          <option value="all">All Types</option>
          <option value="bank">Bank</option>
          <option value="receipt">Receipt</option>
        </select>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={getSelectClass()}
        >
          <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="pending-approval">Pending Approval</option>
            <option value="mapped">Mapped</option>
            <option value="staged">Staged</option>
            <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="needs-recognition">Needs Recognition</option>
        </select>
        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={getSelectClass()}
        >
          <option value="all">All Time</option>
              <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
              <option value="year">This Year</option>
        </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Merchant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Purchase</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Round-Up</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Investment</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Total Debit</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 bg-white/5 rounded-full">
                        <DollarSign className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-medium">No business transactions yet</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          Upload your business bank statement to start tracking round-ups and investments
                        </p>
                      </div>
                      <button 
                        onClick={handleUploadCSV}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Business CSV</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTransactions.map((transaction) => {
                  const hasAllocations = transaction.allocations && transaction.allocations.length > 0
                  
                  return (
                    <React.Fragment key={transaction.id}>
                      {/* Parent Transaction Row */}
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white">{formatDate(transaction.date)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            (transaction.transaction_type || 'bank') === 'receipt' 
                              ? 'bg-purple-500/20 text-purple-300' 
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {(transaction.transaction_type || 'bank') === 'receipt' ? 'Receipt' : 'Bank'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white">{transaction.merchant || transaction.description || 'Unknown'}</td>
                        <td className="py-3 px-4 text-gray-300">{transaction.category || 'General'}</td>
                        <td className="py-3 px-4 text-right text-white">{formatCurrency(transaction.amount || transaction.purchase, '$', 2)}</td>
                        <td className="py-3 px-4 text-right text-green-400">{formatCurrency(getDisplayRoundUp(transaction), '$', 2)}</td>
                        <td className="py-3 px-4 text-center">
                          {hasAllocations ? (
                            <span className="text-gray-400 text-xs">{transaction.allocations.length} allocation{transaction.allocations.length !== 1 ? 's' : ''}</span>
                          ) : (() => {
                            // Try to get ticker from transaction, or lookup from merchant name
                            // Check multiple possible ticker fields
                            let ticker = transaction.ticker || transaction.stock_symbol || transaction.ticker_symbol
                            
                            // If no ticker but we have a merchant, try to look it up from merchant name
                            if (!ticker) {
                              const merchantName = transaction.merchant || transaction.description || ''
                              if (merchantName) {
                                // Use merchant-to-ticker mapping (same logic as UserTransactions)
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
                                
                                // Check merchant name against map (case-insensitive)
                                const merchantUpper = merchantName.toUpperCase().trim()
                                
                                // Try exact match first
                                if (merchantTickerMap[merchantUpper]) {
                                  ticker = merchantTickerMap[merchantUpper]
                                  console.log(`🔍 BusinessTransactions: Found ticker for ${merchantName} → ${ticker} (exact match)`)
                                } else {
                                  // Try partial match - check if merchant contains any key
                                  for (const [key, value] of Object.entries(merchantTickerMap)) {
                                    if (merchantUpper.includes(key)) {
                                      ticker = value
                                      console.log(`🔍 BusinessTransactions: Found ticker for ${merchantName} → ${ticker} (partial match: ${key})`)
                                      break
                                    }
                                  }
                                }
                                
                                if (!ticker) {
                                  console.log(`⚠️ BusinessTransactions: No ticker found for merchant: ${merchantName}`)
                                }
                              }
                            }
                            
                            // Show investment if we have a ticker (regardless of status, same as UserTransactions)
                            // This allows pending transactions to show investments when merchant can be mapped
                            if (ticker) {
                              return (
                                <div className="flex flex-col items-center justify-center space-y-1">
                                  <CompanyLogo 
                                    symbol={ticker} 
                                    name={getCompanyName(ticker)}
                                    size="w-6 h-6" 
                                    clickable={true} 
                                  />
                                  <div className="text-green-400 font-medium text-xs">
                                    {calculateShares(getDisplayRoundUp(transaction), ticker)}
                                  </div>
                                </div>
                              )
                            }
                            
                            // No investment available
                            return <span className="text-gray-400 text-sm">-</span>
                          })()}
                        </td>
                        <td className="py-3 px-4 text-right text-white font-semibold">
                          {formatCurrency((transaction.amount || transaction.purchase) + getDisplayRoundUp(transaction), '$', 2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center space-y-1">
                            {(() => {
                              const rawStatus = transaction.status
                              const statusText = getStatusText(transaction)
                              // Debug for staged/mapped transactions
                              if (rawStatus === 'staged' || rawStatus === 'mapped') {
                                console.log(`[Status Render] Transaction ID: ${transaction.id}, Merchant: ${transaction.merchant}, Raw Status: "${rawStatus}", Display Text: "${statusText}"`)
                              }
                              return (
                                <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center space-x-1 ${getStatusColor(transaction)}`}>
                                  {getStatusIcon(transaction)}
                                  <span className="capitalize">{statusText}</span>
                                </span>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center min-w-[120px]">
                          <div className="flex justify-center items-center space-x-1">
                            {/* Check if user has already submitted a mapping for this transaction */}
                            {(() => {
                              // Check if this transaction has a user-submitted mapping
                              const hasUserMapping = userMappings && userMappings.some(mapping => 
                                mapping.transaction_id === transaction.id && mapping.user_id
                              )
                              
                              // Use display status (same logic as UserTransactions)
                              // Get the actual status for logic checks
                              const rawStatus = (transaction.status || '').toLowerCase().trim()
                              const displayStatus = getStatusText(transaction).toLowerCase()
                              
                              // Determine if transaction needs mapping (same logic as UserTransactions)
                              // Only show edit/retry if:
                              // 1. No user mapping exists
                              // 2. Transaction is actually pending or needs-recognition (not mapped/completed)
                              // 3. Transaction doesn't have a ticker (not already mapped)
                              const needsMapping = !hasUserMapping && 
                                                   (rawStatus === 'pending' || rawStatus === 'needs-recognition') &&
                                                   !transactionHasTicker(transaction) &&
                                                   displayStatus !== 'mapped' &&
                                                   displayStatus !== 'completed'
                              
                              return (
                                <>
                                  {/* Show edit button ONLY if transaction needs mapping (same logic as UserTransactions) */}
                                  {needsMapping && (
                                    <button 
                                      onClick={() => handleEditTransaction(transaction.id)}
                                      className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/10 transition-colors"
                                      title="Edit AI Mapping"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  {/* Show retry button ONLY if transaction needs mapping (same logic as UserTransactions) */}
                                  {needsMapping && (
                                    <button 
                                      onClick={(e) => handleRetryMapping(transaction.id, e)}
                                      className="text-yellow-400 hover:text-yellow-300 p-1 rounded hover:bg-yellow-500/10 transition-colors"
                                      title="Retry AI Mapping"
                                    >
                                      <AlertTriangle className="w-4 h-4" />
                                    </button>
                                  )}
                                  {/* Show pending approval status if user has submitted mapping (same logic as UserTransactions) */}
                                  {hasUserMapping && (rawStatus === 'pending' || rawStatus === 'needs-recognition') && (
                                    <div className="text-orange-400 p-1" title="Mapping Submitted - Pending Approval">
                                      <Clock className="w-4 h-4" />
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                            {/* Show success icon for mapped transactions (same logic as UserTransactions) */}
                            {(() => {
                              const displayStatus = getStatusText(transaction).toLowerCase()
                              // Show success icon if transaction is mapped (includes transactions with tickers)
                              const isMapped = displayStatus === 'mapped'
                              return isMapped ? (
                                <div className="text-green-400 p-1" title="Successfully Mapped">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              ) : null
                            })()}
                            <button 
                              onClick={() => handleViewDetails(transaction.id)}
                              className="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-gray-500/10 transition-colors" 
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Child Rows for Allocations */}
                      {hasAllocations && transaction.allocations.map((alloc, idx) => (
                        <tr key={`${transaction.id}-alloc-${idx}`} className="border-b border-white/5 bg-white/2 hover:bg-white/5">
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
                                {formatCurrency(alloc.allocation_amount || alloc.amount || 0, '$', 2)}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4">
                            <button
                              onClick={() => handleViewAllocationDetails(transaction, alloc)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/10 transition-colors"
                              title="View Allocation Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
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
        {filteredTransactions.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6">
            <div className={`text-sm mr-4 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
              {formatNumber(startIndex + 1)}-{formatNumber(Math.min(endIndex, filteredTransactions.length))} of {formatNumber(filteredTransactions.length)}
            </div>
            <div className="flex items-center space-x-3">
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    page === currentPage
                      ? isLightMode
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-500 text-white'
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

      {/* Edit Transaction Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Edit AI Mapping</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                  <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mapping ID</label>
                  <input 
                    type="text" 
                    value={mappingForm.mapping_id || `AIM${Math.floor(Math.random() * 9000000) + 1000000}`}
                    readOnly
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-gray-400 backdrop-blur-sm font-mono"
                  />
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Merchant Name (Bank Data)</label>
                <input 
                  type="text" 
                  value={mappingForm.merchant}
                    readOnly
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-gray-400 backdrop-blur-sm"
                    placeholder="Original bank transaction data"
                  />
                  <p className="text-xs text-gray-400 mt-1">This is the original transaction data from your bank</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name (Your Suggestion)</label>
                  <input 
                    type="text" 
                    value={mappingForm.companyName}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                    placeholder="What company do you think this is?"
                  />
                  <p className="text-xs text-gray-400 mt-1">Stock ticker will be automatically looked up from your suggestion</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stock Ticker</label>
                <input 
                  type="text" 
                  value={mappingForm.ticker}
                    onChange={(e) => setMappingForm(prev => ({ ...prev, ticker: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                    placeholder="Auto-populated from your company suggestion"
                  />
                  <p className="text-xs text-gray-400 mt-1">You can edit this if the auto-lookup is incorrect</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select 
                  value={mappingForm.category}
                  onChange={(e) => setMappingForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                  >
                    <option>Food & Dining</option>
                    <option>Shopping</option>
                    <option>Transportation</option>
                    <option>Entertainment</option>
                    <option>Technology</option>
                    <option>Healthcare</option>
                    <option>Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confidence Level</label>
                <select 
                  value={mappingForm.confidence}
                  onChange={(e) => setMappingForm(prev => ({ ...prev, confidence: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                  >
                    <option>Very High</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                    <option>Very Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes</label>
                <textarea 
                  value={mappingForm.notes}
                  onChange={(e) => setMappingForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none backdrop-blur-sm"
                    placeholder="Any additional context that might help the AI..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all backdrop-blur-sm"
              >
                Cancel
              </button>
              <button 
                  onClick={async () => {
                    try {
                      console.log('🚀 BUSINESS SUBMIT MAPPING CLICKED!')
                      console.log('🔍 Selected Transaction ID:', selectedTransaction)
                      console.log('🔍 Mapping Form:', mappingForm)
                      console.log('🔍 Current Transactions Count:', transactions.length)
                      console.log('🔍 Sample Transaction IDs:', transactions.slice(0, 3).map(t => ({ id: t.id, type: typeof t.id })))
                      
                      // Submit mapping to backend
                            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                      const response = await fetch(`${apiBaseUrl}/api/business/submit-mapping`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('kamioi_user_token')}`
                        },
                        body: JSON.stringify({
                          transaction_id: selectedTransaction,
                          mapping_id: mappingForm.mapping_id,
                          merchant_name: mappingForm.merchant,
                          company_name: mappingForm.companyName,
                          ticker_symbol: mappingForm.ticker,
                          category: mappingForm.category,
                          confidence: parseConfidenceToNumber(mappingForm.confidence),
                          notes: mappingForm.notes,
                          dashboard_type: 'business'
                        })
                      })
                      
                      if (response.ok) {
                        const result = await response.json()
                        if (result.success) {
                          console.log('✅ Business mapping submitted successfully, updating transaction status...')
                          console.log('🔍 Selected transaction ID:', selectedTransaction)
                          console.log('🔍 Current transactions:', transactions.length)
                          
                          // Update transaction status to pending approval
                          const updatedTransactions = transactions.map(t => {
                            if (t.id === selectedTransaction) {
                              console.log('✅ Found transaction to update:', t.id, '→ pending-approval')
                              return { ...t, status: 'pending-approval', ticker: mappingForm.ticker }
                            }
                            return t
                          })
                          
                          console.log('🔍 Updated transactions:', updatedTransactions.length)
                          setTransactions(updatedTransactions)
                          
                          // Refresh user mappings to update the UI
                          const authToken = localStorage.getItem('kamioi_user_token') || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken') || null
                                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                          const mappingResponse = await fetch(`${apiBaseUrl}/api/business/ai/insights`, {
                            headers: {
                              'Authorization': `Bearer ${authToken}`
                            }
                          })
                          if (mappingResponse.ok) {
                            const mappingData = await mappingResponse.json()
                            if (mappingData.success && mappingData.data) {
                              setUserMappings(mappingData.data)
                              console.log('✅ Business mappings refreshed:', mappingData.data.length, 'mappings')
                            }
                          }
                          
                          showSuccessModal(
                            'Mapping Submitted',
                            'Your AI mapping has been submitted for review!'
                          )
                          setShowEditModal(false)
                        } else {
                          throw new Error(result.error || 'Failed to submit mapping')
                        }
                      } else {
                        throw new Error('Network error')
                      }
                    } catch (error) {
                      console.error('Submit mapping failed:', error)
                      showErrorModal(
                        'Submission Failed',
                        'Failed to submit mapping. Please try again.'
                      )
                    }
                  }}
                  className="flex-1 bg-blue-500/80 hover:bg-blue-600/80 text-white py-2 px-4 rounded-lg transition-all backdrop-blur-sm border border-blue-400/30"
                >
                  Submit Mapping
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">
                  {selectedAllocation ? 'Allocation Details' : 'Transaction Details'}
                </h2>
                <button 
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedAllocation(null)
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {selectedAllocation ? (
                // Show allocation details
                <TransactionDetails 
                  transaction={selectedTransaction} 
                  allocation={selectedAllocation}
                />
              ) : (
                <>
                  <div className="flex space-x-2 mb-8">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`px-4 py-2 rounded-lg transition-colors backdrop-blur-sm ${
                        activeTab === 'details'
                          ? 'bg-blue-500/80 text-white border border-blue-400/30'
                          : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setActiveTab('mapping')}
                      className={`px-4 py-2 rounded-lg transition-colors backdrop-blur-sm ${
                        activeTab === 'mapping'
                          ? 'bg-blue-500/80 text-white border border-blue-400/30'
                          : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      AI Mapping
                    </button>
                    <button
                      onClick={() => setActiveTab('investment')}
                      className={`px-4 py-2 rounded-lg transition-colors backdrop-blur-sm ${
                        activeTab === 'investment'
                          ? 'bg-blue-500/80 text-white border border-blue-400/30'
                          : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      Investment
                    </button>
                  </div>
                  
                  {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Transaction ID</label>
                      <p className="text-white font-medium">TXN-{selectedTransaction?.id?.toString().slice(-3)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Date</label>
                      <p className="text-white font-medium">{formatDate(selectedTransaction?.date)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Merchant</label>
                    <p className="text-white font-medium">{selectedTransaction?.merchant || selectedTransaction?.description}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Category</label>
                    <p className="text-white font-medium">{selectedTransaction?.category || 'Unknown'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Amount</label>
                      <p className="text-white font-medium">{formatCurrency(selectedTransaction?.amount, '$', 2)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Round-up</label>
                      <p className="text-white font-medium">{formatCurrency(selectedTransaction ? getDisplayRoundUp(selectedTransaction) : 0, '$', 2)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Total Debit</label>
                      <p className="text-white font-medium">{formatCurrency(selectedTransaction?.total_debit, '$', 2)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'mapping' && (
                <div className="space-y-6">
                  {selectedTransaction ? (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">AI Mapping Analysis</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">Status</label>
                          <p className="text-white font-medium capitalize">{mappingDetails?.status || selectedTransaction?.status || 'Unknown'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Mapped Company</label>
                          <p className="text-white font-medium">{getCompanyName(mappingDetails?.ticker_symbol || selectedTransaction?.ticker) || 'Unknown Company'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Stock Ticker</label>
                          <p className="text-white font-medium">{mappingDetails?.ticker_symbol || selectedTransaction?.ticker || 'Not mapped'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Category</label>
                          <p className="text-white font-medium">{mappingDetails?.category || selectedTransaction?.category || 'Not categorized'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Confidence Score</label>
                          <p className="text-white font-medium">{mappingDetails?.confidence_status || selectedTransaction?.confidence_status || 'Medium'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Mapping ID</label>
                          <p className="text-white font-medium">{mappingDetails?.mapping_id || selectedTransaction?.mapping_id || 'AIM' + Math.floor(Math.random() * 9000000 + 1000000)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Mapping Source</label>
                          <p className="text-white font-medium">{mappingDetails?.source || selectedTransaction?.source || 'AI Analysis'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Analysis Date</label>
                          <p className="text-white font-medium">{mappingDetails?.submitted_at ? formatDate(mappingDetails.submitted_at) : (selectedTransaction?.analyzed_at ? formatDate(selectedTransaction.analyzed_at) : 'Recently processed')}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Processing Time</label>
                          <p className="text-white font-medium">Real-time</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Notes</label>
                          <p className="text-white font-medium">{mappingDetails?.notes || selectedTransaction?.notes || 'No notes provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">User ID</label>
                          <p className="text-white font-mono text-sm">
                            {selectedTransaction?.user_id || 
                             mappingDetails?.user_id || 
                             userId || 
                             user?.id || 
                             'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No AI Mapping Available</h3>
                      <p className="text-gray-400">This transaction hasn't been analyzed by AI yet.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'investment' && (
                <div className="space-y-6">
                  {selectedTransaction ? (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Investment Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">Investment Status</label>
                          <p className="text-white font-medium capitalize">{mappingDetails?.status || selectedTransaction.status || 'Pending'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Company</label>
                          <p className="text-white font-medium">{mappingDetails?.merchant_name || getCompanyName(selectedTransaction.ticker) || 'Unknown Company'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Stock Symbol</label>
                          <p className="text-white font-medium">{mappingDetails?.ticker_symbol || selectedTransaction.ticker || 'Not available'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Round-up Amount</label>
                          <p className="text-white font-medium">{formatCurrency(getDisplayRoundUp(selectedTransaction), '$', 2)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Shares Purchased</label>
                          <p className="text-white font-medium">{calculateShares(getDisplayRoundUp(selectedTransaction), selectedTransaction.ticker)} shares</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Current Value</label>
                          <p className="text-white font-medium">{formatCurrency(getDisplayRoundUp(selectedTransaction), '$', 2)} (Initial investment)</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Investment Date</label>
                          <p className="text-white font-medium">{formatDate(selectedTransaction.date)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Portfolio Impact</label>
                          <p className="text-white font-medium">Added to business portfolio</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Investment Details</h3>
                      <p className="text-gray-400">Investment information will be available once the transaction is processed.</p>
                    </div>
                  )}
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing Bar */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">Processing Transactions</h3>
              <p className="text-gray-300 mb-6">{processingMessage}</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-400">{processingProgress}% Complete</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BusinessTransactions
