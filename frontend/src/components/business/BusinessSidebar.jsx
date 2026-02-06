import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Users,
  Target,
  CreditCard,
  TrendingUp,
  FileText,
  Server,
  Settings,
  Building2,
  LogOut,
  Bell,
  MessageSquare,
  Sparkles,
  Brain,
  X
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import V2Launcher from '../common/V2Launcher'

const BusinessSidebar = ({ activeTab, setActiveTab, user, onLogout, onOpenCommunication, isMobileSidebarOpen, onCloseMobileSidebar }) => {
  const { isBlackMode, isLightMode } = useTheme()
  const { isBusinessAdmin, isBusinessManager, isBusinessEmployee, user: authUser } = useAuth()
  const [showV2Launcher, setShowV2Launcher] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyLogo, setCompanyLogo] = useState(() => {
    const userId = user?.id || user?.account_number || authUser?.id || authUser?.account_number
    if (userId) {
      return localStorage.getItem(`company_logo_${userId}`) || null
    }
    return null
  })
  
  // Fetch company name from settings and logo from localStorage
  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const token = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_user_token') || localStorage.getItem('kamioi_token')
        if (!token) return
        
              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const response = await fetch(`${apiBaseUrl}/api/business/settings/account`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.account) {
            setCompanyName(result.account.company_name || '')
          }
        }
      } catch (error) {
        console.error('Error fetching company name:', error)
      }
    }
    
    fetchCompanyName()
    
    // Listen for profile update events
    const handleProfileUpdate = () => {
      fetchCompanyName()
    }
    
    window.addEventListener('kamioi:profile-updated', handleProfileUpdate)
    
    // Listen for company logo updates
    const handleLogoUpdate = (e) => {
      const userId = user?.id || user?.account_number || authUser?.id || authUser?.account_number
      if (e.detail?.userId === userId || !e.detail?.userId) {
        const logo = localStorage.getItem(`company_logo_${userId}`)
        setCompanyLogo(logo || null)
      }
    }
    
    window.addEventListener('kamioi:company-logo-updated', handleLogoUpdate)
    
    return () => {
      window.removeEventListener('kamioi:profile-updated', handleProfileUpdate)
      window.removeEventListener('kamioi:company-logo-updated', handleLogoUpdate)
    }
  }, [user, authUser])
  
  // Update logo when user changes
  useEffect(() => {
    const userId = user?.id || user?.account_number || authUser?.id || authUser?.account_number
    if (userId) {
      const logo = localStorage.getItem(`company_logo_${userId}`)
      setCompanyLogo(logo || null)
    }
  }, [user, authUser])

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
    if (isBlackMode) return 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg text-left'
    if (isLightMode) return 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 bg-white/30 backdrop-blur-sm border border-gray-300/50 text-gray-800 shadow-lg text-left'
    return 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg text-left'
  }

  const getInactiveButtonClass = () => {
    if (isLightMode) return 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-gray-600 hover:text-gray-800 hover:bg-white/20 hover:backdrop-blur-sm hover:border hover:border-gray-300/30 text-left'
    return 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-white/80 hover:text-white hover:bg-white/5 hover:backdrop-blur-sm hover:border hover:border-white/10 text-left'
  }

  const getLogoClass = () => {
    if (isLightMode) return 'flex items-center space-x-3 mb-8 p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-gray-300/50 shadow-lg'
    return 'flex items-center space-x-3 mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg'
  }

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, allowedRoles: ['admin', 'manager', 'employee'] },
    { id: 'transactions', label: 'Transactions', icon: CreditCard, allowedRoles: ['admin', 'manager', 'employee'] },
    { id: 'team', label: 'Team', icon: Users, allowedRoles: ['admin', 'manager', 'employee'] },
    { id: 'goals', label: 'Business Goals', icon: Target, allowedRoles: ['admin', 'manager', 'employee'] },
    { id: 'ai', label: 'AI Insights', icon: Brain, allowedRoles: ['admin', 'manager', 'employee'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, allowedRoles: ['admin', 'manager', 'employee'] },
    { id: 'reports', label: 'Reports', icon: FileText, allowedRoles: ['admin', 'manager', 'employee'] },
    { id: 'settings', label: 'Settings', icon: Settings, allowedRoles: ['admin', 'manager', 'employee'] }
  ]

  const filteredMenuItems = menuItems.filter(item => {
    const userRole = user?.businessRole || 'employee'
    return item.allowedRoles.includes(userRole)
  })

  return (
    <>
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
        <button
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
          onClick={onCloseMobileSidebar}
        >
          <X className={`w-5 h-5 ${getTextClass()}`} />
        </button>

        <div className={`${getLogoClass()} flex-shrink-0`}>
          {companyLogo ? (
            <img
              src={companyLogo}
              alt="Company Logo"
              className="w-12 h-12 object-contain"
            />
          ) : (
            <Building2 className={`w-12 h-12 ${getTextClass()}`} />
          )}
          <div>
            <h1 className={`text-xl font-bold ${getTextClass()}`}>
              {companyName || user?.company_name || authUser?.company_name || user?.businessName || authUser?.businessName || 'Business'}
            </h1>
            <p className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-white/60'}`}>Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto overflow-x-hidden pr-2">
          {filteredMenuItems.map((item) => {
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

        {/* Notifications Button - moved above Cross-Dashboard Chat */}
        <div className="flex-shrink-0">
          <button
            onClick={() => {
              setActiveTab('notifications')
              if (onCloseMobileSidebar) onCloseMobileSidebar()
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 mb-4 text-left ${
              activeTab === 'notifications'
                ? (isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400')
                : (isLightMode ? 'text-gray-600 hover:text-gray-800 hover:bg-white/20 hover:backdrop-blur-sm hover:border hover:border-gray-300/30' : 'text-white/80 hover:text-white hover:bg-white/5 hover:backdrop-blur-sm hover:border hover:border-white/10')
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </button>

          {/* Cross-Dashboard Communication Button */}
          <button
            onClick={() => {
              onOpenCommunication()
              if (onCloseMobileSidebar) onCloseMobileSidebar()
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 mb-4 text-left ${
              isLightMode
                ? 'bg-white/20 backdrop-blur-sm border border-gray-300/50 text-gray-800 hover:bg-white/30'
                : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20'
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
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:backdrop-blur-sm hover:border hover:border-red-400/20"
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

export default BusinessSidebar
