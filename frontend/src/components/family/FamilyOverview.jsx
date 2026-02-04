import React, { useState, useEffect } from 'react'
import { DollarSign, Users, TrendingUp, PieChart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import RechartsChart from '../common/RechartsChart'
import CompanyLogo from '../common/CompanyLogo'
import TimeOfDay from '../common/TimeOfDay'
import { useData } from '../../context/DataContext'
import { useTheme } from '../../context/ThemeContext'

const FamilyOverview = ({ user }) => {
  const navigate = useNavigate()
  
  // Helper function to get the correct auth token (demo token takes precedence)
  const getAuthToken = () => {
    return localStorage.getItem('kamioi_demo_token') || 
           localStorage.getItem('kamioi_user_token') || 
           localStorage.getItem('authToken')
  }
  const { portfolioValue, totalRoundUps, transactions } = useData()
  const { isLightMode } = useTheme()
  
  // Family-specific data from API
  const [familyMembers, setFamilyMembers] = useState([])
  const [familyPortfolio, setFamilyPortfolio] = useState({
    total_value: 0,
    total_invested: 0,
    total_gains: 0,
    gain_percentage: 0
  })
  const [familyGoals, setFamilyGoals] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch family data on component mount
  useEffect(() => {
    fetchFamilyData()
  }, [])

  const fetchFamilyData = async () => {
    try {
      setLoading(true)
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      
      // Fetch family members
      const membersResponse = await fetch(`${apiBaseUrl}/api/family/members`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      if (membersResponse.ok) {
        const membersResult = await membersResponse.json()
        if (membersResult.success) {
          setFamilyMembers(membersResult.members || [])
        }
      }
      
      // Fetch family portfolio
      const portfolioResponse = await fetch(`${apiBaseUrl}/api/family/portfolio`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      if (portfolioResponse.ok) {
        const portfolioResult = await portfolioResponse.json()
        if (portfolioResult.success) {
          setFamilyPortfolio(portfolioResult.portfolio || {})
        }
      }
      
      // Fetch family goals
      const goalsResponse = await fetch(`${apiBaseUrl}/api/family/goals`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      if (goalsResponse.ok) {
        const goalsResult = await goalsResponse.json()
        if (goalsResult.success) {
          setFamilyGoals(goalsResult.goals || [])
        }
      }
      
    } catch (error) {
      console.error('Error fetching family data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Safety checks for undefined data
  const safeFamilyPortfolio = familyPortfolio || {}
  const safeTotalValue = safeFamilyPortfolio.total_value || 0
  const safeGainPercentage = safeFamilyPortfolio.gain_percentage || 0
  const safeFamilyMembers = Array.isArray(familyMembers) ? familyMembers : []
  const safeTransactions = Array.isArray(transactions) ? transactions : []
  const holdings = Array.isArray(safeFamilyPortfolio.holdings) ? safeFamilyPortfolio.holdings : []

  // Calculate stats from completed transactions to match transaction page
  const completedTransactions = safeTransactions.filter(t => t.status === 'completed')
  const totalInvested = completedTransactions.reduce((sum, t) => sum + (t.roundUp || t.round_up || 0), 0)
  const completedCount = completedTransactions.length

  const stats = [
    {
      label: 'Family Portfolio Value',
      value: `$${safeTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: safeGainPercentage > 0 ? `+${safeGainPercentage.toFixed(1)}%` : '0.0%',
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      label: 'Family Members',
      value: safeFamilyMembers.length.toString(),
      change: '+0',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      label: 'Monthly Growth',
      value: safeGainPercentage > 0 ? `${safeGainPercentage.toFixed(1)}%` : '0.0%',
      change: safeGainPercentage > 0 ? `+${(safeGainPercentage * 0.25).toFixed(1)}%` : '0.0%',
      icon: TrendingUp,
      color: 'text-purple-400'
    },
    {
      label: 'Total Round-ups',
      value: `$${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${completedCount} invested`,
      icon: PieChart,
      color: 'text-yellow-400'
    }
  ]

  const recentActivity = safeTransactions.length > 0 ? safeTransactions.slice(0, 3).map((transaction, index) => ({
    id: index + 1,
    action: 'Family Round-Up Investment',
    amount: transaction.roundUp || transaction.amount || 0,
    date: transaction.date,
    type: 'investment',
    ticker: transaction.ticker || null,
    companyName: transaction.merchant || transaction.company_name || null
  })) : []

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-white">Loading family data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div data-tutorial="family-welcome">
        <h1 className={`text-3xl font-bold ${getTextClass()} mb-2`}>
          Hello, {user?.name}!
          <TimeOfDay />
        </h1>
        <p className={getSubtextClass()}>Here&apos;s your family investment overview</p>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index} 
              className={`${getCardClass()} cursor-pointer hover:scale-105 transition-transform`}
              onClick={() => navigate('/family/transactions')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>{stat.label}</p>
                  <p className={`text-2xl font-bold ${getTextClass()} mt-1`}>{stat.value}</p>
                  <p className={'text-sm mt-1 ' + stat.color}>{stat.change} this month</p>
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
          <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Family Portfolio Performance</h3>
          {portfolioValue > 0 ? (
            <RechartsChart 
              type="line" 
              height={250}
              data={[
                { name: 'Week 1', value: portfolioValue * 0.8 },
                { name: 'Week 2', value: portfolioValue * 0.85 },
                { name: 'Week 3', value: portfolioValue * 0.9 },
                { name: 'Week 4', value: portfolioValue * 0.95 },
                { name: 'Today', value: portfolioValue }
              ]}
              series={[{ dataKey: 'value', name: 'Family Portfolio Value' }]}
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className={`${getTextClass()} text-lg font-medium mb-2`}>No family performance data yet</h4>
                <p className={`${getSubtextClass()} text-sm`}>Start family investing to see your portfolio performance</p>
              </div>
            </div>
          )}
        </div>

        <div className={getCardClass()}>
          <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Family Asset Allocation</h3>
          {holdings.length > 0 ? (
            <RechartsChart 
              type="donut" 
              height={250}
              data={holdings.map(h => ({ name: h.symbol, value: h.allocation }))}
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PieChart className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className={`${getTextClass()} text-lg font-medium mb-2`}>No family investments yet</h4>
                <p className={`${getSubtextClass()} text-sm`}>Start by uploading your family bank statement to begin round-up investments</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Family Members & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className={getCardClass()} data-tutorial="family-members">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-semibold ${getTextClass()}`}>Family Members</h3>
          </div>
          <div className="space-y-3">
            {safeFamilyMembers.map((member, index) => (
              <div key={index} className={`flex items-center justify-between p-3 ${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg`}>
                <div>
                  <p className={`${getTextClass()} font-medium`}>{member.name}</p>
                  <p className={`${getSubtextClass()} text-sm`}>{member.role}</p>
                </div>
                <div className="text-right">
                  <p className={`${getTextClass()} font-semibold`}>{member.portfolio}</p>
                  <p className={`text-sm ${member.status === 'Active' ? 'text-green-400' : 'text-gray-400'}`}>
                    {member.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={getCardClass()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-semibold ${getTextClass()}`}>Recent Family Activity</h3>
            <button 
              onClick={() => navigate('/family/transactions')}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All →
            </button>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className={`flex items-center justify-between p-3 ${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg cursor-pointer hover:bg-white/10 transition-colors`}
                  onClick={() => navigate('/family/transactions')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg">
                      {activity.ticker ? (
                        <CompanyLogo symbol={activity.ticker} size="sm" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className={`${getTextClass()} font-medium`}>{activity.action}</p>
                      <p className={`${getSubtextClass()} text-sm`}>
                        {activity.ticker || activity.companyName || 'Investment'} • {activity.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-green-400 font-semibold">
                    +${activity.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className={`${getSubtextClass()}`}>No recent family activity</p>
              <p className={`${getSubtextClass()} text-sm mt-2`}>Transactions and investments will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FamilyOverview
