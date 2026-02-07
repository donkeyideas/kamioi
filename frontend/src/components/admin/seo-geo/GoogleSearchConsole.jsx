import React, { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { Search, Link2, ExternalLink, CheckCircle, AlertTriangle, Info, Globe, TrendingUp, BarChart3, FileText, ChevronDown, ChevronUp } from 'lucide-react'

const GoogleSearchConsole = () => {
  const { isLightMode } = useTheme()
  const [expandedSection, setExpandedSection] = useState(null)
  const [gscStatus, setGscStatus] = useState({ connected: false, site_url: null })

  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode
    ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'

  useState(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
    const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
    fetch(`${apiBaseUrl}/api/admin/seo-geo/gsc-status`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
      .then(r => r.json())
      .then(json => { if (json.success) setGscStatus(json.data) })
      .catch(() => {})
  })

  const toggleSection = (id) => setExpandedSection(expandedSection === id ? null : id)

  const setupSteps = [
    {
      id: 'verify',
      title: '1. Verify Site Ownership',
      icon: CheckCircle,
      description: 'Add and verify kamioi.com in Google Search Console',
      details: [
        'Go to Google Search Console (search.google.com/search-console)',
        'Click "Add Property" and enter https://kamioi.com',
        'Choose DNS verification (recommended) or HTML tag method',
        'For DNS: Add TXT record to your domain registrar',
        'For HTML tag: Add meta tag to your site\'s <head>'
      ]
    },
    {
      id: 'sitemap',
      title: '2. Submit Sitemap',
      icon: Globe,
      description: 'Submit sitemap.xml to ensure all pages are indexed',
      details: [
        'In GSC, go to Sitemaps section',
        'Enter: https://kamioi.com/sitemap.xml',
        'Click Submit',
        'Monitor the status for any errors',
        'Current sitemap has 9 public URLs + dynamic blog pages'
      ]
    },
    {
      id: 'api-key',
      title: '3. Create API Credentials',
      icon: Link2,
      description: 'Set up Google Cloud project and API access',
      details: [
        'Go to Google Cloud Console (console.cloud.google.com)',
        'Create a new project or select existing one',
        'Enable "Google Search Console API"',
        'Create a Service Account and download JSON key',
        'Add the service account email as a user in GSC with "Full" permission'
      ]
    },
    {
      id: 'connect',
      title: '4. Connect to Kamioi Backend',
      icon: BarChart3,
      description: 'Configure the backend to fetch GSC data',
      details: [
        'Upload the service account JSON key to the backend server',
        'Set GOOGLE_SEARCH_CONSOLE_KEY_FILE environment variable',
        'Set GOOGLE_SEARCH_CONSOLE_SITE_URL=https://kamioi.com',
        'Restart the backend service',
        'Data will start appearing in Rankings & Traffic tab within 24 hours'
      ]
    }
  ]

  const dataAvailable = [
    { label: 'Search Queries', description: 'Keywords that trigger your site in Google search results', icon: Search },
    { label: 'Click-through Rates', description: 'How often users click your search results', icon: TrendingUp },
    { label: 'Average Position', description: 'Your average ranking position for each keyword', icon: BarChart3 },
    { label: 'Impressions', description: 'How many times your pages appear in search results', icon: Globe },
    { label: 'Index Coverage', description: 'Which pages Google has indexed and any indexing errors', icon: FileText },
    { label: 'Page Experience', description: 'Core Web Vitals, mobile usability, and HTTPS status', icon: CheckCircle },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={getCardClass()}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <Search size={28} className="text-blue-400" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${getTextColor()}`}>Google Search Console</h2>
            <p className={`text-sm ${getSubtextClass()}`}>
              {gscStatus.connected
                ? 'Live search data is being pulled from Google Search Console'
                : 'Connect GSC to get real keyword rankings, search performance data, and indexing status'}
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className={getCardClass()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${gscStatus.connected ? 'bg-green-500' : isLightMode ? 'bg-gray-300' : 'bg-gray-600'}`} />
            <span className={`font-medium ${getTextColor()}`}>Connection Status</span>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            gscStatus.connected
              ? isLightMode ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
              : isLightMode ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-gray-400'
          }`}>
            {gscStatus.connected ? `Connected — ${gscStatus.site_url}` : 'Not Connected'}
          </span>
        </div>
        <div className={`mt-4 p-4 rounded-xl ${
          gscStatus.connected
            ? isLightMode ? 'bg-green-50 border border-green-100' : 'bg-green-500/10 border border-green-500/20'
            : isLightMode ? 'bg-blue-50 border border-blue-100' : 'bg-blue-500/10 border border-blue-500/20'
        }`}>
          <div className="flex items-start gap-3">
            <Info size={18} className={gscStatus.connected ? 'text-green-400' : 'text-blue-400'} />
            <p className={`text-sm ${getSubtextClass()}`}>
              {gscStatus.connected
                ? 'Real search data from Google Search Console is now being displayed in the Rankings & Traffic tab.'
                : <>Once connected, real search data will replace the demo data in the <strong>Rankings & Traffic</strong> tab. You'll get actual keyword positions, click-through rates, and search performance metrics.</>
              }
            </p>
          </div>
        </div>
      </div>

      {/* Setup Steps - only show when NOT connected */}
      {!gscStatus.connected && (
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
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLightMode ? 'bg-blue-100' : 'bg-blue-500/20'}`}>
                        <Icon size={20} className="text-blue-400" />
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
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${isLightMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
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

      {/* Data Available */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
          {gscStatus.connected ? 'Data Being Tracked' : 'Data Available After Connection'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataAvailable.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className={`rounded-xl p-4 border ${isLightMode ? 'border-gray-100 bg-gray-50' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Icon size={18} className="text-blue-400" />
                  <span className={`font-medium text-sm ${getTextColor()}`}>{item.label}</span>
                </div>
                <p className={`text-xs ${getSubtextClass()}`}>{item.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Environment Variables - only show when NOT connected */}
      {!gscStatus.connected && (
        <div className={getCardClass()}>
          <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Required Environment Variables</h3>
          <div className="space-y-3">
            {[
              { key: 'GOOGLE_SEARCH_CONSOLE_KEY_FILE', value: 'path/to/service-account.json', desc: 'Path to Google Cloud service account JSON key' },
              { key: 'GOOGLE_SEARCH_CONSOLE_SITE_URL', value: 'https://kamioi.com', desc: 'Your verified site URL in GSC' },
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

export default GoogleSearchConsole
