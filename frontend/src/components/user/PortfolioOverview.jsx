import React, { useState } from 'react'
import { ArrowUpRight, TrendingUp, PieChart, DollarSign, MoreVertical, ChevronLeft, ChevronRight, X } from 'lucide-react'
import RechartsChart from '../common/RechartsChart'
import UserAnalytics from './UserAnalytics'
import CompanyLogo from '../common/CompanyLogo'
import { useData } from '../../context/DataContext'
import { useTheme } from '../../context/ThemeContext'

// Helper function to get month/year labels for chart
const getChartLabels = () => {
  const now = new Date()
  const labels = []
  for (let i = 4; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = date.toLocaleString('default', { month: 'short' })
    const year = date.getFullYear()
    labels.push(`${month} ${year}`)
  }
  return labels
}

const PortfolioOverview = () => {
  const [timeRange, setTimeRange] = useState('1m')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showViewAllModal, setShowViewAllModal] = useState(false)
  const [showPortfolioActionsModal, setShowPortfolioActionsModal] = useState(false)
  const [selectedHolding, setSelectedHolding] = useState(null)
  const itemsPerPage = 10
  const { portfolioValue, holdings, portfolioStats } = useData()
  const { isLightMode } = useTheme()

  // Pagination logic - Safe array access
  const safeHoldings = holdings || []
  const totalPages = Math.ceil(safeHoldings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentHoldings = safeHoldings.slice(startIndex, endIndex)

  // Calculate actual portfolio metrics from holdings data
  const calculateMetrics = () => {
    if (!safeHoldings || safeHoldings.length === 0) {
      return { todayGain: 0, todayGainPct: 0, roi: 0, ytdReturn: 0, ytdReturnPct: 0 }
    }

    // Calculate totals from holdings
    const totalValue = safeHoldings.reduce((sum, h) => sum + (parseFloat(h.value) || 0), 0)
    const totalCost = safeHoldings.reduce((sum, h) => {
      const shares = parseFloat(h.shares) || 0
      const avgCost = parseFloat(h.avgCost) || parseFloat(h.avg_cost) || 0
      return sum + (shares * avgCost)
    }, 0)

    // Calculate today's gain (using change percentage from each holding)
    const todayGain = safeHoldings.reduce((sum, h) => {
      const value = parseFloat(h.value) || 0
      const changePct = parseFloat(h.change) || 0
      return sum + (value * changePct / 100)
    }, 0)
    const todayGainPct = totalValue > 0 ? (todayGain / totalValue) * 100 : 0

    // Calculate ROI
    const roi = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100) : 0

    // YTD return - use same as ROI for now (simplified)
    const ytdReturn = totalValue - totalCost
    const ytdReturnPct = roi

    return { todayGain, todayGainPct, roi, ytdReturn, ytdReturnPct }
  }

  const metrics = calculateMetrics()

  const getSelectClass = () => {
    if (isLightMode) return 'bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500'
    return 'bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  }

  if (showAnalytics) {
    return <UserAnalytics onBack={() => setShowAnalytics(false)} />
  }

  return (
    <div className="space-y-6" data-tutorial="portfolio-section">
      {/* Portfolio Header */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Portfolio Overview</h2>
            <p className="text-gray-300">Total value: ${(portfolioValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
            <button 
              onClick={() => setShowAnalytics(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
            >
              View Analytics
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className={`w-8 h-8 ${metrics.todayGain >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              <span className={`text-sm font-medium ${metrics.todayGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.todayGainPct >= 0 ? '+' : ''}{metrics.todayGainPct.toFixed(2)}%
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Today&apos;s Gain</p>
            <p className="text-white text-xl font-bold">
              {metrics.todayGain >= 0 ? '+' : ''}${Math.abs(metrics.todayGain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <PieChart className={`w-8 h-8 ${safeHoldings.length > 0 ? 'text-blue-400' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${safeHoldings.length > 0 ? 'text-blue-400' : 'text-gray-400'}`}>
                {safeHoldings.length} assets
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Diversified</p>
            <p className="text-white text-xl font-bold">
              {safeHoldings.length > 0 ? `${metrics.roi >= 0 ? '+' : ''}${metrics.roi.toFixed(2)}% ROI` : 'No investments'}
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <DollarSign className={`w-8 h-8 ${portfolioStats?.totalCost > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${portfolioStats?.totalCost > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {safeHoldings.length} assets
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Total Invested</p>
            <p className="text-white text-xl font-bold">
              ${(portfolioStats?.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <ArrowUpRight className={`w-8 h-8 ${metrics.ytdReturn >= 0 ? 'text-purple-400' : 'text-red-400'}`} />
              <span className={`text-sm font-medium ${metrics.ytdReturn >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                {metrics.ytdReturnPct >= 0 ? '+' : ''}{metrics.ytdReturnPct.toFixed(2)}%
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Total Return</p>
            <p className="text-white text-xl font-bold">
              {metrics.ytdReturn >= 0 ? '+' : ''}${Math.abs(metrics.ytdReturn).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-4">
            <h3 className="text-lg font-bold text-white mb-4">Portfolio Performance</h3>
                {portfolioValue > 0 ? (
                  <RechartsChart
                    type="line"
                    height={250}
                    data={(() => {
                      const labels = getChartLabels()
                      return [
                        { name: labels[0], value: portfolioValue * 0.8 },
                        { name: labels[1], value: portfolioValue * 0.85 },
                        { name: labels[2], value: portfolioValue * 0.9 },
                        { name: labels[3], value: portfolioValue * 0.95 },
                        { name: labels[4], value: portfolioValue }
                      ]
                    })()}
                    series={[{ dataKey: 'value', name: 'Portfolio Value' }]}
                  />
                ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-white text-lg font-medium mb-2">No performance data yet</h4>
                  <p className="text-gray-400 text-sm">Start investing to see your portfolio performance</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="glass-card p-4">
            <h3 className="text-lg font-bold text-white mb-4">Asset Allocation</h3>
            {safeHoldings.length > 0 ? (
              <RechartsChart type="donut" height={250} data={safeHoldings.map(h => ({ name: h.symbol, value: h.allocation }))} />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PieChart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-white text-lg font-medium mb-2">No investments yet</h4>
                  <p className="text-gray-400 text-sm">Start by uploading your bank statement to begin round-up investments</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Your Holdings</h3>
          <button
            onClick={() => {
              console.log('View All Holdings clicked - Showing detailed portfolio view');
              setShowViewAllModal(true);
            }}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            View All →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left pb-3 text-gray-400 font-medium">Asset</th>
                <th className="text-right pb-3 text-gray-400 font-medium">Shares</th>
                <th className="text-right pb-3 text-gray-400 font-medium">Avg Cost</th>
                <th className="text-right pb-3 text-gray-400 font-medium">Current Price</th>
                <th className="text-right pb-3 text-gray-400 font-medium">Value</th>
                <th className="text-right pb-3 text-gray-400 font-medium">Change</th>
                <th className="text-right pb-3 text-gray-400 font-medium">Allocation</th>
                <th className="text-right pb-3 text-gray-400 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {safeHoldings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <PieChart className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-medium">No investments yet</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          Start by uploading your bank statement to begin round-up investments
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentHoldings.map((holding, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <CompanyLogo 
                        symbol={holding.symbol} 
                        name={holding.name} 
                        size="w-8 h-8"
                      />
                      <div>
                        <p className="text-gray-400 text-sm">{holding.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 text-white">{holding.shares.toFixed(3)}</td>
                  <td className="text-right py-4 text-white">${holding.avgCost.toFixed(2)}</td>
                  <td className="text-right py-4 text-white">${holding.currentPrice.toFixed(2)}</td>
                  <td className="text-right py-4 text-white">${holding.value.toLocaleString()}</td>
                  <td className={`text-right py-4 font-medium ${holding.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {holding.change >= 0 ? '+' : ''}{holding.change}%
                  </td>
                  <td className="text-right py-4 text-white">{holding.allocation.toFixed(2)}%</td>
                  <td className="text-right py-4">
                    <button 
                      onClick={() => {
                        console.log('Portfolio action menu for', holding.symbol);
                        setSelectedHolding(holding);
                        setShowPortfolioActionsModal(true);
                      }}
                      className="text-gray-400 hover:text-white p-1 transition-colors"
                      title={`Actions for ${holding.symbol}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {safeHoldings.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6">
            <div className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Showing {startIndex + 1} to {Math.min(endIndex, safeHoldings.length)} of {safeHoldings.length} holdings
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

      {/* Portfolio Holdings Modal */}
      {showViewAllModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl ${
            isLightMode ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-white/20'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isLightMode ? 'border-gray-200' : 'border-white/10'
            }`}>
              <div>
                <h2 className={`text-xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                  All Portfolio Holdings
                </h2>
                <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  {safeHoldings.length} assets • Total Value: ${(portfolioValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <button
                onClick={() => setShowViewAllModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isLightMode ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-white/10 text-gray-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable Table */}
            <div className="overflow-auto max-h-[60vh] p-6">
              <table className="w-full">
                <thead className={`sticky top-0 ${isLightMode ? 'bg-white' : 'bg-gray-900'}`}>
                  <tr className={`border-b ${isLightMode ? 'border-gray-200' : 'border-white/10'}`}>
                    <th className={`text-left pb-3 font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Asset</th>
                    <th className={`text-right pb-3 font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Shares</th>
                    <th className={`text-right pb-3 font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Avg Cost</th>
                    <th className={`text-right pb-3 font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Price</th>
                    <th className={`text-right pb-3 font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Value</th>
                    <th className={`text-right pb-3 font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Change</th>
                    <th className={`text-right pb-3 font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {safeHoldings.map((holding, index) => (
                    <tr key={index} className={`border-b ${isLightMode ? 'border-gray-100' : 'border-white/5'}`}>
                      <td className="py-3">
                        <div className="flex items-center space-x-3">
                          <CompanyLogo symbol={holding.symbol} name={holding.name} size="w-8 h-8" />
                          <div>
                            <p className={`font-medium ${isLightMode ? 'text-gray-900' : 'text-white'}`}>{holding.symbol}</p>
                            <p className={`text-xs ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>{holding.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`text-right py-3 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>{holding.shares.toFixed(4)}</td>
                      <td className={`text-right py-3 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>${holding.avgCost.toFixed(2)}</td>
                      <td className={`text-right py-3 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>${holding.currentPrice.toFixed(2)}</td>
                      <td className={`text-right py-3 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>${holding.value.toFixed(2)}</td>
                      <td className={`text-right py-3 font-medium ${holding.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(2)}%
                      </td>
                      <td className={`text-right py-3 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>{holding.allocation.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t ${isLightMode ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-white/5'}`}>
              <button
                onClick={() => setShowViewAllModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Actions Modal */}
      {showPortfolioActionsModal && selectedHolding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl ${
            isLightMode ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-white/20'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isLightMode ? 'border-gray-200' : 'border-white/10'
            }`}>
              <div className="flex items-center space-x-3">
                <CompanyLogo symbol={selectedHolding.symbol} name={selectedHolding.name} size="w-10 h-10" />
                <div>
                  <h2 className={`text-xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                    {selectedHolding.symbol}
                  </h2>
                  <p className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    {selectedHolding.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPortfolioActionsModal(false)
                  setSelectedHolding(null)
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isLightMode ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-white/10 text-gray-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${
                isLightMode ? 'bg-gray-50' : 'bg-white/5'
              }`}>
                <div>
                  <p className={`text-xs ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>Shares Owned</p>
                  <p className={`text-lg font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                    {selectedHolding.shares.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>Avg Cost</p>
                  <p className={`text-lg font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                    ${selectedHolding.avgCost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>Current Price</p>
                  <p className={`text-lg font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                    ${selectedHolding.currentPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Value</p>
                  <p className={`text-lg font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                    ${selectedHolding.value.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${
                isLightMode ? 'bg-gray-50' : 'bg-white/5'
              }`}>
                <div>
                  <p className={`text-xs ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>Performance</p>
                  <p className={`text-lg font-semibold ${selectedHolding.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedHolding.change >= 0 ? '+' : ''}{selectedHolding.change.toFixed(2)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>Allocation</p>
                  <p className={`text-lg font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                    {selectedHolding.allocation.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t ${isLightMode ? 'border-gray-200' : 'border-white/10'}`}>
              <button
                onClick={() => {
                  setShowPortfolioActionsModal(false)
                  setSelectedHolding(null)
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
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

export default PortfolioOverview



