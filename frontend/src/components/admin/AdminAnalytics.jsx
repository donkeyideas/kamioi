import React from 'react'
import { BarChart3, TrendingUp, Users, MousePointer, ExternalLink, ShoppingBag, Target, Award, Clock, CheckCircle, XCircle, User } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useQuery } from '@tanstack/react-query' // 🚀 PERFORMANCE FIX: Import React Query

const AdminAnalytics = ({ user }) => {
  const { isLightMode } = useTheme()
  
  // 🚀 PERFORMANCE FIX: Use React Query for data fetching and caching
  const { data: analytics, isLoading: loading, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      try {
        // Fetch recommendation click analytics
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const response = await fetch(`${apiBaseUrl}/api/admin/analytics/recommendation-clicks`)
        
        if (response.ok) {
          const result = await response.json()
          return result.data || {
            totalClicks: 0,
            uniqueUsers: 0,
            topProducts: [],
            clickSources: [],
            conversionRates: {},
            timeSeries: []
          }
        } else {
          // Fallback to localStorage data
          const userClicks = JSON.parse(localStorage.getItem('kamioi_recommendation_clicks') || '[]')
          const familyClicks = JSON.parse(localStorage.getItem('kamioi_family_recommendation_clicks') || '[]')
          const businessClicks = JSON.parse(localStorage.getItem('kamioi_business_recommendation_clicks') || '[]')
          
          const allClicks = [...userClicks, ...familyClicks, ...businessClicks]
          
          // Process analytics
          const totalClicks = allClicks.length
          const uniqueUsers = new Set(allClicks.map(click => click.userId)).size
          
          // Top products
          const productCounts = {}
          allClicks.forEach(click => {
            productCounts[click.productId] = (productCounts[click.productId] || 0) + 1
          })
          const topProducts = Object.entries(productCounts)
            .map(([product, count]) => ({ product, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
          
          // Click sources
          const sourceCounts = {}
          allClicks.forEach(click => {
            sourceCounts[click.source] = (sourceCounts[click.source] || 0) + 1
          })
          const clickSources = Object.entries(sourceCounts)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
          
          return {
            totalClicks,
            uniqueUsers,
            topProducts,
            clickSources,
            conversionRates: {
              user: Math.round((userClicks.length / Math.max(totalClicks, 1)) * 100),
              family: Math.round((familyClicks.length / Math.max(totalClicks, 1)) * 100),
              business: Math.round((businessClicks.length / Math.max(totalClicks, 1)) * 100)
            },
            timeSeries: []
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch admin analytics:', error)
        // Return default data on error
        return {
          totalClicks: 0,
          uniqueUsers: 0,
          topProducts: [],
          clickSources: [],
          conversionRates: { user: 0, family: 0, business: 0 },
          timeSeries: []
        }
      }
    },
    staleTime: 300000, // 5 minutes cache
    cacheTime: 600000, // 10 minutes cache
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onSuccess: () => {
      // Dispatch page load completion event for Loading Report
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'analytics' }
      }))
    },
    onError: (error) => {
      // Log error but don't crash the UI
      console.error('❌ AdminAnalytics - Query error:', error)
      // Still dispatch event so loading report knows something happened
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'analytics', error: true }
      }))
    }
  })

  // Dispatch page load completion for cached data (useEffect fallback)
  useEffect(() => {
    if (analytics && !loading) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
          detail: { pageId: 'analytics' }
        }))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [analytics, loading])

  // Default analytics data if query hasn't loaded yet
  const analyticsData = analytics || {
    totalClicks: 0,
    uniqueUsers: 0,
    topProducts: [],
    clickSources: [],
    conversionRates: { user: 0, family: 0, business: 0 },
    timeSeries: []
  }

  const getTextClass = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode ? 'bg-white/80 backdrop-blur-lg border-gray-200' : 'bg-white/10 backdrop-blur-lg border-white/20'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${getTextClass()}`}>Recommendation Analytics</h2>
          <p className={`${getSubtextClass()} mt-1`}>Track user engagement with AI shopping recommendations</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className={`text-sm ${getSubtextClass()}`}>Total Clicks</div>
            <div className={`text-lg font-semibold ${getTextClass()}`}>{analyticsData.totalClicks}</div>
          </div>
          <div className="text-right">
            <div className={`text-sm ${getSubtextClass()}`}>Unique Users</div>
            <div className={`text-lg font-semibold ${getTextClass()}`}>{analyticsData.uniqueUsers}</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${getCardClass()} p-4 rounded-lg border`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${getTextClass()}`}>{analyticsData.totalClicks}</div>
              <div className={`text-sm ${getSubtextClass()}`}>Total Clicks</div>
            </div>
            <MousePointer className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className={`${getCardClass()} p-4 rounded-lg border`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${getTextClass()}`}>{analyticsData.uniqueUsers}</div>
              <div className={`text-sm ${getSubtextClass()}`}>Unique Users</div>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className={`${getCardClass()} p-4 rounded-lg border`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${getTextClass()}`}>{analyticsData.topProducts.length}</div>
              <div className={`text-sm ${getSubtextClass()}`}>Products Tracked</div>
            </div>
            <ShoppingBag className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className={`${getCardClass()} p-4 rounded-lg border`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${getTextClass()}`}>3</div>
              <div className={`text-sm ${getSubtextClass()}`}>Dashboard Sources</div>
            </div>
            <Target className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className={`${getCardClass()} p-6 rounded-lg border`}>
        <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>Top Recommended Products</h3>
        {analyticsData.topProducts.length > 0 ? (
          <div className="space-y-3">
            {analyticsData.topProducts.map((product, index) => (
              <div key={product.product} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 font-semibold text-sm">#{index + 1}</span>
                  </div>
                  <div>
                    <p className={`${getTextClass()} font-medium capitalize`}>{product.product.replace('-', ' ')}</p>
                    <p className={`${getSubtextClass()} text-sm`}>Product Recommendation</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${getTextClass()} font-semibold`}>{product.count} clicks</div>
                  <div className={`${getSubtextClass()} text-sm`}>
                    {Math.round((product.count / Math.max(analyticsData.totalClicks, 1)) * 100)}% of total
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className={`${getSubtextClass()}`}>No recommendation clicks tracked yet</p>
          </div>
        )}
      </div>

      {/* Click Sources */}
      <div className={`${getCardClass()} p-6 rounded-lg border`}>
        <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>Click Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analyticsData.clickSources.map((source) => (
            <div key={source.source} className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className={`${getTextClass()} font-medium capitalize`}>
                    {source.source.replace('-', ' ')} Dashboard
                  </span>
                </div>
                <span className={`${getTextClass()} font-semibold`}>{source.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full" 
                  style={{ width: `${(source.count / Math.max(analyticsData.totalClicks, 1)) * 100}%` }}
                ></div>
              </div>
              <div className={`${getSubtextClass()} text-sm mt-1`}>
                {Math.round((source.count / Math.max(analyticsData.totalClicks, 1)) * 100)}% of total clicks
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Rates */}
      <div className={`${getCardClass()} p-6 rounded-lg border`}>
        <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>Dashboard Conversion Rates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className={`${getTextClass()} font-medium`}>User Dashboard</span>
              <span className={`${getTextClass()} font-semibold`}>{analyticsData.conversionRates.user || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full" 
                style={{ width: `${analyticsData.conversionRates.user || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className={`${getTextClass()} font-medium`}>Family Dashboard</span>
              <span className={`${getTextClass()} font-semibold`}>{analyticsData.conversionRates.family || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full" 
                style={{ width: `${analyticsData.conversionRates.family || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className={`${getTextClass()} font-medium`}>Business Dashboard</span>
              <span className={`${getTextClass()} font-semibold`}>{analyticsData.conversionRates.business || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-400 h-2 rounded-full" 
                style={{ width: `${analyticsData.conversionRates.business || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`${getCardClass()} p-6 rounded-lg border`}>
        <h3 className={`text-lg font-semibold ${getTextClass()} mb-4`}>Recent Recommendation Clicks</h3>
        <div className="space-y-3">
          {analyticsData.topProducts.slice(0, 5).map((product, index) => (
            <div key={product.product} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <ExternalLink className="w-4 h-4 text-blue-400" />
                <div>
                  <p className={`${getTextClass()} font-medium capitalize`}>{product.product.replace('-', ' ')}</p>
                  <p className={`${getSubtextClass()} text-sm`}>Product recommendation clicked</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`${getTextClass()} font-semibold`}>{product.count} clicks</div>
                <div className={`${getSubtextClass()} text-sm`}>Recent activity</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics
