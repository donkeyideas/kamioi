import React, { useState } from 'react'
import { ArrowUpRight, TrendingUp, PieChart, DollarSign, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import RechartsChart from '../common/RechartsChart'
import UserAnalytics from './UserAnalytics'
import CompanyLogo from '../common/CompanyLogo'
import GlassModal from '../common/GlassModal'
import { useData } from '../../context/DataContext'
import { useTheme } from '../../context/ThemeContext'

const PortfolioOverview = () => {
  const [timeRange, setTimeRange] = useState('1m')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showViewAllModal, setShowViewAllModal] = useState(false)
  const [showPortfolioActionsModal, setShowPortfolioActionsModal] = useState(false)
  const [selectedHolding, setSelectedHolding] = useState(null)
  const itemsPerPage = 10
  const { portfolioValue, holdings } = useData()
  const { isLightMode } = useTheme()

  // Pagination logic - Safe array access
  const safeHoldings = holdings || []
  const totalPages = Math.ceil(safeHoldings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentHoldings = safeHoldings.slice(startIndex, endIndex)

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
              <TrendingUp className={`w-8 h-8 ${portfolioValue > 0 ? 'text-green-400' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${portfolioValue > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                {portfolioValue > 0 ? '+0.00%' : '0.00%'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Today&apos;s Gain</p>
            <p className="text-white text-xl font-bold">
              {portfolioValue > 0 ? '$0.00' : '$0.00'}
            </p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <PieChart className={`w-8 h-8 ${holdings.length > 0 ? 'text-blue-400' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${holdings.length > 0 ? 'text-blue-400' : 'text-gray-400'}`}>
                {holdings.length} assets
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Diversified</p>
            <p className="text-white text-xl font-bold">
              {holdings.length > 0 ? '0.00% ROI' : 'No investments'}
            </p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <DollarSign className={`w-8 h-8 ${portfolioValue > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${portfolioValue > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {portfolioValue > 0 ? '$0.00' : '$0.00'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Cash Available</p>
            <p className="text-white text-xl font-bold">
              {portfolioValue > 0 ? 'Invested' : 'Start investing'}
            </p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <ArrowUpRight className={`w-8 h-8 ${portfolioValue > 0 ? 'text-purple-400' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${portfolioValue > 0 ? 'text-purple-400' : 'text-gray-400'}`}>
                {portfolioValue > 0 ? '+0.00%' : '0.00%'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2">YTD Return</p>
            <p className="text-white text-xl font-bold">
              {portfolioValue > 0 ? '$0.00' : '$0.00'}
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
                    data={[
                      { name: 'Week 1', value: portfolioValue },
                      { name: 'Week 2', value: portfolioValue },
                      { name: 'Week 3', value: portfolioValue },
                      { name: 'Week 4', value: portfolioValue },
                      { name: 'Today', value: portfolioValue }
                    ]}
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
            View All ?
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => {
            console.log('Auto-Invest setup clicked');
            // This would open auto-invest configuration modal
          }}
          className="glass-card p-4 text-left hover:transform hover:scale-105 transition-all duration-200"
        >
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h4 className="font-medium text-white mb-1">Auto-Invest</h4>
          <p className="text-gray-400 text-sm">Set up recurring investments</p>
        </button>
        
        <button 
          onClick={() => {
            console.log('Portfolio Rebalancing clicked');
            // This would open portfolio rebalancing modal
          }}
          className="glass-card p-4 text-left hover:transform hover:scale-105 transition-all duration-200"
        >
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
            <PieChart className="w-5 h-5 text-green-400" />
          </div>
          <h4 className="font-medium text-white mb-1">Rebalance</h4>
          <p className="text-gray-400 text-sm">Optimize your portfolio</p>
        </button>
        
        <button 
          onClick={() => {
            console.log('Withdraw Funds clicked');
            // This would open a withdrawal modal or page
          }}
          className="glass-card p-4 text-left hover:transform hover:scale-105 transition-all duration-200"
        >
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-purple-400" />
          </div>
          <h4 className="font-medium text-white mb-1">Withdraw</h4>
          <p className="text-gray-400 text-sm">Access your funds</p>
        </button>
      </div>

      {/* Glass Modals */}
      <GlassModal
        isOpen={showViewAllModal}
        onClose={() => setShowViewAllModal(false)}
        title="Portfolio Holdings"
        message={`Portfolio Summary:\nï¿½ Total Holdings: ${holdings.length}\nï¿½ Portfolio Value: $${portfolioValue.toFixed(2)}\n\nDetailed Holdings:\n\n${holdings.map(holding => `ï¿½ ${holding.symbol}:\n  - Shares: ${holding.shares.toFixed(4)}\n  - Avg Cost: $${holding.avgCost.toFixed(2)}\n  - Current Price: $${holding.currentPrice.toFixed(2)}\n  - Value: $${holding.value.toFixed(2)}\n  - Change: ${holding.change >= 0 ? '+' : ''}${holding.change}%\n  - Allocation: ${holding.allocation.toFixed(2)}%`).join('\n\n')}\n\nThis comprehensive view shows all your current investments with detailed financial information.`}
        type="info"
      />

      <GlassModal
        isOpen={showPortfolioActionsModal}
        onClose={() => {
          setShowPortfolioActionsModal(false);
          setSelectedHolding(null);
        }}
        title={`Portfolio Actions - ${selectedHolding?.symbol || 'Unknown'}`}
        message={selectedHolding ? `Holding Details for ${selectedHolding.symbol}:\n\nï¿½ Shares Owned: ${selectedHolding.shares.toFixed(4)}\nï¿½ Average Cost: $${selectedHolding.avgCost.toFixed(2)}\nï¿½ Current Price: $${selectedHolding.currentPrice.toFixed(2)}\nï¿½ Total Value: $${selectedHolding.value.toFixed(2)}\nï¿½ Change: ${selectedHolding.change >= 0 ? '+' : ''}${selectedHolding.change}%\nï¿½ Portfolio Allocation: ${selectedHolding.allocation.toFixed(2)}%` : 'No holding selected'}
        type="info"
      />
    </div>
  )
}

export default PortfolioOverview



