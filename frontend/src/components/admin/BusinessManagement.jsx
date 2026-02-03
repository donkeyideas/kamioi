import React, { useState, useEffect } from 'react'
import { 
  Building2, Search, Filter, Download, Mail, Eye, UserCheck, UserX, 
  RefreshCw, TrendingUp, AlertTriangle, CheckCircle, XCircle, Star,
  DollarSign, Activity, MapPin, Calendar, Phone, Shield, Zap, Award,
  Target, BarChart3, Brain, Clock, FileText, MessageSquare, Settings,
  Users, Briefcase, PieChart, FileBarChart, Building, X
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query' // 🚀 PERFORMANCE FIX: Import React Query

const BusinessManagement = () => {
  const [activeTab, setActiveTab] = useState('directory')
  const queryClient = useQueryClient() // 🚀 PERFORMANCE FIX: For cache invalidation
  const { isLightMode } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [businessMonitoringData, setBusinessMonitoringData] = useState({
    team: null,
    portfolio: null,
    goals: null,
    analytics: null,
    reports: null,
    activity: null,
    settings: null
  })

  // Businesses data - load from localStorage
  const [businesses, setBusinesses] = useState([])
  const [analytics, setAnalytics] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    avgTeamSize: 0,
    totalBusinessValue: 0,
    avgBusinessGoals: 0,
    highEngagementBusinesses: 0
  })

  // Load businesses data from localStorage
  useEffect(() => {
    loadBusinesses()
    // Dispatch page load completion event with small delay
    const timer = setTimeout(() => {
      console.log('📊 BusinessManagement - Dispatching admin-page-load-complete for businesses')
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'businesses' }
      }))
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const loadBusinesses = () => {
    try {
      // Note: loadingBusinessData is now managed by React Query
      
      // Get business users from localStorage
      const businessUsers = JSON.parse(localStorage.getItem('kamioi_business_users') || '[]')
      
      // Also check for current user if they're a business user
      const currentUser = JSON.parse(localStorage.getItem('kamioi_user') || 'null')
      if (currentUser && currentUser.accountType === 'business' && !businessUsers.find(b => b.id === currentUser.id)) {
        businessUsers.push(currentUser)
      }
      
      setBusinesses(businessUsers)
      
      // Calculate analytics from actual data
      const totalBusinesses = businessUsers.length
      const activeBusinesses = businessUsers.filter(b => b.status === 'Active' || !b.status).length
      const avgTeamSize = businessUsers.length > 0 ? 
        businessUsers.reduce((sum, b) => sum + (b.numberOfEmployees || 0), 0) / businessUsers.length : 0
      const totalBusinessValue = businessUsers.reduce((sum, b) => sum + (b.annualRevenue || 0), 0)
      
      setAnalytics({
        totalBusinesses,
        activeBusinesses,
        avgTeamSize,
        totalBusinessValue,
        avgBusinessGoals: 0, // Would need goals data
        highEngagementBusinesses: 0 // Would need engagement data
      })
    } catch (error) {
      console.error('Error loading businesses:', error)
      setBusinesses([])
    }
  }

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.contact.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || business.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const getCardClass = () => {
    if (isLightMode) return 'bg-white rounded-xl shadow-lg border border-gray-200 p-6'
    return 'bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6'
  }

  const getTextClass = () => {
    if (isLightMode) return 'text-gray-800'
    return 'text-white'
  }

  const getSubtextClass = () => {
    if (isLightMode) return 'text-gray-600'
    return 'text-gray-400'
  }

  const getInputClass = () => {
    if (isLightMode) return 'bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500'
    return 'bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-green-400 bg-green-400/20'
      case 'Suspended': return 'text-red-400 bg-red-400/20'
      case 'Pending': return 'text-yellow-400 bg-yellow-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getEngagementColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  // 🚀 PERFORMANCE FIX: Use React Query for business monitoring data - proper caching, no unnecessary reloads
  const { data: businessMonitoringQueryData, isLoading: isLoadingBusinessMonitoring, error: businessMonitoringError, refetch: refetchBusinessMonitoring } = useQuery({
    queryKey: ['business-monitoring', selectedBusiness?.id],
    queryFn: async () => {
      if (!selectedBusiness?.id) {
        return {
          team: null,
          portfolio: null,
          goals: null,
          analytics: null,
          reports: null,
          activity: null,
          settings: null
        }
      }
      
      // 🚀 FIX: Try multiple token sources and wait a bit if token not immediately available
      let token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      
      // If no token, wait a short time and retry (handles race condition)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 100))
        token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      }
      
      if (!token) {
        console.warn('⚠️ BusinessManagement - No authentication token available, returning empty data')
        return {
          team: null,
          portfolio: null,
          goals: null,
          analytics: null,
          reports: null,
          activity: null,
          settings: null
        }
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const headers = { 'Authorization': `Bearer ${token}` }
      
      // Fetch all data in parallel
      const [teamRes, portfolioRes, goalsRes, analyticsRes, reportsRes, activityRes, settingsRes] = await Promise.allSettled([
        fetch(`${apiBaseUrl}/api/admin/businesses/${selectedBusiness.id}/team`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/businesses/${selectedBusiness.id}/portfolio`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/businesses/${selectedBusiness.id}/goals`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/businesses/${selectedBusiness.id}/analytics`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/businesses/${selectedBusiness.id}/reports`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/businesses/${selectedBusiness.id}/activity`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/businesses/${selectedBusiness.id}/settings`, { headers })
      ])

      const teamData = teamRes.status === 'fulfilled' && teamRes.value.ok
        ? await teamRes.value.json()
        : null
      const portfolioData = portfolioRes.status === 'fulfilled' && portfolioRes.value.ok
        ? await portfolioRes.value.json()
        : null
      const goalsData = goalsRes.status === 'fulfilled' && goalsRes.value.ok
        ? await goalsRes.value.json()
        : null
      const analyticsData = analyticsRes.status === 'fulfilled' && analyticsRes.value.ok
        ? await analyticsRes.value.json()
        : null
      const reportsData = reportsRes.status === 'fulfilled' && reportsRes.value.ok
        ? await reportsRes.value.json()
        : null
      const activityData = activityRes.status === 'fulfilled' && activityRes.value.ok
        ? await activityRes.value.json()
        : null
      const settingsData = settingsRes.status === 'fulfilled' && settingsRes.value.ok
        ? await settingsRes.value.json()
        : null

      return {
        team: teamData?.data || null,
        portfolio: portfolioData?.data || null,
        goals: goalsData?.data || null,
        analytics: analyticsData?.data || null,
        reports: reportsData?.data || null,
        activity: activityData?.data || null,
        settings: settingsData?.data || null
      }
    },
    enabled: !!selectedBusiness?.id, // Only fetch when a business is selected
    staleTime: 300000, // 🚀 FIX: 5 minutes - data is fresh for 5 minutes
    gcTime: 600000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false, // 🚀 FIX: Don't refetch on window focus
    refetchOnMount: false, // 🚀 FIX: Don't refetch on mount if data is fresh
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data) => {
      // Update local state from React Query cache
      if (data) {
        setBusinessMonitoringData(data)
      }
    }
  })
  
  // 🚀 PERFORMANCE FIX: Map React Query loading to component loading state for backward compatibility
  const loadingBusinessData = isLoadingBusinessMonitoring
  
  // Update local state when React Query data changes
  useEffect(() => {
    if (businessMonitoringQueryData) {
      setBusinessMonitoringData(businessMonitoringQueryData)
    }
  }, [businessMonitoringQueryData])
  
  // 🚀 PERFORMANCE FIX: Wrapper function for backward compatibility
  const fetchBusinessMonitoringData = async (businessId) => {
    // React Query handles caching automatically - just trigger a refetch
    await refetchBusinessMonitoring()
  }

  const handleViewBusinessDetails = (business) => {
    setSelectedBusiness(business)
    fetchBusinessMonitoringData(business.id)
  }

  // Button handlers
  const handleExport = () => {
    const headers = ['ID', 'Business Name', 'Admin Email', 'Status', 'Team Size', 'Portfolio Value', 'Goals', 'Engagement Score', 'Industry', 'Created Date']
    const csvContent = [
      headers.join(','),
      ...businesses.map(business => [
        business.id,
        `"${business.name}"`,
        `"${business.adminEmail}"`,
        business.status,
        business.teamSize,
        business.portfolioValue,
        business.goalCount,
        business.engagementScore,
        business.industry,
        business.createdDate
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'businesses_export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleBulkActions = () => {
    displayNotificationModal('Bulk actions functionality would be implemented here', 'info')
  }

  const handleViewBusiness = (business) => {
    displayNotificationModal(`Viewing business: ${business.name}`, 'info')
  }

  const handleImpersonateBusiness = (business) => {
    displayNotificationModal(`Impersonating business: ${business.name}`, 'info')
  }

  const handleToggleBusinessStatus = (business) => {
    displayNotificationModal(`Toggling status for business: ${business.name}`, 'info')
  }

  const displayNotificationModal = (message, type = 'success') => {
    setNotificationMessage(message)
    setShowNotificationModal(true)
  }

  const handleNotificationModalClose = () => {
    setShowNotificationModal(false)
    setNotificationMessage('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${getTextClass()}`}>Business Management</h1>
          <p className={getSubtextClass()}>Monitor and manage business accounts across the platform</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={loadBusinesses}
            className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg px-4 py-2 text-purple-400 flex items-center space-x-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Businesses</span>
          </button>
          <button 
            onClick={handleExport}
            className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
          <button 
            onClick={handleBulkActions}
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 flex items-center space-x-2 transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Bulk Actions</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'directory', label: 'Business Directory', icon: Building2 },
          { id: 'monitoring', label: 'Business Monitoring', icon: Eye },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'ai-insights', label: 'AI Insights', icon: Brain }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Business Directory Tab */}
      {activeTab === 'directory' && (
        <div className={getCardClass()}>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search businesses by name, ID, or admin email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 ${getInputClass()}`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={getInputClass()}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Businesses Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Business Profile</th>
                  <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Team</th>
                  <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Financial</th>
                  <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Engagement</th>
                  <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Status</th>
                  <th className={`text-right pb-3 ${getSubtextClass()} font-medium`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.map(business => (
                  <tr key={business.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`font-medium ${getTextClass()}`}>
                            {business.name || 'Unknown Business'}
                          </p>
                          <p className={`text-sm ${getSubtextClass()}`}>
                            {business.contact || 'No contact'}
                          </p>
                          <p className={`text-xs ${getSubtextClass()}`}>
                            {business.id || 'No ID'} • {business.type || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <div>
                          <span className={`text-sm ${getTextClass()}`}>
                            {business.employees || 0} members
                          </span>
                          <p className={`text-xs ${getSubtextClass()}`}>
                            {business.admins || 0} admins, {business.managers || 0} managers
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className={`font-medium ${getTextClass()}`}>
                          ${(business.revenue || 0).toFixed(2)}
                        </p>
                        <p className={`text-sm ${getSubtextClass()}`}>
                          {business.goalCount || 0} goals
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          {(business.monthlyGrowth || 0) >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          ) : (
                            <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                          )}
                          <span className={`text-xs ${(business.monthlyGrowth || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(business.monthlyGrowth || 0) > 0 ? '+' : ''}{business.monthlyGrowth || 0}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          (business.engagementScore || 0) >= 80 ? 'bg-green-400' :
                          (business.engagementScore || 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        <div>
                          <span className={`text-sm ${getTextClass()}`}>
                            Engagement: {business.engagementScore || 0}
                          </span>
                          <p className={`text-xs ${getSubtextClass()}`}>
                            {business.lastActivity || 'Unknown'} ago
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(business.status)}`}>
                        {business.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewBusinessDetails(business)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button 
                          onClick={() => handleImpersonateBusiness(business)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
                          title="Impersonate"
                        >
                          <UserCheck className="w-4 h-4 text-green-400" />
                        </button>
                        {business.status === 'Active' ? (
                          <button 
                            onClick={() => handleToggleBusinessStatus(business)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
                            title="Suspend"
                          >
                            <UserX className="w-4 h-4 text-red-400" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggleBusinessStatus(business)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
                            title="Activate"
                          >
                            <UserCheck className="w-4 h-4 text-green-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Business Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {selectedBusiness ? (
            <div className="space-y-6">
              {/* Selected Business Header */}
              <div className={getCardClass()}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold ${getTextClass()}`}>{selectedBusiness.name}</h3>
                      <p className={getSubtextClass()}>{selectedBusiness.adminEmail} • {selectedBusiness.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBusiness(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {loadingBusinessData ? (
                <div className={getCardClass()}>
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                    <span className={`ml-3 ${getTextClass()}`}>Loading business data...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Team Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <Users className="w-5 h-5 text-blue-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Team</h4>
                    </div>
                    {businessMonitoringData.team ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Members:</span>
                          <span className={getTextClass()}>{businessMonitoringData.team.totalMembers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Active Members:</span>
                          <span className="text-green-400">{businessMonitoringData.team.activeMembers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Pending Invites:</span>
                          <span className="text-yellow-400">{businessMonitoringData.team.pendingInvites}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Admins:</span>
                          <span className={getTextClass()}>{businessMonitoringData.team.businessRoles.admin}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Managers:</span>
                          <span className={getTextClass()}>{businessMonitoringData.team.businessRoles.manager}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No team data available</p>
                    )}
                  </div>

                  {/* Portfolio Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <PieChart className="w-5 h-5 text-green-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Portfolio</h4>
                    </div>
                    {businessMonitoringData.portfolio ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Portfolio Value:</span>
                          <span className={getTextClass()}>${businessMonitoringData.portfolio.portfolio.value}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Holdings:</span>
                          <span className={getTextClass()}>{businessMonitoringData.portfolio.portfolio.totalHoldings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Stocks:</span>
                          <span className={getTextClass()}>{businessMonitoringData.portfolio.portfolio.diversification.stocks}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Bonds:</span>
                          <span className={getTextClass()}>{businessMonitoringData.portfolio.portfolio.diversification.bonds}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Business Goals:</span>
                          <span className={getTextClass()}>{businessMonitoringData.portfolio.portfolio.businessGoals.length}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No portfolio data available</p>
                    )}
                  </div>

                  {/* Goals Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <Target className="w-5 h-5 text-purple-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Goals</h4>
                    </div>
                    {businessMonitoringData.goals ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Goals:</span>
                          <span className={getTextClass()}>{businessMonitoringData.goals.totalGoals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Completed:</span>
                          <span className="text-green-400">{businessMonitoringData.goals.completedGoals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>In Progress:</span>
                          <span className="text-yellow-400">{businessMonitoringData.goals.inProgressGoals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Business Goals:</span>
                          <span className={getTextClass()}>{businessMonitoringData.goals.businessGoals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Target Amount:</span>
                          <span className={getTextClass()}>${businessMonitoringData.goals.totalTargetAmount}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No goals data available</p>
                    )}
                  </div>

                  {/* Analytics Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-indigo-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Analytics</h4>
                    </div>
                    {businessMonitoringData.analytics ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Value:</span>
                          <span className={getTextClass()}>${businessMonitoringData.analytics.analytics.totalValue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Monthly Growth:</span>
                          <span className={getTextClass()}>{businessMonitoringData.analytics.analytics.monthlyGrowth}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Transactions:</span>
                          <span className={getTextClass()}>{businessMonitoringData.analytics.analytics.transactions.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Most Active Member:</span>
                          <span className={getTextClass()}>{businessMonitoringData.analytics.analytics.teamActivity.mostActive || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Avg Activity:</span>
                          <span className={getTextClass()}>{businessMonitoringData.analytics.analytics.teamActivity.avgActivity}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No analytics data available</p>
                    )}
                  </div>

                  {/* Reports Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <FileBarChart className="w-5 h-5 text-orange-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Reports</h4>
                    </div>
                    {businessMonitoringData.reports ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Reports:</span>
                          <span className={getTextClass()}>{businessMonitoringData.reports.totalReports}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>This Month:</span>
                          <span className="text-green-400">{businessMonitoringData.reports.generatedThisMonth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Financial Reports:</span>
                          <span className={getTextClass()}>{businessMonitoringData.reports.reportTypes.financial}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Compliance Reports:</span>
                          <span className={getTextClass()}>{businessMonitoringData.reports.reportTypes.compliance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Compliance Status:</span>
                          <span className={getTextClass()}>{businessMonitoringData.reports.complianceStatus}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No reports data available</p>
                    )}
                  </div>

                  {/* Activity Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <Activity className="w-5 h-5 text-pink-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Activity</h4>
                    </div>
                    {businessMonitoringData.activity ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Last Login:</span>
                          <span className={getTextClass()}>{businessMonitoringData.activity.activity.lastLogin || 'Never'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Logins:</span>
                          <span className={getTextClass()}>{businessMonitoringData.activity.activity.totalLogins}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Avg Session Duration:</span>
                          <span className={getTextClass()}>{businessMonitoringData.activity.activity.avgSessionDuration}min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Engagement Score:</span>
                          <span className={getTextClass()}>{businessMonitoringData.activity.activity.engagementScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Shared Activities:</span>
                          <span className={getTextClass()}>{businessMonitoringData.activity.activity.sharedActivities}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No activity data available</p>
                    )}
                  </div>

                  {/* Settings Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <Settings className="w-5 h-5 text-cyan-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Settings</h4>
                    </div>
                    {businessMonitoringData.settings ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Industry:</span>
                          <span className={getTextClass()}>{businessMonitoringData.settings.settings.businessInfo.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Business Size:</span>
                          <span className={getTextClass()}>{businessMonitoringData.settings.settings.businessInfo.size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>KYC Status:</span>
                          <span className={getTextClass()}>{businessMonitoringData.settings.settings.compliance.kycStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Transaction Limit:</span>
                          <span className={getTextClass()}>${businessMonitoringData.settings.settings.limits.transactionLimit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Enabled Features:</span>
                          <span className={getTextClass()}>{businessMonitoringData.settings.settings.features.enabledFeatures.length}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No settings data available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={getCardClass()}>
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className={`text-xl font-semibold ${getTextClass()} mb-2`}>Select a Business to Monitor</h3>
                <p className={getSubtextClass()}>Choose a business from the Business Directory to view their detailed monitoring data including team, portfolio, goals, analytics, reports, activity, and settings.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={getCardClass()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={getSubtextClass()}>Total Businesses</p>
                <p className={`text-2xl font-bold ${getTextClass()}`}>{analytics.totalBusinesses}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className={getCardClass()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={getSubtextClass()}>Active Businesses</p>
                <p className={`text-2xl font-bold text-green-400`}>{analytics.activeBusinesses}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className={getCardClass()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={getSubtextClass()}>Avg Team Size</p>
                <p className={`text-2xl font-bold text-purple-400`}>{analytics.avgTeamSize.toFixed(1)}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className={getCardClass()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={getSubtextClass()}>Total Business Value</p>
                <p className={`text-2xl font-bold text-yellow-400`}>${analytics.totalBusinessValue.toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'ai-insights' && (
        <div className={getCardClass()}>
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-xl font-semibold ${getTextClass()} mb-2`}>Business AI Insights</h3>
            <p className={getSubtextClass()}>AI-powered insights and recommendations for business accounts will be displayed here.</p>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${getTextClass()}`}>Notification</h3>
              <button
                onClick={handleNotificationModalClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className={getSubtextClass()}>{notificationMessage}</p>
            <div className="flex justify-end mt-6">
              <button
                onClick={handleNotificationModalClose}
                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 transition-all"
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

export default BusinessManagement
