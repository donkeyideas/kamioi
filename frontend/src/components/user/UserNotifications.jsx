import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../hooks/useNotifications'
import { fixNotifications } from '../../utils/fixNotifications'

const UserNotifications = () => {
  const { notifications, markAsRead, clearNotification, markAllAsRead } = useNotifications()
  const { isLightMode } = useTheme()
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'

  // Fix corrupted notifications on component mount
  useEffect(() => {
    // Check if notifications are corrupted (empty titles/messages)
    const hasCorruptedNotifications = notifications.some(n => 
      !n.title || !n.message || n.title.trim() === '' || n.message.trim() === ''
    )
    
    if (hasCorruptedNotifications || notifications.length === 0) {
      console.log('Fixing corrupted notifications...')
      fixNotifications()
      // Don't reload the page - just let the notifications update naturally
    }
  }, [notifications])

  const getNotificationIcon = (notification) => {
    // Use custom icon if provided, otherwise use type-based icon
    if (notification.icon) {
      return <span className="text-lg">{notification.icon}</span>
    }
    
    switch (notification.type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'info': return <Info className="w-5 h-5 text-blue-400" />
      default: return <Bell className="w-5 h-5 text-gray-400" />
    }
  }

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId)
  }

  const handleDeleteNotification = (notificationId) => {
    clearNotification(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.read
      case 'read': return notification.read
      default: return true
    }
  })

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const minutes = Math.floor((now - date) / (1000 * 60))
      return `${minutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      const days = Math.floor(diffInHours / 24)
      return `${days}d ago`
    }
  }

  const getTextClass = () => {
    if (isLightMode) return 'text-gray-800'
    return 'text-white'
  }

  const getSubtextClass = () => {
    if (isLightMode) return 'text-gray-600'
    return 'text-gray-400'
  }

  const getCardClass = () => {
    if (isLightMode) return 'bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 text-center'
    return 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center'
  }

  const getNotificationCardClass = (isUnread) => {
    const baseClass = isLightMode 
      ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-4 border border-gray-200'
      : 'bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20'
    
    return isUnread ? `${baseClass} border-l-4 border-blue-500` : baseClass
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${getTextClass()}`}>Notifications</h1>
          <p className={`${getSubtextClass()} mt-1`}>Stay updated on your investment activity</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Filter Dropdown */}
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className={`${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
          
          {/* Mark All as Read */}
          {notifications.some(n => !n.read) && (
            <button 
              onClick={handleMarkAllAsRead}
              className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className={getCardClass()}>
            <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className={`${getTextClass()} text-lg font-medium mb-2`}>
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'read' ? 'No read notifications' : 
               'No notifications yet'}
            </h3>
            <p className={`${getSubtextClass()} text-sm`}>
              {filter === 'all' ? 
                "You'll receive notifications about your investments, goals, and AI recommendations here" :
                `No ${filter} notifications found`}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div key={notification.id} className={getNotificationCardClass(!notification.read)}>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`${getTextClass()} font-semibold`}>{notification.title}</h3>
                      <p className={`${getSubtextClass()} mt-1 text-sm`}>{notification.message}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <p className={`${getSubtextClass()} text-xs`}>{formatTime(notification.timestamp)}</p>
                        {notification.priority === 'high' && (
                          <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className={`${getSubtextClass()} hover:text-blue-400 transition-colors`}
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className={`${getSubtextClass()} hover:text-red-400 transition-colors`}
                        title="Delete notification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default UserNotifications


