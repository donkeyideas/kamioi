import React, { useState } from 'react'
import { Download, Search, Filter, Edit, Eye, CheckCircle, AlertTriangle, Clock, DollarSign, TrendingUp, ExternalLink, ChevronLeft, ChevronRight, X, Upload, User } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useTheme } from '../../context/ThemeContext'
import { useParams } from 'react-router-dom'
import statusSyncService from '../../services/StatusSyncService'
// Version check for dynamic CSV parser
console.log('🔧 FamilyTransactions.jsx - Dynamic Parser V2.0 Loaded!', new Date().toISOString())
import { useModal } from '../../context/ModalContext'
import { useNotifications } from '../../hooks/useNotifications'
import CompanyLogo from '../common/CompanyLogo'
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters'
import MXConnectWidget from '../common/MXConnectWidget'

  // Company data lookup - this should ideally come from API or transaction data
  // Keeping minimal fallback for company names/logos - actual data should come from transaction.company_name or API
  const getCompanyData = (ticker, companyName = null) => {
    if (!ticker) return { domain: 'example.com', logo: null, name: 'Unknown' }
    
    // Use company name from transaction if provided, otherwise generate from ticker
    const name = companyName || ticker
    
    // Generate logo URL dynamically (fallback - should come from transaction or API)
    const logo = ticker ? `https://logo.clearbit.com/${ticker.toLowerCase()}.com` : null
    
    return { 
      domain: ticker ? `${ticker.toLowerCase()}.com` : 'example.com', 
      logo, 
      name 
    }
  }

// Helper function to get company domain from ticker
const getCompanyDomain = (ticker, companyName = null) => {
  return getCompanyData(ticker, companyName).domain
}

// Helper function to get company logo
const getCompanyLogo = (ticker, companyName = null) => {
  return getCompanyData(ticker, companyName).logo
}

// Helper function to get company name
const getCompanyName = (ticker, companyName = null) => {
  return getCompanyData(ticker, companyName).name
}


// Simple fallback logo creation without Unicode issues
const createCompanyLogo = (ticker) => {
  const canvas = document.createElement('canvas')
  canvas.width = 24
  canvas.height = 24
  const ctx = canvas.getContext('2d')
  
  // Use default colors (remove hardcoded per-company colors)
  // Company-specific colors should come from API or be generated dynamically
  const style = { color: '#4F46E5', bg: '#FFFFFF' }
  
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
let familyStockPriceCache = {}

// Fetch real stock prices from API
const fetchFamilyStockPrices = async (tickers) => {
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
          familyStockPriceCache[symbol] = info.price
        })
        console.log('Family: Updated stock prices:', familyStockPriceCache)
      }
    }
  } catch (error) {
    console.error('Error fetching stock prices:', error)
  }
}

// Helper function to calculate shares using cached prices
const calculateShares = (amount, ticker, stockPrice = null) => {
  if (!ticker || !amount) {
    return null
  }

  // Use provided price, cached price, or minimal fallback
  if (!stockPrice) {
    stockPrice = familyStockPriceCache[ticker?.toUpperCase()] || 100
  }

  const shares = amount / stockPrice

  if (shares < 0.01) {
    return '<0.01'
  }

  return shares.toFixed(3)
}

const FamilyTransactions = ({ user }) => {
  const { userId } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
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
  const [showMXConnect, setShowMXConnect] = useState(false)
  
  const [mappingForm, setMappingForm] = useState({
    merchant: '',
    companyName: '',
    ticker: '',
    category: 'Food & Dining',
    confidence: 'High (90-100%)',
    notes: ''
  })
  
  const itemsPerPage = 10
  const { transactions, totalRoundUps, setTransactions, addTransactions } = useData()
  
  // Safety check: ensure transactions is an array (declare after hook call)
  const safeTransactions = Array.isArray(transactions) ? transactions : []

  // Fetch real stock prices for all tickers in transactions
  useEffect(() => {
    if (safeTransactions && safeTransactions.length > 0) {
      const tickers = safeTransactions
        .map(t => t.ticker)
        .filter(t => t && t !== 'UNKNOWN' && t !== 'Unknown')
      if (tickers.length > 0) {
        fetchFamilyStockPrices(tickers)
      }
    }
  }, [safeTransactions])

  // Status synchronization - listen for status updates from other dashboards
  React.useEffect(() => {
    const handleStatusUpdate = (update) => {
      console.log('📡 FamilyTransactions - Received status update:', update)
      
      // Update the transaction in the local state
      setTransactions(prevTransactions => {
        return prevTransactions.map(transaction => {
          if (transaction.id === update.transactionId) {
            console.log(`🔄 FamilyTransactions - Updating transaction ${update.transactionId} status: ${transaction.status} -> ${update.newStatus}`)
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
    statusSyncService.subscribe('family', handleStatusUpdate)

    // Cleanup on unmount
    return () => {
      statusSyncService.unsubscribe('family', handleStatusUpdate)
    }
  }, [setTransactions])

  // Function to update transaction status and notify other dashboards
  const updateTransactionStatus = (transactionId, newStatus) => {
    console.log(`🔄 FamilyTransactions - Updating transaction ${transactionId} to status: ${newStatus}`)
    
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
    statusSyncService.updateStatus(transactionId, newStatus, 'family')
  }
  
  // Debug: Log transactions data
  console.log('🔄 FamilyTransactions - Received transactions:', {
    count: transactions?.length || 0,
    transactions: transactions,
    transactionsType: typeof transactions,
    isArray: Array.isArray(transactions),
    totalRoundUps
  })
  const { addNotification } = useNotifications()
  const { showSuccessModal, showErrorModal } = useModal()
  const { isLightMode } = useTheme()
  const [roundUpAmount, setRoundUpAmount] = useState(1)
  const [roundUpEnabled, setRoundUpEnabled] = useState(true)
  
  // Load round-up settings for display purposes
  React.useEffect(() => {
    const loadRoundUpSettings = () => {
      const saved = localStorage.getItem('kamioi_family_round_up_amount')
      const savedEnabled = localStorage.getItem('kamioi_family_round_up_enabled')
      if (saved) setRoundUpAmount(parseInt(saved))
      if (savedEnabled !== null) setRoundUpEnabled(savedEnabled === 'true')
      
      // Also fetch from API
      const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
      if (token) {
              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        fetch(`${apiBaseUrl}/api/family/settings/roundup`, {
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
            localStorage.setItem('kamioi_family_round_up_amount', (data.round_up_amount || 1).toString())
            localStorage.setItem('kamioi_family_round_up_enabled', (data.round_up_enabled !== false).toString())
          }
        })
        .catch(() => {})
      }
    }
    
    loadRoundUpSettings()
    
    // Listen for settings updates
    const handleSettingsUpdate = (event) => {
      if (event.detail?.dashboardType === 'family' || !event.detail?.dashboardType) {
        if (event.detail?.amount !== undefined) setRoundUpAmount(event.detail.amount)
        if (event.detail?.enabled !== undefined) setRoundUpEnabled(event.detail.enabled)
      }
    }
    
    window.addEventListener('roundUpSettingsUpdated', handleSettingsUpdate)
    
    return () => {
      window.removeEventListener('roundUpSettingsUpdated', handleSettingsUpdate)
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

  const getStatusColor = (transaction) => {
    // Use LLM status field directly
    switch (transaction.status) {
      case 'completed': return 'bg-green-500/20 text-green-400' // Approved and stock purchased
      case 'mapped': return 'bg-green-500/20 text-green-400' // AI mapped successfully
      case 'pending-mapping': return 'bg-orange-500/20 text-orange-400' // Submitted for admin review
      case 'pending-approval': return 'bg-yellow-500/20 text-yellow-400' // User submitted mapping awaiting review
      case 'needs-recognition': return 'bg-yellow-500/20 text-yellow-400' // LLM needs help
      case 'pending': return 'bg-gray-500/20 text-gray-400' // Default pending
      case 'staged': return 'bg-blue-500/20 text-blue-400' // Staged for purchase
      case 'no-investment': return 'bg-gray-500/20 text-gray-400' // No investment
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (transaction) => {
    // Use LLM status field directly
    switch (transaction.status) {
      case 'completed': return <CheckCircle className="w-4 h-4" /> // Approved and stock purchased
      case 'mapped': return <CheckCircle className="w-4 h-4" /> // AI mapped successfully
      case 'pending-mapping': return <Clock className="w-4 h-4" /> // Submitted for admin review
      case 'pending-approval': return <Clock className="w-4 h-4" /> // User submitted mapping awaiting review
      case 'needs-recognition': return <Eye className="w-4 h-4" /> // LLM needs help
      case 'pending': return <Clock className="w-4 h-4" /> // Default pending
      case 'staged': return <Clock className="w-4 h-4" /> // Staged for purchase
      case 'no-investment': return <AlertTriangle className="w-4 h-4" /> // No investment
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getStatusText = (transaction) => {
    // Use LLM status field directly
    switch (transaction.status) {
      case 'completed': return 'Completed' // Approved and stock purchased
      case 'mapped': return 'Mapped' // AI mapped successfully
      case 'pending-mapping': return 'Pending Mapping' // Submitted for admin review
      case 'pending-approval': return 'Pending Approval' // User submitted mapping awaiting review
      case 'needs-recognition': return 'Needs Recognition' // LLM needs help
      case 'pending': return 'Pending' // Default pending
      case 'staged': return 'Staged' // Staged for purchase
      case 'no-investment': return 'No Investment' // No investment
      default: return 'Unknown'
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

  // Debounce timer for ticker lookup
  const tickerLookupTimerRef = React.useRef(null)

  const lookupStockTicker = async (companyName) => {
    if (!companyName || companyName.length < 3) {
      console.log('🔍 Ticker lookup skipped - company name too short:', companyName)
      return null
    }

    console.log('🔍 Looking up ticker for:', companyName)
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/lookup/ticker?company=${encodeURIComponent(companyName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.ticker) {
          console.log('✅ Ticker found from LLM center:', data.ticker, 'Method:', data.method || 'llm_mapping')
          
          // Return both ticker and category if available
          return {
            ticker: data.ticker,
            category: data.category,
            company_name: data.company_name
          }
        } else {
          console.log('❌ No ticker found for:', companyName)
          return null
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.log('❌ Ticker lookup failed:', response.status, errorData.error || '')
        return null
      }
    } catch (error) {
      console.error('❌ Ticker lookup error:', error)
      return null
    }
  }

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (tickerLookupTimerRef.current) {
        clearTimeout(tickerLookupTimerRef.current)
      }
    }
  }, [])

  const handleCompanyNameChange = async (companyName) => {
    // Update company name - keep user's input exactly as they typed it
    setMappingForm(prev => ({ ...prev, companyName }))
    
    // Clear previous debounce timer
    if (tickerLookupTimerRef.current) {
      clearTimeout(tickerLookupTimerRef.current)
    }
    
    // Auto-lookup ticker when company name changes (with debouncing)
    // Only the ticker field gets auto-populated, NOT the company name
    if (companyName && companyName.length >= 3) {
      // Debounce: wait 500ms after user stops typing
      tickerLookupTimerRef.current = setTimeout(async () => {
        const result = await lookupStockTicker(companyName)
        if (result) {
          setMappingForm(prev => ({
            ...prev,
            ticker: result.ticker,
            // Only update category if available, but NEVER change companyName
            // Company Name stays exactly as user typed it
            ...(result.category && { category: result.category })
          }))
          console.log('✅ Auto-populated ticker:', result.ticker, 'from LLM center (company name preserved)')
        } else {
          // Clear ticker if no match found, but keep company name unchanged
          setMappingForm(prev => ({ ...prev, ticker: '' }))
        }
      }, 500) // 500ms debounce delay
    } else {
      // Clear ticker if input is too short, but keep company name unchanged
      setMappingForm(prev => ({ ...prev, ticker: '' }))
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
    setSelectedTransaction(transaction)
    setShowViewModal(true)
    
    // Fetch user's mapping data for this transaction
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/ai/insights`, {
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

  const handleUploadCSV = () => {
    console.log('🔧 handleUploadCSV called from FamilyTransactions component')
    // Trigger the file input click to open file dialog
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.csv'
    fileInput.style.display = 'none'
    document.body.appendChild(fileInput)
    
    fileInput.onchange = async (event) => {
      const file = event.target.files[0]
      if (file) {
        console.log('🔧 Family CSV file selected:', file.name)
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
          
            console.log('🔧 Family CSV parsed:', transactions.length, 'transactions')
            
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
              message: `Family transactions uploaded and processed successfully! ${transactions.length} transactions processed.`
          })
        }
        reader.readAsText(file)
        } catch (error) {
          console.error('❌ Family CSV upload failed:', error)
        addNotification({
            type: 'error',
            title: 'CSV Upload Failed',
            message: 'Failed to upload family transactions. Please try again.'
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
      const response = await fetch(`${apiBaseUrl}/api/family/export/transactions`, {
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
          link.download = `family-transactions-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          showSuccessModal(
            'Export Successful',
            'Family transactions exported successfully!'
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
    const merchant = transaction.merchant || transaction.description || 'Unknown'
    const category = transaction.category || 'General'
    const matchesSearch = merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.toLowerCase().includes(searchTerm.toLowerCase())
    // Handle staged/mapped equivalence - they are the same in the workflow
    let matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
    
    // If filtering for "staged", also include "mapped" transactions (they are equivalent)
    if (statusFilter === 'staged') {
      matchesStatus = transaction.status === 'staged' || transaction.status === 'mapped'
    }
    
    // If filtering for "mapped", also include "staged" transactions (they are equivalent)  
    if (statusFilter === 'mapped') {
      matchesStatus = transaction.status === 'mapped' || transaction.status === 'staged'
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
  
  // Debug transaction amounts
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
        formatted_date: formatDate(txn.date)
      })
      console.log(`  Full Transaction ${index + 1} Object:`, txn)
    })
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Calculate summary metrics from actual transaction data
  const pendingTransactions = safeTransactions.filter(t => 
    t.status === 'pending' || 
    t.status === 'needs-recognition' || 
    t.status === 'pending-approval'
  )
  const mappedTransactions = safeTransactions.filter(t => t.status === 'mapped')
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
  console.log('  - Pending Recognition:', pendingRecognition)
  console.log('  - Completed Transactions:', completedTransactions.length)
  console.log('  - Total Transactions:', safeTransactions.length)

  return (
    <div className="space-y-6" data-tutorial="transactions-section">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Family Transactions</h1>
          <p className="text-gray-400 mt-1">Track your family round-ups and investments</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowMXConnect(true)}
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
                Ready for family investment
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
              <p className="text-gray-400 text-sm">Pending Family Recognition</p>
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
            placeholder="Search family merchants or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
          </div>
          <div className="flex gap-4">
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
                  <td colSpan="9" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 bg-white/5 rounded-full">
                        <DollarSign className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-medium">No family transactions yet</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          Connect your bank account to start tracking round-ups and investments
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowMXConnect(true)}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Connect Bank Account</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-white">{formatDate(transaction.date)}</td>
                  <td className="py-3 px-4 text-white">{transaction.merchant || transaction.description || 'Unknown'}</td>
                  <td className="py-3 px-4 text-gray-300">{transaction.category || 'General'}</td>
                  <td className="py-3 px-4 text-right text-white">{formatCurrency(transaction.amount || transaction.purchase, '$', 2)}</td>
                  <td className="py-3 px-4 text-right text-green-400">{formatCurrency(getDisplayRoundUp(transaction), '$', 2)}</td>
                  <td className="py-3 px-4 text-center">
                    {(transaction.status === 'mapped' || transaction.status === 'completed') && transaction.ticker ? (
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <CompanyLogo
                          symbol={transaction.ticker}
                          name={getCompanyName(transaction.ticker, transaction.company_name)}
                          size="w-6 h-6"
                          clickable={true}
                        />
                        <div className="text-green-400 font-medium text-xs">
                          {calculateShares(getDisplayRoundUp(transaction), transaction.ticker, transaction.stock_price) || '-'} shares
                        </div>
                      </div>
                    ) : transaction.ticker && transaction.status !== 'mapped' && transaction.status !== 'completed' ? (
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="text-gray-400 text-xs">
                          Potential: {calculateShares(getDisplayRoundUp(transaction), transaction.ticker) || '-'} shares
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-white font-semibold">
                    {formatCurrency((transaction.amount || transaction.purchase) + getDisplayRoundUp(transaction), '$', 2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center space-y-1">
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center space-x-1 ${getStatusColor(transaction)}`}>
                        {getStatusIcon(transaction)}
                        <span className="capitalize">{getStatusText(transaction)}</span>
                      </span>
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
                        
                        return (
                          <>
                            {/* Show edit button ONLY if no user mapping exists and transaction needs mapping */}
                            {!hasUserMapping && (transaction.status === 'pending' || transaction.status === 'needs-recognition') && (
                              <button 
                                onClick={() => handleEditTransaction(transaction.id)}
                                className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/10 transition-colors"
                                title="Edit AI Mapping"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {/* Show retry button ONLY if no user mapping exists and transaction needs mapping */}
                            {!hasUserMapping && (transaction.status === 'pending' || transaction.status === 'needs-recognition') && (
                              <button 
                                onClick={(e) => handleRetryMapping(transaction.id, e)}
                                className="text-yellow-400 hover:text-yellow-300 p-1 rounded hover:bg-yellow-500/10 transition-colors"
                                title="Retry AI Mapping"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            )}
                            {/* Show pending approval status if user has submitted mapping */}
                            {hasUserMapping && (transaction.status === 'pending' || transaction.status === 'needs-recognition') && (
                              <div className="text-orange-400 p-1" title="Mapping Submitted - Pending Approval">
                                <Clock className="w-4 h-4" />
                              </div>
                            )}
                          </>
                        )
                      })()}
                      {/* Show success icon for mapped transactions */}
                      {transaction.status === 'mapped' && (
                        <div className="text-green-400 p-1" title="Successfully Mapped">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
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
                ))
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
                      console.log('🚀 FAMILY SUBMIT MAPPING CLICKED!')
                      console.log('🔍 Selected Transaction ID:', selectedTransaction)
                      console.log('🔍 Mapping Form:', mappingForm)
                      console.log('🔍 Current Transactions Count:', transactions.length)
                      console.log('🔍 Sample Transaction IDs:', transactions.slice(0, 3).map(t => ({ id: t.id, type: typeof t.id })))
                      
                      // Submit mapping to backend
                      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                      const response = await fetch(`${apiBaseUrl}/api/family/submit-mapping`, {
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
                          dashboard_type: 'family'
                        })
                      })
                      
                      if (response.ok) {
                        const result = await response.json()
                        if (result.success) {
                          console.log('✅ Family mapping submitted successfully, updating transaction status...')
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
                          const mappingResponse = await fetch(`${apiBaseUrl}/api/family/ai/insights`, {
                            headers: {
                              'Authorization': `Bearer ${authToken}`
                            }
                          })
                          if (mappingResponse.ok) {
                            const mappingData = await mappingResponse.json()
                            if (mappingData.success && mappingData.data) {
                              setUserMappings(mappingData.data)
                              console.log('✅ Family mappings refreshed:', mappingData.data.length, 'mappings')
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
                <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
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
                          <p className="text-white font-medium">{getCompanyName(mappingDetails?.ticker_symbol || selectedTransaction?.ticker, mappingDetails?.company_name || selectedTransaction?.company_name) || 'Unknown Company'}</p>
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
                          <p className="text-white font-medium">{mappingDetails?.merchant_name || getCompanyName(selectedTransaction.ticker, selectedTransaction.company_name) || 'Unknown Company'}</p>
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
                          <p className="text-white font-medium">
                            {calculateShares(getDisplayRoundUp(selectedTransaction), selectedTransaction.ticker, selectedTransaction.stock_price) 
                              ? `${calculateShares(getDisplayRoundUp(selectedTransaction), selectedTransaction.ticker, selectedTransaction.stock_price)} shares` 
                              : 'N/A (stock price required)'}
                          </p>
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
                          <p className="text-white font-medium">Added to family portfolio</p>
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

      {/* MX Connect Widget for Bank Sync */}
      <MXConnectWidget
        isOpen={showMXConnect}
        onClose={() => setShowMXConnect(false)}
        userType="family"
        onSuccess={async (data) => {
          setShowMXConnect(false)
          
          // Trigger sync to create mock transactions
          try {
            const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
            const response = await fetch(`${apiBaseUrl}/api/family/transactions?sync=true`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            
            if (response.ok) {
              const syncData = await response.json()
              const transactionCount = syncData.data?.transactions?.length || 0
              
              addNotification({
                type: 'success',
                title: 'Family Bank Connected!',
                message: `Your family bank account has been successfully connected. ${transactionCount} transactions have been synced.`,
                timestamp: new Date()
              })
            } else {
              addNotification({
                type: 'success',
                title: 'Family Bank Connected!',
                message: 'Your family bank account has been successfully connected. All family members can now benefit from automatic transaction syncing.',
                timestamp: new Date()
              })
            }
          } catch (error) {
            console.error('Error syncing transactions:', error)
            addNotification({
              type: 'success',
              title: 'Family Bank Connected!',
              message: 'Your family bank account has been successfully connected. All family members can now benefit from automatic transaction syncing.',
              timestamp: new Date()
            })
          }
          
          // Trigger data refresh
          window.dispatchEvent(new CustomEvent('refreshFamilyData'))
        }}
        onError={(error) => {
          console.error('MX Connect Error:', error)
          addNotification({
            type: 'error',
            title: 'Connection Failed',
            message: 'Unable to connect your family bank account. Please try again or contact support.',
            timestamp: new Date()
          })
        }}
      />
    </div>
  )
}

export default FamilyTransactions
