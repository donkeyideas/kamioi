import React, { useState, useEffect } from 'react'
import { ArrowUpRight, TrendingUp, PieChart, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react'
import RechartsChart from '../common/RechartsChart'
import CompanyLogo from '../common/CompanyLogo'
import { useData } from '../../context/DataContext'
import { useTheme } from '../../context/ThemeContext'

const BusinessPortfolio = ({ user }) => {
  const [timeRange, setTimeRange] = useState('1m')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { portfolioValue, holdings: contextHoldings, portfolioStats, transactions } = useData()
  const { isBlackMode, isLightMode } = useTheme()

  // Check if in demo mode
  const isDemoMode = localStorage.getItem('kamioi_demo_mode') === 'true'

  // API-fetched holdings (for non-demo mode)
  const [apiHoldings, setApiHoldings] = useState([])
  const [loading, setLoading] = useState(false)

  // In demo mode, use context data; otherwise use API data
  const holdings = isDemoMode ? (contextHoldings || []) : apiHoldings

  // Pagination logic
  const totalPages = Math.ceil(holdings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentHoldings = holdings.slice(startIndex, endIndex)

  // Fetch portfolio data in non-demo mode
  useEffect(() => {
    if (isDemoMode) return

    const fetchPortfolioData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('kamioi_business_token') ||
                     localStorage.getItem('kamioi_user_token') ||
                     localStorage.getItem('authToken')
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'

        const response = await fetch(`${apiBaseUrl}/api/business/portfolio`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.portfolio) {
            setApiHoldings(result.portfolio.holdings || [])
          }
        }
      } catch (error) {
        console.error('Error fetching business portfolio:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioData()
  }, [isDemoMode])

  // Calculate metrics from holdings
  const calculateMetrics = () => {
    if (!holdings || holdings.length === 0) {
      return { todayGain: 0, todayGainPct: 0, roi: 0, ytdReturn: 0, ytdReturnPct: 0 }
    }

    // In demo mode, use portfolioStats
    if (isDemoMode && portfolioStats) {
      return {
        todayGain: portfolioStats.todayGain || 0,
        todayGainPct: portfolioStats.todayGainPct || 0,
        roi: portfolioStats.gainPercentage || 0,
        ytdReturn: portfolioStats.totalGain || 0,
        ytdReturnPct: portfolioStats.gainPercentage || 0
      }
    }

    // Calculate from holdings
    const totalValue = holdings.reduce((sum, h) => sum + (parseFloat(h.value) || 0), 0)
    const totalCost = holdings.reduce((sum, h) => {
      const shares = parseFloat(h.shares) || 0
      const avgCost = parseFloat(h.avgCost) || parseFloat(h.avg_cost) || 0
      return sum + (shares * avgCost)
    }, 0)

    const todayGain = holdings.reduce((sum, h) => {
      const value = parseFloat(h.value) || 0
      const changePct = parseFloat(h.change) || 0
      return sum + (value * changePct / 100)
    }, 0)
    const todayGainPct = totalValue > 0 ? (todayGain / totalValue) * 100 : 0
    const roi = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100) : 0
    const ytdReturn = totalValue - totalCost

    return { todayGain, todayGainPct, roi, ytdReturn, ytdReturnPct: roi }
  }

  const metrics = calculateMetrics()
  const safePortfolioValue = isDemoMode ? (portfolioValue || 0) : holdings.reduce((sum, h) => sum + (h.value || 0), 0)

  const getCardClass = () => {
    if (isBlackMode) return 'bg-black/20 backdrop-blur-xl border border-white/10'
    if (isLightMode) return 'bg-white/80 backdrop-blur-xl border border-gray-200/50'
    return 'bg-white/10 backdrop-blur-xl border border-white/20'
  }

  const getTextClass = () => {
    if (isLightMode) return 'text-gray-800'
    return 'text-white'
  }

  const getSubtextClass = () => {
    if (isLightMode) return 'text-gray-600'
    return 'text-white/60'
  }

  const getSelectClass = () => {
    if (isLightMode) return 'bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500'
    return 'bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  }

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className={`${getCardClass()} rounded-xl p-6`}>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className={`ml-3 ${getTextClass()}`}>Loading portfolio data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Portfolio Header */}
      <div className={`${getCardClass()} rounded-xl p-6`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${getTextClass()}`}>Business Portfolio</h2>
            <p className={getSubtextClass()}>
              Total value: ${safePortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={getSelectClass()}
            >
              <option value="1d">1D</option>
              <option value="1w">1W</option>
              <option value="1m">1M</option>
              <option value="3m">3M</option>
              <option value="1y">1Y</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <TrendingUp className={`w-8 h-8 ${metrics.todayGain >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              <span className={`text-sm font-medium ${metrics.todayGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.todayGainPct >= 0 ? '+' : ''}{metrics.todayGainPct.toFixed(2)}%
              </span>
            </div>
            <p className={`${getSubtextClass()} text-sm mt-2`}>Today's Gain</p>
            <p className={`${getTextClass()} text-xl font-bold`}>
              {metrics.todayGain >= 0 ? '+' : ''}${Math.abs(metrics.todayGain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className={`${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <PieChart className={`w-8 h-8 ${holdings.length > 0 ? 'text-blue-400' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${holdings.length > 0 ? 'text-blue-400' : 'text-gray-400'}`}>
                {holdings.length} assets
              </span>
            </div>
            <p className={`${getSubtextClass()} text-sm mt-2`}>Diversified</p>
            <p className={`${getTextClass()} text-xl font-bold`}>
              {holdings.length > 0 ? `${metrics.roi >= 0 ? '+' : ''}${metrics.roi.toFixed(2)}% ROI` : 'No investments'}
            </p>
          </div>

          <div className={`${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <DollarSign className={`w-8 h-8 ${safePortfolioValue > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${safePortfolioValue > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                ${safePortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className={`${getSubtextClass()} text-sm mt-2`}>Total Invested</p>
            <p className={`${getTextClass()} text-xl font-bold`}>
              {safePortfolioValue > 0 ? 'Active' : 'Start investing'}
            </p>
          </div>

          <div className={`${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <ArrowUpRight className={`w-8 h-8 ${metrics.ytdReturn >= 0 ? 'text-purple-400' : 'text-red-400'}`} />
              <span className={`text-sm font-medium ${metrics.ytdReturn >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                {metrics.ytdReturnPct >= 0 ? '+' : ''}{metrics.ytdReturnPct.toFixed(2)}%
              </span>
            </div>
            <p className={`${getSubtextClass()} text-sm mt-2`}>Total Return</p>
            <p className={`${getTextClass()} text-xl font-bold`}>
              {metrics.ytdReturn >= 0 ? '+' : ''}${Math.abs(metrics.ytdReturn).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${getCardClass()} rounded-xl p-4`}>
            <h3 className={`text-lg font-bold ${getTextClass()} mb-4`}>Portfolio Performance</h3>
            {safePortfolioValue > 0 ? (
              <RechartsChart
                type="line"
                height={250}
                data={[
                  { name: 'Week 1', value: safePortfolioValue * 0.85 },
                  { name: 'Week 2', value: safePortfolioValue * 0.9 },
                  { name: 'Week 3', value: safePortfolioValue * 0.95 },
                  { name: 'Week 4', value: safePortfolioValue * 0.98 },
                  { name: 'Today', value: safePortfolioValue }
                ]}
                series={[{ dataKey: 'value', name: 'Portfolio Value' }]}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className={`w-16 h-16 ${isLightMode ? 'bg-gray-200' : 'bg-gray-500/20'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className={`${getTextClass()} text-lg font-medium mb-2`}>No performance data yet</h4>
                  <p className={`${getSubtextClass()} text-sm`}>Start investing to see your portfolio performance</p>
                </div>
              </div>
            )}
          </div>

          <div className={`${getCardClass()} rounded-xl p-4`}>
            <h3 className={`text-lg font-bold ${getTextClass()} mb-4`}>Asset Allocation</h3>
            {holdings.length > 0 ? (
              <RechartsChart
                type="donut"
                height={250}
                data={holdings.map(h => ({ name: h.symbol, value: h.allocation }))}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className={`w-16 h-16 ${isLightMode ? 'bg-gray-200' : 'bg-gray-500/20'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <PieChart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className={`${getTextClass()} text-lg font-medium mb-2`}>No investments yet</h4>
                  <p className={`${getSubtextClass()} text-sm`}>Start by uploading receipts to begin round-up investments</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className={`${getCardClass()} rounded-xl p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${getTextClass()}`}>Business Holdings</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isLightMode ? 'border-gray-200' : 'border-white/10'}`}>
                <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Asset</th>
                <th className={`text-right pb-3 ${getSubtextClass()} font-medium`}>Shares</th>
                <th className={`text-right pb-3 ${getSubtextClass()} font-medium`}>Avg Cost</th>
                <th className={`text-right pb-3 ${getSubtextClass()} font-medium`}>Current Price</th>
                <th className={`text-right pb-3 ${getSubtextClass()} font-medium`}>Value</th>
                <th className={`text-right pb-3 ${getSubtextClass()} font-medium`}>Change</th>
                <th className={`text-right pb-3 ${getSubtextClass()} font-medium`}>Allocation</th>
              </tr>
            </thead>
            <tbody>
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className={`w-16 h-16 ${isLightMode ? 'bg-blue-100' : 'bg-blue-500/20'} rounded-full flex items-center justify-center`}>
                        <PieChart className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <h3 className={`${getTextClass()} text-lg font-medium`}>No investments yet</h3>
                        <p className={`${getSubtextClass()} text-sm mt-1`}>
                          Start by uploading receipts to begin round-up investments
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentHoldings.map((holding, index) => (
                  <tr key={index} className={`border-b ${isLightMode ? 'border-gray-100 hover:bg-gray-50' : 'border-white/5 hover:bg-white/5'} transition-colors`}>
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <CompanyLogo
                          symbol={holding.symbol}
                          name={holding.name}
                          size="w-8 h-8"
                        />
                        <div>
                          <p className={`${getTextClass()} font-medium`}>{holding.symbol}</p>
                          <p className={`${getSubtextClass()} text-sm`}>{holding.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`text-right py-4 ${getTextClass()}`}>{holding.shares?.toFixed(4) || '0.0000'}</td>
                    <td className={`text-right py-4 ${getTextClass()}`}>${holding.avgCost?.toFixed(2) || '0.00'}</td>
                    <td className={`text-right py-4 ${getTextClass()}`}>${holding.currentPrice?.toFixed(2) || '0.00'}</td>
                    <td className={`text-right py-4 ${getTextClass()}`}>${holding.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
                    <td className={`text-right py-4 font-medium ${(holding.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(holding.change || 0) >= 0 ? '+' : ''}{holding.change?.toFixed(2) || '0.00'}%
                    </td>
                    <td className={`text-right py-4 ${getTextClass()}`}>{holding.allocation?.toFixed(2) || '0.00'}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {holdings.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6">
            <div className={`text-sm ${getSubtextClass()}`}>
              Showing {startIndex + 1} to {Math.min(endIndex, holdings.length)} of {holdings.length} holdings
            </div>
            <div className="flex items-center space-x-2">
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
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className={`${getCardClass()} rounded-xl p-4 text-left hover:scale-105 transition-all duration-200`}>
          <div className={`w-10 h-10 ${isLightMode ? 'bg-blue-100' : 'bg-blue-500/20'} rounded-lg flex items-center justify-center mb-3`}>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h4 className={`font-medium ${getTextClass()} mb-1`}>Auto-Invest</h4>
          <p className={`${getSubtextClass()} text-sm`}>Set up recurring investments</p>
        </button>

        <button className={`${getCardClass()} rounded-xl p-4 text-left hover:scale-105 transition-all duration-200`}>
          <div className={`w-10 h-10 ${isLightMode ? 'bg-green-100' : 'bg-green-500/20'} rounded-lg flex items-center justify-center mb-3`}>
            <PieChart className="w-5 h-5 text-green-400" />
          </div>
          <h4 className={`font-medium ${getTextClass()} mb-1`}>Rebalance</h4>
          <p className={`${getSubtextClass()} text-sm`}>Optimize your portfolio</p>
        </button>

        <button className={`${getCardClass()} rounded-xl p-4 text-left hover:scale-105 transition-all duration-200`}>
          <div className={`w-10 h-10 ${isLightMode ? 'bg-purple-100' : 'bg-purple-500/20'} rounded-lg flex items-center justify-center mb-3`}>
            <DollarSign className="w-5 h-5 text-purple-400" />
          </div>
          <h4 className={`font-medium ${getTextClass()} mb-1`}>Withdraw</h4>
          <p className={`${getSubtextClass()} text-sm`}>Access your funds</p>
        </button>
      </div>
    </div>
  )
}

export default BusinessPortfolio
