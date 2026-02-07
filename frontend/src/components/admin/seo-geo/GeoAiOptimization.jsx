import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import {
  Brain,
  Bot,
  Shield,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Search,
  Globe,
  HelpCircle,
  Sparkles,
  Eye
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'

const GeoAiOptimization = () => {
  const { isLightMode } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () =>
    isLightMode
      ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
      : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token =
          localStorage.getItem('kamioi_admin_token') ||
          localStorage.getItem('authToken')

        const response = await fetch(`${API_BASE_URL}/api/admin/seo-geo/geo-analysis`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        setData(result.data)
      } catch (err) {
        console.error('GeoAiOptimization fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // ---------------------------------------------------------------------------
  // Score color helpers
  // ---------------------------------------------------------------------------
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return isLightMode ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
    if (score >= 50) return isLightMode ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'
    return isLightMode ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
  }

  const getProgressBarColor = (score, max) => {
    const pct = (score / max) * 100
    if (pct >= 80) return 'bg-emerald-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getGaugeStrokeColor = (score) => {
    if (score >= 80) return '#10b981'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className={getCardClass()}>
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className={getSubtextClass()}>Analyzing AI search readiness...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className={getCardClass()}>
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle size={40} className="text-red-400" />
              <p className={getSubtextClass()}>Failed to load GEO analysis: {error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const {
    geo_score,
    score_breakdown,
    crawler_monitor,
    page_ai_readiness,
    faq_coverage,
    ai_search_simulation
  } = data

  // ---------------------------------------------------------------------------
  // Breakdown rows ordering
  // ---------------------------------------------------------------------------
  const breakdownRows = [
    { key: 'ai_crawler_access', label: 'AI Crawler Access', icon: Shield },
    { key: 'structured_data_coverage', label: 'Structured Data Coverage', icon: Globe },
    { key: 'content_clarity', label: 'Content Clarity', icon: Eye },
    { key: 'faq_coverage', label: 'FAQ Coverage', icon: HelpCircle },
    { key: 'citation_readiness', label: 'Citation Readiness', icon: MessageSquare },
    { key: 'freshness', label: 'Freshness', icon: Sparkles }
  ]

  // Sort pages by overall score descending
  const sortedPages = [...(page_ai_readiness || [])].sort(
    (a, b) => (b.overall ?? 0) - (a.overall ?? 0)
  )

  // ---------------------------------------------------------------------------
  // Confidence badge
  // ---------------------------------------------------------------------------
  const getConfidenceBadge = (confidence) => {
    const map = {
      high: {
        bg: isLightMode ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        label: 'High'
      },
      medium: {
        bg: isLightMode ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        label: 'Medium'
      },
      low: {
        bg: isLightMode ? 'bg-red-100 text-red-700 border-red-200' : 'bg-red-500/20 text-red-400 border-red-500/30',
        label: 'Low'
      }
    }
    const entry = map[confidence] || map.medium
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${entry.bg}`}>
        {entry.label}
      </span>
    )
  }

  // ---------------------------------------------------------------------------
  // SVG Circular Gauge
  // ---------------------------------------------------------------------------
  const renderGauge = () => {
    const radius = 90
    const stroke = 12
    const normalizedRadius = radius - stroke / 2
    const circumference = 2 * Math.PI * normalizedRadius
    const pct = Math.min(geo_score / 100, 1)
    const offset = circumference - pct * circumference
    const color = getGaugeStrokeColor(geo_score)

    return (
      <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke={isLightMode ? '#e5e7eb' : 'rgba(255,255,255,0.1)'}
          strokeWidth={stroke}
        />
        {/* Score arc */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.2s ease-out',
          }}
        />
      </svg>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Section A: GEO Readiness Score                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className={getCardClass()}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-xl ${isLightMode ? 'bg-purple-100' : 'bg-purple-500/20'}`}>
            <Brain size={22} className={isLightMode ? 'text-purple-600' : 'text-purple-400'} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${getTextColor()}`}>GEO Readiness Score</h2>
            <p className={`text-xs ${getSubtextClass()}`}>
              How well your site is optimized for AI-powered search engines
            </p>
          </div>
        </div>

        {/* Gauge + Breakdown */}
        <div className="flex flex-col lg:flex-row items-center gap-10">
          {/* Circular Gauge */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            {renderGauge()}
            {/* Center text (overlaid) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold ${getScoreColor(geo_score)}`}>
                {geo_score}
              </span>
              <span className={`text-xs font-medium ${getSubtextClass()}`}>/ 100</span>
            </div>
          </div>

          {/* Score Breakdown Table */}
          <div className="flex-1 w-full">
            <div className="space-y-3">
              {breakdownRows.map(({ key, label, icon: Icon }) => {
                const entry = score_breakdown?.[key]
                if (!entry) return null
                const pct = (entry.score / entry.max) * 100
                return (
                  <div key={key} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={getSubtextClass()} />
                        <span className={`text-sm font-medium ${getTextColor()}`}>{label}</span>
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor((pct / 100) * 100)}`}>
                        {entry.score}/{entry.max}
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className={`w-full h-2 rounded-full ${isLightMode ? 'bg-gray-200' : 'bg-white/10'}`}>
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ease-out ${getProgressBarColor(entry.score, entry.max)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {entry.detail && (
                      <p className={`text-xs mt-0.5 ${getSubtextClass()} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {entry.detail}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section B: AI Crawler Access Monitor                                */}
      {/* ------------------------------------------------------------------ */}
      <div className={getCardClass()}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-xl ${isLightMode ? 'bg-blue-100' : 'bg-blue-500/20'}`}>
            <Bot size={22} className={isLightMode ? 'text-blue-600' : 'text-blue-400'} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${getTextColor()}`}>AI Crawler Access Monitor</h2>
            <p className={`text-xs ${getSubtextClass()}`}>
              robots.txt and server-level access for AI crawlers
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isLightMode ? 'border-gray-200' : 'border-white/10'}`}>
                {['Bot Name', 'User-Agent', 'Owner', 'Status', 'Pages Accessible'].map((col) => (
                  <th
                    key={col}
                    className={`text-left py-3 px-4 font-semibold ${getSubtextClass()} text-xs uppercase tracking-wider`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(crawler_monitor || []).map((bot, idx) => (
                <tr
                  key={idx}
                  className={`border-b last:border-0 transition-colors ${
                    isLightMode
                      ? 'border-gray-100 hover:bg-gray-50'
                      : 'border-white/5 hover:bg-white/5'
                  }`}
                >
                  <td className={`py-3 px-4 font-medium ${getTextColor()}`}>{bot.name}</td>
                  <td className={`py-3 px-4 ${getSubtextClass()} font-mono text-xs`}>{bot.user_agent}</td>
                  <td className={`py-3 px-4 ${getSubtextClass()}`}>{bot.owner}</td>
                  <td className="py-3 px-4">
                    {bot.allowed ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isLightMode
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        <CheckCircle size={12} />
                        Allowed
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isLightMode
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        <Shield size={12} />
                        Blocked
                      </span>
                    )}
                  </td>
                  <td className={`py-3 px-4 font-medium ${getTextColor()}`}>{bot.pages_accessible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section C: Page AI-Readiness Scores                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className={getCardClass()}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-xl ${isLightMode ? 'bg-cyan-100' : 'bg-cyan-500/20'}`}>
            <Eye size={22} className={isLightMode ? 'text-cyan-600' : 'text-cyan-400'} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${getTextColor()}`}>Page AI-Readiness Scores</h2>
            <p className={`text-xs ${getSubtextClass()}`}>
              Per-page analysis of how readable and citable your content is for AI
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isLightMode ? 'border-gray-200' : 'border-white/10'}`}>
                {['Page', 'Clarity', 'Factual Density', 'Structure Quality', 'Citation Strength', 'Freshness (days)', 'Overall'].map((col) => (
                  <th
                    key={col}
                    className={`text-left py-3 px-4 font-semibold ${getSubtextClass()} text-xs uppercase tracking-wider`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPages.map((page, idx) => (
                <tr
                  key={idx}
                  className={`border-b last:border-0 transition-colors ${
                    isLightMode
                      ? 'border-gray-100 hover:bg-gray-50'
                      : 'border-white/5 hover:bg-white/5'
                  }`}
                >
                  <td className={`py-3 px-4 ${getTextColor()}`}>
                    <div className="font-medium">{page.page_name}</div>
                    <div className={`text-xs ${getSubtextClass()} font-mono`}>{page.url}</div>
                  </td>
                  {[
                    page.clarity_score,
                    page.factual_density,
                    page.structure_quality,
                    page.citation_strength
                  ].map((score, sIdx) => (
                    <td key={sIdx} className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold ${getScoreBg(score)}`}>
                        {score}
                      </span>
                    </td>
                  ))}
                  <td className={`py-3 px-4 ${getSubtextClass()} font-medium`}>
                    {page.freshness_days}d
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-12 h-8 rounded-xl text-sm font-extrabold ${getScoreBg(page.overall)}`}>
                      {page.overall}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section D: FAQ Schema Coverage                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className={getCardClass()}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-xl ${isLightMode ? 'bg-amber-100' : 'bg-amber-500/20'}`}>
            <HelpCircle size={22} className={isLightMode ? 'text-amber-600' : 'text-amber-400'} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${getTextColor()}`}>FAQ Schema Coverage</h2>
            <p className={`text-xs ${getSubtextClass()}`}>
              Pages with and without structured FAQ data for rich results
            </p>
          </div>
        </div>

        {/* Total questions stat */}
        <div className={`mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
          isLightMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/20'
        }`}>
          <MessageSquare size={16} className={isLightMode ? 'text-blue-600' : 'text-blue-400'} />
          <span className={`text-sm font-semibold ${isLightMode ? 'text-blue-700' : 'text-blue-300'}`}>
            {faq_coverage?.total_questions ?? 0} total FAQ questions across all pages
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pages WITH FAQ schema */}
          <div>
            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${getTextColor()}`}>
              <CheckCircle size={16} className="text-emerald-400" />
              Pages with FAQ Schema
            </h3>
            <div className="space-y-2">
              {(faq_coverage?.pages_with_faq || []).map((page, idx) => {
                const pageName = typeof page === 'string' ? page : page.name
                const questionCount = typeof page === 'object' ? page.question_count : null
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
                      isLightMode ? 'bg-emerald-50 border border-emerald-100' : 'bg-emerald-500/10 border border-emerald-500/15'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span className={`text-sm font-medium ${getTextColor()}`}>{pageName}</span>
                    </div>
                    {questionCount != null && (
                      <span className={`text-xs font-semibold ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`}>
                        {questionCount} questions
                      </span>
                    )}
                  </div>
                )
              })}
              {(faq_coverage?.pages_with_faq || []).length === 0 && (
                <p className={`text-sm italic ${getSubtextClass()}`}>No pages with FAQ schema found</p>
              )}
            </div>
          </div>

          {/* Pages NEEDING FAQ schema */}
          <div>
            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${getTextColor()}`}>
              <AlertTriangle size={16} className="text-amber-400" />
              Pages Needing FAQ Schema
            </h3>
            <div className="space-y-2">
              {(faq_coverage?.pages_needing_faq || []).map((page, idx) => {
                const pageName = typeof page === 'string' ? page : page.name
                const recommendation = typeof page === 'object' ? page.recommendation : null
                return (
                  <div
                    key={idx}
                    className={`px-4 py-2.5 rounded-xl ${
                      isLightMode ? 'bg-amber-50 border border-amber-100' : 'bg-amber-500/10 border border-amber-500/15'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className={`text-sm font-medium ${getTextColor()}`}>{pageName}</span>
                    </div>
                    {recommendation && (
                      <p className={`text-xs mt-1 ml-6 ${getSubtextClass()}`}>{recommendation}</p>
                    )}
                  </div>
                )
              })}
              {(faq_coverage?.pages_needing_faq || []).length === 0 && (
                <p className={`text-sm italic ${getSubtextClass()}`}>All pages have FAQ schema</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section E: AI Search Simulation                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className={getCardClass()}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-xl ${isLightMode ? 'bg-indigo-100' : 'bg-indigo-500/20'}`}>
            <Search size={22} className={isLightMode ? 'text-indigo-600' : 'text-indigo-400'} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${getTextColor()}`}>AI Search Simulation</h2>
            <p className={`text-xs ${getSubtextClass()}`}>
              Simulated AI responses to common queries about Kamioi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(ai_search_simulation || []).map((sim, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-5 transition-all duration-200 hover:scale-[1.01] ${
                isLightMode
                  ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 hover:shadow-lg hover:shadow-indigo-100/50'
                  : 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-400/40'
              }`}
            >
              {/* Query header */}
              <div className="flex items-start gap-2 mb-3">
                <Sparkles size={16} className={isLightMode ? 'text-indigo-500 mt-0.5' : 'text-indigo-400 mt-0.5'} />
                <p className={`text-sm font-bold leading-snug ${getTextColor()}`}>
                  &ldquo;{sim.query}&rdquo;
                </p>
              </div>

              {/* Likely source */}
              <div className={`flex items-center gap-1.5 mb-3 text-xs ${getSubtextClass()}`}>
                <Globe size={12} />
                <span>Source:</span>
                <span className={`font-mono font-medium ${isLightMode ? 'text-indigo-600' : 'text-indigo-300'}`}>
                  {sim.likely_source_page}
                </span>
              </div>

              {/* Content snippet */}
              <div
                className={`rounded-lg px-3 py-2.5 mb-4 text-xs leading-relaxed ${
                  isLightMode
                    ? 'bg-white border border-gray-200 text-gray-700'
                    : 'bg-black/20 border border-white/10 text-gray-300'
                }`}
              >
                {sim.content_snippet}
              </div>

              {/* Footer: confidence + schema tags */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                {getConfidenceBadge(sim.confidence)}
                <div className="flex flex-wrap gap-1">
                  {(sim.schemas_used || []).map((schema, sIdx) => (
                    <span
                      key={sIdx}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                        isLightMode
                          ? 'bg-gray-100 text-gray-600 border border-gray-200'
                          : 'bg-white/10 text-gray-400 border border-white/10'
                      }`}
                    >
                      {schema}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GeoAiOptimization
