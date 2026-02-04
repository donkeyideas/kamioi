import React, { useState, useEffect } from 'react'
import { ArrowUpRight, PieChart, TrendingUp, DollarSign } from 'lucide-react'
import RechartsChart from '../common/RechartsChart'
import FamilyAnalytics from './FamilyAnalytics'
import CompanyLogo from '../common/CompanyLogo'
import { useData } from '../../context/DataContext'
import { useTheme } from '../../context/ThemeContext'

const FamilyPortfolio = ({ user }) => {
  const [timeRange, setTimeRange] = useState('1m')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [activeView, setActiveView] = useState('overview')
  const [showAllHoldings, setShowAllHoldings] = useState(false)
  const [showAutoInvest, setShowAutoInvest] = useState(false)
  const [showRebalancing, setShowRebalancing] = useState(false)
  const [showTaxHarvesting, setShowTaxHarvesting] = useState(false)
  const itemsPerPage = 10
  const { portfolioValue, holdings: contextHoldings, portfolioStats } = useData()
  const { isLightMode } = useTheme()
  const [familyMembers, setFamilyMembers] = useState([])

  // Check if in demo mode
  const isDemoMode = localStorage.getItem('kamioi_demo_mode') === 'true'

  // Use clean data from DataContext (no hardcoded values)
  const [apiHoldings, setApiHoldings] = useState([])
  const [familyPortfolio, setFamilyPortfolio] = useState({
    today_gain: 0,
    today_gain_percentage: 0,
    roi: 0,
    cash_available: 0,
    ytd_return: 0,
    ytd_return_percentage: 0
  })

  // In demo mode, use context data; otherwise use API data
  const holdings = isDemoMode ? (contextHoldings || []) : apiHoldings
  
  // Fetch holdings and portfolio data from API when component mounts (skip in demo mode)
  useEffect(() => {
    // In demo mode, use context data directly and set familyPortfolio from portfolioStats
    if (isDemoMode) {
      setFamilyPortfolio({
        today_gain: portfolioStats?.todayGain || 0,
        today_gain_percentage: portfolioStats?.todayGainPct || 0,
        roi: portfolioStats?.gainPercentage || 0,
        cash_available: 0,
        ytd_return: portfolioStats?.totalGain || 0,
        ytd_return_percentage: portfolioStats?.gainPercentage || 0
      })
      // Set demo family members
      setFamilyMembers([
        { id: 1, name: 'John Doe', role: 'Parent', contribution: portfolioStats?.totalCost * 0.4 || 0, portfolio: portfolioValue * 0.4, percentage: 40 },
        { id: 2, name: 'Jane Doe', role: 'Parent', contribution: portfolioStats?.totalCost * 0.35 || 0, portfolio: portfolioValue * 0.35, percentage: 35 },
        { id: 3, name: 'Sam Doe', role: 'Child', contribution: portfolioStats?.totalCost * 0.15 || 0, portfolio: portfolioValue * 0.15, percentage: 15 },
        { id: 4, name: 'Emma Doe', role: 'Child', contribution: portfolioStats?.totalCost * 0.1 || 0, portfolio: portfolioValue * 0.1, percentage: 10 }
      ])
      return
    }

    const fetchPortfolioData = async () => {
      try {
        const token = localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const [portfolioResponse, membersResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/family/portfolio`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${apiBaseUrl}/api/family/members`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ])

        if (portfolioResponse.ok) {
          const result = await portfolioResponse.json()
          if (result.success && result.portfolio) {
            setApiHoldings(result.portfolio.holdings || [])
            setFamilyPortfolio({
              today_gain: result.portfolio.today_gain || 0,
              today_gain_percentage: result.portfolio.today_gain_percentage || 0,
              roi: result.portfolio.roi || 0,
              cash_available: result.portfolio.cash_available || 0,
              ytd_return: result.portfolio.ytd_return || 0,
              ytd_return_percentage: result.portfolio.ytd_return_percentage || 0
            })
          }
        }

        if (membersResponse.ok) {
          const membersResult = await membersResponse.json()
          if (membersResult.success && membersResult.data) {
            setFamilyMembers(membersResult.data.members || [])
          }
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error)
        // Set empty array as fallback
        setFamilyMembers([])
      }
    }

    fetchPortfolioData()
  }, [isDemoMode, portfolioStats, portfolioValue, contextHoldings])


  const getSelectClass = () => {
    if (isLightMode) return 'bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500'
    return 'bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  }

  if (showAnalytics) {
    return <FamilyAnalytics user={user} onBack={() => setShowAnalytics(false)} />
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Family Portfolio</h1>
            <p className="text-gray-400">
              Total Family Portfolio Value: <span className="text-green-400 font-semibold">${portfolioValue.toLocaleString()}</span>
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
            <button 
              onClick={() => setShowAnalytics(true)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
            >
              View Analytics
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1 mb-6">
          {[
            { id: 'overview', label: 'Portfolio Overview', icon: PieChart },
            { id: 'contributions', label: 'Member Contributions', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeView === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content based on active view */}
        {activeView === 'overview' && (
          <div>
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <TrendingUp className={`w-8 h-8 ${portfolioValue > 0 ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${portfolioValue > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {familyPortfolio.today_gain_percentage ? `${familyPortfolio.today_gain_percentage >= 0 ? '+' : ''}${familyPortfolio.today_gain_percentage.toFixed(2)}%` : '0.00%'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-2">Today's Gain</p>
                <p className="text-white text-xl font-bold">
                  {familyPortfolio.today_gain ? `$${familyPortfolio.today_gain.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
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
                  {familyPortfolio.roi ? `${familyPortfolio.roi.toFixed(1)}% ROI` : 'No investments'}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <DollarSign className={`w-8 h-8 ${familyPortfolio.cash_available > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${familyPortfolio.cash_available > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {familyPortfolio.cash_available ? `$${familyPortfolio.cash_available.toLocaleString()}` : '$0'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-2">Cash Available</p>
                <p className="text-white text-xl font-bold">
                  {familyPortfolio.cash_available > 0 ? 'Ready to Invest' : 'Start investing'}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <ArrowUpRight className={`w-8 h-8 ${familyPortfolio.ytd_return_percentage > 0 ? 'text-purple-400' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${familyPortfolio.ytd_return_percentage > 0 ? 'text-purple-400' : 'text-gray-400'}`}>
                    {familyPortfolio.ytd_return_percentage ? `${familyPortfolio.ytd_return_percentage >= 0 ? '+' : ''}${familyPortfolio.ytd_return_percentage.toFixed(2)}%` : '0.00%'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-2">YTD Return</p>
                <p className="text-white text-xl font-bold">
                  {familyPortfolio.ytd_return ? `$${familyPortfolio.ytd_return.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                </p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Portfolio Performance</h3>
                <RechartsChart 
                  type="line" 
                  height={300}
                  data={[]}
                  xAxisKey="month"
                  yAxisKey="value"
                  lineKey="value"
                  showTooltip={true}
                  showGrid={true}
                />
              </div>

              <div className="glass-card p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Asset Allocation</h3>
                <RechartsChart 
                  type="pie" 
                  height={300}
                  data={[]}
                  series={[{
                    dataKey: 'value',
                    name: 'Value'
                  }]}
                />
              </div>
            </div>

            {/* Holdings Table */}
            <div className="glass-card p-6 mt-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Family Holdings</h3>
                <button 
                  onClick={() => setShowAllHoldings(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  View All →
                </button>
              </div>
              
              {holdings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Shares</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Value</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((holding, index) => (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
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
                          <td className="py-3 px-4 text-white">{holding.shares.toLocaleString()}</td>
                          <td className="py-3 px-4 text-white">${holding.value.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`${holding.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {holding.change >= 0 ? '+' : ''}{holding.change}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PieChart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-white text-lg font-medium mb-2">No family holdings yet</h4>
                  <p className="text-gray-400 text-sm">Start investing to see your family portfolio holdings here</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <button 
                onClick={() => setShowAutoInvest(true)}
                className="glass-card p-6 text-left hover:transform hover:scale-105 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <h4 className="font-medium text-white mb-2">Family Auto-Invest</h4>
                <p className="text-gray-400 text-sm">Set up recurring family investments</p>
              </button>
              
              <button 
                onClick={() => setShowRebalancing(true)}
                className="glass-card p-6 text-left hover:transform hover:scale-105 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <PieChart className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="font-medium text-white mb-2">Portfolio Rebalancing</h4>
                <p className="text-gray-400 text-sm">Optimize your family asset allocation</p>
              </button>
              
              <button 
                onClick={() => setShowTaxHarvesting(true)}
                className="glass-card p-6 text-left hover:transform hover:scale-105 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="font-medium text-white mb-2">Tax-Loss Harvesting</h4>
                <p className="text-gray-400 text-sm">Minimize your family tax burden</p>
              </button>
            </div>
          </div>
        )}

        {/* Member Contributions View */}
        {activeView === 'contributions' && (
          <div className="space-y-6">
            {/* Member Contribution Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Total Family Contributions</h3>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  ${(familyMembers.length > 0 ? familyMembers.reduce((sum, member) => sum + (member.contribution || 0), 0) : 0).toLocaleString()}
                </div>
                <p className="text-gray-400 text-sm">Across all family members</p>
              </div>
              
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Current Portfolio Value</h3>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  ${(familyMembers.length > 0 ? familyMembers.reduce((sum, member) => sum + (member.portfolio || 0), 0) : 0).toLocaleString()}
                </div>
                <p className="text-gray-400 text-sm">Total family portfolio value</p>
              </div>
              
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Average Return</h3>
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {familyMembers.length > 0 && familyMembers.reduce((sum, member) => sum + (member.contribution || 0), 0) > 0 
                    ? (((familyMembers.reduce((sum, member) => sum + (member.portfolio || 0), 0) / familyMembers.reduce((sum, member) => sum + (member.contribution || 0), 0)) - 1) * 100).toFixed(1)
                    : '0.0'}%
                </div>
                <p className="text-gray-400 text-sm">Family portfolio performance</p>
              </div>
            </div>

            {/* Member Contribution Chart */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Member Contribution Breakdown</h3>
              <RechartsChart 
                type="bar" 
                height={250}
                data={(familyMembers || []).map(member => ({ 
                  name: member.name || 'Unknown', 
                  contributed: member.contribution || 0,
                  currentValue: member.portfolio || 0
                }))}
                xAxisKey="name"
                yAxisKey="contributed"
                barKey="contributed"
                showTooltip={true}
                showGrid={true}
                showLegend={true}
                colors={['#3b82f6', '#10b981']}
              />
            </div>

            {/* Individual Member Details */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Individual Member Details</h3>
              <div className="space-y-4">
                {(familyMembers || []).map((member) => (
                  <div key={member?.id || Math.random()} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {(member.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{member.name || 'Unknown Member'}</h4>
                          <p className="text-gray-400 text-sm">{member.role || 'Member'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{(member.percentage || 0).toFixed(1)}%</p>
                        <p className="text-gray-400 text-sm">Portfolio Share</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Contributed</p>
                        <p className="text-white font-semibold">${(member.contribution || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Current Value</p>
                        <p className="text-white font-semibold">${(member.portfolio || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Portfolio Share</p>
                        <p className="text-white font-semibold">{(member.percentage || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" 
                          style={{ width: `${(member.percentage || 0)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FamilyPortfolio
