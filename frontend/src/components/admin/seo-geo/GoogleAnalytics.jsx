import React, { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { BarChart3, Link2, ExternalLink, CheckCircle, Info, Globe, TrendingUp, Users, Clock, MousePointer, Target, ChevronDown, ChevronUp, Activity } from 'lucide-react'

const GoogleAnalytics = () => {
  const { isLightMode } = useTheme()
  const [expandedSection, setExpandedSection] = useState(null)

  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode
    ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'

  const toggleSection = (id) => setExpandedSection(expandedSection === id ? null : id)

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
      title: '3. Create API Credentials',
      icon: Link2,
      description: 'Enable the Google Analytics Data API for backend access',
      details: [
        'Go to Google Cloud Console (console.cloud.google.com)',
        'Enable "Google Analytics Data API" (GA4)',
        'Use the same service account or create a new one',
        'Download the JSON key file',
        'In GA4 Admin → Property Access Management, add the service account email with "Viewer" role'
      ]
    },
    {
      id: 'connect',
      title: '4. Connect to Kamioi Backend',
      icon: Activity,
      description: 'Configure the backend to pull GA4 data',
      details: [
        'Upload the service account JSON key to the backend server',
        'Set GOOGLE_ANALYTICS_KEY_FILE environment variable',
        'Set GOOGLE_ANALYTICS_PROPERTY_ID to your GA4 property ID (numeric)',
        'Restart the backend service',
        'Traffic data will start appearing in Rankings & Traffic tab'
      ]
    }
  ]

  const dataAvailable = [
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={getCardClass()}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <BarChart3 size={28} className="text-green-400" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${getTextColor()}`}>Google Analytics 4</h2>
            <p className={`text-sm ${getSubtextClass()}`}>
              Connect GA4 to get real traffic data, user behavior insights, and conversion tracking
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className={getCardClass()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isLightMode ? 'bg-gray-300' : 'bg-gray-600'}`} />
            <span className={`font-medium ${getTextColor()}`}>Connection Status</span>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${isLightMode ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-gray-400'}`}>
            Not Connected
          </span>
        </div>
        <div className={`mt-4 p-4 rounded-xl ${isLightMode ? 'bg-green-50 border border-green-100' : 'bg-green-500/10 border border-green-500/20'}`}>
          <div className="flex items-start gap-3">
            <Info size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
            <p className={`text-sm ${getSubtextClass()}`}>
              Once connected, real traffic data will replace the demo data in the <strong>Rankings & Traffic</strong> tab.
              You'll get actual user counts, session data, bounce rates, and conversion metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Setup Steps */}
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

      {/* Data Available */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Data Available After Connection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataAvailable.map((item) => {
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

      {/* Environment Variables */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Required Environment Variables</h3>
        <div className="space-y-3">
          {[
            { key: 'GOOGLE_ANALYTICS_MEASUREMENT_ID', value: 'G-XXXXXXXXXX', desc: 'GA4 Measurement ID for frontend tracking tag' },
            { key: 'GOOGLE_ANALYTICS_KEY_FILE', value: 'path/to/service-account.json', desc: 'Path to Google Cloud service account JSON key for API access' },
            { key: 'GOOGLE_ANALYTICS_PROPERTY_ID', value: '123456789', desc: 'GA4 property ID (numeric) for Data API queries' },
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
    </div>
  )
}

export default GoogleAnalytics
