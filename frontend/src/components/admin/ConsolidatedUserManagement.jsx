import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as XLSX from 'xlsx'
import prefetchRegistry from '../../services/prefetchRegistry'
import prefetchService from '../../services/prefetchService'
import { Users, User, Home, Building, RefreshCw, Download, Filter, Search, Eye, Edit, MessageCircle, UserPlus, TrendingUp, DollarSign, Activity, Shield, AlertTriangle, X, Trash2, Mail, Settings, Key, Phone } from 'lucide-react'
import GlassModal from '../common/GlassModal'
import { useTheme } from '../../context/ThemeContext'

const ConsolidatedUserManagement = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null, onCancel: null, confirmText: 'OK', cancelText: null })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  
  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalUsers: 0,
    individualUsers: 0,
    familyUsers: 0,
    businessUsers: 0,
    activeUsers: 0,
    totalRoundUps: 0,
    totalFees: 0,
    aiMappings: 0
  })

  // Generate formatted User ID: I/F/B + 7 digits (e.g., I1000043 for user ID 43)
  const getFormattedUserId = (user) => {
    if (!user || !user.id) return 'Unknown'
    const role = String(user.role || user.account_type || 'individual').toLowerCase()
    let prefix = 'I' // Default to Individual
    if (role.includes('family')) prefix = 'F'
    else if (role.includes('business')) prefix = 'B'
    // Generate 7-digit number: base 1000000 + user.id
    const numericId = String(1000000 + Number(user.id)).padStart(7, '0')
    return `${prefix}${numericId}`
  }

  // Register fetch function for prefetching
  useEffect(() => {
    const fetchFn = async () => {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      if (!token) return null
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      
      try {
        const [usersRes, metricsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/admin/users`, { headers }),
          fetch(`${apiBaseUrl}/api/admin/user-metrics`, { headers })
        ])
        
        const [usersData, metricsData] = await Promise.all([
          usersRes.ok ? usersRes.json() : null,
          metricsRes.ok ? metricsRes.json() : null
        ])
        
        return {
          users: usersData?.users || usersData?.data || [],
          metrics: metricsData || {}
        }
      } catch (e) {
        return null
      }
    }
    
    prefetchRegistry.register('consolidated-users', fetchFn)
  }, [])

  useEffect(() => {
    // Check for cached data first
    const cached = prefetchService.getCached('consolidated-users')
    if (cached) {
      console.log('🚀 ConsolidatedUserManagement - Using cached data, showing immediately')
      if (cached.users) setUsers(cached.users)
      if (cached.metrics) setSummaryMetrics({
        totalUsers: cached.metrics.totalUsers || 0,
        individualUsers: cached.metrics.individualUsers || 0,
        familyUsers: cached.metrics.familyUsers || 0,
        businessUsers: cached.metrics.businessUsers || 0,
        activeUsers: cached.metrics.activeUsers || 0,
        totalRoundUps: cached.metrics.totalRoundUps || 0,
        totalFees: cached.metrics.totalFees || 0,
        aiMappings: cached.metrics.aiMappings || 0
      })
      setLoading(false)
      
      // Dispatch completion event
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'consolidated-users' }
      }))
      
      // Fetch fresh data in background
      setTimeout(() => {
        loadDataFresh()
      }, 100)
      return
    }
    
    // No cache, load normally
    loadDataFresh()
  }, [activeTab])

  const loadDataFresh = () => {
    const abortController = new AbortController()
    
    // Parallelize API calls for better performance
    Promise.all([
      loadUsers(abortController.signal),
      loadSummaryMetrics(abortController.signal)
    ]).then(() => {
      // Cache the fetched data after state updates
      setTimeout(() => {
        const dataToCache = {
          users,
          metrics: summaryMetrics
        }
        prefetchService.prefetch('consolidated-users', async () => dataToCache, 30000)
      }, 100)
    }).catch(error => {
      if (error.name !== 'AbortError') {
        console.error('Error loading user data:', error)
      }
    })
    
    return () => {
      abortController.abort()
    }
  }

  const loadUsers = async (signal) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('authToken')
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      
      // Use the same endpoint for all tabs - filter on frontend
      const endpoint = '/api/admin/users'
      
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: signal
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('User Management - Users API Response:', data)
      console.log('User Management - Users count:', (data.users || data.data || []).length)
      const usersData = data.users || data.data || []
      console.log('User Management - Users data:', usersData.map(user => ({
        name: user.name,
        account_type: user.account_type,
        accountType: user.accountType,
        id: user.id
      })))
      setUsers(usersData)
    } catch (error) {
      // Suppress AbortError - it's expected when component unmounts
      if (error.name !== 'AbortError') {
        console.error('Error loading users:', error)
      }
      setUsers([])
    } finally {
      setLoading(false)
      // Dispatch page load completion event for Loading Report
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'consolidated-users' }
      }))
    }
  }

  const loadSummaryMetrics = async (signal) => {
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3' || localStorage.getItem('authToken')
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      
      const response = await fetch(`${apiBaseUrl}/api/admin/user-metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: signal
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('User Management - API Response:', data)
        
        // Map the backend response to frontend expected format
        setSummaryMetrics({
          totalUsers: data.totalUsers || 0,
          individualUsers: data.individualUsers || 0,
          familyUsers: data.familyUsers || 0,
          businessUsers: data.businessUsers || 0,
          activeUsers: data.activeUsers || 0,
          totalRoundUps: data.totalRoundUps || 0,
          totalFees: data.totalFees || 0,
          aiMappings: data.aiMappings || 0
        })
        
        console.log('User Management - Mapped metrics:', {
          totalUsers: data.totalUsers || 0,
          individualUsers: data.individualUsers || 0,
          familyUsers: data.familyUsers || 0,
          businessUsers: data.businessUsers || 0
        })
      }
    } catch (error) {
      // Suppress AbortError - it's expected when component unmounts
      if (error.name !== 'AbortError') {
        console.error('Error loading summary metrics:', error)
      }
      // Set default values if API fails
      setSummaryMetrics({
        totalUsers: 0,
        individualUsers: 0,
        familyUsers: 0,
        businessUsers: 0,
        activeUsers: 0,
        totalRoundUps: 0,
        totalFees: 0,
        aiMappings: 0
      })
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id?.toString().includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || user.subscription_status === statusFilter || user.status === statusFilter
    const matchesSegment = segmentFilter === 'all' || user.account_type === segmentFilter || user.accountType === segmentFilter
    
    // Filter by user type tab - check both account_type and accountType fields
    const userAccountType = user.account_type || user.accountType
    const matchesUserType = activeTab === 'all' || 
                           (activeTab === 'individual' && (userAccountType === 'individual' || userAccountType === 'Individual')) ||
                           (activeTab === 'family' && (userAccountType === 'family' || userAccountType === 'Family')) ||
                           (activeTab === 'business' && (userAccountType === 'business' || userAccountType === 'Business'))
    
    // Debug logging
    console.log(`🔍 User Management - Filtering user:`, {
      name: user.name,
      account_type: user.account_type,
      accountType: user.accountType,
      userAccountType: userAccountType,
      activeTab: activeTab,
      matchesUserType: matchesUserType,
      matchesSearch: matchesSearch,
      matchesStatus: matchesStatus,
      matchesSegment: matchesSegment
    })
    
    return matchesSearch && matchesStatus && matchesSegment && matchesUserType
  })

  // Debug logging for filtered results
  console.log(`🔍 User Management - Filtered users for tab "${activeTab}":`, filteredUsers.length, 'users')
  console.log(`🔍 User Management - Filtered users data:`, filteredUsers.map(user => ({
    name: user.name,
    account_type: user.account_type,
    accountType: user.accountType,
    id: user.id
  })))

  // Calculate tab-specific metrics
  const getTabMetrics = () => {
    const tabUsers = filteredUsers
    const activeTabUsers = tabUsers.filter(user => user.subscription_status === 'active')
    
    // Calculate total round-ups for this tab (simulate based on transaction count)
    const totalRoundUps = tabUsers.reduce((sum, user) => {
      return sum + (user.total_lifetime_transactions * 0.05 || 0)
    }, 0)
    
    // Calculate AI mappings for this tab
    const aiMappings = tabUsers.reduce((sum, user) => {
      return sum + (user.mapping_count || 0)
    }, 0)
    
    return {
      totalUsers: tabUsers.length,
      activeUsers: activeTabUsers.length,
      totalRoundUps: totalRoundUps,
      aiMappings: aiMappings
    }
  }

  const tabMetrics = getTabMetrics()

  // Debug logging for tab metrics
  console.log(`📊 Tab Metrics for "${activeTab}":`, tabMetrics)
  console.log(`📊 Filtered users count:`, filteredUsers.length)

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm, statusFilter, segmentFilter])


  const getTabIcon = (tab) => {
    switch (tab) {
      case 'all': return <Users className="w-4 h-4" />
      case 'individual': return <User className="w-4 h-4" />
      case 'family': return <Home className="w-4 h-4" />
      case 'business': return <Building className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'all': return 'All Users'
      case 'individual': return 'Individual Users'
      case 'family': return 'Family Users'
      case 'business': return 'Business Users'
      default: return 'Users'
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccountTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'individual': return 'bg-blue-100 text-blue-800'
      case 'family': return 'bg-purple-100 text-purple-800'
      case 'business': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSubscriptionStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border border-red-500/30'
      case 'not_renewing': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      case 'expired': return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    }
  }

  // Action handlers
  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = (user) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleManagePermissions = (user) => {
    setSelectedUser(user)
    setShowPermissionsModal(true)
  }

  const handleMessageUser = (user) => {
    setSelectedUser(user)
    setShowMessageModal(true)
  }

  const handleExportUser = async (user) => {
    console.log('🚀 Export button clicked for user:', user)
    console.log('🚀 User keys:', Object.keys(user))
    console.log('🚀 User ID:', user.id)
    console.log('🚀 User name:', user.name)
    console.log('🚀 User email:', user.email)
    try {
      // Prepare comprehensive user data for Excel export
      const userData = [
        ['KAMIOI USER DETAILED EXPORT', ''],
        ['Export Date', new Date().toISOString()],
        ['User ID', user.id],
        ['', ''],
        ['PERSONAL INFORMATION', ''],
        ['Full Name', user.name || 'N/A'],
        ['Email Address', user.email || 'N/A'],
        ['Account Number', user.account_number || `ID: ${getFormattedUserId(user)}`],
        ['Account Type', user.account_type || 'N/A'],
        ['Status', user.status || 'Unknown'],
        ['Provider', user.provider || 'N/A'],
        ['Google Account', user.provider === 'google' ? 'Yes' : 'No'],
        ['Created At', user.created_at || 'N/A'],
        ['Last Updated', user.updated_at || 'N/A'],
        ['', ''],
        ['ADDRESS INFORMATION', ''],
        ['City', user.city || 'Unknown'],
        ['State', user.state || 'Unknown'],
        ['ZIP Code', user.zip || user.zip_code || 'Unknown'],
        ['Phone Number', user.phone || 'Unknown'],
        ['Full Address', `${user.city || 'Unknown'}, ${user.state || 'Unknown'} ${user.zip || user.zip_code || 'Unknown'}`],
        ['', ''],
        ['FINANCIAL METRICS', ''],
        ['Total Balance', `$${user.total_balance || 0}`],
        ['Round-ups Amount', `$${user.round_ups || 0}`],
        ['Growth Rate', `${user.growth_rate || 0}%`],
        ['Total Fees', `$${user.fees || 0}`],
        ['Transaction Count', user.transaction_count || 0],
        ['', ''],
        ['AI & BEHAVIORAL METRICS', ''],
        ['AI Health Score', user.ai_health || 0],
        ['Mapping Accuracy', `${user.mapping_accuracy || 0}%`],
        ['Risk Level', user.risk_level || 'Unknown'],
        ['Engagement Score', user.engagement_score || 0],
        ['AI Mappings Count', user.mapping_count || 0],
        ['', ''],
        ['ACTIVITY & ENGAGEMENT', ''],
        ['Activity Count', user.activity_count || 0],
        ['Last Activity', user.last_activity || 'Never'],
        ['AI Adoption Rate', `${user.ai_adoption || 0}%`],
        ['Source', user.source || 'Unknown'],
        ['', ''],
        ['ACCOUNT DETAILS', ''],
        ['User GUID', user.user_guid || 'N/A'],
        ['Password Set', user.password ? 'Yes' : 'No'],
        ['Google UID', user.google_uid || 'N/A'],
        ['Google Photo URL', user.google_photo_url || 'N/A'],
        ['', ''],
        ['SYSTEM METRICS', ''],
        ['Total Transactions', user.transaction_count || 0],
        ['Total AI Mappings', user.mapping_count || 0],
        ['Account Age (Days)', user.created_at ? Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) : 'N/A'],
        ['Is Active', user.status === 'active' ? 'Yes' : 'No'],
        ['', ''],
        ['EXPORT METADATA', ''],
        ['Export Generated By', 'Kamioi Admin Dashboard'],
        ['Export Version', '1.0'],
        ['Data Source', 'Kamioi Database'],
        ['Export Timestamp', new Date().toISOString()]
      ]
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(userData)
      
      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Column A
        { wch: 30 }  // Column B
      ]
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'User Data')
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `user_${user.id}_${user.email}_export.xlsx`
      console.log('📥 Downloading Excel file:', link.download)
      link.click()
      URL.revokeObjectURL(url)
      console.log('✅ Excel export completed successfully')
    } catch (error) {
      console.error('❌ Excel export failed:', error)
    }
  }

  const handleExportAllData = async () => {
    console.log('📊 Export All Data button clicked')
    try {
      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new()
      
      // 1. Summary Sheet
      const summaryData = [
        ['Kamioi User Management Export'],
        ['Export Date', new Date().toISOString()],
        ['Total Users', users.length],
        ['', ''],
        ['Summary Metrics', ''],
        ['Total Users', summaryMetrics.totalUsers || 0],
        ['Individual Users', summaryMetrics.individualUsers || 0],
        ['Family Users', summaryMetrics.familyUsers || 0],
        ['Business Users', summaryMetrics.businessUsers || 0],
        ['Active Users', summaryMetrics.activeUsers || 0],
        ['Total Round-ups', `$${summaryMetrics.totalRoundUps || 0}`],
        ['AI Mappings', summaryMetrics.aiMappings || 0]
      ]
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
      summaryWs['!cols'] = [{ wch: 20 }, { wch: 30 }]
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
      
      // 2. Comprehensive Users Data Sheet
      const usersData = [
        ['ID', 'Name', 'Email', 'Account Type', 'Account Number', 'Status', 'Provider', 'Google Account', 'Created At', 'Last Updated', 'City', 'State', 'ZIP Code', 'Phone', 'Full Address', 'Total Balance', 'Round-ups', 'Growth Rate', 'Fees', 'Transaction Count', 'AI Health', 'Mapping Accuracy', 'Risk Level', 'Engagement Score', 'AI Mappings Count', 'Activity Count', 'Last Activity', 'AI Adoption', 'Source', 'User GUID', 'Password Set', 'Google UID', 'Account Age (Days)', 'Is Active']
      ]
      
      users.forEach(user => {
        const accountAge = user.created_at ? Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) : 'N/A'
        const fullAddress = `${user.city || 'Unknown'}, ${user.state || 'Unknown'} ${user.zip || user.zip_code || 'Unknown'}`
        
        usersData.push([
          user.id,
          user.name || 'N/A',
          user.email || 'N/A',
          user.account_type || 'N/A',
          user.account_number || `ID: ${getFormattedUserId(user)}`,
          user.status || 'Unknown',
          user.provider || 'N/A',
          user.provider === 'google' ? 'Yes' : 'No',
          user.created_at || 'N/A',
          user.updated_at || 'N/A',
          user.city || 'Unknown',
          user.state || 'Unknown',
          user.zip || user.zip_code || 'Unknown',
          user.phone || 'Unknown',
          fullAddress,
          `$${user.total_balance || 0}`,
          `$${user.round_ups || 0}`,
          `${user.growth_rate || 0}%`,
          `$${user.fees || 0}`,
          user.transaction_count || 0,
          user.ai_health || 0,
          `${user.mapping_accuracy || 0}%`,
          user.risk_level || 'Unknown',
          user.engagement_score || 0,
          user.mapping_count || 0,
          user.activity_count || 0,
          user.last_activity || 'Never',
          `${user.ai_adoption || 0}%`,
          user.source || 'Unknown',
          user.user_guid || 'N/A',
          user.password ? 'Yes' : 'No',
          user.google_uid || 'N/A',
          accountAge,
          user.status === 'active' ? 'Yes' : 'No'
        ])
      })
      
      const usersWs = XLSX.utils.aoa_to_sheet(usersData)
      usersWs['!cols'] = [
        { wch: 8 },   // ID
        { wch: 20 },  // Name
        { wch: 30 },  // Email
        { wch: 15 },  // Account Type
        { wch: 18 },  // Account Number
        { wch: 12 },  // Status
        { wch: 12 },  // Provider
        { wch: 15 },  // Google Account
        { wch: 20 },  // Created At
        { wch: 20 },  // Last Updated
        { wch: 15 },  // City
        { wch: 8 },   // State
        { wch: 10 },  // ZIP Code
        { wch: 15 },  // Phone
        { wch: 35 },  // Full Address
        { wch: 15 },  // Total Balance
        { wch: 12 },  // Round-ups
        { wch: 12 },  // Growth Rate
        { wch: 10 },  // Fees
        { wch: 15 },  // Transaction Count
        { wch: 12 },  // AI Health
        { wch: 15 },  // Mapping Accuracy
        { wch: 12 },  // Risk Level
        { wch: 15 },  // Engagement Score
        { wch: 18 },  // AI Mappings Count
        { wch: 15 },  // Activity Count
        { wch: 15 },  // Last Activity
        { wch: 12 },  // AI Adoption
        { wch: 12 },  // Source
        { wch: 20 },  // User GUID
        { wch: 12 },  // Password Set
        { wch: 20 },  // Google UID
        { wch: 15 },  // Account Age
        { wch: 10 }   // Is Active
      ]
      XLSX.utils.book_append_sheet(wb, usersWs, 'Users Data')
      
      // 3. Financial Analytics Sheet
      const financialData = [
        ['Financial Analytics'],
        ['Metric', 'Value'],
        ['Total Users', users.length],
        ['Total Balance', `$${users.reduce((sum, user) => sum + (parseFloat(user.total_balance) || 0), 0).toFixed(2)}`],
        ['Total Round-ups', `$${users.reduce((sum, user) => sum + (parseFloat(user.round_ups) || 0), 0).toFixed(2)}`],
        ['Total Fees', `$${users.reduce((sum, user) => sum + (parseFloat(user.fees) || 0), 0).toFixed(2)}`],
        ['Average Growth Rate', `${(users.reduce((sum, user) => sum + (parseFloat(user.growth_rate) || 0), 0) / users.length).toFixed(2)}%`],
        ['', ''],
        ['By Account Type', ''],
        ['Individual Users', users.filter(u => u.account_type === 'individual').length],
        ['Family Users', users.filter(u => u.account_type === 'family').length],
        ['Business Users', users.filter(u => u.account_type === 'business').length]
      ]
      
      const financialWs = XLSX.utils.aoa_to_sheet(financialData)
      financialWs['!cols'] = [{ wch: 20 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, financialWs, 'Financial Analytics')
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `kamioi_users_export_${new Date().toISOString().split('T')[0]}.xlsx`
      console.log('📥 Downloading Excel file:', link.download)
      link.click()
      URL.revokeObjectURL(url)
      console.log('✅ Excel export completed successfully')
    } catch (error) {
      console.error('❌ Excel export failed:', error)
    }
  }

  const handleBulkActions = () => {
    console.log('👥 Bulk Actions button clicked')
    // For now, just show an alert. In a real app, this would open a modal with bulk action options
    setModal({
      isOpen: true,
      type: 'info',
      title: 'Bulk Actions',
      message: 'Bulk Actions feature coming soon! This will allow you to:\n• Select multiple users\n• Perform bulk operations\n• Send bulk messages\n• Export selected users\n• Update user statuses in bulk',
      onConfirm: () => setModal({ ...modal, isOpen: false })
    })
  }

  const refreshUsers = () => {
    setLoading(true)
    // Force refresh by clearing any cached data
    localStorage.removeItem('kamioi_admin_users')
    localStorage.removeItem('kamioi_admin_metrics')
    
    // Simulate API call to refresh data
    setTimeout(() => {
      loadUsers()
      setLoading(false)
    }, 1000)
  }

  return (
    <>
      <GlassModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText || 'OK'}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
    <div className="space-y-6">
      {/* Enterprise Header with Enhanced Glass Effect */}
      <div className="glass-card p-6 shadow-2xl border border-blue-500/20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-400 mt-2">Comprehensive user intelligence and management system</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={refreshUsers}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh Users</span>
            </button>
            <button 
              onClick={handleExportAllData}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Export Data</span>
            </button>
            <button 
              onClick={handleBulkActions}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Bulk Actions</span>
            </button>
            <button 
              onClick={async () => {
                try {
                  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                  const response = await fetch(`${apiBaseUrl}/api/admin/users/migrate-account-numbers`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer admin_token_3`
                    }
                  })
                  
                  const result = await response.json()
                  
                  if (result.success) {
                    setModal({
                      isOpen: true,
                      type: 'success',
                      title: 'Migration Complete',
                      message: 'Account numbers migrated successfully!',
                      onConfirm: () => setModal({ ...modal, isOpen: false })
                    })
                    loadUsers() // Refresh the user list
                  } else {
                    setModal({
                      isOpen: true,
                      type: 'error',
                      title: 'Migration Failed',
                      message: `Failed to migrate account numbers: ${result.error}`,
                      onConfirm: () => setModal({ ...modal, isOpen: false })
                    })
                  }
                } catch (error) {
                  console.error('Error migrating account numbers:', error)
                  setModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Migration Error',
                    message: 'Error migrating account numbers. Please try again.',
                    onConfirm: () => setModal({ ...modal, isOpen: false })
                  })
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
            >
              <Settings className="w-5 h-5" />
              <span>Migrate IDs</span>
            </button>
            <button 
              onClick={async () => {
                try {
                  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                  const response = await fetch(`${apiBaseUrl}/api/admin/users/migrate-address-fields`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer admin_token_3`
                    }
                  })
                  
                  const result = await response.json()
                  
                  if (result.success) {
                    setModal({
                      isOpen: true,
                      type: 'success',
                      title: 'Success',
                      message: 'Address fields added successfully!',
                      onConfirm: () => setModal({ ...modal, isOpen: false })
                    })
                    loadUsers() // Refresh the user list
                  } else {
                    setModal({
                      isOpen: true,
                      type: 'error',
                      title: 'Failed',
                      message: `Failed to add address fields: ${result.error}`,
                      onConfirm: () => setModal({ ...modal, isOpen: false })
                    })
                  }
                } catch (error) {
                  console.error('Error adding address fields:', error)
                  setModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Error',
                    message: 'Error adding address fields. Please try again.',
                    onConfirm: () => setModal({ ...modal, isOpen: false })
                  })
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
            >
              <Building className="w-5 h-5" />
              <span>Add Address Fields</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <>
      {loading ? (
        <div className="glass-card p-6 rounded-lg shadow-xl border border-gray-500/20">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Loading metrics...</span>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-lg shadow-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-white">{tabMetrics.totalUsers}</p>
              <p className="text-gray-400 text-xs">
                {activeTab === 'all' ? 'All user types' : 
                 activeTab === 'individual' ? 'Individual users' :
                 activeTab === 'family' ? 'Family users' :
                 activeTab === 'business' ? 'Business users' : 'All user types'}
              </p>
              {activeTab === 'all' && (
                <div className="mt-2 text-xs text-gray-400">
                  <span className="text-blue-400">I: {summaryMetrics.individualUsers}</span>
                  <span className="mx-2">•</span>
                  <span className="text-purple-400">F: {summaryMetrics.familyUsers}</span>
                  <span className="mx-2">•</span>
                  <span className="text-green-400">B: {summaryMetrics.businessUsers}</span>
                </div>
              )}
            </div>
            <Users className="w-12 h-12 text-blue-400" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-lg shadow-xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-white">{tabMetrics.activeUsers}</p>
              <p className="text-gray-400 text-xs">Currently active</p>
            </div>
            <Activity className="w-12 h-12 text-green-400" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-lg shadow-xl border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Round-ups</p>
              <p className="text-3xl font-bold text-white">${(tabMetrics.totalRoundUps || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-gray-400 text-xs">All time</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-400" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-lg shadow-xl border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">AI Mappings</p>
              <p className="text-3xl font-bold text-white">{tabMetrics.aiMappings}</p>
              <p className="text-gray-400 text-xs">Automated mappings</p>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-400" />
          </div>
        </div>
      </div>
      )}
      </>

      {/* User Type Tabs */}
      <div className="glass-card p-6 rounded-lg shadow-xl border border-gray-500/20">
        <div className="flex space-x-1 mb-6">
          {['all', 'individual', 'family', 'business'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {getTabIcon(tab)}
              {getTabLabel(tab)}
            </button>
          ))}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name, email, ID, or AI metrics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="not_renewing">Not Renewing</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Segments</option>
              <option value="individual">Individual</option>
              <option value="family">Family</option>
              <option value="business">Business</option>
            </select>
          </div>
      </div>

      {/* User Content */}
      <>
      {/* Users Table */}
      <div className="glass-card rounded-lg shadow-xl border border-gray-500/20">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User Profile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Financial Metrics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    AI & Behavioral
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Activity & Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {paginatedUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-white/5"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-300">
                              {user.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          {/* Google Logo Indicator */}
                          {user.provider === 'google' && (
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                              <svg className="h-3 w-3" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {user.name || 'Unknown User'}
                            </span>
                            {user.provider === 'google' && (
                              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                                Google
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            {user.email}
                          </div>
                          <div className="text-xs text-white">
                            ID: {getFormattedUserId(user)}
                          </div>
                          <div className="text-xs text-white">
                            {user.city}, {user.state} {user.zip || user.zip_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        <div>${(user.total_lifetime_transactions * 0.1 || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-400">
                          ${(user.total_lifetime_transactions * 0.05 || 0).toFixed(2)} round-ups
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.loyalty_score || 0}% score
                        </div>
                        <div className="text-xs text-gray-400">
                          ${(user.total_lifetime_transactions * 0.01 || 0).toFixed(2)} fees
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        <div>Health: {user.loyalty_score || 0}</div>
                        <div className="text-xs text-gray-400">
                          Mapping: {user.mapping_count || 0}
                        </div>
                        <div className="text-xs text-gray-400">
                          Risk: {user.risk_profile || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Transactions: {user.total_lifetime_transactions || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        <div>{user.transaction_count || 0} activities</div>
                        <div className="text-xs text-gray-400">
                          Last: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Never'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Monthly: {user.avg_monthly_transactions || 0}
                        </div>
                        <div className="text-xs text-gray-400">
                          Multiplier: {user.ai_fee_multiplier || 1.0}x
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionStatusColor(user.subscription_status)}`}>
                        {user.subscription_status || 'No Subscription'}
                      </span>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(user.account_type)}`}>
                          {user.account_type || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewUser(user)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="View User Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="text-green-400 hover:text-green-300 transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleMessageUser(user)}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                          title="Send Message"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('🔘 Export button clicked!')
                            handleExportUser(user)
                          }}
                          className="text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                          title="Export User Data"
                          type="button"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleManagePermissions(user)}
                          className="text-orange-400 hover:text-orange-300 transition-colors"
                          title="Manage Permissions"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-6 py-4">
            <div className="flex items-center text-sm text-gray-400">
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-400 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-400 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-lg shadow-2xl border border-blue-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">User Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-300">
                      {selectedUser.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedUser.name}</h3>
                    <p className="text-gray-400">{selectedUser.email}</p>
                    <p className="text-sm text-white">ID: {getFormattedUserId(selectedUser)}</p>
                    <p className="text-sm text-white">{selectedUser.city}, {selectedUser.state} {selectedUser.zip || selectedUser.zip_code}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-3">Financial Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Balance:</span>
                        <span className="text-white">${selectedUser.total_balance || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Round-ups:</span>
                        <span className="text-white">${selectedUser.round_ups || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Growth Rate:</span>
                        <span className="text-white">{selectedUser.growth_rate || 0}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-3">AI & Behavioral</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">AI Health:</span>
                        <span className="text-white">{selectedUser.ai_health || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mapping Accuracy:</span>
                        <span className="text-white">{selectedUser.mapping_accuracy || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level:</span>
                        <span className="text-white">{selectedUser.risk_profile || selectedUser.risk_level || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Engagement:</span>
                        <span className="text-white">{selectedUser.engagement_score || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-3">Address Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Street:</span>
                      <span className="text-white">{selectedUser.street || selectedUser.address || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">City:</span>
                      <span className="text-white">{selectedUser.city || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">State:</span>
                      <span className="text-white">{selectedUser.state || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ZIP Code:</span>
                      <span className="text-white">{selectedUser.zip || selectedUser.zip_code || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white">{selectedUser.phone || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-lg shadow-2xl border border-red-500/20 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Delete User</h2>
              </div>
              
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <strong className="text-white">{selectedUser.name}</strong>? 
                This action cannot be undone and will remove all associated data.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                      const response = await fetch(`${apiBaseUrl}/api/admin/users/${selectedUser.id}`, {
                        method: 'DELETE',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer admin_token_3`
                        }
                      })
                      
                      const result = await response.json()
                      
                      if (result.success) {
                        // Remove user from local state
                        setUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id))
                        setShowDeleteModal(false)
                        console.log('User deleted successfully:', result.message)
                      } else {
                        console.error('Failed to delete user:', result.error)
                        setModal({
                          isOpen: true,
                          type: 'error',
                          title: 'Delete Failed',
                          message: `Failed to delete user: ${result.error}`,
                          onConfirm: () => setModal({ ...modal, isOpen: false })
                        })
                      }
                    } catch (error) {
                      console.error('Error deleting user:', error)
                      setModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Delete Error',
                        message: 'Error deleting user. Please try again.',
                        onConfirm: () => setModal({ ...modal, isOpen: false })
                      })
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message User Modal */}
      {showMessageModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-lg shadow-2xl border border-purple-500/20 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Send Message</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="Message subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="Type your message here..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement send message functionality
                    console.log('Send message to:', selectedUser.email)
                    setShowMessageModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-lg shadow-2xl border border-green-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Edit User</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue={selectedUser.name || ''}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={selectedUser.email || ''}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-500">
                      <option value="individual" selected={selectedUser.account_type === 'individual'}>Individual</option>
                      <option value="family" selected={selectedUser.account_type === 'family'}>Family</option>
                      <option value="business" selected={selectedUser.account_type === 'business'}>Business</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-500">
                      <option value="active" selected={selectedUser.status === 'active'}>Active</option>
                      <option value="inactive" selected={selectedUser.status === 'inactive'}>Inactive</option>
                      <option value="pending" selected={selectedUser.status === 'pending'}>Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Reset Password</label>
                  <div className="flex space-x-3">
                    <input
                      type="password"
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                      placeholder="New password (optional)"
                    />
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: Implement save user functionality
                      console.log('Save user changes:', selectedUser.id)
                      setShowEditModal(false)
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </>

    </div>
    </>
  )
}

export default ConsolidatedUserManagement
