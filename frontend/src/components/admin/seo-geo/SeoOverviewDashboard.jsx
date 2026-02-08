import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts'
import {
  Globe,
  FileText,
  BarChart3,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Bot,
  Lightbulb,
  RefreshCw,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Circular Score Gauge (custom SVG)
// ---------------------------------------------------------------------------
const CircularGauge = ({ score, label, size = 140, strokeWidth = 10 }) => {
  const [animatedOffset, setAnimatedOffset] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference - (score / 100) * circumference

  useEffect(() => {
    // Start fully "empty" then animate to the target
    setAnimatedOffset(circumference)
    const raf = requestAnimationFrame(() => {
      // Allow a single frame so the browser registers the initial value
      requestAnimationFrame(() => {
        setAnimatedOffset(targetOffset)
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [score, circumference, targetOffset])

  const getScoreColor = (s) => {
    if (s >= 80) return { stroke: '#22c55e', text: 'text-green-400', bg: 'rgba(34,197,94,0.15)' }
    if (s >= 50) return { stroke: '#eab308', text: 'text-yellow-400', bg: 'rgba(234,179,8,0.15)' }
    return { stroke: '#ef4444', text: 'text-red-400', bg: 'rgba(239,68,68,0.15)' }
  }

  const colors = getScoreColor(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/10"
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Score number overlay */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">/ 100</span>
      </div>
      <span className="text-sm font-medium text-center leading-tight mt-1 text-white">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------
const SkeletonLoader = ({ cardClass }) => (
  <div className="space-y-6 animate-pulse">
    {/* Gauge skeletons */}
    <div className={cardClass}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="w-[140px] h-[140px] rounded-full bg-white/10" />
            <div className="h-4 w-24 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
    {/* Chart skeleton */}
    <div className={cardClass}>
      <div className="h-5 w-48 bg-white/10 rounded mb-4" />
      <div className="h-[300px] bg-white/5 rounded-xl" />
    </div>
    {/* Bar chart skeleton */}
    <div className={cardClass}>
      <div className="h-5 w-40 bg-white/10 rounded mb-4" />
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-white/5 rounded-lg" />
        ))}
      </div>
    </div>
    {/* Stats grid skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className={cardClass}>
          <div className="h-4 w-10 bg-white/10 rounded mb-3" />
          <div className="h-8 w-16 bg-white/10 rounded mb-2" />
          <div className="h-3 w-24 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  </div>
)

// ---------------------------------------------------------------------------
// Custom Recharts Tooltip
// ---------------------------------------------------------------------------
const CustomTooltip = ({ active, payload, label, isLightMode }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className={`rounded-xl px-4 py-3 shadow-xl text-sm border ${
        isLightMode
          ? 'bg-white border-gray-200 text-gray-800'
          : 'bg-gray-900/95 border-white/10 text-white'
      }`}
    >
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-xs" style={{ color: entry.color }}>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const SeoOverviewDashboard = () => {
  const { isLightMode } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [gscStatus, setGscStatus] = useState(null)

  // Theme helpers
  const getTextColor = () => (isLightMode ? 'text-gray-800' : 'text-white')
  const getSubtextClass = () => (isLightMode ? 'text-gray-600' : 'text-gray-400')
  const getCardClass = () =>
    isLightMode
      ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
      : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'

  // -----------------------------------------------------------------------
  // Fetch data
  // -----------------------------------------------------------------------
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const token =
        localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'

      const response = await fetch(`${apiBaseUrl}/api/admin/seo-geo/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result = await response.json()
      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        throw new Error(result.error || 'Unknown API error')
      }
    } catch (err) {
      console.error('SeoOverviewDashboard fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Fetch GSC connection status
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
    const tkn = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
    fetch(`${apiBaseUrl}/api/admin/seo-geo/gsc-status`, {
      headers: { 'Authorization': `Bearer ${tkn}`, 'Content-Type': 'application/json' }
    })
      .then(r => r.json())
      .then(json => { if (json.success) setGscStatus(json.data) })
      .catch(() => {})
  }, [fetchData])

  // Dispatch page load event
  useEffect(() => {
    if (data && !loading) {
      const timer = setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('admin-page-load-complete', {
            detail: { pageId: 'seo-geo-overview', loadTime: 150 },
          })
        )
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [data, loading])

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (loading) {
    return <SkeletonLoader cardClass={getCardClass()} />
  }

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------
  if (error && !data) {
    return (
      <div className={`${getCardClass()} text-center py-16`}>
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
          Failed to load SEO overview
        </h3>
        <p className={`${getSubtextClass()} mb-6 text-sm`}>{error}</p>
        <button
          onClick={() => fetchData()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------
  const scores = [
    { value: data?.overall_seo_score ?? 0, label: 'Overall SEO Score' },
    { value: data?.technical_health_score ?? 0, label: 'Technical Health' },
    { value: data?.content_quality_score ?? 0, label: 'Content Quality' },
    { value: data?.geo_readiness_score ?? 0, label: 'GEO Readiness' },
  ]

  // Score history for area chart
  const scoreHistory = (data?.score_history || []).map((entry) => ({
    ...entry,
    audit_date: entry.audit_date,
    Overall: entry.overall_score,
    Technical: entry.technical_score,
    Content: entry.content_score,
    GEO: entry.geo_score,
  }))

  // Issues by category for bar chart
  const issueCategories = data?.issues_by_category || {}
  const issueBarData = Object.entries(issueCategories).map(([category, severities]) => ({
    category: category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    critical: severities?.critical || 0,
    warning: severities?.warning || 0,
    info: severities?.info || 0,
    total: (severities?.critical || 0) + (severities?.warning || 0) + (severities?.info || 0),
  }))

  // Quick stats
  const qs = data?.quick_stats || {}
  const formatLastAudit = (iso) => {
    if (!iso) return 'N/A'
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHrs = Math.floor(diffMins / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    const diffDays = Math.floor(diffHrs / 24)
    return `${diffDays}d ago`
  }

  const quickStats = [
    { icon: Globe, value: qs.pages_in_sitemap ?? '-', label: 'Pages in Sitemap', color: 'text-blue-400' },
    { icon: AlertTriangle, value: qs.pages_with_issues ?? '-', label: 'Pages with Issues', color: 'text-red-400' },
    { icon: FileText, value: qs.blog_posts_analyzed ?? '-', label: 'Blog Posts Analyzed', color: 'text-purple-400' },
    { icon: BarChart3, value: qs.avg_blog_seo_score ?? '-', label: 'Avg Blog SEO Score', color: 'text-emerald-400' },
    { icon: Search, value: qs.schema_types_active ?? '-', label: 'Schema Types Active', color: 'text-cyan-400' },
    { icon: Bot, value: qs.ai_crawlers_allowed ?? '-', label: 'AI Crawlers Allowed', color: 'text-indigo-400' },
    { icon: Lightbulb, value: qs.open_recommendations ?? '-', label: 'Open Recommendations', color: 'text-amber-400' },
    { icon: Clock, value: formatLastAudit(qs.last_audit), label: 'Last Audit', color: 'text-teal-400' },
  ]

  // Chart colours
  const areaColors = {
    Overall: '#3b82f6',
    Technical: '#22c55e',
    Content: '#a855f7',
    GEO: '#f59e0b',
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Header row with refresh                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: isLightMode ? '#1f2937' : '#ffffff' }}>SEO & GEO Overview</h2>
          <p className="text-sm mt-0.5" style={{ color: isLightMode ? '#4b5563' : '#9ca3af' }}>
            Consolidated view of search optimization health
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isLightMode
              ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              : 'bg-white/10 border border-white/10 text-gray-300 hover:bg-white/20'
          } ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* GSC Connection Status                                             */}
      {/* ----------------------------------------------------------------- */}
      {gscStatus && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm ${
          gscStatus.connected
            ? isLightMode ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'
            : isLightMode ? 'bg-yellow-50 border border-yellow-200' : 'bg-yellow-500/10 border border-yellow-500/20'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${gscStatus.connected ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span style={{ color: isLightMode ? '#374151' : '#d1d5db' }}>
            {gscStatus.connected
              ? <>Google Search Console connected — <strong>{gscStatus.site_url}</strong></>
              : 'Google Search Console not connected — showing demo data'}
          </span>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Circular Score Gauges                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className={getCardClass()}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {scores.map((s) => (
            <div key={s.label} className="relative flex items-center justify-center">
              <CircularGauge score={s.value} label={s.label} />
            </div>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SEO Health Trend (Area Chart)                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-4`}>SEO Health Trend</h3>
        {scoreHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={scoreHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                {Object.entries(areaColors).map(([key, color]) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isLightMode ? '#e5e7eb' : 'rgba(255,255,255,0.06)'}
              />
              <XAxis
                dataKey="audit_date"
                tick={{ fill: isLightMode ? '#6b7280' : '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  const d = new Date(v + 'T00:00:00')
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: isLightMode ? '#6b7280' : '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip isLightMode={isLightMode} />} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                iconSize={8}
              />
              {Object.entries(areaColors).map(([key, color]) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: color }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className={getSubtextClass()}>No history data available yet.</p>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Issues by Category (Horizontal Stacked Bar Chart)                 */}
      {/* ----------------------------------------------------------------- */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-4`}>Issues by Category</h3>
        {issueBarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={issueBarData}
              layout="vertical"
              margin={{ top: 5, right: 30, bottom: 5, left: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isLightMode ? '#e5e7eb' : 'rgba(255,255,255,0.06)'}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: isLightMode ? '#6b7280' : '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fill: isLightMode ? '#6b7280' : '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip content={<CustomTooltip isLightMode={isLightMode} />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="critical" stackId="issues" name="Critical" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="warning" stackId="issues" name="Warning" fill="#eab308" radius={[0, 0, 0, 0]} />
              <Bar dataKey="info" stackId="issues" name="Info" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px]">
            <div className="text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p className={getSubtextClass()}>No issues detected.</p>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Quick Stat Cards (4x2 grid)                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={`${getCardClass()} flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-200`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isLightMode ? 'bg-gray-100' : 'bg-white/10'
              }`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${getTextColor()}`}>{stat.value}</p>
                <p className={`text-xs mt-0.5 ${getSubtextClass()}`}>{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SeoOverviewDashboard
