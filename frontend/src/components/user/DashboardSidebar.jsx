import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  PieChart,
  History,
  Brain,
  Trophy,
  Settings,
  TrendingUp,
  LogOut,
  BarChart3,
  MessageSquare,
  X
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import V2Launcher from '../common/V2Launcher'

const DashboardSidebar = ({ activeTab, setActiveTab, user, onLogout, onOpenCommunication, isMobileSidebarOpen, onCloseMobileSidebar }) => {
  const { isBlackMode, isLightMode } = useTheme()
  const [showV2Launcher, setShowV2Launcher] = useState(false)
  const [activeAd, setActiveAd] = useState(null)

  // Fetch active ads for user and family dashboards
  useEffect(() => {
    const fetchActiveAd = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const response = await fetch(`${apiBaseUrl}/api/user/active-ad`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('kamioi_token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.ad) {
            setActiveAd(data.ad)
          }
        }
      } catch (error) {
        console.log('No active ads or error fetching ads:', error)
        setActiveAd(null)
      }
    }

    // Only fetch ads for user and family dashboards
    if (user?.role === 'user' || user?.role === 'family') {
      fetchActiveAd()
    }
  }, [user?.role])
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'goals', label: 'Goals', icon: TrendingUp },
    { id: 'ai', label: 'AI Insights', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const getSidebarClass = () => {
    if (isBlackMode) return 'w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 h-screen p-6'
    if (isLightMode) return 'w-64 bg-white/20 backdrop-blur-xl border-r border-gray-200/50 h-screen p-6'
    return 'w-64 bg-purple-800/20 backdrop-blur-xl border-r border-white/10 h-screen p-6'
  }

  const getTextClass = () => {
    if (isLightMode) return 'text-gray-800'
    return 'text-white'
  }

  const getActiveButtonClass = () => {
    if (isBlackMode) return 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg'
    if (isLightMode) return 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 bg-white/30 backdrop-blur-sm border border-gray-300/50 text-gray-800 shadow-lg'
    return 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg'
  }

  const getInactiveButtonClass = () => {
    if (isLightMode) return 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-gray-600 hover:text-gray-800 hover:bg-white/20 hover:backdrop-blur-sm hover:border hover:border-gray-300/30'
    return 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-white/80 hover:text-white hover:bg-white/5 hover:backdrop-blur-sm hover:border hover:border-white/10'
  }

  const getAdSpaceClass = () => {
    if (isLightMode) return 'mb-8 p-4 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-dashed border-gray-300/50 text-center shadow-lg'
    return 'mb-8 p-4 bg-white/5 backdrop-blur-sm rounded-lg border-2 border-dashed border-white/20 text-center shadow-lg'
  }

  const getAdTextClass = () => {
    if (isLightMode) return 'text-gray-600 text-sm'
    return 'text-white/60 text-sm'
  }

  const getAdSubtextClass = () => {
    if (isLightMode) return 'text-gray-500 text-xs mt-1'
    return 'text-white/40 text-xs mt-1'
  }

  const getLogoClass = () => {
    if (isLightMode) return 'flex items-center space-x-3 mb-8 p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-gray-300/50 shadow-lg'
    return 'flex items-center space-x-3 mb-8 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg'
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobileSidebar}
        />
      )}

      <aside className={`${getSidebarClass()} flex flex-col overflow-hidden
        fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0 md:z-auto
      `}>
        {/* Mobile close button */}
        <button
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
          onClick={onCloseMobileSidebar}
        >
          <X className={`w-5 h-5 ${getTextClass()}`} />
        </button>

        <div className={`${getLogoClass()} flex-shrink-0`}>
          <TrendingUp className={`w-8 h-8 ${getTextClass()}`} />
          <h1 className={`text-xl font-bold ${getTextClass()}`}>Kamioi</h1>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto overflow-x-hidden pr-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            const buttonClass = isActive ? getActiveButtonClass() : getInactiveButtonClass();

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  if (onCloseMobileSidebar) onCloseMobileSidebar()
                }}
                className={buttonClass}
              >
                <IconComponent className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Dynamic Advertisement Space - Only show if admin has activated an ad */}
        {activeAd && (user?.role === 'user' || user?.role === 'family') && (
          <div className={`${getAdSpaceClass()} flex-shrink-0`}>
            <div className="mb-3">
              <div className={`w-full h-20 bg-gradient-to-r ${activeAd.gradient || 'from-blue-600 to-purple-600'} rounded-lg mb-2 flex items-center justify-center`}>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">{activeAd.title}</div>
                  <div className="text-white/80 text-xs">{activeAd.subtitle}</div>
                </div>
              </div>
            </div>
            <p className={getAdTextClass()}>{activeAd.description}</p>
            <p className={getAdSubtextClass()}>{activeAd.offer}</p>
            <button
              onClick={() => window.open(activeAd.link, '_blank')}
              className={`mt-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
                isLightMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {activeAd.buttonText || 'Learn More'}
            </button>
          </div>
        )}

        {/* Cross-Dashboard Communication Button */}
        <div className="flex-shrink-0">
          <button
            onClick={() => {
              onOpenCommunication()
              if (onCloseMobileSidebar) onCloseMobileSidebar()
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all mb-4 ${
              isLightMode
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Cross-Dashboard Chat</span>
          </button>
        </div>

        {/* Logout Button - Fixed at bottom */}
        <div className="flex-shrink-0 pt-4 border-t border-white/10 mt-4">
          <button
            onClick={onLogout}
            className={getInactiveButtonClass()}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* V2 Launcher Modal */}
        <V2Launcher
          isOpen={showV2Launcher}
          onClose={() => setShowV2Launcher(false)}
        />
      </aside>
    </>
  )
}

export default DashboardSidebar

