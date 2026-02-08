import React, { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, TrendingUp, Settings, FileText, Code, Brain, Lightbulb, RefreshCw, Activity } from 'lucide-react'

// Sub-components
import SeoOverviewDashboard from './seo-geo/SeoOverviewDashboard'
import TechnicalSeoAudit from './seo-geo/TechnicalSeoAudit'
import ContentSeoAnalysis from './seo-geo/ContentSeoAnalysis'
import StructuredDataPanel from './seo-geo/StructuredDataPanel'
import GeoAiOptimization from './seo-geo/GeoAiOptimization'
import RankingsTraffic from './seo-geo/RankingsTraffic'
import SeoRecommendations from './seo-geo/SeoRecommendations'
import GoogleAnalytics from './seo-geo/GoogleAnalytics'

const SeoGeoAnalytics = () => {
  const { isDarkMode, isLightMode, isCloudMode } = useTheme()
  const [activeSubTab, setActiveSubTab] = useState('overview')

  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode
    ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'
  const getBgClass = () => isLightMode ? 'bg-gray-50' : ''

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'rankings', label: 'Rankings & Traffic', icon: TrendingUp },
    { id: 'technical', label: 'Technical Audit', icon: Settings },
    { id: 'content', label: 'Content SEO', icon: FileText },
    { id: 'structured-data', label: 'Structured Data', icon: Code },
    { id: 'geo', label: 'GEO / AI Search', icon: Brain },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'ga4', label: 'Analytics', icon: Activity },
  ]

  // Emit page load complete event
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'seo-geo', loadTime: 100 }
      }))
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'overview':
        return <SeoOverviewDashboard />
      case 'rankings':
        return <RankingsTraffic />
      case 'technical':
        return <TechnicalSeoAudit />
      case 'content':
        return <ContentSeoAnalysis />
      case 'structured-data':
        return <StructuredDataPanel />
      case 'geo':
        return <GeoAiOptimization />
      case 'recommendations':
        return <SeoRecommendations />
      case 'ga4':
        return <GoogleAnalytics />
      default:
        return <SeoOverviewDashboard />
    }
  }

  return (
    <div className={`space-y-6 ${getBgClass()}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${getTextColor()}`}>
            SEO & GEO Analytics
          </h1>
          <p className={`text-sm mt-1 ${getSubtextClass()}`}>
            Deep analysis of search engine optimization and generative engine optimization performance
          </p>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className={`${getCardClass()} !p-2`}>
        <div className="flex flex-wrap gap-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeSubTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? isLightMode
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                    : isLightMode
                      ? 'text-gray-600 hover:bg-gray-100'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon size={16} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sub-Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderSubTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default SeoGeoAnalytics
