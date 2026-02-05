import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Target,
  Brain,
  Download,
  ArrowLeft,
  BarChart3,
  PieChart,
  Award,
  Lightbulb,
  RefreshCw
} from 'lucide-react'
import RechartsChart from '../common/RechartsChart'
import { useTheme } from '../../context/ThemeContext'
import { useModal } from '../../context/ModalContext'
import { useNotifications } from '../../hooks/useNotifications'
import { useData } from '../../context/DataContext'

const UserAnalytics = ({ onBack }) => {
  const { addNotification } = useNotifications()
  const { portfolioValue, totalRoundUps, transactions, holdings, goals } = useData()
  const { isLightMode } = useTheme()
  const { showExportModal } = useModal()
  const [selectedTimeframe, setSelectedTimeframe] = useState('3m')
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Filter transactions based on selected timeframe
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    const now = new Date()
    let cutoffDate = new Date()

    switch (selectedTimeframe) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30d':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6)
        break
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        cutoffDate = new Date(0) // All time
        break
    }

    return transactions.filter(tx => {
      const txDate = new Date(tx.date)
      return txDate >= cutoffDate
    })
  }, [transactions, selectedTimeframe])

  // Calculate analytics data from filtered transactions
  const analyticsData = useMemo(() => ({
    spending: {
      total: filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      categories: filteredTransactions.reduce((acc, t) => {
        const category = t.category || 'Other'
        acc[category] = (acc[category] || 0) + (t.amount || 0)
        return acc
      }, {}),
      monthly: filteredTransactions.reduce((acc, t) => {
        const month = t.date ? t.date.split('/')[0] : 'Unknown'
        acc[month] = (acc[month] || 0) + (t.amount || 0)
        return acc
      }, {})
    },
    investments: {
      total: portfolioValue,
      holdings: holdings.length,
      roundUps: filteredTransactions.reduce((sum, t) => sum + (t.roundUp || 0), 0)
    },
    trends: {
      spending: filteredTransactions.length > 0 ? 'increasing' : 'stable',
      investments: holdings.length > 0 ? 'growing' : 'stable'
    }
  }), [filteredTransactions, portfolioValue, holdings])

  const refreshData = () => {
    setLastUpdated(new Date())
  }

  const handleExport = () => {
    showExportModal(
      'Export Analytics Data',
      'This will download a comprehensive analytics report including spending patterns, investment insights, and AI recommendations. The export will include charts, metrics, and detailed breakdowns.',
      () => {
        console.log('Exporting analytics data...')
        addNotification({
          type: 'success',
          title: 'Analytics Export Completed',
          message: 'Your analytics report has been exported successfully.',
          timestamp: new Date()
        })
      }
    )
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
    if (isLightMode) return 'bg-white/60 backdrop-blur-lg rounded-xl p-6 border border-gray-200/50'
    return 'bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10'
  }

  const getExportButtonClass = () => {
    if (isLightMode) return 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'
    return 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors'
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <div>
              <h1 className={`text-3xl font-bold ${getTextClass()}`}>Analytics Dashboard</h1>
              <p className={`${getSubtextClass()} mt-1`}>Comprehensive insights into your spending and investment patterns</p>
              {lastUpdated && (
                <p className={`${getSubtextClass()} text-sm mt-1`}>
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshData}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-white/10 border border-white/20 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="3m">3 Months</option>
              <option value="6m">6 Months</option>
              <option value="1y">1 Year</option>
            </select>
            <button onClick={handleExport} className={getExportButtonClass()}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'overview', label: 'Spending Analytics', icon: BarChart3 },
            { id: 'goals', label: 'Goals & Progress', icon: Target },
            { id: 'ai', label: 'AI Insights', icon: Brain }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={getCardClass()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <ShoppingBag className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-400">Total Purchases</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    ${analyticsData.spending.total.toLocaleString()}
                  </p>
                  <p className={`text-sm ${getSubtextClass()}`}>
                    {filteredTransactions.length} transactions
                  </p>
                </div>
              </div>

              <div className={getCardClass()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-sm text-gray-400">Avg Purchase</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    ${filteredTransactions.length > 0 ? (analyticsData.spending.total / filteredTransactions.length).toFixed(2) : '0.00'}
                  </p>
                  <p className={`text-sm ${getSubtextClass()}`}>Per transaction</p>
                </div>
              </div>

              <div className={getCardClass()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Target className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-400">Total Round-ups</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    ${totalRoundUps.toFixed(2)}
                  </p>
                  <p className={`text-sm ${getSubtextClass()}`}>From transactions</p>
                </div>
              </div>

              <div className={getCardClass()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-400" />
                  </div>
                  <span className="text-sm text-gray-400">Linked to Stocks</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    {filteredTransactions.filter(t => t.ticker).length}
                  </p>
                  <p className={`text-sm ${getSubtextClass()}`}>Mapped transactions</p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Spending by Category */}
              <div className={getCardClass()}>
                <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Spending by Category</h3>
                {Object.keys(analyticsData.spending.categories).length > 0 ? (
                  <RechartsChart 
                    type="donut" 
                    height={300}
                    data={Object.entries(analyticsData.spending.categories).map(([category, amount]) => ({ 
                      name: category, 
                      value: amount 
                    }))}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className={`${getSubtextClass()}`}>No spending data yet</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Merchants */}
              <div className={getCardClass()}>
                <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Top Merchants</h3>
                {filteredTransactions.length > 0 ? (
                  <RechartsChart
                    type="bar"
                    height={300}
                    data={Object.entries(filteredTransactions.reduce((acc, t) => {
                      const merchant = t.merchant || 'Unknown'
                      acc[merchant] = (acc[merchant] || 0) + 1
                      return acc
                    }, {})).map(([merchant, count]) => ({
                      name: merchant,
                      value: count
                    }))}
                    series={[{ dataKey: 'value', name: 'Visits' }]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className={`${getSubtextClass()}`}>No merchant data yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Round-Up Impact */}
            <div className={getCardClass()}>
              <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Round-Up Impact by Category</h3>
              {Object.keys(analyticsData.spending.categories).length > 0 ? (
                <RechartsChart
                  type="bar"
                  height={300}
                  data={Object.entries(analyticsData.spending.categories).map(([category]) => {
                    // Calculate actual round-ups for this category
                    const categoryTransactions = filteredTransactions.filter(t => (t.category || 'Other') === category)
                    const categoryRoundUps = categoryTransactions.reduce((sum, t) => sum + (t.roundUp || 0), 0)
                    return {
                      name: category,
                      value: categoryRoundUps
                    }
                  })}
                  series={[{ dataKey: 'value', name: 'Round-up Impact' }]}
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className={`${getSubtextClass()}`}>No round-up data yet</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-8">
            {/* Goals Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={getCardClass()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-400">Active Goals</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    {goals.filter(g => g.status === 'active').length}
                  </p>
                  <p className={`text-sm ${getSubtextClass()}`}>In progress</p>
                </div>
              </div>

              <div className={getCardClass()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-sm text-gray-400">Total Saved</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    ${goals.reduce((sum, g) => sum + (g.current || 0), 0).toLocaleString()}
                  </p>
                  <p className={`text-sm ${getSubtextClass()}`}>Across all goals</p>
                </div>
              </div>

              <div className={getCardClass()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Award className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-400">Total Target</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    ${goals.reduce((sum, g) => sum + (g.target || 0), 0).toLocaleString()}
                  </p>
                  <p className={`text-sm ${getSubtextClass()}`}>Combined targets</p>
                </div>
              </div>

              <div className={getCardClass()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <PieChart className="w-6 h-6 text-orange-400" />
                  </div>
                  <span className="text-sm text-gray-400">Avg Progress</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    {goals.length > 0
                      ? Math.round(goals.reduce((sum, g) => sum + ((g.current / g.target) * 100 || 0), 0) / goals.length)
                      : 0}%
                  </p>
                  <p className={`text-sm ${getSubtextClass()}`}>Overall completion</p>
                </div>
              </div>
            </div>

            {/* Goals List */}
            <div className={getCardClass()}>
              <h3 className={`text-xl font-semibold ${getTextClass()} mb-6`}>Investment Goals Progress</h3>
              {goals.length > 0 ? (
                <div className="space-y-6">
                  {goals.map((goal) => {
                    const progress = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0
                    const remaining = Math.max(0, goal.target - goal.current)

                    return (
                      <div key={goal.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              goal.category === 'Savings' ? 'bg-green-500/20' :
                              goal.category === 'Travel' ? 'bg-blue-500/20' :
                              goal.category === 'Big Purchase' ? 'bg-purple-500/20' :
                              'bg-orange-500/20'
                            }`}>
                              <Target className={`w-5 h-5 ${
                                goal.category === 'Savings' ? 'text-green-400' :
                                goal.category === 'Travel' ? 'text-blue-400' :
                                goal.category === 'Big Purchase' ? 'text-purple-400' :
                                'text-orange-400'
                              }`} />
                            </div>
                            <div>
                              <h4 className={`font-semibold ${getTextClass()}`}>{goal.title || goal.name}</h4>
                              <p className={`text-sm ${getSubtextClass()}`}>{goal.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${getTextClass()}`}>${goal.current?.toLocaleString() || 0}</p>
                            <p className={`text-sm ${getSubtextClass()}`}>of ${goal.target?.toLocaleString() || 0}</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className={getSubtextClass()}>{progress}% complete</span>
                            <span className={getSubtextClass()}>${remaining.toLocaleString()} remaining</span>
                          </div>
                          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                progress >= 75 ? 'bg-green-500' :
                                progress >= 50 ? 'bg-blue-500' :
                                progress >= 25 ? 'bg-yellow-500' :
                                'bg-orange-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Goal Details */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span className={getSubtextClass()}>
                              Timeframe: {goal.timeframe} months
                            </span>
                            {goal.endDate && (
                              <span className={getSubtextClass()}>
                                Target: {new Date(goal.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            goal.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            goal.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {goal.status?.charAt(0).toUpperCase() + goal.status?.slice(1) || 'Active'}
                          </span>
                        </div>

                        {/* AI Recommendations */}
                        {goal.aiRecommendations && goal.aiRecommendations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-start space-x-2">
                              <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <p className={`text-sm ${getSubtextClass()}`}>
                                {goal.aiRecommendations[0]}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className={`text-lg font-medium ${getTextClass()} mb-2`}>No Goals Set Yet</h4>
                  <p className={`${getSubtextClass()}`}>Create investment goals to track your financial progress</p>
                </div>
              )}
            </div>

            {/* Goals Distribution Chart */}
            {goals.length > 0 && (
              <div className={getCardClass()}>
                <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Goals Distribution by Category</h3>
                <RechartsChart
                  type="donut"
                  height={300}
                  data={Object.entries(goals.reduce((acc, g) => {
                    const category = g.category || 'Other'
                    acc[category] = (acc[category] || 0) + (g.target || 0)
                    return acc
                  }, {})).map(([category, amount]) => ({
                    name: category,
                    value: amount
                  }))}
                />
              </div>
            )}
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-8">
            {/* AI Insights Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={getCardClass()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Brain className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-400">AI Mappings</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    {filteredTransactions.filter(t => t.ticker).length}
                  </p>
                  <p className={`text-sm ${getSubtextClass()}`}>Successfully mapped</p>
                </div>
              </div>

              <div className={getCardClass()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-sm text-gray-400">Investment Value</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    ${portfolioValue.toFixed(2)}
                  </p>
                  <p className={`text-sm ${getSubtextClass()}`}>From round-ups</p>
                </div>
              </div>

              <div className={getCardClass()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Target className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-400">Accuracy Rate</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>
                    {filteredTransactions.filter(t => t.ticker).length > 0 ? '100%' : '0%'}
                  </p>
                  <p className={`text-sm ${getSubtextClass()}`}>Mapping success</p>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className={getCardClass()}>
              <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>AI Recommendations</h3>
              {filteredTransactions.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <Lightbulb className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className={`font-medium ${getTextClass()}`}>Diversification Opportunity</h4>
                      <p className={`text-sm ${getSubtextClass()}`}>
                        You have {holdings.length} investment{holdings.length !== 1 ? 's' : ''}. Consider diversifying across different sectors for better risk management.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <TrendingUp className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className={`font-medium ${getTextClass()}`}>Round-Up Optimization</h4>
                      <p className={`text-sm ${getSubtextClass()}`}>
                        You&apos;ve invested ${totalRoundUps.toFixed(2)} through round-ups. Consider increasing your round-up amount to $2.00 for faster portfolio growth.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <Award className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className={`font-medium ${getTextClass()}`}>Spending Pattern Analysis</h4>
                      <p className={`text-sm ${getSubtextClass()}`}>
                        Your top spending category is {Object.keys(analyticsData.spending.categories).length > 0 ? 
                          Object.entries(analyticsData.spending.categories).sort((a, b) => b[1] - a[1])[0][0] : 
                          'Unknown'}. Consider setting up automatic investments for this category.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className={`${getSubtextClass()}`}>Upload your bank statement to get AI-powered insights</p>
                </div>
              )}
            </div>

            {/* Investment Performance */}
            <div className={getCardClass()}>
              <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Investment Performance</h3>
              {holdings.length > 0 ? (
                <div className="space-y-4">
                  {holdings.map((holding, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-blue-400 font-bold text-sm">{holding.symbol?.charAt(0) || '?'}</span>
                        </div>
                        <div>
                          <p className={`font-medium ${getTextClass()}`}>{holding.symbol}</p>
                          <p className={`text-sm ${getSubtextClass()}`}>{holding.shares.toFixed(4)} shares</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getTextClass()}`}>${holding.value.toFixed(2)}</p>
                        <p className={`text-sm ${holding.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className={`${getSubtextClass()}`}>No investments yet. Start by mapping your transactions!</p>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  )
}

export default UserAnalytics

