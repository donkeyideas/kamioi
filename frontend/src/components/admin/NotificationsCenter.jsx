import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertCircle, AlertTriangle, Reply, Mail, Bell, Send, Plus, Edit, Settings, BarChart3, MessageSquare, Target, Users, Filter, Shield, User, Search, CheckCircle, X, Info } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../hooks/useNotifications'
import messagingService from '../../services/messagingService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query' // 🚀 PERFORMANCE FIX: Import React Query

const NotificationsCenter = ({ user }) => {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const { isLightMode } = useTheme()
  const queryClient = useQueryClient() // 🚀 PERFORMANCE FIX: For cache invalidation
  
  const [activeTab, setActiveTab] = useState('notifications')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [showCreateJourney, setShowCreateJourney] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showComplianceSettings, setShowComplianceSettings] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')
  
  // Messaging state
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [messageFilter, setMessageFilter] = useState('all')
  const [messageSearchTerm, setMessageSearchTerm] = useState('')

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    channel: 'email',
    subject: '',
    content: '',
    audience: 'all_users',
    schedule: 'draft'
  })

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'email',
    subject: '',
    content: '',
    description: ''
  })
  
  // 🚀 PERFORMANCE FIX: Use React Query for messaging data
  const { data: messagesData, isLoading: isMessageLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
        const response = await fetch(`${messagingService.baseURL}/messages/admin/all`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          return {
            messages: data.messages || [],
            stats: data.stats || {
              totalMessages: 0,
              supportRequests: 0,
              unreadSupport: 0,
              channels: []
            }
          }
        }
        return { messages: [], stats: { totalMessages: 0, supportRequests: 0, unreadSupport: 0, channels: [] } }
      } catch (error) {
        console.error('Failed to load admin messages:', error)
        return { messages: [], stats: { totalMessages: 0, supportRequests: 0, unreadSupport: 0, channels: [] } }
      }
    },
    staleTime: 60000, // 1 minute cache
    gcTime: 300000, // 5 minutes cache
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
  
  const messages = messagesData?.messages || []
  const messageStats = messagesData?.stats || {
    totalMessages: 0,
    supportRequests: 0,
    unreadSupport: 0,
    channels: []
  }
  
  // 🚀 PERFORMANCE FIX: Use React Query for campaigns and templates
  const { data: messagingData, isLoading: isLoadingMessagingData, refetch: refetchMessagingData } = useQuery({
    queryKey: ['admin-messaging-data'],
    queryFn: async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
        const response = await fetch(`${apiBaseUrl}/api/admin/messaging/campaigns`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            return {
              campaigns: result.data.campaigns || [],
              templates: result.data.templates || [],
              analytics: result.data.analytics || null
            }
          }
        }
        return { campaigns: [], templates: [], analytics: null }
      } catch (error) {
        console.error('Error fetching messaging data:', error)
        return { campaigns: [], templates: [], analytics: null }
      }
    },
    staleTime: 300000, // 5 minutes cache
    gcTime: 600000, // 10 minutes cache
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
  
  const campaigns = messagingData?.campaigns || []
  const templates = messagingData?.templates || []
  const analytics = messagingData?.analytics || null

  // 🚀 PERFORMANCE FIX: Use React Query for delivery logs
  const { data: deliveryLogsData, isLoading: isLoadingDeliveryLogs, refetch: refetchDeliveryLogs } = useQuery({
    queryKey: ['admin-delivery-logs'],
    queryFn: async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
        const response = await fetch(`${apiBaseUrl}/api/admin/messaging/delivery-logs`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            return {
              logs: result.logs || [],
              stats: result.stats || { totalSent: 0, delivered: 0, bounced: 0, failed: 0 }
            }
          }
        }
        return { logs: [], stats: { totalSent: 0, delivered: 0, bounced: 0, failed: 0 } }
      } catch (error) {
        console.error('Error fetching delivery logs:', error)
        return { logs: [], stats: { totalSent: 0, delivered: 0, bounced: 0, failed: 0 } }
      }
    },
    staleTime: 60000, // 1 minute cache
    gcTime: 300000, // 5 minutes cache
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: activeTab === 'delivery_logs' // Only fetch when tab is active
  })

  const deliveryLogs = deliveryLogsData?.logs || []
  const deliveryStats = deliveryLogsData?.stats || { totalSent: 0, delivered: 0, bounced: 0, failed: 0 }

  // 🚀 PERFORMANCE FIX: Dispatch page load completion event when data is loaded
  useEffect(() => {
    if (!isMessageLoading && !isLoadingMessagingData) {
      const timer = setTimeout(() => {
        console.log('📊 NotificationsCenter - Dispatching admin-page-load-complete for notifications')
        window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
          detail: { pageId: 'notifications' }
        }))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isMessageLoading, isLoadingMessagingData])

  // Debug notifications
  useEffect(() => {
    console.log('NotificationsCenter - Current notifications:', notifications)
    console.log('NotificationsCenter - Unread count:', unreadCount)
  }, [notifications, unreadCount])

  // Notification functions
  const showNotificationModal = (message, type = 'success') => {
    setNotificationMessage(message)
    setNotificationType(type)
    setShowNotification(true)
  }

  const handleNotificationModalClose = () => {
    setShowNotification(false)
    setNotificationMessage('')
  }

  // 🚀 PERFORMANCE FIX: Memoize filtered messages to avoid unnecessary recalculations
  const filteredMessages = useMemo(() => {
    let filtered = messages || []

    // Apply channel filter
    if (messageFilter !== 'all') {
      filtered = filtered.filter(msg => msg.channel === messageFilter)
    }

    // Apply search filter
    if (messageSearchTerm) {
      filtered = filtered.filter(msg => 
        msg.message?.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
        msg.sender?.toLowerCase().includes(messageSearchTerm.toLowerCase())
      )
    }

    return filtered
  }, [messages, messageFilter, messageSearchTerm])

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return

    try {
      const response = await fetch(`${messagingService.baseURL}/messages/admin/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3'}`
        },
        body: JSON.stringify({
          originalMessageId: selectedMessage.id,
          reply: replyText,
          adminName: 'Admin Support'
        })
      })

      if (response.ok) {
        setReplyText('')
        setSelectedMessage(null)
        // 🚀 PERFORMANCE FIX: Invalidate and refetch messages
        queryClient.invalidateQueries(['admin-messages'])
        refetchMessages()
      }
    } catch (error) {
      console.error('Failed to send reply:', error)
    }
  }

  // 🚀 PERFORMANCE FIX: Removed fetchMessagingData - now using React Query

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId)
  }

  const handleNotificationAction = (notification) => {
    if (notification.action) {
      switch (notification.action.type) {
        case 'view_user':
          window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'users' }))
          break
        case 'view_analytics':
          window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'financial' }))
          break
        case 'view_llm':
          window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'llm' }))
          break
        default:
          console.log('Notification action:', notification.action)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-green-500/20 text-green-400'
      case 'scheduled': return 'bg-blue-500/20 text-blue-400'
      case 'draft': return 'bg-gray-500/20 text-gray-400'
      case 'failed': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />
      case 'in-app': return <Bell className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  // Messaging helper functions
  const getTextClass = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode ? 'bg-white/80 backdrop-blur-lg border border-gray-200' : 'bg-white/10 backdrop-blur-lg border border-white/20'

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return getSubtextClass()
    }
  }

  const getMessageChannelIcon = (channel) => {
    switch (channel) {
      case 'support':
        return <MessageSquare className="w-4 h-4 text-purple-500" />
      case 'admin':
        return <Bell className="w-4 h-4 text-red-500" />
      case 'general':
        return <Users className="w-4 h-4 text-blue-500" />
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />
    }
  }

  const createCampaign = async (campaignData) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/messaging/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3'}`
        },
        body: JSON.stringify(campaignData)
      })
      
      if (response.ok) {
        // 🚀 PERFORMANCE FIX: Invalidate and refetch messaging data
        queryClient.invalidateQueries(['admin-messaging-data'])
        refetchMessagingData()
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const createTemplate = async (templateData) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/messaging/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'}`
        },
        body: JSON.stringify(templateData)
      })

      if (response.ok) {
        queryClient.invalidateQueries(['admin-messaging-data'])
        refetchMessagingData()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating template:', error)
      return false
    }
  }

  const handleCreateCampaign = async () => {
    if (!campaignForm.name.trim()) {
      showNotificationModal('Please enter a campaign name', 'error')
      return
    }

    const success = await createCampaign({
      name: campaignForm.name,
      channel: campaignForm.channel,
      subject: campaignForm.subject,
      content: campaignForm.content,
      audience: campaignForm.audience,
      status: campaignForm.schedule === 'now' ? 'sent' : campaignForm.schedule
    })

    setShowCreateCampaign(false)
    setCampaignForm({ name: '', channel: 'email', subject: '', content: '', audience: 'all_users', schedule: 'draft' })
    showNotificationModal('Campaign created successfully!', 'success')
  }

  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim()) {
      showNotificationModal('Please enter a template name', 'error')
      return
    }

    const success = await createTemplate({
      name: templateForm.name,
      type: templateForm.type,
      subject: templateForm.subject,
      content: templateForm.content,
      description: templateForm.description
    })

    setShowCreateTemplate(false)
    setTemplateForm({ name: '', type: 'email', subject: '', content: '', description: '' })
    showNotificationModal('Template created successfully!', 'success')
  }

  const sendCampaign = async (campaignId, recipients) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/messaging/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3'}`
        },
        body: JSON.stringify({
          campaignId,
          recipients
        })
      })
      
      if (response.ok) {
        // 🚀 PERFORMANCE FIX: Invalidate and refetch messaging data
        queryClient.invalidateQueries(['admin-messaging-data'])
        refetchMessagingData()
      }
    } catch (error) {
      console.error('Error sending campaign:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className={getCardClass() + ' rounded-xl p-6'}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${getTextClass()}`}>Notifications & Messaging</h2>
            <p className={getSubtextClass()}>Manage user communications and engagement</p>
          </div>
        </div>

        <div className={`flex space-x-1 rounded-lg p-1 ${isLightMode ? 'bg-gray-100' : 'bg-white/5'}`}>
          {[
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'messaging', label: 'Messaging Center', icon: MessageSquare },
            { id: 'composer', label: 'Composer' },
            { id: 'campaigns', label: 'Campaigns' },
            { id: 'templates', label: 'Templates' },
            { id: 'journeys', label: 'Journeys' },
            { id: 'delivery_logs', label: 'Delivery Logs' },
            { id: 'compliance', label: 'Compliance' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : isLightMode
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`text-xl font-semibold ${getTextClass()}`}>Admin Notifications</h3>
              <p className={getSubtextClass()}>System alerts and important updates</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-sm ${getSubtextClass()}`}>
                {unreadCount} unread notifications
              </div>
            </div>
          </div>

          <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className={`w-12 h-12 ${getSubtextClass()} mx-auto mb-4`} />
                  <p className={getSubtextClass()}>No notifications available</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${getCardClass()} rounded-xl p-4 cursor-pointer transition-all duration-200 ${isLightMode ? 'hover:bg-gray-50' : 'hover:bg-white/5'} ${
                      !notification.read ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => {
                      handleNotificationAction(notification)
                      if (!notification.read) {
                        handleMarkAsRead(notification.id)
                      }
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl">{notification.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-lg font-medium ${getTextClass()}`}>
                            {notification.title || 'System Notification'}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              notification.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              notification.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {notification.priority || 'normal'}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className={`${isLightMode ? 'text-gray-600' : 'text-gray-300'} mt-1`}>
                          {notification.message || 'No message available'}
                        </p>
                        <p className={`text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                        {notification.action && (
                          <div className="mt-2">
                            <span className="text-xs text-blue-400">
                              Click to {notification.action.type.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>
      )}

      {activeTab === 'messaging' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className={`text-2xl font-bold ${getTextClass()} mb-2`}>Admin Messaging Center</h3>
            <p className={getSubtextClass()}>Manage user communications and support requests</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`${getCardClass()} rounded-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${getSubtextClass()}`}>Total Messages</p>
                  <p className={`text-2xl font-bold ${getTextClass()}`}>{messageStats?.totalMessages || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className={`${getCardClass()} rounded-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${getSubtextClass()}`}>Support Requests</p>
                  <p className={`text-2xl font-bold ${getTextClass()}`}>{messageStats?.supportRequests || 0}</p>
                </div>
                <Bell className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className={`${getCardClass()} rounded-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${getSubtextClass()}`}>Unread Support</p>
                  <p className={`text-2xl font-bold text-red-500`}>{messageStats?.unreadSupport || 0}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className={`${getCardClass()} rounded-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${getSubtextClass()}`}>Active Channels</p>
                  <p className={`text-2xl font-bold ${getTextClass()}`}>{messageStats?.channels?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className={`${getCardClass()} rounded-lg p-6`}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={messageFilter}
                  onChange={(e) => setMessageFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg border ${
                    isLightMode 
                      ? 'bg-white border-gray-300 text-gray-800' 
                      : 'bg-gray-800 border-gray-600 text-white'
                  }`}
                >
                  <option value="all">All Channels</option>
                  <option value="support">Support</option>
                  <option value="admin">Admin</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={messageSearchTerm}
                  onChange={(e) => setMessageSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isLightMode 
                      ? 'bg-white border-gray-300 text-gray-800' 
                      : 'bg-gray-800 border-gray-600 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className={`${getCardClass()} rounded-lg`}>
            <div className="p-6 border-b border-white/10">
              <h2 className={`text-xl font-semibold ${getTextClass()}`}>Messages</h2>
            </div>

            <div className="divide-y divide-white/10">
              {isMessageLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className={`${getSubtextClass()} mt-2`}>Loading messages...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className={`w-16 h-16 ${getSubtextClass()} mx-auto mb-4`} />
                  <h3 className={`text-lg font-medium ${getTextClass()} mb-2`}>No messages found</h3>
                  <p className={getSubtextClass()}>No messages match your current filters</p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-6 hover:bg-white/5 cursor-pointer transition-colors ${
                      !message.read ? 'bg-blue-500/5 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {message.sender ? message.sender.charAt(0) : 'A'}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`font-medium ${getTextClass()}`}>{message.sender}</span>
                            {getMessageChannelIcon(message.channel)}
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              message.channel === 'support' ? 'bg-purple-500/20 text-purple-400' :
                              message.channel === 'admin' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {message.channel}
                            </span>
                            {message.priority && (
                              <span className={`text-xs ${getPriorityColor(message.priority)}`}>
                                {message.priority} priority
                              </span>
                            )}
                          </div>
                          
                          <p className={`${getTextClass()} mb-2`}>{message.message}</p>
                          
                          <div className="flex items-center space-x-4 text-xs">
                            <span className={getSubtextClass()}>
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                            {!message.read && (
                              <span className="bg-blue-500 text-white px-2 py-1 rounded-full">
                                Unread
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedMessage(message)
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <Reply className="w-4 h-4 text-blue-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reply Modal */}
          {selectedMessage && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className={`${getCardClass()} rounded-xl w-full max-w-2xl`}>
                <div className="p-6 border-b border-white/10">
                  <h3 className={`text-xl font-semibold ${getTextClass()}`}>Reply to Message</h3>
                  <div className="mt-2">
                    <p className={`text-sm ${getSubtextClass()}`}>From: {selectedMessage.sender}</p>
                    <p className={`text-sm ${getSubtextClass()}`}>Channel: {selectedMessage.channel}</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h4 className={`font-medium ${getTextClass()} mb-2`}>Original Message:</h4>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className={getTextClass()}>{selectedMessage.message}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${getTextClass()} mb-2`}>
                      Your Reply:
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={4}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isLightMode 
                          ? 'bg-white border-gray-300 text-gray-800' 
                          : 'bg-gray-800 border-gray-600 text-white'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isLightMode 
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'composer' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`text-xl font-bold ${getTextClass()}`}>Message Composer</h3>
              <p className={getSubtextClass()}>Create and send notifications to users</p>
            </div>
            <button
              onClick={() => setShowCreateCampaign(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className={getCardClass() + ' rounded-xl p-6'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block ${getSubtextClass()} text-sm mb-2`}>Channel</label>
                <select className={`w-full rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50 ${isLightMode ? 'bg-white border border-gray-300 text-gray-900' : 'bg-white/10 border border-white/20 text-white'}`}>
                  <option value="email">Email</option>
                  <option value="in-app">In-App</option>
                  <option value="push">Push Notification</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div>
                <label className={`block ${getSubtextClass()} text-sm mb-2`}>Audience</label>
                <select className={`w-full rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50 ${isLightMode ? 'bg-white border border-gray-300 text-gray-900' : 'bg-white/10 border border-white/20 text-white'}`}>
                  <option value="all_users">All Users</option>
                  <option value="inactive_users">Inactive Users</option>
                  <option value="premium_users">Premium Users</option>
                  <option value="family_users">Family Users</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={`block ${getSubtextClass()} text-sm mb-2`}>Subject</label>
                <input
                  type="text"
                  placeholder="Enter message subject..."
                  className={`w-full rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:border-blue-500/50 ${isLightMode ? 'bg-white border border-gray-300 text-gray-900' : 'bg-white/10 border border-white/20 text-white'}`}
                />
              </div>
              <div className="md:col-span-2">
                <label className={`block ${getSubtextClass()} text-sm mb-2`}>Message Content</label>
                <textarea
                  rows={6}
                  placeholder="Enter your message content..."
                  className={`w-full rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:border-blue-500/50 ${isLightMode ? 'bg-white border border-gray-300 text-gray-900' : 'bg-white/10 border border-white/20 text-white'}`}
                />
              </div>
              <div className="flex items-end">
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`text-xl font-bold ${getTextClass()}`}>Campaigns</h3>
              <p className={getSubtextClass()}>Manage your notification campaigns</p>
            </div>
            <button
              onClick={() => setShowCreateCampaign(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className={getCardClass() + ' rounded-xl p-6'}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isLightMode ? 'border-gray-200' : 'border-white/10'}`}>
                    <th className={`text-left pb-3 ${getSubtextClass()} font-medium`}>Campaign</th>
                    <th className={`text-center pb-3 ${getSubtextClass()} font-medium`}>Channel</th>
                    <th className={`text-center pb-3 ${getSubtextClass()} font-medium`}>Status</th>
                    <th className={`text-center pb-3 ${getSubtextClass()} font-medium`}>Recipients</th>
                    <th className={`text-center pb-3 ${getSubtextClass()} font-medium`}>Open Rate</th>
                    <th className={`text-center pb-3 ${getSubtextClass()} font-medium`}>Click Rate</th>
                    <th className={`text-center pb-3 ${getSubtextClass()} font-medium`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan="7" className={`py-8 text-center ${getSubtextClass()}`}>
                        No campaigns found. Create your first campaign to get started.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map(campaign => (
                      <tr key={campaign.id} className={`border-b ${isLightMode ? 'border-gray-100' : 'border-white/5'} last:border-b-0 ${isLightMode ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-colors`}>
                        <td className={`py-3 px-4 ${getTextClass()} font-medium`}>{campaign.name}</td>
                        <td className="py-3 px-4 text-center">
                          <div className={`flex items-center justify-center ${getSubtextClass()}`}>
                            {getChannelIcon(campaign.channel)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            <span className="capitalize">{campaign.status}</span>
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-center ${getTextClass()}`}>{campaign.recipients ? campaign.recipients.toLocaleString() : '0'}</td>
                        <td className={`py-3 px-4 text-center ${getTextClass()}`}>{campaign.openRate || 0}%</td>
                        <td className={`py-3 px-4 text-center ${getTextClass()}`}>{campaign.clickRate || 0}%</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() => showNotificationModal(`Campaign ${campaign.name} sent successfully!`, 'success')}
                              className="text-blue-400 hover:text-blue-300 p-1"
                              title="Send Campaign"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => showNotificationModal(`Viewing analytics for ${campaign.name}`, 'info')}
                              className="text-green-400 hover:text-green-300 p-1"
                              title="View Analytics"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => showNotificationModal(`Editing campaign ${campaign.name}`, 'info')}
                              className="text-yellow-400 hover:text-yellow-300 p-1"
                              title="Edit Campaign"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`text-xl font-bold ${getTextClass()}`}>Email Templates</h3>
              <p className={getSubtextClass()}>Manage reusable email and notification templates</p>
            </div>
            <button
              onClick={() => setShowCreateTemplate(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(templates || []).length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className={`${getSubtextClass()} text-lg mb-2`}>No templates found</div>
                <p className={isLightMode ? 'text-gray-500' : 'text-gray-500'}>Create your first email template to get started.</p>
              </div>
            ) : (
              (templates || []).map(template => (
                <div key={template.id} className={getCardClass() + ' rounded-xl p-6'}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className={`${getTextClass()} font-medium`}>{template.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      template.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {template.status}
                    </span>
                  </div>
                  <p className={`${getSubtextClass()} text-sm mb-4`}>{template.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className={getSubtextClass()}>Used {template.usageCount} times</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => showNotificationModal(`Editing template ${template.name}`, 'info')}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => showNotificationModal(`Previewing template ${template.name}`, 'info')}
                        className="text-green-400 hover:text-green-300"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'journeys' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`text-xl font-bold ${getTextClass()}`}>Customer Journeys</h3>
              <p className={getSubtextClass()}>Automated workflows and user engagement sequences</p>
            </div>
            <button
              onClick={() => setShowCreateJourney(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Journey</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(templates || []).length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className={`${getSubtextClass()} text-lg mb-2`}>No customer journeys found</div>
                <p className={isLightMode ? 'text-gray-500' : 'text-gray-500'}>Create your first customer journey to get started.</p>
              </div>
            ) : (
              (templates || []).map(journey => (
                <div key={journey.id} className={getCardClass() + ' rounded-xl p-6'}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className={`${getTextClass()} font-medium`}>{journey.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      journey.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {journey.status}
                    </span>
                  </div>
                  <p className={`${getSubtextClass()} text-sm mb-4`}>{journey.description}</p>
                  <div className="space-y-2 mb-4">
                    {journey.steps?.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          step.status === 'completed' ? 'bg-green-400' :
                          step.status === 'in-progress' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`}></div>
                        <span className={`${isLightMode ? 'text-gray-600' : 'text-gray-300'} text-sm`}>{step.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={getSubtextClass()}>{journey.userCount} users enrolled</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => showNotificationModal(`Editing journey ${journey.name}`, 'info')}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => showNotificationModal(`Viewing analytics for ${journey.name}`, 'info')}
                        className="text-green-400 hover:text-green-300"
                      >
                        Analytics
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'delivery_logs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`text-xl font-bold ${getTextClass()}`}>Delivery Logs</h3>
              <p className={getSubtextClass()}>Track message delivery status and performance</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => showNotificationModal('Exporting delivery logs...', 'info')}
                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 transition-all"
              >
                Export Logs
              </button>
              <button
                onClick={() => {
                  refetchDeliveryLogs()
                  showNotificationModal('Delivery logs refreshed', 'success')
                }}
                className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 transition-all"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={getCardClass() + ' rounded-xl p-6'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Total Sent</p>
                  <p className={`text-2xl font-bold ${getTextClass()}`}>{deliveryStats.totalSent}</p>
                </div>
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className={getCardClass() + ' rounded-xl p-6'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Delivered</p>
                  <p className="text-2xl font-bold text-green-400">{deliveryStats.delivered}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className={getCardClass() + ' rounded-xl p-6'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Failed</p>
                  <p className="text-2xl font-bold text-red-400">{deliveryStats.failed}</p>
                </div>
                <X className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className={getCardClass() + ' rounded-xl p-6'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${getSubtextClass()} text-sm`}>Bounced</p>
                  <p className="text-2xl font-bold text-yellow-400">{deliveryStats.bounced}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm">Message ID</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm">Recipient</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm">Subject</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm">Status</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm">Sent At</th>
                    <th className="px-4 py-3 text-left text-gray-400 text-sm">Delivered At</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingDeliveryLogs ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2">Loading delivery logs...</p>
                      </td>
                    </tr>
                  ) : deliveryLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                        No delivery logs found. Message delivery logs will appear here when messages are sent.
                      </td>
                    </tr>
                  ) : (
                    deliveryLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-sm">{log.messageId}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white">{log.recipient}</p>
                            <p className="text-gray-400 text-xs">{log.recipientEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white">{log.subject}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                            log.status === 'bounced' || log.bounced ? 'bg-yellow-500/20 text-yellow-400' :
                            log.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {log.bounced ? 'bounced' : log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`text-xl font-bold ${getTextClass()}`}>Compliance Management</h3>
              <p className={getSubtextClass()}>Manage email compliance, opt-outs, and regulatory requirements</p>
            </div>
            <button
              onClick={() => setShowComplianceSettings(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={getCardClass() + ' rounded-xl p-6'}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`${getTextClass()} font-medium`}>Opt-out Management</h4>
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Total Opt-outs</span>
                  <span className={getTextClass()}>0</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>This Month</span>
                  <span className={getTextClass()}>0</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Compliance Rate</span>
                  <span className="text-green-400">0%</span>
                </div>
              </div>
            </div>

            <div className={getCardClass() + ' rounded-xl p-6'}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`${getTextClass()} font-medium`}>GDPR Compliance</h4>
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Data Requests</span>
                  <span className={getTextClass()}>0</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Deletion Requests</span>
                  <span className={getTextClass()}>0</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Response Time</span>
                  <span className="text-green-400">0 days</span>
                </div>
              </div>
            </div>

            <div className={getCardClass() + ' rounded-xl p-6'}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`${getTextClass()} font-medium`}>CAN-SPAM Act</h4>
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Unsubscribe Rate</span>
                  <span className={getTextClass()}>0%</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Complaints</span>
                  <span className={getTextClass()}>0</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtextClass()}>Compliance Score</span>
                  <span className="text-green-400">A+</span>
                </div>
              </div>
            </div>
          </div>

          <div className={getCardClass() + ' rounded-xl p-6'}>
            <h4 className={`${getTextClass()} font-medium mb-4`}>Recent Compliance Events</h4>
            <div className="space-y-3">
              <div className="text-center py-8">
                <div className={`${getSubtextClass()} text-lg mb-2`}>No compliance events found</div>
                <p className={isLightMode ? 'text-gray-500' : 'text-gray-500'}>Compliance events will appear here when they occur.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Create New Campaign</h3>
              <button
                onClick={() => setShowCreateCampaign(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Welcome Campaign"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Channel</label>
                  <select
                    value={campaignForm.channel}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, channel: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="in-app">In-App</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <input
                  type="text"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Campaign subject line"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message Content</label>
                <textarea
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your campaign message..."
                  rows="4"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                  <select
                    value={campaignForm.audience}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, audience: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all_users">All Users</option>
                    <option value="premium_users">Premium Users</option>
                    <option value="new_users">New Users</option>
                    <option value="inactive_users">Inactive Users</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Schedule</label>
                  <select
                    value={campaignForm.schedule}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, schedule: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="now">Send Now</option>
                    <option value="scheduled">Schedule for Later</option>
                    <option value="draft">Save as Draft</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateCampaign(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Create New Template</h3>
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Welcome Email"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Template Type</label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="in-app">In-App Notification</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Template subject line"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Template Content</label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your template content..."
                  rows="6"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this template is used for..."
                  rows="2"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Journey Modal */}
      {showCreateJourney && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Create New Customer Journey</h3>
              <button 
                onClick={() => setShowCreateJourney(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Journey Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Onboarding Sequence"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trigger Event</label>
                  <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="signup">User Signup</option>
                    <option value="first_investment">First Investment</option>
                    <option value="inactive">User Inactivity</option>
                    <option value="milestone">Milestone Reached</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea 
                  placeholder="Describe what this journey accomplishes..."
                  rows="2"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Users</option>
                  <option value="new">New Users</option>
                  <option value="premium">Premium Users</option>
                  <option value="free">Free Users</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Journey Steps</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Step 1: Welcome Email"
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="text-red-400 hover:text-red-300">✕</button>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">+ Add Step</button>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowCreateJourney(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  showNotificationModal('Customer journey created successfully!', 'success')
                  setShowCreateJourney(false)
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Create Journey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Settings Modal */}
      {showComplianceSettings && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Compliance Settings</h3>
              <button 
                onClick={() => setShowComplianceSettings(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-white font-medium mb-4">Email Compliance</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Require double opt-in</span>
                    <input type="checkbox" className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Include unsubscribe link</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Track email opens</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-4">GDPR Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Enable data export</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Enable data deletion</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Data retention period (days)</span>
                    <input type="number" defaultValue="365" className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-4">CAN-SPAM Compliance</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Include physical address</span>
                    <input type="checkbox" className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Honor unsubscribe requests</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowComplianceSettings(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  showNotificationModal('Compliance settings updated successfully!', 'success')
                  setShowComplianceSettings(false)
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                notificationType === 'success' ? 'bg-green-500/20' : 
                notificationType === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'
              }`}>
                {notificationType === 'success' ? (
                  <span className="text-green-400 text-2xl">✓</span>
                ) : notificationType === 'error' ? (
                  <span className="text-red-400 text-2xl">✕</span>
                ) : (
                  <span className="text-blue-400 text-2xl">ℹ</span>
                )}
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                {notificationType === 'success' ? 'Success!' : 
                 notificationType === 'error' ? 'Error!' : 'Info'}
              </h3>
              <p className="text-white/70 mb-6">{notificationMessage}</p>
              <div className="flex space-x-3">
                <button 
                  onClick={handleNotificationModalClose}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
                >
                  OK
                </button>
                <button 
                  onClick={() => {
                    handleNotificationModalClose()
                    setActiveTab('notifications')
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all"
                >
                  View Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsCenter
