import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { BarChart3, Link2, ExternalLink, CheckCircle, Info, Globe, TrendingUp, Users, Clock, MousePointer, Target, ChevronDown, ChevronUp, Activity, RefreshCw } from 'lucide-react'

const GoogleAnalytics = () => {
  const { isLightMode } = useTheme()
  const [expandedSection, setExpandedSection] = useState(null)
  const [ga4Status, setGa4Status] = useState(null)
  const [ga4Data, setGa4Data] = useState(null)
  const [loading, setLoading] = useState(true)

  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode
    ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
  const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = () => {
    setLoading(true)
    fetch(`${apiBaseUrl}/api/admin/seo-geo/ga4-status`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setGa4Status(json.data)
          if (json.data.connected) fetchData()
          else setLoading(false)
        } else {
          setLoading(false)
        }
      })
      .catch(() => {
        setGa4Status({ connected: false })
        setLoading(false)
      })
  }

  const fetchData = () => {
    fetch(`${apiBaseUrl}/api/admin/seo-geo/ga4-data`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) setGa4Data(json.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const toggleSection = (id) => setExpandedSection(expandedSection === id ? null : id)

  const connected = ga4Status?.connected

  const setupSteps = [
    {
      id: 'create',
      title: '1. Create GA4 Property',
      icon: BarChart3,
      description: 'Set up a Google Analytics 4 property for kamioi.com',
      details: [
        'Go to Google Analytics (analytics.google.com)',
        'Click Admin (gear icon) → Create Property',
        'Enter "Kamioi" as property name, select timezone and currency',
        'Choose "Web" as the platform',
        'Enter https://kamioi.com as the website URL',
        'Copy the Measurement ID (format: G-XXXXXXXXXX)'
      ]
    },
    {
      id: 'install',
      title: '2. Install Tracking Code',
      icon: Globe,
      description: 'Add the GA4 tag to the Kamioi frontend',
      details: [
        'Add the GA4 script tag to frontend/index.html <head> section',
        'Or install via Google Tag Manager for more flexibility',
        'The Measurement ID goes in the gtag config call',
        'Verify events are being received in GA4 Real-time reports',
        'Set up cross-domain tracking if using subdomains'
      ]
    },
    {
      id: 'api-key',
      title: '3. Enable Analytics Data API',
      icon: Link2,
      description: 'Enable the Google Analytics Data API in Google Cloud Console',
      details: [
        'Go to Google Cloud Console (console.cloud.google.com)',
        'Enable "Google Analytics Data API" (GA4)',
        'Use existing service account: kamioi-seo@julyu-485719.iam.gserviceaccount.com',
        'In GA4 Admin → Property Access Management, add the service account email with "Viewer" role'
      ]
    },
    {
      id: 'connect',
      title: '4. Set Environment Variable',
      icon: Activity,
      description: 'Add the GA4 property ID to Render',
      details: [
        'In Google Analytics → Admin → Property Settings → Copy the numeric Property ID',
        'In Render, add environment variable: GOOGLE_ANALYTICS_PROPERTY_ID = (your numeric property ID)',
        'The same service account JSON is already configured (GOOGLE_SERVICE_ACCOUNT_JSON)',
        'Restart the backend service',
        'Analytics data will start appearing here within a few minutes'
      ]
    }
  ]

  const dataTypes = [
    { label: 'Active Users', description: 'Real-time and daily active users on your site', icon: Users },
    { label: 'Traffic Sources', description: 'Where your visitors come from (organic, direct, referral, social)', icon: Globe },
    { label: 'Page Views', description: 'Most visited pages and content performance', icon: MousePointer },
    { label: 'Session Duration', description: 'How long users spend on your site', icon: Clock },
    { label: 'Bounce Rate', description: 'Percentage of single-page visits', icon: TrendingUp },
    { label: 'Conversions', description: 'Sign-up completions and goal tracking', icon: Target },
  ]

  const recommendedEvents = [
    { event: 'sign_up', description: 'When a user completes registration' },
    { event: 'login', description: 'When a user logs into their account' },
    { event: 'page_view', description: 'Automatic with GA4 enhanced measurement' },
    { event: 'scroll', description: 'When user scrolls 90% of page (automatic)' },
    { event: 'click', description: 'Outbound link clicks (automatic)' },
    { event: 'view_item', description: 'When a user views a pricing plan' },
    { event: 'begin_checkout', description: 'When a user starts the sign-up/payment flow' },
    { event: 'purchase', description: 'When a subscription is completed' },
  ]

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}m ${s.toString().padStart(2, '0')}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={getCardClass()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <BarChart3 size={28} className="text-green-400" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${getTextColor()}`}>Google Analytics 4</h2>
              <p className={`text-sm ${getSubtextClass()}`}>
                {connected
                  ? `Live analytics data from GA4 property ${ga4Status.property_id}`
                  : 'Connect GA4 to get real traffic data, user behavior insights, and conversion tracking'}
              </p>
            </div>
          </div>
          {connected && (
            <button
              onClick={() => { setGa4Data(null); fetchData() }}
              className={`p-2 rounded-lg transition-colors ${isLightMode ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
              title="Refresh data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin text-green-400' : getSubtextClass()} />
            </button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className={getCardClass()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : isLightMode ? 'bg-gray-300' : 'bg-gray-600'}`} />
            <span className={`font-medium ${getTextColor()}`}>Connection Status</span>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            connected
              ? isLightMode ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
              : isLightMode ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-gray-400'
          }`}>
            {connected ? `Connected — Property ${ga4Status.property_id}` : 'Not Connected'}
          </span>
        </div>
        <div className={`mt-4 p-4 rounded-xl ${
          connected
            ? isLightMode ? 'bg-green-50 border border-green-100' : 'bg-green-500/10 border border-green-500/20'
            : isLightMode ? 'bg-blue-50 border border-blue-100' : 'bg-blue-500/10 border border-blue-500/20'
        }`}>
          <div className="flex items-start gap-3">
            <Info size={18} className={`flex-shrink-0 mt-0.5 ${connected ? 'text-green-400' : 'text-blue-400'}`} />
            <p className={`text-sm ${getSubtextClass()}`}>
              {connected
                ? 'Real analytics data from Google Analytics 4 is being displayed below. Tracking code (G-SPF57B5KCR) is active on all pages.'
                : <>Follow the setup guide below to connect GA4. Once connected, you'll get real traffic data, user behavior insights, and conversion metrics.</>}
            </p>
          </div>
        </div>
      </div>

      {/* Live Data Dashboard - shown when connected */}
      {connected && ga4Data && (
        <>
          {/* Overview Metrics */}
          <div className={getCardClass()}>
            <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Last 30 Days Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Active Users', value: ga4Data.overview.active_users?.toLocaleString(), icon: Users, color: 'text-blue-400' },
                { label: 'Sessions', value: ga4Data.overview.sessions?.toLocaleString(), icon: Activity, color: 'text-green-400' },
                { label: 'Page Views', value: ga4Data.overview.page_views?.toLocaleString(), icon: MousePointer, color: 'text-purple-400' },
                { label: 'New Users', value: ga4Data.overview.new_users?.toLocaleString(), icon: Users, color: 'text-cyan-400' },
                { label: 'Bounce Rate', value: `${ga4Data.overview.bounce_rate}%`, icon: TrendingUp, color: 'text-orange-400' },
                { label: 'Avg Duration', value: formatDuration(ga4Data.overview.avg_session_duration), icon: Clock, color: 'text-pink-400' },
              ].map((metric) => {
                const Icon = metric.icon
                return (
                  <div key={metric.label} className={`rounded-xl p-4 border ${isLightMode ? 'border-gray-100 bg-gray-50' : 'border-white/10 bg-white/5'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={16} className={metric.color} />
                      <span className={`text-xs ${getSubtextClass()}`}>{metric.label}</span>
                    </div>
                    <p className={`text-xl font-bold ${getTextColor()}`}>{metric.value}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Traffic Sources */}
          {ga4Data.traffic_sources?.length > 0 && (
            <div className={getCardClass()}>
              <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Traffic Sources</h3>
              <div className="space-y-3">
                {ga4Data.traffic_sources.map((source) => (
                  <div key={source.source} className="flex items-center gap-4">
                    <div className={`w-32 text-sm font-medium ${getTextColor()}`}>{source.source}</div>
                    <div className="flex-1">
                      <div className={`h-6 rounded-full overflow-hidden ${isLightMode ? 'bg-gray-100' : 'bg-white/10'}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                          style={{ width: `${Math.min(source.value, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className={`w-20 text-right text-sm ${getSubtextClass()}`}>{source.sessions} sessions</div>
                    <div className={`w-14 text-right text-sm font-medium ${getTextColor()}`}>{source.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Pages */}
          {ga4Data.top_pages?.length > 0 && (
            <div className={getCardClass()}>
              <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Top Pages</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isLightMode ? 'text-gray-500 border-b border-gray-200' : 'text-gray-400 border-b border-white/10'}>
                      <th className="text-left py-3 px-3 font-medium">Page</th>
                      <th className="text-right py-3 px-3 font-medium">Views</th>
                      <th className="text-right py-3 px-3 font-medium">Users</th>
                      <th className="text-right py-3 px-3 font-medium">Bounce Rate</th>
                      <th className="text-right py-3 px-3 font-medium">Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ga4Data.top_pages.map((page) => (
                      <tr key={page.page} className={isLightMode ? 'border-b border-gray-100 hover:bg-gray-50' : 'border-b border-white/5 hover:bg-white/5'}>
                        <td className={`py-3 px-3 font-mono text-sm ${isLightMode ? 'text-green-700' : 'text-green-400'}`}>{page.page}</td>
                        <td className={`py-3 px-3 text-right ${getTextColor()}`}>{page.views?.toLocaleString()}</td>
                        <td className={`py-3 px-3 text-right ${getSubtextClass()}`}>{page.users?.toLocaleString()}</td>
                        <td className={`py-3 px-3 text-right ${getSubtextClass()}`}>{page.bounce_rate}%</td>
                        <td className={`py-3 px-3 text-right ${getSubtextClass()}`}>{page.avg_duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading state */}
      {loading && (
        <div className={getCardClass()}>
          <div className="flex items-center justify-center py-8 gap-3">
            <RefreshCw size={20} className="animate-spin text-green-400" />
            <span className={getSubtextClass()}>Loading analytics data...</span>
          </div>
        </div>
      )}

      {/* Setup Steps - only show when NOT connected */}
      {!connected && !loading && (
        <div className={getCardClass()}>
          <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Setup Guide</h3>
          <div className="space-y-3">
            {setupSteps.map((step) => {
              const Icon = step.icon
              const isExpanded = expandedSection === step.id
              return (
                <div key={step.id} className={`rounded-xl border ${isLightMode ? 'border-gray-100 bg-gray-50' : 'border-white/10 bg-white/5'}`}>
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleSection(step.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLightMode ? 'bg-green-100' : 'bg-green-500/20'}`}>
                        <Icon size={20} className="text-green-400" />
                      </div>
                      <div>
                        <p className={`font-medium ${getTextColor()}`}>{step.title}</p>
                        <p className={`text-xs ${getSubtextClass()}`}>{step.description}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={18} className={getSubtextClass()} /> : <ChevronDown size={18} className={getSubtextClass()} />}
                  </div>
                  {isExpanded && (
                    <div className={`px-4 pb-4 border-t ${isLightMode ? 'border-gray-100' : 'border-white/10'}`}>
                      <ol className="mt-3 space-y-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className={`flex items-start gap-2 text-sm ${getSubtextClass()}`}>
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${isLightMode ? 'bg-green-100 text-green-600' : 'bg-green-500/20 text-green-400'}`}>
                              {String.fromCharCode(97 + i)}
                            </span>
                            {detail}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Data Types / Recommended Events - always show */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
          {connected ? 'Data Being Tracked' : 'Data Available After Connection'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataTypes.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className={`rounded-xl p-4 border ${isLightMode ? 'border-gray-100 bg-gray-50' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Icon size={18} className="text-green-400" />
                  <span className={`font-medium text-sm ${getTextColor()}`}>{item.label}</span>
                </div>
                <p className={`text-xs ${getSubtextClass()}`}>{item.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recommended Events */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Recommended Events to Track</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isLightMode ? 'text-gray-500 border-b border-gray-200' : 'text-gray-400 border-b border-white/10'}>
                <th className="text-left py-3 px-3 font-medium">Event Name</th>
                <th className="text-left py-3 px-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {recommendedEvents.map((evt) => (
                <tr key={evt.event} className={isLightMode ? 'border-b border-gray-100 hover:bg-gray-50' : 'border-b border-white/5 hover:bg-white/5'}>
                  <td className={`py-3 px-3 font-mono text-sm ${isLightMode ? 'text-green-700' : 'text-green-400'}`}>
                    {evt.event}
                  </td>
                  <td className={`py-3 px-3 ${getSubtextClass()}`}>{evt.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Environment Variables - only show when NOT connected */}
      {!connected && !loading && (
        <div className={getCardClass()}>
          <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Required Environment Variables</h3>
          <div className="space-y-3">
            {[
              { key: 'GOOGLE_SERVICE_ACCOUNT_JSON', value: '(already configured)', desc: 'Base64-encoded service account JSON — shared with GSC' },
              { key: 'GOOGLE_ANALYTICS_PROPERTY_ID', value: '123456789', desc: 'GA4 property ID (numeric) — found in GA4 Admin → Property Settings' },
            ].map((env) => (
              <div key={env.key} className={`rounded-xl p-4 border ${isLightMode ? 'border-gray-100 bg-gray-50' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <code className={`text-sm font-mono font-bold ${isLightMode ? 'text-purple-700' : 'text-purple-400'}`}>{env.key}</code>
                </div>
                <code className={`text-xs font-mono ${isLightMode ? 'text-gray-500' : 'text-gray-500'}`}>{env.value}</code>
                <p className={`text-xs mt-1 ${getSubtextClass()}`}>{env.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default GoogleAnalytics
