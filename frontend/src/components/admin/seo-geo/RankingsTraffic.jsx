import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Globe, ExternalLink, ArrowUpRight, ArrowDownRight, Minus, Info, Search, Link2, BarChart3 } from 'lucide-react'

const RankingsTraffic = () => {
  const { isLightMode } = useTheme()
  const [rankings, setRankings] = useState(null)
  const [traffic, setTraffic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('position')
  const [sortDir, setSortDir] = useState('asc')

  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode
    ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'
  const getTableHeaderClass = () => isLightMode
    ? 'text-gray-500 border-b border-gray-200'
    : 'text-gray-400 border-b border-white/10'
  const getTableRowClass = () => isLightMode
    ? 'border-b border-gray-100 hover:bg-gray-50'
    : 'border-b border-white/5 hover:bg-white/5'

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

      const [rankingsRes, trafficRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/seo-geo/rankings`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/seo-geo/traffic`, { headers })
      ])

      const rankingsJson = await rankingsRes.json()
      const trafficJson = await trafficRes.json()

      if (rankingsJson.success) setRankings(rankingsJson.data)
      if (trafficJson.success) setTraffic(trafficJson.data)
    } catch (err) {
      console.error('Error fetching rankings/traffic:', err)
    } finally {
      setLoading(false)
    }
  }

  const getChangeIcon = (change) => {
    if (change > 0) return <span className="flex items-center gap-0.5 text-green-400"><ArrowUpRight size={14} />{change}</span>
    if (change < 0) return <span className="flex items-center gap-0.5 text-red-400"><ArrowDownRight size={14} />{Math.abs(change)}</span>
    return <span className="flex items-center gap-0.5 text-gray-400"><Minus size={14} />0</span>
  }

  const getPositionBadge = (pos) => {
    if (pos <= 3) return isLightMode ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
    if (pos <= 10) return isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'
    if (pos <= 20) return isLightMode ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/20 text-yellow-400'
    return isLightMode ? 'bg-gray-100 text-gray-600' : 'bg-gray-500/20 text-gray-400'
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'position' ? 'asc' : 'desc')
    }
  }

  const sortedKeywords = () => {
    if (!rankings?.keywords) return []
    return [...rankings.keywords].sort((a, b) => {
      const aVal = a[sortField] || 0
      const bVal = b[sortField] || 0
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className={`${getCardClass()} animate-pulse`}>
            <div className={`h-6 w-48 rounded ${isLightMode ? 'bg-gray-200' : 'bg-white/10'}`} />
            <div className={`h-48 mt-4 rounded ${isLightMode ? 'bg-gray-100' : 'bg-white/5'}`} />
          </div>
        ))}
      </div>
    )
  }

  const dataSource = rankings?.source || traffic?.source || 'demo'

  return (
    <div className="space-y-6">
      {/* Data Source Banner */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${
        dataSource === 'gsc'
          ? isLightMode ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-green-500/10 border border-green-500/20 text-green-400'
          : isLightMode ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
      }`}>
        <Globe size={16} />
        {dataSource === 'gsc'
          ? 'Showing live data from Google Search Console'
          : 'Showing demo data — connect Google Search Console for real metrics'}
      </div>

      {/* Search Performance Chart */}
      {traffic?.time_series && (
        <div className={getCardClass()}>
          <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Search Performance (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={traffic.time_series}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e5e7eb' : '#374151'} />
              <XAxis
                dataKey="date"
                tick={{ fill: isLightMode ? '#6b7280' : '#9ca3af', fontSize: 10 }}
                tickFormatter={(v) => {
                  const parts = v.split('-')
                  return `${parseInt(parts[1] || parts[0])}/${parseInt(parts[2] || parts[1])}`
                }}
              />
              <YAxis yAxisId="left" tick={{ fill: isLightMode ? '#6b7280' : '#9ca3af', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: isLightMode ? '#6b7280' : '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isLightMode ? '#fff' : '#1f2937',
                  border: isLightMode ? '1px solid #e5e7eb' : '1px solid #374151',
                  borderRadius: '8px',
                  color: isLightMode ? '#111' : '#fff'
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} dot={false} name="Clicks" />
              <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#22c55e" strokeWidth={2} dot={false} name="Impressions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        {traffic?.sources && (
          <div className={getCardClass()}>
            <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Traffic Sources</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={traffic.sources}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="source"
                >
                  {traffic.sources.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLightMode ? '#fff' : '#1f2937',
                    border: isLightMode ? '1px solid #e5e7eb' : '1px solid #374151',
                    borderRadius: '8px',
                    color: isLightMode ? '#111' : '#fff'
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Landing Pages */}
        {traffic?.landing_pages && (
          <div className={getCardClass()}>
            <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Top Landing Pages</h3>
            <div className="space-y-3">
              {traffic.landing_pages.map((page, i) => (
                <div key={i} className={`flex items-center justify-between ${isLightMode ? 'border-b border-gray-100 pb-2' : 'border-b border-white/5 pb-2'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${isLightMode ? 'bg-gray-100 text-gray-600 px-2 py-0.5 rounded' : 'bg-white/10 text-gray-400 px-2 py-0.5 rounded'}`}>
                      {page.page}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={getSubtextClass()}>{page.sessions.toLocaleString()} sessions</span>
                    <span className={page.bounce_rate > 50 ? 'text-red-400' : 'text-green-400'}>{page.bounce_rate}% bounce</span>
                    <span className={getSubtextClass()}>{page.avg_duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Keyword Rankings Table */}
      <div className={getCardClass()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${getTextColor()}`}>Keyword Rankings</h3>
          <span className={`text-xs ${getSubtextClass()}`}>{rankings?.keywords?.length || 0} keywords tracked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={getTableHeaderClass()}>
                <th className="text-left py-3 px-3 font-medium cursor-pointer" onClick={() => handleSort('keyword')}>Keyword</th>
                <th className="text-center py-3 px-3 font-medium cursor-pointer" onClick={() => handleSort('position')}>
                  <span className="flex items-center justify-center gap-1">Position {sortField === 'position' && (sortDir === 'asc' ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}</span>
                </th>
                <th className="text-center py-3 px-3 font-medium">Change</th>
                <th className="text-right py-3 px-3 font-medium cursor-pointer" onClick={() => handleSort('impressions')}>Impressions</th>
                <th className="text-right py-3 px-3 font-medium cursor-pointer" onClick={() => handleSort('clicks')}>Clicks</th>
                <th className="text-right py-3 px-3 font-medium cursor-pointer" onClick={() => handleSort('ctr')}>CTR</th>
                <th className="text-left py-3 px-3 font-medium">URL</th>
              </tr>
            </thead>
            <tbody>
              {sortedKeywords().map((kw, i) => (
                <tr key={i} className={getTableRowClass()}>
                  <td className={`py-3 px-3 font-medium ${getTextColor()}`}>
                    <div className="flex items-center gap-2">
                      <Search size={14} className={getSubtextClass()} />
                      {kw.keyword}
                    </div>
                  </td>
                  <td className="text-center py-3 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPositionBadge(kw.position)}`}>
                      #{kw.position}
                    </span>
                  </td>
                  <td className="text-center py-3 px-3 text-xs font-medium">{getChangeIcon(kw.change)}</td>
                  <td className={`text-right py-3 px-3 ${getSubtextClass()}`}>{kw.impressions.toLocaleString()}</td>
                  <td className={`text-right py-3 px-3 ${getTextColor()}`}>{kw.clicks.toLocaleString()}</td>
                  <td className={`text-right py-3 px-3 ${kw.ctr >= 5 ? 'text-green-400' : getSubtextClass()}`}>{kw.ctr}%</td>
                  <td className={`py-3 px-3 ${getSubtextClass()}`}>
                    <span className="text-xs font-mono">{kw.url}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default RankingsTraffic
