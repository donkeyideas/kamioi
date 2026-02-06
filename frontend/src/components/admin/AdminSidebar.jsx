import React, { useState, useEffect } from 'react'
import { LayoutDashboard, DollarSign, FileText, Brain, Users, Settings, Bell, Award, Megaphone, Globe, CreditCard, Zap, MessageSquare, Database, LogOut, Home, Building2, UserCog, TrendingUp, Cog, GripVertical, BookOpen, Activity, User, Bug, UserPlus, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import prefetchRegistry from '../../services/prefetchRegistry'

const AdminSidebar = ({ activeTab, setActiveTab, user, onLogout, isMobileSidebarOpen, onCloseMobileSidebar }) => {
  const { isBlackMode, isLightMode, isCloudMode } = useTheme()
  
  // Default order according to user specification
  const defaultMenuItems = [
    { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'demo-requests', label: 'Demo Requests', icon: UserPlus },
    { id: 'investments', label: 'Investment Summary', icon: TrendingUp },
    { id: 'investment-processing', label: 'Investment Processing', icon: Cog },
    { id: 'llm', label: 'LLM Center', icon: Brain },
    { id: 'ml-dashboard', label: 'ML Dashboard', icon: Zap },
    { id: 'llm-data', label: 'LLM Data Management', icon: Database },
    { id: 'database', label: 'Database Management', icon: Database },
    { id: 'consolidated-users', label: 'User Management', icon: Users },
    { id: 'financial', label: 'Financial Analytics', icon: DollarSign },
    { id: 'notifications', label: 'Notifications & Messaging', icon: Bell },
    { id: 'content', label: 'Content Management', icon: Globe },
    { id: 'advertisement', label: 'Advertisement', icon: Megaphone },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'employees', label: 'Employee Management', icon: UserCog },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'sop', label: 'Standard Operating Procedures', icon: BookOpen },
    { id: 'loading-report', label: 'Loading Report', icon: Activity },
    { id: 'api-tracking', label: 'API Tracking', icon: Activity },
    { id: 'error-tracking', label: 'Error Tracking', icon: Bug }
  ]

  // Load saved order from localStorage or use default
  const [menuItems, setMenuItems] = useState(() => {
    const saved = localStorage.getItem('adminSidebarOrder')
    if (saved) {
      try {
        const savedOrder = JSON.parse(saved)
        // Map saved items back to full items with icons from defaultMenuItems
        // IMPORTANT: Always use icon from defaultMenuItems, never from saved data
        const restoredItems = savedOrder
          .map(savedItem => {
            // Find matching item in defaultMenuItems to get the correct icon
            const defaultItem = defaultMenuItems.find(item => item.id === savedItem.id)
            if (defaultItem && typeof defaultItem.icon === 'function') {
              // Return a fresh copy with icon from defaultMenuItems
              return {
                id: defaultItem.id,
                label: defaultItem.label || savedItem.label,
                icon: defaultItem.icon // Always use the function from defaultMenuItems
              }
            }
            return null // Skip invalid items
          })
          .filter(item => item !== null && item && typeof item.icon === 'function')
        
        // Add any new default items that weren't in saved order
        const savedIds = restoredItems.map(item => item.id)
        const newItems = defaultMenuItems.filter(item => !savedIds.includes(item.id))
        const merged = [...restoredItems, ...newItems]
        
        // Validate all items have valid icons
        const allValid = merged.every(item => item && typeof item.icon === 'function')
        if (!allValid) {
          console.warn('Invalid icons detected in menuItems, clearing localStorage and using defaults')
          localStorage.removeItem('adminSidebarOrder')
          return defaultMenuItems
        }
        
        return merged
      } catch (e) {
        console.error('Error loading sidebar order:', e)
        // Clear corrupted localStorage data
        localStorage.removeItem('adminSidebarOrder')
        return defaultMenuItems
      }
    }
    return defaultMenuItems
  })

  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  // Validate and fix menuItems on mount - clear localStorage if corrupted
  useEffect(() => {
    // Ensure menuItems is not empty
    if (!menuItems || menuItems.length === 0) {
      console.warn('⚠️ menuItems is empty, resetting to defaults')
      localStorage.removeItem('adminSidebarOrder')
      setMenuItems(defaultMenuItems)
      return
    }
    
    // Immediately clear any corrupted localStorage data
    const saved = localStorage.getItem('adminSidebarOrder')
    if (saved) {
      try {
        const savedOrder = JSON.parse(saved)
        // Check if saved data has icon properties (which it shouldn't)
        const hasIconsInStorage = savedOrder.some(item => item && Object.prototype.hasOwnProperty.call(item, 'icon'))
        if (hasIconsInStorage) {
          console.warn('⚠️ Corrupted localStorage detected (contains icons), clearing...')
          localStorage.removeItem('adminSidebarOrder')
          setMenuItems(defaultMenuItems)
          return
        }
      } catch (e) {
        console.warn('⚠️ Corrupted localStorage detected, clearing...', e)
        localStorage.removeItem('adminSidebarOrder')
        setMenuItems(defaultMenuItems)
        return
      }
    }
    
    // Validate current menuItems - check if icons are functions
    const hasInvalidIcons = menuItems.some(item => {
      if (!item) return true
      if (!item.icon) return true
      // Lucide-react icons should be functions
      const isFunction = typeof item.icon === 'function'
      return !isFunction
    })
    
    if (hasInvalidIcons) {
      console.warn('⚠️ Invalid icons detected in menuItems, resetting to defaults')
      localStorage.removeItem('adminSidebarOrder')
      setMenuItems(defaultMenuItems)
    }
  }, []) // Run only once on mount

  // Save order to localStorage whenever it changes (only save id and label, not icon)
  useEffect(() => {
    // Only save if all items have valid icons
    const allValid = menuItems.every(item => item && item.icon && typeof item.icon === 'function')
    if (allValid) {
      const itemsToSave = menuItems.map(({ id, label }) => ({ id, label }))
      localStorage.setItem('adminSidebarOrder', JSON.stringify(itemsToSave))
    }
  }, [menuItems])

  const handleDragStart = (e, index) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null)
      setDragOverIndex(null)
      return
    }

    const newMenuItems = [...menuItems]
    const [removed] = newMenuItems.splice(draggedItem, 1)
    newMenuItems.splice(dropIndex, 0, removed)
    
    setMenuItems(newMenuItems)
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }

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
          <Settings className={`w-8 h-8 ${getTextClass()}`} />
          <h1 className={`text-xl font-bold ${getTextClass()}`}>Kamioi Admin</h1>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto overflow-x-hidden pr-2">
          {menuItems.map((item, index) => {
          const IconComponent = item?.icon;
          const isActive = activeTab === item.id;
          const buttonClass = isActive ? getActiveButtonClass() : getInactiveButtonClass();
          const isDragging = draggedItem === index;
          const isDragOver = dragOverIndex === index;
          
          // Determine if icon is valid (lucide-react icons are functions)
          const isValidIcon = IconComponent && typeof IconComponent === 'function'
          
          // Use Settings as fallback icon if invalid
          const SafeIcon = isValidIcon ? IconComponent : Settings;
          
          return (
            <div
              key={item.id || `menu-item-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'mt-2 border-t-2 border-blue-500' : ''}`}
            >
              <button
                onClick={() => {
                  setActiveTab(item.id)
                  if (onCloseMobileSidebar) onCloseMobileSidebar()
                }}
                onMouseEnter={() => {
                  // Prefetch data when user hovers over menu item
                  // Check if we have a registered fetch function for this page
                  if (prefetchRegistry && prefetchRegistry.registry && prefetchRegistry.registry.has(item.id)) {
                    setTimeout(() => {
                      prefetchRegistry.prefetch(item.id).catch(err => {
                        // Silently handle prefetch errors
                        console.debug(`Prefetch failed for ${item.id}:`, err)
                      })
                    }, 200) // 200ms delay to avoid prefetch spam
                  }
                }}
                className={`${buttonClass} relative group`}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <GripVertical
                  className={`hidden md:block w-4 h-4 ${isActive ? 'text-white/60' : 'text-white/40'} group-hover:text-white/80 transition-opacity`}
                  style={{ cursor: 'grab' }}
                />
                <SafeIcon className="w-5 h-5" />
                <span>{item.label || 'Unknown'}</span>
              </button>
            </div>
          );
        })}
      </nav>

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

export default AdminSidebar


