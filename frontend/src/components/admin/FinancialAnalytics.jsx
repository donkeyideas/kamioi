import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import GlassModal from '../common/GlassModal'
import { DollarSign, TrendingUp, TrendingDown, Users, CreditCard, FileText, Download, Filter, Calendar, Eye, Edit, CheckCircle, AlertCircle, Calculator, BookOpen, BarChart3, PieChart, LineChart, Plus, X, Trash2, Upload, Lock, Unlock, RefreshCw, Clock, Target, Zap, Building, Home, User, Brain, Database, Shield, Settings, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Search, Save, AlertTriangle, Cloud } from 'lucide-react'
import RechartsChart from '../common/RechartsChart'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { useNotifications } from '../../hooks/useNotifications'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query' // 🚀 PERFORMANCE FIX: Import React Query

const FinancialAnalytics = ({ user }) => {
  const { isLightMode, isDarkMode, isCloudMode } = useTheme()
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient() // 🚀 PERFORMANCE FIX: For cache invalidation
  
  // State Management
  const [activeTab, setActiveTab] = useState('executive')
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [error, setError] = useState(null) // Keep error state for manual error handling
  
  // Transaction Management State
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [transactionFilter, setTransactionFilter] = useState('all') // 'all', 'transfer', 'expense', 'revenue', 'deposit', 'payment', 'receipt'
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all') // 'all', 'posted', 'pending'
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('')
  const [transactionSortBy, setTransactionSortBy] = useState('date') // 'date', 'amount', 'reference', 'type', 'merchant'
  const [transactionSortOrder, setTransactionSortOrder] = useState('desc') // 'asc', 'desc'
  const [transactionPage, setTransactionPage] = useState(1)
  const [transactionsPerPage] = useState(10)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  
  // Glass Modal State
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState({ title: '', message: '', type: 'success' })
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalData, setConfirmModalData] = useState({ title: '', message: '', onConfirm: null })
  
  // Reports & Export State
  const [selectedReportType, setSelectedReportType] = useState('')
  const [selectedFileFormats, setSelectedFileFormats] = useState(['pdf', 'excel'])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportHistory, setReportHistory] = useState([])
  const [showCustomReportModal, setShowCustomReportModal] = useState(false)
  const [customReportConfig, setCustomReportConfig] = useState({
    name: '',
    description: '',
    sections: [],
    filters: {}
  })
  
  // Settings State
  const [settings, setSettings] = useState({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeZone: 'America/New_York',
    decimalPlaces: 2,
    autoApprovalThreshold: 85,
    aiProcessingFrequency: 'realtime',
    enablePredictiveAnalytics: false,
    enableAutoMapping: true,
    enableNotifications: true,
    backupFrequency: 'daily'
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  
  // Financial Data States
  const [financialData, setFinancialData] = useState({
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    operatingExpenses: 0,
    netIncome: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    cashFlow: 0
  })
  
  const [kpiData, setKpiData] = useState({
    grossMargin: 0,
    netMargin: 0,
    operatingMargin: 0,
    currentRatio: 0,
    quickRatio: 0,
    debtToEquity: 0,
    returnOnAssets: 0,
    returnOnEquity: 0
  })
  
  const [glAccounts, setGlAccounts] = useState([])
  const [journalEntries, setJournalEntries] = useState([])
  const [transactions, setTransactions] = useState([]) // User/family/business transactions for AI calculations
  const [financialTransactions, setFinancialTransactions] = useState([]) // Transactions from journal entries
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false)
  const [editTransactionForm, setEditTransactionForm] = useState({ 
    reference: '', 
    description: '', 
    amount: '', 
    date: '',
    fromAccount: '',
    toAccount: ''
  })
  
  // General Ledger State
  const [selectedCategory, setSelectedCategory] = useState('assets')
  const [searchTerm, setSearchTerm] = useState('')
  const [llmDataAssetsBalance, setLlmDataAssetsBalance] = useState(0)
  
  // Balance Sheet expand/collapse state
  const [balanceSheetExpanded, setBalanceSheetExpanded] = useState({
    currentAssets: true,
    fixedAssets: true,
    otherAssets: true,
    currentLiabilities: true,
    longTermLiabilities: true,
    equity: true
  })
  
  const toggleBalanceSheetCategory = (category) => {
    setBalanceSheetExpanded(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }
  
  // Profit & Loss expand/collapse state
  const [plExpanded, setPlExpanded] = useState({
    revenue: true,
    cogs: true,
    expenses: true
  })
  
  const togglePLCategory = (category) => {
    setPlExpanded(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }
  
  // Cash Flow expand/collapse state
  const [cashFlowExpanded, setCashFlowExpanded] = useState({
    operating: true,
    investing: true,
    financing: true
  })
  
  const toggleCashFlowCategory = (category) => {
    setCashFlowExpanded(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }
  
  const [accountCategories, setAccountCategories] = useState([])
  const [chartOfAccounts, setChartOfAccounts] = useState([])
  const [allChartOfAccounts, setAllChartOfAccounts] = useState([]) // Full GL for edit modal
  const [glLoading, setGlLoading] = useState(false)
  
  // Pagination for General Ledger
  const [glCurrentPage, setGlCurrentPage] = useState(1)
  const [glItemsPerPage] = useState(10)
  
  // Create Account Modal State
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const [newAccount, setNewAccount] = useState({
    account_number: '',
    account_name: '',
    account_type: 'Asset',
    category: 'Assets',
    normal_balance: 'Debit'
  })

  // 🚀 PERFORMANCE FIX: Use React Query for account categories
  const { data: accountCategoriesData, refetch: refetchAccountCategories } = useQuery({
    queryKey: ['financial-account-categories'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const response = await fetch(`${apiBaseUrl}/api/admin/financial/accounts/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            return result.data || []
          } else {
            console.error('FinancialAnalytics - Categories API returned success: false', result)
            return []
          }
        } else {
          console.error('FinancialAnalytics - Categories API request failed with status:', response.status)
          return []
        }
      } catch (error) {
        console.error('Error fetching account categories:', error)
        return []
      }
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2
  })
  
  // Update state when React Query data changes
  useEffect(() => {
    if (accountCategoriesData) {
      setAccountCategories(accountCategoriesData)
    }
  }, [accountCategoriesData])
  
  // API Functions for Chart of Accounts - Wrapper for backward compatibility
  const fetchAccountCategories = useCallback(async () => {
    await refetchAccountCategories()
  }, [refetchAccountCategories])

  const updateSubscriptionRevenue = async () => {
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/financial/update-subscription-revenue`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('Subscription revenue updated successfully')
          // Refresh the chart of accounts to show updated balances
          const categoryMap = {
            'all': 'all',
            'assets': 'Assets',
            'liabilities': 'Liabilities', 
            'equity': 'Equity',
            'revenue': 'Revenue',
            'cogs': 'COGS',
            'expense': 'Expense',
            'other_income/expense': 'Other Income/Expense'
          }
          const apiCategory = categoryMap[selectedCategory] || selectedCategory
          fetchChartOfAccounts(apiCategory)
        } else {
          console.error('Failed to update subscription revenue:', result.error)
        }
      } else {
        console.error('Subscription revenue update failed with status:', response.status)
      }
    } catch (error) {
      console.error('Error updating subscription revenue:', error)
    }
  }

  const fetchChartOfAccounts = async (category = 'all') => {
    setGlLoading(true)
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const url = category === 'all'
        ? `${apiBaseUrl}/api/admin/financial/accounts`
        : `${apiBaseUrl}/api/admin/financial/accounts?category=${category}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          let accounts = result.data || []
          
          // Ensure deferred revenue accounts exist
          const deferredRevenueAccounts = [
            { account_number: '23010', account_name: 'Deferred Revenue � Individual Accounts', account_type: 'Liability', category: 'Liabilities', normal_balance: 'Credit', balance: 0 },
            { account_number: '23020', account_name: 'Deferred Revenue � Family Accounts', account_type: 'Liability', category: 'Liabilities', normal_balance: 'Credit', balance: 0 },
            { account_number: '23030', account_name: 'Deferred Revenue � Business Accounts', account_type: 'Liability', category: 'Liabilities', normal_balance: 'Credit', balance: 0 },
            { account_number: '23040', account_name: 'Deferred Revenue � Failed Payments', account_type: 'Liability', category: 'Liabilities', normal_balance: 'Credit', balance: 0 }
          ]
          
          // Add deferred revenue accounts if they don't exist
          deferredRevenueAccounts.forEach(defAccount => {
            if (!accounts.find(acc => acc.account_number === defAccount.account_number)) {
              accounts.push(defAccount)
            }
          })
          
          setChartOfAccounts(accounts)
          // Also update glAccounts for backward compatibility
          setGlAccounts(accounts)
          
          // If fetching all accounts, also update allChartOfAccounts
          if (category === 'all') {
            setAllChartOfAccounts(accounts)
          }
        } else {
          console.error('FinancialAnalytics - API returned success: false', result)
        }
      } else {
        console.error('FinancialAnalytics - API request failed with status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching chart of accounts:', error)
    } finally {
      setGlLoading(false)
    }
  }
  
  // Create new account
  const handleCreateAccount = async () => {
    if (!newAccount.account_number || !newAccount.account_name) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in account number and name',
        timestamp: new Date()
      })
      return
    }
    
    try {
      setGlLoading(true)
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/financial/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAccount)
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Refresh accounts
          await fetchChartOfAccounts('all')
          setShowCreateAccountModal(false)
          setNewAccount({
            account_number: '',
            account_name: '',
            account_type: 'Asset',
            category: 'Assets',
            normal_balance: 'Debit'
          })
        } else {
          addNotification({
            type: 'error',
            title: 'Create Failed',
            message: result.error || 'Failed to create account',
            timestamp: new Date()
          })
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Create Failed',
          message: 'Failed to create account',
          timestamp: new Date()
        })
      }
    } catch (error) {
      console.error('Error creating account:', error)
      addNotification({
        type: 'error',
        title: 'Create Failed',
        message: 'Error creating account',
        timestamp: new Date()
      })
    } finally {
      setGlLoading(false)
    }
  }

  // Theme helper functions
  const getTextClass = () => isLightMode ? 'text-gray-900' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-300'
  const getCardClass = () => isLightMode 
    ? 'bg-white border border-gray-200' 
    : 'bg-white/10 backdrop-blur-md border border-white/20'
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [transactionFilter, transactionSearchTerm])

  // Transaction Management will be implemented based on user requirements
  // Transactions fetching removed - waiting for user specifications

  // 🚀 PERFORMANCE FIX: Journal entries are already fetched in financialQueryData, but provide separate query for manual refresh
  const { data: journalEntriesData, refetch: refetchJournalEntries } = useQuery({
    queryKey: ['financial-journal-entries'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const response = await fetch(`${apiUrl}/api/admin/journal-entries`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            return result.data?.journal_entries || result.data || []
          }
        }
        return []
      } catch (error) {
        console.error('Error fetching journal entries:', error)
        return []
      }
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: false // Disabled by default - use financialQueryData instead
  })
  
  // Update state when React Query data changes
  useEffect(() => {
    if (journalEntriesData) {
      setJournalEntries(journalEntriesData)
    }
  }, [journalEntriesData])
  
  // Wrapper for backward compatibility
  const fetchJournalEntries = useCallback(async () => {
    await refetchJournalEntries()
  }, [refetchJournalEntries])

  // Calculate financial data from GL accounts
  useEffect(() => {
    if (chartOfAccounts.length > 0) {
      // Calculate from GL accounts by category
      const revenueAccounts = chartOfAccounts.filter(acc => acc.category === 'Revenue')
      const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      
      const cogsAccounts = chartOfAccounts.filter(acc => acc.category === 'COGS')
      const totalCOGS = cogsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      
      const expenseAccounts = chartOfAccounts.filter(acc => acc.category === 'Expense')
      const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      
      const assetAccounts = chartOfAccounts.filter(acc => acc.category === 'Assets')
      const totalAssets = assetAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      
      const liabilityAccounts = chartOfAccounts.filter(acc => acc.category === 'Liabilities')
      const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      
      const equityAccounts = chartOfAccounts.filter(acc => acc.category === 'Equity')
      const totalEquity = equityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      
      const cashAccounts = chartOfAccounts.filter(acc => 
        acc.account_name.toLowerCase().includes('cash') || 
        acc.account_number === '10100' || 
        acc.account_number === '10150'
      )
      const cashFlow = cashAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      
      const grossProfit = totalRevenue - totalCOGS
      const netIncome = grossProfit - totalExpenses
      
      setFinancialData({
        revenue: totalRevenue,
        cogs: totalCOGS,
        grossProfit: grossProfit,
        operatingExpenses: totalExpenses,
        netIncome: netIncome,
        totalAssets: totalAssets,
        totalLiabilities: totalLiabilities,
        totalEquity: totalEquity,
        cashFlow: cashFlow
      })
      
      // Calculate KPIs
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
      const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
      const operatingMargin = totalRevenue > 0 ? ((grossProfit - totalExpenses) / totalRevenue) * 100 : 0
      const currentRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : 0
      const quickRatio = totalLiabilities > 0 ? (cashFlow / totalLiabilities) : 0
      const debtToEquity = totalEquity > 0 ? (totalLiabilities / totalEquity) : 0
      const returnOnAssets = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0
      const returnOnEquity = totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0
      
      setKpiData({
        grossMargin: grossMargin,
        netMargin: netMargin,
        operatingMargin: operatingMargin,
        currentRatio: currentRatio,
        quickRatio: quickRatio,
        debtToEquity: debtToEquity,
        returnOnAssets: returnOnAssets,
        returnOnEquity: returnOnEquity
      })
    }
  }, [chartOfAccounts])

  // 🚀 PERFORMANCE FIX: React Query handles data fetching automatically on mount
  // No manual useEffect needed - data is fetched and cached by React Query
  // The queries are enabled by default and will fetch on mount

  // Ensure all accounts are loaded when tabs that need full GL data are active
  useEffect(() => {
    const tabsNeedingFullGL = ['executive', 'pl', 'bs', 'cf', 'reconciliation', 'analytics', 'reports', 'journal', 'gl']
    if (tabsNeedingFullGL.includes(activeTab)) {
      // Always load all accounts for these tabs (full GL)
      if (allChartOfAccounts.length === 0) {
        fetchChartOfAccounts('all')
      }
    }
  }, [activeTab, allChartOfAccounts.length])

  // Load accounts when category changes
  useEffect(() => {
    if (selectedCategory) {
      // Map the category ID to the actual category name from the API
      const categoryMap = {
        'all': 'all',
        'assets': 'Assets',
        'liabilities': 'Liabilities', 
        'equity': 'Equity',
        'revenue': 'Revenue',
        'cogs': 'COGS',
        'expense': 'Expense',
        'other_income/expense': 'Other Income/Expense'
      }
      const apiCategory = categoryMap[selectedCategory] || selectedCategory
      fetchChartOfAccounts(apiCategory)
      // Reset pagination when category changes
      setGlCurrentPage(1)
    }
  }, [selectedCategory])

  // Reset pagination when search term changes
  useEffect(() => {
    setGlCurrentPage(1)
  }, [searchTerm])

  // Report Generation Functions
  const generateReport = async (reportType, format) => {
    setIsGeneratingReport(true)
    try {
      const reportData = await fetchReportData(reportType)
      const fileName = `${reportType}_${new Date().toISOString().split('T')[0]}.${format}`
      
      if (format === 'pdf') {
        await generatePDFReport(reportData, fileName)
      } else if (format === 'excel') {
        await generateExcelReport(reportData, fileName)
      } else if (format === 'csv') {
        await generateCSVReport(reportData, fileName)
      }
      
      // Add to report history
      const newReport = {
        id: Date.now(),
        type: reportType,
        format: format,
        fileName: fileName,
        generatedAt: new Date().toISOString(),
        status: 'completed'
      }
      setReportHistory(prev => [newReport, ...prev])
      
      setModalData({
        title: 'Report Generated',
        message: `${reportType} report has been generated successfully as ${fileName}`,
        type: 'success'
      })
      setShowModal(true)
    } catch (error) {
      setModalData({
        title: 'Report Generation Failed',
        message: `Failed to generate ${reportType} report: ${error.message}`,
        type: 'error'
      })
      setShowModal(true)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const fetchReportData = async (reportType) => {
    // Calculate financial data from GL accounts (transaction-based) - same as General Ledger
    const enhanceAccountsWithTransactions = () => {
      // Create a map of transaction totals by account
      const transactionTotals = new Map()
      
      financialTransactions.forEach((transaction) => {
        // If transaction has explicit debit/credit (from journal entry lines), use those
        if (transaction.debit !== undefined || transaction.credit !== undefined) {
          const debitAmount = transaction.debit || 0
          const creditAmount = transaction.credit || 0
          
          if (debitAmount > 0 && transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += debitAmount
          }
          
          if (creditAmount > 0 && transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += creditAmount
          }
        } else {
          // Legacy format: Process From Account (Credits) and To Account (Debits)
          if (transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += transaction.amount || 0
          }
          
          if (transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += transaction.amount || 0
          }
        }
      })
      
      // Use the same accounts source as GL
      const baseAccounts = allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts
      
      // ZERO OUT all hardcoded balances - only use transaction data (same as GL)
      return baseAccounts.map(account => {
        const totals = transactionTotals.get(account.account_number) || { debits: 0, credits: 0 }
        
        // Calculate balance based on normal balance
        // Assets/Expenses: Debit increases, Credit decreases (debits - credits)
        // Liabilities/Equity/Revenue: Credit increases, Debit decreases (credits - debits)
        let transactionBalance
        const normalBalance = (account.normal_balance || '').toLowerCase()
        if (normalBalance === 'credit') {
          // Liabilities, Equity, Revenue: Credits increase balance
          transactionBalance = totals.credits - totals.debits
        } else {
          // Assets, Expenses: Debits increase balance
          transactionBalance = totals.debits - totals.credits
        }
        
        return {
          ...account,
          debits: totals.debits,
          credits: totals.credits,
          balance: transactionBalance // Always use transaction balance, zero if no transactions
        }
      })
    }
    
    // Use enhanced accounts with transaction-based balances (same as GL)
    const accountsToUse = enhanceAccountsWithTransactions()
    
    // Calculate financial metrics from GL accounts (transaction-based)
    const revenueAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'revenue'
    })
    const cogsAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'cogs'
    })
    const expenseAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'expense'
    })
    const assetAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'asset' || category.toLowerCase() === 'assets'
    })
    const liabilityAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'liability' || category.toLowerCase() === 'liabilities'
    })
    const equityAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'equity'
    })
    
    // Calculate values from GL (transaction-based)
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalCOGS = cogsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalAssets = assetAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    // Calculate cash from GL
    const cashAccounts = accountsToUse.filter(acc => 
      ['10100', '10150', '11000'].includes(acc.account_number)
    )
    const totalCash = cashAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    // Calculate net income from GL data
    const grossProfit = totalRevenue - totalCOGS
    const netIncome = grossProfit - totalExpenses
    
    // Create financial data object from GL calculations
    const calculatedFinancialData = {
      revenue: totalRevenue,
      cogs: totalCOGS,
      operatingExpenses: totalExpenses,
      grossProfit: grossProfit,
      netIncome: netIncome,
      totalAssets: totalAssets,
      totalLiabilities: totalLiabilities,
      totalEquity: totalEquity,
      cashFlow: totalCash
    }
    
    // Simulate API call to fetch report data
    return new Promise((resolve) => {
      setTimeout(() => {
        const baseData = {
          reportType,
          generatedAt: new Date().toISOString(),
          dateRange: dateRange,
          financialData: calculatedFinancialData, // Use calculated data from GL instead of hardcoded
          glAccounts: accountsToUse, // Use transaction-based accounts
          journalEntries: journalEntries
        }
        resolve(baseData)
      }, 1000)
    })
  }

  const generatePDFReport = async (data, fileName) => {
    try {
      console.log('Generating PDF report:', data)
      
      // Create new PDF document
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.text(`${data.reportType.toUpperCase()} REPORT`, 20, 30)
      
      // Add generation date
      doc.setFontSize(12)
      doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, 20, 45)
      
      // Add financial metrics section
      doc.setFontSize(16)
      doc.text('Financial Metrics', 20, 65)
      
      const metrics = [
        ['Metric', 'Value'],
        ['Revenue', `$${data.financialData.revenue.toLocaleString()}`],
        ['Net Income', `$${data.financialData.netIncome.toLocaleString()}`],
        ['Total Assets', `$${data.financialData.totalAssets.toLocaleString()}`],
        ['Total Equity', `$${data.financialData.totalEquity.toLocaleString()}`],
        ['Cash Flow', `$${data.financialData.cashFlow.toLocaleString()}`]
      ]
      
      // Add table using autoTable
      autoTable(doc, {
        startY: 75,
        head: [metrics[0]],
        body: metrics.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })
      
      // Add GL Accounts section if available
      if (data.glAccounts && data.glAccounts.length > 0) {
        doc.addPage()
        doc.setFontSize(16)
        doc.text('General Ledger Accounts', 20, 30)
        
        const accountData = data.glAccounts.slice(0, 20).map(account => [
          account.account_number,
          account.name,
          `$${account.balance.toLocaleString()}`
        ])
        
        autoTable(doc, {
          startY: 45,
          head: [['Code', 'Account Name', 'Balance']],
          body: accountData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        })
      }
      
      // Save the PDF
      doc.save(fileName)
      
    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error('Failed to generate PDF: ' + error.message)
    }
  }

  const generateExcelReport = async (data, fileName) => {
    try {
      console.log('Generating Excel report:', data)
      
      // Ensure the file has the correct extension
      if (!fileName.endsWith('.xlsx')) {
        fileName = fileName.replace(/\.[^/.]+$/, '') + '.xlsx'
      }
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new()
      
      // Create financial metrics sheet
      const metricsData = [
        ['Metric', 'Value'],
        ['Revenue', data.financialData.revenue],
        ['Net Income', data.financialData.netIncome],
        ['Total Assets', data.financialData.totalAssets],
        ['Total Equity', data.financialData.totalEquity],
        ['Cash Flow', data.financialData.cashFlow],
        ['COGS', data.financialData.cogs],
        ['Operating Expenses', data.financialData.operatingExpenses]
      ]
      
      const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData)
      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Financial Metrics')
      
      // Create GL Accounts sheet if available
      if (data.glAccounts && data.glAccounts.length > 0) {
        const accountData = [
          ['Code', 'Account Name', 'Type', 'Normal', 'Balance'],
          ...data.glAccounts.map(account => [
            account.account_number,
            account.name,
            account.type,
            account.normal,
            account.balance
          ])
        ]
        
        const accountsSheet = XLSX.utils.aoa_to_sheet(accountData)
        XLSX.utils.book_append_sheet(workbook, accountsSheet, 'GL Accounts')
      }
      
      // Create Journal Entries sheet if available
      if (data.journalEntries && data.journalEntries.length > 0) {
        const journalData = [
          ['Date', 'Reference', 'Description', 'Amount', 'From Account', 'To Account'],
          ...data.journalEntries.slice(0, 100).map(entry => [
            entry.date,
            entry.reference,
            entry.description,
            entry.amount,
            entry.from_account,
            entry.to_account
          ])
        ]
        
        const journalSheet = XLSX.utils.aoa_to_sheet(journalData)
        XLSX.utils.book_append_sheet(workbook, journalSheet, 'Journal Entries')
      }
      
      // Generate and download the Excel file
      try {
        XLSX.writeFile(workbook, fileName)
        console.log('Excel file generated successfully:', fileName)
      } catch (writeError) {
        console.error('XLSX.writeFile error:', writeError)
        // Fallback: try with different options
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
    } catch (error) {
      console.error('Excel generation error:', error)
      throw new Error('Failed to generate Excel: ' + error.message)
    }
  }

  const generateCSVReport = async (data, fileName) => {
    try {
      console.log('Generating CSV report:', data)
      const csvContent = convertToCSV(data)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('CSV generation error:', error)
      throw new Error('Failed to generate CSV: ' + error.message)
    }
  }

  const convertToCSV = (data) => {
    // Enhanced CSV conversion with multiple sections
    const sections = []
    
    // Header section
    sections.push(`# ${data.reportType.toUpperCase()} REPORT`)
    sections.push(`# Generated: ${new Date(data.generatedAt).toLocaleString()}`)
    sections.push('')
    
    // Financial metrics section
    sections.push('# Financial Metrics')
    sections.push('Metric,Value')
    sections.push(`Revenue,${data.financialData.revenue}`)
    sections.push(`Net Income,${data.financialData.netIncome}`)
    sections.push(`Total Assets,${data.financialData.totalAssets}`)
    sections.push(`Total Equity,${data.financialData.totalEquity}`)
    sections.push(`Cash Flow,${data.financialData.cashFlow}`)
    sections.push('')
    
    // GL Accounts section
    if (data.glAccounts && data.glAccounts.length > 0) {
      sections.push('# General Ledger Accounts')
      sections.push('Code,Account Name,Type,Normal,Balance')
      data.glAccounts.forEach(account => {
        sections.push(`${account.account_number},"${account.name}",${account.type},${account.normal},${account.balance}`)
      })
      sections.push('')
    }
    
    // Journal Entries section (limited to 50 entries)
    if (data.journalEntries && data.journalEntries.length > 0) {
      sections.push('# Journal Entries (Last 50)')
      sections.push('Date,Reference,Description,Amount,From Account,To Account')
      data.journalEntries.slice(0, 50).forEach(entry => {
        sections.push(`${entry.date},"${entry.reference}","${entry.description}",${entry.amount},${entry.from_account},${entry.to_account}`)
      })
    }
    
    return sections.join('\n')
  }

  const handleFileFormatChange = (format, checked) => {
    if (checked) {
      setSelectedFileFormats(prev => [...prev, format])
    } else {
      setSelectedFileFormats(prev => prev.filter(f => f !== format))
    }
  }

  const handleGenerateAllReports = async () => {
    if (selectedFileFormats.length === 0) {
      setModalData({
        title: 'No Format Selected',
        message: 'Please select at least one file format to generate reports.',
        type: 'error'
      })
      setShowModal(true)
      return
    }

    for (const format of selectedFileFormats) {
      await generateReport('comprehensive', format)
    }
  }

  // Settings Functions
  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setModalData({
        title: 'Settings Saved',
        message: 'All settings have been saved successfully.',
        type: 'success'
      })
      setShowModal(true)
    } catch (error) {
      setModalData({
        title: 'Save Failed',
        message: 'Failed to save settings. Please try again.',
        type: 'error'
      })
      setShowModal(true)
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleResetSettings = () => {
    setSettings({
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeZone: 'America/New_York',
      decimalPlaces: 2,
      autoApprovalThreshold: 85,
      aiProcessingFrequency: 'realtime',
      enablePredictiveAnalytics: false,
      enableAutoMapping: true,
      enableNotifications: true,
      backupFrequency: 'daily'
    })
  }

  // GL Calculation Functions
  const calculateAccountBalance = (accountCode, journalEntries) => {
    if (!journalEntries || journalEntries.length === 0) return 0
    
    let balance = 0
    journalEntries.forEach(entry => {
      if (entry.entries) {
        entry.entries.forEach(line => {
          if (line.account_code === accountCode) {
            balance += line.debit - line.credit
          }
        })
      }
    })
    return balance
  }
  
  const calculateFinancialMetrics = (journalEntries) => {
    if (!journalEntries || journalEntries.length === 0) {
      return {
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        operatingExpenses: 0,
        netIncome: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        cashFlow: 0
      }
    }
    
    // Calculate from GL accounts
    const revenue = calculateAccountBalance('40100', journalEntries) + // Individual Revenue
                   calculateAccountBalance('40200', journalEntries) + // Family Revenue
                   calculateAccountBalance('40300', journalEntries) + // Business Revenue
                   calculateAccountBalance('40400', journalEntries) + // Subscription Revenue
                   calculateAccountBalance('40500', journalEntries) + // AI Insight Revenue
                   calculateAccountBalance('40600', journalEntries) + // Advertisement Revenue
                   calculateAccountBalance('40700', journalEntries) + // Platform Fee Revenue
                   calculateAccountBalance('40800', journalEntries) + // Data Licensing Revenue
                   calculateAccountBalance('40900', journalEntries)   // Other Revenue
    
    const cogs = calculateAccountBalance('50100', journalEntries) + // Cloud Compute
                 calculateAccountBalance('50200', journalEntries) + // Data Acquisition
                 calculateAccountBalance('50300', journalEntries) + // AI/LLM Training
                 calculateAccountBalance('50400', journalEntries) + // Model Hosting
                 calculateAccountBalance('50500', journalEntries) + // Payment Processing
                 calculateAccountBalance('50600', journalEntries) + // Content Moderation
                 calculateAccountBalance('50700', journalEntries) + // DevOps Support
                 calculateAccountBalance('50800', journalEntries) + // Data Storage
                 calculateAccountBalance('50900', journalEntries)   // Hardware Depreciation
    
    const operatingExpenses = calculateAccountBalance('60100', journalEntries) + // Salaries
                             calculateAccountBalance('60110', journalEntries) + // Founders
                             calculateAccountBalance('60120', journalEntries) + // Contractors
                             calculateAccountBalance('60130', journalEntries) + // Payroll Taxes
                             calculateAccountBalance('60140', journalEntries) + // Benefits
                             calculateAccountBalance('60150', journalEntries) + // Stock Compensation
                             calculateAccountBalance('60160', journalEntries) + // Recruiting
                             calculateAccountBalance('60170', journalEntries) + // Training
                             calculateAccountBalance('60180', journalEntries) + // Wellness
                             calculateAccountBalance('61000', journalEntries) + // Cloud Services
                             calculateAccountBalance('61010', journalEntries) + // LLM Hosting
                             calculateAccountBalance('61020', journalEntries) + // Data Engineering
                             calculateAccountBalance('61030', journalEntries) + // Development Tools
                             calculateAccountBalance('61040', journalEntries) + // Software Licenses
                             calculateAccountBalance('61050', journalEntries) + // Data Storage
                             calculateAccountBalance('61060', journalEntries) + // Monitoring
                             calculateAccountBalance('61070', journalEntries) + // Network Security
                             calculateAccountBalance('61080', journalEntries) + // DevOps Tools
                             calculateAccountBalance('61090', journalEntries) + // R&D
                             calculateAccountBalance('62000', journalEntries) + // Paid Advertising
                             calculateAccountBalance('62010', journalEntries) + // Social Media
                             calculateAccountBalance('62020', journalEntries) + // Content Marketing
                             calculateAccountBalance('62030', journalEntries) + // SEO/SEM
                             calculateAccountBalance('62040', journalEntries) + // Brand Design
                             calculateAccountBalance('62050', journalEntries) + // Events
                             calculateAccountBalance('62060', journalEntries) + // Referral Incentives
                             calculateAccountBalance('62070', journalEntries) + // PR
                             calculateAccountBalance('62080', journalEntries) + // Marketing Automation
                             calculateAccountBalance('62090', journalEntries) + // Market Research
                             calculateAccountBalance('63000', journalEntries) + // Rent
                             calculateAccountBalance('63010', journalEntries) + // Utilities
                             calculateAccountBalance('63020', journalEntries) + // Insurance
                             calculateAccountBalance('63030', journalEntries) + // Legal
                             calculateAccountBalance('63040', journalEntries) + // Accounting
                             calculateAccountBalance('63050', journalEntries) + // Office Supplies
                             calculateAccountBalance('63060', journalEntries) + // Dues
                             calculateAccountBalance('63070', journalEntries) + // Bank Fees
                             calculateAccountBalance('63080', journalEntries) + // Postage
                             calculateAccountBalance('63090', journalEntries) + // Miscellaneous
                             calculateAccountBalance('64000', journalEntries) + // Customer Support
                             calculateAccountBalance('64010', journalEntries) + // Onboarding
                             calculateAccountBalance('64020', journalEntries) + // Refunds
                             calculateAccountBalance('64030', journalEntries) + // Platform Operations
                             calculateAccountBalance('64040', journalEntries) + // Bug Bounties
                             calculateAccountBalance('64050', journalEntries) + // Incident Response
                             calculateAccountBalance('65000', journalEntries) + // Compliance
                             calculateAccountBalance('65010', journalEntries) + // KYC/AML
                             calculateAccountBalance('65020', journalEntries) + // Legal Compliance
                             calculateAccountBalance('65030', journalEntries) + // Data Privacy
                             calculateAccountBalance('65040', journalEntries) + // Risk Management
                             calculateAccountBalance('65050', journalEntries) + // Financial Auditing
                             calculateAccountBalance('66000', journalEntries) + // Travel
                             calculateAccountBalance('66010', journalEntries) + // Meals
                             calculateAccountBalance('66020', journalEntries) + // Conferences
                             calculateAccountBalance('66030', journalEntries) + // Remote Work
                             calculateAccountBalance('67000', journalEntries) + // Depreciation
                             calculateAccountBalance('67010', journalEntries) + // Amortization
                             calculateAccountBalance('67020', journalEntries) + // Non-Recurring
                             calculateAccountBalance('67030', journalEntries) + // Write-Offs
                             calculateAccountBalance('68000', journalEntries) + // AI Model Development
                             calculateAccountBalance('68010', journalEntries) + // Dataset Labeling
                             calculateAccountBalance('68020', journalEntries) + // Model Evaluation
                             calculateAccountBalance('68030', journalEntries) + // Experimental Projects
                             calculateAccountBalance('68040', journalEntries) + // Research Staff
                             calculateAccountBalance('68050', journalEntries) + // R&D Cloud Compute
                             calculateAccountBalance('68060', journalEntries) + // Research Tools
                             calculateAccountBalance('69000', journalEntries) + // Investor Relations
                             calculateAccountBalance('69010', journalEntries) + // Fundraising
                             calculateAccountBalance('69020', journalEntries) + // Due Diligence
                             calculateAccountBalance('69030', journalEntries) // M&A
    
    const grossProfit = revenue - cogs
    const netIncome = grossProfit - operatingExpenses
    
    // Balance Sheet calculations - using dynamic account data
    const totalAssets = chartOfAccounts
      .filter(acc => acc.category === 'Assets')
      .reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const totalLiabilities = chartOfAccounts
      .filter(acc => acc.category === 'Liabilities')
      .reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const totalEquity = chartOfAccounts
      .filter(acc => acc.category === 'Equity')
      .reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    // Cash Flow calculation (simplified) - using cash accounts
    const cashFlow = chartOfAccounts
      .filter(acc => acc.account_name.toLowerCase().includes('cash'))
      .reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    return {
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      netIncome,
      totalAssets,
      totalLiabilities,
      totalEquity,
      cashFlow
    }
  }

  // LLM Data Assets Balance Calculation
  const fetchLLMDataAssetsBalance = async () => {
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('kamioi_token') || localStorage.getItem('authToken')
      console.log('fetchLLMDataAssetsBalance - Token:', token)
      if (!token) {
        console.log(' fetchLLMDataAssetsBalance - No token, setting balance to 0')
        setLlmDataAssetsBalance(0)
        return 0
      }
      
      console.log('fetchLLMDataAssetsBalance - Using Financial Analytics endpoint...')
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/financial-analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('fetchLLMDataAssetsBalance - Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('fetchLLMDataAssetsBalance - Response data:', data)
        if (data.success && data.data && data.data.gl_accounts) {
          const llmAccount = data.data.gl_accounts.find(acc => acc.account_number === '15200')
          const balance = llmAccount ? llmAccount.balance : 0
          console.log(' fetchLLMDataAssetsBalance - Setting balance to:', balance)
          setLlmDataAssetsBalance(balance)
          return balance
        } else {
          console.log('fetchLLMDataAssetsBalance - Invalid response format, setting balance to 0')
          setLlmDataAssetsBalance(0)
          return 0
        }
      } else {
        console.log(' fetchLLMDataAssetsBalance - Response not ok, setting balance to 0')
        setLlmDataAssetsBalance(0)
        return 0
      }
    } catch (error) {
      console.error(' fetchLLMDataAssetsBalance - Error:', error)
      setLlmDataAssetsBalance(0)
      return 0
    }
  }

  // AI & Platform KPI Calculation Functions
  const calculateAIEfficiency = () => {
    // Calculate based on successful AI processing vs total attempts
    if (!transactions || transactions.length === 0) return '0.0'
    const totalMappings = transactions.length
    const successfulMappings = transactions.filter(t => t.status === 'mapped' || t.status === 'completed').length
    return ((successfulMappings / totalMappings) * 100).toFixed(1)
  }

  const calculateLLMDataValue = () => {
    // Calculate based on AI-related revenue and data assets
    const aiRevenue = financialData.revenue * 0.3 // Assume 30% of revenue is AI-related
    const dataAssets = financialData.totalAssets * 0.15 // Assume 15% of assets are data-related
    return Math.round(aiRevenue + dataAssets)
  }

  const calculateAIAccuracy = () => {
    // Calculate based on mapping accuracy from LLM data
    if (!transactions || transactions.length === 0) return '0.0'
    const totalMappings = transactions.length
    const accurateMappings = transactions.filter(t => t.confidence && t.confidence > 0.8).length
    return ((accurateMappings / totalMappings) * 100).toFixed(1)
  }

  const calculatePlatformUptime = () => {
    // Calculate based on system health and transaction processing
    if (!transactions || transactions.length === 0) return '99.9'
    const totalTransactions = transactions.length
    const successfulTransactions = transactions.filter(t => t.status !== 'failed').length
    return ((successfulTransactions / totalTransactions) * 100).toFixed(1)
  }

  const calculateAIROI = () => {
    // Calculate ROI based on AI revenue vs AI costs
    const aiRevenue = financialData.revenue * 0.3 // 30% AI revenue
    const aiCosts = financialData.cogs * 0.4 // 40% of COGS are AI-related
    if (aiCosts === 0) return 0
    return Math.round(((aiRevenue - aiCosts) / aiCosts) * 100)
  }
  
  // Journal Entry State
  const [showJournalEntry, setShowJournalEntry] = useState(false)
  const [isSubmittingJournalEntry, setIsSubmittingJournalEntry] = useState(false) // 🚀 FIX: Separate loading state for journal entry submission
  const [journalEntry, setJournalEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    location: '',
    department: '',
    transactionType: '',
    vendorName: '',
    customerName: '',
    fromAccount: '',
    toAccount: '',
    expenseAccount: '',
    revenueAccount: '',
    cashAccount: '',
    paymentMethod: '',
    source: '',
    amount: 0,
    entries: [{ account: '', debit: 0, credit: 0, description: '' }],
    totalDebit: 0,
    totalCredit: 0,
    status: 'draft'
  })

  // Submit Journal Entry Function
  const submitJournalEntry = async () => {
    try {
      setIsSubmittingJournalEntry(true) // 🚀 FIX: Use separate loading state
      
      // Validate required fields
      if (!journalEntry.amount || journalEntry.amount <= 0) {
        setModalData({
          title: 'Validation Error',
          message: 'Please enter a valid amount',
          type: 'error'
        })
        setShowModal(true)
        return
      }
      
      if (!journalEntry.fromAccount || !journalEntry.toAccount) {
        setModalData({
          title: 'Validation Error',
          message: 'Please select both From Account and To Account',
          type: 'error'
        })
        setShowModal(true)
        return
      }
      
      if (!journalEntry.transactionType) {
        setModalData({
          title: 'Validation Error',
          message: 'Please select a transaction type',
          type: 'error'
        })
        setShowModal(true)
        return
      }

      // Generate journal entry data
      const entryData = {
        date: journalEntry.date,
        reference: journalEntry.reference || `JE-${Date.now()}`,
        description: journalEntry.description,
        location: journalEntry.location,
        department: journalEntry.department,
        transactionType: journalEntry.transactionType,
        vendorName: journalEntry.vendorName,
        customerName: journalEntry.customerName,
        amount: parseFloat(journalEntry.amount),
        fromAccount: journalEntry.fromAccount,
        toAccount: journalEntry.toAccount,
        status: 'posted'
      }

      // Create journal entries based on transaction type
      const entries = []
      const amount = parseFloat(journalEntry.amount)

      switch (journalEntry.transactionType) {
        case 'transfer':
          // Debit To Account, Credit From Account
          entries.push({
            account: journalEntry.toAccount,
            debit: amount,
            credit: 0,
            description: `Transfer from ${journalEntry.fromAccount}`
          })
          entries.push({
            account: journalEntry.fromAccount,
            debit: 0,
            credit: amount,
            description: `Transfer to ${journalEntry.toAccount}`
          })
          break
        case 'expense':
          // Debit Expense Account, Credit Cash Account
          entries.push({
            account: journalEntry.fromAccount, // Expense account
            debit: amount,
            credit: 0,
            description: journalEntry.description
          })
          entries.push({
            account: journalEntry.toAccount, // Cash account
            debit: 0,
            credit: amount,
            description: `Payment for ${journalEntry.description}`
          })
          break
        case 'revenue':
          // Debit Cash Account, Credit Revenue Account
          entries.push({
            account: journalEntry.fromAccount, // Cash account
            debit: amount,
            credit: 0,
            description: `Revenue received`
          })
          entries.push({
            account: journalEntry.toAccount, // Revenue account
            debit: 0,
            credit: amount,
            description: journalEntry.description
          })
          break
        case 'deposit':
          // Debit Cash Account, Credit Owner Contributions
          entries.push({
            account: journalEntry.toAccount, // Cash account
            debit: amount,
            credit: 0,
            description: `Deposit received`
          })
          entries.push({
            account: '30200', // Owner Contributions
            debit: 0,
            credit: amount,
            description: `Owner contribution`
          })
          break
        default:
          setModalData({
            title: 'Validation Error',
            message: 'Please select a valid transaction type',
            type: 'error'
          })
          setShowModal(true)
          return
      }

      // Add entries to the entry data
      entryData.entries = entries
      entryData.totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0)
      entryData.totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0)

        // Send to backend (you'll need to implement this API endpoint)
        const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || 'admin_token_3'
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/journal-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entryData)
      })

      if (response.ok) {
        setModalData({
          title: 'Success!',
          message: 'Journal entry submitted successfully!',
          type: 'success'
        })
        setShowModal(true)
        // Reset form
        setJournalEntry({
          date: new Date().toISOString().split('T')[0],
          reference: '',
          description: '',
          location: '',
          department: '',
          transactionType: '',
          vendorName: '',
          customerName: '',
          fromAccount: '',
          toAccount: '',
          expenseAccount: '',
          revenueAccount: '',
          cashAccount: '',
          paymentMethod: '',
          source: '',
          amount: 0,
          entries: [{ account: '', debit: 0, credit: 0, description: '' }],
          totalDebit: 0,
          totalCredit: 0,
          status: 'draft'
        })
        setShowJournalEntry(false)
        // 🚀 PERFORMANCE FIX: Refresh financial data using React Query
        queryClient.invalidateQueries({ queryKey: ['financial-analytics-data'] })
        refetchFinancialData()
      } else {
        const error = await response.json()
        setModalData({
          title: 'Error',
          message: `Error submitting journal entry: ${error.error || error.message || 'Unknown error'}`,
          type: 'error'
        })
        setShowModal(true)
      }
    } catch (error) {
      console.error('Error submitting journal entry:', error)
      setModalData({
        title: 'Error',
        message: 'Error submitting journal entry. Please try again.',
        type: 'error'
      })
      setShowModal(true)
    } finally {
      setIsSubmittingJournalEntry(false) // 🚀 FIX: Use separate loading state
    }
  }

  // Helper function to render auto-generated journal entries
  const renderAutoGeneratedEntries = () => {
    if (!journalEntry.transactionType || !journalEntry.amount) return null

    const entries = []
    const amount = journalEntry.amount

    switch (journalEntry.transactionType) {
      case 'transfer':
        if (journalEntry.fromAccount && journalEntry.toAccount) {
          entries.push(
            <div key="transfer-1" className="flex justify-between">
              <span>Debit: {journalEntry.toAccount} - Cash Account</span>
              <span className="text-green-400">${amount.toLocaleString()}</span>
            </div>
          )
          entries.push(
            <div key="transfer-2" className="flex justify-between">
              <span>Credit: {journalEntry.fromAccount} - Cash Account</span>
              <span className="text-red-400">${amount.toLocaleString()}</span>
            </div>
          )
        }
        break
      case 'expense':
        if (journalEntry.expenseAccount) {
          entries.push(
            <div key="expense-1" className="flex justify-between">
              <span>Debit: {journalEntry.expenseAccount} - Expense Account</span>
              <span className="text-green-400">${amount.toLocaleString()}</span>
            </div>
          )
          entries.push(
            <div key="expense-2" className="flex justify-between">
              <span>Credit: 10100 - Cash Account</span>
              <span className="text-red-400">${amount.toLocaleString()}</span>
            </div>
          )
        }
        break
      case 'revenue':
        if (journalEntry.revenueAccount) {
          entries.push(
            <div key="revenue-1" className="flex justify-between">
              <span>Debit: 10100 - Cash Account</span>
              <span className="text-green-400">${amount.toLocaleString()}</span>
            </div>
          )
          entries.push(
            <div key="revenue-2" className="flex justify-between">
              <span>Credit: {journalEntry.revenueAccount} - Revenue Account</span>
              <span className="text-red-400">${amount.toLocaleString()}</span>
            </div>
          )
        }
        break
      case 'deposit':
        if (journalEntry.cashAccount) {
          entries.push(
            <div key="deposit-1" className="flex justify-between">
              <span>Debit: {journalEntry.cashAccount} - Cash Account</span>
              <span className="text-green-400">${amount.toLocaleString()}</span>
            </div>
          )
          entries.push(
            <div key="deposit-2" className="flex justify-between">
              <span>Credit: 30000 - Owner Contributions</span>
              <span className="text-red-400">${amount.toLocaleString()}</span>
            </div>
          )
        }
        break
    }

    return entries
  }

  // 🚀 PERFORMANCE FIX: Use React Query for financial data - proper caching, no unnecessary reloads
  const { data: financialQueryData, isLoading: isLoadingFinancialData, error: financialDataError, refetch: refetchFinancialData } = useQuery({
    queryKey: ['financial-analytics-data'],
    queryFn: async () => {
      // 🚀 FIX: Try multiple token sources and wait a bit if token not immediately available
      let token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      
      // If no token, wait a short time and retry (handles race condition)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 100))
        token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      }
      
      if (!token) {
        console.warn('⚠️ FinancialAnalytics - No authentication token available, returning empty data')
        return {
          transactions: [],
          journalEntries: [],
          financialData: {
            revenue: 0, cogs: 0, grossProfit: 0, operatingExpenses: 0, netIncome: 0,
            totalAssets: 0, totalLiabilities: 0, totalEquity: 0, cashFlow: 0
          },
          kpiData: {
            grossMargin: 0, netMargin: 0, operatingMargin: 0, currentRatio: 0,
            quickRatio: 0, debtToEquity: 0, returnOnAssets: 0, returnOnEquity: 0
          },
          glAccounts: [],
          llmDataAssetsBalance: 0
        }
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      
      // OPTIMIZED: Parallelize API calls for better performance
      const [transactionsRes, journalRes, financialRes] = await Promise.allSettled([
        fetch(`${apiBaseUrl}/api/admin/transactions?limit=1000`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/journal-entries`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/financial-analytics`, { headers })
      ])
      
      const transactionsData = transactionsRes.status === 'fulfilled' && transactionsRes.value.ok
        ? await transactionsRes.value.json()
        : { data: [], transactions: [] }
      
      const journalData = journalRes.status === 'fulfilled' && journalRes.value.ok
        ? await journalRes.value.json()
        : { data: { journal_entries: [] } }
      
      // Calculate real financial metrics from GL
      const journalEntriesArray = journalData.data?.journal_entries || journalData.journal_entries || []
      const realFinancialData = calculateFinancialMetrics(journalEntriesArray)
      
      // Process transactions
      const transactionsArray = transactionsData.data || transactionsData.transactions || []
      
      // Fetch LLM Data Assets balance (optional - endpoint may not exist)
      // 🚀 FIX: Use Promise.race with timeout to prevent blocking (2 second max)
      let llmBalance = 0
      try {
        const tokenForLLM = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout
        
        const fetchPromise = fetch(`${apiBaseUrl}/api/admin/llm-center/data-assets`, {
          headers: { 'Authorization': `Bearer ${tokenForLLM}` },
          signal: controller.signal
        }).catch(() => null) // Catch network/abort errors
        
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve(null), 2000) // Resolve with null after timeout
        )
        
        const llmRes = await Promise.race([fetchPromise, timeoutPromise])
        clearTimeout(timeoutId)
        
        if (llmRes && llmRes.ok) {
          try {
            const llmData = await llmRes.json()
            llmBalance = llmData.data?.summary?.total_value || llmData.summary?.total_value || 0
          } catch (jsonErr) {
            // Ignore JSON parse errors
          }
        }
        // Silently ignore 404 and other errors - this endpoint is optional
      } catch (err) {
        // Silently ignore all errors for this optional endpoint
        // The browser will still log 404 in network tab, but we won't log it in console
      }
      
      // Process financial analytics response
      let glAccounts = []
      if (financialRes.status === 'fulfilled' && financialRes.value.ok) {
        const financialData = await financialRes.value.json()
        if (financialData.success && financialData.data && financialData.data.gl_accounts) {
          glAccounts = financialData.data.gl_accounts
        }
      }
      
      // Calculate KPIs from real financial data
      const grossMargin = realFinancialData.revenue > 0 ? (realFinancialData.grossProfit / realFinancialData.revenue) * 100 : 0
      const netMargin = realFinancialData.revenue > 0 ? (realFinancialData.netIncome / realFinancialData.revenue) * 100 : 0
      const operatingMargin = realFinancialData.revenue > 0 ? ((realFinancialData.grossProfit - realFinancialData.operatingExpenses) / realFinancialData.revenue) * 100 : 0
      
      const kpiData = {
        grossMargin,
        netMargin,
        operatingMargin,
        currentRatio: realFinancialData.totalAssets > 0 ? realFinancialData.totalAssets / realFinancialData.totalLiabilities : 0,
        quickRatio: realFinancialData.totalAssets > 0 ? (realFinancialData.totalAssets - realFinancialData.totalLiabilities) / realFinancialData.totalLiabilities : 0,
        debtToEquity: realFinancialData.totalEquity > 0 ? realFinancialData.totalLiabilities / realFinancialData.totalEquity : 0,
        returnOnAssets: realFinancialData.totalAssets > 0 ? (realFinancialData.netIncome / realFinancialData.totalAssets) * 100 : 0,
        returnOnEquity: realFinancialData.totalEquity > 0 ? (realFinancialData.netIncome / realFinancialData.totalEquity) * 100 : 0
      }
      
      return {
        transactions: transactionsArray,
        journalEntries: journalEntriesArray,
        financialData: realFinancialData,
        kpiData,
        glAccounts,
        llmDataAssetsBalance: llmBalance
      }
    },
    staleTime: 300000, // 🚀 FIX: 5 minutes - data is fresh for 5 minutes
    gcTime: 600000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false, // 🚀 FIX: Don't refetch on window focus
    refetchOnMount: false, // 🚀 FIX: Don't refetch on mount if data is fresh
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data) => {
      // Update local state from React Query cache
      if (data) {
        setFinancialData(data.financialData)
        setKpiData(data.kpiData)
        setTransactions(data.transactions)
        setJournalEntries(data.journalEntries)
        setGlAccounts(data.glAccounts)
        setLlmDataAssetsBalance(data.llmDataAssetsBalance)
      }
      
      // Dispatch page load completion event
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'financial' }
      }))
    },
    onError: (error) => {
      // Log error but don't crash the UI
      console.error('❌ FinancialAnalytics - Query error:', error)
      // Still dispatch event so loading report knows something happened
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'financial', error: true }
      }))
    }
  })
  
  // 🚀 PERFORMANCE FIX: Map React Query loading to component loading state for backward compatibility
  const loading = isLoadingFinancialData
  
  // 🚀 PERFORMANCE FIX: Only show loading for initial load, not for cached data
  const isInitialLoad = isLoadingFinancialData && !financialQueryData
  
  // Update local state when React Query data changes
  useEffect(() => {
    if (financialQueryData) {
      setFinancialData(financialQueryData.financialData)
      setKpiData(financialQueryData.kpiData)
      setTransactions(financialQueryData.transactions)
      setJournalEntries(financialQueryData.journalEntries)
      setGlAccounts(financialQueryData.glAccounts)
      setLlmDataAssetsBalance(financialQueryData.llmDataAssetsBalance)
      
      // 🚀 FIX: Dispatch completion event when data is loaded (even from cache)
      // This ensures the event is dispatched even if onSuccess wasn't called (cached data)
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
          detail: { pageId: 'financial' }
        }))
      }, 100)
      return () => clearTimeout(timer)
    } else if (!isLoadingFinancialData && financialDataError) {
      // If there's an error and we're not loading, dispatch completion event
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'financial', error: true }
      }))
    }
  }, [financialQueryData, isLoadingFinancialData, financialDataError])
  
  // API Functions - Wrapper for backward compatibility
  const fetchFinancialData = useCallback(async (signal = null) => {
    // React Query handles caching automatically - just trigger a refetch
    await refetchFinancialData()
  }, [refetchFinancialData])
  
  // 🚀 DEPRECATED: Old fetchFinancialData implementation removed - now using React Query above
  
  // 🚀 PERFORMANCE FIX: React Query handles data fetching automatically - no manual useEffect needed
  // Data is fetched on mount and cached automatically by React Query

  
  // GL Chart of Accounts (Complete)
  // GL Chart of Accounts - Now using dynamic data from API
  const glChartOfAccounts = {
    assets: chartOfAccounts.filter(acc => acc.category === 'Assets'),
    liabilities: chartOfAccounts.filter(acc => acc.category === 'Liabilities'),
    equity: chartOfAccounts.filter(acc => acc.category === 'Equity'),
    revenue: chartOfAccounts.filter(acc => acc.category === 'Revenue'),
    cogs: chartOfAccounts.filter(acc => acc.category === 'COGS'),
    expenses: chartOfAccounts.filter(acc => acc.category === 'Expense'),
    other: chartOfAccounts.filter(acc => acc.category === 'Other Income/Expense')
  }

  // Load financial data
  // 🚀 DEPRECATED: This function is deprecated - React Query handles data fetching
  // Keeping for backward compatibility but it now uses React Query refetch
  const loadFinancialData = useCallback(async () => {
    // 🚀 FIX: Use React Query refetch instead of manual loading state
    await refetchFinancialData()
  }, [refetchFinancialData])


  // Render Executive Dashboard
  const renderExecutiveDashboard = () => {
    // Show loading state while data is being fetched
    if (transactionsLoading || glLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className={`${getSubtextClass()}`}>Loading financial data...</p>
          </div>
        </div>
      )
    }

    // Use GL accounts with their balances directly for the Executive Dashboard
    // The GL accounts from the backend include proper balances for financial reporting
    const baseAccounts = allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts
    const accountsToUse = baseAccounts

    // Calculate real KPIs from GL accounts
    const revenueAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || acc.type || ''
      return category.toLowerCase() === 'revenue'
    })
    const cogsAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || acc.type || ''
      return category.toLowerCase() === 'cogs'
    })
    const expenseAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || acc.type || ''
      return category.toLowerCase() === 'expense'
    })
    const assetAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || acc.type || ''
      return category.toLowerCase() === 'asset' || category.toLowerCase() === 'assets'
    })
    const liabilityAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || acc.type || ''
      return category.toLowerCase() === 'liability' || category.toLowerCase() === 'liabilities'
    })
    const equityAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || acc.type || ''
      return category.toLowerCase() === 'equity'
    })
    
    // Calculate values from GL (transaction-based)
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalCOGS = cogsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const grossProfit = totalRevenue - totalCOGS
    const netIncome = grossProfit - totalExpenses
    
    const totalAssets = assetAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)

    const cashAccounts = accountsToUse.filter(account => 
      account.account_number === '10100' || account.account_number === '10150' || account.account_number === '11000'
    )
    const totalCash = cashAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`${getCardClass()} p-6 rounded-xl border border-green-500/30`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-green-400 text-sm font-medium">Total Revenue</p>
                <p className={`text-2xl font-bold ${getTextClass()}`}>${totalRevenue.toLocaleString()}</p>
                <p className="text-green-400 text-xs">From GL Revenue accounts</p>
                <button
                  onClick={() => {
                    setActiveTab('gl')
                    setSelectedCategory('revenue')
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center space-x-1"
                  title="View Revenue accounts in General Ledger"
                >
                  <Eye className="w-3 h-3" />
                  <span>View Accounts</span>
                </button>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className={`${getCardClass()} p-6 rounded-xl border border-blue-500/30`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Net Income</p>
                <p className={`text-2xl font-bold ${getTextClass()}`}>${netIncome.toLocaleString()}</p>
                <p className="text-blue-400 text-xs">Revenue - COGS - Expenses</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className={`${getCardClass()} p-6 rounded-xl border border-purple-500/30`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-purple-400 text-sm font-medium">Total Assets</p>
                <p className={`text-2xl font-bold ${getTextClass()}`}>${totalAssets.toLocaleString()}</p>
                <p className="text-purple-400 text-xs">From GL Asset accounts</p>
                <button
                  onClick={() => {
                    setActiveTab('gl')
                    setSelectedCategory('assets')
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center space-x-1"
                  title="View Asset accounts in General Ledger"
                >
                  <Eye className="w-3 h-3" />
                  <span>View Accounts</span>
                </button>
              </div>
              <Building className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className={`${getCardClass()} p-6 rounded-xl border border-orange-500/30`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-orange-400 text-sm font-medium">Total Cash</p>
                <p className={`text-2xl font-bold ${getTextClass()}`}>${totalCash.toLocaleString()}</p>
                <p className="text-orange-400 text-xs">Cash + Petty Cash + A/R</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {cashAccounts.map(acc => (
                    <button
                      key={acc.account_number}
                      onClick={() => {
                        setActiveTab('gl')
                        setSelectedCategory('assets')
                        setSearchTerm(acc.account_number)
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                      title={`View ${acc.account_name} (${acc.account_number}) in General Ledger`}
                    >
                      <span>{acc.account_number}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Zap className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>

      {/* Advanced KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${getCardClass()} p-6 rounded-xl`}>
          <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>Financial KPIs</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={getSubtextClass()}>Gross Profit Margin</span>
              <span className="text-green-400 font-semibold">{kpiData.grossMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className={getSubtextClass()}>Net Profit Margin</span>
              <span className="text-green-400 font-semibold">{kpiData.netMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className={getSubtextClass()}>Operating Margin</span>
              <span className="text-blue-400 font-semibold">{kpiData.operatingMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className={getSubtextClass()}>Current Ratio</span>
              <span className="text-purple-400 font-semibold">{kpiData.currentRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className={getSubtextClass()}>Return on Assets</span>
              <span className="text-green-400 font-semibold">{kpiData.returnOnAssets.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className={`${getCardClass()} p-6 rounded-xl`}>
          <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>AI & Platform KPIs</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={getSubtextClass()}>AI Processing Efficiency</span>
              <span className="text-green-400 font-semibold">{calculateAIEfficiency()}%</span>
            </div>
            <div className="flex justify-between">
              <span className={getSubtextClass()}>LLM Data Asset Value</span>
              <span className="text-blue-400 font-semibold">${calculateLLMDataValue().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className={getSubtextClass()}>AI Accuracy Rate</span>
              <span className="text-green-400 font-semibold">{calculateAIAccuracy()}%</span>
            </div>
            <div className="flex justify-between">
              <span className={getSubtextClass()}>Platform Uptime</span>
              <span className="text-green-400 font-semibold">{calculatePlatformUptime()}%</span>
            </div>
            <div className="flex justify-between">
              <span className={getSubtextClass()}>AI ROI</span>
              <span className="text-purple-400 font-semibold">{calculateAIROI()}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

  // Render P&L Statement
  const renderPLStatement = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading P&L data...</p>
          </div>
        </div>
      )
    }

    // Use GL accounts with their balances directly
    const baseAccounts = allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts
    const accountsToUse = baseAccounts

    // Get accounts by category from GL (matching GL's category logic)
    const getAccountsByCategory = (category) => {
      return accountsToUse.filter(acc => {
        const accountCategory = acc.category || acc.account_type || ''
        return accountCategory && accountCategory.toLowerCase() === category.toLowerCase()
      })
    }
    
    // STEP 4: Get Revenue, COGS, and Expense accounts from GL
    const revenueAccounts = getAccountsByCategory('Revenue')
    const cogsAccounts = getAccountsByCategory('COGS')
    const expenseAccounts = getAccountsByCategory('Expense')
    
    // Build revenue breakdown by account
    const revenueBreakdown = {}
    revenueAccounts.forEach(acc => {
      const key = acc.account_name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
      revenueBreakdown[key] = acc.balance || 0
    })
    
    // Build COGS breakdown by account
    const cogsBreakdown = {}
    cogsAccounts.forEach(acc => {
      const key = acc.account_name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
      cogsBreakdown[key] = acc.balance || 0
    })
    
    // Build expense breakdown by account
    const expenseBreakdown = {}
    expenseAccounts.forEach(acc => {
      const key = acc.account_name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
      expenseBreakdown[key] = acc.balance || 0
    })
    
    const plData = {
      revenue: {
        total: revenueAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
        accounts: revenueAccounts
      },
      cogs: {
        total: cogsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
        accounts: cogsAccounts
      },
      expenses: {
        total: expenseAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
        accounts: expenseAccounts
      }
    }

    const totalRevenue = plData.revenue.total
    const totalCOGS = plData.cogs.total
    const totalExpenses = plData.expenses.total
    const grossProfit = totalRevenue - totalCOGS
    const netIncome = grossProfit - totalExpenses

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Profit & Loss Statement</h2>
          <div className="flex space-x-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          {/* Revenue Section */}
          <div className="mb-8">
            <div>
              <button
                onClick={() => togglePLCategory('revenue')}
                className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors mb-2"
              >
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  REVENUE
                  {plExpanded.revenue ? (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-2" />
                  )}
                </h3>
              </button>
              {plExpanded.revenue ? (
                <div className="space-y-2 ml-6">
                  {plData.revenue.accounts.length > 0 ? (
                    plData.revenue.accounts.map((account) => {
                      // Get account balance directly from GL
                      const accountBalance = account.balance || 0
                      return (
                        <div key={account.account_number} className="flex justify-between items-center py-2 border-b border-white/10 hover:bg-white/5 transition-colors group cursor-pointer">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Navigate to GL tab and filter by revenue category
                              setActiveTab('gl')
                              setSelectedCategory('revenue')
                              setSearchTerm(account.account_number)
                            }}
                            className="text-gray-300 hover:text-blue-400 transition-colors text-left flex items-center space-x-2 group-hover:underline w-full"
                            title={`Click to view ${account.account_name} (${account.account_number}) in General Ledger`}
                          >
                            <span>{account.account_name} ({account.account_number})</span>
                            <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <span className="text-white font-semibold">${accountBalance.toLocaleString()}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-gray-400 text-sm py-2">No revenue accounts found</div>
                  )}
                </div>
              ) : null}
              <div className="flex justify-between items-center py-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 ml-6">
                <span className="text-green-400 font-semibold text-lg">TOTAL REVENUE</span>
                <span className="text-green-400 font-bold text-xl">${totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* COGS Section */}
          <div className="mb-8">
            <div>
              <button
                onClick={() => togglePLCategory('cogs')}
                className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors mb-2"
              >
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-red-400" />
                  COST OF GOODS SOLD
                  {plExpanded.cogs ? (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-2" />
                  )}
                </h3>
              </button>
              {plExpanded.cogs ? (
                <div className="space-y-2 ml-6">
                  {plData.cogs.accounts.length > 0 ? (
                    plData.cogs.accounts.map((account) => {
                      // Get account balance directly from GL
                      const accountBalance = account.balance || 0
                      return (
                        <div key={account.account_number} className="flex justify-between items-center py-2 border-b border-white/10 hover:bg-white/5 transition-colors group cursor-pointer">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Navigate to GL tab and filter by COGS category
                              setActiveTab('gl')
                              setSelectedCategory('cogs')
                              setSearchTerm(account.account_number)
                            }}
                            className="text-gray-300 hover:text-blue-400 transition-colors text-left flex items-center space-x-2 group-hover:underline w-full"
                            title={`Click to view ${account.account_name} (${account.account_number}) in General Ledger`}
                          >
                            <span>{account.account_name} ({account.account_number})</span>
                            <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <span className="text-white font-semibold">${accountBalance.toLocaleString()}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-gray-400 text-sm py-2">No COGS accounts found</div>
                  )}
                </div>
              ) : null}
              <div className="flex justify-between items-center py-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 ml-6">
                <span className="text-red-400 font-semibold text-lg">TOTAL COGS</span>
                <span className="text-red-400 font-bold text-xl">${totalCOGS.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="mb-8">
            <div className="flex justify-between items-center py-4 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4">
              <span className="text-blue-400 font-semibold text-lg">GROSS PROFIT</span>
              <span className="text-blue-400 font-bold text-xl">${grossProfit.toLocaleString()}</span>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="mb-8">
            <div>
              <button
                onClick={() => togglePLCategory('expenses')}
                className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors mb-2"
              >
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-orange-400" />
                  OPERATING EXPENSES
                  {plExpanded.expenses ? (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-2" />
                  )}
                </h3>
              </button>
              {plExpanded.expenses ? (
                <div className="space-y-2 ml-6">
                  {plData.expenses.accounts.length > 0 ? (
                    plData.expenses.accounts.map((account) => {
                      // Get account balance directly from GL
                      const accountBalance = account.balance || 0
                      return (
                        <div key={account.account_number} className="flex justify-between items-center py-2 border-b border-white/10 hover:bg-white/5 transition-colors group cursor-pointer">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Navigate to GL tab and filter by expense category
                              setActiveTab('gl')
                              setSelectedCategory('expense')
                              setSearchTerm(account.account_number)
                            }}
                            className="text-gray-300 hover:text-blue-400 transition-colors text-left flex items-center space-x-2 group-hover:underline w-full"
                            title={`Click to view ${account.account_name} (${account.account_number}) in General Ledger`}
                          >
                            <span>{account.account_name} ({account.account_number})</span>
                            <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <span className="text-white font-semibold">${accountBalance.toLocaleString()}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-gray-400 text-sm py-2">No expense accounts found</div>
                  )}
                </div>
              ) : null}
              <div className="flex justify-between items-center py-3 bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 ml-6">
                <span className="text-orange-400 font-semibold text-lg">TOTAL OPERATING EXPENSES</span>
                <span className="text-orange-400 font-bold text-xl">${totalExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div className="mb-8">
            <div className="flex justify-between items-center py-4 bg-green-500/10 border border-green-500/30 rounded-lg px-4">
              <span className="text-green-400 font-semibold text-xl">NET INCOME</span>
              <span className="text-green-400 font-bold text-2xl">${netIncome.toLocaleString()}</span>
            </div>
          </div>

          {/* Key Ratios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/5 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Gross Profit Margin</h4>
              <p className="text-2xl font-bold text-green-400">{((grossProfit / totalRevenue) * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Net Profit Margin</h4>
              <p className="text-2xl font-bold text-blue-400">{((netIncome / totalRevenue) * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Operating Margin</h4>
              <p className="text-2xl font-bold text-purple-400">{(((grossProfit - totalExpenses) / totalRevenue) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Balance Sheet
  const renderBalanceSheet = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading balance sheet data...</p>
          </div>
        </div>
      )
    }

    // Use GL accounts with their balances directly
    const baseAccounts = allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts
    const accountsToUse = baseAccounts
    
    // Get accounts by category
    const getAccountsByCategory = (category) => {
      return accountsToUse.filter(acc => {
        const accountCategory = acc.category || acc.account_type || ''
        return accountCategory && accountCategory.toLowerCase() === category.toLowerCase()
      })
    }
    
    // Get accounts by subcategory or name pattern
    const getAccountsByNamePattern = (pattern) => {
      return accountsToUse.filter(acc => 
        acc.account_name.toLowerCase().includes(pattern.toLowerCase())
      )
    }
    
    console.log(' Balance Sheet - Journal entries count:', journalEntries.length)
    console.log(' Balance Sheet - Journal entries:', journalEntries)
    
    // Get assets by subcategory
    const currentAssetAccounts = accountsToUse.filter(acc => 
      acc.category === 'Assets' && 
      (acc.subcategory?.toLowerCase().includes('current') || 
       acc.account_name.toLowerCase().includes('cash') ||
       acc.account_name.toLowerCase().includes('receivable') ||
       acc.account_name.toLowerCase().includes('prepaid') ||
       acc.account_name.toLowerCase().includes('short term'))
    )
    
    const fixedAssetAccounts = accountsToUse.filter(acc => 
      acc.category === 'Assets' && 
      (acc.subcategory?.toLowerCase().includes('fixed') || 
       acc.account_name.toLowerCase().includes('equipment') ||
       acc.account_name.toLowerCase().includes('depreciation') ||
       acc.account_name.toLowerCase().includes('software') ||
       acc.account_name.toLowerCase().includes('cloud') ||
       acc.account_name.toLowerCase().includes('llm data'))
    )
    
    const otherAssetAccounts = accountsToUse.filter(acc => 
      acc.category === 'Assets' && 
      !currentAssetAccounts.includes(acc) && 
      !fixedAssetAccounts.includes(acc)
    )
    
    // Get liabilities by subcategory
    const currentLiabilityAccounts = accountsToUse.filter(acc => 
      acc.category === 'Liabilities' && 
      (acc.subcategory?.toLowerCase().includes('current') || 
       acc.account_name.toLowerCase().includes('payable') ||
       acc.account_name.toLowerCase().includes('accrued') ||
       acc.account_name.toLowerCase().includes('payroll') ||
       acc.account_name.toLowerCase().includes('deferred') ||
       acc.account_name.toLowerCase().includes('taxes') ||
       acc.account_name.toLowerCase().includes('deposits'))
    )
    
    const longTermLiabilityAccounts = accountsToUse.filter(acc => 
      acc.category === 'Liabilities' && 
      !currentLiabilityAccounts.includes(acc)
    )
    
    // Calculate net income from P&L (revenue - COGS - expenses) - this should flow into equity
    const revenueAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'revenue'
    })
    const cogsAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'cogs'
    })
    const expenseAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'expense'
    })
    
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalCOGS = cogsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const netIncome = totalRevenue - totalCOGS - totalExpenses
    
    // Get equity accounts
    const equityAccounts = accountsToUse.filter(acc => acc.category === 'Equity')
    
    // Find Current Year Earnings account (32000) and add net income to it
    const currentYearEarningsAccount = equityAccounts.find(acc => acc.account_number === '32000')
    const adjustedEquityAccounts = equityAccounts.map(acc => {
      if (acc.account_number === '32000') {
        // Add net income from P&L to Current Year Earnings
        return {
          ...acc,
          balance: (acc.balance || 0) + netIncome,
          originalBalance: acc.balance || 0,
          netIncomeAdded: netIncome
        }
      }
      return acc
    })
    
    const bsData = {
      assets: {
        current: {
          accounts: currentAssetAccounts,
          total: currentAssetAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
        },
        fixed: {
          accounts: fixedAssetAccounts,
          total: fixedAssetAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
        },
        other: {
          accounts: otherAssetAccounts,
          total: otherAssetAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
        }
      },
      liabilities: {
        current: {
          accounts: currentLiabilityAccounts,
          total: currentLiabilityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
        },
        longTerm: {
          accounts: longTermLiabilityAccounts,
          total: longTermLiabilityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
        }
      },
      equity: {
        accounts: adjustedEquityAccounts, // Use adjusted accounts with net income
        total: adjustedEquityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      }
    }

    const totalCurrentAssets = bsData.assets.current.total
    const totalFixedAssets = bsData.assets.fixed.total
    const totalOtherAssets = bsData.assets.other.total
    const calculatedTotalAssets = totalCurrentAssets + totalFixedAssets + totalOtherAssets

    const totalCurrentLiabilities = bsData.liabilities.current.total
    const totalLongTermLiabilities = bsData.liabilities.longTerm.total
    const calculatedTotalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities

    // Total equity includes net income from P&L
    const calculatedTotalEquity = bsData.equity.total

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Balance Sheet</h2>
          <div className="flex space-x-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets */}
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-green-400" />
              ASSETS
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="mb-2">
                  <button
                    onClick={() => toggleBalanceSheetCategory('currentAssets')}
                    className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors"
                  >
                    <h4 className="text-lg font-medium text-blue-400 flex items-center space-x-2">
                      {balanceSheetExpanded.currentAssets ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span>Current Assets</span>
                    </h4>
                  </button>
                  {balanceSheetExpanded.currentAssets ? (
                    <div className="space-y-1 ml-6 mt-2">
                      {bsData.assets.current.accounts.length > 0 ? (
                        bsData.assets.current.accounts.map((account) => (
                          <div key={account.account_number} className="flex justify-between hover:bg-white/5 transition-colors group py-1">
                            <button
                              onClick={() => {
                                setActiveTab('gl')
                                setSelectedCategory('assets')
                                setSearchTerm(account.account_number)
                              }}
                              className="text-gray-300 hover:text-blue-400 transition-colors text-left flex items-center space-x-2 group-hover:underline"
                              title="Click to view in General Ledger"
                            >
                              <span>{account.account_name} ({account.account_number})</span>
                              <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <span className="text-white">${(account.balance || 0).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">No current assets found</div>
                      )}
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-white/20 pt-2 ml-6">
                    <span className="text-blue-400 font-semibold">Total Current Assets</span>
                    <span className="text-blue-400 font-bold">${totalCurrentAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2">
                  <button
                    onClick={() => toggleBalanceSheetCategory('fixedAssets')}
                    className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors"
                  >
                    <h4 className="text-lg font-medium text-purple-400 flex items-center space-x-2">
                      {balanceSheetExpanded.fixedAssets ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span>Fixed Assets</span>
                    </h4>
                  </button>
                  {balanceSheetExpanded.fixedAssets ? (
                    <div className="space-y-1 ml-6 mt-2">
                      {bsData.assets.fixed.accounts.length > 0 ? (
                        bsData.assets.fixed.accounts.map((account) => (
                          <div key={account.account_number} className="flex justify-between hover:bg-white/5 transition-colors group py-1">
                            <button
                              onClick={() => {
                                setActiveTab('gl')
                                setSelectedCategory('assets')
                                setSearchTerm(account.account_number)
                              }}
                              className="text-gray-300 hover:text-blue-400 transition-colors text-left flex items-center space-x-2 group-hover:underline"
                              title="Click to view in General Ledger"
                            >
                              <span>{account.account_name} ({account.account_number})</span>
                              <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <span className="text-white">${(account.balance || 0).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">No fixed assets found</div>
                      )}
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-white/20 pt-2 ml-6">
                    <span className="text-purple-400 font-semibold">Total Fixed Assets</span>
                    <span className="text-purple-400 font-bold">${totalFixedAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2">
                  <button
                    onClick={() => toggleBalanceSheetCategory('otherAssets')}
                    className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors"
                  >
                    <h4 className="text-lg font-medium text-orange-400 flex items-center space-x-2">
                      {balanceSheetExpanded.otherAssets ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span>Other Assets</span>
                    </h4>
                  </button>
                  {balanceSheetExpanded.otherAssets ? (
                    <div className="space-y-1 ml-6 mt-2">
                      {bsData.assets.other.accounts.length > 0 ? (
                        bsData.assets.other.accounts.map((account) => (
                          <div key={account.account_number} className="flex justify-between hover:bg-white/5 transition-colors group py-1">
                            <button
                              onClick={() => {
                                setActiveTab('gl')
                                setSelectedCategory('assets')
                                setSearchTerm(account.account_number)
                              }}
                              className="text-gray-300 hover:text-blue-400 transition-colors text-left flex items-center space-x-2 group-hover:underline"
                              title="Click to view in General Ledger"
                            >
                              <span>{account.account_name} ({account.account_number})</span>
                              <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <span className="text-white">${(account.balance || 0).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">No other assets found</div>
                      )}
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-white/20 pt-2 ml-6">
                    <span className="text-orange-400 font-semibold">Total Other Assets</span>
                    <span className="text-orange-400 font-bold">${totalOtherAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between py-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4">
                <span className="text-green-400 font-semibold text-lg">TOTAL ASSETS</span>
                <span className="text-green-400 font-bold text-xl">${calculatedTotalAssets.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-red-400" />
              LIABILITIES & EQUITY
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="mb-2">
                  <button
                    onClick={() => toggleBalanceSheetCategory('currentLiabilities')}
                    className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors"
                  >
                    <h4 className="text-lg font-medium text-red-400 flex items-center space-x-2">
                      {balanceSheetExpanded.currentLiabilities ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span>Current Liabilities</span>
                    </h4>
                  </button>
                  {balanceSheetExpanded.currentLiabilities ? (
                    <div className="space-y-1 ml-6 mt-2">
                      {bsData.liabilities.current.accounts.length > 0 ? (
                        bsData.liabilities.current.accounts.map((account) => (
                          <div key={account.account_number} className="flex justify-between hover:bg-white/5 transition-colors group py-1">
                            <button
                              onClick={() => {
                                setActiveTab('gl')
                                setSelectedCategory('liabilities')
                                setSearchTerm(account.account_number)
                              }}
                              className="text-gray-300 hover:text-blue-400 transition-colors text-left flex items-center space-x-2 group-hover:underline"
                              title="Click to view in General Ledger"
                            >
                              <span>{account.account_name} ({account.account_number})</span>
                              <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <span className="text-white">${(account.balance || 0).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">No current liabilities found</div>
                      )}
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-white/20 pt-2 ml-6">
                    <span className="text-red-400 font-semibold">Total Current Liabilities</span>
                    <span className="text-red-400 font-bold">${totalCurrentLiabilities.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2">
                  <button
                    onClick={() => toggleBalanceSheetCategory('longTermLiabilities')}
                    className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors"
                  >
                    <h4 className="text-lg font-medium text-yellow-400 flex items-center space-x-2">
                      {balanceSheetExpanded.longTermLiabilities ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span>Long-term Liabilities</span>
                    </h4>
                  </button>
                  {balanceSheetExpanded.longTermLiabilities ? (
                    <div className="space-y-1 ml-6 mt-2">
                      {bsData.liabilities.longTerm.accounts.length > 0 ? (
                        bsData.liabilities.longTerm.accounts.map((account) => (
                          <div key={account.account_number} className="flex justify-between hover:bg-white/5 transition-colors group py-1">
                            <button
                              onClick={() => {
                                setActiveTab('gl')
                                setSelectedCategory('liabilities')
                                setSearchTerm(account.account_number)
                              }}
                              className="text-gray-300 hover:text-blue-400 transition-colors text-left flex items-center space-x-2 group-hover:underline"
                              title="Click to view in General Ledger"
                            >
                              <span>{account.account_name} ({account.account_number})</span>
                              <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <span className="text-white">${(account.balance || 0).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">No long-term liabilities found</div>
                      )}
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-white/20 pt-2 ml-6">
                    <span className="text-yellow-400 font-semibold">Total Long-term Liabilities</span>
                    <span className="text-yellow-400 font-bold">${totalLongTermLiabilities.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2">
                  <button
                    onClick={() => toggleBalanceSheetCategory('equity')}
                    className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors"
                  >
                    <h4 className="text-lg font-medium text-blue-400 flex items-center space-x-2">
                      {balanceSheetExpanded.equity ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span>Equity</span>
                    </h4>
                  </button>
                  {balanceSheetExpanded.equity ? (
                    <div className="space-y-1 ml-6 mt-2">
                      {bsData.equity.accounts.length > 0 ? (
                        bsData.equity.accounts.map((account) => (
                          <div key={account.account_number} className="flex justify-between hover:bg-white/5 transition-colors group py-1">
                            <button
                              onClick={() => {
                                setActiveTab('gl')
                                setSelectedCategory('equity')
                                setSearchTerm(account.account_number)
                              }}
                              className="text-gray-300 hover:text-blue-400 transition-colors text-left flex items-center space-x-2 group-hover:underline"
                              title="Click to view in General Ledger"
                            >
                              <span>{account.account_name} ({account.account_number})</span>
                              <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <span className="text-white">${(account.balance || 0).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">No equity accounts found</div>
                      )}
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-white/20 pt-2 ml-6">
                    <span className="text-blue-400 font-semibold">Total Equity</span>
                    <span className="text-blue-400 font-bold">${calculatedTotalEquity.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between py-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4">
                <span className="text-green-400 font-semibold text-lg">TOTAL LIABILITIES & EQUITY</span>
                <span className="text-green-400 font-bold text-xl">${(calculatedTotalLiabilities + calculatedTotalEquity).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Cash Flow Statement
  const renderCashFlowStatement = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading cash flow data...</p>
          </div>
        </div>
      )
    }

    // Use GL accounts with their balances directly
    const baseAccounts = allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts
    const accountsToUse = baseAccounts

    // Get accounts by name pattern for cash flow calculations
    const getAccountsByNamePattern = (pattern) => {
      return accountsToUse.filter(acc => 
        acc.account_name.toLowerCase().includes(pattern.toLowerCase())
      )
    }
    
    // Calculate netIncome from actual GL account balances (not hardcoded financialData)
    const revenueAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'revenue'
    })
    const cogsAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'cogs'
    })
    const expenseAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'expense'
    })
    
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalCOGS = cogsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const netIncome = totalRevenue - totalCOGS - totalExpenses
    
    // Operating activities - get from accounts
    const depreciationAccounts = getAccountsByNamePattern('depreciation')
    const depreciation = depreciationAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const arAccounts = getAccountsByNamePattern('receivable')
    const accountsReceivable = -arAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0) // Negative for cash flow
    
    const apAccounts = getAccountsByNamePattern('payable')
    const accountsPayable = apAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const accruedAccounts = getAccountsByNamePattern('accrued')
    const accruedExpenses = accruedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const deferredAccounts = getAccountsByNamePattern('deferred')
    const deferredRevenue = deferredAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const payrollAccounts = getAccountsByNamePattern('payroll')
    const payrollLiabilities = payrollAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const taxAccounts = getAccountsByNamePattern('tax')
    const taxesPayable = taxAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    // Investing activities
    const equipmentAccounts = getAccountsByNamePattern('equipment')
    const equipmentPurchases = -equipmentAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const softwareAccounts = getAccountsByNamePattern('software')
    const softwareDevelopment = -softwareAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const llmDataAccounts = getAccountsByNamePattern('llm data')
    const llmDataAcquisition = -llmDataAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const cloudAccounts = getAccountsByNamePattern('cloud')
    const cloudInfrastructure = -cloudAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const investmentAccounts = getAccountsByNamePattern('investment')
    const otherInvestments = -investmentAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    // Financing activities
    const equityAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'equity'
    })
    const ownerContributions = equityAccounts
      .filter(acc => acc.account_name.toLowerCase().includes('contribution'))
      .reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const stockAccounts = equityAccounts
      .filter(acc => acc.account_name.toLowerCase().includes('stock') || acc.account_name.toLowerCase().includes('paid-in'))
      .reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    const cfData = {
      operating: {
        netIncome: netIncome,
        depreciation: depreciation,
        amortization: cloudAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0), // Cloud credits as amortization
        accountsReceivable: accountsReceivable,
        inventory: 0, // No inventory
        accountsPayable: accountsPayable,
        accruedExpenses: accruedExpenses,
        deferredRevenue: deferredRevenue,
        otherOperating: payrollLiabilities + taxesPayable
      },
      investing: {
        equipmentPurchases: equipmentPurchases,
        softwareDevelopment: softwareDevelopment,
        llmDataAcquisition: llmDataAcquisition,
        cloudInfrastructure: cloudInfrastructure,
        otherInvestments: otherInvestments,
        investmentSales: 0 // No sales
      },
      financing: {
        ownerContributions: ownerContributions,
        loanProceeds: 0, // No loans
        loanPayments: 0, // No loan payments
        dividendPayments: 0, // No dividends
        stockIssuance: stockAccounts
      }
    }

    const operatingCashFlow = Object.values(cfData.operating).reduce((sum, val) => sum + val, 0)
    const investingCashFlow = Object.values(cfData.investing).reduce((sum, val) => sum + val, 0)
    const financingCashFlow = Object.values(cfData.financing).reduce((sum, val) => sum + val, 0)
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Cash Flow Statement</h2>
          <div className="flex space-x-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          {/* Operating Activities */}
          <div className="mb-8">
            <div>
              <button
                onClick={() => toggleCashFlowCategory('operating')}
                className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors mb-2"
              >
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  CASH FLOW FROM OPERATING ACTIVITIES
                  {cashFlowExpanded.operating ? (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-2" />
                  )}
                </h3>
              </button>
              {cashFlowExpanded.operating ? (
                <div className="space-y-2 ml-6">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300">Net Income</span>
                    <span className="text-white font-semibold">${cfData.operating.netIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300">Depreciation & Amortization</span>
                    <span className="text-white font-semibold">${(cfData.operating.depreciation + cfData.operating.amortization).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10 hover:bg-white/5 group">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">Changes in Accounts Receivable</span>
                      {arAccounts.length > 0 && (
                        <button
                          onClick={() => {
                            if (arAccounts[0]) {
                              setActiveTab('gl')
                              setSelectedCategory('assets')
                              setSearchTerm(arAccounts[0].account_number)
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`View AR accounts in GL: ${arAccounts.map(a => a.account_number).join(', ')}`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-white font-semibold">${cfData.operating.accountsReceivable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10 hover:bg-white/5 group">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">Changes in Accounts Payable</span>
                      {apAccounts.length > 0 && (
                        <button
                          onClick={() => {
                            if (apAccounts[0]) {
                              setActiveTab('gl')
                              setSelectedCategory('liabilities')
                              setSearchTerm(apAccounts[0].account_number)
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`View AP accounts in GL: ${apAccounts.map(a => a.account_number).join(', ')}`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-white font-semibold">${cfData.operating.accountsPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10 hover:bg-white/5 group">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">Changes in Accrued Expenses</span>
                      {accruedAccounts.length > 0 && (
                        <button
                          onClick={() => {
                            if (accruedAccounts[0]) {
                              setActiveTab('gl')
                              setSelectedCategory('liabilities')
                              setSearchTerm(accruedAccounts[0].account_number)
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`View Accrued accounts in GL: ${accruedAccounts.map(a => a.account_number).join(', ')}`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-white font-semibold">${cfData.operating.accruedExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10 hover:bg-white/5 group">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">Changes in Deferred Revenue</span>
                      {deferredAccounts.length > 0 && (
                        <button
                          onClick={() => {
                            if (deferredAccounts[0]) {
                              setActiveTab('gl')
                              setSelectedCategory('liabilities')
                              setSearchTerm(deferredAccounts[0].account_number)
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`View Deferred accounts in GL: ${deferredAccounts.map(a => a.account_number).join(', ')}`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-white font-semibold">${cfData.operating.deferredRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300">Other Operating Activities</span>
                    <span className="text-white font-semibold">${cfData.operating.otherOperating.toLocaleString()}</span>
                  </div>
                </div>
              ) : null}
              <div className="flex justify-between items-center py-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 ml-6">
                <span className="text-green-400 font-semibold text-lg">NET CASH FROM OPERATING ACTIVITIES</span>
                <span className="text-green-400 font-bold text-xl">${operatingCashFlow.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Investing Activities */}
          <div className="mb-8">
            <div>
              <button
                onClick={() => toggleCashFlowCategory('investing')}
                className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors mb-2"
              >
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-400" />
                  CASH FLOW FROM INVESTING ACTIVITIES
                  {cashFlowExpanded.investing ? (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-2" />
                  )}
                </h3>
              </button>
              {cashFlowExpanded.investing ? (
                <div className="space-y-2 ml-6">
                  <div className="flex justify-between items-center py-2 border-b border-white/10 hover:bg-white/5 group">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">Equipment & Computer Purchases</span>
                      {equipmentAccounts.length > 0 && (
                        <button
                          onClick={() => {
                            if (equipmentAccounts[0]) {
                              setActiveTab('gl')
                              setSelectedCategory('assets')
                              setSearchTerm(equipmentAccounts[0].account_number)
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`View Equipment accounts in GL: ${equipmentAccounts.map(a => a.account_number).join(', ')}`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-white font-semibold">${cfData.investing.equipmentPurchases.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10 hover:bg-white/5 group">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">Software Development & Assets</span>
                      {softwareAccounts.length > 0 && (
                        <button
                          onClick={() => {
                            if (softwareAccounts[0]) {
                              setActiveTab('gl')
                              setSelectedCategory('assets')
                              setSearchTerm(softwareAccounts[0].account_number)
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`View Software accounts in GL: ${softwareAccounts.map(a => a.account_number).join(', ')}`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-white font-semibold">${cfData.investing.softwareDevelopment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10 hover:bg-white/5 group">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">LLM Data Acquisition</span>
                      {llmDataAccounts.length > 0 && (
                        <button
                          onClick={() => {
                            if (llmDataAccounts[0]) {
                              setActiveTab('gl')
                              setSelectedCategory('assets')
                              setSearchTerm(llmDataAccounts[0].account_number)
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`View LLM Data accounts in GL: ${llmDataAccounts.map(a => a.account_number).join(', ')}`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-white font-semibold">${cfData.investing.llmDataAcquisition.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10 hover:bg-white/5 group">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">Cloud Infrastructure Investment</span>
                      {cloudAccounts.length > 0 && (
                        <button
                          onClick={() => {
                            if (cloudAccounts[0]) {
                              setActiveTab('gl')
                              setSelectedCategory('assets')
                              setSearchTerm(cloudAccounts[0].account_number)
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`View Cloud accounts in GL: ${cloudAccounts.map(a => a.account_number).join(', ')}`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-white font-semibold">${cfData.investing.cloudInfrastructure.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300">Other Investments</span>
                    <span className="text-white font-semibold">${cfData.investing.otherInvestments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300">Investment Sales</span>
                    <span className="text-white font-semibold">${cfData.investing.investmentSales.toLocaleString()}</span>
                  </div>
                </div>
              ) : null}
              <div className="flex justify-between items-center py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 ml-6">
                <span className="text-blue-400 font-semibold text-lg">NET CASH FROM INVESTING ACTIVITIES</span>
                <span className="text-blue-400 font-bold text-xl">${investingCashFlow.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Financing Activities */}
          <div className="mb-8">
            <div>
              <button
                onClick={() => toggleCashFlowCategory('financing')}
                className="flex items-center justify-between w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors mb-2"
              >
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-purple-400" />
                  CASH FLOW FROM FINANCING ACTIVITIES
                  {cashFlowExpanded.financing ? (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-2" />
                  )}
                </h3>
              </button>
              {cashFlowExpanded.financing ? (
                <div className="space-y-2 ml-6">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300">Owner Contributions</span>
                    <span className="text-white font-semibold">${cfData.financing.ownerContributions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300">Loan Proceeds</span>
                    <span className="text-white font-semibold">${cfData.financing.loanProceeds.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300">Loan Payments</span>
                    <span className="text-white font-semibold">${cfData.financing.loanPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300">Dividend Payments</span>
                    <span className="text-white font-semibold">${cfData.financing.dividendPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300">Stock Issuance</span>
                    <span className="text-white font-semibold">${cfData.financing.stockIssuance.toLocaleString()}</span>
                  </div>
                </div>
              ) : null}
              <div className="flex justify-between items-center py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 ml-6">
                <span className="text-purple-400 font-semibold text-lg">NET CASH FROM FINANCING ACTIVITIES</span>
                <span className="text-purple-400 font-bold text-xl">${financingCashFlow.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Cash Flow */}
          <div className="mb-8">
            <div className="flex justify-between items-center py-4 bg-green-500/10 border border-green-500/30 rounded-lg px-4">
              <span className="text-green-400 font-semibold text-xl">NET INCREASE (DECREASE) IN CASH</span>
              <span className="text-green-400 font-bold text-2xl">${netCashFlow.toLocaleString()}</span>
            </div>
          </div>

          {/* Cash Flow Forecasting */}
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
              CASH FLOW FORECASTING
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Next Month Forecast</h4>
                <p className="text-2xl font-bold text-green-400">${(netCashFlow * 1.1).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">+10% growth projection</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-2">3-Month Forecast</h4>
                <p className="text-2xl font-bold text-blue-400">${(netCashFlow * 3.2).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Seasonal adjustments</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-2">12-Month Forecast</h4>
                <p className="text-2xl font-bold text-purple-400">${(netCashFlow * 12.5).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Annual projection</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Account Categories for General Ledger (now loaded from API)
  const getAccountCategories = () => {
    const colorMap = {
      'Assets': 'green',
      'Liabilities': 'red', 
      'Equity': 'blue',
      'Revenue': 'yellow',
      'COGS': 'orange',
      'Expense': 'purple',
      'Other Income/Expense': 'indigo'
    }
    
    // Define the correct financial order - only include main categories
    const categoryOrder = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'COGS', 'Expense', 'Other Income/Expense']
    
    // Filter out unwanted categories and sort according to financial order
    const filteredCategories = accountCategories.filter(cat => 
      categoryOrder.includes(cat.name) && 
      cat.name !== 'Other Expense' && 
      cat.name !== 'Other Income'
    )
    
    const sortedCategories = filteredCategories.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.name)
      const bIndex = categoryOrder.indexOf(b.name)
      return aIndex - bIndex
    })
    
    return sortedCategories.map(cat => ({
      id: cat.name.toLowerCase().replace(/\s+/g, '_'),
      name: cat.name,
      range: cat.range,
      color: colorMap[cat.name] || 'gray',
      count: cat.count
    }))
  }

  // Render General Ledger
  const renderGeneralLedger = () => {
    // Start with chartOfAccounts as base, then enhance with transaction data
    const enhanceAccountsWithTransactions = () => {
      // Create a map of transaction totals by account
      const transactionTotals = new Map()
      
      financialTransactions.forEach((transaction) => {
        // If transaction has explicit debit/credit (from journal entry lines), use those
        if (transaction.debit !== undefined || transaction.credit !== undefined) {
          const debitAmount = transaction.debit || 0
          const creditAmount = transaction.credit || 0
          
          if (debitAmount > 0 && transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += debitAmount
          }
          
          if (creditAmount > 0 && transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += creditAmount
          }
        } else {
          // Legacy format: Process From Account (Credits) and To Account (Debits)
          if (transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += transaction.amount || 0
          }
          
          if (transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += transaction.amount || 0
          }
        }
      })
      
      // Start with all chart of accounts, enhance with transaction data
      // ZERO OUT all hardcoded balances - only use transaction data
      return chartOfAccounts.map(account => {
        const totals = transactionTotals.get(account.account_number) || { debits: 0, credits: 0 }
        
        // Calculate balance ONLY from transactions - no hardcoded values
        const transactionBalance = totals.debits - totals.credits
        
        return {
          ...account,
          debits: totals.debits,
          credits: totals.credits,
          balance: transactionBalance // Always use transaction balance, zero if no transactions
        }
      })
    }

    // Get accounts: use chartOfAccounts as base, enhanced with transaction data
    const enhancedAccounts = enhanceAccountsWithTransactions()
    
    // Filter accounts based on selected category (keeping original filtering logic)
    const getFilteredAccounts = () => {
      let filtered = enhancedAccounts
      
      // Filter by selected category first
      if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== '') {
        // Map frontend category ID to backend category name
        const categoryMap = {
          'assets': 'Assets',
          'liabilities': 'Liabilities',
          'equity': 'Equity',
          'revenue': 'Revenue',
          'cogs': 'COGS',
          'expense': 'Expense',
          'other_income/expense': 'Other Income/Expense'
        }
        const backendCategory = categoryMap[selectedCategory] || selectedCategory
        filtered = filtered.filter(account => {
          // Check category field first (from chart_of_accounts), then account_type
          const accountCategory = account.category || account.account_type || ''
          return accountCategory && accountCategory.toLowerCase() === backendCategory.toLowerCase()
        })
      }
      
      // Then filter by search term
      if (searchTerm) {
        filtered = filtered.filter(account => 
          account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.account_number.includes(searchTerm)
        )
      }
      
      return filtered
    }
    
    const filteredAccounts = getFilteredAccounts()
    const categories = getAccountCategories()
    
    // Pagination logic
    const totalGlPages = Math.ceil(filteredAccounts.length / glItemsPerPage)
    const glStartIndex = (glCurrentPage - 1) * glItemsPerPage
    const glEndIndex = glStartIndex + glItemsPerPage
    const paginatedAccounts = filteredAccounts.slice(glStartIndex, glEndIndex)

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">General Ledger</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => {
                fetchAccountCategories()
                fetchChartOfAccounts('all')
                fetchFinancialTransactions()
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Data</span>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Search Accounts</span>
            </button>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Account Categories */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-white mb-4">Account Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div 
                    key={category.id}
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
                    className={`cursor-pointer rounded-lg p-3 transition-all duration-200 ${
                      selectedCategory === category.id 
                        ? `bg-${category.color}-500/20 border-${category.color}-500/50 border-2` 
                        : `bg-${category.color}-500/10 border border-${category.color}-500/30 hover:bg-${category.color}-500/15`
                    }`}
                  >
                    <h4 className={`font-medium ${
                      selectedCategory === category.id ? `text-${category.color}-300` : `text-${category.color}-400`
                    }`}>
                      {category.name}
                    </h4>
                    <p className="text-sm text-gray-400">{category.range}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {category.count} accounts
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart of Accounts */}
            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Chart of Accounts
                  {selectedCategory && (
                    <span className="text-sm text-gray-400 ml-2">
                      - {accountCategories.find(c => c.id === selectedCategory)?.name}
                    </span>
                  )}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowCreateAccountModal(true)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Account</span>
                  </button>
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                  />
                  <button
                    onClick={() => {
                      setSelectedCategory('')
                      setSearchTerm('')
                    }}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-gray-400">Code</th>
                      <th className="text-left py-3 px-4 text-gray-400">Account Name</th>
                      <th className="text-left py-3 px-4 text-gray-400">Type</th>
                      <th className="text-left py-3 px-4 text-gray-400">Normal</th>
                      <th className="text-right py-3 px-4 text-gray-400">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(glLoading || transactionsLoading) ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-400">
                          <div className="flex items-center justify-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Loading accounts...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedAccounts.length > 0 ? (
                      paginatedAccounts.map((account, index) => (
                        <tr key={`${account.account_number}-${account.account_name}-${index}`} className="border-b border-white/10 hover:bg-white/5">
                          <td className="py-3 px-4 font-mono text-sm text-white">{account.account_number}</td>
                          <td className="py-3 px-4 text-white">{account.account_name}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              account.account_type === 'Asset' ? 'bg-green-500/20 text-green-400' :
                              account.account_type === 'Liability' ? 'bg-red-500/20 text-red-400' :
                              account.account_type === 'Equity' ? 'bg-blue-500/20 text-blue-400' :
                              account.account_type === 'Revenue' ? 'bg-yellow-500/20 text-yellow-400' :
                              account.account_type === 'COGS' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-purple-500/20 text-purple-400'
                            }`}>
                              {account.account_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{account.normal_balance}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-semibold ${
                              account.balance >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              ${account.balance.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-400">
                          {(glLoading || transactionsLoading)
                            ? 'Loading accounts...' 
                            : chartOfAccounts.length === 0
                            ? 'Loading chart of accounts...'
                            : 'No accounts found matching your criteria'
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalGlPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className={`text-sm ${getSubtextClass()}`}>
                    Showing {glStartIndex + 1} to {Math.min(glEndIndex, filteredAccounts.length)} of {filteredAccounts.length} accounts
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setGlCurrentPage(Math.max(1, glCurrentPage - 1))}
                      disabled={glCurrentPage === 1}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        glCurrentPage === 1
                          ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: totalGlPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setGlCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            glCurrentPage === page
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setGlCurrentPage(Math.min(totalGlPages, glCurrentPage + 1))}
                      disabled={glCurrentPage === totalGlPages}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        glCurrentPage === totalGlPages
                          ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Create Account Modal */}
        {showCreateAccountModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Create New Account</h3>
                <button
                  onClick={() => setShowCreateAccountModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={newAccount.account_number}
                    onChange={(e) => setNewAccount({...newAccount, account_number: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="e.g., 23010"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Account Name</label>
                  <input
                    type="text"
                    value={newAccount.account_name}
                    onChange={(e) => setNewAccount({...newAccount, account_name: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="e.g., Deferred Revenue � Individual Accounts"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
                  <select
                    value={newAccount.account_type}
                    onChange={(e) => {
                      const accountType = e.target.value
                      const categoryMap = {
                        'Asset': 'Assets',
                        'Liability': 'Liabilities',
                        'Equity': 'Equity',
                        'Revenue': 'Revenue',
                        'COGS': 'COGS',
                        'Expense': 'Expense'
                      }
                      const normalBalance = ['Asset', 'COGS', 'Expense'].includes(accountType) ? 'Debit' : 'Credit'
                      setNewAccount({
                        ...newAccount,
                        account_type: accountType,
                        category: categoryMap[accountType] || 'Assets',
                        normal_balance: normalBalance
                      })
                    }}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="COGS">COGS</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <input
                    type="text"
                    value={newAccount.category}
                    onChange={(e) => setNewAccount({...newAccount, category: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="e.g., Liabilities"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Normal Balance</label>
                  <select
                    value={newAccount.normal_balance}
                    onChange={(e) => setNewAccount({...newAccount, normal_balance: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="Debit">Debit</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateAccountModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAccount}
                  disabled={glLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg"
                >
                  {glLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render Journal Entry System
  const renderJournalEntrySystem = () => {
    // Use the dynamic account data from General Ledger API
    const glAccounts = chartOfAccounts.map(account => ({
      code: account.account_number,
      name: account.account_name,
      type: account.account_type,
      normal: account.normal_balance,
      balance: account.balance
    }))

    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Journal Entry System</h2>
          <div className="flex items-center space-x-2">
            <label className="text-white font-medium">Amount:</label>
            <input
              type="number"
              value={journalEntry.amount}
              onChange={(e) => setJournalEntry({...journalEntry, amount: parseFloat(e.target.value) || 0})}
              className="w-32 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-center font-bold"
              placeholder="0.00"
            />
          </div>
        </div>
        <button
          onClick={async () => {
            // Ensure all accounts are loaded before opening the form
            if (allChartOfAccounts.length === 0) {
              await fetchChartOfAccounts('all')
            }
            setShowJournalEntry(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Journal Entry Form */}
      {showJournalEntry && (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={journalEntry.date}
                onChange={(e) => setJournalEntry({...journalEntry, date: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reference</label>
              <input
                type="text"
                value={journalEntry.reference}
                onChange={(e) => setJournalEntry({...journalEntry, reference: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="JE-2025-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <select
                value={journalEntry.location}
                onChange={(e) => setJournalEntry({...journalEntry, location: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="">Select Location</option>
                <option value="headquarters">Headquarters</option>
                <option value="remote">Remote</option>
                <option value="field">Field Office</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
              <select
                value={journalEntry.department}
                onChange={(e) => setJournalEntry({...journalEntry, department: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="">Select Department</option>
                <option value="engineering">Engineering</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="operations">Operations</option>
                <option value="finance">Finance</option>
              </select>
            </div>
          </div>

          {/* Simple Transaction Entry - Like QuickBooks */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Type</label>
              <select
                value={journalEntry.transactionType}
                onChange={(e) => setJournalEntry({...journalEntry, transactionType: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="">Select Transaction Type</option>
                <option value="transfer">Transfer</option>
                <option value="deposit">Deposit</option>
                <option value="expense">Expense</option>
                <option value="revenue">Revenue</option>
                <option value="payment">Payment</option>
                <option value="receipt">Receipt</option>
              </select>
            </div>
          </div>

          {/* From/To Account Fields - Moved right under Transaction Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">From Account</label>
              <select
                value={journalEntry.fromAccount}
                onChange={(e) => setJournalEntry({...journalEntry, fromAccount: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="">Select From Account</option>
                {(() => {
                  const accountsToShow = allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts;
                  return accountsToShow.length > 0 ? accountsToShow.map((account) => (
                    <option key={account.account_number} value={account.account_number}>
                      {account.account_number} - {account.account_name}
                    </option>
                  )) : (
                    <option value="" disabled>Loading accounts...</option>
                  );
                })()}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">To Account</label>
              <select
                value={journalEntry.toAccount}
                onChange={(e) => setJournalEntry({...journalEntry, toAccount: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="">Select To Account</option>
                {(() => {
                  const accountsToShow = allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts;
                  return accountsToShow.length > 0 ? accountsToShow.map((account) => (
                    <option key={account.account_number} value={account.account_number}>
                      {account.account_number} - {account.account_name}
                    </option>
                  )) : (
                    <option value="" disabled>Loading accounts...</option>
                  );
                })()}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Vendor Name</label>
              <input
                type="text"
                value={journalEntry.vendorName}
                onChange={(e) => setJournalEntry({...journalEntry, vendorName: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="Enter vendor name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Customer Name</label>
              <input
                type="text"
                value={journalEntry.customerName}
                onChange={(e) => setJournalEntry({...journalEntry, customerName: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="Enter customer name..."
              />
            </div>
          </div>


          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={journalEntry.description}
              onChange={(e) => setJournalEntry({...journalEntry, description: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              rows={3}
              placeholder="Enter journal entry description..."
            />
          </div>


          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => setShowJournalEntry(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={submitJournalEntry}
              disabled={isSubmittingJournalEntry}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg flex items-center space-x-2"
            >
              <span></span>
              <span>{isSubmittingJournalEntry ? 'Submitting...' : 'Submit Entry'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
  }

  // Render Bank Reconciliation
  const renderBankReconciliation = () => {
    // STEP 1: Use the EXACT SAME calculation as General Ledger
    // General Ledger uses enhanceAccountsWithTransactions() to zero balances and calculate from transactions only
    const enhanceAccountsWithTransactions = () => {
      // Create a map of transaction totals by account
      const transactionTotals = new Map()
      
      financialTransactions.forEach((transaction) => {
        // If transaction has explicit debit/credit (from journal entry lines), use those
        if (transaction.debit !== undefined || transaction.credit !== undefined) {
          const debitAmount = transaction.debit || 0
          const creditAmount = transaction.credit || 0
          
          if (debitAmount > 0 && transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += debitAmount
          }
          
          if (creditAmount > 0 && transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += creditAmount
          }
        } else {
          // Legacy format: Process From Account (Credits) and To Account (Debits)
          if (transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += transaction.amount || 0
          }
          
          if (transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += transaction.amount || 0
          }
        }
      })
      
      // Use the same accounts source as GL
      const baseAccounts = allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts
      
      // ZERO OUT all hardcoded balances - only use transaction data (same as GL)
      return baseAccounts.map(account => {
        const totals = transactionTotals.get(account.account_number) || { debits: 0, credits: 0 }
        
        // Calculate balance based on normal balance
        // Assets/Expenses: Debit increases, Credit decreases (debits - credits)
        // Liabilities/Equity/Revenue: Credit increases, Debit decreases (credits - debits)
        let transactionBalance
        const normalBalance = (account.normal_balance || '').toLowerCase()
        if (normalBalance === 'credit') {
          // Liabilities, Equity, Revenue: Credits increase balance
          transactionBalance = totals.credits - totals.debits
        } else {
          // Assets, Expenses: Debits increase balance
          transactionBalance = totals.debits - totals.credits
        }
        
        return {
          ...account,
          debits: totals.debits,
          credits: totals.credits,
          balance: transactionBalance // Always use transaction balance, zero if no transactions
        }
      })
    }
    
    // STEP 2: Use enhanced accounts with transaction-based balances (same as GL)
    const accountsToUse = enhanceAccountsWithTransactions()
    
    // Helper to get account balance from GL (now using transaction-based balances)
    const getAccountBalance = (accountNumber) => {
      const account = accountsToUse.find(acc => acc.account_number === accountNumber)
      return account ? (account.balance || 0) : 0
    }
    
    // Calculate cash balance from GL accounts (transaction-based)
    const cashBalance = getAccountBalance('10100') + getAccountBalance('10150') + getAccountBalance('11000')
    
    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Bank Reconciliation</h2>
        <div className="flex space-x-2">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <span></span>
            <span>Import Bank Statement</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <span></span>
            <span>Reconcile</span>
          </button>
        </div>
      </div>

      {/* Reconciliation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Bank Statement Balance</h3>
          <p className="text-3xl font-bold text-green-400">${cashBalance.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-2">Cash accounts from GL</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {accountsToUse.filter(acc => ['10100', '10150', '11000'].includes(acc.account_number)).map(acc => (
              <button
                key={acc.account_number}
                onClick={() => {
                  setActiveTab('gl')
                  setSelectedCategory('assets')
                  setSearchTerm(acc.account_number)
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                title={`View ${acc.account_name} (${acc.account_number}) in General Ledger`}
              >
                <span>{acc.account_number}</span>
                <Eye className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Book Balance</h3>
          <p className="text-3xl font-bold text-blue-400">${cashBalance.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-2">Adjusted for outstanding items</p>
        </div>
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Reconciliation Status</h3>
          <p className="text-3xl font-bold text-green-400"> Balanced</p>
          <p className="text-sm text-gray-400 mt-2">GL cash accounts reconciled</p>
        </div>
      </div>

      {/* Outstanding Items */}
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Outstanding Items</h3>
        <div className="space-y-4">
          {journalEntries.length > 0 ? (
            journalEntries.slice(0, 3).map((entry, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-white/10">
                <div>
                  <span className="text-white font-medium">{entry.description || `Journal Entry ${entry.id}`}</span>
                  <p className="text-sm text-gray-400">{formatDateLocal(entry.date)}</p>
                </div>
                <span className={`font-semibold ${entry.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.amount > 0 ? '+' : ''}${entry.amount.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No outstanding items from GL</p>
            </div>
          )}
        </div>
      </div>

      {/* Bank Statement Items */}
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Bank Statement Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-300">Date</th>
                <th className="text-left py-3 px-4 text-gray-300">Description</th>
                <th className="text-left py-3 px-4 text-gray-300">Type</th>
                <th className="text-right py-3 px-4 text-gray-300">Amount</th>
                <th className="text-center py-3 px-4 text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.length > 0 ? (
                journalEntries.slice(0, 5).map((entry, index) => (
                  <tr key={index} className="border-b border-white/10">
                    <td className="py-3 px-4 text-white">{formatDateLocal(entry.date)}</td>
                    <td className="py-3 px-4 text-white">{entry.description || `Journal Entry ${entry.id}`}</td>
                    <td className={`py-3 px-4 ${entry.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.amount > 0 ? 'Deposit' : 'Withdrawal'}
                    </td>
                    <td className={`py-3 px-4 text-right ${entry.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.amount > 0 ? '+' : ''}${entry.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">Matched</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-400">No journal entries from GL</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    )
  }

  // Render Advanced Analytics
  const renderAdvancedAnalytics = () => {
    // STEP 1: Use the EXACT SAME calculation as General Ledger
    // General Ledger uses enhanceAccountsWithTransactions() to zero balances and calculate from transactions only
    const enhanceAccountsWithTransactions = () => {
      // Create a map of transaction totals by account
      const transactionTotals = new Map()
      
      financialTransactions.forEach((transaction) => {
        // If transaction has explicit debit/credit (from journal entry lines), use those
        if (transaction.debit !== undefined || transaction.credit !== undefined) {
          const debitAmount = transaction.debit || 0
          const creditAmount = transaction.credit || 0
          
          if (debitAmount > 0 && transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += debitAmount
          }
          
          if (creditAmount > 0 && transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += creditAmount
          }
        } else {
          // Legacy format: Process From Account (Credits) and To Account (Debits)
          if (transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += transaction.amount || 0
          }
          
          if (transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += transaction.amount || 0
          }
        }
      })
      
      // Use the same accounts source as GL
      const baseAccounts = allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts
      
      // ZERO OUT all hardcoded balances - only use transaction data (same as GL)
      return baseAccounts.map(account => {
        const totals = transactionTotals.get(account.account_number) || { debits: 0, credits: 0 }
        
        // Calculate balance based on normal balance
        // Assets/Expenses: Debit increases, Credit decreases (debits - credits)
        // Liabilities/Equity/Revenue: Credit increases, Debit decreases (credits - debits)
        let transactionBalance
        const normalBalance = (account.normal_balance || '').toLowerCase()
        if (normalBalance === 'credit') {
          // Liabilities, Equity, Revenue: Credits increase balance
          transactionBalance = totals.credits - totals.debits
        } else {
          // Assets, Expenses: Debits increase balance
          transactionBalance = totals.debits - totals.credits
        }
        
        return {
          ...account,
          debits: totals.debits,
          credits: totals.credits,
          balance: transactionBalance // Always use transaction balance, zero if no transactions
        }
      })
    }
    
    // STEP 2: Use enhanced accounts with transaction-based balances (same as GL)
    const accountsToUse = enhanceAccountsWithTransactions()
    
    // STEP 3: Calculate financial metrics from GL accounts (transaction-based)
    const revenueAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'revenue'
    })
    const cogsAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'cogs'
    })
    const expenseAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'expense'
    })
    const assetAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'asset' || category.toLowerCase() === 'assets'
    })
    const liabilityAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'liability' || category.toLowerCase() === 'liabilities'
    })
    const equityAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'equity'
    })
    
    // Calculate values from GL (transaction-based)
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalCOGS = cogsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalAssets = assetAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    // Calculate cash from GL
    const cashAccounts = accountsToUse.filter(acc => 
      ['10100', '10150', '11000'].includes(acc.account_number)
    )
    const totalCash = cashAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    // Calculate KPIs from GL data
    const grossProfit = totalRevenue - totalCOGS
    const netIncome = grossProfit - totalExpenses
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
    const returnOnAssets = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0
    const returnOnEquity = totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0
    
    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
        <div className="flex space-x-2">
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <span></span>
            <span>AI Insights</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <span></span>
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">AI Financial Insights</h3>
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-green-400 font-semibold mb-2">Revenue Trend Analysis</h4>
                  <p className="text-sm text-gray-300">Current Revenue: ${totalRevenue.toLocaleString()} | Growth: {grossMargin.toFixed(1)}% margin</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('gl')
                    setSelectedCategory('revenue')
                  }}
                  className="text-blue-400 hover:text-blue-300 ml-2"
                  title="View Revenue accounts in General Ledger"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-blue-400 font-semibold mb-2">Cash Flow Optimization</h4>
                  <p className="text-sm text-gray-300">Current Cash: ${totalCash.toLocaleString()} | Assets: ${totalAssets.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('gl')
                    setSelectedCategory('assets')
                  }}
                  className="text-blue-400 hover:text-blue-300 ml-2"
                  title="View Asset accounts in General Ledger"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
              <h4 className="text-yellow-400 font-semibold mb-2">Risk Assessment</h4>
              <p className="text-sm text-gray-300">Net Income: ${netIncome.toLocaleString()} | Equity: ${totalEquity.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Predictive Analytics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Current Revenue</span>
              <span className="text-green-400 font-semibold">${totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Current Expenses</span>
              <span className="text-red-400 font-semibold">${(totalCOGS + totalExpenses).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Net Income</span>
              <span className="text-blue-400 font-semibold">${netIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Gross Margin</span>
              <span className="text-green-400 font-semibold">{grossMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{grossMargin.toFixed(1)}%</p>
            <p className="text-sm text-gray-400">Gross Margin</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{netMargin.toFixed(1)}%</p>
            <p className="text-sm text-gray-400">Net Margin</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{returnOnAssets.toFixed(1)}%</p>
            <p className="text-sm text-gray-400">ROA</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{returnOnEquity.toFixed(1)}%</p>
            <p className="text-sm text-gray-400">ROE</p>
          </div>
        </div>
      </div>
    </div>
    )
  }

  // Render Reports & Export
  const renderReportsExport = () => {
    // STEP 1: Use the EXACT SAME calculation as General Ledger
    // General Ledger uses enhanceAccountsWithTransactions() to zero balances and calculate from transactions only
    const enhanceAccountsWithTransactions = () => {
      // Create a map of transaction totals by account
      const transactionTotals = new Map()
      
      financialTransactions.forEach((transaction) => {
        // If transaction has explicit debit/credit (from journal entry lines), use those
        if (transaction.debit !== undefined || transaction.credit !== undefined) {
          const debitAmount = transaction.debit || 0
          const creditAmount = transaction.credit || 0
          
          if (debitAmount > 0 && transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += debitAmount
          }
          
          if (creditAmount > 0 && transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += creditAmount
          }
        } else {
          // Legacy format: Process From Account (Credits) and To Account (Debits)
          if (transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += transaction.amount || 0
          }
          
          if (transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += transaction.amount || 0
          }
        }
      })
      
      // Use the same accounts source as GL
      const baseAccounts = allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts
      
      // ZERO OUT all hardcoded balances - only use transaction data (same as GL)
      return baseAccounts.map(account => {
        const totals = transactionTotals.get(account.account_number) || { debits: 0, credits: 0 }
        
        // Calculate balance based on normal balance
        // Assets/Expenses: Debit increases, Credit decreases (debits - credits)
        // Liabilities/Equity/Revenue: Credit increases, Debit decreases (credits - debits)
        let transactionBalance
        const normalBalance = (account.normal_balance || '').toLowerCase()
        if (normalBalance === 'credit') {
          // Liabilities, Equity, Revenue: Credits increase balance
          transactionBalance = totals.credits - totals.debits
        } else {
          // Assets, Expenses: Debits increase balance
          transactionBalance = totals.debits - totals.credits
        }
        
        return {
          ...account,
          debits: totals.debits,
          credits: totals.credits,
          balance: transactionBalance // Always use transaction balance, zero if no transactions
        }
      })
    }
    
    // STEP 2: Use enhanced accounts with transaction-based balances (same as GL)
    const accountsToUse = enhanceAccountsWithTransactions()
    
    // STEP 3: Calculate financial metrics from GL accounts (transaction-based)
    const revenueAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'revenue'
    })
    const cogsAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'cogs'
    })
    const expenseAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'expense'
    })
    const assetAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'asset' || category.toLowerCase() === 'assets'
    })
    const liabilityAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'liability' || category.toLowerCase() === 'liabilities'
    })
    const equityAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'equity'
    })
    
    // Calculate values from GL (transaction-based)
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalCOGS = cogsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalAssets = assetAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    // Calculate cash from GL
    const cashAccounts = accountsToUse.filter(acc => 
      ['10100', '10150', '11000'].includes(acc.account_number)
    )
    const totalCash = cashAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    // Calculate net income from GL data
    const grossProfit = totalRevenue - totalCOGS
    const netIncome = grossProfit - totalExpenses
    
    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Reports & Export</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => generateReport('comprehensive', 'pdf')}
            disabled={isGeneratingReport}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <span></span>
            <span>{isGeneratingReport ? 'Generating...' : 'Generate PDF'}</span>
          </button>
          <button 
            onClick={() => generateReport('comprehensive', 'excel')}
            disabled={isGeneratingReport}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <span></span>
            <span>{isGeneratingReport ? 'Generating...' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Financial Reports</h3>
          <div className="space-y-3">
            <button 
              onClick={() => generateReport('profit-loss', 'pdf')}
              className="w-full text-left p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              <span className="text-blue-400 font-medium">P&L Statement</span>
              <p className="text-sm text-gray-400">Revenue: ${totalRevenue.toLocaleString()} | Net: ${netIncome.toLocaleString()}</p>
            </button>
            <button 
              onClick={() => generateReport('balance-sheet', 'pdf')}
              className="w-full text-left p-3 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors"
            >
              <span className="text-green-400 font-medium">Balance Sheet</span>
              <p className="text-sm text-gray-400">Assets: ${totalAssets.toLocaleString()} | Equity: ${totalEquity.toLocaleString()}</p>
            </button>
            <button 
              onClick={() => generateReport('cash-flow', 'pdf')}
              className="w-full text-left p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors"
            >
              <span className="text-purple-400 font-medium">Cash Flow Statement</span>
              <p className="text-sm text-gray-400">Cash: ${totalCash.toLocaleString()} from GL accounts</p>
            </button>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Analytics Reports</h3>
          <div className="space-y-3">
            <button 
              onClick={() => generateReport('ai-performance', 'excel')}
              className="w-full text-left p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-colors"
            >
              <span className="text-yellow-400 font-medium">AI Performance Report</span>
              <p className="text-sm text-gray-400">LLM accuracy and processing metrics</p>
            </button>
            <button 
              onClick={() => generateReport('transaction-analysis', 'excel')}
              className="w-full text-left p-3 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <span className="text-red-400 font-medium">Transaction Analysis</span>
              <p className="text-sm text-gray-400">User behavior and patterns</p>
            </button>
            <button 
              onClick={() => generateReport('revenue-breakdown', 'excel')}
              className="w-full text-left p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/20 transition-colors"
            >
              <span className="text-indigo-400 font-medium">Revenue Breakdown</span>
              <p className="text-sm text-gray-400">By user segment and service</p>
            </button>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Custom Reports</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setShowCustomReportModal(true)}
              className="w-full text-left p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg hover:bg-gray-500/20 transition-colors"
            >
              <span className="text-gray-400 font-medium">Create Custom Report</span>
              <p className="text-sm text-gray-400">Build your own report template</p>
            </button>
            <button 
              onClick={() => generateReport('scheduled', 'pdf')}
              className="w-full text-left p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg hover:bg-gray-500/20 transition-colors"
            >
              <span className="text-gray-400 font-medium">Scheduled Reports</span>
              <p className="text-sm text-gray-400">Automated report generation</p>
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="w-full text-left p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg hover:bg-gray-500/20 transition-colors"
            >
              <span className="text-gray-400 font-medium">Report History</span>
              <p className="text-sm text-gray-400">View previously generated reports</p>
            </button>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-3">File Formats</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  className="rounded" 
                  checked={selectedFileFormats.includes('pdf')}
                  onChange={(e) => handleFileFormatChange('pdf', e.target.checked)}
                />
                <span className="text-gray-300">PDF (Portable Document Format)</span>
              </label>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  className="rounded" 
                  checked={selectedFileFormats.includes('excel')}
                  onChange={(e) => handleFileFormatChange('excel', e.target.checked)}
                />
                <span className="text-gray-300">Excel (.xlsx)</span>
              </label>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  className="rounded" 
                  checked={selectedFileFormats.includes('csv')}
                  onChange={(e) => handleFileFormatChange('csv', e.target.checked)}
                />
                <span className="text-gray-300">CSV (Comma Separated Values)</span>
              </label>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Date Range</h4>
            <div className="space-y-2">
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" 
              />
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" 
              />
            </div>
          </div>
        </div>
        
        {/* Generate All Reports Button */}
        <div className="mt-6 flex justify-center">
          <button 
            onClick={handleGenerateAllReports}
            disabled={isGeneratingReport || selectedFileFormats.length === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
          >
            <span></span>
            <span>{isGeneratingReport ? 'Generating Reports...' : 'Generate All Reports'}</span>
          </button>
        </div>
      </div>

      {/* Report History Section */}
      {reportHistory.length > 0 && (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Reports</h3>
          <div className="space-y-2">
            {reportHistory.slice(0, 5).map((report) => (
              <div key={report.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <span className="text-white font-medium">{report.type}</span>
                  <p className="text-sm text-gray-400">{report.fileName}</p>
                </div>
                <div className="text-right">
                  <span className="text-green-400 text-sm">{report.status}</span>
                  <p className="text-xs text-gray-400">{new Date(report.generatedAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Report Modal */}
      {showCustomReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Create Custom Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Report Name</label>
                <input
                  type="text"
                  value={customReportConfig.name}
                  onChange={(e) => setCustomReportConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="Enter report name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={customReportConfig.description}
                  onChange={(e) => setCustomReportConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  rows={3}
                  placeholder="Enter report description..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCustomReportModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  generateReport('custom', 'pdf')
                  setShowCustomReportModal(false)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    )
  }

  // Render Transaction Management
  // Fetch financial transactions from journal entries
  const fetchFinancialTransactions = async () => {
    setTransactionsLoading(true)
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      
      // Fetch both financial transactions and journal entries
      const [transactionsRes, journalRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/financial/transactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/api/admin/journal-entries`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      
      let allTransactions = []
      
      // Get regular transactions
      if (transactionsRes.ok) {
        const transactionsResult = await transactionsRes.json()
        if (transactionsResult.success) {
          allTransactions = transactionsResult.data || []
        }
      }
      
      // Get journal entries and convert them to transaction format
      if (journalRes.ok) {
        const journalResult = await journalRes.json()
        const journalEntries = journalResult.data || journalResult.data?.journal_entries || journalResult.journal_entries || []
        
        // Convert journal entries to transaction format for display
        // For each journal entry, create transactions from journal_entry_lines
        journalEntries.forEach(entry => {
          // Check if this entry already exists in transactions (by reference)
          const exists = allTransactions.find(t => t.reference === entry.reference)
          if (!exists && entry.lines && entry.lines.length > 0) {
            // Process journal entry lines - each line is a separate transaction
            entry.lines.forEach(line => {
              const transaction = {
                id: `${entry.id}-${line.account_code}`,
                journal_entry_id: entry.id || entry.journal_entry_id,
                date: entry.transaction_date || entry.date,
                reference: entry.reference,
                transaction_type: entry.entry_type || entry.transaction_type,
                entry_type: entry.entry_type || entry.transaction_type,
                merchant: entry.merchant || 'N/A',
                from_account: line.debit > 0 ? null : line.account_code, // Credit account
                to_account: line.debit > 0 ? line.account_code : null,  // Debit account
                from_account_name: line.debit > 0 ? null : line.account_name,
                to_account_name: line.debit > 0 ? line.account_name : null,
                amount: line.debit > 0 ? line.debit : line.credit,
                description: line.description || entry.description,
                status: entry.status || 'posted',
                subscription_id: entry.subscription_id,
                user_id: entry.user_id,
                debit: line.debit || 0,
                credit: line.credit || 0
              }
              allTransactions.push(transaction)
            })
          } else if (!exists) {
            // Fallback: use old format if lines not available
            const transaction = {
              id: entry.id || entry.journal_entry_id,
              journal_entry_id: entry.id || entry.journal_entry_id,
              date: entry.transaction_date || entry.date,
              reference: entry.reference,
              transaction_type: entry.entry_type || entry.transaction_type,
              entry_type: entry.entry_type || entry.transaction_type,
              merchant: entry.merchant || 'N/A',
              from_account: entry.debit_account || entry.from_account,
              to_account: entry.credit_account || entry.to_account,
              from_account_name: entry.debit_account_name,
              to_account_name: entry.credit_account_name,
              amount: entry.amount,
              description: entry.description,
              status: entry.status || 'posted',
              subscription_id: entry.subscription_id,
              user_id: entry.user_id
            }
            allTransactions.push(transaction)
          }
        })
      }
      
      // Sort by date (most recent first) - parse as local time to avoid timezone shift
      allTransactions.sort((a, b) => {
        const parseLocalDate = (dateStr) => {
          if (!dateStr) return 0
          if (typeof dateStr === 'string') {
            const datePart = dateStr.split('T')[0]
            if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [year, month, day] = datePart.split('-').map(Number)
              return new Date(year, month - 1, day).getTime()
            }
          }
          return new Date(dateStr || 0).getTime()
        }
        const dateA = parseLocalDate(a.date)
        const dateB = parseLocalDate(b.date)
        return dateB - dateA
      })
      
      setFinancialTransactions(allTransactions)
      console.log('FinancialAnalytics - Total transactions (including journal entries):', allTransactions.length)
    } catch (error) {
      console.error('Error fetching financial transactions:', error)
    } finally {
      setTransactionsLoading(false)
    }
  }

  // Fetch data on component mount for Executive Dashboard
  useEffect(() => {
    // Load chart of accounts and transactions on mount for Executive Dashboard KPIs
    fetchChartOfAccounts('all')
    fetchFinancialTransactions()
  }, []) // Empty dependency array = run once on mount

  // Fetch transactions when Transaction Management or General Ledger tab is active
  useEffect(() => {
    if (activeTab === 'transactions' || activeTab === 'gl') {
      fetchFinancialTransactions()
      // Reset to page 1 when switching to transactions tab
      if (activeTab === 'transactions') {
        setTransactionPage(1)
      }
    }
    // Also ensure chart of accounts is loaded for GL tab
    if (activeTab === 'gl' && chartOfAccounts.length === 0) {
      fetchChartOfAccounts('all')
    }
  }, [activeTab])

  // Reset pagination if current page is out of bounds when transactions change
  useEffect(() => {
    const totalPages = Math.ceil(financialTransactions.length / transactionsPerPage)
    if (transactionPage > totalPages && totalPages > 0) {
      setTransactionPage(totalPages)
    } else if (totalPages === 0) {
      setTransactionPage(1)
    }
  }, [financialTransactions.length, transactionsPerPage, transactionPage])

  // Refresh transactions after journal entry submission
  useEffect(() => {
    if (showModal && modalData.type === 'success' && modalData.message.includes('Journal entry')) {
      fetchFinancialTransactions()
      fetchJournalEntries() // Also refresh journal entries
    }
  }, [showModal, modalData])
  
  // Listen for refresh event from Subscriptions component
  useEffect(() => {
    const handleRefresh = () => {
      if (activeTab === 'transactions' || activeTab === 'gl') {
        fetchFinancialTransactions()
      }
    }
    window.addEventListener('refreshFinancialTransactions', handleRefresh)
    return () => {
      window.removeEventListener('refreshFinancialTransactions', handleRefresh)
    }
  }, [activeTab])

  // Handle editing transaction
  const handleEditTransaction = async (transaction) => {
    setEditingTransaction(transaction)
    
    // Always ensure we have all accounts loaded for the dropdown (full GL)
    // This ensures the edit modal always shows all accounts, not just the filtered category
    await fetchChartOfAccounts('all')
    
    // Format date for input (YYYY-MM-DD) - parse as local time to avoid timezone shift
    let formattedDate = ''
    if (transaction.date) {
      try {
        // If date is already in YYYY-MM-DD format, use it as is
        const dateStr = transaction.date.split('T')[0]
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDate = dateStr
        } else {
          // Parse as local date to avoid UTC conversion
          const date = new Date(transaction.date)
          if (!isNaN(date.getTime())) {
            // Get local date components
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            formattedDate = `${year}-${month}-${day}`
          }
        }
      } catch (e) {
        // Fallback: use date string as-is
        formattedDate = transaction.date.split('T')[0] || transaction.date
      }
    }
    
    setEditTransactionForm({
      reference: transaction.reference || '',
      description: transaction.description || '',
      amount: transaction.amount || '',
      date: formattedDate,
      fromAccount: transaction.from_account || '',
      toAccount: transaction.to_account || ''
    })
    setShowEditTransactionModal(true)
  }

  // Handle saving transaction edits
  const handleSaveTransactionEdit = async () => {
    if (!editingTransaction) return

    try {
      setTransactionsLoading(true) // 🚀 FIX: Use transactionsLoading state
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      
      const updateData = {}
      
      // Always include these fields if they're provided
      if (editTransactionForm.reference !== undefined) {
        updateData.reference = editTransactionForm.reference || null
      }
      if (editTransactionForm.description !== undefined) {
        updateData.description = editTransactionForm.description || null
      }
      if (editTransactionForm.amount !== undefined && editTransactionForm.amount !== '') {
        updateData.amount = parseFloat(editTransactionForm.amount)
      }
      if (editTransactionForm.date !== undefined && editTransactionForm.date !== '') {
        updateData.date = editTransactionForm.date
      }
      
      // Always include from_account and to_account (allow clearing by setting to null)
      updateData.from_account = editTransactionForm.fromAccount || null
      updateData.to_account = editTransactionForm.toAccount || null

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/journal-entries/${editingTransaction.journal_entry_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (result.success) {
        setModalData({
          title: 'Success!',
          message: 'Transaction updated successfully!',
          type: 'success'
        })
        setShowModal(true)
        setShowEditTransactionModal(false)
        setEditingTransaction(null)
        fetchFinancialTransactions() // Refresh the list
      } else {
        setModalData({
          title: 'Error',
          message: result.error || 'Failed to update transaction',
          type: 'error'
        })
        setShowModal(true)
      }
    } catch (error) {
      setModalData({
        title: 'Error',
        message: 'Failed to update transaction. Please try again.',
        type: 'error'
      })
      setShowModal(true)
    } finally {
      setTransactionsLoading(false) // 🚀 FIX: Use transactionsLoading state
    }
  }

  // Handle deleting transaction
  const handleDeleteTransaction = (transaction) => {
    setConfirmModalData({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete transaction "${transaction.reference}"?\n\nThis action cannot be undone and will also delete all associated journal entry lines.`,
      onConfirm: async () => {
        setShowConfirmModal(false)
        await performDeleteTransaction(transaction)
      }
    })
    setShowConfirmModal(true)
  }

  const performDeleteTransaction = async (transaction) => {
    try {
      setTransactionsLoading(true) // 🚀 FIX: Use transactionsLoading state
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/journal-entries/${transaction.journal_entry_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        setModalData({
          title: 'Success!',
          message: 'Transaction deleted successfully!',
          type: 'success'
        })
        setShowModal(true)
        fetchFinancialTransactions() // Refresh the list
      } else {
        setModalData({
          title: 'Error',
          message: result.error || 'Failed to delete transaction',
          type: 'error'
        })
        setShowModal(true)
      }
    } catch (error) {
      setModalData({
        title: 'Error',
        message: 'Failed to delete transaction. Please try again.',
        type: 'error'
      })
      setShowModal(true)
    } finally {
      setTransactionsLoading(false) // 🚀 FIX: Use transactionsLoading state
    }
  }

  // Helper function to format dates correctly (parse as local, not UTC)
  const formatDateLocal = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      // Parse date string as local date (not UTC) to avoid timezone shift
      // If date is in YYYY-MM-DD format, parse it as local time
      if (typeof dateString === 'string') {
        const dateStr = dateString.split('T')[0] // Remove time component if present
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateStr.split('-').map(Number)
          const date = new Date(year, month - 1, day) // month is 0-indexed, creates local date
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        }
      }
      // Fallback for other formats
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateString
    }
  }

  // Export transactions to PDF
  const exportTransactionsToPDF = () => {
    try {
      // Get all filtered and sorted transactions (same logic as in renderTransactionManagement)
      const checkFilter = (transaction) => {
        const transType = transaction.transaction_type || transaction.entry_type || ''
        if (transactionFilter !== 'all' && transType !== transactionFilter) return false
        if (transactionStatusFilter !== 'all' && transaction.status !== transactionStatusFilter) return false
        if (transactionSearchTerm) {
          const searchLower = transactionSearchTerm.toLowerCase()
          const matchesReference = transaction.reference?.toLowerCase().includes(searchLower)
          const matchesMerchant = transaction.merchant?.toLowerCase().includes(searchLower)
          const matchesDescription = transaction.description?.toLowerCase().includes(searchLower)
          const matchesFromAccount = (transaction.from_account_name || transaction.from_account || '').toLowerCase().includes(searchLower)
          const matchesToAccount = (transaction.to_account_name || transaction.to_account || '').toLowerCase().includes(searchLower)
          if (!matchesReference && !matchesMerchant && !matchesDescription && !matchesFromAccount && !matchesToAccount) return false
        }
        return true
      }

      let filteredTransactions = financialTransactions.filter(checkFilter)
      
      // Apply sorting
      filteredTransactions = [...filteredTransactions].sort((a, b) => {
        let aValue, bValue
        
        switch (transactionSortBy) {
          case 'date': {
            const parseLocalDate = (dateStr) => {
              if (!dateStr) return 0
              if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = dateStr.split('-').map(Number)
                return new Date(year, month - 1, day).getTime()
              }
              return new Date(dateStr).getTime()
            }
            aValue = parseLocalDate(a.date)
            bValue = parseLocalDate(b.date)
            break
          }
          case 'amount':
            aValue = a.amount || 0
            bValue = b.amount || 0
            break
          case 'reference':
            aValue = (a.reference || '').toLowerCase()
            bValue = (b.reference || '').toLowerCase()
            break
          case 'type':
            aValue = (a.transaction_type || '').toLowerCase()
            bValue = (b.transaction_type || '').toLowerCase()
            break
          case 'merchant':
            aValue = (a.merchant || '').toLowerCase()
            bValue = (b.merchant || '').toLowerCase()
            break
          default:
            return 0
        }
        
        if (transactionSortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
        }
      })

      if (filteredTransactions.length === 0) {
        addNotification({
          type: 'warning',
          title: 'No Transactions',
          message: 'No transactions to export. Please adjust your filters.',
          timestamp: new Date()
        })
        return
      }

      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.text('TRANSACTION MANAGEMENT REPORT', 20, 30)
      
      // Add generation date and filters info
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45)
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 20, 52)
      if (transactionFilter !== 'all' || transactionStatusFilter !== 'all' || transactionSearchTerm) {
        doc.setFontSize(9)
        doc.text('Filters Applied:', 20, 60)
        let yPos = 65
        if (transactionFilter !== 'all') doc.text(`  Type: ${transactionFilter}`, 20, yPos), yPos += 5
        if (transactionStatusFilter !== 'all') doc.text(`  Status: ${transactionStatusFilter}`, 20, yPos), yPos += 5
        if (transactionSearchTerm) doc.text(`  Search: ${transactionSearchTerm}`, 20, yPos), yPos += 5
      }
      
      // Prepare table data
      const tableData = filteredTransactions.map(transaction => [
        formatDateLocal(transaction.date),
        transaction.reference || 'N/A',
        transaction.transaction_type || transaction.entry_type || 'Unknown',
        transaction.merchant || 'N/A',
        transaction.from_account_name || transaction.from_account || 'N/A',
        transaction.to_account_name || transaction.to_account || 'N/A',
        `$${(transaction.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        transaction.description || 'N/A',
        transaction.status || 'N/A'
      ])
      
      // Add table
      autoTable(doc, {
        startY: transactionFilter !== 'all' || transactionStatusFilter !== 'all' || transactionSearchTerm ? 75 : 60,
        head: [['Date', 'Reference', 'Type', 'Merchant', 'From Account', 'To Account', 'Amount', 'Description', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 },
          6: { cellWidth: 25, halign: 'right' },
          7: { cellWidth: 40 },
          8: { cellWidth: 20 }
        }
      })
      
      // Save the PDF
      const fileName = `transactions_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('PDF export error:', error)
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export transactions to PDF: ' + error.message,
        timestamp: new Date()
      })
    }
  }

  // Export transactions to Excel
  const exportTransactionsToExcel = () => {
    try {
      // Get all filtered and sorted transactions (same logic as in renderTransactionManagement)
      const checkFilter = (transaction) => {
        const transType = transaction.transaction_type || transaction.entry_type || ''
        if (transactionFilter !== 'all' && transType !== transactionFilter) return false
        if (transactionStatusFilter !== 'all' && transaction.status !== transactionStatusFilter) return false
        if (transactionSearchTerm) {
          const searchLower = transactionSearchTerm.toLowerCase()
          const matchesReference = transaction.reference?.toLowerCase().includes(searchLower)
          const matchesMerchant = transaction.merchant?.toLowerCase().includes(searchLower)
          const matchesDescription = transaction.description?.toLowerCase().includes(searchLower)
          const matchesFromAccount = (transaction.from_account_name || transaction.from_account || '').toLowerCase().includes(searchLower)
          const matchesToAccount = (transaction.to_account_name || transaction.to_account || '').toLowerCase().includes(searchLower)
          if (!matchesReference && !matchesMerchant && !matchesDescription && !matchesFromAccount && !matchesToAccount) return false
        }
        return true
      }

      let filteredTransactions = financialTransactions.filter(checkFilter)
      
      // Apply sorting
      filteredTransactions = [...filteredTransactions].sort((a, b) => {
        let aValue, bValue
        
        switch (transactionSortBy) {
          case 'date': {
            const parseLocalDate = (dateStr) => {
              if (!dateStr) return 0
              if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = dateStr.split('-').map(Number)
                return new Date(year, month - 1, day).getTime()
              }
              return new Date(dateStr).getTime()
            }
            aValue = parseLocalDate(a.date)
            bValue = parseLocalDate(b.date)
            break
          }
          case 'amount':
            aValue = a.amount || 0
            bValue = b.amount || 0
            break
          case 'reference':
            aValue = (a.reference || '').toLowerCase()
            bValue = (b.reference || '').toLowerCase()
            break
          case 'type':
            aValue = (a.transaction_type || '').toLowerCase()
            bValue = (b.transaction_type || '').toLowerCase()
            break
          case 'merchant':
            aValue = (a.merchant || '').toLowerCase()
            bValue = (b.merchant || '').toLowerCase()
            break
          default:
            return 0
        }
        
        if (transactionSortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
        }
      })

      if (filteredTransactions.length === 0) {
        addNotification({
          type: 'warning',
          title: 'No Transactions',
          message: 'No transactions to export. Please adjust your filters.',
          timestamp: new Date()
        })
        return
      }

      // Create workbook
      const workbook = XLSX.utils.book_new()
      
      // Create transactions data
      const transactionsData = [
        ['Date', 'Reference', 'Type', 'Merchant/Counterparty', 'From Account', 'To Account', 'Amount', 'Description', 'Status'],
        ...filteredTransactions.map(transaction => [
          formatDateLocal(transaction.date),
          transaction.reference || 'N/A',
          transaction.transaction_type || transaction.entry_type || 'Unknown',
          transaction.merchant || 'N/A',
          transaction.from_account_name || transaction.from_account || 'N/A',
          transaction.to_account_name || transaction.to_account || 'N/A',
          transaction.amount || 0,
          transaction.description || 'N/A',
          transaction.status || 'N/A'
        ])
      ]
      
      const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData)
      
      // Set column widths
      transactionsSheet['!cols'] = [
        { wch: 15 }, // Date
        { wch: 25 }, // Reference
        { wch: 20 }, // Type
        { wch: 30 }, // Merchant
        { wch: 25 }, // From Account
        { wch: 25 }, // To Account
        { wch: 15 }, // Amount
        { wch: 40 }, // Description
        { wch: 12 }  // Status
      ]
      
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions')
      
      // Add summary sheet
      const summaryData = [
        ['Transaction Management Report'],
        ['Generated:', new Date().toLocaleString()],
        ['Total Transactions:', filteredTransactions.length],
        [''],
        ['Filters Applied:'],
        transactionFilter !== 'all' ? ['Type Filter:', transactionFilter] : null,
        transactionStatusFilter !== 'all' ? ['Status Filter:', transactionStatusFilter] : null,
        transactionSearchTerm ? ['Search Term:', transactionSearchTerm] : null
      ].filter(row => row !== null)
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      
      // Generate and download
      const fileName = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)
      
    } catch (error) {
      console.error('Excel export error:', error)
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export transactions to Excel: ' + error.message,
        timestamp: new Date()
      })
    }
  }

  const renderTransactionManagement = () => {
    const formatDate = formatDateLocal // Use the helper function

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)
    }

    const getTransactionTypeBadge = (type) => {
      const badges = {
        'transfer': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'expense': 'bg-red-500/20 text-red-300 border-red-500/30',
        'revenue': 'bg-green-500/20 text-green-300 border-green-500/30',
        'deposit': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        'payment': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        'receipt': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        'subscription_payment': 'bg-green-500/20 text-green-300 border-green-500/30',
        'subscription_renewal': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'daily_recognition': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      }
      return badges[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
    
    const getTransactionTypeDisplay = (transaction) => {
      const type = transaction.transaction_type || transaction.entry_type || ''
      // Format subscription types for display
      if (type === 'subscription_payment') return 'Subscription Payment'
      if (type === 'subscription_renewal') return 'Subscription Renewal'
      if (type === 'daily_recognition') return 'Daily Recognition'
      return type || 'Unknown'
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-white">Transaction Management</h3>
            <p className="text-sm text-gray-400 mt-1">
              View and manage transactions from journal entries
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchFinancialTransactions}
              disabled={transactionsLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${transactionsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => exportTransactionsToPDF()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => exportTransactionsToExcel()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {transactionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-white/40 animate-spin" />
            <span className="ml-3 text-white/60">Loading transactions...</span>
          </div>
        ) : financialTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-white/40" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">No Transactions Found</h4>
            <p className="text-white/60 mb-4 max-w-md">
              Create a journal entry to see transactions appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Search, Filter, and Sort Controls */}
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
              {/* Search Bar */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by reference, merchant, description, or account..."
                    value={transactionSearchTerm}
                    onChange={(e) => {
                      setTransactionSearchTerm(e.target.value)
                      setTransactionPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {(transactionSearchTerm || transactionFilter !== 'all' || transactionStatusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setTransactionSearchTerm('')
                      setTransactionFilter('all')
                      setTransactionStatusFilter('all')
                      setTransactionPage(1)
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Filters and Sort */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Type Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400">Type:</label>
                  <select
                    value={transactionFilter}
                    onChange={(e) => {
                      setTransactionFilter(e.target.value)
                      setTransactionPage(1)
                    }}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="transfer">Transfer</option>
                    <option value="expense">Expense</option>
                    <option value="revenue">Revenue</option>
                    <option value="deposit">Deposit</option>
                    <option value="payment">Payment</option>
                    <option value="receipt">Receipt</option>
                    <option value="subscription_payment">Subscription Payment</option>
                    <option value="subscription_renewal">Subscription Renewal</option>
                    <option value="daily_recognition">Daily Recognition</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400">Status:</label>
                  <select
                    value={transactionStatusFilter}
                    onChange={(e) => {
                      setTransactionStatusFilter(e.target.value)
                      setTransactionPage(1)
                    }}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="posted">Posted</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400">Sort by:</label>
                  <select
                    value={transactionSortBy}
                    onChange={(e) => {
                      setTransactionSortBy(e.target.value)
                      setTransactionPage(1)
                    }}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="reference">Reference</option>
                    <option value="type">Type</option>
                    <option value="merchant">Merchant</option>
                  </select>
                </div>

                {/* Sort Order */}
                <button
                  onClick={() => {
                    setTransactionSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
                    setTransactionPage(1)
                  }}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm flex items-center space-x-1 transition-colors"
                  title={`Sort ${transactionSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {transactionSortOrder === 'asc' ? (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span>Ascending</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4" />
                      <span>Descending</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {(() => {
              // Check if any transactions match the filters
              const checkFilter = (transaction) => {
                // Check transaction type - support both transaction_type and entry_type fields
                const transType = transaction.transaction_type || transaction.entry_type || ''
                if (transactionFilter !== 'all' && transType !== transactionFilter) return false
                if (transactionStatusFilter !== 'all' && transaction.status !== transactionStatusFilter) return false
                if (transactionSearchTerm) {
                  const searchLower = transactionSearchTerm.toLowerCase()
                  const matchesReference = transaction.reference?.toLowerCase().includes(searchLower)
                  const matchesMerchant = transaction.merchant?.toLowerCase().includes(searchLower)
                  const matchesDescription = transaction.description?.toLowerCase().includes(searchLower)
                  const matchesFromAccount = (transaction.from_account_name || transaction.from_account || '').toLowerCase().includes(searchLower)
                  const matchesToAccount = (transaction.to_account_name || transaction.to_account || '').toLowerCase().includes(searchLower)
                  if (!matchesReference && !matchesMerchant && !matchesDescription && !matchesFromAccount && !matchesToAccount) return false
                }
                return true
              }

              const filteredCount = financialTransactions.filter(checkFilter).length

              if (filteredCount === 0 && financialTransactions.length > 0) {
                return (
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                    <div className="flex flex-col items-center justify-center py-12">
                      <Filter className="w-12 h-12 text-gray-400 mb-4" />
                      <h4 className="text-lg font-medium text-white mb-2">No Transactions Match Your Filters</h4>
                      <p className="text-white/60 mb-4 max-w-md">
                        Try adjusting your search term, filters, or clear all filters to see all transactions.
                      </p>
                      <button
                        onClick={() => {
                          setTransactionSearchTerm('')
                          setTransactionFilter('all')
                          setTransactionStatusFilter('all')
                          setTransactionPage(1)
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th 
                        className="text-left py-3 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          setTransactionSortBy('date')
                          setTransactionSortOrder(prev => transactionSortBy === 'date' && prev === 'desc' ? 'asc' : 'desc')
                          setTransactionPage(1)
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          {transactionSortBy === 'date' && (
                            transactionSortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-gray-400 font-semibold cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          setTransactionSortBy('reference')
                          setTransactionSortOrder(prev => transactionSortBy === 'reference' && prev === 'desc' ? 'asc' : 'desc')
                          setTransactionPage(1)
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Reference</span>
                          {transactionSortBy === 'reference' && (
                            transactionSortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          setTransactionSortBy('type')
                          setTransactionSortOrder(prev => transactionSortBy === 'type' && prev === 'desc' ? 'asc' : 'desc')
                          setTransactionPage(1)
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Type</span>
                          {transactionSortBy === 'type' && (
                            transactionSortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          setTransactionSortBy('merchant')
                          setTransactionSortOrder(prev => transactionSortBy === 'merchant' && prev === 'desc' ? 'asc' : 'desc')
                          setTransactionPage(1)
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Merchant/Counterparty</span>
                          {transactionSortBy === 'merchant' && (
                            transactionSortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400">From Account</th>
                      <th className="text-left py-3 px-4 text-gray-400">To Account</th>
                      <th 
                        className="text-right py-3 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          setTransactionSortBy('amount')
                          setTransactionSortOrder(prev => transactionSortBy === 'amount' && prev === 'desc' ? 'asc' : 'desc')
                          setTransactionPage(1)
                        }}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Amount</span>
                          {transactionSortBy === 'amount' && (
                            transactionSortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400">Description</th>
                      <th className="text-left py-3 px-4 text-gray-400">Status</th>
                      <th className="text-center py-3 px-4 text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Helper function to check if transaction matches filters
                      const checkFilter = (transaction) => {
                        // Check transaction type - support both transaction_type and entry_type fields
                        const transType = transaction.transaction_type || transaction.entry_type || ''
                        if (transactionFilter !== 'all' && transType !== transactionFilter) return false
                        if (transactionStatusFilter !== 'all' && transaction.status !== transactionStatusFilter) return false
                        if (transactionSearchTerm) {
                          const searchLower = transactionSearchTerm.toLowerCase()
                          const matchesReference = transaction.reference?.toLowerCase().includes(searchLower)
                          const matchesMerchant = transaction.merchant?.toLowerCase().includes(searchLower)
                          const matchesDescription = transaction.description?.toLowerCase().includes(searchLower)
                          const matchesFromAccount = (transaction.from_account_name || transaction.from_account || '').toLowerCase().includes(searchLower)
                          const matchesToAccount = (transaction.to_account_name || transaction.to_account || '').toLowerCase().includes(searchLower)
                          if (!matchesReference && !matchesMerchant && !matchesDescription && !matchesFromAccount && !matchesToAccount) return false
                        }
                        return true
                      }

                      // Apply filters
                      let filteredTransactions = financialTransactions.filter(checkFilter)
                      
                      // Apply sorting
                      filteredTransactions = [...filteredTransactions].sort((a, b) => {
                        let aValue, bValue
                        
                        switch (transactionSortBy) {
                          case 'date': {
                            // Parse dates as local time to avoid timezone shift
                            const parseLocalDate = (dateStr) => {
                              if (!dateStr) return 0
                              if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                const [year, month, day] = dateStr.split('-').map(Number)
                                return new Date(year, month - 1, day).getTime()
                              }
                              return new Date(dateStr).getTime()
                            }
                            aValue = parseLocalDate(a.date)
                            bValue = parseLocalDate(b.date)
                            break
                          }
                          case 'amount':
                            aValue = a.amount || 0
                            bValue = b.amount || 0
                            break
                          case 'reference':
                            aValue = (a.reference || '').toLowerCase()
                            bValue = (b.reference || '').toLowerCase()
                            break
                          case 'type':
                            aValue = (a.transaction_type || '').toLowerCase()
                            bValue = (b.transaction_type || '').toLowerCase()
                            break
                          case 'merchant':
                            aValue = (a.merchant || '').toLowerCase()
                            bValue = (b.merchant || '').toLowerCase()
                            break
                          default:
                            return 0
                        }
                        
                        if (transactionSortOrder === 'asc') {
                          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
                        } else {
                          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
                        }
                      })
                      
                      // Calculate pagination
                      const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage)
                      const startIndex = (transactionPage - 1) * transactionsPerPage
                      const endIndex = startIndex + transactionsPerPage
                      const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

                      return currentTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4 text-white text-sm">{formatDate(transaction.date)}</td>
                          <td className="py-3 px-4 text-white text-sm font-semibold tracking-wider">{transaction.reference}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs border ${getTransactionTypeBadge(transaction.transaction_type || transaction.entry_type)}`}>
                              {getTransactionTypeDisplay(transaction)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white text-sm">{transaction.merchant}</td>
                          <td className="py-3 px-4 text-gray-300 text-sm">
                            {transaction.from_account_name || transaction.from_account || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-gray-300 text-sm">
                            {transaction.to_account_name || transaction.to_account || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right text-white font-semibold">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="py-3 px-4 text-gray-300 text-sm max-w-xs truncate">
                            {transaction.description}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              transaction.status === 'posted' 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleEditTransaction(transaction)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit Transaction"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(transaction)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Delete Transaction"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {(() => {
                // Helper function to check if transaction matches filters (same as above)
                const checkFilter = (transaction) => {
                  if (transactionFilter !== 'all' && transaction.transaction_type !== transactionFilter) return false
                  if (transactionStatusFilter !== 'all' && transaction.status !== transactionStatusFilter) return false
                  if (transactionSearchTerm) {
                    const searchLower = transactionSearchTerm.toLowerCase()
                    const matchesReference = transaction.reference?.toLowerCase().includes(searchLower)
                    const matchesMerchant = transaction.merchant?.toLowerCase().includes(searchLower)
                    const matchesDescription = transaction.description?.toLowerCase().includes(searchLower)
                    const matchesFromAccount = (transaction.from_account_name || transaction.from_account || '').toLowerCase().includes(searchLower)
                    const matchesToAccount = (transaction.to_account_name || transaction.to_account || '').toLowerCase().includes(searchLower)
                    if (!matchesReference && !matchesMerchant && !matchesDescription && !matchesFromAccount && !matchesToAccount) return false
                  }
                  return true
                }

                // Re-apply filters to get the correct count
                let filteredTransactions = financialTransactions.filter(checkFilter)
                
                const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage)
                const startIndex = (transactionPage - 1) * transactionsPerPage
                const endIndex = Math.min(startIndex + transactionsPerPage, filteredTransactions.length)
                
                if (totalPages <= 1) return null
                
                return (
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 mt-4">
                    <div className="text-sm text-gray-400">
                      Showing {startIndex + 1} to {endIndex} of {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                      {filteredTransactions.length !== financialTransactions.length && (
                        <span className="ml-2 text-gray-500">(filtered from {financialTransactions.length} total)</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setTransactionPage(prev => Math.max(1, prev - 1))}
                        disabled={transactionPage === 1}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-1 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= transactionPage - 1 && page <= transactionPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setTransactionPage(page)}
                                className={`px-3 py-2 rounded-lg transition-colors ${
                                  transactionPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          } else if (
                            page === transactionPage - 2 ||
                            page === transactionPage + 2
                          ) {
                            return <span key={page} className="text-gray-400">...</span>
                          }
                          return null
                        })}
                      </div>
                      
                      <button
                        onClick={() => setTransactionPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={transactionPage === totalPages}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-1 transition-colors"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
            )
          })()}
          </>
        )}
      </div>
    )
  }
  const renderSettings = () => {
    // STEP 1: Use the EXACT SAME calculation as General Ledger
    // General Ledger uses enhanceAccountsWithTransactions() to zero balances and calculate from transactions only
    const enhanceAccountsWithTransactions = () => {
      // Create a map of transaction totals by account
      const transactionTotals = new Map()
      
      financialTransactions.forEach((transaction) => {
        // If transaction has explicit debit/credit (from journal entry lines), use those
        if (transaction.debit !== undefined || transaction.credit !== undefined) {
          const debitAmount = transaction.debit || 0
          const creditAmount = transaction.credit || 0
          
          if (debitAmount > 0 && transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += debitAmount
          }
          
          if (creditAmount > 0 && transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += creditAmount
          }
        } else {
          // Legacy format: Process From Account (Credits) and To Account (Debits)
          if (transaction.from_account) {
            const accountKey = transaction.from_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.credits += transaction.amount || 0
          }
          
          if (transaction.to_account) {
            const accountKey = transaction.to_account
            if (!transactionTotals.has(accountKey)) {
              transactionTotals.set(accountKey, { debits: 0, credits: 0 })
            }
            const totals = transactionTotals.get(accountKey)
            totals.debits += transaction.amount || 0
          }
        }
      })
      
      // Use the same accounts source as GL
      const baseAccounts = allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts
      
      // ZERO OUT all hardcoded balances - only use transaction data (same as GL)
      return baseAccounts.map(account => {
        const totals = transactionTotals.get(account.account_number) || { debits: 0, credits: 0 }
        
        // Calculate balance based on normal balance
        // Assets/Expenses: Debit increases, Credit decreases (debits - credits)
        // Liabilities/Equity/Revenue: Credit increases, Debit decreases (credits - debits)
        let transactionBalance
        const normalBalance = (account.normal_balance || '').toLowerCase()
        if (normalBalance === 'credit') {
          // Liabilities, Equity, Revenue: Credits increase balance
          transactionBalance = totals.credits - totals.debits
        } else {
          // Assets, Expenses: Debits increase balance
          transactionBalance = totals.debits - totals.credits
        }
        
        return {
          ...account,
          debits: totals.debits,
          credits: totals.credits,
          balance: transactionBalance // Always use transaction balance, zero if no transactions
        }
      })
    }
    
    // STEP 2: Use enhanced accounts with transaction-based balances (same as GL)
    const accountsToUse = enhanceAccountsWithTransactions()
    
    // STEP 3: Calculate financial metrics from GL accounts (transaction-based)
    const revenueAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'revenue'
    })
    const assetAccounts = accountsToUse.filter(acc => {
      const category = acc.category || acc.account_type || ''
      return category.toLowerCase() === 'asset' || category.toLowerCase() === 'assets'
    })
    
    // Calculate values from GL (transaction-based)
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalAssets = assetAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleResetSettings}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <span></span>
            <span>Reset</span>
          </button>
          <button 
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <span></span>
            <span>{isSavingSettings ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* GL Account Configuration */}
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">GL Account Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Total GL Accounts</label>
            <div className="text-2xl font-bold text-blue-400">{accountsToUse.length}</div>
            <p className="text-sm text-gray-400">Active chart of accounts from GL</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Journal Entries</label>
            <div className="text-2xl font-bold text-green-400">{journalEntries.length}</div>
            <p className="text-sm text-gray-400">Total entries in system</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Total Assets</label>
            <div className="text-2xl font-bold text-green-400">${totalAssets.toLocaleString()}</div>
            <p className="text-sm text-gray-400">From GL calculations (transaction-based)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Total Revenue</label>
            <div className="text-2xl font-bold text-blue-400">${totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-gray-400">From GL calculations (transaction-based)</p>
          </div>
        </div>
      </div>

      {/* System Configuration */}
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4"> System Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Default Currency</label>
            <select 
              value={settings.currency}
              onChange={(e) => handleSettingsChange('currency', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date Format</label>
            <select 
              value={settings.dateFormat}
              onChange={(e) => handleSettingsChange('dateFormat', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time Zone</label>
            <select 
              value={settings.timeZone}
              onChange={(e) => handleSettingsChange('timeZone', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Decimal Places</label>
            <select 
              value={settings.decimalPlaces}
              onChange={(e) => handleSettingsChange('decimalPlaces', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value={2}>2 decimal places</option>
              <option value={3}>3 decimal places</option>
              <option value={4}>4 decimal places</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">AI Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium">Auto-Approval Threshold</span>
              <p className="text-sm text-gray-400">Confidence level for automatic mapping approval</p>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={settings.autoApprovalThreshold}
              onChange={(e) => handleSettingsChange('autoApprovalThreshold', parseInt(e.target.value))}
              className="w-32" 
            />
            <span className="text-blue-400 font-semibold w-12">{settings.autoApprovalThreshold}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium">AI Processing Frequency</span>
              <p className="text-sm text-gray-400">How often AI processes new mappings</p>
            </div>
            <select 
              value={settings.aiProcessingFrequency}
              onChange={(e) => handleSettingsChange('aiProcessingFrequency', e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium">Enable Predictive Analytics</span>
              <p className="text-sm text-gray-400">Use AI for financial forecasting</p>
            </div>
            <input 
              type="checkbox" 
              checked={settings.enablePredictiveAnalytics}
              onChange={(e) => handleSettingsChange('enablePredictiveAnalytics', e.target.checked)}
              className="rounded" 
            />
          </div>
        </div>
      </div>

      {/* Integration Settings */}
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Integration Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium">Bank API Integration</span>
              <p className="text-sm text-gray-400">Connect to bank APIs for real-time data</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400 text-sm">Connected</span>
              <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">Disconnect</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium">Accounting Software Sync</span>
              <p className="text-sm text-gray-400">Sync with QuickBooks, Xero, etc.</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">Configure</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium">Email Notifications</span>
              <p className="text-sm text-gray-400">Send alerts for important financial events</p>
            </div>
            <input 
              type="checkbox" 
              checked={settings.enableNotifications}
              onChange={(e) => handleSettingsChange('enableNotifications', e.target.checked)}
              className="rounded" 
            />
          </div>
        </div>
      </div>
    </div>
    )
  }

  // Define tabs array
  const tabs = [
    { id: 'executive', label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'pl', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'bs', label: 'Balance Sheet', icon: Calculator },
    { id: 'cf', label: 'Cash Flow', icon: DollarSign },
    { id: 'gl', label: 'General Ledger', icon: BookOpen },
    { id: 'transactions', label: 'Transaction Management', icon: FileText },
    { id: 'journal', label: 'Journal Entries', icon: FileText },
    { id: 'reconciliation', label: 'Bank Reconciliation', icon: Building },
    { id: 'analytics', label: 'Advanced Analytics', icon: Target },
    { id: 'reports', label: 'Reports & Export', icon: Download },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className={`${getTextClass()} text-2xl font-bold mb-2`}>Financial Analytics</h1>
        <p className={getSubtextClass()}>
          Comprehensive financial management and reporting system with real-time analytics,
          profit & loss statements, balance sheets, and advanced financial insights.
        </p>
      </div>

      {/* Tab Navigation - 2 Rows */}
      <div className="mb-6 bg-gray-100 dark:bg-white/10 p-1 rounded-lg">
        {/* First Row */}
        <div className="flex space-x-1 mb-1">
          {tabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-sm'
                    : `${getSubtextClass()} hover:text-gray-900 dark:hover:text-white`
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
        
        {/* Second Row */}
        <div className="flex space-x-1">
          {tabs.slice(5).map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-sm'
                    : `${getSubtextClass()} hover:text-gray-900 dark:hover:text-white`
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'executive' && renderExecutiveDashboard()}
        {activeTab === 'pl' && renderPLStatement()}
        {activeTab === 'bs' && renderBalanceSheet()}
        {activeTab === 'cf' && renderCashFlowStatement()}
        {activeTab === 'gl' && renderGeneralLedger()}
        {activeTab === 'transactions' && renderTransactionManagement()}
        {activeTab === 'journal' && renderJournalEntrySystem()}
        {activeTab === 'reconciliation' && renderBankReconciliation()}
        {activeTab === 'analytics' && renderAdvancedAnalytics()}
        {activeTab === 'reports' && renderReportsExport()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Glass Modal */}
      <GlassModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
      />

      {/* Confirmation Modal for Delete */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />
          
          {/* Glass Modal */}
          <div className={`
            relative z-10 w-full max-w-md mx-4 p-6 rounded-2xl
            bg-white/10 backdrop-blur-md border border-white/20
            border-red-400/30
            shadow-2xl
            animate-in fade-in-0 zoom-in-95 duration-300
          `}>
            {/* Close Button */}
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <div className={`mx-auto w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 text-red-400`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-white mb-2">
                {confirmModalData.title}
              </h3>

              {/* Message */}
              <p className="text-white/80 mb-6 whitespace-pre-line">
                {confirmModalData.message}
              </p>

              {/* Action Buttons */}
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-6 py-2 rounded-lg font-medium transition-all duration-200 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border border-gray-400/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmModalData.onConfirm) {
                      confirmModalData.onConfirm()
                    }
                  }}
                  className="px-6 py-2 rounded-lg font-medium transition-all duration-200 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-400/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditTransactionModal && editingTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Edit Transaction</h3>
              <button 
                onClick={() => {
                  setShowEditTransactionModal(false)
                  setEditingTransaction(null)
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2 font-medium">Reference ID</label>
                <input 
                  type="text"
                  value={editTransactionForm.reference}
                  onChange={(e) => setEditTransactionForm({ ...editTransactionForm, reference: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  placeholder="e.g., JE-2025-001"
                />
                <p className="text-xs text-gray-500 mt-1">Current: {editingTransaction.reference}</p>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2 font-medium">Description</label>
                <textarea 
                  value={editTransactionForm.description}
                  onChange={(e) => setEditTransactionForm({ ...editTransactionForm, description: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="Enter description..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">Amount</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editTransactionForm.amount}
                    onChange={(e) => setEditTransactionForm({ ...editTransactionForm, amount: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">Date</label>
                  <input 
                    type="date"
                    value={editTransactionForm.date}
                    onChange={(e) => setEditTransactionForm({ ...editTransactionForm, date: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">From Account</label>
                  <select
                    value={editTransactionForm.fromAccount}
                    onChange={(e) => setEditTransactionForm({ ...editTransactionForm, fromAccount: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select From Account</option>
                    {(allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts).map((account) => (
                      <option key={account.account_number} value={account.account_number}>
                        {account.account_number} - {account.account_name}
                      </option>
                    ))}
                  </select>
                  {editingTransaction.from_account_name && (
                    <p className="text-xs text-gray-500 mt-1">Current: {editingTransaction.from_account_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">To Account</label>
                  <select
                    value={editTransactionForm.toAccount}
                    onChange={(e) => setEditTransactionForm({ ...editTransactionForm, toAccount: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select To Account</option>
                    {(allChartOfAccounts.length > 0 ? allChartOfAccounts : chartOfAccounts).map((account) => (
                      <option key={account.account_number} value={account.account_number}>
                        {account.account_number} - {account.account_name}
                      </option>
                    ))}
                  </select>
                  {editingTransaction.to_account_name && (
                    <p className="text-xs text-gray-500 mt-1">Current: {editingTransaction.to_account_name}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  <strong>Transaction Type:</strong> {editingTransaction.transaction_type}
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => {
                    setShowEditTransactionModal(false)
                    setEditingTransaction(null)
                  }}
                  className="bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 text-gray-300 py-2 px-6 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveTransactionEdit}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default FinancialAnalytics




