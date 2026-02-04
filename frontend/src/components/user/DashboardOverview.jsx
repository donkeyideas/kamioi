import React from 'react'
import { DollarSign, TrendingUp, PieChart, BarChart3, Users } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import RechartsChart from '../common/RechartsChart'
import CompanyLogo from '../common/CompanyLogo'
import TimeOfDay from '../common/TimeOfDay'
import { useData } from '../../context/DataContext'
import { useTheme } from '../../context/ThemeContext'
import { formatCurrency, formatNumber } from '../../utils/formatters'

// Helper function to format date as MM/DD/YYYY
const formatDate = (dateString) => {
  if (!dateString || dateString === 'No activity yet') return dateString
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

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

const DashboardOverview = ({ user }) => {
  const navigate = useNavigate()
  const location = useLocation()
  // useData now returns default values if context not available, so this is safe
  const { portfolioValue = 0, portfolioStats, holdings = [], transactions = [] } = useData()
  const { isLightMode } = useTheme()

  // Check if in demo mode based on current path
  const isDemoMode = location.pathname.includes('/demo/')
  const transactionsPath = isDemoMode ? '/demo/user/transactions' : '/dashboard/transactions'

  // Calculate stats from actual transaction data to match transaction page
  const completedTransactions = transactions.filter(t => t.status === 'completed')
  const totalInvested = completedTransactions.reduce((sum, t) => sum + (t.roundUp || t.round_up || 0), 0)
  const completedCount = completedTransactions.length

  // Use portfolioStats for gain/growth data (calculated from holdings)
  const gainPct = portfolioStats?.gainPercentage || 0
  const todayGainPct = portfolioStats?.todayGainPct || 0
  const totalGain = portfolioStats?.totalGain || 0

  const stats = [
    {
      label: 'Portfolio Value',
      value: formatCurrency(portfolioValue),
      change: `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(1)}% all time`,
      icon: DollarSign,
      color: gainPct >= 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      label: 'Today\'s Change',
      value: `${todayGainPct >= 0 ? '+' : ''}${todayGainPct.toFixed(2)}%`,
      change: `${todayGainPct >= 0 ? '+' : ''}${formatCurrency(portfolioValue * todayGainPct / 100)}`,
      icon: TrendingUp,
      color: todayGainPct >= 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      label: 'Active Investments',
      value: formatNumber(holdings.length),
      change: `${holdings.length} stocks`,
      icon: PieChart,
      color: 'text-purple-400'
    },
    {
      label: 'Total Round-ups',
      value: formatCurrency(totalInvested),
      change: `${completedCount} invested`,
      icon: Users,
      color: 'text-yellow-400'
    }
  ]

  const recentActivity = (transactions && transactions.length > 0) ? transactions.slice(0, 3).map((transaction, index) => ({
    id: index + 1,
    action: 'Round-Up Investment',
    amount: transaction.roundUp || 0,
    date: transaction.date,
    type: 'investment',
    company: transaction.ticker || 'Unknown',
    companyName: transaction.merchant || 'Unknown Company'
  })) : [
    { id: 1, action: 'Round-Up Investment', amount: 0, date: 'No activity yet', type: 'investment', company: null, companyName: null }
  ]

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

  return (
    <div className="space-y-6">
      <div data-tutorial="welcome-banner">
        <h1 className={`text-3xl font-bold ${getTextClass()} mb-2`}>
          Hello, {user?.name}!
          <TimeOfDay />
        </h1>
        <p className={getSubtextClass()}>Here&apos;s your investment overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index} 
              className={`${getCardClass()} cursor-pointer hover:scale-105 transition-transform`}
              onClick={() => navigate(transactionsPath)}
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
          <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Portfolio Performance</h3>
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
                <h4 className={`${getTextClass()} text-lg font-medium mb-2`}>No performance data yet</h4>
                <p className={`${getSubtextClass()} text-sm`}>Start investing to see your portfolio performance</p>
              </div>
            </div>
          )}
        </div>

        <div className={getCardClass()}>
          <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Asset Allocation</h3>
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
                <h4 className={`${getTextClass()} text-lg font-medium mb-2`}>No investments yet</h4>
                <p className={`${getSubtextClass()} text-sm`}>Start by uploading your bank statement to begin round-up investments</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className={getCardClass()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-semibold ${getTextClass()}`}>Recent Activity</h3>
          <button
            onClick={() => navigate(transactionsPath)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View All →
          </button>
        </div>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-center justify-between p-3 ${isLightMode ? 'bg-gray-100' : 'bg-white/5'} rounded-lg cursor-pointer hover:bg-white/10 transition-colors`}
              onClick={() => navigate(transactionsPath)}
            >
              <div className="flex items-center space-x-3">
                {activity.company && (
                  <div className="w-8 h-8 flex items-center justify-center bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg">
                    <CompanyLogo symbol={activity.company} size="sm" clickable={false} />
                  </div>
                )}
                <div>
                  <p className={`${getTextClass()} font-medium`}>
                    {activity.action} {activity.company && `in ${activity.company}`}
                  </p>
                  <p className={`${getSubtextClass()} text-sm`}>{formatDate(activity.date)}</p>
                </div>
              </div>
              <div className="text-green-400 font-semibold">
                +{formatCurrency(activity.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview
