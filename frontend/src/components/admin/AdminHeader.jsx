import React, { useState, useEffect, useCallback } from 'react'
import { Sun, Moon, Cloud, Search, Bell, Settings, User, UserPlus, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../hooks/useNotifications'
import { Link } from 'react-router-dom'

const AdminHeader = ({ activeTab, onToggleMobileSidebar }) => {
  const { isBlackMode, toggleTheme, isLightMode, isCloudMode, theme } = useTheme()
  const { unreadCount } = useNotifications()
  const [searchQuery, setSearchQuery] = useState('')
  const [demoRequestCount, setDemoRequestCount] = useState(0)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5111'

  // Fetch pending demo request count
  const fetchDemoRequestCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const response = await fetch(`${apiBaseUrl}/api/admin/demo-requests/pending-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success && data.data) {
        setDemoRequestCount(data.data.count || 0)
      }
    } catch (err) {
      // Silently fail - don't disrupt the UI
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchDemoRequestCount()
    // Poll every 30 seconds for new demo requests
    const interval = setInterval(fetchDemoRequestCount, 30000)
    return () => clearInterval(interval)
  }, [fetchDemoRequestCount])

  const getHeaderClass = () => {
    if (isBlackMode) return 'bg-black/20 backdrop-blur-lg rounded-2xl p-4 mb-6 mx-6 mt-4 border border-gray-800'
    if (isLightMode) return 'bg-white/80 backdrop-blur-lg rounded-2xl p-4 mb-6 mx-6 mt-4 border border-gray-200'
    if (isCloudMode) return 'bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 mx-6 mt-4 border border-white/20'
    return 'bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 mx-6 mt-4 border border-white/20'
  }

  const getTextClass = () => {
    if (isLightMode) return 'text-gray-800'
    return 'text-white'
  }

  const getSearchInputClass = () => {
    if (isLightMode) return 'bg-gray-100 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-400'
    return 'bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/60 focus:outline-none focus:border-purple-400'
  }

  const getSearchIconClass = () => {
    if (isLightMode) return 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4'
    return 'absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4'
  }

  const getIconClass = () => {
    if (isLightMode) return 'p-2 text-gray-600 hover:text-gray-800 transition-colors'
    return 'p-2 text-white/80 hover:text-white transition-colors'
  }

  const getUserNameClass = () => {
    if (isLightMode) return 'text-gray-800 font-medium'
    return 'text-white font-medium'
  }

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'consolidated-users': return 'Search users by name, email, ID, or AI metrics...'
      case 'overview': return 'Search platform data...'
      case 'financial': return 'Search financial data...'
      case 'transactions': return 'Search transactions...'
      case 'llm': return 'Search LLM data...'
      case 'employees': return 'Search employees...'
      default: return 'Search investments...'
    }
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Platform Overview'
      case 'financial': return 'Financial Analytics'
      case 'transactions': return 'Transactions'
      case 'llm': return 'LLM Center'
      case 'llm-data': return 'LLM Data Management'
      case 'database': return 'Database System'
      case 'users': return 'User Management'
      case 'users2': return 'User Management 2'
      case 'consolidated-users': return 'User Management'
      case 'features': return 'Feature Flags'
      case 'notifications': return 'Notifications & Messaging'
      case 'badges': return 'Badges'
      case 'advertisement': return 'Advertisement'
      case 'crm': return 'CRM & Projects'
      case 'content': return 'Content Management'
      case 'subscriptions': return 'Subscriptions'
      case 'modules': return 'Module Management'
      case 'settings': return 'System Settings'
      default: return 'Admin Dashboard'
    }
  }

  const handleNotifications = () => {
    // Navigate to notifications in the admin dashboard
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'notifications' }))
    }, 100)
  }

  return (
    <header className={`${getHeaderClass()} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={onToggleMobileSidebar}
          >
            <Menu className={`w-6 h-6 ${getTextClass()}`} />
          </button>
          <div className="relative hidden sm:block">
            <Search className={getSearchIconClass()} />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              className={getSearchInputClass()}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className={getIconClass()}
            title={`Current: ${theme} - Click to cycle through themes`}
          >
            {isBlackMode ? <Moon className="w-5 h-5" /> : 
             isLightMode ? <Sun className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
          </button>

          {/* Demo Requests Notification */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'demo-requests' }))
            }}
            className={`${getIconClass()} relative`}
            title={`Demo Requests${demoRequestCount > 0 ? ` (${demoRequestCount} pending)` : ''}`}
          >
            <UserPlus className="w-5 h-5" />
            {demoRequestCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {demoRequestCount > 99 ? '99+' : demoRequestCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={handleNotifications}
            className={`${getIconClass()} relative`}
            title={`View Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <span className={`hidden md:inline ${getUserNameClass()}`}>Admin User</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader


