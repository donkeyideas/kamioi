import React from 'react'
import { Building, Activity, DollarSign, TrendingUp, Users, CheckCircle, Trash2, Settings, BarChart3, User } from 'lucide-react'
import RechartsChart from '../common/RechartsChart'
import { useTheme } from '../../context/ThemeContext'
import { useData } from '../../context/DataContext'
import { useNotifications } from '../../hooks/useNotifications'
import { useQuery } from '@tanstack/react-query'

// 🚀 PERFORMANCE FIX: Removed frontend data transformations
// All data transformations now happen on the backend

const generateDefaultUserGrowth = () => {
  const now = new Date()
  const months = []
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: d.toLocaleString('default', { month: 'short' }),
      users: 0
    })
  }
  return months
}

const AdminOverview = ({ user }) => {
  const { addNotification } = useNotifications()
  const { clearAllData } = useData()
  const { isLightMode, isDarkMode, isCloudMode } = useTheme()
  
  // 🚀 PERFORMANCE FIX: Single aggregated endpoint - all calculations done on backend
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      // Get token - no retry delays (token should be available from AuthContext)
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('admin_token_3') || localStorage.getItem('authToken')
      
      if (!token) {
        // Don't throw error immediately - return empty data instead to prevent UI crash
        // Only log warning in development mode to reduce noise
        if (import.meta.env.DEV) {
          console.warn('⚠️ AdminOverview - No authentication token available, returning empty data')
        }
        // Return empty data - onSuccess will still be called to dispatch completion event
        return {
          stats: {
            totalTransactions: 0,
            totalRevenue: 0,
            totalRoundUps: 0,
            portfolioValue: 0
          },
          userGrowth: generateDefaultUserGrowth(),
          recentActivity: [],
          systemStatus: {
            active_users: 0,
            server_load: 'low',
            status: 'operational',
            uptime: '100%',
            mapped_transactions: 0
          }
        }
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      
      // 🚀 PERFORMANCE FIX: Use aggregated endpoint - all data pre-calculated on backend
      const response = await fetch(`${apiBaseUrl}/api/admin/dashboard/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success) {
        // Backend provides all data in correct format - no frontend processing needed
        return result.data
      } else {
        throw new Error(result.error || 'Failed to fetch overview data')
      }
    },
    staleTime: 0, // Always refetch - no cache
    cacheTime: 0, // No cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2, // 🚀 FIX: Retry up to 2 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onSuccess: () => {
      // Dispatch page load completion event for Loading Report
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'overview' }
      }))
    },
    onError: (error) => {
      // Log error but don't crash the UI
      console.error('❌ AdminOverview - Query error:', error)
      // Still dispatch event so loading report knows something happened
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'overview', error: true }
      }))
    }
  })

  // Dispatch page load completion for cached data (useEffect fallback)
  useEffect(() => {
    if (data && !isLoading) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
          detail: { pageId: 'overview' }
        }))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [data, isLoading])

  // 🚀 PERFORMANCE FIX: All data pre-calculated by backend - no frontend processing
  const stats = data?.stats || {
    totalTransactions: 0,
    totalRevenue: 0,
    totalRoundUps: 0,
    portfolioValue: 0
  }
  
  const userGrowthData = data?.userGrowth || []
  const recentActivity = data?.recentActivity || []
  const systemStatus = data?.systemStatus || {
    active_users: 0,
    server_load: 'low',
    status: 'operational',
    uptime: '100%',
    mapped_transactions: 0
  }
  
  // 🚀 PERFORMANCE FIX: Stats array - all values pre-calculated by backend
  const statsArray = [
    {
      label: 'Total Transactions',
      value: stats.totalTransactions.toString(),
      change: `${stats.totalTransactions > 0 ? '+' : ''}${stats.totalTransactions}`,
      changeLabel: 'total',
      icon: Activity,
      color: 'text-blue-400'
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      change: `${stats.totalRevenue > 0 ? '+' : ''}$${stats.totalRevenue.toFixed(2)}`,
      changeLabel: 'from revenue accounts',
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      label: 'Total Round-ups',
      value: `$${stats.totalRoundUps.toFixed(2)}`,
      change: `${stats.totalRoundUps > 0 ? '+' : ''}$${stats.totalRoundUps.toFixed(2)}`,
      changeLabel: 'invested',
      icon: TrendingUp,
      color: 'text-purple-400'
    },
    {
      label: 'Portfolio Value',
      value: `$${stats.portfolioValue.toFixed(2)}`,
      change: `${stats.portfolioValue > 0 ? '+' : ''}$${stats.portfolioValue.toFixed(2)}`,
      changeLabel: 'current value',
      icon: CheckCircle,
      color: 'text-yellow-400'
    }
  ]
  
  // 🚀 PERFORMANCE FIX: Revenue trend - backend should provide this, fallback for now
  const revenueTrend = data?.revenueTrend || {
    current_month: stats.totalRevenue,
    growth_percentage: stats.totalRevenue > 0 ? 100 : 0,
    previous_month: 0,
    trend: stats.totalRevenue > 0 ? 'growing' : 'stable',
    weekData: [0, 0, 0, 0, stats.totalRevenue] // Backend should calculate this
  }

  const getTextClass = () => {
    if (isLightMode) return 'text-gray-800'
    return 'text-white'
  }

  const getSubtextClass = () => {
    if (isLightMode) return 'text-gray-600'
    return 'text-white/90'
  }

  const getCardClass = () => {
    if (isLightMode) return 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
    return 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'
  }

  const getIconBgClass = () => {
    if (isLightMode) return 'p-3 rounded-full bg-gray-100'
    return 'p-3 rounded-full bg-white/10'
  }

  // 🚀 PERFORMANCE FIX: Loading state - show skeleton while data loads
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }
  
  // 🚀 PERFORMANCE FIX: Error state - show warning but don't block UI
  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className={`${isLightMode ? 'text-yellow-600' : 'text-yellow-400'} mb-2`}>
              ⚠️ Unable to load dashboard data
            </p>
            <p className={`${isLightMode ? 'text-gray-600' : 'text-gray-400'} text-sm mb-4`}>
              {error.message || 'Please check your connection and try again'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className={`px-4 py-2 rounded-lg ${
                isLightMode
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
              } transition-all`}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // If we have data (even if there was an error), show it
  // This handles the case where token was missing but we returned empty data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${getTextClass()} mb-2`}>Platform Overview</h1>
          <p className={getSubtextClass()}>Welcome back, {user?.name}! Here's your platform status</p>
        </div>
        <button 
          onClick={() => {
            if (window.confirm('⚠️ SYSTEM RESET: This will clear ALL data from User, Family, and Admin dashboards. Are you sure?')) {
              clearAllData()
              addNotification({
                type: 'success',
                title: 'System Reset Complete',
                message: '✅ System reset complete! All data has been cleared.',
                timestamp: new Date()
              })
            }
          }}
          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 flex items-center space-x-2 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          <span>System Reset</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsArray.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className={getCardClass()}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>{stat.label}</p>
                  <p className={`text-2xl font-bold ${getTextClass()} mt-1`}>{stat.value}</p>
                  <p className={'text-sm mt-1 ' + stat.color}>{stat.change} {stat.changeLabel}</p>
                </div>
                <div className={`${getIconBgClass()} ${stat.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className={getCardClass()}>
          <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>User Growth</h3>
          {userGrowthData && userGrowthData.length > 0 ? (
            <RechartsChart 
              type="line" 
              height={250}
              data={userGrowthData}
              lineKey="value"
              xAxisKey="name"
            />
          ) : (
            <div className="flex items-center justify-center h-[250px]">
              <div className="text-center">
                <p className={`${getSubtextClass()} mb-2`}>No user growth data available</p>
                <p className={`${getSubtextClass()} text-sm`}>Data will appear here once users are registered</p>
              </div>
            </div>
          )}
        </div>

        <div className={getCardClass()}>
          <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Revenue Trend</h3>
          <RechartsChart 
            type="line" 
            height={250}
            data={[
              { name: 'Week 1', value: revenueTrend.weekData[0] },
              { name: 'Week 2', value: revenueTrend.weekData[1] },
              { name: 'Week 3', value: revenueTrend.weekData[2] },
              { name: 'Week 4', value: revenueTrend.weekData[3] },
              { name: 'Today', value: revenueTrend.weekData[4] }
            ]}
            series={[{ dataKey: 'value', name: 'Revenue ($)' }]}
          />
        </div>
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className={getCardClass()}>
          <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
              <div key={activity.id} className={`flex items-center justify-between p-3 ${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg`}>
                <div>
                  <p className={`${getTextClass()} font-medium`}>{activity.description}</p>
                  <p className={`${getSubtextClass()} text-sm`}>{activity.timestamp}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'user' ? 'bg-blue-400' :
                  activity.type === 'transaction' ? 'bg-green-400' : 'bg-purple-400'
                }`}></div>
              </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        <div className={getCardClass()}>
          <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>System Status</h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 ${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg`}>
              <div>
                <p className={`${getTextClass()} font-medium`}>Backend Server</p>
                <p className={`${getSubtextClass()} text-sm`}>Uptime: {systemStatus.uptime}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-sm text-green-400">
                  {systemStatus.status}
                </span>
              </div>
            </div>
            
            <div className={`flex items-center justify-between p-3 ${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg`}>
              <div>
                <p className={`${getTextClass()} font-medium`}>Database</p>
                <p className={`${getSubtextClass()} text-sm`}>Active users: {systemStatus.active_users}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-sm text-green-400">
                  healthy
                </span>
              </div>
            </div>
            
            <div className={`flex items-center justify-between p-3 ${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg`}>
              <div>
                <p className={`${getTextClass()} font-medium`}>Mapped Transactions</p>
                <p className={`${getSubtextClass()} text-sm`}>Ready for investment: {systemStatus.mapped_transactions}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-sm text-green-400">
                  {systemStatus.mapped_transactions > 0 ? 'active' : 'idle'}
                </span>
              </div>
            </div>
            
            <div className={`flex items-center justify-between p-3 ${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg`}>
              <div>
                <p className={`${getTextClass()} font-medium`}>API Services</p>
                <p className={`${getSubtextClass()} text-sm`}>Load: {systemStatus.server_load}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-sm text-green-400">
                  operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={getCardClass()}>
        <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => addNotification({
              type: 'info',
              title: 'User Management',
              message: 'User Management - Navigate to user management',
              timestamp: new Date()
            })}
            className="glass-card p-4 text-left hover:transform hover:scale-105 transition-all duration-200"
          >
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="font-medium text-white mb-1">Manage Users</h4>
            <p className="text-gray-400 text-sm">View and manage platform users</p>
          </button>
          
          <button
            onClick={() => addNotification({
              type: 'info',
              title: 'Financial Analytics',
              message: 'Financial Analytics - Navigate to financial analytics',
              timestamp: new Date()
            })}
            className="glass-card p-4 text-left hover:transform hover:scale-105 transition-all duration-200"
          >
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <h4 className="font-medium text-white mb-1">Financial Analytics</h4>
            <p className="text-gray-400 text-sm">View revenue and financial metrics</p>
          </button>
          
          <button
            onClick={() => addNotification({
              type: 'info',
              title: 'System Settings',
              message: 'System Settings - Navigate to system settings',
              timestamp: new Date()
            })}
            className="glass-card p-4 text-left hover:transform hover:scale-105 transition-all duration-200"
          >
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="font-medium text-white mb-1">System Settings</h4>
            <p className="text-gray-400 text-sm">Configure platform settings</p>
          </button>
        </div>
      </div>

    </div>
  )
}

export default AdminOverview
