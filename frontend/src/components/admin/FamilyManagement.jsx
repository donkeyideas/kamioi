import React, { useState, useEffect } from 'react'
import { 
  Users, Search, Filter, Download, Mail, Eye, UserCheck, UserX, 
  RefreshCw, TrendingUp, AlertTriangle, CheckCircle, XCircle, Star,
  DollarSign, Activity, MapPin, Calendar, Phone, Shield, Zap, Award,
  Target, BarChart3, Brain, Clock, FileText, MessageSquare, Settings,
  Home, Heart, UserPlus, UserMinus, Crown, Baby, GraduationCap, X
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query' // 🚀 PERFORMANCE FIX: Import React Query

const FamilyManagement = () => {
  const [activeTab, setActiveTab] = useState('directory')
  const queryClient = useQueryClient() // 🚀 PERFORMANCE FIX: For cache invalidation
  const { isLightMode } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedFamily, setSelectedFamily] = useState(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [familyMonitoringData, setFamilyMonitoringData] = useState({
    members: null,
    portfolio: null,
    goals: null,
    aiInsights: null,
    analytics: null,
    activity: null,
    notifications: null
  })

  // Families data - load from localStorage
  const [families, setFamilies] = useState([])
  const [analytics, setAnalytics] = useState({
    totalFamilies: 0,
    activeFamilies: 0,
    avgFamilySize: 0,
    totalFamilyValue: 0,
    avgFamilyGoals: 0,
    highEngagementFamilies: 0
  })

  // Load families data from localStorage
  useEffect(() => {
    loadFamilies()
    // Dispatch page load completion event with small delay
    const timer = setTimeout(() => {
      console.log('📊 FamilyManagement - Dispatching admin-page-load-complete for families')
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'families' }
      }))
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const loadFamilies = () => {
    try {
      // Note: loadingFamilyData is now managed by React Query
      
      // Get family users from localStorage
      const familyUsers = JSON.parse(localStorage.getItem('kamioi_family_users') || '[]')
      
      // Also check for current user if they're a family user
      const currentUser = JSON.parse(localStorage.getItem('kamioi_user') || 'null')
      if (currentUser && currentUser.accountType === 'family' && !familyUsers.find(f => f.id === currentUser.id)) {
        familyUsers.push(currentUser)
      }
      
      setFamilies(familyUsers)
      
      // Calculate analytics from actual data
      const totalFamilies = familyUsers.length
      const activeFamilies = familyUsers.filter(f => f.status === 'Active' || !f.status).length
      const avgFamilySize = familyUsers.length > 0 ? 
        familyUsers.reduce((sum, f) => sum + (f.children?.length || 0) + 1, 0) / familyUsers.length : 0
      const totalFamilyValue = familyUsers.reduce((sum, f) => sum + (f.totalPortfolioValue || 0), 0)
      
      setAnalytics({
        totalFamilies,
        activeFamilies,
        avgFamilySize,
        totalFamilyValue,
        avgFamilyGoals: 0, // Would need goals data
        highEngagementFamilies: 0 // Would need engagement data
      })
    } catch (error) {
      console.error('Error loading families:', error)
      setFamilies([])
    }
  }

  const filteredFamilies = families.filter(family => {
    const matchesSearch = family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         family.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         family.primaryContact.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || family.status.toLowerCase() === statusFilter.toLowerCase()
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

  // 🚀 PERFORMANCE FIX: Use React Query for family monitoring data - proper caching, no unnecessary reloads
  const { data: familyMonitoringQueryData, isLoading: isLoadingFamilyMonitoring, error: familyMonitoringError, refetch: refetchFamilyMonitoring } = useQuery({
    queryKey: ['family-monitoring', selectedFamily?.id],
    queryFn: async () => {
      if (!selectedFamily?.id) {
        return {
          members: null,
          portfolio: null,
          goals: null,
          aiInsights: null,
          analytics: null,
          activity: null,
          notifications: null
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
        console.warn('⚠️ FamilyManagement - No authentication token available, returning empty data')
        return {
          members: null,
          portfolio: null,
          goals: null,
          aiInsights: null,
          analytics: null,
          activity: null,
          notifications: null
        }
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const headers = { 'Authorization': `Bearer ${token}` }
      
      // Fetch all data in parallel
      const [membersRes, portfolioRes, goalsRes, aiRes, analyticsRes, activityRes, notificationsRes] = await Promise.allSettled([
        fetch(`${apiBaseUrl}/api/admin/families/${selectedFamily.id}/members`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/families/${selectedFamily.id}/portfolio`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/families/${selectedFamily.id}/goals`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/families/${selectedFamily.id}/ai-insights`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/families/${selectedFamily.id}/analytics`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/families/${selectedFamily.id}/activity`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/families/${selectedFamily.id}/notifications`, { headers })
      ])

      const membersData = membersRes.status === 'fulfilled' && membersRes.value.ok
        ? await membersRes.value.json()
        : null
      const portfolioData = portfolioRes.status === 'fulfilled' && portfolioRes.value.ok
        ? await portfolioRes.value.json()
        : null
      const goalsData = goalsRes.status === 'fulfilled' && goalsRes.value.ok
        ? await goalsRes.value.json()
        : null
      const aiData = aiRes.status === 'fulfilled' && aiRes.value.ok
        ? await aiRes.value.json()
        : null
      const analyticsData = analyticsRes.status === 'fulfilled' && analyticsRes.value.ok
        ? await analyticsRes.value.json()
        : null
      const activityData = activityRes.status === 'fulfilled' && activityRes.value.ok
        ? await activityRes.value.json()
        : null
      const notificationsData = notificationsRes.status === 'fulfilled' && notificationsRes.value.ok
        ? await notificationsRes.value.json()
        : null

      return {
        members: membersData?.data || null,
        portfolio: portfolioData?.data || null,
        goals: goalsData?.data || null,
        aiInsights: aiData?.data || null,
        analytics: analyticsData?.data || null,
        activity: activityData?.data || null,
        notifications: notificationsData?.data || null
      }
    },
    enabled: !!selectedFamily?.id, // Only fetch when a family is selected
    staleTime: 300000, // 🚀 FIX: 5 minutes - data is fresh for 5 minutes
    gcTime: 600000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false, // 🚀 FIX: Don't refetch on window focus
    refetchOnMount: false, // 🚀 FIX: Don't refetch on mount if data is fresh
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data) => {
      // Update local state from React Query cache
      if (data) {
        setFamilyMonitoringData(data)
      }
    }
  })
  
  // 🚀 PERFORMANCE FIX: Map React Query loading to component loading state for backward compatibility
  const loadingFamilyData = isLoadingFamilyMonitoring
  
  // Update local state when React Query data changes
  useEffect(() => {
    if (familyMonitoringQueryData) {
      setFamilyMonitoringData(familyMonitoringQueryData)
    }
  }, [familyMonitoringQueryData])
  
  // 🚀 PERFORMANCE FIX: Wrapper function for backward compatibility
  const fetchFamilyMonitoringData = async (familyId) => {
    // React Query handles caching automatically - just trigger a refetch
    await refetchFamilyMonitoring()
  }

  const handleViewFamilyDetails = (family) => {
    setSelectedFamily(family)
    fetchFamilyMonitoringData(family.id)
  }

  // Button handlers
  const handleExport = () => {
    const headers = ['ID', 'Family Name', 'Admin Email', 'Status', 'Members', 'Portfolio Value', 'Goals', 'Engagement Score', 'Created Date']
    const csvContent = [
      headers.join(','),
      ...families.map(family => [
        family.id,
        `"${family.name}"`,
        `"${family.adminEmail}"`,
        family.status,
        family.memberCount,
        family.portfolioValue,
        family.goalCount,
        family.engagementScore,
        family.createdDate
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'families_export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleBulkActions = () => {
    displayNotificationModal('Bulk actions functionality would be implemented here', 'info')
  }

  const handleViewFamily = (family) => {
    displayNotificationModal(`Viewing family: ${family.name}`, 'info')
  }

  const handleImpersonateFamily = (family) => {
    displayNotificationModal(`Impersonating family: ${family.name}`, 'info')
  }

  const handleToggleFamilyStatus = (family) => {
    displayNotificationModal(`Toggling status for family: ${family.name}`, 'info')
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
          <h1 className={`text-3xl font-bold ${getTextClass()}`}>Family Management</h1>
          <p className={getSubtextClass()}>Monitor and manage family accounts across the platform</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={loadFamilies}
            className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg px-4 py-2 text-purple-400 flex items-center space-x-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Families</span>
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
          { id: 'directory', label: 'Family Directory', icon: Users },
          { id: 'monitoring', label: 'Family Monitoring', icon: Eye },
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

      {/* Family Directory Tab */}
      {activeTab === 'directory' && (
        <div className={getCardClass()}>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search families by name, ID, or admin email..."
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

          {/* Families Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Family Profile</th>
                  <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Members</th>
                  <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Financial</th>
                  <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Engagement</th>
                  <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Status</th>
                  <th className={`text-right pb-3 ${getSubtextClass()} font-medium`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFamilies.map(family => (
                  <tr key={family.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          <Home className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`font-medium ${getTextClass()}`}>
                            {family.name || 'Unknown Family'}
                          </p>
                          <p className={`text-sm ${getSubtextClass()}`}>
                            {family.primaryContact || 'No contact'}
                          </p>
                          <p className={`text-xs ${getSubtextClass()}`}>
                            {family.id || 'No ID'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <div>
                          <span className={`text-sm ${getTextClass()}`}>
                            {family.members || 0} members
                          </span>
                          <p className={`text-xs ${getSubtextClass()}`}>
                            {family.adults || 0} adults, {family.children || 0} children
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className={`font-medium ${getTextClass()}`}>
                          ${(family.totalPortfolio || 0).toFixed(2)}
                        </p>
                        <p className={`text-sm ${getSubtextClass()}`}>
                          {family.goalCount || 0} goals
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          {(family.monthlyGrowth || 0) >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          ) : (
                            <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                          )}
                          <span className={`text-xs ${(family.monthlyGrowth || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(family.monthlyGrowth || 0) > 0 ? '+' : ''}{family.monthlyGrowth || 0}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          (family.engagementScore || 0) >= 80 ? 'bg-green-400' :
                          (family.engagementScore || 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        <div>
                          <span className={`text-sm ${getTextClass()}`}>
                            Engagement: {family.engagementScore || 0}
                          </span>
                          <p className={`text-xs ${getSubtextClass()}`}>
                            {family.lastActivity || 'Unknown'} ago
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(family.status)}`}>
                        {family.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewFamilyDetails(family)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button 
                          onClick={() => handleImpersonateFamily(family)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
                          title="Impersonate"
                        >
                          <UserCheck className="w-4 h-4 text-green-400" />
                        </button>
                        {family.status === 'Active' ? (
                          <button 
                            onClick={() => handleToggleFamilyStatus(family)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
                            title="Suspend"
                          >
                            <UserX className="w-4 h-4 text-red-400" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggleFamilyStatus(family)}
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

      {/* Family Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {selectedFamily ? (
            <div className="space-y-6">
              {/* Selected Family Header */}
              <div className={getCardClass()}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      <Home className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold ${getTextClass()}`}>{selectedFamily.name}</h3>
                      <p className={getSubtextClass()}>{selectedFamily.adminEmail} • {selectedFamily.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFamily(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {loadingFamilyData ? (
                <div className={getCardClass()}>
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                    <span className={`ml-3 ${getTextClass()}`}>Loading family data...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Members Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <Users className="w-5 h-5 text-blue-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Members</h4>
                    </div>
                    {familyMonitoringData.members ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Members:</span>
                          <span className={getTextClass()}>{familyMonitoringData.members.totalMembers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Active Members:</span>
                          <span className="text-green-400">{familyMonitoringData.members.activeMembers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Pending Invites:</span>
                          <span className="text-yellow-400">{familyMonitoringData.members.pendingInvites}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Admins:</span>
                          <span className={getTextClass()}>{familyMonitoringData.members.familyRoles.admin}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Children:</span>
                          <span className={getTextClass()}>{familyMonitoringData.members.familyRoles.child}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No members data available</p>
                    )}
                  </div>

                  {/* Portfolio Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Portfolio</h4>
                    </div>
                    {familyMonitoringData.portfolio ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Portfolio Value:</span>
                          <span className={getTextClass()}>${familyMonitoringData.portfolio.portfolio.value}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Holdings:</span>
                          <span className={getTextClass()}>{familyMonitoringData.portfolio.portfolio.totalHoldings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Stocks:</span>
                          <span className={getTextClass()}>{familyMonitoringData.portfolio.portfolio.diversification.stocks}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Bonds:</span>
                          <span className={getTextClass()}>{familyMonitoringData.portfolio.portfolio.diversification.bonds}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Shared Goals:</span>
                          <span className={getTextClass()}>{familyMonitoringData.portfolio.portfolio.sharedGoals.length}</span>
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
                    {familyMonitoringData.goals ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Goals:</span>
                          <span className={getTextClass()}>{familyMonitoringData.goals.totalGoals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Completed:</span>
                          <span className="text-green-400">{familyMonitoringData.goals.completedGoals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>In Progress:</span>
                          <span className="text-yellow-400">{familyMonitoringData.goals.inProgressGoals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Shared Goals:</span>
                          <span className={getTextClass()}>{familyMonitoringData.goals.sharedGoals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Target Amount:</span>
                          <span className={getTextClass()}>${familyMonitoringData.goals.totalTargetAmount}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No goals data available</p>
                    )}
                  </div>

                  {/* AI Insights Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <Brain className="w-5 h-5 text-orange-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>AI Insights</h4>
                    </div>
                    {familyMonitoringData.aiInsights ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Portfolio Health:</span>
                          <span className={getTextClass()}>{familyMonitoringData.aiInsights.aiInsights.familyPortfolioHealth}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Risk Level:</span>
                          <span className={getTextClass()}>{familyMonitoringData.aiInsights.aiInsights.riskLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Recommendations:</span>
                          <span className={getTextClass()}>{familyMonitoringData.aiInsights.totalRecommendations}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Family Consensus:</span>
                          <span className={getTextClass()}>{familyMonitoringData.aiInsights.familyConsensus}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Accepted:</span>
                          <span className="text-green-400">{familyMonitoringData.aiInsights.acceptedRecommendations}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No AI insights data available</p>
                    )}
                  </div>

                  {/* Analytics Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-indigo-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Analytics</h4>
                    </div>
                    {familyMonitoringData.analytics ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Value:</span>
                          <span className={getTextClass()}>${familyMonitoringData.analytics.analytics.totalValue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Monthly Growth:</span>
                          <span className={getTextClass()}>{familyMonitoringData.analytics.analytics.monthlyGrowth}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Transactions:</span>
                          <span className={getTextClass()}>{familyMonitoringData.analytics.analytics.transactions.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Most Active Member:</span>
                          <span className={getTextClass()}>{familyMonitoringData.analytics.analytics.memberActivity.mostActive || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Avg Activity:</span>
                          <span className={getTextClass()}>{familyMonitoringData.analytics.analytics.memberActivity.avgActivity}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No analytics data available</p>
                    )}
                  </div>

                  {/* Activity Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <Activity className="w-5 h-5 text-pink-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Activity</h4>
                    </div>
                    {familyMonitoringData.activity ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Last Login:</span>
                          <span className={getTextClass()}>{familyMonitoringData.activity.activity.lastLogin || 'Never'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Logins:</span>
                          <span className={getTextClass()}>{familyMonitoringData.activity.activity.totalLogins}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Avg Session Duration:</span>
                          <span className={getTextClass()}>{familyMonitoringData.activity.activity.avgSessionDuration}min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Engagement Score:</span>
                          <span className={getTextClass()}>{familyMonitoringData.activity.activity.engagementScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Shared Activities:</span>
                          <span className={getTextClass()}>{familyMonitoringData.activity.activity.sharedActivities}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No activity data available</p>
                    )}
                  </div>

                  {/* Notifications Monitoring */}
                  <div className={getCardClass()}>
                    <div className="flex items-center space-x-2 mb-4">
                      <MessageSquare className="w-5 h-5 text-cyan-400" />
                      <h4 className={`text-lg font-semibold ${getTextClass()}`}>Notifications</h4>
                    </div>
                    {familyMonitoringData.notifications ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Total Notifications:</span>
                          <span className={getTextClass()}>{familyMonitoringData.notifications.totalNotifications}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Unread:</span>
                          <span className="text-yellow-400">{familyMonitoringData.notifications.unreadNotifications}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Transaction Alerts:</span>
                          <span className={getTextClass()}>{familyMonitoringData.notifications.notificationTypes.transaction}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>Goal Updates:</span>
                          <span className={getTextClass()}>{familyMonitoringData.notifications.notificationTypes.goal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={getSubtextClass()}>AI Recommendations:</span>
                          <span className={getTextClass()}>{familyMonitoringData.notifications.notificationTypes.ai}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={getSubtextClass()}>No notifications data available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={getCardClass()}>
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className={`text-xl font-semibold ${getTextClass()} mb-2`}>Select a Family to Monitor</h3>
                <p className={getSubtextClass()}>Choose a family from the Family Directory to view their detailed monitoring data including members, portfolio, goals, AI insights, analytics, activity, and notifications.</p>
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
                <p className={getSubtextClass()}>Total Families</p>
                <p className={`text-2xl font-bold ${getTextClass()}`}>{analytics.totalFamilies}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className={getCardClass()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={getSubtextClass()}>Active Families</p>
                <p className={`text-2xl font-bold text-green-400`}>{analytics.activeFamilies}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className={getCardClass()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={getSubtextClass()}>Avg Family Size</p>
                <p className={`text-2xl font-bold text-purple-400`}>{analytics.avgFamilySize.toFixed(1)}</p>
              </div>
              <Heart className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className={getCardClass()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={getSubtextClass()}>Total Family Value</p>
                <p className={`text-2xl font-bold text-yellow-400`}>${analytics.totalFamilyValue.toFixed(0)}</p>
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
            <h3 className={`text-xl font-semibold ${getTextClass()} mb-2`}>Family AI Insights</h3>
            <p className={getSubtextClass()}>AI-powered insights and recommendations for family accounts will be displayed here.</p>
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

export default FamilyManagement
