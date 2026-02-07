import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Globe,
  FileText,
  Shield,
  Search,
  Bot,
  ExternalLink,
  Info
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'

const getAuthToken = () =>
  localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')

const TechnicalSeoAudit = () => {
  const { isLightMode } = useTheme()

  const [auditData, setAuditData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [runningAudit, setRunningAudit] = useState(false)
  const [error, setError] = useState(null)
  const [expandedRows, setExpandedRows] = useState({})
  const [lastAuditTime, setLastAuditTime] = useState(null)

  // Theme helpers
  const getTextColor = () => (isLightMode ? 'text-gray-800' : 'text-white')
  const getSubtextClass = () => (isLightMode ? 'text-gray-600' : 'text-gray-400')
  const getCardClass = () =>
    isLightMode
      ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
      : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'

  // Fetch audit data
  const fetchAuditData = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = getAuthToken()
      const res = await fetch(`${API_BASE_URL}/api/admin/seo-geo/technical-audit`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error(`Failed to fetch audit data (${res.status})`)
      const json = await res.json()
      setAuditData(json.data)
      if (json.data?.last_audit_time) {
        setLastAuditTime(json.data.last_audit_time)
      }
    } catch (err) {
      console.error('Error fetching audit data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Run a fresh audit
  const runFullAudit = async () => {
    try {
      setRunningAudit(true)
      setError(null)
      const token = getAuthToken()
      const res = await fetch(`${API_BASE_URL}/api/admin/seo-geo/run-audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error(`Audit failed (${res.status})`)
      // After the audit completes, re-fetch the data
      await fetchAuditData()
    } catch (err) {
      console.error('Error running audit:', err)
      setError(err.message)
    } finally {
      setRunningAudit(false)
    }
  }

  useEffect(() => {
    fetchAuditData()
  }, [])

  // Toggle row expansion
  const toggleRow = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  // Score badge color
  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    return 'bg-red-500/20 text-red-400 border border-red-500/30'
  }

  const getScoreBadgeLight = (score) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-700 border border-emerald-300'
    if (score >= 50) return 'bg-yellow-100 text-yellow-700 border border-yellow-300'
    return 'bg-red-100 text-red-700 border border-red-300'
  }

  // Status icon helper
  const StatusIcon = ({ status, size = 16 }) => {
    if (status === 'good') return <CheckCircle size={size} className="text-emerald-500 shrink-0" />
    if (status === 'warning') return <AlertTriangle size={size} className="text-yellow-500 shrink-0" />
    return <XCircle size={size} className="text-red-500 shrink-0" />
  }

  // Severity badge
  const SeverityBadge = ({ severity }) => {
    const base = 'px-2 py-0.5 rounded-full text-xs font-medium'
    if (severity === 'error') {
      return (
        <span className={`${base} ${isLightMode ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'}`}>
          Error
        </span>
      )
    }
    if (severity === 'warning') {
      return (
        <span className={`${base} ${isLightMode ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/20 text-yellow-400'}`}>
          Warning
        </span>
      )
    }
    return (
      <span className={`${base} ${isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'}`}>
        Info
      </span>
    )
  }

  // Loading state
  if (loading && !auditData) {
    return (
      <div className="space-y-6">
        <div className={getCardClass()}>
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className={`animate-spin mr-3 ${getSubtextClass()}`} />
            <span className={getSubtextClass()}>Loading audit data...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !auditData) {
    return (
      <div className="space-y-6">
        <div className={getCardClass()}>
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertTriangle size={32} className="text-red-500" />
            <p className={`text-sm ${getSubtextClass()}`}>{error}</p>
            <button
              onClick={fetchAuditData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pages = auditData?.pages || []
  const sitemapHealth = auditData?.sitemap_health || {}
  const robotsTxt = auditData?.robots_txt || {}
  const checklist = auditData?.technical_checklist || {}

  const checklistItems = [
    { key: 'https_enforced', label: 'HTTPS Enforced' },
    { key: 'canonical_on_all_pages', label: 'Canonical on All Pages' },
    { key: 'no_duplicate_titles', label: 'No Duplicate Titles' },
    { key: 'no_duplicate_descriptions', label: 'No Duplicate Descriptions' },
    { key: 'sitemap_in_robots', label: 'Sitemap in robots.txt' },
    { key: 'viewport_meta', label: 'Viewport Meta' },
    { key: 'lang_attribute', label: 'Lang Attribute' },
    { key: 'favicons_configured', label: 'Favicons Configured' },
    { key: 'mobile_friendly', label: 'Mobile Friendly' },
    { key: 'structured_data_valid', label: 'Structured Data Valid' }
  ]

  return (
    <div className="space-y-6">
      {/* ===== Top Controls Bar ===== */}
      <div className={`${getCardClass()} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isLightMode ? 'bg-blue-100' : 'bg-blue-500/20'}`}>
            <Search size={20} className={isLightMode ? 'text-blue-600' : 'text-blue-400'} />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${getTextColor()}`}>Technical SEO Audit</h2>
            {lastAuditTime && (
              <p className={`text-xs mt-0.5 ${getSubtextClass()}`}>
                Last audit: {new Date(lastAuditTime).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={runFullAudit}
          disabled={runningAudit}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            runningAudit
              ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40'
          }`}
        >
          <RefreshCw size={16} className={runningAudit ? 'animate-spin' : ''} />
          {runningAudit ? 'Running Audit...' : 'Run Full Audit'}
        </button>
      </div>

      {/* ===== Page-by-Page Audit Results Table ===== */}
      <div className={getCardClass()}>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className={isLightMode ? 'text-gray-600' : 'text-gray-400'} />
          <h3 className={`text-base font-semibold ${getTextColor()}`}>Page-by-Page Audit Results</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isLightMode ? 'bg-gray-200 text-gray-600' : 'bg-white/10 text-gray-400'}`}>
            {pages.length} pages
          </span>
        </div>

        {/* Table wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isLightMode ? 'border-gray-200' : 'border-white/10'}`}>
                <th className={`text-left py-3 px-3 font-medium ${getSubtextClass()}`}>Page</th>
                <th className={`text-left py-3 px-2 font-medium ${getSubtextClass()} hidden lg:table-cell`}>URL</th>
                <th className={`text-center py-3 px-2 font-medium ${getSubtextClass()}`}>Title</th>
                <th className={`text-center py-3 px-2 font-medium ${getSubtextClass()}`}>Meta</th>
                <th className={`text-center py-3 px-2 font-medium ${getSubtextClass()} hidden md:table-cell`}>Canonical</th>
                <th className={`text-center py-3 px-2 font-medium ${getSubtextClass()} hidden md:table-cell`}>H1</th>
                <th className={`text-center py-3 px-2 font-medium ${getSubtextClass()} hidden xl:table-cell`}>Images</th>
                <th className={`text-left py-3 px-2 font-medium ${getSubtextClass()} hidden xl:table-cell`}>Schema</th>
                <th className={`text-center py-3 px-2 font-medium ${getSubtextClass()}`}>Score</th>
                <th className={`text-center py-3 px-2 font-medium ${getSubtextClass()}`}>Issues</th>
                <th className={`py-3 px-2 ${getSubtextClass()}`}></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page, index) => {
                const isExpanded = expandedRows[index]
                return (
                  <React.Fragment key={index}>
                    {/* Main row */}
                    <tr
                      onClick={() => toggleRow(index)}
                      className={`border-b cursor-pointer transition-colors duration-150 ${
                        isLightMode
                          ? `border-gray-100 hover:bg-gray-50/80 ${isExpanded ? 'bg-blue-50/50' : ''}`
                          : `border-white/5 hover:bg-white/5 ${isExpanded ? 'bg-white/5' : ''}`
                      }`}
                    >
                      <td className={`py-3 px-3 font-medium ${getTextColor()}`}>
                        {page.page_name}
                      </td>
                      <td className={`py-3 px-2 hidden lg:table-cell`}>
                        <span className={`text-xs ${getSubtextClass()} truncate block max-w-[200px]`} title={page.url}>
                          {page.url}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <StatusIcon status={page.title?.status} />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <StatusIcon status={page.meta_description?.status} />
                      </td>
                      <td className="py-3 px-2 text-center hidden md:table-cell">
                        <StatusIcon status={page.canonical?.status} />
                      </td>
                      <td className="py-3 px-2 text-center hidden md:table-cell">
                        <StatusIcon status={page.h1?.status} />
                      </td>
                      <td className={`py-3 px-2 text-center hidden xl:table-cell text-xs ${getSubtextClass()}`}>
                        {page.images?.with_alt}/{page.images?.total} alt
                      </td>
                      <td className={`py-3 px-2 hidden xl:table-cell`}>
                        <div className="flex flex-wrap gap-1">
                          {(page.structured_data?.types || []).map((type, i) => (
                            <span
                              key={i}
                              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                isLightMode
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isLightMode
                              ? getScoreBadgeLight(page.score)
                              : getScoreBadge(page.score)
                          }`}
                        >
                          {page.score}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {(page.issues?.length || 0) > 0 ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              isLightMode
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}
                          >
                            {page.issues.length}
                          </span>
                        ) : (
                          <span className={`text-xs ${getSubtextClass()}`}>0</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isExpanded ? (
                          <ChevronUp size={16} className={getSubtextClass()} />
                        ) : (
                          <ChevronDown size={16} className={getSubtextClass()} />
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    <tr>
                      <td colSpan={11} className="p-0">
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div
                            className={`p-4 mx-2 mb-2 rounded-xl space-y-4 ${
                              isLightMode ? 'bg-gray-50 border border-gray-200' : 'bg-white/5 border border-white/10'
                            }`}
                          >
                            {/* Title & Meta Description details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Title details */}
                              <div className="space-y-1">
                                <p className={`text-xs font-medium uppercase tracking-wide ${getSubtextClass()}`}>Title Tag</p>
                                <p className={`text-sm ${getTextColor()}`}>
                                  {page.title?.value || 'N/A'}
                                </p>
                                <div className="flex items-center gap-2">
                                  <StatusIcon status={page.title?.status} size={14} />
                                  <span className={`text-xs ${getSubtextClass()}`}>
                                    Length: {page.title?.length || 0} chars
                                  </span>
                                </div>
                              </div>

                              {/* Meta Description details */}
                              <div className="space-y-1">
                                <p className={`text-xs font-medium uppercase tracking-wide ${getSubtextClass()}`}>
                                  Meta Description
                                </p>
                                <p className={`text-sm ${getTextColor()}`}>
                                  {page.meta_description?.value || 'N/A'}
                                </p>
                                <div className="flex items-center gap-2">
                                  <StatusIcon status={page.meta_description?.status} size={14} />
                                  <span className={`text-xs ${getSubtextClass()}`}>
                                    Length: {page.meta_description?.length || 0} chars
                                  </span>
                                  {page.meta_description?.message && (
                                    <span className="text-xs text-yellow-500">
                                      — {page.meta_description.message}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Issues list */}
                            {page.issues && page.issues.length > 0 && (
                              <div className="space-y-2">
                                <p className={`text-xs font-medium uppercase tracking-wide ${getSubtextClass()}`}>
                                  Issues ({page.issues.length})
                                </p>
                                <div className="space-y-1.5">
                                  {page.issues.map((issue, i) => (
                                    <div
                                      key={i}
                                      className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                                        isLightMode ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'
                                      }`}
                                    >
                                      <SeverityBadge severity={issue.severity} />
                                      <span className={getTextColor()}>{issue.message}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Extra info row */}
                            <div className="flex flex-wrap gap-4 text-xs">
                              <span className={getSubtextClass()}>
                                Canonical:{' '}
                                {page.canonical?.present ? (
                                  <CheckCircle size={12} className="inline text-emerald-500" />
                                ) : (
                                  <XCircle size={12} className="inline text-red-500" />
                                )}{' '}
                                {page.canonical?.self_referencing ? '(self-ref)' : ''}
                              </span>
                              <span className={getSubtextClass()}>
                                H1 count: {page.h1?.count ?? 'N/A'}
                              </span>
                              <span className={getSubtextClass()}>
                                Internal links: {page.internal_links ?? 'N/A'}
                              </span>
                              <span className={getSubtextClass()}>
                                OG tags: {page.og_tags?.complete ? 'Complete' : `Missing: ${(page.og_tags?.missing || []).join(', ')}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                )
              })}

              {pages.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <Info size={24} className={`mx-auto mb-2 ${getSubtextClass()}`} />
                    <p className={`text-sm ${getSubtextClass()}`}>
                      No audit data available. Click "Run Full Audit" to start.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Sitemap Health & Robots.txt Cards ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sitemap Health Card */}
        <div className={getCardClass()}>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className={isLightMode ? 'text-blue-600' : 'text-blue-400'} />
            <h3 className={`text-base font-semibold ${getTextColor()}`}>Sitemap Health</h3>
          </div>

          {/* Sitemap URL & status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {sitemapHealth.accessible ? (
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                ) : (
                  <XCircle size={16} className="text-red-500 shrink-0" />
                )}
                <a
                  href={sitemapHealth.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm truncate hover:underline ${
                    isLightMode ? 'text-blue-600' : 'text-blue-400'
                  }`}
                >
                  {sitemapHealth.url || 'N/A'}
                </a>
                <ExternalLink size={12} className={`shrink-0 ${getSubtextClass()}`} />
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ml-2 ${
                  sitemapHealth.accessible
                    ? isLightMode
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-emerald-500/20 text-emerald-400'
                    : isLightMode
                      ? 'bg-red-100 text-red-700'
                      : 'bg-red-500/20 text-red-400'
                }`}
              >
                {sitemapHealth.accessible ? 'Accessible' : 'Inaccessible'}
              </span>
            </div>

            {/* Total URLs */}
            <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${isLightMode ? 'bg-gray-100' : 'bg-white/5'}`}>
              <span className={`text-sm ${getSubtextClass()}`}>Total URLs</span>
              <span className={`text-sm font-semibold ${getTextColor()}`}>{sitemapHealth.total_urls ?? 0}</span>
            </div>

            {/* Missing from sitemap */}
            <div>
              <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${getSubtextClass()}`}>
                Missing from Sitemap
              </p>
              {(sitemapHealth.missing_from_sitemap || []).length === 0 ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className={`text-sm ${getSubtextClass()}`}>None — all pages included</span>
                </div>
              ) : (
                <ul className="space-y-1">
                  {sitemapHealth.missing_from_sitemap.map((url, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-yellow-500 shrink-0" />
                      <span className={`text-xs ${getSubtextClass()} truncate`}>{url}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Stale URLs */}
            <div>
              <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${getSubtextClass()}`}>
                Stale URLs
              </p>
              {(sitemapHealth.stale_urls || []).length === 0 ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className={`text-sm ${getSubtextClass()}`}>None — sitemap is up to date</span>
                </div>
              ) : (
                <ul className="space-y-1">
                  {sitemapHealth.stale_urls.map((url, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-yellow-500 shrink-0" />
                      <span className={`text-xs ${getSubtextClass()} truncate`}>{url}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Robots.txt Validation Card */}
        <div className={getCardClass()}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className={isLightMode ? 'text-violet-600' : 'text-violet-400'} />
            <h3 className={`text-base font-semibold ${getTextColor()}`}>Robots.txt Validation</h3>
          </div>

          <div className="space-y-4">
            {/* AI Crawlers Allowed */}
            <div>
              <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${getSubtextClass()}`}>
                AI Crawlers Allowed
              </p>
              <div className="flex flex-wrap gap-2">
                {(robotsTxt.ai_crawlers_allowed || []).length === 0 ? (
                  <span className={`text-sm ${getSubtextClass()}`}>None detected</span>
                ) : (
                  robotsTxt.ai_crawlers_allowed.map((crawler, i) => (
                    <span
                      key={i}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg ${
                        isLightMode
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      <Bot size={12} />
                      {crawler}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Blocked Paths */}
            <div>
              <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${getSubtextClass()}`}>
                Blocked Paths
              </p>
              {(robotsTxt.blocked_paths || []).length === 0 ? (
                <span className={`text-sm ${getSubtextClass()}`}>No paths blocked</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {robotsTxt.blocked_paths.map((path, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-1 rounded-md font-mono ${
                        isLightMode
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {path}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sitemap referenced */}
            <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${isLightMode ? 'bg-gray-100' : 'bg-white/5'}`}>
              <span className={`text-sm ${getSubtextClass()}`}>Sitemap Referenced</span>
              {robotsTxt.sitemap_referenced ? (
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-500">
                  <CheckCircle size={14} /> Yes
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-medium text-red-500">
                  <XCircle size={14} /> No
                </span>
              )}
            </div>

            {/* Crawl delay */}
            <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${isLightMode ? 'bg-gray-100' : 'bg-white/5'}`}>
              <span className={`text-sm ${getSubtextClass()}`}>Crawl Delay</span>
              <span className={`text-sm font-semibold ${getTextColor()}`}>
                {robotsTxt.crawl_delay != null ? `${robotsTxt.crawl_delay}s` : 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Technical Checklist ===== */}
      <div className={getCardClass()}>
        <div className="flex items-center gap-2 mb-5">
          <CheckCircle size={18} className={isLightMode ? 'text-emerald-600' : 'text-emerald-400'} />
          <h3 className={`text-base font-semibold ${getTextColor()}`}>Technical Checklist</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {checklistItems.map((item) => {
            const passed = checklist[item.key]
            return (
              <div
                key={item.key}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-colors ${
                  passed
                    ? isLightMode
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-emerald-500/10 border border-emerald-500/20'
                    : isLightMode
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-red-500/10 border border-red-500/20'
                }`}
              >
                {passed ? (
                  <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                ) : (
                  <XCircle size={18} className="text-red-500 shrink-0" />
                )}
                <span
                  className={`text-sm font-medium ${
                    passed
                      ? isLightMode
                        ? 'text-emerald-800'
                        : 'text-emerald-300'
                      : isLightMode
                        ? 'text-red-800'
                        : 'text-red-300'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error banner (non-blocking) */}
      {error && auditData && (
        <div className={`${getCardClass()} !border-red-500/30 flex items-center gap-3`}>
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className={`text-sm ${getSubtextClass()}`}>{error}</p>
          <button
            onClick={fetchAuditData}
            className="ml-auto text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

export default TechnicalSeoAudit
