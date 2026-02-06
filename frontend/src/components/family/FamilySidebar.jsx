import React from 'react'
import {
  LayoutDashboard,
  Users,
  PieChart,
  History,
  Target,
  Brain,
  Bell,
  Settings,
  LogOut,
  MessageSquare,
  X
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useData } from '../../context/DataContext'

const FamilySidebar = ({ activeTab, setActiveTab, user, onLogout, onOpenCommunication, isMobileSidebarOpen, onCloseMobileSidebar }) => {
  const { isBlackMode, isLightMode } = useTheme()
  const { portfolioValue, totalRoundUps } = useData()
  
  const menuItems = [
    { id: 'dashboard', label: 'Family Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Family Transactions', icon: History },
    { id: 'members', label: 'Family Members', icon: Users },
    { id: 'portfolio', label: 'Shared Portfolio', icon: PieChart },
    { id: 'goals', label: 'Family Goals', icon: Target },
    { id: 'ai', label: 'AI Insights', icon: Brain },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Family Settings', icon: Settings }
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

  const getSubtextClass = () => {
    if (isLightMode) return 'text-gray-600'
    return 'text-gray-400'
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
    if (isLightMode) return 'flex items-center space-x-3 mb-8 p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-gray-300/50 shadow-lg'
    return 'flex items-center space-x-3 mb-8 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg'
  }

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
          <Users className={`w-8 h-8 ${getTextClass()}`} />
          <h1 className={`text-xl font-bold ${getTextClass()}`}>Kamioi Family</h1>
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

        {/* Quick Stats */}
        <div className="flex-shrink-0 mb-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className={`font-semibold ${getTextClass()} mb-3`}>Family Quick Stats</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`text-sm ${getSubtextClass()}`}>Family Portfolio</span>
              <span className={`text-sm font-semibold ${getTextClass()}`}>
                ${portfolioValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${getSubtextClass()}`}>Total Round-ups</span>
              <span className={`text-sm font-semibold ${getTextClass()}`}>
                ${totalRoundUps.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

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
      </aside>
    </>
  )
}

export default FamilySidebar
