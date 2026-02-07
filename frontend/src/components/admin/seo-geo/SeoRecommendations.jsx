import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Lightbulb, CheckCircle, XCircle, AlertTriangle, AlertOctagon, Info, Filter, ArrowUpRight, Clock, Wrench, Code, Brain, Zap, ChevronDown, ChevronUp, Copy, Download, Check } from 'lucide-react'

const SeoRecommendations = () => {
  const { isLightMode } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [copied, setCopied] = useState(false)

  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode
    ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
      const res = await fetch(`${apiBaseUrl}/api/admin/seo-geo/recommendations`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch (err) {
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
      await fetch(`${apiBaseUrl}/api/admin/seo-geo/recommendations/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      fetchData()
    } catch (err) {
      console.error(`Error ${action} recommendation:`, err)
    }
  }

  const getPriorityConfig = (priority) => {
    const configs = {
      critical: {
        label: 'Critical',
        bg: isLightMode ? 'bg-red-100 text-red-700 border-red-200' : 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: AlertOctagon,
        color: 'text-red-400'
      },
      important: {
        label: 'Important',
        bg: isLightMode ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: AlertTriangle,
        color: 'text-yellow-400'
      },
      nice_to_have: {
        label: 'Nice to Have',
        bg: isLightMode ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: Info,
        color: 'text-blue-400'
      }
    }
    return configs[priority] || configs.nice_to_have
  }

  const getCategoryConfig = (category) => {
    const configs = {
      technical: { label: 'Technical SEO', icon: Wrench, color: 'text-blue-400' },
      content: { label: 'Content Quality', icon: Lightbulb, color: 'text-green-400' },
      structured_data: { label: 'Structured Data', icon: Code, color: 'text-purple-400' },
      geo: { label: 'GEO / AI', icon: Brain, color: 'text-cyan-400' },
      performance: { label: 'Performance', icon: Zap, color: 'text-yellow-400' }
    }
    return configs[category] || configs.technical
  }

  const getImpactBadge = (impact) => {
    const styles = {
      high: isLightMode ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400',
      medium: isLightMode ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/20 text-yellow-400',
      low: isLightMode ? 'bg-gray-100 text-gray-600' : 'bg-gray-500/20 text-gray-400'
    }
    return styles[impact] || styles.medium
  }

  const filteredRecs = () => {
    if (!data?.recommendations) return []
    let recs = data.recommendations.filter(r => r.status === 'open')
    if (filter !== 'all') recs = recs.filter(r => r.priority === filter)
    return recs
  }

  const groupByCategory = () => {
    const groups = {}
    filteredRecs().forEach(rec => {
      if (!groups[rec.category]) groups[rec.category] = []
      groups[rec.category].push(rec)
    })
    return groups
  }

  // Generate progress data for chart
  const progressData = () => {
    const base = new Date()
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(base)
      d.setDate(d.getDate() - i)
      days.push({
        date: d.toISOString().split('T')[0],
        open: Math.max(5, 25 - Math.floor(i * 0.3) + Math.floor(Math.random() * 3)),
        resolved: Math.min(20, 2 + Math.floor(i * 0.4) + Math.floor(Math.random() * 2))
      })
    }
    return days
  }

  const formatRecommendationsText = () => {
    const recs = filteredRecs()
    const grouped = {}
    recs.forEach(rec => {
      if (!grouped[rec.category]) grouped[rec.category] = []
      grouped[rec.category].push(rec)
    })

    let text = `SEO & GEO Recommendations Report\n`
    text += `Generated: ${new Date().toLocaleDateString()}\n`
    text += `Filter: ${filter === 'all' ? 'All' : filter}\n`
    text += `Total Open: ${recs.length}\n`
    text += `${'='.repeat(60)}\n\n`

    Object.entries(grouped).forEach(([category, items]) => {
      const catConfig = getCategoryConfig(category)
      text += `${catConfig.label} (${items.length})\n`
      text += `${'-'.repeat(40)}\n`
      items.forEach(rec => {
        const prioConfig = getPriorityConfig(rec.priority)
        text += `  [${prioConfig.label}] [${rec.impact} impact] ${rec.title}\n`
        text += `    ${rec.description}\n`
        if (rec.affected_pages?.length > 0) {
          text += `    Pages: ${rec.affected_pages.join(', ')}\n`
        }
        text += `\n`
      })
    })

    return text
  }

  const handleCopyToClipboard = async () => {
    const text = formatRecommendationsText()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleExportFile = () => {
    const text = formatRecommendationsText()
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-recommendations-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'important', label: 'Important' },
    { id: 'nice_to_have', label: 'Nice to Have' }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className={`${getCardClass()} animate-pulse`}>
            <div className={`h-6 w-48 rounded ${isLightMode ? 'bg-gray-200' : 'bg-white/10'}`} />
            <div className={`h-24 mt-4 rounded ${isLightMode ? 'bg-gray-100' : 'bg-white/5'}`} />
          </div>
        ))}
      </div>
    )
  }

  if (!data) return null

  const grouped = groupByCategory()

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: data.summary?.total || 0, color: 'text-blue-400' },
          { label: 'Critical', value: data.summary?.critical || 0, color: 'text-red-400' },
          { label: 'Important', value: data.summary?.important || 0, color: 'text-yellow-400' },
          { label: 'Resolved', value: data.summary?.resolved || 0, color: 'text-green-400' },
          { label: 'Open', value: data.summary?.open || 0, color: 'text-orange-400' },
        ].map((stat, i) => (
          <div key={i} className={getCardClass()}>
            <p className={`text-xs ${getSubtextClass()}`}>{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Progress Chart */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Resolution Progress</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={progressData()}>
            <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e5e7eb' : '#374151'} />
            <XAxis dataKey="date" tick={{ fill: isLightMode ? '#6b7280' : '#9ca3af', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: isLightMode ? '#6b7280' : '#9ca3af', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: isLightMode ? '#fff' : '#1f2937', border: isLightMode ? '1px solid #e5e7eb' : '1px solid #374151', borderRadius: '8px', color: isLightMode ? '#111' : '#fff' }} />
            <Area type="monotone" dataKey="resolved" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Resolved" />
            <Area type="monotone" dataKey="open" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Open" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Filter Tabs + Export Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === tab.id
                  ? isLightMode
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                  : isLightMode
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tab.label}
              {tab.id !== 'all' && (
                <span className="ml-1 text-xs opacity-75">
                  ({data.summary?.[tab.id] || 0})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyToClipboard}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              copied
                ? isLightMode
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
                : isLightMode
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
            title="Copy all recommendations to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy All'}
          </button>
          <button
            onClick={handleExportFile}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isLightMode
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
            title="Export recommendations as text file"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Recommendations by Category */}
      {Object.keys(grouped).length === 0 ? (
        <div className={`${getCardClass()} text-center py-12`}>
          <CheckCircle size={48} className="mx-auto mb-4 text-green-400 opacity-50" />
          <p className={`text-lg font-medium ${getTextColor()}`}>No open recommendations</p>
          <p className={`text-sm mt-1 ${getSubtextClass()}`}>
            {filter !== 'all' ? 'Try a different filter' : 'Run an audit to generate recommendations'}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, recs]) => {
          const catConfig = getCategoryConfig(category)
          const CatIcon = catConfig.icon
          const isExpanded = expandedCategory === null || expandedCategory === category

          return (
            <div key={category} className={getCardClass()}>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              >
                <div className="flex items-center gap-3">
                  <CatIcon size={20} className={catConfig.color} />
                  <h3 className={`text-lg font-semibold ${getTextColor()}`}>{catConfig.label}</h3>
                  <span className={`text-sm ${getSubtextClass()}`}>({recs.length})</span>
                </div>
                {isExpanded ? <ChevronUp size={18} className={getSubtextClass()} /> : <ChevronDown size={18} className={getSubtextClass()} />}
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-3">
                  {recs.map((rec) => {
                    const prioConfig = getPriorityConfig(rec.priority)
                    const PrioIcon = prioConfig.icon

                    return (
                      <div key={rec.id} className={`${isLightMode ? 'bg-gray-50 rounded-xl p-4 border border-gray-100' : 'bg-white/5 rounded-xl p-4 border border-white/10'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <PrioIcon size={18} className={`${prioConfig.color} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${getTextColor()}`}>{rec.title}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${prioConfig.bg}`}>
                                  {prioConfig.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getImpactBadge(rec.impact)}`}>
                                  {rec.impact} impact
                                </span>
                              </div>
                              <p className={`text-xs mt-1 ${getSubtextClass()}`}>{rec.description}</p>
                              {rec.affected_pages?.length > 0 && (
                                <div className="flex items-center gap-1 mt-2 flex-wrap">
                                  {rec.affected_pages.map((page, i) => (
                                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${isLightMode ? 'bg-gray-200 text-gray-600' : 'bg-white/10 text-gray-400'}`}>
                                      {page}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleAction(rec.id, 'resolve')}
                              className={`p-1.5 rounded-lg transition-colors ${isLightMode ? 'hover:bg-green-100 text-green-600' : 'hover:bg-green-500/20 text-green-400'}`}
                              title="Mark as resolved"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleAction(rec.id, 'dismiss')}
                              className={`p-1.5 rounded-lg transition-colors ${isLightMode ? 'hover:bg-gray-200 text-gray-500' : 'hover:bg-white/10 text-gray-500'}`}
                              title="Dismiss"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default SeoRecommendations
