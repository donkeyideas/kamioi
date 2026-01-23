import React, { useState, useEffect } from 'react'
import { Brain, Zap, Target, TrendingUp, Upload, Shield, RefreshCw, Lightbulb } from 'lucide-react'
import RechartsChart from '../common/RechartsChart'
import { useData } from '../../context/DataContext'

const AIRecommendations = ({ user }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m')
  const [aiData, setAiData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const { portfolioValue } = useData()

  useEffect(() => {
    fetchAIInsights()
  }, [selectedTimeframe])

  const fetchAIInsights = async () => {
    try {
      setLoading(true)
      console.log('?? Fetching AI insights...')
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/user/ai-insights?timeframe=${selectedTimeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kamioi_token')}`
        }
      })
      
      console.log('?? AI Insights Response Status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('? AI Insights Data:', result)
        if (result.success) {
          setAiData(result.data)
          setLastUpdated(new Date().toISOString())
          console.log('?? AI Insights set successfully')
        } else {
          console.error('? Failed to fetch AI insights:', result.error)
        }
      } else {
        console.error('? Network error fetching AI insights:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('?? Error fetching AI insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchAIInsights()
  }
  
  const portfolioInsights = aiData ? [
    {
      metric: 'Diversification Score',
      value: aiData.diversificationScore,
      target: 90,
      status: aiData.diversificationScore >= 80 ? 'Good' : 'Needs Improvement',
      suggestion: 'Consider adding healthcare exposure'
    },
    {
      metric: 'Risk Level',
      value: aiData.riskLevel,
      target: 'Balanced',
      status: aiData.riskLevel === 'Moderate' ? 'Optimal' : 'Review Needed',
      suggestion: 'Well-balanced for your age group'
    },
    {
      metric: 'Growth Potential',
      value: aiData.growthPotential,
      target: 'High',
      status: aiData.growthPotential === 'High' ? 'Excellent' : 'Good',
      suggestion: 'Tech-heavy portfolio aligns with growth goals'
    }
  ] : []

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Brain className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Investment Advisor</h2>
              <p className="text-gray-300">Powered by machine learning and market analysis</p>
              {lastUpdated && (
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Portfolio Health Dashboard */}
        {portfolioInsights.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {portfolioInsights.map((insight, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-400 text-sm">{insight.metric}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    insight.status === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                    insight.status === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {insight.status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {typeof insight.value === 'number' ? `${insight.value}/100` : insight.value}
                </div>
                <p className="text-gray-400 text-sm">{insight.suggestion}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-white text-lg font-medium mb-2">No portfolio data yet</h4>
              <p className="text-gray-400 text-sm">Upload your bank statement to get AI insights and recommendations</p>
            </div>
          </div>
        )}

        {/* Market Sentiment */}
        {portfolioValue > 0 && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-medium">Market Outlook: Bullish</span>
            </div>
            <p className="text-gray-300 text-sm">
              AI recommendations will appear here based on market analysis and your investment patterns.
            </p>
          </div>
        )}
      </div>

      {/* Investment Recommendations */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Smart Recommendations</h3>
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
            <option value="3m">3 Months</option>
            <option value="1y">1 Year</option>
          </select>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading AI recommendations...</p>
            </div>
          ) : aiData && aiData.recommendations && aiData.recommendations.length > 0 ? (
            aiData.recommendations.map((rec) => (
              <div key={rec.id} className="bg-white/5 rounded-lg p-4 border-l-4 border-blue-500 hover:border-purple-500 transition-all duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-blue-400">
                      {rec.title}
                    </span>
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-sm">
                      {rec.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-medium">{Math.round(rec.confidence * 100)}% confidence</span>
                    </div>
                    <div className="text-gray-400 text-sm">Impact: {rec.impact}</div>
                  </div>
                </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm">{rec.confidence}% Confidence</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm">Risk: {rec.risk}</span>
                  </div>
                  <span className="text-gray-400 text-sm">Timeframe: {rec.timeframe}</span>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-3">{rec.reason}</p>

              <div className="flex space-x-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Analyze Stock
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  View Details
                </button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Learn More
                </button>
              </div>
            </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-white text-lg font-medium mb-2">No recommendations yet</h4>
              <p className="text-gray-400 text-sm">Upload your bank statement to get personalized AI investment recommendations</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Learning Section */}
      {portfolioValue > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h4 className="font-bold text-white">AI Learning Progress</h4>
            </div>
            {aiData && aiData.learningProgress ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Transactions:</span>
                  <span className="text-white font-semibold">{aiData.learningProgress.totalTransactions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Categorized:</span>
                  <span className="text-white font-semibold">{aiData.learningProgress.categorizedTransactions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">AI Accuracy:</span>
                  <span className="text-green-400 font-semibold">{Math.round(aiData.learningProgress.accuracy * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Last Updated:</span>
                  <span className="text-blue-400 font-semibold">{new Date(aiData.learningProgress.lastUpdated).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <RechartsChart 
                type="line"
                height={200}
                series={[{
                  name: 'Model Accuracy',
                  data: [65, 72, 78, 82, 85, 88, 92]
                }]}
              />
            )}
            <p className="text-gray-400 text-sm mt-3">
              Our AI is learning from your investment patterns to provide better recommendations.
            </p>
          </div>

          <div className="glass-card p-6">
            <h4 className="font-bold text-white mb-4">Portfolio Optimization</h4>
            {aiData && aiData.portfolioOptimization ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Allocation</span>
                  <span className="text-white">{aiData.portfolioOptimization.currentAllocation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Suggested Allocation</span>
                  <span className="text-green-400">{aiData.portfolioOptimization.suggestedAllocation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Optimization Score</span>
                  <span className="text-blue-400">{aiData.portfolioOptimization.optimizationScore}/100</span>
                </div>
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Improvements:</h5>
                  <ul className="space-y-1">
                    {aiData.portfolioOptimization.improvements.map((improvement, index) => (
                      <li key={index} className="text-xs text-gray-400"> {improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Allocation</span>
                  <span className="text-white">Tech Heavy</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Suggested Change</span>
                  <span className="text-green-400">0% Healthcare</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Expected Improvement</span>
                  <span className="text-blue-400">0% Returns</span>
                </div>
              </div>
            )}
            <button 
              onClick={() => alert('Portfolio Optimization - This would rebalance your portfolio based on AI recommendations')}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 rounded-lg font-medium mt-4 transition-all duration-200"
            >
              Optimize Portfolio
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-white text-lg font-medium mb-2">AI Learning Ready</h4>
            <p className="text-gray-400 text-sm">Start investing to enable AI learning and portfolio optimization features</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIRecommendations



