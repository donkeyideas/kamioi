import React, { useState, useEffect, useCallback } from 'react'
import {
  Users, Mail, Phone, MapPin, Calendar, Clock,
  Send, Check, X, Eye, RefreshCw, Filter,
  Copy, Trash2, MessageSquare, AlertCircle, CheckCircle,
  Briefcase, Search
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const DemoRequests = () => {
  const { isLightMode } = useTheme()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [generatedCode, setGeneratedCode] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5111'

  const getToken = () => {
    return localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
  }

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const url = statusFilter
        ? `${apiBaseUrl}/api/admin/demo-requests?status=${statusFilter}`
        : `${apiBaseUrl}/api/admin/demo-requests`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setRequests(data.data || [])
      } else {
        setError(data.error || 'Failed to fetch demo requests')
      }
    } catch (err) {
      setError('Network error fetching demo requests')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, statusFilter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const updateRequestStatus = async (requestId, newStatus, demoCode = '', adminNotes = '') => {
    setActionLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/demo-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          demo_code: demoCode,
          admin_notes: adminNotes
        })
      })

      const data = await response.json()
      if (data.success) {
        fetchRequests()
        setShowDetailModal(false)
      } else {
        setError(data.error || 'Failed to update request')
      }
    } catch (err) {
      setError('Network error updating request')
    } finally {
      setActionLoading(false)
    }
  }

  const sendDemoCode = async (requestId) => {
    setActionLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/demo-requests/${requestId}/send-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedCode(data.data)
        setShowCodeModal(true)
        setCodeCopied(false)
        fetchRequests()
        setShowDetailModal(false)
      } else {
        setError(data.error || 'Failed to generate demo code')
      }
    } catch (err) {
      setError('Network error generating demo code')
    } finally {
      setActionLoading(false)
    }
  }

  const deleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this request?')) return

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/demo-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      const data = await response.json()
      if (data.success) {
        fetchRequests()
        setShowDetailModal(false)
      } else {
        setError(data.error || 'Failed to delete request')
      }
    } catch (err) {
      setError('Network error deleting request')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'yellow', icon: Clock, label: 'Pending' },
      contacted: { color: 'blue', icon: MessageSquare, label: 'Contacted' },
      code_sent: { color: 'green', icon: CheckCircle, label: 'Code Sent' },
      converted: { color: 'purple', icon: Check, label: 'Converted' }
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isLightMode
          ? `bg-${config.color}-100 text-${config.color}-800`
          : `bg-${config.color}-500/20 text-${config.color}-400`
      }`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      req.name?.toLowerCase().includes(query) ||
      req.email?.toLowerCase().includes(query) ||
      req.address?.toLowerCase().includes(query)
    )
  })

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    code_sent: requests.filter(r => r.status === 'code_sent').length,
    converted: requests.filter(r => r.status === 'converted').length
  }

  // Theme-aware classes
  const cardClass = isLightMode
    ? 'bg-white border border-gray-200 shadow-sm'
    : 'bg-white/5 border border-white/10'
  const textClass = isLightMode ? 'text-gray-900' : 'text-white'
  const subtextClass = isLightMode ? 'text-gray-600' : 'text-gray-400'
  const inputClass = isLightMode
    ? 'bg-white border-gray-300 text-gray-900'
    : 'bg-white/5 border-white/10 text-white'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${textClass}`}>Demo Requests</h2>
          <p className={subtextClass}>Manage demo access requests from potential users</p>
        </div>
        <button
          onClick={fetchRequests}
          className={`p-2 rounded-lg transition-colors ${
            isLightMode
              ? 'hover:bg-gray-100 text-gray-600'
              : 'hover:bg-white/10 text-gray-400'
          }`}
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          isLightMode ? 'bg-red-50 text-red-700' : 'bg-red-500/10 text-red-400'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { key: '', label: 'All Requests', count: statusCounts.all, color: 'gray' },
          { key: 'pending', label: 'Pending', count: statusCounts.pending, color: 'yellow' },
          { key: 'contacted', label: 'Contacted', count: statusCounts.contacted, color: 'blue' },
          { key: 'code_sent', label: 'Code Sent', count: statusCounts.code_sent, color: 'green' },
          { key: 'converted', label: 'Converted', count: statusCounts.converted, color: 'purple' }
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => setStatusFilter(stat.key)}
            className={`${cardClass} rounded-xl p-4 text-left transition-all ${
              statusFilter === stat.key ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            <p className={subtextClass + ' text-sm'}>{stat.label}</p>
            <p className={`text-2xl font-bold ${textClass}`}>{stat.count}</p>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${subtextClass}`} />
          <input
            type="text"
            placeholder="Search by name, email, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className={`${cardClass} rounded-xl overflow-hidden`}>
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className={`w-8 h-8 ${subtextClass} animate-spin mx-auto mb-4`} />
            <p className={subtextClass}>Loading demo requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Users className={`w-12 h-12 ${subtextClass} mx-auto mb-4 opacity-50`} />
            <p className={textClass + ' font-medium'}>No demo requests found</p>
            <p className={subtextClass + ' text-sm'}>
              {statusFilter ? 'Try changing the filter' : 'Requests will appear here when users submit the form'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className={isLightMode ? 'bg-gray-50' : 'bg-white/5'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${subtextClass} uppercase tracking-wider`}>User</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${subtextClass} uppercase tracking-wider`}>Contact</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${subtextClass} uppercase tracking-wider`}>Interest</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${subtextClass} uppercase tracking-wider`}>Status</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${subtextClass} uppercase tracking-wider`}>Date</th>
                <th className={`px-4 py-3 text-right text-xs font-medium ${subtextClass} uppercase tracking-wider`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRequests.map(req => (
                <tr key={req.id} className={isLightMode ? 'hover:bg-gray-50' : 'hover:bg-white/5'}>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isLightMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {req.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="ml-3">
                        <p className={`font-medium ${textClass}`}>{req.name}</p>
                        {req.address && (
                          <p className={`text-xs ${subtextClass} flex items-center`}>
                            <MapPin className="w-3 h-3 mr-1" />
                            {req.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className={`text-sm ${textClass}`}>{req.email}</p>
                    {req.phone && (
                      <p className={`text-xs ${subtextClass}`}>{req.phone}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className={`text-sm ${textClass} capitalize`}>{req.interest_type || '-'}</p>
                    <p className={`text-xs ${subtextClass} capitalize`}>{req.experience_level || '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(req.status)}
                    {req.demo_code && (
                      <p className={`text-xs ${subtextClass} mt-1 font-mono`}>{req.demo_code}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className={`text-sm ${subtextClass}`}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </p>
                    <p className={`text-xs ${subtextClass}`}>
                      {new Date(req.created_at).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(req)
                          setShowDetailModal(true)
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isLightMode ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                        }`}
                        title="View Details"
                      >
                        <Eye className={`w-4 h-4 ${subtextClass}`} />
                      </button>
                      {req.status === 'pending' && (
                        <button
                          onClick={() => sendDemoCode(req.id)}
                          className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                          title="Send Demo Code"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteRequest(req.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isLightMode ? 'hover:bg-red-100 text-red-500' : 'hover:bg-red-500/20 text-red-400'
                        }`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl ${
            isLightMode ? 'bg-white' : 'bg-gray-900'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isLightMode ? 'border-gray-200' : 'border-white/10'
            }`}>
              <div>
                <h3 className={`text-lg font-semibold ${textClass}`}>Demo Request Details</h3>
                <p className={subtextClass}>ID: {selectedRequest.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`p-2 rounded-lg ${isLightMode ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>Name</label>
                  <p className={textClass}>{selectedRequest.name}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>Email</label>
                  <p className={textClass}>{selectedRequest.email}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>Phone</label>
                  <p className={textClass}>{selectedRequest.phone || '-'}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>City</label>
                  <p className={textClass}>{selectedRequest.address || '-'}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>Interest Type</label>
                  <p className={`${textClass} capitalize`}>{selectedRequest.interest_type || '-'}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>Experience Level</label>
                  <p className={`${textClass} capitalize`}>{selectedRequest.experience_level || '-'}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>Heard From</label>
                  <p className={`${textClass} capitalize`}>{selectedRequest.heard_from?.replace('_', ' ') || '-'}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              {/* Memo */}
              {selectedRequest.memo && (
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>Message</label>
                  <p className={`${textClass} mt-1 p-3 rounded-lg ${isLightMode ? 'bg-gray-50' : 'bg-white/5'}`}>
                    {selectedRequest.memo}
                  </p>
                </div>
              )}

              {/* Demo Code */}
              {selectedRequest.demo_code && (
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>Demo Code</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className={`px-3 py-2 rounded-lg font-mono ${isLightMode ? 'bg-gray-100' : 'bg-white/10'} ${textClass}`}>
                      {selectedRequest.demo_code}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedRequest.demo_code)
                        alert('Copied to clipboard!')
                      }}
                      className={`p-2 rounded-lg ${isLightMode ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>Submitted</label>
                  <p className={textClass}>{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${subtextClass}`}>Last Updated</label>
                  <p className={textClass}>{new Date(selectedRequest.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className={`flex items-center justify-between p-6 border-t ${
              isLightMode ? 'border-gray-200' : 'border-white/10'
            }`}>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedRequest.status}
                  onChange={(e) => updateRequestStatus(selectedRequest.id, e.target.value)}
                  className={`px-3 py-2 rounded-lg border ${inputClass}`}
                  disabled={actionLoading}
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="code_sent">Code Sent</option>
                  <option value="converted">Converted</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => deleteRequest(selectedRequest.id)}
                  className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                  disabled={actionLoading}
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Delete
                </button>
                {selectedRequest.status !== 'code_sent' && (
                  <button
                    onClick={() => sendDemoCode(selectedRequest.id)}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors"
                    disabled={actionLoading}
                  >
                    <Send className="w-4 h-4 inline mr-2" />
                    {actionLoading ? 'Sending...' : 'Send Demo Code'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Code Generated Modal */}
      {showCodeModal && generatedCode && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCodeModal(false)} />
          <div className={`relative w-full max-w-md ${
            isLightMode
              ? 'bg-white border border-gray-200'
              : 'bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-green-500/30'
          } rounded-2xl shadow-2xl p-6`}>
            <button
              onClick={() => setShowCodeModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-lg ${
                isLightMode ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-white/10 text-gray-400'
              } transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isLightMode ? 'bg-green-100' : 'bg-green-500/20'
              }`}>
                <CheckCircle className={`w-8 h-8 ${isLightMode ? 'text-green-600' : 'text-green-400'}`} />
              </div>
              <h3 className={`text-xl font-bold ${isLightMode ? 'text-gray-800' : 'text-white'}`}>
                Demo Code Generated!
              </h3>
            </div>

            <div className={`p-4 rounded-lg mb-4 ${
              isLightMode ? 'bg-gray-100' : 'bg-white/5'
            }`}>
              <p className={`text-sm mb-2 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Demo Code:
              </p>
              <div className="flex items-center justify-between">
                <code className={`text-lg font-mono font-bold ${
                  isLightMode ? 'text-green-600' : 'text-green-400'
                }`}>
                  {generatedCode.demo_code}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode.demo_code)
                    setCodeCopied(true)
                    setTimeout(() => setCodeCopied(false), 2000)
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    codeCopied
                      ? (isLightMode ? 'bg-green-100 text-green-600' : 'bg-green-500/20 text-green-400')
                      : (isLightMode ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-white/10 text-gray-400')
                  }`}
                  title={codeCopied ? 'Copied!' : 'Copy to clipboard'}
                >
                  {codeCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className={`p-4 rounded-lg mb-6 ${
              isLightMode ? 'bg-blue-50' : 'bg-blue-500/10'
            }`}>
              <p className={`text-sm ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                <strong>Send to:</strong> {generatedCode.name}<br />
                <strong>Email:</strong> {generatedCode.email}
              </p>
            </div>

            <p className={`text-sm text-center mb-4 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Copy this code and send it to the user via email.
            </p>

            <button
              onClick={() => setShowCodeModal(false)}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isLightMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DemoRequests
