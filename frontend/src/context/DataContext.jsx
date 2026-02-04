/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiService from '../services/apiService'
import { getToken, ROLES } from '../services/apiService' // Import getToken and ROLES

const DataContext = createContext()

// Demo merchant data for generating transactions
const DEMO_MERCHANTS = {
  individual: [
    { merchant: 'Starbucks', ticker: 'SBUX', category: 'Food & Drink' },
    { merchant: 'Amazon', ticker: 'AMZN', category: 'Shopping' },
    { merchant: 'Apple Store', ticker: 'AAPL', category: 'Technology' },
    { merchant: 'Netflix', ticker: 'NFLX', category: 'Entertainment' },
    { merchant: 'Uber', ticker: 'UBER', category: 'Transportation' },
    { merchant: 'Target', ticker: 'TGT', category: 'Shopping' },
    { merchant: 'Chipotle', ticker: 'CMG', category: 'Food & Drink' },
    { merchant: 'Nike', ticker: 'NKE', category: 'Shopping' },
    { merchant: 'Walmart', ticker: 'WMT', category: 'Shopping' },
    { merchant: 'McDonalds', ticker: 'MCD', category: 'Food & Drink' },
    { merchant: 'Costco', ticker: 'COST', category: 'Shopping' },
    { merchant: 'Home Depot', ticker: 'HD', category: 'Home' },
    { merchant: 'Spotify', ticker: 'SPOT', category: 'Entertainment' },
    { merchant: 'Disney+', ticker: 'DIS', category: 'Entertainment' },
    { merchant: 'CVS Pharmacy', ticker: 'CVS', category: 'Health' },
    { merchant: 'Whole Foods', ticker: 'AMZN', category: 'Groceries' },
    { merchant: 'Best Buy', ticker: 'BBY', category: 'Technology' },
    { merchant: 'Lyft', ticker: 'LYFT', category: 'Transportation' },
    { merchant: 'Dominos', ticker: 'DPZ', category: 'Food & Drink' },
    { merchant: 'Shell Gas', ticker: 'SHEL', category: 'Transportation' }
  ],
  family: [
    { merchant: 'Costco', ticker: 'COST', category: 'Groceries' },
    { merchant: 'Amazon', ticker: 'AMZN', category: 'Shopping' },
    { merchant: 'Target', ticker: 'TGT', category: 'Shopping' },
    { merchant: 'Disney+', ticker: 'DIS', category: 'Entertainment' },
    { merchant: 'Walmart', ticker: 'WMT', category: 'Groceries' },
    { merchant: 'Netflix', ticker: 'NFLX', category: 'Entertainment' },
    { merchant: 'Home Depot', ticker: 'HD', category: 'Home' },
    { merchant: 'Lowes', ticker: 'LOW', category: 'Home' },
    { merchant: 'Kroger', ticker: 'KR', category: 'Groceries' },
    { merchant: 'Chick-fil-A', ticker: null, category: 'Food & Drink' },
    { merchant: 'McDonalds', ticker: 'MCD', category: 'Food & Drink' },
    { merchant: 'Publix', ticker: null, category: 'Groceries' },
    { merchant: 'CVS Pharmacy', ticker: 'CVS', category: 'Health' },
    { merchant: 'Walgreens', ticker: 'WBA', category: 'Health' },
    { merchant: 'Shell Gas', ticker: 'SHEL', category: 'Transportation' }
  ],
  business: [
    { merchant: 'AWS', ticker: 'AMZN', category: 'Cloud Services' },
    { merchant: 'Adobe', ticker: 'ADBE', category: 'Software' },
    { merchant: 'Office Depot', ticker: 'ODP', category: 'Office Supplies' },
    { merchant: 'Delta Airlines', ticker: 'DAL', category: 'Travel' },
    { merchant: 'WeWork', ticker: null, category: 'Office Space' },
    { merchant: 'Microsoft 365', ticker: 'MSFT', category: 'Software' },
    { merchant: 'Zoom', ticker: 'ZM', category: 'Software' },
    { merchant: 'Slack', ticker: 'CRM', category: 'Software' },
    { merchant: 'FedEx', ticker: 'FDX', category: 'Shipping' },
    { merchant: 'UPS', ticker: 'UPS', category: 'Shipping' },
    { merchant: 'Staples', ticker: 'SPLS', category: 'Office Supplies' },
    { merchant: 'United Airlines', ticker: 'UAL', category: 'Travel' },
    { merchant: 'Marriott', ticker: 'MAR', category: 'Travel' },
    { merchant: 'Google Cloud', ticker: 'GOOGL', category: 'Cloud Services' },
    { merchant: 'Salesforce', ticker: 'CRM', category: 'Software' }
  ]
}

const FAMILY_MEMBERS = ['Demo Family Admin', 'Jane Demo', 'Tommy Demo', 'Sara Demo']
const BUSINESS_EMPLOYEES = ['John Manager', 'Carol Designer', 'Alice Accountant', 'Bob Developer', 'Demo Business']

// Mock stock prices with purchase price (when bought) and current price (today)
// This allows us to calculate actual gains/losses
const MOCK_STOCK_PRICES = {
  // Individual merchants
  SBUX: { purchasePrice: 92.50, currentPrice: 98.45, name: 'Starbucks' },
  AMZN: { purchasePrice: 145.00, currentPrice: 178.50, name: 'Amazon' },
  AAPL: { purchasePrice: 165.00, currentPrice: 178.50, name: 'Apple Inc.' },
  NFLX: { purchasePrice: 580.00, currentPrice: 612.45, name: 'Netflix' },
  UBER: { purchasePrice: 62.00, currentPrice: 71.50, name: 'Uber' },
  TGT: { purchasePrice: 138.00, currentPrice: 145.20, name: 'Target' },
  CMG: { purchasePrice: 2150.00, currentPrice: 2345.00, name: 'Chipotle' },
  NKE: { purchasePrice: 95.00, currentPrice: 108.75, name: 'Nike' },
  WMT: { purchasePrice: 155.00, currentPrice: 162.30, name: 'Walmart' },
  MCD: { purchasePrice: 265.00, currentPrice: 285.40, name: 'McDonalds' },
  COST: { purchasePrice: 540.00, currentPrice: 578.90, name: 'Costco' },
  HD: { purchasePrice: 325.00, currentPrice: 348.75, name: 'Home Depot' },
  SPOT: { purchasePrice: 285.00, currentPrice: 312.60, name: 'Spotify' },
  DIS: { purchasePrice: 95.00, currentPrice: 112.30, name: 'Disney' },
  CVS: { purchasePrice: 72.00, currentPrice: 78.45, name: 'CVS Health' },
  BBY: { purchasePrice: 78.00, currentPrice: 85.30, name: 'Best Buy' },
  LYFT: { purchasePrice: 12.50, currentPrice: 14.85, name: 'Lyft' },
  DPZ: { purchasePrice: 385.00, currentPrice: 412.80, name: 'Dominos' },
  SHEL: { purchasePrice: 62.00, currentPrice: 67.45, name: 'Shell' },

  // Family-specific merchants
  LOW: { purchasePrice: 215.00, currentPrice: 232.50, name: 'Lowes' },
  KR: { purchasePrice: 45.00, currentPrice: 52.30, name: 'Kroger' },
  WBA: { purchasePrice: 18.50, currentPrice: 21.25, name: 'Walgreens' },

  // Business merchants
  ADBE: { purchasePrice: 520.00, currentPrice: 568.90, name: 'Adobe' },
  ODP: { purchasePrice: 48.00, currentPrice: 52.15, name: 'Office Depot' },
  DAL: { purchasePrice: 42.00, currentPrice: 48.75, name: 'Delta Airlines' },
  MSFT: { purchasePrice: 380.00, currentPrice: 412.50, name: 'Microsoft' },
  ZM: { purchasePrice: 65.00, currentPrice: 72.30, name: 'Zoom' },
  CRM: { purchasePrice: 265.00, currentPrice: 298.45, name: 'Salesforce' },
  FDX: { purchasePrice: 245.00, currentPrice: 268.90, name: 'FedEx' },
  UPS: { purchasePrice: 155.00, currentPrice: 172.45, name: 'UPS' },
  SPLS: { purchasePrice: 12.00, currentPrice: 13.45, name: 'Staples' },
  UAL: { purchasePrice: 45.00, currentPrice: 52.80, name: 'United Airlines' },
  MAR: { purchasePrice: 225.00, currentPrice: 248.65, name: 'Marriott' },
  GOOGL: { purchasePrice: 138.00, currentPrice: 155.35, name: 'Alphabet Inc.' }
}

// Calculate holdings from completed transactions
const calculateHoldingsFromTransactions = (transactions) => {
  // Only use completed transactions for holdings
  const completedTx = transactions.filter(t => t.status === 'completed')

  // Group by ticker and sum shares bought
  const holdingsMap = {}

  completedTx.forEach(tx => {
    const ticker = tx.ticker
    if (!ticker || !MOCK_STOCK_PRICES[ticker]) return

    const priceData = MOCK_STOCK_PRICES[ticker]
    const sharesBought = tx.roundUp / priceData.purchasePrice

    if (!holdingsMap[ticker]) {
      holdingsMap[ticker] = {
        symbol: ticker,
        name: priceData.name,
        shares: 0,
        totalCost: 0,
        currentPrice: priceData.currentPrice,
        purchasePrice: priceData.purchasePrice
      }
    }

    holdingsMap[ticker].shares += sharesBought
    holdingsMap[ticker].totalCost += tx.roundUp
  })

  // Convert to array and calculate current values
  const holdings = Object.values(holdingsMap).map(h => {
    const currentValue = h.shares * h.currentPrice
    const gain = currentValue - h.totalCost
    const gainPct = h.totalCost > 0 ? (gain / h.totalCost) * 100 : 0

    return {
      symbol: h.symbol,
      name: h.name,
      shares: parseFloat(h.shares.toFixed(4)),
      avgCost: h.totalCost / h.shares,
      currentPrice: h.currentPrice,
      value: parseFloat(currentValue.toFixed(2)),
      change: parseFloat(gainPct.toFixed(2)),
      totalCost: parseFloat(h.totalCost.toFixed(2))
    }
  })

  // Sort by value descending
  holdings.sort((a, b) => b.value - a.value)

  // Calculate allocation percentages
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
  holdings.forEach(h => {
    h.allocation = totalValue > 0 ? parseFloat(((h.value / totalValue) * 100).toFixed(1)) : 0
  })

  return holdings
}

// Calculate portfolio stats from holdings
const calculatePortfolioStats = (holdings) => {
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
  const totalGain = totalValue - totalCost
  const gainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  // Simulated today's change (between 0.3% and 1.2%)
  const todayGainPct = parseFloat((Math.random() * 0.9 + 0.3).toFixed(2))
  const todayGain = totalValue * (todayGainPct / 100)

  return {
    portfolioValue: parseFloat(totalValue.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
    totalGain: parseFloat(totalGain.toFixed(2)),
    gainPercentage: parseFloat(gainPct.toFixed(2)),
    todayGain: parseFloat(todayGain.toFixed(2)),
    todayGainPct: todayGainPct,
    holdingsCount: holdings.length
  }
}

// Generate goals based on actual invested amount
const getDemoGoals = (accountType, totalInvested) => {
  const goalTemplates = {
    individual: [
      { id: 1, name: 'Emergency Fund', targetMultiplier: 8, category: 'Savings', status: 'active' },
      { id: 2, name: 'Vacation Fund', targetMultiplier: 4, category: 'Travel', status: 'active' },
      { id: 3, name: 'New Car', targetMultiplier: 12, category: 'Big Purchase', status: 'active' }
    ],
    family: [
      { id: 1, name: 'Family Vacation', targetMultiplier: 6, category: 'Travel', status: 'active' },
      { id: 2, name: 'College Fund', targetMultiplier: 40, category: 'Education', status: 'active' },
      { id: 3, name: 'Emergency Fund', targetMultiplier: 16, category: 'Savings', status: 'active' }
    ],
    business: [
      { id: 1, name: 'Q1 Investment Target', targetMultiplier: 4, category: 'Investment', status: 'active' },
      { id: 2, name: 'Annual Growth Fund', targetMultiplier: 16, category: 'Growth', status: 'active' },
      { id: 3, name: 'Emergency Reserve', targetMultiplier: 8, category: 'Reserve', status: 'active' }
    ]
  }

  const templates = goalTemplates[accountType] || goalTemplates.individual
  return templates.map(g => {
    const target = Math.round(totalInvested * g.targetMultiplier / 100) * 100 || 1000
    const current = Math.round(totalInvested * (0.3 + Math.random() * 0.5))
    const progress = Math.min(Math.round((current / target) * 100), 100)
    return {
      ...g,
      target,
      current,
      progress
    }
  })
}

// Generate a full year of 2025 transactions with status variety
const generateDemoTransactions = (accountType, roundUpAmount = 1) => {
  const merchants = DEMO_MERCHANTS[accountType] || DEMO_MERCHANTS.individual
  const transactions = []
  let id = 1

  // Status distribution: 75% completed, 10% pending, 8% processing, 5% mapped, 2% failed
  const getRandomStatus = () => {
    const rand = Math.random()
    if (rand < 0.75) return 'completed'
    if (rand < 0.85) return 'pending'
    if (rand < 0.93) return 'processing'
    if (rand < 0.98) return 'mapped'
    return 'failed'
  }

  // Generate ~3-4 transactions per week for the full year 2025
  const startDate = new Date('2025-01-01')
  const endDate = new Date('2025-12-31')

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 2)) {
    // Skip some days randomly to make it realistic (not exactly every 2 days)
    if (Math.random() > 0.85) continue

    const merchantData = merchants[Math.floor(Math.random() * merchants.length)]
    const baseAmount = Math.floor(Math.random() * 150) + 5 + Math.random() * 0.99 // $5.xx to $155.xx

    const transaction = {
      id: id++,
      merchant: merchantData.merchant,
      description: `${merchantData.category} purchase`,
      amount: parseFloat(baseAmount.toFixed(2)),
      purchase: parseFloat(baseAmount.toFixed(2)),
      roundUp: roundUpAmount,
      round_up: roundUpAmount,
      ticker: merchantData.ticker,
      date: date.toISOString().split('T')[0],
      status: getRandomStatus(),
      category: merchantData.category
    }

    // Add member for family accounts
    if (accountType === 'family') {
      transaction.member = FAMILY_MEMBERS[Math.floor(Math.random() * FAMILY_MEMBERS.length)]
    }

    // Add employee for business accounts
    if (accountType === 'business') {
      transaction.employee = BUSINESS_EMPLOYEES[Math.floor(Math.random() * BUSINESS_EMPLOYEES.length)]
      // Business transactions are larger
      transaction.amount = parseFloat((baseAmount * 5 + Math.random() * 500).toFixed(2))
      transaction.purchase = transaction.amount
    }

    transactions.push(transaction)
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date)) // Most recent first
}

// Get demo data with dynamic round-up amount from user settings
// Now calculates holdings and portfolio value from actual transactions
const getDemoDataWithRoundUp = (accountType, roundUpAmount = 1) => {
  // 1. Generate transactions (source of truth)
  const transactions = generateDemoTransactions(accountType, roundUpAmount)

  // 2. Calculate holdings FROM completed transactions
  const holdings = calculateHoldingsFromTransactions(transactions)

  // 3. Calculate portfolio stats FROM holdings
  const portfolioStats = calculatePortfolioStats(holdings)

  // 4. Calculate transaction-based stats
  const completedTx = transactions.filter(t => t.status === 'completed')
  const totalRoundUps = completedTx.reduce((sum, t) => sum + (t.roundUp || 0), 0)
  const totalFeesPaid = transactions.length * 0.25 // $0.25 fee per transaction

  // 5. Generate goals based on actual invested amount
  const goals = getDemoGoals(accountType, totalRoundUps)

  return {
    transactions,
    holdings,
    portfolio: {
      totalValue: portfolioStats.portfolioValue,
      totalGain: portfolioStats.totalGain,
      gainPercent: portfolioStats.gainPercentage,
      holdings: holdings
    },
    portfolioStats,  // Extra stats for dashboard display
    goals,
    totalRoundUps,
    totalFeesPaid
  }
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    console.warn('useData must be used within a DataProvider - returning default values')
    // Return default values instead of throwing error
    return {
      transactions: [],
      portfolioValue: 0,
      portfolioStats: null,
      totalRoundUps: 0,
      holdings: [],
      goals: [],
      recommendations: [],
      notifications: [],
      setTransactions: () => {},
      addTransactions: () => {},
      setPortfolioValue: () => {},
      setTotalRoundUps: () => {},
      setHoldings: () => {},
      setGoals: () => {},
      setRecommendations: () => {},
      setNotifications: () => {}
    }
  }
  return context
}

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([])
  const [holdings, setHoldings] = useState([])
  const [goals, setGoals] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [portfolioStats, setPortfolioStats] = useState(null)  // Extra portfolio stats for demo mode
  const [totalRoundUps, setTotalRoundUps] = useState(0)
  const [totalFeesPaid, setTotalFeesPaid] = useState(0)
  const [adminReports, setAdminReports] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Clear all localStorage data to ensure clean state
  const clearAllLocalStorage = () => {
    const keysToRemove = [
      'kamioi_holdings',
      'kamioi_portfolio_value',
      'kamioi_transactions',
      'kamioi_goals',
      'kamioi_recommendations',
      'kamioi_notifications',
      'kamioi_total_roundups',
      'kamioi_total_fees_paid',
      'kamioi_user_token', // Clear user token
      'kamioi_admin_token' // Clear admin token
    ]
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  // Load data from API - ONLY when explicitly called
  const loadDataFromAPI = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if in demo mode - use demo data instead of API calls
      const isDemoMode = localStorage.getItem('kamioi_demo_mode') === 'true'
      const demoAccountType = localStorage.getItem('kamioi_demo_account_type') || 'individual'

      if (isDemoMode) {
        // Get user's round-up preference from localStorage (default $1)
        const roundUpAmount = parseInt(localStorage.getItem('kamioi_round_up_amount')) || 1
        console.log('DataContext - Demo mode detected, using demo data for:', demoAccountType, 'with round-up:', roundUpAmount)
        const demoData = getDemoDataWithRoundUp(demoAccountType, roundUpAmount)

        // Set demo data - now using calculated values from transactions
        setTransactions(demoData.transactions || [])
        setHoldings(demoData.holdings || [])
        setPortfolioValue(demoData.portfolioStats?.portfolioValue || 0)
        setPortfolioStats(demoData.portfolioStats || null)
        setGoals(demoData.goals || [])
        setTotalRoundUps(demoData.totalRoundUps || 0)
        setTotalFeesPaid(demoData.totalFeesPaid || 0)
        setRecommendations([])
        setNotifications([])
        setHasLoaded(true)
        setIsLoading(false)
        return
      }

      // Check if user is authenticated before making API calls
      const demoToken = localStorage.getItem('kamioi_demo_token')
      const userToken = getToken(ROLES.USER)
      const adminToken = getToken(ROLES.ADMIN)

      console.log('DataContext - Token check:', { demoToken: !!demoToken, userToken, adminToken, userTokenExists: !!userToken, adminTokenExists: !!adminToken })

      // In demo mode, allow data loading (demo token will be used by axios interceptor)
      if (!demoToken && !userToken && !adminToken) {
        console.log('DataContext - No auth token found, skipping API data load')
        setIsLoading(false)
        return
      }

      // Check if user is admin - admins shouldn't load user data (unless in demo mode)
      if (adminToken && !userToken && !demoToken) { // Only admin logged in (not demo)
        console.log('DataContext - Admin user detected, skipping user data load')
        // Optionally load admin-specific data here
        setIsLoading(false)
        return
      }

      // Try to load from API first
      console.log('DataContext - Starting API calls...')
      
      // Determine if this is a family user based on URL
      const isFamilyUser = window.location.pathname.includes('/family/') || window.location.pathname.includes('/family')
      const isBusinessUser = window.location.pathname.includes('/business/') || window.location.pathname.includes('/business')
      
      // Determine dashboard type
      const dashboardType = isFamilyUser ? 'family' : isBusinessUser ? 'business' : 'user'
      
      console.log('DataContext - User type detection:', { isFamilyUser, isBusinessUser, dashboardType, pathname: window.location.pathname })
      
      // Use API service with dashboard type detection
      const transactionsAPI = apiService.getTransactions(dashboardType)
      
      console.log('DataContext - Using transactions API:', dashboardType === 'family' ? '/api/family/transactions' : dashboardType === 'business' ? '/api/business/transactions' : '/api/user/transactions')
      
      const [
        transactionsData,
        portfolioData,
        goalsData,
        recommendationsData,
        notificationsData,
        roundUpsData,
        feesData
      ] = await Promise.allSettled([
        transactionsAPI,
        apiService.getPortfolio(dashboardType),
        apiService.getGoals(dashboardType),
        apiService.getAIRecommendations(dashboardType),
        apiService.getNotifications(dashboardType),
        apiService.getTotalRoundUps(dashboardType),
        apiService.getTotalFees(dashboardType)
      ])

      console.log('DataContext - API calls completed:', {
        transactions: transactionsData.status,
        portfolio: portfolioData.status,
        goals: goalsData.status,
        recommendations: recommendationsData.status,
        notifications: notificationsData.status,
        roundUps: roundUpsData.status,
        fees: feesData.status
      })

      // Update state with API data only (clean zero data)
      let transactions = []
      if (transactionsData.status === 'fulfilled') {
        console.log('DataContext - Raw transactions API response:', transactionsData.value)
      console.log('DataContext - API response structure:', {
        hasData: !!transactionsData.value?.data,
        hasTransactions: !!transactionsData.value?.transactions,
        dataType: typeof transactionsData.value?.data,
        transactionsType: typeof transactionsData.value?.transactions,
        dataIsArray: Array.isArray(transactionsData.value?.data),
        transactionsIsArray: Array.isArray(transactionsData.value?.transactions),
        fullResponse: transactionsData.value
      })
        
        // 🚀 STANDARDIZED RESPONSE FORMAT: { success: true, data: { transactions: [...] } }
        // Axios wraps: response.data = { success: true, data: { transactions: [...] } }
        // So we need: transactionsData.value.data.data.transactions
        
        // Standard format (new): response.data.data.transactions
        if (transactionsData.value?.data?.data?.transactions && Array.isArray(transactionsData.value.data.data.transactions)) {
          transactions = transactionsData.value.data.data.transactions
          console.log('DataContext - Using standardized format (data.data.transactions), transactions:', transactions.length)
        }
        // Legacy format support (backward compatibility)
        else if (transactionsData.value?.data?.transactions && Array.isArray(transactionsData.value.data.transactions)) {
          transactions = transactionsData.value.data.transactions
          console.log('DataContext - Using legacy format (data.transactions), transactions:', transactions.length)
        }
        // Direct array format (legacy)
        else if (transactionsData.value?.data && Array.isArray(transactionsData.value.data)) {
          transactions = transactionsData.value.data
          console.log('DataContext - Using direct array format (data), transactions:', transactions.length)
        }
        // Fallback
        else {
          console.warn('DataContext - Unknown response format:', transactionsData.value)
          transactions = []
        }
        
        console.log('DataContext - Final transactions array:', {
          status: transactionsData.status,
          response: transactionsData.value,
          transactionsCount: transactions.length,
          sampleTransaction: transactions[0],
          isArray: Array.isArray(transactions)
        })
        setTransactions(transactions)
        console.log('DataContext - setTransactions called with:', transactions.length, 'transactions')
      } else {
        console.log('DataContext - Transactions API failed:', {
          status: transactionsData.status,
          reason: transactionsData.reason,
          error: transactionsData.value
        })
        // Set empty array as fallback
        setTransactions([])
      }

      // Use portfolio data from API if available, otherwise calculate from transactions
      if (portfolioData.status === 'fulfilled') {
        console.log('DataContext - Portfolio API response:', portfolioData.value)
        // Axios wraps response, so we need portfolioData.value.data.portfolio
        const portfolio = portfolioData.value?.data?.portfolio || portfolioData.value?.portfolio || {}
        const holdings = portfolio.positions || []
        const portfolioValueFromAPI = portfolio.totalValue || portfolio.cash || 0

        console.log('DataContext - Portfolio extracted:', { portfolio, holdings, portfolioValueFromAPI })

        // Format holdings for the frontend if they exist
        if (holdings.length > 0) {
          const formattedHoldings = holdings.map(h => ({
            symbol: h.symbol,
            name: h.name || h.symbol,
            shares: h.shares || 0,
            avgCost: h.avgCost || h.average_price || 0,
            currentPrice: h.currentPrice || h.avgCost || 0,
            value: (h.shares || 0) * (h.currentPrice || h.avgCost || 0),
            change: h.change || 0,
            allocation: h.allocation || 100 / holdings.length
          }))
          setHoldings(formattedHoldings)
          const totalValue = formattedHoldings.reduce((sum, h) => sum + h.value, 0)
          setPortfolioValue(totalValue || portfolioValueFromAPI)
          console.log('DataContext - Holdings set:', formattedHoldings.length, 'total value:', totalValue)
        } else {
          setHoldings([])
          setPortfolioValue(portfolioValueFromAPI)
        }
      } else {
        console.log('DataContext - Portfolio API failed, calculating from transactions')
        // Fallback: Calculate portfolio data from completed/mapped transactions
        const investmentTransactions = transactions.filter(t =>
          (t.status === 'mapped' || t.status === 'completed') && t.ticker && t.shares
        )

        // Group by ticker to aggregate shares
        const holdingsMap = {}
        investmentTransactions.forEach(t => {
          const ticker = t.ticker
          if (!holdingsMap[ticker]) {
            holdingsMap[ticker] = {
              symbol: ticker,
              name: t.name || ticker,
              shares: 0,
              totalCost: 0,
              currentPrice: t.stock_price || t.price_per_share || 0
            }
          }
          holdingsMap[ticker].shares += t.shares || 0
          holdingsMap[ticker].totalCost += (t.shares || 0) * (t.price_per_share || 0)
        })

        const holdings = Object.values(holdingsMap).map(h => ({
          symbol: h.symbol,
          name: h.name,
          shares: h.shares,
          avgCost: h.shares > 0 ? h.totalCost / h.shares : 0,
          currentPrice: h.currentPrice,
          value: h.shares * h.currentPrice,
          change: 0,
          allocation: 100
        }))

        // Calculate total allocation
        const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
        holdings.forEach(h => {
          h.allocation = totalValue > 0 ? (h.value / totalValue) * 100 : 100 / holdings.length
        })

        console.log('DataContext - Fallback holdings calculated:', holdings.length, 'total value:', totalValue)
        setHoldings(holdings)
        setPortfolioValue(totalValue)
      }

      if (goalsData.status === 'fulfilled') {
        setGoals(goalsData.value?.goals || [])
      } else {
        // Use clean zero data instead of localStorage fallback
        setGoals([])
      }

      if (recommendationsData.status === 'fulfilled') {
        setRecommendations(recommendationsData.value?.recommendations || [])
      } else {
        // Use clean zero data instead of localStorage fallback
        setRecommendations([])
      }

      if (notificationsData.status === 'fulfilled') {
        setNotifications(notificationsData.value?.notifications || [])
      } else {
        // Use clean zero data instead of localStorage fallback
        setNotifications([])
      }

      if (roundUpsData.status === 'fulfilled') {
        // Handle backend response format: { "success": true, "data": { "total_roundups": 0 } }
        const data = roundUpsData.value
        const roundUpsValue = typeof data === 'number'
          ? data
          : data?.total_roundups || 0
        setTotalRoundUps(roundUpsValue)
      } else {
        // Use clean zero data instead of localStorage fallback
        setTotalRoundUps(0)
      }

      if (feesData.status === 'fulfilled') {
        // Handle backend response format: { "success": true, "data": { "total_fees": 0 } }
        const data = feesData.value
        const feesValue = typeof data === 'number'
          ? data
          : data?.total_fees || 0
        setTotalFeesPaid(feesValue)
      } else {
        // Use clean zero data instead of localStorage fallback
        setTotalFeesPaid(0)
      }

      setHasLoaded(true)
      setIsLoading(false)

    } catch (error) {
      console.error('Error loading data from API:', error)
      setError('Failed to load data from server')

      // Fallback to localStorage
      const storedTransactions = localStorage.getItem('kamioi_transactions')
      const storedHoldings = localStorage.getItem('kamioi_holdings')
      const storedGoals = localStorage.getItem('kamioi_goals')
      const storedRecommendations = localStorage.getItem('kamioi_recommendations')
      const storedNotifications = localStorage.getItem('kamioi_notifications')
      const storedPortfolioValue = localStorage.getItem('kamioi_portfolio_value')
      const storedTotalRoundUps = localStorage.getItem('kamioi_total_roundups')
      const storedTotalFeesPaid = localStorage.getItem('kamioi_total_fees')
      const storedAdminReports = localStorage.getItem('kamioi_admin_reports')

      if (storedTransactions) setTransactions(JSON.parse(storedTransactions))
      if (storedHoldings) setHoldings(JSON.parse(storedHoldings))
      if (storedGoals) setGoals(JSON.parse(storedGoals))
      if (storedRecommendations) setRecommendations(JSON.parse(storedRecommendations))
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications))
      if (storedPortfolioValue) setPortfolioValue(parseFloat(storedPortfolioValue))
      if (storedTotalRoundUps) setTotalRoundUps(parseFloat(storedTotalRoundUps))
      if (storedTotalFeesPaid) setTotalFeesPaid(parseFloat(storedTotalFeesPaid))
      if (storedAdminReports) setAdminReports(JSON.parse(storedAdminReports))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load data from API when user is authenticated or in demo mode
  useEffect(() => {
    const isDemoMode = localStorage.getItem('kamioi_demo_mode') === 'true'
    const demoToken = localStorage.getItem('kamioi_demo_token')
    const userToken = getToken(ROLES.USER)
    const adminToken = getToken(ROLES.ADMIN)

    // If in demo mode, load demo data
    if (isDemoMode) {
      console.log('DataContext - Demo mode detected, loading demo data')
      loadDataFromAPI()
      return
    }

    if (demoToken || userToken || adminToken) {
      console.log('DataContext - User authenticated, loading from API', { demoToken: !!demoToken, userToken: !!userToken, adminToken: !!adminToken })
      loadDataFromAPI()
    } else {
      console.log('DataContext - No auth token, loading from localStorage')
      // Load from localStorage as fallback
      const storedTransactions = localStorage.getItem('kamioi_transactions')
      const storedHoldings = localStorage.getItem('kamioi_holdings')
      const storedGoals = localStorage.getItem('kamioi_goals')
      const storedRecommendations = localStorage.getItem('kamioi_recommendations')
      const storedNotifications = localStorage.getItem('kamioi_notifications')
      const storedPortfolioValue = localStorage.getItem('kamioi_portfolio_value')
      const storedTotalRoundUps = localStorage.getItem('kamioi_total_roundups')
      const storedTotalFeesPaid = localStorage.getItem('kamioi_total_fees')
      const storedAdminReports = localStorage.getItem('kamioi_admin_reports')

      if (storedTransactions) setTransactions(JSON.parse(storedTransactions))
      if (storedHoldings) setHoldings(JSON.parse(storedHoldings))
      if (storedGoals) setGoals(JSON.parse(storedGoals))
      if (storedRecommendations) setRecommendations(JSON.parse(storedRecommendations))
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications))
      if (storedPortfolioValue) setPortfolioValue(parseFloat(storedPortfolioValue))
      if (storedTotalRoundUps) setTotalRoundUps(parseFloat(storedTotalRoundUps))
      if (storedTotalFeesPaid) setTotalFeesPaid(parseFloat(storedTotalFeesPaid))
      if (storedAdminReports) setAdminReports(JSON.parse(storedAdminReports))
    }
  }, [loadDataFromAPI]) // Add loadDataFromAPI to dependencies but ensure it's memoized

  // Listen for demo mode changes to reload data
  useEffect(() => {
    const handleDemoModeChange = () => {
      console.log('DataContext - Demo mode changed, reloading data')
      loadDataFromAPI()
    }

    // Listen for round-up settings changes in demo mode
    const handleRoundUpSettingsChange = () => {
      const isDemoMode = localStorage.getItem('kamioi_demo_mode') === 'true'
      if (isDemoMode) {
        console.log('DataContext - Round-up settings changed in demo mode, regenerating demo data')
        loadDataFromAPI()
      }
    }

    // Listen for storage changes (when demo mode is toggled)
    window.addEventListener('storage', handleDemoModeChange)

    // Also listen for custom demo mode change event
    window.addEventListener('demoModeChanged', handleDemoModeChange)

    // Listen for round-up settings changes to update demo data
    window.addEventListener('roundUpSettingsUpdated', handleRoundUpSettingsChange)

    return () => {
      window.removeEventListener('storage', handleDemoModeChange)
      window.removeEventListener('demoModeChanged', handleDemoModeChange)
      window.removeEventListener('roundUpSettingsUpdated', handleRoundUpSettingsChange)
    }
  }, [loadDataFromAPI])

  // Listen for user login events to reload data
  useEffect(() => {
    const handleUserLogin = (event) => {
      console.log('DataContext - User login event received, reloading data')
      const { token } = event.detail
      if (token) {
        loadDataFromAPI()
      }
    }

    window.addEventListener('userLoggedIn', handleUserLogin)
    return () => window.removeEventListener('userLoggedIn', handleUserLogin)
  }, [loadDataFromAPI]) // Add loadDataFromAPI to dependencies but ensure it's memoized

  // Background polling for automatic transaction syncing
  useEffect(() => {
    const demoToken = localStorage.getItem('kamioi_demo_token')
    const userToken = getToken(ROLES.USER)
    const adminToken = getToken(ROLES.ADMIN)
    
    if (!userToken && !adminToken) {
      return // No user logged in, no need to poll
    }

    // Skip user transaction polling for admin-only sessions
    if (adminToken && !userToken && !demoToken) {
      return
    }

    console.log('DataContext - Starting background polling for automatic transaction sync')
    
    // Poll every 10 minutes (600,000 ms)
    const pollInterval = setInterval(async () => {
      try {
        console.log('DataContext - Background polling: Checking for new transactions...')
        
        // Use API service for all user types
        const data = await apiService.getTransactions()
        
        if (data.success && data.transactions) {
          const newTransactionCount = data.transactions.length
          const currentTransactionCount = transactions.length
          
          if (newTransactionCount > currentTransactionCount) {
            console.log(`DataContext - Background polling: Found ${newTransactionCount - currentTransactionCount} new transactions`)
            setTransactions(data.transactions)
            
            // Show notification for new transactions
            if (newTransactionCount - currentTransactionCount > 0) {
              const event = new CustomEvent('newTransactions', {
                detail: { count: newTransactionCount - currentTransactionCount }
              })
              window.dispatchEvent(event)
            }
          }
        }
      } catch (error) {
        console.log('DataContext - Background polling error:', error)
      }
    }, 600000) // 10 minutes
    
    return () => {
      console.log('DataContext - Stopping background polling')
      clearInterval(pollInterval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Remove transactions from dependencies to prevent infinite loop

  // Optimized: Save data to localStorage with debouncing to prevent CPU overload
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('kamioi_transactions', JSON.stringify(transactions))
    }, 100) // Debounce for 100ms
    return () => clearTimeout(timeoutId)
  }, [transactions])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('kamioi_holdings', JSON.stringify(holdings))
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [holdings])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('kamioi_goals', JSON.stringify(goals))
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [goals])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('kamioi_recommendations', JSON.stringify(recommendations))
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [recommendations])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('kamioi_notifications', JSON.stringify(notifications))
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [notifications])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('kamioi_portfolio_value', portfolioValue.toString())
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [portfolioValue])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('kamioi_total_roundups', totalRoundUps.toString())
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [totalRoundUps])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('kamioi_total_fees', totalFeesPaid.toString())
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [totalFeesPaid])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('kamioi_admin_reports', JSON.stringify(adminReports))
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [adminReports])

  // API Integration Functions
  const addTransaction = async (transactionData) => {
    try {
      const newTransaction = await apiService.addTransaction(transactionData)
      setTransactions(prev => [newTransaction, ...prev])
      return newTransaction
    } catch (error) {
      console.error('Error adding transaction:', error)
      throw error
    }
  }

  const addTransactions = async (transactionsData, userId = null, onProgress = null) => {
    try {
      console.log('DataContext - Processing transactions with auto round-up:', transactionsData)

      // Get user ID from parameter, localStorage, or fallback
      const currentUserId = userId ||
        JSON.parse(localStorage.getItem('kamioi_user') || '{}').id ||
        (getToken(ROLES.USER) || '').replace('token_', '') || // Use new getToken
        1

      console.log('DataContext - Using user ID:', currentUserId)

      // Process each transaction through the round-up engine
      const processedTransactions = []
      const totalTransactions = transactionsData.length

      for (let i = 0; i < transactionsData.length; i++) {
        const transaction = transactionsData[i]
        
        // Update progress
        if (onProgress) {
          const progress = Math.round(((i + 1) / totalTransactions) * 100)
          onProgress(progress, `Processing transaction ${i + 1} of ${totalTransactions}...`)
        }
        try {
          // Handle CSV data with capital letter fields (Date, Description, Amount, etc.)
          const date = transaction.date || transaction.Date || new Date().toISOString().split('T')[0]
          const merchant = transaction.merchant || transaction.Description || transaction.description || ''
          const amountValue = transaction.Amount || transaction.amount || transaction.purchase || 0
          const amount = parseFloat(amountValue.toString().replace(/[^0-9.-]/g, '')) || 0

          // Send to backend for round-up processing
          const result = await apiService.submitTransaction({
            user_id: currentUserId,
            amount: amount,
            merchant: merchant,
            date: date,
            category: transaction.Category || transaction.category || 'Uncategorized'
          })

          if (result.success) {
            const processedTxn = result.transaction || result.data || result

            // Add additional fields for frontend
            if (processedTxn) {
              processedTxn.description = transaction.Description || transaction.description || merchant
              processedTxn.ticker = transaction.ticker || null
              processedTxn.shares = parseFloat(transaction.shares) || 0
              processedTxn.price_per_share = parseFloat(transaction.price_per_share) || 0
              processedTxn.stock_price = parseFloat(transaction.stock_price) || 0
              processedTxn.reference = transaction.Reference || transaction.reference || ''
              processedTxn.status = 'pending'
              processedTxn.id = Date.now() + Math.random() // Generate unique ID
              
              // Ensure date and category are properly set
              if (!processedTxn.date) {
                processedTxn.date = date
              }
              if (!processedTxn.category) {
                processedTxn.category = transaction.Category || transaction.category || 'Uncategorized'
              }

              processedTransactions.push(processedTxn)

              console.log('Transaction processed with auto round-up:', processedTxn)
              console.log('Transaction date:', processedTxn.date, 'category:', processedTxn.category)
            } else {
              console.error('No transaction data received from backend:', result)
            }
          } else {
            console.error('Failed to process transaction with round-up engine:', result.error || 'Unknown error')
            // Fallback to basic processing
            const userRoundUpPreference = 1.00
            const kamioiFee = 0.25

            processedTransactions.push({
              id: Date.now() + Math.random(),
              date,
              merchant,
              description: transaction.Description || transaction.description || merchant,
              category: transaction.Category || transaction.category || 'Uncategorized',
              purchase: amount,
              round_up: userRoundUpPreference,
              total_debit: amount + userRoundUpPreference + kamioiFee,
              investable: userRoundUpPreference,
              fee: kamioiFee,
              status: 'pending',
              ticker: transaction.ticker || null,
              shares: parseFloat(transaction.shares) || 0,
              price_per_share: parseFloat(transaction.price_per_share) || 0,
              stock_price: parseFloat(transaction.stock_price) || 0,
              reference: transaction.Reference || transaction.reference || ''
            })
          }
        } catch (error) {
          console.error('Error processing transaction:', error)
          // Fallback to basic processing
          const date = transaction.date || transaction.Date || new Date().toISOString().split('T')[0]
          const merchant = transaction.merchant || transaction.Description || transaction.description || ''
          const amountValue = transaction.Amount || transaction.amount || transaction.purchase || 0
          const amount = parseFloat(amountValue.toString().replace(/[^0-9.-]/g, '')) || 0

          processedTransactions.push({
            id: Date.now() + Math.random(),
            date,
            merchant,
            description: transaction.Description || transaction.description || merchant,
            category: transaction.Category || transaction.category || 'Uncategorized',
            purchase: amount,
            round_up: 1.00,
            total_debit: amount + 1.00 + 0.25,
            investable: 1.00,
            fee: 0.25,
            status: 'pending',
            ticker: transaction.ticker || null,
            shares: parseFloat(transaction.shares) || 0,
            price_per_share: parseFloat(transaction.price_per_share) || 0,
            stock_price: parseFloat(transaction.stock_price) || 0,
            reference: transaction.Reference || transaction.reference || ''
          })
        }
      }

      console.log('DataContext - All transactions processed with auto round-up:', processedTransactions)

      // Update local state
      setTransactions(prev => [...processedTransactions, ...(Array.isArray(prev) ? prev : [])])

      // Also save to localStorage immediately
      const currentTransactions = JSON.parse(localStorage.getItem('kamioi_transactions') || '[]')
      const updatedTransactions = [...processedTransactions, ...(Array.isArray(currentTransactions) ? currentTransactions : [])]
      localStorage.setItem('kamioi_transactions', JSON.stringify(updatedTransactions))

      return processedTransactions
    } catch (error) {
      console.error('Error adding transactions:', error)
      throw error
    }
  }

  const updateTransaction = async (id, transactionData) => {
    try {
      const updatedTransaction = await apiService.updateTransaction(id, transactionData)
      setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t))
      return updatedTransaction
    } catch (error) {
      console.error('Error updating transaction:', error)
      throw error
    }
  }

  const deleteTransaction = async (id) => {
    try {
      await apiService.deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting transaction:', error)
      throw error
    }
  }

  const addGoal = async (goalData) => {
    try {
      const newGoal = await apiService.createGoal(goalData)
      setGoals(prev => [...prev, newGoal])
      return newGoal
    } catch (error) {
      console.error('Error adding goal:', error)
      throw error
    }
  }

  const updateGoal = async (id, goalData) => {
    try {
      const updatedGoal = await apiService.updateGoal(id, goalData)
      setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g))
      return updatedGoal
    } catch (error) {
      console.error('Error updating goal:', error)
      throw error
    }
  }

  const deleteGoal = async (id) => {
    try {
      await apiService.deleteGoal(id)
      setGoals(prev => prev.filter(g => g.id !== id))
    } catch (error) {
      console.error('Error deleting goal:', error)
      throw error
    }
  }

  const processRoundUp = async (amount, merchant, ticker) => {
    try {
      const result = await apiService.processRoundUp(amount, merchant, ticker)
      setTotalRoundUps(prev => prev + amount)
      return result
    } catch (error) {
      console.error('Error processing round-up:', error)
      throw error
    }
  }

  const refreshData = async () => {
    await loadDataFromAPI()
  }

  const loadDataAfterAuth = async () => {
    // Load data after successful authentication
    await loadDataFromAPI()
  }

  const clearAllData = () => {
    setTransactions([])
    setHoldings([])
    setGoals([])
    setRecommendations([])
    setNotifications([])
    setPortfolioValue(0)
    setTotalRoundUps(0)
    setTotalFeesPaid(0)
    setAdminReports([])

    // Clear ALL localStorage items
    localStorage.clear()

    // Also clear sessionStorage
    sessionStorage.clear()

    // Reload data from API to ensure consistency
    loadDataFromAPI()
  }

  // Utility functions
  const mapMerchantToTicker = () => {
    // This function should query the LLM Mapping database instead of using hardcoded mappings
    // For now, return null to indicate no mapping available
    // The LLM Center should handle merchant-to-ticker mapping through the database
    return null
  }

  const getStockPrice = () => {
    // This function should query real-time stock prices from a financial API
    // For now, return 0 to indicate no price data available
    // Real stock prices should be fetched from external APIs like Alpha Vantage, Yahoo Finance, etc.
    return 0
  }

  const getCompanyName = (ticker) => {
    // This function should query company names from a financial data API
    // For now, return a generic name to indicate no company data available
    // Real company names should be fetched from external APIs or financial databases
    return `${ticker} Corporation`
  }

  const value = {
    // State
    transactions,
    holdings,
    goals,
    recommendations,
    notifications,
    portfolioValue,
    portfolioStats,  // Extra portfolio stats (gain %, today's change, etc.)
    totalRoundUps,
    totalFeesPaid,
    adminReports,
    isLoading,
    error,
    hasLoaded,

    // Actions
    addTransaction,
    addTransactions,
    updateTransaction,
    deleteTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    processRoundUp,
    refreshData,
    loadDataAfterAuth,
    clearAllData,
    clearAllLocalStorage,
    setTransactions,

    // Utility functions
    mapMerchantToTicker,
    getStockPrice,
    getCompanyName
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export default DataContext
